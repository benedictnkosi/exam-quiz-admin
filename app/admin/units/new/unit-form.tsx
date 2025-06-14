'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { unitSchema, type UnitFormData } from '@/lib/schemas';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import React from 'react';
import { API_HOST } from '@/config/constants';

const LANGUAGE_OPTIONS = [
    'af', // Afrikaans
    'nr', // Ndebele
    'st', // Sesotho
    'ss', // Swati
    'tn', // Tswana
    'ts', // Tsonga
    've', // Venda
    'xh', // Xhosa
    'zu', // Zulu
    'en', // English
    'se', // Northern Sotho
];

const LANGUAGE_NAMES: Record<string, string> = {
    'af': 'Afrikaans',
    'nr': 'Ndebele',
    'st': 'Sesotho',
    'ss': 'Swati',
    'tn': 'Tswana',
    'ts': 'Tsonga',
    've': 'Venda',
    'xh': 'Xhosa',
    'zu': 'Zulu',
    'en': 'English',
    'se': 'Northern Sotho',
};

interface UnitFormProps {
    onSuccess?: () => void;
}

export function UnitForm({ onSuccess }: UnitFormProps) {
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
        setValue,
        reset,
    } = useForm<UnitFormData>({
        resolver: zodResolver(unitSchema),
        defaultValues: {
            availableLanguages: []
        }
    });

    const title = watch('title');
    const generatedId = title ? title.toLowerCase().replace(/\s+/g, '-') : '';

    // Update unitId in form state whenever title changes
    React.useEffect(() => {
        setValue('unitId', generatedId, { shouldValidate: true });
    }, [generatedId, setValue]);

    const [nextOrder, setNextOrder] = React.useState<number>(0);
    React.useEffect(() => {
        async function fetchUnits() {
            try {
                const response = await fetch(`${API_HOST}/api/units`);
                if (!response.ok) {
                    throw new Error('Failed to fetch units');
                }
                const units = await response.json();
                const maxOrder = units.reduce((max: number, unit: any) => {
                    return unit.unitOrder !== undefined && unit.unitOrder > max ? unit.unitOrder : max;
                }, -1);
                setNextOrder(maxOrder + 1);
            } catch (error) {
                setNextOrder(0);
            }
        }
        fetchUnits();
    }, []);

    const onSubmit = async (data: UnitFormData) => {
        try {
            const response = await fetch(`${API_HOST}/api/units`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: data.title,
                    unitId: data.unitId,
                    unitOrder: nextOrder,
                    description: data.description,
                    availableLanguages: data.availableLanguages
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create unit');
            }

            toast.success('Unit created successfully!');
            setOpen(false);
            reset();
            onSuccess?.();
        } catch (error) {
            toast.error('Failed to create unit');
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Create New Unit</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Unit</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Title</label>
                        <input
                            {...register('title')}
                            className="w-full p-3 border rounded-md text-base"
                            placeholder="e.g., Basic Greetings"
                        />
                        {errors.title && (
                            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <textarea
                            {...register('description')}
                            className="w-full p-3 border rounded-md text-base"
                            placeholder="Enter a description for this unit"
                            rows={3}
                        />
                        {errors.description && (
                            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Available Languages
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {LANGUAGE_OPTIONS.map((lang) => (
                                <label key={lang} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md">
                                    <input
                                        type="checkbox"
                                        value={lang}
                                        {...register('availableLanguages')}
                                        className="rounded h-5 w-5"
                                    />
                                    <span className="text-base">{LANGUAGE_NAMES[lang]}</span>
                                </label>
                            ))}
                        </div>
                        {errors.availableLanguages && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.availableLanguages.message}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                            {isSubmitting ? 'Creating...' : 'Create Unit'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
} 