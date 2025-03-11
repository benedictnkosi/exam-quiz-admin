import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;

        // Validate email
        if (!email) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Email is required'
            }, { status: 400 });
        }

        // Check if email already exists
        const { data: existingEmail, error: existingError } = await supabase
            .from('early_access')
            .select('id')
            .eq('email', email)
            .single();

        if (existingEmail) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Email already registered'
            }, { status: 400 });
        }

        // Add email to early_access table
        const { error: insertError } = await supabase
            .from('early_access')
            .insert([
                {
                    email,
                    created_at: new Date().toISOString()
                }
            ]);

        if (insertError) {
            console.error('Error registering email:', insertError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Failed to register email'
            }, { status: 500 });
        }

        return NextResponse.json({
            status: 'OK',
            message: 'Email registered successfully'
        });

    } catch (error) {
        console.error('Error in early access registration:', error);
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
        const subject_name = searchParams.get('subject_name');

        // Validate required parameters
        if (!uid || !subject_name) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner ID and Subject Name are required'
            }, { status: 400 });
        }

        // Check if the learner exists
        const { data: learner, error: learnerError } = await supabase
            .from('learner')
            .select('id, grade')
            .eq('uid', uid)
            .single();

        if (learnerError || !learner) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner not found'
            }, { status: 404 });
        }

        // Check if the subject exists
        const { data: subjects, error: subjectError } = await supabase
            .from('subject')
            .select('id')
            .eq('grade', learner.grade)
            .ilike('name', `%${subject_name}%`);

        if (subjectError || !subjects?.length) {
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
                question:question!inner (
                    id,
                    question,
                    ai_explanation,
                    subject,
                    context
                )
            `)
            .eq('learner', learner.id)
            .in('question.subject', subjects.map(s => s.id))
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