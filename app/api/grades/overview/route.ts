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
        const gradeId = searchParams.get('grade_id');
        const period = searchParams.get('period') || '30'; // Default to 30 days

        if (!gradeId) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Grade ID is required'
            }, { status: 400 });
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Get grade details
        const { data: grade, error: gradeError } = await supabase
            .from('grade')
            .select('*')
            .eq('id', gradeId)
            .single();

        if (gradeError || !grade) {
            console.error('Error fetching grade:', gradeError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Grade not found'
            }, { status: 404 });
        }

        // Get subjects for this grade
        const { data: subjects, error: subjectsError } = await supabase
            .from('subject')
            .select('*')
            .eq('grade_id', gradeId)
            .eq('active', true);

        if (subjectsError) {
            console.error('Error fetching subjects:', subjectsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching subjects'
            }, { status: 500 });
        }

        // Get questions for these subjects
        const { data: questions, error: questionsError } = await supabase
            .from('question')
            .select('id, subject_id, status, active')
            .in('subject_id', subjects.map(s => s.id));

        if (questionsError) {
            console.error('Error fetching questions:', questionsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching questions'
            }, { status: 500 });
        }

        // Get learners in this grade
        const { data: learners, error: learnersError } = await supabase
            .from('learner')
            .select('id')
            .eq('grade_id', gradeId);

        if (learnersError) {
            console.error('Error fetching learners:', learnersError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching learners'
            }, { status: 500 });
        }

        // Get results for these learners within date range
        const { data: results, error: resultsError } = await supabase
            .from('result')
            .select('question_id, outcome, created')
            .in('learner_id', learners.map(l => l.id))
            .gte('created', startDate.toISOString())
            .lte('created', endDate.toISOString());

        if (resultsError) {
            console.error('Error fetching results:', resultsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching results'
            }, { status: 500 });
        }

        // Process subject statistics
        const subjectStats = subjects.reduce((acc: { [key: string]: any }, subject) => {
            const subjectQuestions = questions.filter(q => q.subject_id === subject.id);
            const activeQuestions = subjectQuestions.filter(q => q.active && q.status === 'approved').length;
            const subjectResults = results.filter(r =>
                subjectQuestions.some(q => q.id === r.question_id)
            );

            acc[subject.id] = {
                id: subject.id,
                name: subject.name,
                total_questions: subjectQuestions.length,
                active_questions: activeQuestions,
                total_attempts: subjectResults.length,
                correct_attempts: subjectResults.filter(r => r.outcome === 'correct').length
            };
            return acc;
        }, {});

        // Calculate daily statistics
        const dailyStats: { [key: string]: { total: number, correct: number } } = {};
        results.forEach(result => {
            const date = new Date(result.created).toISOString().split('T')[0];
            if (!dailyStats[date]) {
                dailyStats[date] = { total: 0, correct: 0 };
            }
            dailyStats[date].total++;
            if (result.outcome === 'correct') {
                dailyStats[date].correct++;
            }
        });

        // Format daily stats
        const formattedDailyStats = Object.entries(dailyStats)
            .map(([date, stats]) => ({
                date,
                total_attempts: stats.total,
                correct_attempts: stats.correct,
                accuracy: Math.round((stats.correct / stats.total) * 100)
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Calculate overall statistics
        const totalQuestions = questions.length;
        const activeQuestions = questions.filter(q => q.active && q.status === 'approved').length;
        const totalAttempts = results.length;
        const correctAttempts = results.filter(r => r.outcome === 'correct').length;

        return NextResponse.json({
            status: 'OK',
            overview: {
                grade: {
                    id: grade.id,
                    number: grade.number,
                    name: grade.name
                },
                stats: {
                    total_questions: totalQuestions,
                    active_questions: activeQuestions,
                    total_learners: learners.length,
                    total_subjects: subjects.length,
                    total_attempts: totalAttempts,
                    correct_attempts: correctAttempts,
                    accuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0
                },
                subjects: Object.values(subjectStats).map(stats => ({
                    ...stats,
                    accuracy: stats.total_attempts > 0
                        ? Math.round((stats.correct_attempts / stats.total_attempts) * 100)
                        : 0
                })),
                daily_activity: formattedDailyStats
            }
        });

    } catch (error) {
        console.error('Error in getGradeOverview:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting grade overview',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 