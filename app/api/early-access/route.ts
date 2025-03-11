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