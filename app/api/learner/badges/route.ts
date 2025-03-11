import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
console.log('Supabase URL:', supabaseUrl); // Log URL (but not the key for security)
const supabase = createClient(supabaseUrl, supabaseKey);

// GET learner badges
export async function GET(request: Request) {
    try {
        // Get the learner ID from URL parameters
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');

        if (!uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner UID is required'
            }, { status: 400 });
        }

        // First get the learner ID
        const { data: learner, error: learnerError } = await supabase
            .from('learner')
            .select('id')
            .eq('uid', uid)
            .single();

        if (learnerError || !learner) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner not found'
            }, { status: 404 });
        }

        // Get all badges for this learner
        const { data: badges, error: badgesError } = await supabase
            .from('learner_badges')
            .select(`
                created_at,
                badge (
                    id,
                    name
                )
            `)
            .eq('learner', learner.id)
            .order('created_at', { ascending: false });

        console.log('Badges query result:', { badges, error: badgesError });

        if (badgesError) {
            throw badgesError;
        }

        return NextResponse.json({
            status: 'OK',
            badges: badges
        });

    } catch (error) {
        console.error('Error fetching learner badges:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error fetching badges'
        }, { status: 500 });
    }
}

// POST to assign a badge to a learner
export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { uid, badge_id } = data;

        if (!uid || !badge_id) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Missing required fields: uid and badge_id'
            }, { status: 400 });
        }

        // First get the learner ID
        const { data: learner, error: learnerError } = await supabase
            .from('learner')
            .select('id')
            .eq('uid', uid)
            .single();

        if (learnerError || !learner) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner not found'
            }, { status: 404 });
        }

        // Check if badge exists
        console.log('Searching for badge with ID:', badge_id);

        // Test query to check table structure and permissions
        const { data: allBadges, error: testError } = await supabase
            .from('badge')
            .select('count');
        console.log('Count query result:', { allBadges, error: testError });

        const { data: badgeTest } = await supabase
            .from('badge')
            .select('*');
        console.log('All badges:', badgeTest);

        const { data: badge, error: badgeError } = await supabase
            .from('badge')
            .select('id, name')
            .eq('id', badge_id)
            .single();

        console.log('Badge query result:', { badge, error: badgeError });

        if (badgeError || !badge) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Badge not found',
                debug: {
                    badge_id,
                    error: badgeError
                }
            }, { status: 404 });
        }

        // Check if learner already has this badge
        const { data: existingBadge, error: existingError } = await supabase
            .from('learner_badges')
            .select('id')
            .eq('learner', learner.id)
            .eq('badge', badge_id)
            .single();

        if (existingBadge) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner already has this badge'
            }, { status: 400 });
        }

        // Assign the badge to the learner
        const { error: assignError } = await supabase
            .from('learner_badges')
            .insert([{
                learner: learner.id,
                badge: badge_id,
                created_at: new Date().toISOString()
            }]);

        if (assignError) {
            throw assignError;
        }

        return NextResponse.json({
            status: 'OK',
            message: 'Badge assigned successfully'
        });

    } catch (error) {
        console.error('Error assigning badge:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error assigning badge'
        }, { status: 500 });
    }
} 