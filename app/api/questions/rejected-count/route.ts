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

        // Get count of rejected questions for this capturer
        const { count, error: countError } = await supabase
            .from('question')
            .select('*', { count: 'exact', head: true })
            .eq('capturer', capturer.id)
            .eq('status', 'rejected');

        if (countError) {
            console.error('Error counting questions:', countError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error counting questions'
            }, { status: 500 });
        }

        return NextResponse.json({
            status: 'OK',
            count: count || 0
        });

    } catch (error) {
        console.error('Error in getRejectedQuestionsCount:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting rejected questions count',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 