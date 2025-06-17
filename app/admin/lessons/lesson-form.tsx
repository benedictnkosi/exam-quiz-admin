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
            lessonOrder: 0,
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
            lessonOrder: 0
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
                    title: data.title,
                    lessonOrder: data.lessonOrder || 0,
                    unitId: Number(data.unitId)
                };
                console.log('Update payload:', updatePayload);
                await updateLesson(initialData.id, updatePayload);
                toast.success('Lesson updated successfully!');
            } else {
                console.log('Creating new lesson');
                // Get existing lessons to determine the next order number
                const existingLessons = await getLessonsByUnitId(unitId);
                const nextOrder = existingLessons.length;

                const createPayload = {
                    title: data.title,
                    lessonOrder: nextOrder, // Set to the next available order number
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
            className="space-y-4 sm:space-y-6"
        >
            <div>
                <label className="block text-sm font-medium mb-1 sm:mb-2">
                    Title
                    <span className="text-gray-500 text-xs ml-1">(3-100 characters)</span>
                </label>
                <input
                    {...register('title', {
                        onChange: (e) => {
                            console.log('Title input changed:', e.target.value);
                        }
                    })}
                    className="w-full p-2 sm:p-3 border rounded-md text-base"
                    placeholder="e.g., Basic Greetings - Part 1"
                    minLength={3}
                    maxLength={100}
                />
                {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
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
                    className="w-full sm:w-auto"
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
                <DialogContent className="w-[95vw] sm:w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl sm:text-2xl">
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