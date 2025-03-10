import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const REQUIRED_DAILY_QUESTIONS = 1;

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const { uid } = await request.json();

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

        // Get or create streak
        const { data: streak, error: streakError } = await supabase
            .from('learner_streak')
            .select('*')
            .eq('learner', learner.id)
            .single();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (streakError && streakError.code === 'PGRST116') {
            // Streak doesn't exist, create new one
            const { error: createError } = await supabase
                .from('learner_streak')
                .insert([{
                    learner: learner.id,
                    current_streak: 0,
                    longest_streak: 0,
                    questions_answered_today: 1,
                    last_answered_at: new Date().toISOString(),
                    last_streak_update_date: today.toISOString()
                }])
                .select()
                .single();

            if (createError) {
                throw createError;
            }

            return NextResponse.json({
                status: 'OK',
                data: {
                    currentStreak: 0,
                    longestStreak: 0,
                    questionsAnsweredToday: 1,
                    questionsNeededToday: REQUIRED_DAILY_QUESTIONS - 1,
                    streakMaintained: 1 >= REQUIRED_DAILY_QUESTIONS
                }
            });
        }

        if (streakError) {
            throw streakError;
        }

        // Update streak status
        const lastUpdate = new Date(streak.last_streak_update_date);
        lastUpdate.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let currentStreak = streak.current_streak;
        let questionsAnsweredToday = streak.questions_answered_today;

        if (lastUpdate.getTime() !== today.getTime()) {
            // Check if yesterday's goal was met
            if (lastUpdate.getTime() === yesterday.getTime() &&
                streak.questions_answered_today < REQUIRED_DAILY_QUESTIONS) {
                currentStreak = 0;
            }
            questionsAnsweredToday = 0;
        }

        // Increment questions answered today
        questionsAnsweredToday++;

        // Update streak if daily goal is met
        if (questionsAnsweredToday === REQUIRED_DAILY_QUESTIONS) {
            currentStreak++;
        }

        const longestStreak = Math.max(streak.longest_streak, currentStreak);

        // Update streak record
        const { error: updateError } = await supabase
            .from('learner_streak')
            .update({
                current_streak: currentStreak,
                longest_streak: longestStreak,
                questions_answered_today: questionsAnsweredToday,
                last_answered_at: new Date().toISOString(),
                last_streak_update_date: today.toISOString()
            })
            .eq('learner', learner.id);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({
            status: 'OK',
            data: {
                currentStreak,
                longestStreak,
                questionsAnsweredToday,
                questionsNeededToday: Math.max(0, REQUIRED_DAILY_QUESTIONS - questionsAnsweredToday),
                streakMaintained: questionsAnsweredToday >= REQUIRED_DAILY_QUESTIONS
            }
        });

    } catch (error) {
        console.error('Error tracking streak:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error tracking streak',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 