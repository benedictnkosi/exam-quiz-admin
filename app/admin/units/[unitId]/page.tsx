'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ArrowUp, ArrowDown, ArrowLeft, Trash2 } from 'lucide-react';
import { getLessonsByUnitId } from '@/lib/api-helpers';
import { LessonForm } from '@/app/admin/lessons/lesson-form';
import { API_BASE_URL, API_HOST } from '@/config/constants';

interface Lesson {
    id: string;
    title: string;
    description?: string;
    unitId: string;
    lessonOrder: number;
    wordIds?: string[];
}

interface Unit {
    id: string;
    title: string;
    // add other fields if needed
}

export default function UnitDetailPage({
    params,
}: {
    params: { unitId: string };
}) {
    const { unitId } = params;
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [unitName, setUnitName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);

    const fetchUnit = async () => {
        try {
            const response = await fetch(`${API_HOST}/api/units/${unitId}`);
            if (!response.ok) throw new Error('Failed to fetch unit');
            const unit: Unit = await response.json();
            setUnitName(unit.title || '');
        } catch (error) {
            setUnitName('');
        }
    };

    const fetchLessons = async () => {
        try {
            const data = await getLessonsByUnitId(unitId);
            // Sort lessons by order
            const sortedLessons = data
                .map((lesson: any) => ({
                    id: lesson.id,
                    title: lesson.title ?? 'Untitled Lesson',
                    lessonOrder: lesson.lessonOrder ?? 0,
                    unitId: lesson.unitId,
                    description: lesson.description,
                    wordIds: lesson.wordIds
                }))
                .sort((a: Lesson, b: Lesson) => (a.lessonOrder ?? 0) - (b.lessonOrder ?? 0));
            setLessons(sortedLessons);
        } catch (error: any) {
            console.error('Error fetching lessons:', error);
            toast.error('Failed to load lessons');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUnit();
        fetchLessons();
    }, [unitId]);

    const onLessonAdded = () => {
        fetchLessons();
    };

    const handleOrderChange = async (lessonId: string, direction: 'up' | 'down') => {
        const currentIndex = lessons.findIndex(l => l.id === lessonId);
        if (
            (direction === 'up' && currentIndex === 0) ||
            (direction === 'down' && currentIndex === lessons.length - 1)
        ) {
            return;
        }

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const currentLesson = lessons[currentIndex];
        const targetLesson = lessons[newIndex];

        try {
            // Update both lessons' orders
            await fetch(`${API_BASE_URL}/api/lessons/${currentLesson.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonOrder: newIndex })
            });

            await fetch(`${API_BASE_URL}/api/lessons/${targetLesson.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonOrder: currentIndex })
            });

            // Update local state
            const newLessons = [...lessons];
            newLessons[currentIndex] = { ...currentLesson, lessonOrder: newIndex };
            newLessons[newIndex] = { ...targetLesson, lessonOrder: currentIndex };
            setLessons(newLessons.sort((a: Lesson, b: Lesson) => (a.lessonOrder ?? 0) - (b.lessonOrder ?? 0)));

            toast.success('Lesson order updated successfully');
        } catch (error) {
            console.error('Error updating lesson order:', error);
            toast.error('Failed to update lesson order');
        }
    };

    const handleDeleteUnit = async () => {
        if (lessons.length > 0) {
            toast.error('Cannot delete unit: there are lessons linked to this unit.');
            return;
        }
        if (!window.confirm('Are you sure you want to delete this unit? This action cannot be undone.')) {
            return;
        }
        setIsDeleting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/units/${unitId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete unit');
            }

            toast.success('Unit deleted successfully!');
            window.location.href = '/admin';
        } catch (error) {
            toast.error('Failed to delete unit');
            setIsDeleting(false);
        }
    };

    const handleDeleteLesson = async (lessonId: string) => {
        setDeletingLessonId(lessonId);
        try {
            const confirmed = window.confirm('Are you sure you want to delete this lesson? This action cannot be undone.');
            if (!confirmed) {
                setDeletingLessonId(null);
                return;
            }

            // Delete the lesson using the new API
            const response = await fetch(`${API_BASE_URL}/api/lessons/${lessonId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete lesson');
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error('Failed to delete lesson');
            }

            setLessons((prev) => prev.filter((l) => l.id !== lessonId));
            toast.success('Lesson deleted successfully!');
        } catch (error) {
            toast.error('Failed to delete lesson');
        } finally {
            setDeletingLessonId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Unit Lessons</h1>
                </div>
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-4 px-4 sm:py-8">
            <div className="flex flex-col gap-2 mb-6 sm:mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/units">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold">{unitName ? unitName : 'Unit'}</h1>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <span className="text-xl font-semibold">Unit Lessons</span>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <LessonForm
                            unitId={unitId}
                            trigger={<Button onClick={() => setIsLessonModalOpen(true)} className="w-full sm:w-auto">Add New Lesson</Button>}
                            open={isLessonModalOpen}
                            onOpenChange={setIsLessonModalOpen}
                            onLessonAdded={onLessonAdded}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDeleteUnit}
                            disabled={isDeleting}
                            className="text-red-500"
                        >
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 sm:gap-6">
                {lessons.map((lesson) => (
                    <div
                        key={lesson.id}
                        className="p-4 sm:p-6 bg-white rounded-lg shadow-sm border border-gray-200 relative group cursor-pointer"
                        onClick={() => window.location.href = `/admin/lessons/${lesson.id}`}
                    >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                            <div className="w-full">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                    <h2 className="text-lg sm:text-xl font-semibold">{lesson.title}</h2>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">(Order: {lesson.lessonOrder})</span>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOrderChange(lesson.id, 'up');
                                                }}
                                                disabled={lesson.lessonOrder === 0}
                                            >
                                                <ArrowUp className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOrderChange(lesson.id, 'down');
                                                }}
                                                disabled={lesson.lessonOrder === lessons.length - 1}
                                            >
                                                <ArrowDown className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-gray-600 mb-4">{lesson.description}</p>
                                <div className="flex flex-wrap gap-2">
                                    {lesson.wordIds?.map((wordId: string) => (
                                        <span
                                            key={wordId}
                                            className="px-2 py-1 bg-gray-100 rounded text-sm"
                                        >
                                            {wordId}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLesson(lesson.id);
                                }}
                                disabled={deletingLessonId === lesson.id}
                                className="absolute top-4 right-4"
                            >
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 