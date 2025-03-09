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
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'UID is required'
            }, { status: 400 });
        }

        // Get the learner
        const { data: learner, error: learnerError } = await supabase
            .from('learner')
            .select('id, name, grade_id')
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

        // Get results with question and subject details
        const { data: results, error: resultsError, count } = await supabase
            .from('result')
            .select(`
                *,
                question:question_id(
                    id,
                    question,
                    answer,
                    explanation,
                    subject:subject_id(
                        id,
                        name,
                        grade:grade_id(
                            id,
                            number,
                            name
                        )
                    )
                )
            `, { count: 'exact' })
            .eq('learner_id', learner.id)
            .gte('created', startDate.toISOString())
            .lte('created', endDate.toISOString())
            .order('created', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (resultsError) {
            console.error('Error fetching results:', resultsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching results'
            }, { status: 500 });
        }

        // Process activity log
        const activityLog = results.map(result => {
            // Get base subject name
            const subjectName = result.question.subject.name.split(' ')[0];
            const paperName = result.question.subject.name.replace(`${subjectName} `, '');

            return {
                id: result.id,
                type: 'question_attempt',
                outcome: result.outcome,
                question: {
                    id: result.question.id,
                    text: result.question.question,
                    answer: result.answer,
                    correct_answer: result.question.answer,
                    explanation: result.outcome === 'incorrect' ? result.question.explanation : null
                },
                subject: {
                    name: subjectName,
                    paper: paperName,
                    grade: result.question.subject.grade
                },
                created: result.created
            };
        });

        // Calculate activity summary
        const summary = {
            period: parseInt(period),
            total_attempts: count || 0,
            correct_attempts: results.filter(r => r.outcome === 'correct').length,
            unique_subjects: new Set(results.map(r => r.question.subject.name.split(' ')[0])).size,
            last_active: results[0]?.created || null
        };

        // Calculate daily activity
        const dailyActivity: { [key: string]: { total: number, correct: number } } = {};
        results.forEach(result => {
            const date = new Date(result.created).toISOString().split('T')[0];
            if (!dailyActivity[date]) {
                dailyActivity[date] = { total: 0, correct: 0 };
            }
            dailyActivity[date].total++;
            if (result.outcome === 'correct') {
                dailyActivity[date].correct++;
            }
        });

        // Format daily activity
        const formattedDailyActivity = Object.entries(dailyActivity)
            .map(([date, stats]) => ({
                date,
                total_attempts: stats.total,
                correct_attempts: stats.correct,
                accuracy: Math.round((stats.correct / stats.total) * 100)
            }))
            .sort((a, b) => b.date.localeCompare(a.date));

        return NextResponse.json({
            status: 'OK',
            activity: {
                summary,
                daily_activity: formattedDailyActivity,
                log: activityLog,
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    total_pages: count ? Math.ceil(count / limit) : 0
                }
            }
        });

    } catch (error) {
        console.error('Error in getLearnerActivity:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting activity log',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 