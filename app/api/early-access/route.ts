import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to set CORS headers
function setCorsHeaders(response) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return response;
}

// Handle preflight (OPTIONS) requests
export async function OPTIONS() {
    const response = new NextResponse(null, { status: 204 });
    return setCorsHeaders(response);
}

// Handle GET requests
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return setCorsHeaders(NextResponse.json({
                status: 'NOK',
                message: 'Email is required'
            }, { status: 400 }));
        }

        // Check if email already exists
        const { data: existingEmail, error: existingError } = await supabase
            .from('early_access')
            .select('id')
            .eq('email', email)
            .single();

        if (existingEmail) {
            return setCorsHeaders(NextResponse.json({
                status: 'NOK',
                message: 'Email already registered'
            }, { status: 400 }));
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
            return setCorsHeaders(NextResponse.json({
                status: 'NOK',
                message: 'Failed to register email'
            }, { status: 500 }));
        }

        return setCorsHeaders(NextResponse.json({
            status: 'OK',
            message: 'Email registered successfully'
        }));

    } catch (error) {
        console.error('Error in early access registration:', error);
        return setCorsHeaders(NextResponse.json({
            status: 'NOK',
            message: 'Internal server error'
        }, { status: 500 }));
    }
}
