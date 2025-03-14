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
        const uid = searchParams.get('uid');
        const term = searchParams.get('term');
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!subjectId || !uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Subject ID and UID are required'
            }, { status: 400 });
        }

        // Get the learner
        const { data: learner, error: learnerError } = await supabase
            .from('learner')
            .select('id, role')
            .eq('uid', uid)
            .single();

        if (learnerError || !learner) {
            console.error('Error fetching learner:', learnerError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner not found'
            }, { status: 404 });
        }

        // Build query
        let query = supabase
            .from('question')
            .select(`
                *,
                subject:subject(
                    id,
                    name,
                    grade:grade(
                        id,
                        number,
                        name
                    )
                ),
                capturer:capturer(
                    id,
                    name,
                    email
                )
            `, { count: 'exact' })
            .eq('subject', subjectId);

        // Add filters
        if (term) {
            query = query.eq('term', term);
        }

        if (status) {
            query = query.eq('status', status);
        }

        // Add pagination
        const offset = (page - 1) * limit;
        query = query
            .range(offset, offset + limit - 1)
            .order('created', { ascending: false });

        // Execute query
        const { data: questions, error: questionsError, count } = await query;

        if (questionsError) {
            console.error('Error fetching questions:', questionsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching questions'
            }, { status: 500 });
        }

        // Get learner's results for these questions
        const { data: results, error: resultsError } = await supabase
            .from('result')
            .select('question, outcome, created')
            .eq('learner', learner.id)
            .in('question', questions.map(q => q.id))
            .order('created', { ascending: false });

        if (resultsError) {
            console.error('Error fetching results:', resultsError);
        }

        // Process questions
        const processedQuestions = questions.map(question => {
            // Get results for this question
            const questionResults = results?.filter(r => r.question === question.id) || [];
            const attempts = questionResults.length;
            const correctAttempts = questionResults.filter(r => r.outcome === 'correct').length;
            const lastAttempt = questionResults[0]?.created;

            // Process options
            let options = question.options;
            try {
                options = JSON.parse(question.options || '{}');
            } catch (e) {
                console.error('Error parsing options:', e);
            }

            // Define interface for question response
            interface QuestionResponse {
                id: number;
                question: string;
                options: Record<string, string>;
                term: number | string | null;
                curriculum: string | null;
                subject: number | string;
                attempts: number;
                correct_attempts: number;
                last_attempt: string | null;
                // Fields for admin/capturer
                answer?: string | null;
                explanation?: string | null;
                status?: string;
                active?: boolean;
                capturer?: number;
                created?: string;
                updated?: string;
            }

            // Base response
            const response: QuestionResponse = {
                id: question.id,
                question: question.question,
                options: options,
                term: question.term,
                curriculum: question.curriculum,
                subject: question.subject,
                attempts,
                correct_attempts: correctAttempts,
                last_attempt: lastAttempt
            };

            // Add additional fields for admin/capturer
            if (learner.role === 'admin' || learner.role === 'capturer') {
                response.answer = question.answer;
                response.explanation = question.explanation;
                response.status = question.status;
                response.active = question.active;
                response.capturer = question.capturer;
                response.created = question.created;
                response.updated = question.updated;
            }

            return response;
        });

        return NextResponse.json({
            status: 'OK',
            questions: {
                items: processedQuestions,
                total: count || 0,
                page,
                limit,
                total_pages: count ? Math.ceil(count / limit) : 0
            }
        });

    } catch (error) {
        console.error('Error in getSubjectQuestions:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting questions',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 