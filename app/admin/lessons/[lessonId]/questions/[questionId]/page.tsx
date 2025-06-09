'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { QuestionForm } from '../question-form';
import { getLanguageQuestionById, deleteLanguageQuestion } from '@/lib/api-helpers';

export default function EditQuestionPage({
    params,
}: {
    params: { lessonId: string; questionId: string };
}) {
    const router = useRouter();
    const [question, setQuestion] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { lessonId, questionId } = params;

    useEffect(() => {
        const fetchQuestion = async () => {
            try {
                const questionData = await getLanguageQuestionById(questionId);
                if (!questionData) {
                    toast.error('Question not found');
                    router.push(`/admin/lessons/${lessonId}`);
                    return;
                }
                setQuestion(questionData);
            } catch (error) {
                console.error('Error fetching question:', error);
                toast.error('Failed to load question data');
                router.push(`/admin/lessons/${lessonId}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuestion();
    }, [lessonId, questionId, router]);

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this question?')) return;
        try {
            await deleteLanguageQuestion(questionId);
            toast.success('Question deleted successfully!');
            router.push(`/admin/lessons/${lessonId}`);
        } catch (error) {
            toast.error('Failed to delete question');
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    if (!question) {
        return null;
    }

    // Normalize question data for the form
    const normalizedQuestion = {
        ...question,
        content: {
            ...(question.content || {}),
            type: question.type,
            options: question.options,
            correct: question.correctOption,
            blankIndex: question.blankIndex,
            direction: question.direction,
            // add any other fields your form expects in content
        },
        id: question.id,
        type: question.type,
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Edit Question</h1>
            <div className="max-w-2xl">
                <QuestionForm
                    initialData={normalizedQuestion}
                    lessonId={lessonId}
                />
                <div className="flex justify-end mt-4">
                    <button
                        type="button"
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        onClick={handleDelete}
                    >
                        Delete Question
                    </button>
                </div>
            </div>
        </div>
    );
} 