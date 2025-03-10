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
        const subjectName = searchParams.get('subject');

        if (!uid || !subjectName) {
            return NextResponse.json({
                status: 'NOK',
                message: 'UID and subject are required'
            }, { status: 400 });
        }

        // Get the learner
        const { data: learner, error: learnerError } = await supabase
            .from('learner')
            .select('id, grade, grade')
            .eq('uid', uid)
            .single();

        if (learnerError || !learner) {
            console.error('Error fetching learner:', learnerError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner not found'
            }, { status: 404 });
        }

        // Get the subject for the learner's grade
        const { data: subject, error: subjectError } = await supabase
            .from('subject')
            .select('id, name')
            .eq('name', subjectName)
            .eq('grade', learner.grade)
            .single();


        if (subjectError || !subject) {
            console.error('Error fetching subject:', subjectError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Subject not found'
            }, { status: 404 });
        }

        // Get all results for the learner and subject

        const { data: results, error: resultsError } = await supabase
            .from('result')
            .select(`
                id,
                outcome,
                learner,
                question!inner (
                    subject
                )
            `)
            .eq('learner', learner.id)
            .eq('question.subject', subject.id);

        if (resultsError) {
            console.error('Error fetching results:', resultsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching results'
            }, { status: 500 });
        }

        // Process results
        const totalAnswers = results.length;
        const correctAnswers = results.filter(r => r.outcome === 'correct').length;
        const incorrectAnswers = results.filter(r => r.outcome === 'incorrect').length;

        return NextResponse.json({
            status: 'OK',
            data: {
                subject: {
                    id: subject.id,
                    name: subject.name
                },
                stats: {
                    total_answers: totalAnswers,
                    correct_answers: correctAnswers,
                    incorrect_answers: incorrectAnswers,
                    correct_percentage: totalAnswers > 0
                        ? Number((correctAnswers / totalAnswers * 100).toFixed(2))
                        : 0,
                    incorrect_percentage: totalAnswers > 0
                        ? Number((incorrectAnswers / totalAnswers * 100).toFixed(2))
                        : 0
                }
            }
        });

    } catch (error) {
        console.error('Error in getLearnerStats:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting subject statistics: ' + (error instanceof Error ? error.message : 'Unknown error')
        }, { status: 500 });
    }
} 