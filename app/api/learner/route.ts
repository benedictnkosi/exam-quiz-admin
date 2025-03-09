import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    try {
        // Get the uid from URL parameters
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');

        // Validate uid parameter
        if (!uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'UID values are required'
            }, { status: 400 });
        }

        // Query Supabase for the learner
        const { data: learner, error } = await supabase
            .from('learner')
            .select('*')
            .eq('uid', uid)
            .single();

        if (error) {
            console.error('Supabase error:', error.message);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error getting learner'
            }, { status: 500 });
        }

        if (!learner) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner not found'
            }, { status: 404 });
        }

        return NextResponse.json(learner);

    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting learner'
        }, { status: 500 });
    }
} 