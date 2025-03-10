import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    try {
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');
        const subjectName = searchParams.get('subject_name');
        const paperName = searchParams.get('paper_name');

        if (!uid || !subjectName || !paperName) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Missing required parameters'
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

        // Get all results for the subject and paper
        const { data: results, error: resultsError } = await supabase
            .from('result')
            .select(`
                *,
                question:question(
                    id,
                    question,
                    answer,
                    options,
                    explanation,
                    subject:subject(name)
                )
            `)
            .eq('learner', learner.id)
            .eq('question.subject.name', `${subjectName} ${paperName}`)
            .order('created', { ascending: false });

        if (resultsError) {
            console.error('Error fetching results:', resultsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching results'
            }, { status: 500 });
        }

        // Process results
        const processedResults = results.map(result => {
            const options = typeof result.question.options === 'string'
                ? JSON.parse(result.question.options)
                : result.question.options;

            return {
                id: result.id,
                question: result.question,
                answer: result.question.answer,
                options: options,
                explanation: result.question.explanation,
                outcome: result.outcome,
                created: result.created
            };
        });

        return NextResponse.json({
            status: 'OK',
            results: processedResults
        });

    } catch (error) {
        console.error('Error in getLearnerResults:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting results',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 