import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Grade {
    id: number;
    number: number;
    active: boolean;
}

interface Learner {
    id: number;
    uid: string;
    terms?: string;
    curriculum?: string;
    grade: Grade;
}

interface Result {
    id: number;
    outcome: string;
    created: string;
}

interface Question {
    id: number;
    results: Result[];
}

interface SubjectWithQuestions {
    id: number;
    name: string;
    active: boolean;
    questions: Question[];
}

interface SubjectResponse {
    id: number;
    name: string;
    active: boolean;
    question_count: number;
    result_count: number;
    correct_count: number;
}

export async function GET(request: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');

        if (!uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'UID is required'
            }, { status: 400 });
        }

        // Get learner with grade information
        const { data: learner, error: learnerError } = await supabase
            .from('learner')
            .select(`
                *,
                grade:grade (
                    id,
                    number,
                    active
                )
            `)
            .eq('uid', uid)
            .single();

        if (learnerError || !learner) {
            console.error('Error fetching learner:', learnerError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner not found'
            }, { status: 404 });
        }

        if (!learner.grade) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Grade not found'
            }, { status: 404 });
        }

        // Parse learner's curriculum and terms
        const learnerTerms = learner.terms ? learner.terms.split(',').map((term: string) => term.trim()) : [];
        const learnerCurriculum = learner.curriculum ? learner.curriculum.split(',').map((curr: string) => curr.trim()) : [];

        // First get all active subjects for the grade
        const { data: subjects, error: subjectsError } = await supabase
            .from('subject')
            .select(`
                id,
                name,
                active,
                questions:question(
                    id,
                    results:result(
                        id,
                        outcome,
                        created
                    )
                )
            `)
            .eq('grade', learner.grade.id)
            .eq('active', true)
            .eq('questions.active', true)
            .eq('questions.status', 'approved')
            .eq('questions.results.learner', learner.id)
            .in('questions.curriculum', learnerCurriculum)
            .in('questions.term', learnerTerms)
            .order('name');

        if (subjectsError) {
            console.error('Error fetching subjects:', subjectsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching subjects'
            }, { status: 500 });
        }

        // Transform the response to include question and result counts
        const subjectsWithCounts: SubjectResponse[] = (subjects as SubjectWithQuestions[] || []).map(subject => {
            const questions = subject.questions || [];
            const results = questions.flatMap(q => q.results || []);

            return {
                id: subject.id,
                name: subject.name,
                active: subject.active,
                question_count: questions.length,
                result_count: results.length,
                correct_count: results.filter(r => r.outcome === 'correct').length
            };
        });

        return NextResponse.json({
            status: 'OK',
            subjects: subjectsWithCounts
        });

    } catch (error) {
        console.error('Error getting learner subjects:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting learner subjects',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 