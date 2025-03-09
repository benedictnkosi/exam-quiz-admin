import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('image') as File;
        const questionId = formData.get('question_id') as string;
        const imageType = formData.get('image_type') as string;

        if (!file || !questionId || !imageType) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Missing required fields'
            }, { status: 400 });
        }

        // Validate image type
        if (!['question_context', 'question', 'answer'].includes(imageType)) {
            return NextResponse.json({
                status: 'NOK',
                message: 'Invalid image type'
            }, { status: 400 });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${questionId}_${imageType}_${timestamp}.${fileExt}`;

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('question_images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true,
                contentType: file.type
            });

        if (uploadError) {
            console.error('Error uploading file:', uploadError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error uploading image',
                error: uploadError.message
            }, { status: 500 });
        }

        // Get the question from the database
        const { data: question, error: questionError } = await supabase
            .from('question')
            .select('id')  // Only select the id field
            .eq('id', questionId)
            .single();

        if (questionError || !question) {
            // Clean up the uploaded file if question not found
            await supabase.storage
                .from('question_images')
                .remove([fileName]);

            console.error('Error getting question:', questionError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Question not found'
            }, { status: 404 });
        }

        // Prepare the update data with only the image path
        const updateData: { [key: string]: string } = {};
        switch (imageType) {
            case 'question_context':
                updateData.image_path = fileName;
                break;
            case 'question':
                updateData.question_image_path = fileName;
                break;
            case 'answer':
                updateData.answer_image = fileName;
                break;
        }

        // Update only the specific image path field
        const { error: updateError } = await supabase
            .from('question')
            .update(updateData)
            .eq('id', questionId);

        if (updateError) {
            // Clean up the uploaded file if update fails
            await supabase.storage
                .from('question_images')
                .remove([fileName]);

            console.error('Error updating question:', updateError);
            return NextResponse.json({
                status: 'NOK',
                message: 'Error updating question with image path',
                error: updateError.message
            }, { status: 500 });
        }

        // Get public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
            .from('question_images')
            .getPublicUrl(fileName);

        return NextResponse.json({
            status: 'OK',
            message: 'Image successfully uploaded',
            data: {
                fileName: fileName,
                url: publicUrl,
                imageType: imageType,
                questionId: questionId
            }
        });

    } catch (error) {
        console.error('Error in image upload:', error);
        return NextResponse.json({
            status: 'NOK',
            message: 'Error uploading image',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 