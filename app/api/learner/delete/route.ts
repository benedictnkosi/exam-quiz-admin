import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');

        if (!uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner UID is required'
            }, { status: 400 });
        }

        // Delete the learner from the database
        const { error } = await supabase
            .from('learner')
            .delete()
            .eq('uid', uid);

        if (error) {
            console.error('Error deleting learner:', error);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error deleting learner',
                error: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            status: 'OK',
            message: 'Learner deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting learner:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error deleting learner',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 