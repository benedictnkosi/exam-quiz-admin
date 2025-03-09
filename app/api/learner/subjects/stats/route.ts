import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');
        const subjectName = searchParams.get('subject');

        if (!uid || !subjectName) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Both learner UID and subject name are required'
            }, { status: 400 });
        }

        // Get learner with their grade
        const { data: learner, error: learnerError } = await supabase
            .from('learner')
            .select('id, grade_id')
            .eq('uid', uid)
            .single();

        if (learnerError || !learner) {
            console.error('Error fetching learner:', learnerError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner not found'
            }, { status: 404 });
        }

        // Get subject for learner's grade
        const { data: subject, error: subjectError } = await supabase
            .from('subject')
            .select('id, name')
            .eq('grade_id', learner.grade_id)
            .eq('name', subjectName)
            .single();

        if (subjectError || !subject) {
            console.error('Error fetching subject:', subjectError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Subject not found'
            }, { status: 404 });
        }

        // Get answer statistics using a single query
        const { data: results, error: resultsError } = await supabase
            .from('result')
            .select(`
                id,
                outcome
            `)
            .eq('learner_id', learner.id)
            .eq('question.subject_id', subject.id);

        if (resultsError) {
            throw resultsError;
        }

        // Calculate statistics
        const totalAnswers = results ? results.length : 0;
        const correctAnswers = results ? results.filter(r => r.outcome === 'correct').length : 0;
        const incorrectAnswers = results ? results.filter(r => r.outcome === 'incorrect').length : 0;

        // Calculate percentages
        const correctPercentage = totalAnswers > 0
            ? Math.round((correctAnswers / totalAnswers) * 100 * 100) / 100
            : 0;
        const incorrectPercentage = totalAnswers > 0
            ? Math.round((incorrectAnswers / totalAnswers) * 100 * 100) / 100
            : 0;

        return NextResponse.json({
            status: 'OK',
            data: {
                subject: {
                    id: subject.id,
                    name: subject.name
                },
                stats: {
                    total_answers: totalAnswers,
                    correct_answers: correctAnswers,
                    incorrect_answers: incorrectAnswers,
                    correct_percentage: correctPercentage,
                    incorrect_percentage: incorrectPercentage
                }
            }
        });

    } catch (error) {
        console.error('Error getting subject statistics:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting subject statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 