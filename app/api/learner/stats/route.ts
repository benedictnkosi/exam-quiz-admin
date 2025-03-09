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

        // Get results within date range
        const { data: results, error: resultsError } = await supabase
            .from('result')
            .select(`
                *,
                question:question_id(
                    subject:subject_id(name)
                )
            `)
            .eq('learner_id', learner.id)
            .gte('created', startDate.toISOString())
            .lte('created', endDate.toISOString());

        if (resultsError) {
            console.error('Error fetching results:', resultsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching results'
            }, { status: 500 });
        }

        // Process results
        const subjectStats: { [key: string]: { total: number, correct: number } } = {};
        const dailyStats: { [key: string]: { total: number, correct: number } } = {};
        let totalQuestions = 0;
        let totalCorrect = 0;

        results.forEach(result => {
            const subjectName = result.question.subject.name.split(' ')[0]; // Get base subject name
            const date = new Date(result.created).toISOString().split('T')[0];

            // Update subject stats
            if (!subjectStats[subjectName]) {
                subjectStats[subjectName] = { total: 0, correct: 0 };
            }
            subjectStats[subjectName].total++;
            if (result.outcome === 'correct') {
                subjectStats[subjectName].correct++;
            }

            // Update daily stats
            if (!dailyStats[date]) {
                dailyStats[date] = { total: 0, correct: 0 };
            }
            dailyStats[date].total++;
            if (result.outcome === 'correct') {
                dailyStats[date].correct++;
            }

            // Update totals
            totalQuestions++;
            if (result.outcome === 'correct') {
                totalCorrect++;
            }
        });

        // Calculate percentages and format stats
        const formattedSubjectStats = Object.entries(subjectStats).map(([subject, stats]) => ({
            subject,
            total_questions: stats.total,
            correct_answers: stats.correct,
            percentage: Math.round((stats.correct / stats.total) * 100)
        }));

        const formattedDailyStats = Object.entries(dailyStats).map(([date, stats]) => ({
            date,
            total_questions: stats.total,
            correct_answers: stats.correct,
            percentage: Math.round((stats.correct / stats.total) * 100)
        })).sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({
            status: 'OK',
            stats: {
                overall: {
                    total_questions: totalQuestions,
                    correct_answers: totalCorrect,
                    percentage: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
                },
                by_subject: formattedSubjectStats,
                by_date: formattedDailyStats
            }
        });

    } catch (error) {
        console.error('Error in getLearnerStats:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 