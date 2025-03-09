import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function DELETE(request: Request) {
    try {
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');
        const subjectName = searchParams.get('subject_name');

        if (!uid || !subjectName) {
            return NextResponse.json({
                status: 'NOK',
                message: 'UID and subject_name are required'
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

        // Get all questions for the subject
        const { data: questions, error: questionsError } = await supabase
            .from('question')
            .select('id, subject!inner(name)')
            .ilike('subject.name', `${subjectName}%`);

        if (questionsError) {
            console.error('Error fetching questions:', questionsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching questions'
            }, { status: 500 });
        }

        // Get question IDs
        const questionIds = questions.map(q => q.id);

        if (questionIds.length > 0) {
            // Delete results for these questions
            const { error: deleteError } = await supabase
                .from('result')
                .delete()
                .eq('learner_id', learner.id)
                .in('question_id', questionIds);

            if (deleteError) {
                console.error('Error deleting results:', deleteError);
                return NextResponse.json({
                    status: 'NOK',
                    message: 'Error deleting results'
                }, { status: 500 });
            }
        }

        return NextResponse.json({
            status: 'OK',
            message: 'Successfully removed results'
        });

    } catch (error) {
        console.error('Error in removeLearnerResultsBySubject:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error removing results',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 