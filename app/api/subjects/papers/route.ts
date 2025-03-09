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
        const subjectName = searchParams.get('subject_name');
        const gradeId = searchParams.get('grade_id');

        if (!subjectName || !gradeId) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Missing required parameters'
            }, { status: 400 });
        }

        // Get all papers for the subject and grade
        const { data: papers, error: papersError } = await supabase
            .from('subject')
            .select(`
                id,
                name,
                curriculum,
                terms,
                grade:grade_id(
                    id,
                    number,
                    name
                )
            `)
            .eq('grade_id', gradeId)
            .ilike('name', `${subjectName}%`)
            .eq('active', true)
            .order('name');

        if (papersError) {
            console.error('Error fetching papers:', papersError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching papers'
            }, { status: 500 });
        }

        // Process papers
        const processedPapers = papers.map(paper => ({
            id: paper.id,
            name: paper.name.replace(`${subjectName} `, ''), // Remove subject name prefix
            full_name: paper.name,
            curriculum: paper.curriculum ? paper.curriculum.split(',').map((c: string) => c.trim()) : [],
            terms: paper.terms ? paper.terms.split(',').map((t: string) => parseInt(t.trim())) : [],
            grade: {
                id: paper.grade.id,
                number: paper.grade.number,
                name: paper.grade.name
            }
        }));

        return NextResponse.json({
            status: 'OK',
            papers: processedPapers
        });

    } catch (error) {
        console.error('Error in getSubjectPapers:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error getting papers',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 