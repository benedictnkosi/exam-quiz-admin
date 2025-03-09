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
        const questionId = searchParams.get('question_id');
        const uid = searchParams.get('uid');

        if (!questionId || !uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Question ID and UID are required'
            }, { status: 400 });
        }

        // Get the learner
        const { data: learner, error: learnerError } = await supabase
            .from('learner')
            .select('id, role')
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
            .select(`
                *,
                subject:subject_id(
                    id,
                    name,
                    grade:grade_id(
                        id,
                        number,
                        name
                    )
                ),
                capturer:capturer_id(
                    id,
                    name,
                    email
                )
            `)
            .eq('id', questionId)
            .single();

        if (questionError || !question) {
            console.error('Error fetching question:', questionError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Question not found'
            }, { status: 404 });
        }

        // Get learner's attempts for this question
        const { data: attempts, error: attemptsError } = await supabase
            .from('result')
            .select('*')
            .eq('learner_id', learner.id)
            .eq('question_id', questionId)
            .order('created', { ascending: false });

        if (attemptsError) {
            console.error('Error fetching attempts:', attemptsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching attempts'
            }, { status: 500 });
        }

        // Process options
        let options = question.options;
        try {
            if (typeof options === 'string') {
                options = JSON.parse(options);
            }
        } catch (e) {
            console.error('Error parsing options:', e);
        }

        // Format response based on role
        const response: any = {
            id: question.id,
            question: question.question,
            options: options,
            subject: {
                id: question.subject.id,
                name: question.subject.name,
                grade: question.subject.grade
            },
            term: question.term,
            curriculum: question.curriculum,
            attempts: attempts.map(attempt => ({
                id: attempt.id,
                outcome: attempt.outcome,
                created: attempt.created
            }))
        };

        // Add additional fields for admin/capturer
        if (learner.role === 'admin' || learner.role === 'capturer') {
            response.answer = question.answer;
            response.explanation = question.explanation;
            response.status = question.status;
            response.active = question.active;
            response.capturer = question.capturer;
            response.created = question.created;
            response.updated = question.updated;
        }

        return NextResponse.json({
            status: 'OK',
            question: response
        });

    } catch (error) {
        console.error('Error in getQuestionDetails:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting question details',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 