import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PUT(request: Request) {
    try {
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const questionId = searchParams.get('question_id');
        const uid = searchParams.get('uid');
        const posted = searchParams.get('posted') === 'true';

        if (!questionId || !uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Question ID and UID are required'
            }, { status: 400 });
        }

        // Verify user has permission (admin or capturer)
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

        if (user.role !== 'admin' && user.role !== 'capturer') {
            return NextResponse.json({
                status: 'NOK',
                message: 'Unauthorized: Only admins and capturers can update posted status'
            }, { status: 403 });
        }

        // Update the question's posted status
        const { error: updateError } = await supabase
            .from('question')
            .update({
                posted,
                updated: new Date().toISOString()
            })
            .eq('id', questionId);

        if (updateError) {
            console.error('Error updating question posted status:', updateError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error updating question posted status'
            }, { status: 500 });
        }

        return NextResponse.json({
            status: 'OK',
            message: `Question posted status updated to ${posted}`
        });

    } catch (error) {
        console.error('Error in updateQuestionPostedStatus:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error updating question posted status',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 