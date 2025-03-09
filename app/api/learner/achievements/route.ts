import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Achievement definitions
const ACHIEVEMENTS = {
    FIRST_CORRECT: { id: 'first_correct', name: 'First Correct Answer', description: 'Got your first question right!' },
    PERFECT_DAY: { id: 'perfect_day', name: 'Perfect Day', description: 'Got all questions correct in a day' },
    MASTERY_5: { id: 'mastery_5', name: 'Subject Expert', description: 'Mastered 5 questions in a subject' },
    STREAK_7: { id: 'streak_7', name: 'Week Warrior', description: 'Answered questions 7 days in a row' },
    SPEED_DEMON: { id: 'speed_demon', name: 'Speed Demon', description: 'Answered 10 questions correctly in under 30 minutes' }
};

export async function GET(request: Request) {
    try {
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');

        if (!uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'UID is required'
            }, { status: 400 });
        }

        // Get the learner
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

        // Get all results for the learner
        const { data: results, error: resultsError } = await supabase
            .from('result')
            .select(`
                *,
                question:question_id(
                    subject:subject_id(name)
                )
            `)
            .eq('learner_id', learner.id)
            .order('created', { ascending: true });

        if (resultsError) {
            console.error('Error fetching results:', resultsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching results'
            }, { status: 500 });
        }

        const achievements = [];
        const subjectMastery: { [key: string]: number } = {};
        const dailyStats: { [key: string]: { total: number, correct: number } } = {};
        let lastAttemptDate: Date | null = null;
        let currentStreak = 0;
        let maxStreak = 0;

        // Process results
        results.forEach(result => {
            const date = new Date(result.created).toISOString().split('T')[0];
            const subjectName = result.question.subject.name.split(' ')[0];

            // First correct achievement
            if (result.outcome === 'correct' && !achievements.includes(ACHIEVEMENTS.FIRST_CORRECT.id)) {
                achievements.push(ACHIEVEMENTS.FIRST_CORRECT.id);
            }

            // Track daily stats
            if (!dailyStats[date]) {
                dailyStats[date] = { total: 0, correct: 0 };
            }
            dailyStats[date].total++;
            if (result.outcome === 'correct') {
                dailyStats[date].correct++;
            }

            // Track subject mastery
            if (result.outcome === 'correct') {
                subjectMastery[subjectName] = (subjectMastery[subjectName] || 0) + 1;
                if (subjectMastery[subjectName] >= 5 && !achievements.includes(ACHIEVEMENTS.MASTERY_5.id)) {
                    achievements.push(ACHIEVEMENTS.MASTERY_5.id);
                }
            }

            // Calculate streaks
            const currentDate = new Date(date);
            if (lastAttemptDate) {
                const dayDiff = Math.floor((currentDate.getTime() - lastAttemptDate.getTime()) / (1000 * 60 * 60 * 24));
                if (dayDiff === 1) {
                    currentStreak++;
                } else if (dayDiff > 1) {
                    currentStreak = 1;
                }
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
            lastAttemptDate = currentDate;
        });

        // Check for perfect days
        Object.values(dailyStats).forEach(stats => {
            if (stats.total >= 5 && stats.total === stats.correct) {
                if (!achievements.includes(ACHIEVEMENTS.PERFECT_DAY.id)) {
                    achievements.push(ACHIEVEMENTS.PERFECT_DAY.id);
                }
            }
        });

        // Check for streak achievement
        if (maxStreak >= 7 && !achievements.includes(ACHIEVEMENTS.STREAK_7.id)) {
            achievements.push(ACHIEVEMENTS.STREAK_7.id);
        }

        // Format achievements
        const formattedAchievements = achievements.map(id => {
            const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === id);
            return {
                id: achievement?.id,
                name: achievement?.name,
                description: achievement?.description,
                achieved: true
            };
        });

        // Add unachieved achievements
        Object.values(ACHIEVEMENTS).forEach(achievement => {
            if (!achievements.includes(achievement.id)) {
                formattedAchievements.push({
                    ...achievement,
                    achieved: false
                });
            }
        });

        return NextResponse.json({
            status: 'OK',
            achievements: {
                earned: achievements.length,
                total: Object.keys(ACHIEVEMENTS).length,
                current_streak: currentStreak,
                max_streak: maxStreak,
                items: formattedAchievements
            }
        });

    } catch (error) {
        console.error('Error in getLearnerAchievements:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting achievements',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 