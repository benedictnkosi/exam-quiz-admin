import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fromDate = searchParams.get('from_date');

        // Build the query
        let query = supabase
            .from('question')
            .select(`
                status,
                created,
                capturer:learner!question_capturer_fk (
                    id,
                    name,
                    email
                )
            `)
            .eq('active', true);

        // Add date filter if provided
        if (fromDate) {
            query = query.gte('created', fromDate);
        }

        // Execute the query
        const { data: statusCounts, error } = await query;

        if (error) {
            console.error('Error fetching questions:', error);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching question status counts'
            }, { status: 500 });
        }

        // Process the data to group by capturer and count statuses
        const capturerStats = statusCounts.reduce((acc: any, question: any) => {
            const capturerId = question.capturer?.id;
            if (!capturerId) return acc;

            if (!acc[capturerId]) {
                acc[capturerId] = {
                    capturer: question.capturer,
                    counts: {
                        new: 0,
                        approved: 0,
                        rejected: 0,
                        total: 0
                    }
                };
            }

            // Increment the appropriate status count
            const status = question.status?.toLowerCase() || 'new';
            if (acc[capturerId].counts.hasOwnProperty(status)) {
                acc[capturerId].counts[status]++;
            }
            acc[capturerId].counts.total++;

            return acc;
        }, {});

        // Convert to array and sort by total questions
        const result = Object.values(capturerStats).sort((a: any, b: any) =>
            b.counts.total - a.counts.total
        );

        return NextResponse.json({
            status: 'OK',
            capturers: result
        });

    } catch (error) {
        console.error('Error getting question status counts:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting question status counts',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 