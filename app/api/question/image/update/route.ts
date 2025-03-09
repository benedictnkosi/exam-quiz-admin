import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { question_id, image_name, image_type, uid } = body;

        if (!question_id || !image_name || !image_type || !uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Missing required fields'
            }, { status: 400 });
        }

        // Validate image type
        if (!['question_context', 'question', 'answer'].includes(image_type)) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Invalid image type'
            }, { status: 400 });
        }

        // Check if user is admin
        const { data: learner, error: learnerError } = await supabase
            .from('learner')
            .select('role')
            .eq('uid', uid)
            .single();

        if (learnerError || !learner) {
            return NextResponse.json({
                status: 'NOK',
                message: 'User not found'
            }, { status: 404 });
        }

        if (learner.role !== 'admin') {
            return NextResponse.json({
                status: 'NOK',
                message: 'Unauthorized: Admin access required'
            }, { status: 403 });
        }

        // Update the question with the new image path
        const updateData: { [key: string]: string } = {};
        switch (image_type) {
            case 'question_context':
                updateData.image_path = image_name;
                break;
            case 'question':
                updateData.question_image_path = image_name;
                break;
            case 'answer':
                updateData.answer_image = image_name;
                break;
        }

        const { error: updateError } = await supabase
            .from('question')
            .update(updateData)
            .eq('id', question_id);

        if (updateError) {
            console.error('Error updating question:', updateError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error updating question with image path'
            }, { status: 500 });
        }

        return NextResponse.json({
            status: 'OK',
            message: 'Successfully updated image path for question'
        });

    } catch (error) {
        console.error('Error updating image path:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error updating image path',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 