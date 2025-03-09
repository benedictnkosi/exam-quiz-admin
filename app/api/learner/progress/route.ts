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
            .select('id, terms, curriculum')
            .eq('uid', uid)
            .single();

        if (learnerError || !learner) {
            console.error('Error fetching learner:', learnerError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner not found'
            }, { status: 404 });
        }

        // Get all questions for the subject and paper
        const { data: questions, error: questionsError } = await supabase
            .from('question')
            .select('id, term, curriculum')
            .eq('subject.name', `${subjectName} ${paperName}`)
            .eq('active', true)
            .eq('status', 'approved');

        if (questionsError) {
            console.error('Error fetching questions:', questionsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching questions'
            }, { status: 500 });
        }

        // Get learner's results
        const { data: results, error: resultsError } = await supabase
            .from('result')
            .select('question_id, outcome, created')
            .eq('learner_id', learner.id)
            .in('question_id', questions.map(q => q.id))
            .order('created', { ascending: false });

        if (resultsError) {
            console.error('Error fetching results:', resultsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching results'
            }, { status: 500 });
        }

        // Process learner's terms and curriculum
        const learnerTerms = learner.terms ? learner.terms.split(',').map(t => t.trim()) : [];
        const learnerCurriculum = learner.curriculum ? learner.curriculum.split(',').map(c => c.trim()) : [];

        // Filter questions by term and curriculum if specified
        const filteredQuestions = questions.filter(question => {
            const matchesTerm = learnerTerms.length === 0 || learnerTerms.includes(question.term);
            const matchesCurriculum = learnerCurriculum.length === 0 ||
                (question.curriculum && learnerCurriculum.some(c => question.curriculum.includes(c)));
            return matchesTerm && matchesCurriculum;
        });

        // Calculate mastery for each question
        const questionMastery = new Map<number, boolean>();
        const questionAttempts = new Map<number, { correct: number, total: number }>();

        // Initialize attempts counters
        filteredQuestions.forEach(q => {
            questionAttempts.set(q.id, { correct: 0, total: 0 });
        });

        // Process results
        results.forEach(result => {
            const attempts = questionAttempts.get(result.question_id);
            if (attempts) {
                attempts.total++;
                if (result.outcome === 'correct') {
                    attempts.correct++;
                }
            }
        });

        // Calculate mastery (3 consecutive correct answers)
        questionAttempts.forEach((attempts, questionId) => {
            questionMastery.set(questionId, attempts.correct >= 3);
        });

        // Calculate progress statistics
        const totalQuestions = filteredQuestions.length;
        const masteredQuestions = Array.from(questionMastery.values()).filter(Boolean).length;
        const progressPercentage = totalQuestions > 0 ? (masteredQuestions / totalQuestions) * 100 : 0;

        return NextResponse.json({
            status: 'OK',
            progress: {
                total_questions: totalQuestions,
                mastered_questions: masteredQuestions,
                progress_percentage: Math.round(progressPercentage),
                question_mastery: Object.fromEntries(questionMastery)
            }
        });

    } catch (error) {
        console.error('Error in getLearnerProgress:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting progress',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 