import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const phoneNumber = searchParams.get('phone');

        if (!phoneNumber) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Phone number is required'
            }, { status: 400 });
        }

        // Basic phone number validation (10 digits)
        if (!phoneNumber.match(/^[0-9]{10}$/)) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Invalid phone number format. Please use 10 digits'
            }, { status: 400 });
        }

        // Check if phone number already exists
        const { data: existingSubscription, error: searchError } = await supabase
            .from('subscription')
            .select('*')
            .eq('phone_number', phoneNumber)
            .single();

        if (searchError && searchError.code !== 'PGRST116') { // PGRST116 is "not found" error
            console.error('Error checking existing subscription:', searchError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error checking subscription'
            }, { status: 500 });
        }

        if (existingSubscription) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Phone number already subscribed'
            }, { status: 400 });
        }

        // Create new subscription
        const { error: insertError } = await supabase
            .from('subscription')
            .insert({
                phone_number: phoneNumber,
                created: new Date().toISOString()
            });

        if (insertError) {
            console.error('Error creating subscription:', insertError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error creating subscription'
            }, { status: 500 });
        }

        return NextResponse.json({
            status: 'OK',
            message: 'Successfully subscribed'
        });

    } catch (error) {
        console.error('Error in subscription:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error creating subscription',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 