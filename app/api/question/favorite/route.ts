import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        // Get the request body
        const body = await request.json();
        const { question_id, uid } = body;

        // Validate required fields
        if (!question_id || !uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Question ID and Learner ID are required'
            }, { status: 400 });
        }

        // Check if the question exists
        const { data: question, error: questionError } = await supabase
            .from('question')
            .select('id')
            .eq('id', question_id)
            .single();

        if (questionError || !question) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Question not found'
            }, { status: 404 });
        }

        // Check if the learner exists
        const { data: learner, error: learnerError } = await supabase
            .from('learner')
            .select('id')
            .eq('uid', uid)
            .single();

        if (learnerError || !learner) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner not found'
            }, { status: 404 });
        }

        // Check if the favorite already exists
        const { data: existingFavorite, error: existingError } = await supabase
            .from('favorites')
            .select('id')
            .eq('question', question_id)
            .eq('learner', learner.id)
            .single();

        if (existingFavorite) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Question is already in favorites'
            }, { status: 400 });
        }

        // Add to favorites
        console.log(question_id, learner.id);
        const { data: favorite, error: favoriteError } = await supabase
            .from('favorites')
            .insert([
                {
                    question: question_id,
                    learner: learner.id,
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (favoriteError) {
            console.error('Error adding to favorites:', favoriteError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Failed to add question to favorites'
            }, { status: 500 });
        }

        return NextResponse.json({
            status: 'OK',
            message: 'Question added to favorites successfully',
            data: favorite
        });

    } catch (error) {
        console.error('Error in favorite POST:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Internal server error'
        }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        // Get the request body
        const body = await request.json();
        const { question_id, uid } = body;

        // Validate required fields
        if (!question_id || !uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Question ID and Learner ID are required'
            }, { status: 400 });
        }

        // Check if the learner exists
        const { data: learner, error: learnerError } = await supabase
            .from('learner')
            .select('id')
            .eq('uid', uid)
            .single();

        if (learnerError || !learner) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner not found'
            }, { status: 404 });
        }

        // Delete from favorites
        const { error: deleteError } = await supabase
            .from('favorites')
            .delete()
            .eq('question', question_id)
            .eq('learner', learner.id);

        if (deleteError) {
            console.error('Error removing from favorites:', deleteError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Failed to remove question from favorites'
            }, { status: 500 });
        }

        return NextResponse.json({
            status: 'OK',
            message: 'Question removed from favorites successfully'
        });

    } catch (error) {
        console.error('Error in favorite DELETE:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Internal server error'
        }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        // Get the query parameters
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');
        const subject_id = searchParams.get('subject_id');

        // Validate required parameters
        if (!uid || !subject_id) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner ID and Subject ID are required'
            }, { status: 400 });
        }

        // Check if the learner exists
        const { data: learner, error: learnerError } = await supabase
            .from('learner')
            .select('id')
            .eq('uid', uid)
            .single();

        if (learnerError || !learner) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner not found'
            }, { status: 404 });
        }

        // Check if the subject exists
        const { data: subject, error: subjectError } = await supabase
            .from('subject')
            .select('id')
            .eq('id', subject_id)
            .single();

        if (subjectError || !subject) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Subject not found'
            }, { status: 404 });
        }

        // Get favorite questions for the learner in the specified subject
        const { data: favorites, error: favoritesError } = await supabase
            .from('favorites')
            .select(`
                id,
                created_at,
                question:question (
                    id,
                    ai_explanation
                )
            `)
            .eq('learner', learner.id)
            .eq('question.subject', subject_id)
            .order('created_at', { ascending: false });
        if (favoritesError) {
            console.error('Error fetching favorites:', favoritesError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Failed to fetch favorite questions'
            }, { status: 500 });
        }

        return NextResponse.json({
            status: 'OK',
            message: 'Favorite questions retrieved successfully',
            data: favorites
        });

    } catch (error) {
        console.error('Error in favorite GET:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Internal server error'
        }, { status: 500 });
    }
} 