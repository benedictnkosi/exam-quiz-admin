import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    try {
        // Get the date parameter from URL
        const { searchParams } = new URL(request.url);
        const fromDate = searchParams.get('fromDate');

        // Validate date parameter
        if (!fromDate) {
            return NextResponse.json({
                status: 'NOK',
                message: 'fromDate parameter is required (YYYY-MM-DD format)'
            }, { status: 400 });
        }

        // Fetch questions with their subject and capturer information
        const { data, error } = await supabase
            .from('question')
            .select(`
                id,
                subject (
                    id,
                    name,
                    grade (
                        id,
                        number
                    )
                ),
                capturer (
                    id,
                    name
                ),
                created
            `)
            .gte('created', fromDate)
            .order('subject.name', { ascending: false });

        if (error) {
            console.error('Supabase error:', error.message);
            return NextResponse.json({
                status: 'NOK',
                message: error.message
            }, { status: 500 });
        }

        // Process the data to group by subject and capturer
        const statistics = data.reduce((acc: any, question: any) => {
            const subjectId = question.subject.id;
            const capturerId = question.capturer.id;

            if (!acc[subjectId]) {
                acc[subjectId] = {
                    subjectName: question.subject.name,
                    grade: question.subject.grade.number,
                    capturers: {}
                };
            }

            if (!acc[subjectId].capturers[capturerId]) {
                acc[subjectId].capturers[capturerId] = {
                    capturerName: question.capturer.name,
                    questionCount: 0
                };
            }

            acc[subjectId].capturers[capturerId].questionCount++;
            return acc;
        }, {});

        // Transform the data into a more readable format
        const formattedStats = Object.entries(statistics).map(([subjectId, subjectData]: [string, any]) => ({
            subjectId: parseInt(subjectId),
            subjectName: subjectData.subjectName,
            grade: subjectData.grade,
            capturers: Object.entries(subjectData.capturers).map(([capturerId, capturerData]: [string, any]) => ({
                capturerId: parseInt(capturerId),
                capturerName: capturerData.capturerName,
                questionCount: capturerData.questionCount
            }))
        }));

        return NextResponse.json({
            status: 'OK',
            fromDate,
            statistics: formattedStats
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Server error:', errorMessage);
        return NextResponse.json({
            status: 'NOK',
            message: 'Internal Server Error'
        }, { status: 500 });
    }
} 