import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Define an interface for the status change log entry
interface StatusChangeLog {
    created: string;
    status?: string;
    feedback?: string;
    [key: string]: unknown; // For any other properties
}

export async function GET(request: Request) {
    try {
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');
        const status = searchParams.get('status') || 'new'; // Default to new questions
        const subjectId = searchParams.get('subject_id');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'UID is required'
            }, { status: 400 });
        }

        // Get the admin/capturer
        const { data: admin, error: adminError } = await supabase
            .from('learner')
            .select('id, role, email')
            .eq('uid', uid)
            .single();

        if (adminError || !admin) {
            console.error('Error fetching admin:', adminError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Admin not found'
            }, { status: 404 });
        }

        // Check if user is admin or capturer
        if (admin.role !== 'admin' && admin.role !== 'capturer') {
            return NextResponse.json({
                status: 'NOK',
                message: 'Unauthorized'
            }, { status: 403 });
        }

        // Build base query
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
                ),
                question_status_log(
                    id,
                    old_status,
                    new_status,
                    feedback,
                    created,
                    changed_by(name)
                )
            `, { count: 'exact' })
            .eq('status', status);

        // For capturers, only show their own questions
        if (admin.role === 'capturer') {
            // Find all capturer accounts with same email
            const { data: capturerIds } = await supabase
                .from('learner')
                .select('id')
                .eq('email', admin.email);

            if (capturerIds?.length) {
                query = query.in('capturer', capturerIds.map(c => c.id));
            }
        }

        // Add subject filter if specified
        if (subjectId) {
            query = query.eq('subject', subjectId);
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

        // Process questions
        const processedQuestions = questions.map(question => {
            // Process options
            let options = question.options;
            try {
                if (typeof options === 'string') {
                    options = JSON.parse(options);
                }
            } catch (e) {
                console.error('Error parsing options:', e);
            }

            // Get latest status change
            const statusChanges = question.question_status_log;
            const latestChange = statusChanges?.length
                ? statusChanges.sort((a: StatusChangeLog, b: StatusChangeLog) =>
                    new Date(b.created).getTime() - new Date(a.created).getTime()
                )[0]
                : null;

            return {
                id: question.id,
                question: question.question,
                answer: question.answer,
                options: options,
                explanation: question.explanation,
                term: question.term,
                curriculum: question.curriculum,
                subject: {
                    id: question.subject.id,
                    name: question.subject.name,
                    grade: question.subject.grade
                },
                status: question.status,
                active: question.active,
                capturer: {
                    id: question.capturer.id,
                    name: question.capturer.name,
                    email: question.capturer.email
                },
                latest_status_change: latestChange ? {
                    from: latestChange.old_status,
                    to: latestChange.new_status,
                    feedback: latestChange.feedback,
                    changed_by: latestChange.changed_by.name,
                    date: latestChange.created
                } : null,
                created: question.created,
                updated: question.updated
            };
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
        console.error('Error in getQuestionReviewQueue:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting review queue',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 