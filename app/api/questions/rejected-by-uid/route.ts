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

        if (!uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'UID is required'
            }, { status: 400 });
        }

        // Get the capturer's ID
        const { data: capturer, error: capturerError } = await supabase
            .from('learner')
            .select('id')
            .eq('uid', uid)
            .single();

        if (capturerError || !capturer) {
            console.error('Error fetching capturer:', capturerError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Capturer not found'
            }, { status: 404 });
        }

        // Get rejected questions for this capturer
        const { data: questions, error: questionsError } = await supabase
            .from('question')
            .select(`
                *,
                subject:subject(
                    id,
                    name,
                    grade:grade(
                        id,
                        number
                    )
                ),
                capturer:capturer(
                    id,
                    name,
                    email
                )
            `)
            .eq('capturer', capturer.id)
            .eq('status', 'rejected')
            .order('created', { ascending: false });

        if (questionsError) {
            console.error('Error fetching questions:', questionsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching questions'
            }, { status: 500 });
        }

        // Process questions to format them properly
        const formattedQuestions = questions.map(question => {
            // Process options if they exist
            let options = question.options;
            try {
                if (typeof options === 'string') {
                    options = JSON.parse(options);
                }
            } catch (e) {
                console.error('Error parsing options:', e);
            }

            return {
                id: question.id,
                question: question.question,
                type: question.type,
                answer: question.answer,
                options: options,
                explanation: question.explanation,
                term: question.term,
                curriculum: question.curriculum,
                subject: question.subject,
                status: question.status,
                active: question.active,
                capturer: question.capturer,
                created: question.created,
                updated: question.updated
            };
        });

        return NextResponse.json({
            status: 'OK',
            questions: formattedQuestions,
            count: formattedQuestions.length
        });

    } catch (error) {
        console.error('Error in getRejectedQuestions:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting rejected questions',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 