'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { questionSchema, type QuestionFormData } from '@/lib/schemas';
import {
    addQuestionToLesson,
    updateQuestion,
    getWords,
    getQuestionsForLesson,
} from '@/lib/api-helpers';
import { useEffect, useState } from 'react';

const QUESTION_TYPES = [
    'select_image',
    'translate',
    'tap_what_you_hear',
    'type_what_you_hear',
    'fill_in_blank',
    'match_pairs',
    'complete_translation',
] as const;

interface Word {
    id: string;
    image?: string;
    translations?: {
        en?: string;
    };
}

interface QuestionFormProps {
    initialData?: QuestionFormData & { id?: string };
    lessonId: string;
    onSuccess?: () => void;
}

type FormErrors = {
    type?: { message: string };
    content?: {
        audio?: { message: string };
        options?: Array<{ message: string }>;
        correct?: { message: string };
    };
};

export function QuestionForm({ initialData, lessonId, onSuccess }: QuestionFormProps) {
    const router = useRouter();
    const [words, setWords] = useState<Word[]>([]);
    const [selectedImages, setSelectedImages] = useState<string[]>(() => {
        if (initialData?.type === 'select_image' && initialData.content && 'options' in initialData.content) {
            // Initialize with empty strings for all positions
            const images = ['', '', '', ''];
            // We'll populate these in useEffect after fetching words
            return images;
        }
        return ['', '', '', ''];
    });
    const [sentenceError, setSentenceError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting: formIsSubmitting },
        reset,
        setValue,
        control,
    } = useForm<QuestionFormData>({
        resolver: zodResolver(questionSchema),
        defaultValues: initialData || {
            type: 'select_image',
            content: {
                type: 'select_image',
                options: ['', '', '', ''],
                correct: 0
            },
        },
    });

    const questionType = watch('type');

    // useFieldArray for options
    const {
        fields: optionFields,
        append: appendOption,
        remove: removeOption,
    } = useFieldArray<any>({
        control,
        name: 'content.options',
    });

    useEffect(() => {
        async function fetchWords() {
            try {
                const data = await getWords();
                // Ensure all words have the correct shape for TypeScript
                const wordsList: Word[] = (data as any[]).map((w) => ({
                    id: w.id,
                    image: w.image ?? '',
                    translations: w.translations ?? {},
                }));
                setWords(wordsList);
                console.log('Fetched words:', wordsList);

                // If we have initial data for select_image type, populate the images
                if (initialData?.type === 'select_image' && initialData.content && 'options' in initialData.content) {
                    const newImages = [...selectedImages];
                    initialData.content.options.forEach((wordId: string, index: number) => {
                        const word = wordsList.find(w => w.id === wordId);
                        if (word?.image) {
                            newImages[index] = word.image;
                        }
                    });
                    setSelectedImages(newImages);
                }
            } catch (error) {
                console.error('Failed to fetch words:', error);
            }
        }
        fetchWords();
    }, [initialData]);

    // Reset form values when initialData changes (for edit mode)
    useEffect(() => {
        console.log('initialData:', initialData);
        console.log('initialData.content:', initialData?.content);
        if (initialData) {
            reset(initialData);
            if (initialData.content && 'options' in initialData.content) {
                setValue('content.options', initialData.content.options);
                console.log('Set content.options to:', initialData.content.options);
            }
        } else if (questionType === 'translate') {
            reset({
                type: 'translate',
                content: {
                    type: 'translate',
                    options: ['', '', '', '', '', ''],
                    direction: 'from_english',
                },
            });
        } else if (questionType === 'select_image') {
            reset({
                type: 'select_image',
                content: {
                    type: 'select_image',
                    options: ['', '', '', ''],
                    correct: 0,
                },
            });
        } else if (questionType === 'tap_what_you_hear') {
            reset({
                type: 'tap_what_you_hear',
                content: {
                    type: 'tap_what_you_hear',
                    options: ['', '', '', ''],
                    correct: 0,
                },
            });
        } else if (questionType === 'type_what_you_hear') {
            reset({
                type: 'type_what_you_hear',
                content: {
                    type: 'type_what_you_hear',
                    options: [''],
                },
            });
        } else if (questionType === 'fill_in_blank') {
            reset({
                type: 'fill_in_blank',
                content: {
                    type: 'fill_in_blank',
                    options: [''],
                    blankIndex: undefined,
                },
            });
        } else if (questionType === 'complete_translation') {
            reset({
                type: 'complete_translation',
                content: {
                    type: 'complete_translation',
                    options: [''],
                    blankIndex: undefined,
                },
            });
        } else if (questionType === 'match_pairs') {
            reset({
                type: 'match_pairs',
                content: {
                    type: 'match_pairs',
                    options: ['', '', '', ''],
                },
            });
        }
    }, [initialData, reset, questionType, setValue]);

    useEffect(() => {
        if (questionType === 'translate') {
            const currentOptions = (watch('content.options') as string[] || []).filter(w => !!w);
            if (currentOptions.length > 0 && sentenceError) {
                setSentenceError(null);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watch('content.options'), questionType]);

    useEffect(() => {
        console.log('Form loaded. Initial question type:', questionType);
    }, []);

    useEffect(() => {
        console.log('Question type changed:', questionType);
    }, [questionType]);

    console.log('Form errors:', errors);
    console.log('Is submitting:', formIsSubmitting);

    const formErrors = errors as unknown as FormErrors;
    const options = watch('content.options') || ['', '', '', ''];
    console.log('Dropdown options (watch):', options);
    const correct = watch('content.correct');
    const isFormValid = questionType === 'select_image'
        ? options.every(option => option !== '') && correct !== undefined
        : questionType === 'translate'
            ? (watch('content.options') as string[] || []).filter(w => !!w).length > 0 &&
            watch('content.direction') !== undefined
            : questionType === 'fill_in_blank' || questionType === 'complete_translation'
                ? (watch('content.options') as string[] || []).filter(w => !!w).length > 0 &&
                watch('content.blankIndex') !== undefined
                : true;

    const handleOptionChange = (index: number, value: string) => {
        const currentOptions = watch('content.options') || [];
        const newOptions = [...currentOptions];
        newOptions[index] = value;
        setValue('content.options', newOptions);
        console.log(`Option at index ${index} changed to:`, value, 'Current options:', newOptions);
    };

    const handleAddOption = () => {
        const currentOptions = watch('content.options') || [];
        if (currentOptions.length === 0 || currentOptions[currentOptions.length - 1]) {
            appendOption('');
            console.log('Added new option. Options now:', [...currentOptions, '']);
        }
    };

    const handleRemoveOption = (index: number) => {
        removeOption(index);
        const currentOptions = watch('content.options') || [];
        console.log(`Removed option at index ${index}. Options now:`, currentOptions);
    };

    const onSubmit = async (data: QuestionFormData) => {
        try {
            setIsSubmitting(true);
            console.log('Form submission data:', data);
            console.log('Form validation errors:', errors);

            // Log specific validation errors for each field
            if (Object.keys(errors).length > 0) {
                console.group('Validation Errors');
                Object.entries(errors).forEach(([field, error]) => {
                    console.error(`${field}:`, error);
                });
                console.groupEnd();
            }

            let payload = {
                ...data,
                content: {
                    ...data.content,
                    type: data.type, // Ensure discriminator is set
                },
            };

            if (data.type === 'translate') {
                const cleanOptions = ((data.content as any).options || []).filter((w: string) => !!w);
                const direction = (data.content as { direction: 'from_english' | 'to_english' }).direction;
                payload = {
                    ...payload,
                    content: {
                        ...payload.content,
                        options: cleanOptions,
                        direction,
                        type: data.type,
                    },
                };
            } else if (data.type === 'fill_in_blank' || data.type === 'complete_translation') {
                const cleanOptions = ((data.content as any).options || []).filter((w: string) => !!w);
                const blankIndex = (data.content as { blankIndex: number }).blankIndex;
                payload = {
                    ...payload,
                    content: {
                        ...payload.content,
                        options: cleanOptions,
                        blankIndex,
                        type: data.type,
                    },
                };
            } else if (data.type === 'match_pairs') {
                payload = {
                    ...payload,
                    content: {
                        ...payload.content,
                        type: data.type,
                    },
                };
            } // else for other types, type is already set above

            // LOGGING FOR DEBUGGING
            console.log('Payload to be submitted:', payload);
            console.log('payload.type:', payload.type);
            console.log('payload.content.type:', payload.content?.type);

            // Get the current questions to determine the next order
            const currentQuestions = await getQuestionsForLesson(lessonId);
            const nextOrder = currentQuestions.length;

            if (initialData) {
                if (!initialData.id) {
                    toast.error('Question ID is missing.');
                    return;
                }
                // For updates, we don't need to send the order
                const { order, ...updatePayload } = payload;
                await updateQuestion(lessonId, initialData.id, updatePayload);
                toast.success('Question updated successfully!');
            } else {
                // For new questions, we include the order and required fields
                await addQuestionToLesson(lessonId, {
                    ...payload,
                    questionOrder: nextOrder,
                    question: '', // Required field
                    correctAnswer: '', // Required field
                    options: [], // Required field
                    explanation: '', // Required field
                    questionType: { id: 1 }, // Required field
                    unit: { id: 1 }, // Required field
                    language: { id: 1 }, // Required field
                    typeId: 1, // Required field
                    sentenceWords: [],
                    direction: '',
                    blankIndex: null,
                    correctOption: null,
                });
                toast.success('Question added successfully!');
            }
            onSuccess?.();
            if (!onSuccess) {
                router.push(`/admin/lessons/${lessonId}`);
            }
        } catch (error) {
            console.error('Error submitting question:', error);
            toast.error('Failed to save question');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderQuestionFields = () => {
        switch (questionType) {
            case 'select_image':
                return (
                    <>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Word Options (4 required)
                                </label>
                                <p className="text-sm text-gray-500 mb-4">
                                    Select 4 different words with images. The selected words will be shown to the user as options.
                                </p>
                                {[0, 1, 2, 3].map((index) => (
                                    <div key={index} className="space-y-2 mb-4">
                                        <div className="flex gap-2 items-center">
                                            <select
                                                {...register(`content.options.${index}`)}
                                                className="flex-1 p-2 border rounded-md"
                                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                            >
                                                <option value="">Select a word</option>
                                                {words
                                                    .filter(word => word.image) // Only show words with images
                                                    .filter(word => {
                                                        // Don't show words that are already selected in other options
                                                        const selectedOptions = watch('content.options') || [];
                                                        return !selectedOptions.includes(word.id) || selectedOptions[index] === word.id;
                                                    })
                                                    .map((word) => (
                                                        <option key={word.id} value={word.id}>
                                                            {word.translations?.en || word.id}
                                                        </option>
                                                    ))}
                                            </select>
                                            {selectedImages[index] && (
                                                <div className="w-16 h-16 flex-shrink-0">
                                                    <img
                                                        src={selectedImages[index]}
                                                        alt="Selected word"
                                                        className="w-full h-full object-cover rounded-md"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        {formErrors.content?.options?.[index] && (
                                            <p className="text-red-500 text-sm mt-1">{formErrors.content.options[index].message}</p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Correct Answer
                                </label>
                                <p className="text-sm text-gray-500 mb-2">
                                    Select which word is the correct answer.
                                </p>
                                <select
                                    {...register('content.correct', { valueAsNumber: true })}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="">Select correct answer</option>
                                    {(watch('content.options') || []).map((wordId, index) => {
                                        const word = words.find(w => String(w.id) === String(wordId));
                                        return (
                                            <option key={index} value={index}>
                                                {word ? (word.translations?.en || word.id) : wordId}
                                            </option>
                                        );
                                    })}
                                </select>
                                {formErrors.content?.correct && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.content.correct.message}</p>
                                )}
                            </div>
                        </div>
                    </>
                );

            case 'translate':
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Translation Direction
                            </label>
                            <select
                                {...register('content.direction')}
                                className="w-full p-2 border rounded-md mb-6"
                            >
                                <option value="from_english">From English</option>
                                <option value="to_english">To English</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Build Your Sentence
                            </label>
                            <p className="text-sm text-gray-500 mb-4">
                                Click the + button to add words to your sentence. You must add at least one word.
                            </p>
                            {sentenceError && (
                                <p className="text-red-500 text-sm mb-2">{sentenceError}</p>
                            )}
                            <div className="space-y-2">
                                {optionFields.map((field, index) => (
                                    <div key={field.id} className="flex gap-2 items-center">
                                        <select
                                            {...register(`content.options.${index}`)}
                                            className="flex-1 p-2 border rounded-md"
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            defaultValue={watch('content.options')[index] || ''}
                                        >
                                            <option value="">Select a word</option>
                                            {words.map((word) => {
                                                const selectedOptions = watch('content.options') || [];
                                                const isSelectedElsewhere = selectedOptions.some((opt, i) => i !== index && String(opt) === String(word.id));
                                                return (
                                                    <option
                                                        key={word.id}
                                                        value={word.id}
                                                        disabled={isSelectedElsewhere}
                                                    >
                                                        {word.translations?.en || word.id}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRemoveOption(index)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleAddOption}
                                >
                                    + Add Word
                                </Button>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium mb-2">
                                Options (6 required)
                            </label>
                            <p className="text-sm text-gray-500 mb-4">
                                Select 6 different words that will be shown as possible answers to the user.
                            </p>
                            <div className="space-y-2">
                                {[0, 1, 2, 3, 4, 5].map((index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <select
                                            {...register(`content.options.${index}`)}
                                            className="flex-1 p-2 border rounded-md"
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                        >
                                            <option value="">Select a word</option>
                                            {words
                                                .filter(word => {
                                                    const selectedOptions = watch('content.options') || [];
                                                    // Allow the current value, but filter out all other selected values
                                                    return (
                                                        !selectedOptions.includes(String(word.id)) ||
                                                        String(selectedOptions[index]) === String(word.id)
                                                    );
                                                })
                                                .map((word) => (
                                                    <option key={word.id} value={word.id}>
                                                        {word.translations?.en || word.id}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                );

            case 'tap_what_you_hear':
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Options (minimum 2 required)
                            </label>
                            <div className="space-y-2">
                                {[0, 1, 2, 3].map((index) => (
                                    <select
                                        key={index}
                                        {...register(`content.options.${index}`)}
                                        className="w-full p-2 border rounded-md"
                                        required={index < 2}
                                    >
                                        <option value="">Select a word</option>
                                        {words.map((word) => {
                                            const selectedOptions = watch('content.options') || [];
                                            const isSelectedElsewhere = selectedOptions.some((opt, i) => i !== index && String(opt) === String(word.id));
                                            return (
                                                <option
                                                    key={word.id}
                                                    value={word.id}
                                                    disabled={isSelectedElsewhere}
                                                >
                                                    {word.translations?.en || word.id}
                                                </option>
                                            );
                                        })}
                                    </select>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Leave the last two blank if you want fewer than 4 options.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Correct Answer
                            </label>
                            <select
                                {...register('content.correct', { valueAsNumber: true })}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="">Select correct answer</option>
                                {[0, 1, 2, 3].map((index) => {
                                    const selectedWordId = watch(`content.options.${index}`);
                                    const selectedWord = words.find(w => w.id === selectedWordId);
                                    return (
                                        <option key={index} value={index}>
                                            {selectedWord ? (selectedWord.translations?.en || selectedWord.id) : `Option ${index + 1}`}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </>
                );

            case 'type_what_you_hear':
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Build Your Sentence
                            </label>
                            <p className="text-sm text-gray-500 mb-4">
                                Click the + button to add words to your sentence. You must add at least one word.
                            </p>
                            <div className="space-y-2">
                                {optionFields.map((field, index) => (
                                    <div key={field.id} className="flex gap-2 items-center">
                                        <select
                                            {...register(`content.options.${index}`)}
                                            className="flex-1 p-2 border rounded-md"
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            defaultValue={watch('content.options')[index] || ''}
                                        >
                                            <option value="">Select a word</option>
                                            {words.map((word) => {
                                                const selectedOptions = watch('content.options') || [];
                                                const isSelectedElsewhere = selectedOptions.some((opt, i) => i !== index && String(opt) === String(word.id));
                                                return (
                                                    <option
                                                        key={word.id}
                                                        value={word.id}
                                                        disabled={isSelectedElsewhere}
                                                    >
                                                        {word.translations?.en || word.id}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRemoveOption(index)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleAddOption}
                                >
                                    + Add Word
                                </Button>
                            </div>
                        </div>
                    </>
                );

            case 'fill_in_blank':
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Build Your Sentence
                            </label>
                            <p className="text-sm text-gray-500 mb-4">
                                Click the + button to add words to your sentence. You must add at least one word.
                            </p>
                            <div className="space-y-2">
                                {optionFields.map((field, index) => (
                                    <div key={field.id} className="flex gap-2 items-center">
                                        <select
                                            {...register(`content.options.${index}`)}
                                            className="flex-1 p-2 border rounded-md"
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            defaultValue={watch('content.options')[index] || ''}
                                        >
                                            <option value="">Select a word</option>
                                            {words.map((word) => {
                                                const selectedOptions = watch('content.options') || [];
                                                const isSelectedElsewhere = selectedOptions.some((opt, i) => i !== index && String(opt) === String(word.id));
                                                return (
                                                    <option
                                                        key={word.id}
                                                        value={word.id}
                                                        disabled={isSelectedElsewhere}
                                                    >
                                                        {word.translations?.en || word.id}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRemoveOption(index)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleAddOption}
                                >
                                    + Add Word
                                </Button>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium mb-2">
                                Select Word to Omit
                            </label>
                            <p className="text-sm text-gray-500 mb-4">
                                Choose which word will be replaced with a blank in the sentence.
                            </p>
                            <select
                                {...register('content.blankIndex', { valueAsNumber: true })}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="">Select word to omit</option>
                                {(() => {
                                    const optionsArr = watch('content.options') || [];
                                    console.log('Populating omit dropdown with options:', optionsArr);
                                    console.log('words:', words);
                                    return optionsArr.map((wordId, index) => {
                                        const word = words.find(w => String(w.id) === String(wordId));
                                        return word ? (
                                            <option key={index} value={index}>
                                                {word.translations?.en || word.id}
                                            </option>
                                        ) : null;
                                    });
                                })()}
                            </select>
                        </div>
                    </>
                );

            case 'complete_translation':
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Build Your Sentence
                            </label>
                            <p className="text-sm text-gray-500 mb-4">
                                Click the + button to add words to your sentence. You must add at least one word.
                            </p>
                            <div className="space-y-2">
                                {optionFields.map((field, index) => (
                                    <div key={field.id} className="flex gap-2 items-center">
                                        <select
                                            {...register(`content.options.${index}`)}
                                            className="flex-1 p-2 border rounded-md"
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            defaultValue={watch('content.options')[index] || ''}
                                        >
                                            <option value="">Select a word</option>
                                            {words.map((word) => {
                                                const selectedOptions = watch('content.options') || [];
                                                const isSelectedElsewhere = selectedOptions.some((opt, i) => i !== index && String(opt) === String(word.id));
                                                return (
                                                    <option
                                                        key={word.id}
                                                        value={word.id}
                                                        disabled={isSelectedElsewhere}
                                                    >
                                                        {word.translations?.en || word.id}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRemoveOption(index)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleAddOption}
                                >
                                    + Add Word
                                </Button>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium mb-2">
                                Select Word to Omit
                            </label>
                            <p className="text-sm text-gray-500 mb-4">
                                Choose which word will be replaced with a blank in the sentence.
                            </p>
                            <select
                                {...register('content.blankIndex', { valueAsNumber: true })}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="">Select word to omit</option>
                                {(() => {
                                    const optionsArr = watch('content.options') || [];
                                    console.log('Populating omit dropdown with options:', optionsArr);
                                    console.log('words:', words);
                                    return optionsArr.map((wordId, index) => {
                                        const word = words.find(w => String(w.id) === String(wordId));
                                        return word ? (
                                            <option key={index} value={index}>
                                                {word.translations?.en || word.id}
                                            </option>
                                        ) : null;
                                    });
                                })()}
                            </select>
                        </div>
                    </>
                );

            case 'match_pairs':
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Options (4 required)
                            </label>
                            <p className="text-sm text-gray-500 mb-4">
                                Select 4 different words that will be shown as pairs to match.
                            </p>
                            <div className="space-y-2">
                                {[0, 1, 2, 3].map((index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <select
                                            {...register(`content.options.${index}`)}
                                            className="flex-1 p-2 border rounded-md"
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                        >
                                            <option value="">Select a word</option>
                                            {words
                                                .filter(word => {
                                                    const selectedOptions = watch('content.options') || [];
                                                    // Allow the current value, but filter out all other selected values
                                                    return (
                                                        !selectedOptions.includes(String(word.id)) ||
                                                        String(selectedOptions[index]) === String(word.id)
                                                    );
                                                })
                                                .map((word) => (
                                                    <option key={word.id} value={word.id}>
                                                        {word.translations?.en || word.id}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    useEffect(() => {
        if (initialData && words.length > 0) {
            const currentOptions = watch('content.options');
            const newOptions = initialData.content?.options || ['', '', '', ''];
            // Only reset if options are different
            if (
                !currentOptions ||
                currentOptions.length !== newOptions.length ||
                currentOptions.some((opt, i) => opt !== newOptions[i])
            ) {
                const newInitial = {
                    ...initialData,
                    content: {
                        ...initialData.content,
                        options: newOptions,
                    },
                };
                reset(newInitial);
                setValue('content.options', newInitial.content.options); // force update
                console.log('Reset form with:', newInitial);
            }
        }
    }, [initialData, words, reset, setValue, watch]);

    // Only render the form after words are loaded to prevent hydration mismatch
    if (words.length === 0) {
        return <div>Loading...</div>;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
                <label className="block text-sm font-medium mb-2">
                    Question Type
                </label>
                <select
                    {...register('type')}
                    className="w-full p-2 border rounded-md"
                >
                    {QUESTION_TYPES.map((type) => (
                        <option key={type} value={type}>
                            {type.replace(/_/g, ' ').toUpperCase()}
                        </option>
                    ))}
                </select>
                {formErrors.type && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.type.message}</p>
                )}
            </div>

            {renderQuestionFields()}

            <div className="flex justify-end space-x-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/admin/lessons/${lessonId}`)}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={formIsSubmitting || !isFormValid}>
                    {formIsSubmitting
                        ? initialData
                            ? 'Updating...'
                            : 'Adding...'
                        : initialData
                            ? 'Update Question'
                            : 'Add Question'}
                </Button>
            </div>
        </form>
    );
} 