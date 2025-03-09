import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    try {
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');
        const period = searchParams.get('period') || '7'; // Default to 7 days
        const subjectId = searchParams.get('subject_id');
        const gradeId = searchParams.get('grade_id');
        const limit = parseInt(searchParams.get('limit') || '10');

        if (!uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'UID is required'
            }, { status: 400 });
        }

        // Get the learner
        const { data: learner, error: learnerError } = await supabase
            .from('learner')
            .select('id, grade_id')
            .eq('uid', uid)
            .single();

        if (learnerError || !learner) {
            console.error('Error fetching learner:', learnerError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner not found'
            }, { status: 404 });
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Build base query for results
        let query = supabase
            .from('result')
            .select(`
                learner:learner_id(
                    id,
                    name,
                    grade:grade_id(number)
                ),
                question:question_id(
                    subject:subject_id(id, name)
                ),
                outcome,
                created
            `)
            .gte('created', startDate.toISOString())
            .lte('created', endDate.toISOString());

        // Add filters
        if (subjectId) {
            query = query.eq('question.subject.id', subjectId);
        }

        if (gradeId) {
            query = query.eq('learner.grade_id', gradeId);
        }

        // Get results
        const { data: results, error: resultsError } = await query;

        if (resultsError) {
            console.error('Error fetching results:', resultsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching results'
            }, { status: 500 });
        }

        // Define interfaces for learner statistics
        interface LearnerStats {
            id: number | string;
            name: string;
            grade: number;
            total_questions: number;
            correct_answers: number;
            subjects: Set<string>;
            last_active: Date | null;
        }

        // Interface for leaderboard entries (after processing)
        interface LeaderboardEntry {
            id: number | string;
            name: string;
            grade: number;
            total_questions: number;
            correct_answers: number;
            accuracy: number;
            unique_subjects: number;
            subjects: string[];
            last_active: string | null;
            score: number;
        }

        // Process results to calculate leaderboard
        const learnerStats: { [key: string]: LearnerStats } = {};

        results.forEach(result => {
            const learnerId = result.learner.id;
            if (!learnerStats[learnerId]) {
                learnerStats[learnerId] = {
                    id: learnerId,
                    name: result.learner.name,
                    grade: result.learner.grade.number,
                    total_questions: 0,
                    correct_answers: 0,
                    subjects: new Set(),
                    last_active: null
                };
            }

            const stats = learnerStats[learnerId];
            stats.total_questions++;
            if (result.outcome === 'correct') {
                stats.correct_answers++;
            }
            stats.subjects.add(result.question.subject.name.split(' ')[0]);
            stats.last_active = new Date(result.created);
        });

        // Convert to array and calculate scores
        const leaderboard = Object.values(learnerStats)
            .map((stats: LearnerStats): LeaderboardEntry => ({
                id: stats.id,
                name: stats.name,
                grade: stats.grade,
                total_questions: stats.total_questions,
                correct_answers: stats.correct_answers,
                accuracy: Math.round((stats.correct_answers / stats.total_questions) * 100),
                unique_subjects: stats.subjects.size,
                subjects: Array.from(stats.subjects),
                last_active: stats.last_active ? stats.last_active.toISOString() : null,
                score: Math.round(
                    (stats.correct_answers / stats.total_questions) * 100 +
                    (stats.subjects.size * 10) +
                    (stats.total_questions * 0.5)
                )
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        // Find user's rank
        const userStats = leaderboard.find(l => l.id === learner.id);
        const userRank = userStats ? leaderboard.indexOf(userStats) + 1 : null;

        return NextResponse.json({
            status: 'OK',
            leaderboard: {
                period: parseInt(period),
                user_rank: userRank,
                user_score: userStats?.score || 0,
                rankings: leaderboard
            }
        });

    } catch (error) {
        console.error('Error in getLeaderboard:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting leaderboard',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 