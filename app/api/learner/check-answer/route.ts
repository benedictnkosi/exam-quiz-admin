import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { uid, question_id, answer, duration } = data;

        if (!uid || !question_id || answer === undefined) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Missing required fields: uid, question_id, and answer are required'
            }, { status: 400 });
        }

        // Get the learner
        const { data: learner, error: learnerError } = await supabase
            .from('learner')
            .select('id, name, grade')
            .eq('uid', uid)
            .single();

        if (learnerError || !learner) {
            console.error('Error fetching learner:', learnerError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner not found'
            }, { status: 404 });
        }

        // Get the question
        const { data: question, error: questionError } = await supabase
            .from('question')
            .select(`
                id, 
                question, 
                type, 
                answer,
                explanation,
                subject(
                    id,
                    name
                )
            `)
            .eq('id', question_id)
            .single();

        if (questionError || !question) {
            console.error('Error fetching question:', questionError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Question not found'
            }, { status: 404 });
        }

        // Normalize the answers for comparison
        const normalizeAnswer = (ans: string): string => {
            // Remove whitespace, convert to lowercase
            return ans.trim().toLowerCase()
                // Remove quotes
                .replace(/['"]/g, '')
                // Remove leading/trailing brackets
                .replace(/^\[|\]$/g, '')
                // Handle numeric answers: remove spaces, commas in numbers
                .replace(/\s/g, '')
                .replace(/,(?=\d)/g, '.');
        };

        // Get the correct answer(s)
        let correctAnswer = question.answer;
        if (typeof correctAnswer === 'string') {
            try {
                // Try to parse if it's a JSON string
                correctAnswer = JSON.parse(correctAnswer);
            } catch (e) {
                // If not JSON, keep as is
            }
        }

        // Handle array of answers
        let correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
        correctAnswers = correctAnswers.map(normalizeAnswer);

        // Normalize the submitted answer
        const normalizedSubmittedAnswer = normalizeAnswer(answer);

        // Check if the answer is correct
        const isCorrect = correctAnswers.some(ans => normalizedSubmittedAnswer === ans);

        // Record the answer in the database
        const answerRecord = {
            learner: learner.id,
            question: question.id,
            outcome: isCorrect ? 'correct' : 'incorrect',
            created: new Date().toISOString(),
            duration: duration
        };

        const { error: recordError } = await supabase
            .from('result')
            .insert([answerRecord]);

        if (recordError) {
            console.error('Error recording answer:', recordError);
            // Continue anyway, don't fail the request
        }

        // Update learner points
        const pointsChange = isCorrect ? 1 : -1;
        let newPoints = 0;
        const { data: currentLearner, error: learnerFetchError } = await supabase
            .from('learner')
            .select('points, streak, streak_last_updated')
            .eq('id', learner.id)
            .single();

        if (!learnerFetchError && currentLearner) {
            newPoints = Math.max(0, (currentLearner.points || 0) + pointsChange);
            const { error: updateError } = await supabase
                .from('learner')
                .update({ points: newPoints })
                .eq('id', learner.id);

            if (updateError) {
                console.error('Error updating learner points:', updateError);
                // Continue anyway, don't fail the request
            }

            // Check for streak update
            if (isCorrect) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Check if streak was already updated today
                const lastUpdated = currentLearner.streak_last_updated ? new Date(currentLearner.streak_last_updated) : null;
                const wasUpdatedToday = lastUpdated && lastUpdated >= today;

                if (!wasUpdatedToday) {
                    const { data: todayResults, error: resultsError } = await supabase
                        .from('result')
                        .select('outcome')
                        .eq('learner', learner.id)
                        .gte('created', today.toISOString())
                        .eq('outcome', 'correct');

                    if (!resultsError && todayResults && todayResults.length >= 3) {
                        const { error: streakError } = await supabase
                            .from('learner')
                            .update({
                                streak: (currentLearner.streak || 0) + 1,
                                streak_last_updated: new Date().toISOString()
                            })
                            .eq('id', learner.id);

                        if (streakError) {
                            console.error('Error updating streak:', streakError);
                        }
                    }
                }
            }
        }

        return NextResponse.json({
            status: 'OK',
            correct: isCorrect,
            explanation: question.explanation,
            correctAnswer: question.answer,
            points: newPoints,
            message: isCorrect ? 'Correct answer!' : 'Incorrect answer',
            subject: question.subject && typeof question.subject === 'object' ?
                // If it's an array, get first element, otherwise use the object itself
                (Array.isArray(question.subject) ?
                    question.subject[0]?.name :
                    (question.subject as { name: string }).name) : null
        });

    } catch (error: unknown) {
        console.error('Error in checkLearnerAnswer:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error checking answer',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 