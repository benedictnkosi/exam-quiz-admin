import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Define a type for the stats object structure
interface StatEntry {
    capturer: unknown;
    counts: {
        new: number;
        approved: number;
        rejected: number;
        total: number;
    };
}

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

        // Use a plain object as the accumulator to avoid type issues
        type Accumulator = { [key: string]: StatEntry };

        // Process the data to group by capturer and count statuses
        const capturerStats: Accumulator = {};

        // Manually iterate instead of using reduce to avoid TypeScript complexity
        for (const question of statusCounts || []) {
            // Skip items without a valid capturer
            if (!question || typeof question !== 'object') continue;
            if (!('capturer' in question) || !question.capturer) continue;

            const capturer = question.capturer;
            if (!capturer || typeof capturer !== 'object') continue;
            if (!('id' in capturer) || typeof capturer.id === 'undefined') continue;

            const capturerId = String(capturer.id);

            // Initialize capturer stats if needed
            if (!capturerStats[capturerId]) {
                capturerStats[capturerId] = {
                    capturer: capturer,
                    counts: {
                        new: 0,
                        approved: 0,
                        rejected: 0,
                        total: 0
                    }
                };
            }

            // Update counts
            const stats = capturerStats[capturerId] as StatEntry;

            // Handle status
            const status = typeof question.status === 'string'
                ? question.status.toLowerCase()
                : 'new';

            if (status === 'new' || status === 'approved' || status === 'rejected') {
                stats.counts[status]++;
            }

            // Always increment total
            stats.counts.total++;
        }

        // Convert to array and sort by total questions
        const result = Object.values(capturerStats)
            .sort((a, b) => {
                return b.counts.total - a.counts.total;
            });

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