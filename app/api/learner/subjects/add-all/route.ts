import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const { uid, gradeNumber } = await request.json();

        if (!uid || !gradeNumber) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Both learner UID and grade number are required'
            }, { status: 400 });
        }

        // Get learner
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

        // Get grade
        const { data: grade, error: gradeError } = await supabase
            .from('grade')
            .select('id')
            .eq('number', gradeNumber)
            .single();

        if (gradeError || !grade) {
            console.error('Error fetching grade:', gradeError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Grade not found'
            }, { status: 404 });
        }

        // Get all active subjects for the grade
        const { data: subjects, error: subjectsError } = await supabase
            .from('subject')
            .select('id, name')
            .eq('grade_id', grade.id)
            .eq('active', true);

        if (subjectsError) {
            throw subjectsError;
        }

        if (!subjects || subjects.length === 0) {
            return NextResponse.json({
                status: 'NOK',
                message: 'No active subjects found for this grade'
            }, { status: 404 });
        }

        let addedSubjects = 0;
        let skippedSubjects = 0;

        // Process each subject
        for (const subject of subjects) {
            // Check if learner already has this subject
            const { data: existingSubject, error: existingError } = await supabase
                .from('learner_subjects')
                .select('id')
                .eq('learner_id', learner.id)
                .eq('subject_id', subject.id)
                .single();

            if (existingError && existingError.code !== 'PGRST116') {
                throw existingError;
            }

            if (!existingSubject) {
                // Add new learner subject
                const { error: insertError } = await supabase
                    .from('learner_subjects')
                    .insert([{
                        learner_id: learner.id,
                        subject_id: subject.id,
                        last_updated: new Date().toISOString(),
                        percentage: 0
                    }]);

                if (insertError) {
                    throw insertError;
                }

                addedSubjects++;
            } else {
                skippedSubjects++;
            }
        }

        return NextResponse.json({
            status: 'OK',
            message: `Successfully processed subjects. Added: ${addedSubjects}, Already existed: ${skippedSubjects}`,
            added_count: addedSubjects,
            skipped_count: skippedSubjects,
            total_subjects: subjects.length
        });

    } catch (error) {
        console.error('Error adding subjects:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error adding subjects',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 