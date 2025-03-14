import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Special admin users
const SPECIAL_ADMINS = ['Lethabo Mathabatha', 'dee61004', 'Benedict Nkosi'];

export async function GET(request: Request) {
    try {
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const subjectName = searchParams.get('subject_name');
        const paperName = searchParams.get('paper_name');
        const uid = searchParams.get('uid');
        const questionId = searchParams.get('question_id');

        if (!subjectName || !paperName || !uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Missing required parameters'
            }, { status: 400 });
        }

        // Get the learner
        const { data: learner, error: learnerError } = await supabase
            .from('learner')
            .select('*, grade(*)')
            .eq('uid', uid)
            .single();

        if (learnerError || !learner) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner not found',
                error: learnerError?.message
            }, { status: 404 });
        }

        if (questionId && questionId !== '0') {
            const { data: question, error: questionError } = await supabase
                .from('question')
                .select('*')
                .eq('id', questionId)
                .single();

            if (questionError || !question) {
                return NextResponse.json({
                    status: 'NOK',
                    message: 'Question not found',
                    error: questionError?.message
                }, { status: 404 });
            }

            return NextResponse.json(question);
        }

        // Handle admin case
        if (learner.role === 'admin' && !SPECIAL_ADMINS.includes(learner.name)) {
            // Find capturer with same email but different uid
            const { data: capturer } = await supabase
                .from('learner')
                .select('*')
                .eq('email', learner.email)
                .neq('uid', learner.uid)
                .single();

            if (!capturer) {
                return NextResponse.json({
                    status: 'NOK',
                    message: 'Capturer not found'
                }, { status: 404 });
            }

            // Get questions for admin review
            const { data: adminQuestions } = await supabase
                .from('question')
                .select('*, subject(*)')
                .eq('subject.name', `${subjectName} ${paperName}`)
                .eq('active', true)
                .eq('status', 'new')
                .eq('capturer', capturer.id);

            if (!adminQuestions?.length) {
                return NextResponse.json({
                    status: 'NOK',
                    message: 'No new questions found for review',
                    context: '',
                    image_path: ''
                }, { status: 404 });
            }

            // Shuffle questions and get first one
            const randomQuestion = shuffleArray(adminQuestions)[0];
            if (randomQuestion.options) {
                randomQuestion.options = shuffleArray(randomQuestion.options);
            }

            return NextResponse.json(randomQuestion);
        }

        // Handle regular learner case
        if (!learner.grade) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner grade not found'
            }, { status: 404 });
        }

        // First get the subject ID
        const { data: subject, error: subjectError } = await supabase
            .from('subject')
            .select('id')
            .eq('name', `${subjectName} ${paperName}`)
            .eq('grade', learner.grade.id)
            .single();

        if (subjectError || !subject) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Subject not found'
            }, { status: 404 });
        }

        // Build query for regular learner using subject ID
        const query = supabase
            .from('question')
            .select('*, subject(*)')
            .eq('subject', subject.id)
            .eq('active', true)
            .eq('status', 'approved');

        // Get questions
        const { data: questions, error: questionsError } = await query;

        if (questionsError || !questions?.length) {
            return NextResponse.json({
                status: 'NOK',
                message: 'No more questions available',
                context: '',
                image_path: '',
                error: questionsError?.message
            }, { status: 404 });
        }

        // Get random question and shuffle options
        const randomQuestion = shuffleArray(questions)[0];
        if (randomQuestion.options) {
            try {
                // Handle options whether they're a string or an object
                const options = typeof randomQuestion.options === 'string'
                    ? JSON.parse(randomQuestion.options)
                    : randomQuestion.options;

                if (Array.isArray(options)) {
                    randomQuestion.options = shuffleArray(options);
                } else if (typeof options === 'object') {
                    // If options is an object with option1, option2, etc.
                    const optionsArray = Object.values(options);
                    const shuffledArray = shuffleArray(optionsArray);
                    randomQuestion.options = Object.keys(options).reduce((acc, key, index) => ({
                        ...acc,
                        [key]: shuffledArray[index]
                    }), {});
                }
            } catch (e) {
                console.error('Error shuffling options:', e);
                // Keep original options if there's an error
            }
        }

        return NextResponse.json(randomQuestion);

    } catch (error) {
        console.error('Error getting random question:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting random question',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Helper function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Since we're not using the getMasteredQuestionIds function, let's comment it out
/*
// Define an interface for the result object
interface QuestionResult {
    question: number;
    created: string;
    [key: string]: unknown; // For any other properties
}

// Helper function to get mastered question IDs
function getMasteredQuestionIds(results: QuestionResult[]): number[] {
    const questionAttempts: { [key: string]: Date[] } = {};

    // Group attempts by question
    results.forEach(result => {
        if (!questionAttempts[result.question]) {
            questionAttempts[result.question] = [];
        }
        questionAttempts[result.question].push(new Date(result.created));
    });

    // Find questions with 3 consecutive correct answers
    return Object.entries(questionAttempts)
        .filter(([_questionId, attempts]) => { // Prefix with underscore to indicate it's not used
            if (attempts.length < 3) return false;

            // Sort attempts by date
            attempts.sort((a, b) => b.getTime() - a.getTime());

            // Check for 3 consecutive attempts
            for (let i = 0; i < attempts.length - 2; i++) {
                if (attempts[i] > attempts[i + 1] && attempts[i + 1] > attempts[i + 2]) {
                    return true;
                }
            }
            return false;
        })
        .map(([questionId]) => parseInt(questionId));
}
*/ 