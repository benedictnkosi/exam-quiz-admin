import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        // Get all approved questions that are multiple choice or multi-select
        const { data: questions, error: questionsError } = await supabase
            .from('question')
            .select('*')
            .in('type', ['multiple_choice', 'multi_select'])
            .eq('status', 'approved')
            .eq('active', true);

        if (questionsError) {
            console.error('Error fetching questions:', questionsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching questions'
            }, { status: 500 });
        }

        let rejectedCount = 0;
        const batchSize = 100;
        const rejectedQuestions = [];

        for (const question of questions) {
            try {
                const options = question.options;
                const answer = typeof question.answer === 'string' ?
                    JSON.parse(question.answer) :
                    question.answer;

                // Skip if no options or answer
                if (!options || !answer || !Array.isArray(answer)) {
                    continue;
                }

                // Get correct answer length
                const correctAnswerLength = answer[0].length;
                const avgCorrectLength = correctAnswerLength / answer.length;

                // Calculate average length of incorrect options
                const incorrectLengths = [];
                let numberOfIncorrectOptions = 0;

                Object.values(options).forEach((option: any) => {
                    if (!answer.includes(option)) {
                        incorrectLengths.push(option.length);
                        numberOfIncorrectOptions++;
                    }
                });

                if (numberOfIncorrectOptions === 4) {
                    console.log("No correct option found for question:", question.id);
                    continue;
                }

                if (incorrectLengths.length === 0) {
                    console.log("No incorrect options found for question:", question.id);
                    continue;
                }

                const avgIncorrectLength = incorrectLengths.reduce((a, b) => a + b, 0) / incorrectLengths.length;

                // Reject if average incorrect length is more than 20 chars shorter
                if ((avgCorrectLength - avgIncorrectLength) > 20) {
                    rejectedQuestions.push({
                        id: question.id,
                        status: 'rejected',
                        comment: `Auto-rejected: answer length is ${avgCorrectLength} and average incorrect length is ${avgIncorrectLength}`
                    });
                    rejectedCount++;
                }

                // Update in batches
                if (rejectedQuestions.length >= batchSize) {
                    const { error: updateError } = await supabase
                        .from('question')
                        .upsert(rejectedQuestions);

                    if (updateError) {
                        console.error('Error updating questions:', updateError);
                    }
                    rejectedQuestions.length = 0;
                }
            } catch (e) {
                console.error('Error processing question:', question.id, e);
                continue;
            }
        }

        // Update remaining questions
        if (rejectedQuestions.length > 0) {
            const { error: updateError } = await supabase
                .from('question')
                .upsert(rejectedQuestions);

            if (updateError) {
                console.error('Error updating final batch of questions:', updateError);
            }
        }

        return NextResponse.json({
            status: 'OK',
            message: `Auto-rejected ${rejectedCount} questions`,
            rejected_count: rejectedCount
        });

    } catch (error) {
        console.error('Error in auto-reject process:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error auto-rejecting questions',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 