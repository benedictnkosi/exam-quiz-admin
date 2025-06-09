'use client';

import { QuestionForm } from '../question-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getLessonById } from '@/lib/api-helpers';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function NewQuestionPage({
    params,
}: {
    params: { lessonId: string };
}) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const { lessonId } = params;

    useEffect(() => {
        async function validateLesson() {
            try {
                const lesson = await getLessonById(lessonId);
                if (!lesson) {
                    toast.error('Lesson not found');
                    router.push('/admin/lessons');
                    return;
                }
            } catch (error) {
                console.error('Error validating lesson:', error);
                toast.error('Failed to load lesson');
                router.push('/admin/lessons');
            } finally {
                setIsLoading(false);
            }
        }

        validateLesson();
    }, [lessonId, router]);

    if (isLoading) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Add New Question</h1>
                <Link href={`/admin/lessons/${lessonId}`}>
                    <Button variant="outline">Back to Lesson</Button>
                </Link>
            </div>
            <div className="max-w-2xl">
                <QuestionForm lessonId={lessonId} />
            </div>
        </div>
    );
} 