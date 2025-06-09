'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { lessonSchema, type LessonFormData } from '@/lib/schemas';
import { createLesson, updateLesson, getLessonsByUnitId } from '@/lib/api-helpers';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface LessonFormProps {
    initialData?: LessonFormData & { id?: string };
    unitId: string;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onLessonAdded?: () => void;
}

export function LessonForm({ initialData, unitId, trigger, open, onOpenChange, onLessonAdded }: LessonFormProps) {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<LessonFormData>({
        resolver: zodResolver(lessonSchema),
        defaultValues: initialData ? {
            ...initialData,
            unitId: String(initialData.unitId)
        } : {
            unitId: String(unitId),
            order: 0,
        },
    });

    console.log('Form state:', {
        errors,
        isSubmitting,
        defaultValues: initialData ? {
            ...initialData,
            unitId: String(initialData.unitId)
        } : {
            unitId: String(unitId),
            order: 0
        }
    });

    const onSubmit = async (data: LessonFormData) => {
        console.log('Form submitted with data:', data);
        console.log('Initial data:', initialData);
        try {
            if (initialData?.id) {
                console.log('Updating lesson with ID:', initialData.id);
                // For updates, we need to include the unitId as a number for the API
                const updatePayload = {
                    ...data,
                    unitId: Number(data.unitId)
                };
                console.log('Update payload:', updatePayload);
                await updateLesson(initialData.id, updatePayload);
                toast.success('Lesson updated successfully!');
            } else {
                console.log('Creating new lesson');
                const lessons = await getLessonsByUnitId(unitId);
                const maxOrder = lessons.reduce((max: number, lesson: any) => lesson.lessonOrder > max ? lesson.lessonOrder : max, -1);
                const nextOrder = maxOrder + 1;
                const createPayload = {
                    ...data,
                    lessonOrder: nextOrder,
                    unitId: Number(data.unitId)
                };
                console.log('Create payload:', createPayload);
                await createLesson(createPayload);
                toast.success('Lesson created successfully!');
                onLessonAdded?.();
            }
            reset();
            onOpenChange?.(false);
            router.refresh();
        } catch (error) {
            console.error('Error in form submission:', error);
            toast.error(initialData ? 'Failed to update lesson' : 'Failed to create lesson');
        }
    };

    const content = (
        <form
            onSubmit={(e) => {
                console.log('Form submit event triggered');
                handleSubmit(onSubmit)(e);
            }}
            className="space-y-6"
        >
            <div>
                <label className="block text-sm font-medium mb-2">
                    Title
                    <span className="text-gray-500 text-xs ml-1">(3-100 characters)</span>
                </label>
                <input
                    {...register('title', {
                        onChange: (e) => {
                            console.log('Title input changed:', e.target.value);
                        }
                    })}
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g., Basic Greetings - Part 1"
                    minLength={3}
                    maxLength={100}
                />
                {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
            </div>

            <div className="flex justify-end space-x-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        console.log('Cancel button clicked');
                        onOpenChange?.(false);
                    }}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={() => {
                        console.log('Submit button clicked, isSubmitting:', isSubmitting);
                        console.log('Current form errors:', errors);
                    }}
                >
                    {isSubmitting
                        ? initialData
                            ? 'Updating...'
                            : 'Creating...'
                        : initialData
                            ? 'Update Lesson'
                            : 'Create Lesson'}
                </Button>
            </div>
        </form>
    );

    if (trigger) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {initialData ? 'Edit Lesson' : 'Create New Lesson'}
                        </DialogTitle>
                    </DialogHeader>
                    {content}
                </DialogContent>
            </Dialog>
        );
    }

    return content;
} 