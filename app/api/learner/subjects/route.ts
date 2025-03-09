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

        if (!uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'UID is required'
            }, { status: 400 });
        }

        // Get the learner with their grade
        const { data: learner, error: learnerError } = await supabase
            .from('learner')
            .select('*, grade(*)')
            .eq('uid', uid)
            .single();

        if (learnerError || !learner) {
            console.error('Error fetching learner:', learnerError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Learner not found'
            }, { status: 404 });
        }

        // Get learner's curriculum
        const learnerCurriculum = learner.curriculum ? learner.curriculum.split(',').map((c: string) => c.trim()) : [];

        // Get all subjects for the learner's grade
        const { data: subjects, error: subjectsError } = await supabase
            .from('subject')
            .select('*')
            .eq('grade', learner.grade.id)
            .eq('active', true);

        if (subjectsError) {
            console.error('Error fetching subjects:', subjectsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching subjects'
            }, { status: 500 });
        }

        // Filter subjects based on curriculum if specified
        let filteredSubjects = subjects;
        if (learnerCurriculum.length > 0) {
            filteredSubjects = subjects.filter(subject => {
                const subjectCurriculum = subject.curriculum ? subject.curriculum.split(',').map(c => c.trim()) : [];
                return learnerCurriculum.some(c => subjectCurriculum.includes(c));
            });
        }

        // Group subjects by name (to combine different papers)
        const groupedSubjects = filteredSubjects.reduce((acc: { [key: string]: any[] }, subject: any) => {
            const name = subject.name.split(' ')[0]; // Get base subject name without paper
            if (!acc[name]) {
                acc[name] = [];
            }
            acc[name].push(subject);
            return acc;
        }, {});

        // Format response
        const formattedSubjects = Object.entries(groupedSubjects).map(([name, papers]) => ({
            name,
            papers: papers.map(paper => ({
                id: paper.id,
                name: paper.name,
                curriculum: paper.curriculum,
                terms: paper.terms
            }))
        }));

        return NextResponse.json({
            status: 'OK',
            subjects: formattedSubjects
        });

    } catch (error) {
        console.error('Error in getLearnerSubjects:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting learner subjects',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 