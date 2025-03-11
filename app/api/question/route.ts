import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    try {
        // Get the id from URL parameters
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        // Validate id parameter
        if (!id) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Question id is required'
            }, { status: 400 });
        }

        // First fetch the question with its subject
        const { data: question, error } = await supabase
            .from('question')
            .select(`
               *,
               subject(*)
           `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Supabase error:', error.message);
            return NextResponse.json({
                status: 'NOK',
                message: error.message
            }, { status: 500 });
        }

        if (!question) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Question not found'
            }, { status: 404 });
        }

        // Now fetch the grade information from the grade table
        const gradeId = question.subject.grade;
        const { data: gradeData, error: gradeError } = await supabase
            .from('grade')
            .select('*')
            .eq('id', gradeId)
            .single();

        if (gradeError) {
            console.error('Error fetching grade:', gradeError.message);
        }

        // Format the question data with the actual grade data
        const formattedQuestion = {
            ...question,
            subject: {
                ...question.subject,
                grade: gradeData || {
                    id: gradeId,
                    number: gradeId,
                    active: 1
                }
            }
        };

        // Return the question data
        return NextResponse.json(formattedQuestion);

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Server error:', errorMessage);
        return NextResponse.json({
            status: 'NOK',
            message: 'Internal Server Error'
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const userId = data.uid;
        const questionId = data.question_id ?? 0;

        // Check if user exists
        const { data: user, error: userError } = await supabase
            .from('learner')
            .select('*')
            .eq('uid', userId)
            .single();

        if (userError || !user) {
            return NextResponse.json({
                status: 'NOK',
                message: 'User not found'
            }, { status: 404 });
        }

        // Validate required fields
        if (!data.type || !data.subject || !data.year || !data.term || !data.answer || !data.curriculum) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Missing required fields'
            }, { status: 400 });
        }

        // Check rejected questions count
        const { data: rejectedQuestions } = await supabase
            .from('question')
            .select('id')
            .eq('capturer', data.capturer)
            .eq('status', 'rejected');

        if (rejectedQuestions && rejectedQuestions.length >= 10 && questionId === 0) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Cannot create new question - Please fix the errors in your rejected questions'
            }, { status: 400 });
        }

        //check number of new questions is not over 50
        const { data: newQuestions } = await supabase
            .from('question')
            .select('id')
            .eq('capturer', data.capturer)
            .eq('status', 'new');

        if (newQuestions && newQuestions.length >= 50 && questionId === 0) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Cannot create new question - You have reached the maximum number of new questions'
            }, { status: 400 });
        }

        // Check single type questions
        const { data: singleQuestions } = await supabase
            .from('question')
            .select('id')
            .eq('capturer', data.capturer)
            .eq('type', 'single');

        if (singleQuestions && singleQuestions.length >= 1 && questionId === 0) {
            return NextResponse.json({
                status: 'NOK',
                message: 'You have single questions to convert to multiple choice'
            }, { status: 400 });
        }

        // Validate options for multiple choice questions
        if (['multiple_choice', 'multi_select'].includes(data.type)) {
            if (!data.options?.option1 || !data.options?.option2 || !data.options?.option3 || !data.options?.option4) {
                return NextResponse.json({
                    status: 'NOK',
                    message: 'Options cannot be empty for multiple_choice or multi_select types'
                }, { status: 400 });
            }
        }

        // Validate answer length for single type
        if (data.type === 'single') {
            const answers = data.answer.split('|');
            for (const answer of answers) {
                if (answer.split(' ').length > 4) {
                    return NextResponse.json({
                        status: 'NOK',
                        message: 'Too many words in the expected answer, use multiple choice instead'
                    }, { status: 400 });
                }
            }
        }

        // Get grade and subject
        const { data: grade } = await supabase
            .from('grade')
            .select('*')
            .eq('number', data.grade)
            .single();

        const { data: subject, error: subjectError } = await supabase
            .from('subject')
            .select('*')
            .eq('name', data.subject)
            .eq('grade', grade?.id)
            .single();

        if (questionId !== 0) {
            const { data: existingQuestion } = await supabase
                .from('question')
                .select('*')
                .eq('id', questionId)
                .single();

            if (existingQuestion) {
                return NextResponse.json({
                    status: 'NOK',
                    message: 'Question already exists'
                }, { status: 400 });
            }
        }
        if (!subject) {
            return NextResponse.json({
                status: 'NOK',
                message: `Subject ${data.subject} not found for grade ${data.grade}`
            }, { status: 404 });
        }

        // Check for duplicate questions
        const { data: existingQuestion } = await supabase
            .from('question')
            .select('*')
            .eq('subject', subject.id)
            .eq('question', data.question)
            .neq('id', questionId)
            .single();

        if (existingQuestion) {
            return NextResponse.json({
                status: 'NOK',
                message: `A question with the same subject and text already exists. Question ID: ${existingQuestion.id}`
            }, { status: 400 });
        }

        // Clean up options data
        const cleanOptions = {
            option1: data.options.option1.replace('{"answers":"', '').replace('"}', ''),
            option2: data.options.option2.replace('{"answers":"', '').replace('"}', ''),
            option3: data.options.option3.replace('{"answers":"', '').replace('"}', ''),
            option4: data.options.option4.replace('{"answers":"', '').replace('"}', '')
        };

        // Prepare question data
        const questionData = {
            question: data.question || '',
            type: data.type,
            subject: subject.id,
            context: data.context || null,
            answer: Array.isArray(data.answer) ? data.answer : [data.answer],
            options: cleanOptions,
            term: data.term || null,
            explanation: data.explanation || null,
            year: data.year || null,
            capturer: user.id,
            reviewer: questionId === 0 ? user.id : existingQuestion.reviewer,
            created: questionId === 0 ? new Date().toISOString() : existingQuestion.created,
            active: true,
            status: 'new',
            comment: 'new',
            curriculum: data.curriculum || 'CAPS',
            image_path: '',
            question_image_path: '',
            answer_image: ''
        };

        let result;
        if (questionId === 0) {
            // Create new question
            const { data: newQuestion, error: createError } = await supabase
                .from('question')
                .insert([questionData])
                .select()
                .single();

            if (createError) {
                throw createError;
            }
            result = {
                status: 'OK',
                message: 'Successfully created question',
                question_id: newQuestion.id
            };
        } else {
            // Update existing question
            const { data: updatedQuestion, error: updateError } = await supabase
                .from('question')
                .update(questionData)
                .eq('id', questionId)
                .select()
                .single();

            if (updateError) {
                throw updateError;
            }
            result = {
                status: 'OK',
                message: 'Successfully updated question',
                question_id: updatedQuestion.id
            };
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error creating/updating question:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error creating/updating question'
        }, { status: 500 });
    }
}