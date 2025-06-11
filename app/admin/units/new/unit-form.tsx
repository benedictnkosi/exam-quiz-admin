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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Unit</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Title</label>
                        <input
                            {...register('title')}
                            className="w-full p-2 border rounded-md"
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
                            className="w-full p-2 border rounded-md"
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
                        <div className="grid grid-cols-2 gap-2">
                            {LANGUAGE_OPTIONS.map((lang) => (
                                <label key={lang} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        value={lang}
                                        {...register('availableLanguages')}
                                        className="rounded"
                                    />
                                    <span>{LANGUAGE_NAMES[lang]}</span>
                                </label>
                            ))}
                        </div>
                        {errors.availableLanguages && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.availableLanguages.message}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Unit'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
} 