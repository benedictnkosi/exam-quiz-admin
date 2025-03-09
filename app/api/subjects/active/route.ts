import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Define interfaces for the subject data structure
interface Grade {
    id: number;
    number: number;
    active: number;
}

interface SubjectData {
    id: number;
    name: string;
    grade: Grade;
    curriculum?: string;
    terms?: string;
    [key: string]: unknown; // For any other properties
}

interface Paper {
    id: number;
    name: string;
    curriculum?: string;
    terms?: string;
}

interface GroupedSubject {
    name: string;
    papers: Paper[];
}

export async function GET(request: Request) {
    try {
        // Extract parameters from URL
        const { searchParams } = new URL(request.url);
        const gradeNumber = searchParams.get('grade');

        // Base query
        let query = supabase
            .from('subject')
            .select('*, grade!inner(*)')  // Using inner join to ensure grade exists
            .eq('active', true);

        // Add grade filter if grade is provided
        if (gradeNumber) {
            query = query.eq('grade.number', gradeNumber);
        }

        // Execute query with ordering
        const { data: subjects, error: subjectsError } = await query.order('name');

        if (subjectsError) {
            console.error('Error fetching subjects:', subjectsError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching subjects'
            }, { status: 500 });
        }

        // Group subjects by grade
        const groupedSubjects = subjects.reduce((acc: { [key: string]: GroupedSubject[] }, subject: SubjectData) => {
            const gradeKey = subject.grade.number;
            if (!acc[gradeKey]) {
                acc[gradeKey] = [];
            }

            // Get base subject name (without paper number)
            const baseName = subject.name.split(' ')[0];

            // Check if we already have this base subject
            const existingSubject = acc[gradeKey].find((s: GroupedSubject) => s.name === baseName);

            if (existingSubject) {
                // Add this as a paper to existing subject
                existingSubject.papers.push({
                    id: subject.id,
                    name: subject.name,
                    curriculum: subject.curriculum,
                    terms: subject.terms
                });
            } else {
                // Create new subject entry
                acc[gradeKey].push({
                    name: baseName,
                    papers: [{
                        id: subject.id,
                        name: subject.name,
                        curriculum: subject.curriculum,
                        terms: subject.terms
                    }]
                });
            }

            return acc;
        }, {});

        // Convert to array and sort by grade
        const formattedSubjects = Object.entries(groupedSubjects)
            .sort(([gradeA], [gradeB]) => parseInt(gradeA) - parseInt(gradeB))
            .map(([grade, subjects]) => ({
                grade: parseInt(grade),
                subjects: subjects
            }));

        return NextResponse.json({
            status: 'OK',
            subjects: formattedSubjects
        });

    } catch (error) {
        console.error('Error in getAllActiveSubjects:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting subjects',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 