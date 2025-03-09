import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ReviewerStats {
    reviewer: string;
    reviewer_name: string;
    approved: number;
    rejected: number;
    new: number;
    total: number;
}

export async function GET(request: Request) {
    try {
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const from_date = searchParams.get('from_date');

        // Fetch questions with reviewer and status information
        let query = supabase
            .from('question')
            .select(`
                reviewer,
                status,
                reviewed_at,
                reviewer_info:learner!question_reviewer_fk(id, name)
            `)
            .not('reviewer', 'is', null);

        // Apply date filtering if from_date is provided
        if (from_date) {
            const parsedFromDate = new Date(from_date);

            // Validate the date
            if (isNaN(parsedFromDate.getTime())) {
                return NextResponse.json({
                    status: 'NOK',
                    message: 'Invalid from_date format. Use ISO format (YYYY-MM-DD).'
                }, { status: 400 });
            }

            query = query.gte('reviewed_at', parsedFromDate.toISOString());
        }

        // Execute the query
        const { data, error } = await query;

        if (error) {
            console.error('Error fetching reviewer stats:', error);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching reviewer statistics',
                error: error.message
            }, { status: 500 });
        }

        // Process the data to count questions by reviewer and status
        const reviewerStats: Record<string, ReviewerStats> = {};

        // Count questions by reviewer and status
        data.forEach(question => {
            const reviewerId = question.reviewer;
            const status = question.status || 'new';

            // Get reviewer name from the joined data
            let reviewerName = 'Unknown';
            if (question.reviewer_info) {
                if (Array.isArray(question.reviewer_info) && question.reviewer_info.length > 0) {
                    reviewerName = question.reviewer_info[0].name || 'Unknown';
                } else if (typeof question.reviewer_info === 'object') {
                    reviewerName = (question.reviewer_info as any).name || 'Unknown';
                }
            }

            if (!reviewerStats[reviewerId]) {
                reviewerStats[reviewerId] = {
                    reviewer: reviewerId,
                    reviewer_name: reviewerName,
                    approved: 0,
                    rejected: 0,
                    new: 0,
                    total: 0
                };
            }

            // Increment the appropriate status counter
            if (status === 'approved') {
                reviewerStats[reviewerId].approved++;
            } else if (status === 'rejected') {
                reviewerStats[reviewerId].rejected++;
            } else {
                reviewerStats[reviewerId].new++;
            }

            // Increment the total counter
            reviewerStats[reviewerId].total++;
        });

        // Convert to array format
        const statsArray = Object.values(reviewerStats);

        return NextResponse.json({
            status: 'OK',
            data: statsArray
        });

    } catch (error) {
        console.error('Error in getQuestionsReviewedByUser:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting reviewer statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 