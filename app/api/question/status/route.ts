import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Define an interface for the update data
interface QuestionUpdateData {
    status: string;
    updated: string;
    feedback?: string;
    active?: boolean;
    reviewer?: number;
    reviewed_at?: string;
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { uid, question_id, status, feedback } = body;

        if (!uid || !question_id || !status) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Missing required parameters'
            }, { status: 400 });
        }

        // Get the learner (admin/capturer)
        const { data: admin, error: adminError } = await supabase
            .from('learner')
            .select('id, role')
            .eq('uid', uid)
            .single();

        if (adminError || !admin) {
            console.error('Error fetching admin:', adminError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Admin not found'
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

        // Update question status
        const updateData: QuestionUpdateData = {
            status,
            updated: new Date().toISOString()
        };

        // Add feedback if provided
        if (feedback) {
            updateData.feedback = feedback;
        }

        // If approving, set active to true
        if (status === 'approved') {
            updateData.active = true;
        }

        console.log(updateData);

        const { data: updatedQuestion, error: updateError } = await supabase
            .from('question')
            .update(updateData)
            .eq('id', question_id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating question:', updateError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error updating question'
            }, { status: 500 });
        }

        // Create status change log
        const { error: logError } = await supabase
            .from('question_status_log')
            .insert({
                question_id: question_id,
                old_status: question.status,
                new_status: status,
                changed_by: admin.id,
                feedback
            });

        if (logError) {
            console.error('Error creating status log:', logError);
        }

        return NextResponse.json({
            status: 'OK',
            question: {
                id: updatedQuestion.id,
                status: updatedQuestion.status,
                feedback: updatedQuestion.feedback,
                updated: updatedQuestion.updated
            }
        });

    } catch (error) {
        console.error('Error in updateQuestionStatus:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error updating question status',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 