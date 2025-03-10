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

// Define OpenAI message types
type ContentItem = {
    type: "text" | "image_url";
    text?: string;
    image_url?: { url: string };
};

type Message = {
    role: "system" | "user" | "assistant";
    content: string | ContentItem[];
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const questionId = searchParams.get('questionId');

        if (!questionId) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Question ID is required'
            }, { status: 400 });
        }

        // Get question from Supabase
        const { data: question, error: questionError } = await supabase
            .from('question')
            .select('*')
            .eq('id', questionId)
            .single();

        if (questionError || !question) {
            console.error('Error fetching question:', questionError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Question not found'
            }, { status: 404 });
        }

        // If question already has an AI explanation, return it
        if (question.ai_explanation) {
            return NextResponse.json({
                status: 'OK',
                explanation: question.ai_explanation
            });
        }

        // Prepare messages for OpenAI
        const messages: Message[] = [
            {
                role: "system",
                content: "You are an AI tutor for students aged 13, that creates lessons to questions based on their context. Follow these rules:\n1. Read the provided context and analyze any accompanying images.\n2. Understand the question and the correct answer.\n3. Format the explanation as **bullet points**.\n4. reference the context and images in your explanation.\n5 have headings in your explanation. make it long as detailed. \n6 at the end, add a small bite size key lesson, prefixed with ***. less than 20 words. \n7 make the lesson fun and add emojis where suitable"
            },
            {
                role: "user",
                content: [] as ContentItem[]
            }
        ];

        // Cast the content to the proper type to avoid TypeScript errors
        const userContent = messages[1].content as ContentItem[];

        // Add question context
        if (question.context) {
            userContent.push({
                type: "text",
                text: "Context: " + question.context
            });
        } else {
            userContent.push({
                type: "text",
                text: "Context: Choose an Answer that matches the description."
            });
        }

        // Add question text
        userContent.push({
            type: "text",
            text: "Question: " + question.question
        });

        // Add correct answer
        userContent.push({
            type: "text",
            text: "Correct Answer: " + question.answer
        });

        // Add image if exists
        if (question.image_path && question.image_path !== 'NULL' && question.image_path !== '') {
            const { data: { publicUrl } } = supabase.storage
                .from('question_images')
                .getPublicUrl(question.image_path);

            userContent.push({
                type: "image_url",
                image_url: { url: publicUrl }
            });
        }

        // Add question image if exists
        if (question.question_image_path && question.question_image_path !== 'NULL' && question.question_image_path !== '') {
            const { data: { publicUrl } } = supabase.storage
                .from('question_images')
                .getPublicUrl(question.question_image_path);

            userContent.push({
                type: "image_url",
                image_url: { url: publicUrl }
            });
        }

        // Call OpenAI API
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages as any // Type assertion needed due to OpenAI SDK typing
        });

        const explanation = response.choices[0]?.message?.content || '';

        if (!explanation) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Invalid response from OpenAI'
            }, { status: 500 });
        }

        // Update question with AI explanation
        const { error: updateError } = await supabase
            .from('question')
            .update({ ai_explanation: explanation })
            .eq('id', questionId);

        if (updateError) {
            console.error('Error updating question:', updateError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error updating question with AI explanation'
            }, { status: 500 });
        }

        return NextResponse.json({
            status: 'OK',
            explanation: explanation
        });

    } catch (error) {
        console.error('Error generating AI explanation:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error generating explanation',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 