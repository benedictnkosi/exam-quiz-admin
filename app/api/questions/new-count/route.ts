import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    try {
        // Get count of questions with "new" status
        const { count, error: countError } = await supabase
            .from('question')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'new')
            .eq('active', true);

        if (countError) {
            console.error('Error counting new questions:', countError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error counting new questions'
            }, { status: 500 });
        }

        return NextResponse.json({
            status: 'OK',
            count: count || 0
        });

    } catch (error) {
        console.error('Error in getNewQuestionsCount:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting new questions count',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 