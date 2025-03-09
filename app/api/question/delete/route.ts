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
        const questionId = searchParams.get('question_id');
        const uid = searchParams.get('uid');

        if (!questionId || !uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Question ID and UID are required'
            }, { status: 400 });
        }

        // Get the user and verify permissions
        const { data: user, error: userError } = await supabase
            .from('learner')
            .select('id, role')
            .eq('uid', uid)
            .single();

        if (userError || !user) {
            return NextResponse.json({
                status: 'NOK',
                message: 'User not found'
            }, { status: 404 });
        }

        // Only admins can delete questions
        if (user.role !== 'admin') {
            return NextResponse.json({
                status: 'NOK',
                message: 'Unauthorized: Only admins can delete questions'
            }, { status: 403 });
        }

        // Delete the question
        const { error: deleteError } = await supabase
            .from('question')
            .delete()
            .eq('id', questionId);

        if (deleteError) {
            console.error('Error deleting question:', deleteError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error deleting question'
            }, { status: 500 });
        }

        return NextResponse.json({
            status: 'OK',
            message: 'Question deleted successfully'
        });

    } catch (error) {
        console.error('Error in deleteQuestion:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error deleting question',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 