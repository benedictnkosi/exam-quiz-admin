import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const gradeNumber = searchParams.get('grade');
        const subjectId = searchParams.get('subject');
        const status = searchParams.get('status');

        if (!gradeNumber || !subjectId) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Grade and Subject are required'
            }, { status: 400 });
        }

        // Get grade
        const { data: grade, error: gradeError } = await supabase
            .from('grade')
            .select('id')
            .eq('number', gradeNumber)
            .single();

        if (gradeError || !grade) {
            console.error('Error fetching grade:', gradeError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Grade not found'
            }, { status: 404 });
        }

        // Get subject for the grade
        const { data: subject, error: subjectError } = await supabase
            .from('subject')
            .select('id')
            .eq('id', subjectId)
            .eq('grade', grade.id)
            .single();

        if (subjectError || !subject) {
            console.error('Error fetching subject:', subjectError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Subject not found'
            }, { status: 404 });
        }

        // Build query for questions
        let query = supabase
            .from('question')
            .select(`
                id,
                question,
                type,
                context,
                answer,
                options,
                term,
                explanation,
                year,
                curriculum,
                image_path,
                question_image_path,
                answer_image,
                status,
                created,
                capturer:learner!question_capturer_fk (
                    id,
                    name,
                    email
                ),
                reviewer:learner!question_reviewer_fk (
                    id,
                    name,
                    email
                )
            `)
            .eq('subject', subject.id)
            .eq('active', true)
            .order('created', { ascending: false });

        // Add status filter if provided
        if (status) {
            query = query.eq('status', status);
        }

        const { data: questions, error: questionsError } = await query;

        if (questionsError) {
            console.error('Error fetching questions:', questionsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching questions'
            }, { status: 500 });
        }

        return NextResponse.json({
            status: 'OK',
            questions: questions
        });

    } catch (error) {
        console.error('Error getting questions:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting questions',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 