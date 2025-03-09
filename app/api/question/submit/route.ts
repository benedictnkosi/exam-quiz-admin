import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { uid, question_id, answer } = body;

        if (!uid || !question_id || answer === undefined) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Missing required parameters'
            }, { status: 400 });
        }

        // Get the learner
        const { data: learner, error: learnerError } = await supabase
            .from('learner')
            .select('id')
            .eq('uid', uid)
            .single();

        if (learnerError || !learner) {
            console.error('Error fetching learner:', learnerError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner not found'
            }, { status: 404 });
        }

        // Get question details
        const { data: question, error: questionError } = await supabase
            .from('question')
            .select('*')
            .eq('id', question_id)
            .single();

        if (questionError || !question) {
            console.error('Error fetching question:', questionError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Question not found'
            }, { status: 404 });
        }

        // Check if answer is correct
        const isCorrect = answer.toString().toLowerCase() === question.answer.toString().toLowerCase();

        // Create result record
        const { data: result, error: resultError } = await supabase
            .from('result')
            .insert({
                learner_id: learner.id,
                question_id: question.id,
                answer: answer,
                outcome: isCorrect ? 'correct' : 'incorrect'
            })
            .select()
            .single();

        if (resultError) {
            console.error('Error creating result:', resultError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error saving result'
            }, { status: 500 });
        }

        // Get previous attempts for mastery calculation
        const { data: previousResults, error: previousError } = await supabase
            .from('result')
            .select('outcome, created')
            .eq('learner_id', learner.id)
            .eq('question_id', question.id)
            .order('created', { ascending: false })
            .limit(3);

        if (previousError) {
            console.error('Error fetching previous results:', previousError);
        }

        // Calculate mastery (3 consecutive correct answers)
        const consecutiveCorrect = previousResults?.every(r => r.outcome === 'correct') || false;
        const mastered = isCorrect && consecutiveCorrect && previousResults?.length === 2;

        return NextResponse.json({
            status: 'OK',
            result: {
                id: result.id,
                correct: isCorrect,
                mastered,
                explanation: question.explanation,
                created: result.created
            }
        });

    } catch (error) {
        console.error('Error in submitAnswer:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error submitting answer',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 