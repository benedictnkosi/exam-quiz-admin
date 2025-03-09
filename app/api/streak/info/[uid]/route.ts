import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const REQUIRED_DAILY_QUESTIONS = 1;

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
    request: Request,
    { params }: { params: { uid: string } }
) {
    try {
        const uid = params.uid;

        if (!uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner UID is required'
            }, { status: 400 });
        }

        // Get learner
        const { data: learner, error: learnerError } = await supabase
            .from('learner')
            .select('id')
            .eq('uid', uid)
            .single();

        if (learnerError || !learner) {
            console.error('Error fetching learner:', learnerError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner not found'
            }, { status: 404 });
        }

        // Get streak info
        const { data: streak, error: streakError } = await supabase
            .from('learner_streak')
            .select('*')
            .eq('learner_id', learner.id)
            .single();

        // If no streak exists, return default values
        if (streakError && streakError.code === 'PGRST116') {
            return NextResponse.json({
                status: 'OK',
                data: {
                    currentStreak: 0,
                    longestStreak: 0,
                    questionsAnsweredToday: 0,
                    questionsNeededToday: REQUIRED_DAILY_QUESTIONS,
                    streakMaintained: false
                }
            });
        }

        if (streakError) {
            throw streakError;
        }

        // Update streak status if needed
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastUpdate = new Date(streak.last_streak_update_date);
        lastUpdate.setHours(0, 0, 0, 0);

        let currentStreak = streak.current_streak;
        let questionsAnsweredToday = streak.questions_answered_today;

        if (lastUpdate.getTime() !== today.getTime()) {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            // Check if yesterday's goal was met
            if (lastUpdate.getTime() === yesterday.getTime() &&
                streak.questions_answered_today < REQUIRED_DAILY_QUESTIONS) {
                currentStreak = 0;
            }
            questionsAnsweredToday = 0;

            // Update the streak record
            const { error: updateError } = await supabase
                .from('learner_streak')
                .update({
                    current_streak: currentStreak,
                    questions_answered_today: questionsAnsweredToday,
                    last_streak_update_date: today.toISOString()
                })
                .eq('learner_id', learner.id);

            if (updateError) {
                throw updateError;
            }
        }

        return NextResponse.json({
            status: 'OK',
            data: {
                currentStreak,
                longestStreak: streak.longest_streak,
                questionsAnsweredToday,
                questionsNeededToday: Math.max(0, REQUIRED_DAILY_QUESTIONS - questionsAnsweredToday),
                streakMaintained: questionsAnsweredToday >= REQUIRED_DAILY_QUESTIONS
            }
        });

    } catch (error) {
        console.error('Error getting streak info:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting streak info',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 