
import { NextResponse } from 'next/server';
import OpenAI from 'openai';


// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const schoolName = searchParams.get('school_name');

        if (!schoolName) {
            return NextResponse.json({
                status: 'NOK',
                message: 'School name is required'
            }, { status: 400 });
        }

        const prompt = `Search for and provide an interesting fact about ${schoolName}, including historical milestones, notable alumni, unique traditions, or academic achievements. keep the response small, less than 20 words`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 50
        });

        const fact = completion.choices[0]?.message?.content;

        if (!fact) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Could not generate school fact'
            }, { status: 500 });
        }

        return NextResponse.json({
            status: 'OK',
            fact: fact.trim()
        });

    } catch (error) {
        console.error('Error getting school fact:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting school fact',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 