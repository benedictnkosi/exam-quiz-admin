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
        const subjectId = searchParams.get('subject_id');
        const period = searchParams.get('period') || '30'; // Default to 30 days

        if (!subjectId) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Subject ID is required'
            }, { status: 400 });
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Get subject details
        const { data: subject, error: subjectError } = await supabase
            .from('subject')
            .select(`
                *,
                grade:grade_id(
                    id,
                    number,
                    name
                )
            `)
            .eq('id', subjectId)
            .single();

        if (subjectError || !subject) {
            console.error('Error fetching subject:', subjectError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Subject not found'
            }, { status: 404 });
        }

        // Get questions for this subject
        const { data: questions, error: questionsError } = await supabase
            .from('question')
            .select('id, term, curriculum, status, active')
            .eq('subject_id', subjectId);

        if (questionsError) {
            console.error('Error fetching questions:', questionsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching questions'
            }, { status: 500 });
        }

        // Get results for these questions
        const { data: results, error: resultsError } = await supabase
            .from('result')
            .select(`
                *,
                learner:learner_id(
                    id,
                    grade:grade_id(number)
                )
            `)
            .in('question_id', questions.map(q => q.id))
            .gte('created', startDate.toISOString())
            .lte('created', endDate.toISOString());

        if (resultsError) {
            console.error('Error fetching results:', resultsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching results'
            }, { status: 500 });
        }

        // Calculate statistics
        const totalQuestions = questions.length;
        const activeQuestions = questions.filter(q => q.active && q.status === 'approved').length;
        const pendingQuestions = questions.filter(q => q.status === 'new').length;

        // Stats by term
        const termStats = questions.reduce((acc: { [key: string]: any }, q) => {
            if (!acc[q.term]) {
                acc[q.term] = {
                    total: 0,
                    active: 0,
                    results: {
                        total: 0,
                        correct: 0
                    }
                };
            }
            acc[q.term].total++;
            if (q.active && q.status === 'approved') {
                acc[q.term].active++;
            }
            return acc;
        }, {});

        // Process results
        const dailyStats: { [key: string]: { total: number, correct: number } } = {};
        const learnerStats = new Set();
        let totalAttempts = 0;
        let correctAttempts = 0;

        results.forEach(result => {
            // Daily stats
            const date = new Date(result.created).toISOString().split('T')[0];
            if (!dailyStats[date]) {
                dailyStats[date] = { total: 0, correct: 0 };
            }
            dailyStats[date].total++;
            if (result.outcome === 'correct') {
                dailyStats[date].correct++;
            }

            // Overall stats
            totalAttempts++;
            if (result.outcome === 'correct') {
                correctAttempts++;
            }

            // Track unique learners
            learnerStats.add(result.learner_id);

            // Update term stats
            const question = questions.find(q => q.id === result.question_id);
            if (question) {
                termStats[question.term].results.total++;
                if (result.outcome === 'correct') {
                    termStats[question.term].results.correct++;
                }
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

        // Format term stats
        const formattedTermStats = Object.entries(termStats)
            .map(([term, stats]) => ({
                term: parseInt(term),
                total_questions: stats.total,
                active_questions: stats.active,
                total_attempts: stats.results.total,
                correct_attempts: stats.results.correct,
                accuracy: stats.results.total > 0
                    ? Math.round((stats.results.correct / stats.results.total) * 100)
                    : 0
            }))
            .sort((a, b) => a.term - b.term);

        return NextResponse.json({
            status: 'OK',
            stats: {
                subject: {
                    id: subject.id,
                    name: subject.name,
                    grade: subject.grade
                },
                overview: {
                    total_questions: totalQuestions,
                    active_questions: activeQuestions,
                    pending_questions: pendingQuestions,
                    total_attempts: totalAttempts,
                    correct_attempts: correctAttempts,
                    accuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
                    unique_learners: learnerStats.size
                },
                by_term: formattedTermStats,
                by_date: formattedDailyStats
            }
        });

    } catch (error) {
        console.error('Error in getSubjectStats:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting subject statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 