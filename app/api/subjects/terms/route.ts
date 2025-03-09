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
        const subjectId = searchParams.get('subject_id');

        if (!subjectId) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Subject ID is required'
            }, { status: 400 });
        }

        // Get subject details
        const { data: subject, error: subjectError } = await supabase
            .from('subject')
            .select(`
                id,
                name,
                terms,
                curriculum,
                grade:grade_id(
                    id,
                    number,
                    name
                )
            `)
            .eq('id', subjectId)
            .single();

        if (subjectError || !subject) {
            console.error('Error fetching subject:', subjectError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Subject not found'
            }, { status: 404 });
        }

        // Get questions per term
        const { data: questions, error: questionsError } = await supabase
            .from('question')
            .select('id, term')
            .eq('subject_id', subjectId)
            .eq('active', true)
            .eq('status', 'approved');

        if (questionsError) {
            console.error('Error fetching questions:', questionsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching questions'
            }, { status: 500 });
        }

        // Process terms
        const terms = subject.terms ? subject.terms.split(',').map(t => t.trim()) : [];
        const curriculum = subject.curriculum ? subject.curriculum.split(',').map(c => c.trim()) : [];

        // Count questions per term
        const termStats = terms.reduce((acc: { [key: string]: number }, term) => {
            acc[term] = questions.filter(q => q.term === term).length;
            return acc;
        }, {});

        return NextResponse.json({
            status: 'OK',
            subject: {
                id: subject.id,
                name: subject.name,
                grade: subject.grade,
                curriculum: curriculum,
                terms: terms.map(term => ({
                    term,
                    question_count: termStats[term] || 0
                }))
            }
        });

    } catch (error) {
        console.error('Error in getSubjectTerms:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting subject terms',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 