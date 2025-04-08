import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { text, voice, speed } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'tts-1',
                input: text,
                voice: voice || 'alloy',
                speed: speed || 1.0
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate speech');
        }

        // Get the audio data as a buffer
        const audioData = await response.arrayBuffer();

        // Return the audio data with appropriate headers
        return new NextResponse(audioData, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioData.byteLength.toString(),
            },
        });
    } catch (error) {
        console.error('Text-to-speech error:', error);
        return NextResponse.json(
            { error: 'Failed to convert text to speech' },
            { status: 500 }
        );
    }
} 