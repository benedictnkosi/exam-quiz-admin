import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
});

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const count = parseInt(searchParams.get('count') || '10');

        // Get questions with images that haven't been processed
        const { data: questions, error: questionsError } = await supabase
            .from('question')
            .select('*')
            .not('image_path', 'is', null)
            .not('image_path', 'eq', '')
            .eq('active', true)
            .eq('status', 'approved')
            .eq('comment', 'new')
            .limit(count);

        if (questionsError) {
            console.error('Error fetching questions:', questionsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching questions'
            }, { status: 500 });
        }

        let rejectedCount = 0;
        const processedQuestions = [];

        for (const question of questions) {
            try {
                if (!question.image_path) {
                    console.log("No image path found for question:", question.id);
                    continue;
                }

                // Get public URL for the image
                const { data: { publicUrl } } = supabase.storage
                    .from('question_images')
                    .getPublicUrl(question.image_path);

                // Check image with OpenAI Vision model
                const response = await openai.chat.completions.create({
                    model: "gpt-4-vision-preview",
                    messages: [
                        {
                            role: "system",
                            content: "You are an AI that checks if an image contains only text. Return true if the image contains only text, return false if the image contains any objects, diagrams, or mixed content."
                        },
                        {
                            role: "user",
                            content: [
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: publicUrl
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 50
                });

                const isTextOnly = response.choices[0]?.message?.content?.toLowerCase().includes('true');

                if (isTextOnly) {
                    processedQuestions.push({
                        id: question.id,
                        status: 'rejected',
                        comment: 'Rejected by AI: Image is text only'
                    });
                    rejectedCount++;
                } else {
                    processedQuestions.push({
                        id: question.id,
                        comment: 'Image checked by AI: Image is not text only'
                    });
                }

            } catch (e) {
                console.error('Error processing question:', question.id, e);
                continue;
            }
        }

        // Update processed questions
        if (processedQuestions.length > 0) {
            const { error: updateError } = await supabase
                .from('question')
                .upsert(processedQuestions);

            if (updateError) {
                console.error('Error updating questions:', updateError);
                return NextResponse.json({
                    status: 'NOK',
                    message: 'Error updating questions'
                }, { status: 500 });
            }
        }

        return NextResponse.json({
            status: 'OK',
            message: `Rejected ${rejectedCount} questions with text-only images`,
            rejected_count: rejectedCount,
            total_processed: processedQuestions.length
        });

    } catch (error) {
        console.error('Error processing question images:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error processing question images',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 