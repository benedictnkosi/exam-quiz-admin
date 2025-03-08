import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const uid = data.uid;

        if (!uid) {
            return NextResponse.json({
                status: 'NOK',
                message: 'UID is required'
            }, { status: 400 });
        }

        // Get the learner
        const { data: learner, error: learnerError } = await supabase
            .from('learner')
            .select('*')
            .eq('uid', uid)
            .single();

        if (learnerError && learnerError.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error fetching learner:', learnerError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error fetching learner'
            }, { status: 500 });
        }

        // Clean and prepare the data
        const cleanCommaString = (value: string | null | undefined) => {
            if (!value) return '';
            return value
                .split(',')
                .map(item => item.trim().replace(/^["']|["']$/g, ''))
                .filter(item => item.length > 0)
                .join(',');
        };

        // Define an interface for the updateData object
        interface LearnerUpdateData {
            terms?: string;
            curriculum?: string;
            name?: string;
            grade?: number;
            grade_changed?: boolean;
            email?: string;
            uid?: string;
            school_name?: string;
            school_address?: string;
            school_latitude?: number;
            school_longitude?: number;
            notification_hour?: number;
            private_school?: boolean;
        }

        const updateData: LearnerUpdateData = {};

        // Update terms if provided
        if (data.terms !== undefined) {
            updateData.terms = cleanCommaString(data.terms);
        }

        // Update curriculum if provided
        if (data.curriculum !== undefined) {
            // For new registrations, set curriculum to 'CAPS,IEB'
            if (!learner) {
                updateData.curriculum = 'CAPS,IEB';
            } else {
                updateData.curriculum = cleanCommaString(data.curriculum);
            }
        }

        // Update other fields if provided
        if (data.name) updateData.name = data.name;
        if (data.grade) {
            // Get grade ID
            const { data: gradeData } = await supabase
                .from('grade')
                .select('id')
                .eq('number', data.grade)
                .single();

            if (!gradeData) {
                return NextResponse.json({
                    status: 'NOK',
                    message: 'Grade not found'
                }, { status: 404 });
            }

            // If grade is changing, delete all results
            if (learner && learner.grade !== gradeData.id) {
                const { error: deleteError } = await supabase
                    .from('result')
                    .delete()
                    .eq('learner_id', learner.id);

                if (deleteError) {
                    console.error('Error deleting results:', deleteError);
                }
            }

            updateData.grade = gradeData.id;
        }

        if (data.school_name) updateData.school_name = data.school_name;
        if (data.school_address) updateData.school_address = data.school_address;
        if (data.school_latitude) updateData.school_latitude = data.school_latitude;
        if (data.school_longitude) updateData.school_longitude = data.school_longitude;
        if (data.notification_hour) updateData.notification_hour = data.notification_hour;
        if (data.email) updateData.email = data.email;

        // Set private_school based on curriculum
        if (data.curriculum === 'CAPS') {
            updateData.private_school = false;
        } else if (data.curriculum) {
            updateData.private_school = true;
        }

        if (!learner) {
            // Create new learner
            const { error: createError } = await supabase
                .from('learner')
                .insert([{ uid, ...updateData }]);

            if (createError) {
                console.error('Error creating learner:', createError);
                return NextResponse.json({
                    status: 'NOK',
                    message: 'Error creating learner'
                }, { status: 500 });
            }
        } else {
            // Update existing learner
            const { error: updateError } = await supabase
                .from('learner')
                .update(updateData)
                .eq('uid', uid);

            if (updateError) {
                console.error('Error updating learner:', updateError);
                return NextResponse.json({
                    status: 'NOK',
                    message: 'Error updating learner'
                }, { status: 500 });
            }
        }

        return NextResponse.json({
            status: 'OK',
            message: 'Successfully updated learner'
        });

    } catch (error) {
        console.error('Error in updateLearner:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error updating learner'
        }, { status: 500 });
    }
} 