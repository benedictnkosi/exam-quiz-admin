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
import { QuestionOptions } from '../../../../components/ui/question-options';
import { SentenceBuilder } from '../../../../components/ui/sentence-builder';

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
        [key: string]: string | undefined;
    };
}

interface Question {
    id: string;
    type: 'select_image' | 'translate' | 'tap_what_you_hear' | 'type_what_you_hear' | 'fill_in_blank' | 'match_pairs' | 'complete_translation';
    order?: number;
    options: string[];
    correctOption: number | null;
    questionOrder: number;
    blankIndex: number | null;
    sentenceWords: string[] | null;
    direction: string | null;
    words: Array<{
        id: string;
        image?: string;
        audio?: Record<string, string>;
        translations?: Record<string, string>;
    }>;
}

interface QuestionFormProps {
    lessonId: string;
    question?: Question | null;
    onSuccess?: () => void;
}

type FormErrors = {
    type?: { message: string };
    content?: {
        audio?: { message: string };
        options?: Array<{ message: string }>;
        correct?: { message: string };
        matchType?: { message: string };
        direction?: { message: string };
    };
};

// Helper function to get the first available translation
const getFirstAvailableTranslation = (word: Word | undefined): string => {
    if (!word) return '';
    if (!word.translations) return word.id;
    if (word.translations.en) return word.translations.en;
    // Get the first available translation
    const firstTranslation = Object.values(word.translations).find(t => t);
    return firstTranslation || word.id;
};

// Add helper function to sort words by English translation
const sortWordsByEnglishTranslation = (words: Word[]): Word[] => {
    return [...words].sort((a, b) => {
        const aTranslation = a.translations?.en || '';
        const bTranslation = b.translations?.en || '';
        return aTranslation.localeCompare(bTranslation);
    });
};

export function QuestionForm({ lessonId, question, onSuccess }: QuestionFormProps) {
    const router = useRouter();
    const [words, setWords] = useState<Word[]>([]);
    const [selectedImages, setSelectedImages] = useState<string[]>(() => {
        if (question?.type === 'select_image') {
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
        defaultValues: question ? {
            type: question.type,
            content: {
                type: question.type,
                options: question.options || [],
                ...(question.type === 'select_image' && { correct: question.correctOption ?? 0 }),
                ...(question.type === 'translate' && {
                    sentenceWords: question.sentenceWords || [],
                    direction: question.direction as 'from_english' | 'to_english' || 'from_english',
                }),
                ...(question.type === 'tap_what_you_hear' && {
                    sentenceWords: question.sentenceWords || [],
                    options: question.options || [],
                }),
                ...(question.type === 'type_what_you_hear' && {
                    sentenceWords: question.sentenceWords || [],
                }),
                ...(question.type === 'fill_in_blank' && {
                    sentenceWords: question.options || [],
                    blankIndex: question.blankIndex ?? 0,
                }),
                ...(question.type === 'complete_translation' && {
                    sentenceWords: question.options || [],
                    blankIndex: question.blankIndex ?? 0,
                }),
                ...(question.type === 'match_pairs' && {
                    options: question.options || [],
                    matchType: 'text',
                }),
            },
        } : {
            type: 'translate',
            content: {
                type: 'translate',
                options: [],
                sentenceWords: [],
                direction: ''
            },
        },
    });

    const questionType = watch('type');

    // useFieldArray for options (all types except translate sentence)
    const {
        fields: optionFields,
        append: appendOption,
        remove: removeOption,
    } = useFieldArray<any>({
        control,
        name: 'content.options',
    });
    // useFieldArray for translate sentence
    const {
        fields: sentenceFields,
        append: appendSentence,
        remove: removeSentence,
    } = useFieldArray<any>({
        control,
        name: 'content.sentenceWords',
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
                if (question?.type === 'select_image') {
                    const newImages = [...selectedImages];
                    question.options.forEach((wordId: string, index: number) => {
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
    }, [question]);

    useEffect(() => {
        if (question) {
            const formData = {
                type: question.type,
                content: {
                    type: question.type,
                    options: question.options || [],
                    ...(question.type === 'select_image' && { correct: question.correctOption ?? 0 }),
                    ...(question.type === 'translate' && {
                        sentenceWords: question.sentenceWords || [],
                        direction: question.direction as 'from_english' | 'to_english' || 'from_english',
                    }),
                    ...(question.type === 'fill_in_blank' && { blankIndex: question.blankIndex ?? 0 }),
                    ...(question.type === 'complete_translation' && { blankIndex: question.blankIndex ?? 0 }),
                },
            };
            reset(formData);
        }
    }, [question, reset]);

    useEffect(() => {
        if (questionType === 'translate') {
            const currentOptions = (watch('content.options') as string[] || []).filter(w => !!w);
            if (currentOptions.length > 0 && sentenceError) {
                setSentenceError(null);
            }
        }
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
            ? watch('content.direction') !== undefined
            : questionType === 'fill_in_blank' || questionType === 'complete_translation'
                ? (watch('content.options') as string[] || []).filter(w => !!w).length > 0 &&
                watch('content.blankIndex') !== undefined
                : true;

    const handleOptionChange = (index: number, value: string) => {
        const currentOptions = watch('content.options') || [];
        console.log('Current options before change:', currentOptions);
        const newOptions = [...currentOptions];
        newOptions[index] = value;
        console.log('Setting new options:', newOptions);
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

            let cleanOptions: string[] = [];
            let sentenceWords: string[] = [];
            if (data.type === 'translate') {
                const cleanSentence = ((data.content as any).sentenceWords || []).filter((w: string) => !!w);
                cleanOptions = ((data.content as any).options || []).filter((w: string) => !!w);
                const direction = (data.content as { direction: 'from_english' | 'to_english' }).direction;
                payload = {
                    ...payload,
                    content: {
                        sentenceWords: cleanSentence,
                        options: cleanOptions,
                        direction,
                        type: data.type,
                    },
                };
            } else if (data.type === 'tap_what_you_hear') {
                const cleanSentence = ((data.content as any).sentenceWords || []).filter((w: string) => !!w);
                cleanOptions = ((data.content as any).options || []).filter((w: string) => !!w);
                payload = {
                    ...payload,
                    content: {
                        sentenceWords: cleanSentence,
                        options: cleanOptions,
                        type: data.type,
                    },
                };
            } else if (data.type === 'type_what_you_hear') {
                const cleanSentence = ((data.content as any).sentenceWords || []).filter((w: string) => !!w);
                payload = {
                    ...payload,
                    content: {
                        sentenceWords: cleanSentence,
                        type: data.type,
                    },
                };
            } else if (data.type === 'fill_in_blank' || data.type === 'complete_translation') {
                const sentenceWords = ((data.content as any).sentenceWords || []).filter((w: string) => !!w);
                const blankIndex = (data.content as { blankIndex: number }).blankIndex;
                payload = {
                    ...payload,
                    content: {
                        sentenceWords,
                        blankIndex,
                        type: data.type,
                    },
                };
            } else if (data.type === 'match_pairs') {
                const cleanOptions = ((data.content as any).options || []).filter((w: string) => !!w);
                const matchType = (data.content as { matchType: 'audio' | 'text' }).matchType;
                payload = {
                    ...payload,
                    content: {
                        options: cleanOptions,
                        matchType,
                        type: data.type,
                    },
                };
            }

            // LOGGING FOR DEBUGGING
            console.log('Payload to be submitted:', payload);
            console.log('payload.type:', payload.type);
            console.log('payload.content.type:', payload.content?.type);

            // Get the current questions to determine the next order
            const currentQuestions = await getQuestionsForLesson(lessonId);
            const nextOrder = currentQuestions.length;

            if (question) {
                if (!question.id) {
                    toast.error('Question ID is missing.');
                    return;
                }
                // For updates, we don't need to send the order
                const { order, ...updatePayload } = payload;
                await updateQuestion(lessonId, question.id, updatePayload);
                toast.success('Question updated successfully!');
            } else {
                // For new questions, we include the order and required fields
                await addQuestionToLesson(lessonId, {
                    ...payload,
                    questionOrder: nextOrder,
                    question: '', // Required field
                    correctAnswer: '', // Required field
                    explanation: '', // Required field
                    questionType: { id: 1 }, // Required field
                    unit: { id: 1 }, // Required field
                    language: { id: 1 }, // Required field
                    typeId: 1, // Required field
                    sentenceWords: data.type === 'tap_what_you_hear' ? sentenceWords : [],
                    direction: '',
                    blankIndex: null,
                    correctOption: null,
                    options: data.type === 'tap_what_you_hear' ? sentenceWords : [],
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
                                                {sortWordsByEnglishTranslation(words)
                                                    .filter(word => word.image) // Only show words with images
                                                    .filter(word => {
                                                        // Don't show words that are already selected in other options
                                                        const selectedOptions = watch('content.options') || [];
                                                        return !selectedOptions.includes(word.id) || selectedOptions[index] === word.id;
                                                    })
                                                    .map((word) => (
                                                        <option key={word.id} value={word.id}>
                                                            {getFirstAvailableTranslation(word)}
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
                                    {(() => {
                                        const optionsArr = watch('content.options') || [];
                                        return optionsArr
                                            .map((wordId, index) => {
                                                const word = words.find(w => String(w.id) === String(wordId));
                                                return word ? { word, index } : null;
                                            })
                                            .filter(item => item !== null)
                                            .sort((a, b) => {
                                                const aTranslation = a?.word.translations?.en || '';
                                                const bTranslation = b?.word.translations?.en || '';
                                                return aTranslation.localeCompare(bTranslation);
                                            })
                                            .map(item => (
                                                <option key={item?.index} value={item?.index}>
                                                    {getFirstAvailableTranslation(item?.word)}
                                                </option>
                                            ));
                                    })()}
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
                                {...register('content.direction', { required: 'Please select a translation direction' })}
                                className="w-full p-2 border rounded-md mb-6"
                                defaultValue=""
                            >
                                <option value="">Please select direction</option>
                                <option value="from_english">From English</option>
                                <option value="to_english">To English</option>
                            </select>
                            {formErrors.content?.direction && (
                                <p className="text-red-500 text-sm mt-1">{formErrors.content.direction.message}</p>
                            )}
                        </div>
                        <SentenceBuilder
                            register={register}
                            watch={watch}
                            setValue={setValue}
                            control={control}
                            words={words}
                            sortWordsByEnglishTranslation={sortWordsByEnglishTranslation}
                            getFirstAvailableTranslation={getFirstAvailableTranslation}
                            error={sentenceError}
                            syncWithOptions={true}
                            fieldArrayName="content.sentenceWords"
                        />
                        <QuestionOptions
                            register={register}
                            watch={watch}
                            setValue={setValue}
                            control={control}
                            words={words}
                            sortWordsByEnglishTranslation={sortWordsByEnglishTranslation}
                            getFirstAvailableTranslation={getFirstAvailableTranslation}
                            title="Options"
                            description="Select up to 10 different words that will be shown as possible answers to the user."
                            fieldArrayName="content.options"
                        />
                    </>
                );

            case 'tap_what_you_hear':
                return (
                    <>
                        <SentenceBuilder
                            register={register}
                            watch={watch}
                            setValue={setValue}
                            control={control}
                            words={words}
                            sortWordsByEnglishTranslation={sortWordsByEnglishTranslation}
                            getFirstAvailableTranslation={getFirstAvailableTranslation}
                            title="Build Your Sentence"
                            description="Add as many words as needed to build the sentence."
                            fieldArrayName="content.sentenceWords"
                        />
                        <QuestionOptions
                            register={register}
                            watch={watch}
                            setValue={setValue}
                            control={control}
                            words={words}
                            sortWordsByEnglishTranslation={sortWordsByEnglishTranslation}
                            getFirstAvailableTranslation={getFirstAvailableTranslation}
                            title="Options"
                            description="Select up to 10 different words that will be shown as possible answers to the user."
                            fieldArrayName="content.options"
                        />
                    </>
                );

            case 'type_what_you_hear':
                return (
                    <SentenceBuilder
                        register={register}
                        watch={watch}
                        setValue={setValue}
                        control={control}
                        words={words}
                        sortWordsByEnglishTranslation={sortWordsByEnglishTranslation}
                        getFirstAvailableTranslation={getFirstAvailableTranslation}
                        title="Build Your Sentence"
                        description="Click the + button to add words to your sentence. You must add at least one word."
                        fieldArrayName="content.sentenceWords"
                    />
                );

            case 'fill_in_blank':
                return (
                    <>
                        <SentenceBuilder
                            register={register}
                            watch={watch}
                            setValue={setValue}
                            control={control}
                            words={words}
                            sortWordsByEnglishTranslation={sortWordsByEnglishTranslation}
                            getFirstAvailableTranslation={getFirstAvailableTranslation}
                            title="Build Your Sentence"
                            description="Click the + button to add words to your sentence. You must add at least one word."
                            fieldArrayName="content.sentenceWords"
                        />

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
                                    const sentenceWords = watch('content.sentenceWords') || [];
                                    return sentenceWords
                                        .map((wordId, index) => {
                                            const word = words.find(w => String(w.id) === String(wordId));
                                            return word ? { word, index } : null;
                                        })
                                        .filter(item => item !== null)
                                        .sort((a, b) => {
                                            const aTranslation = a?.word.translations?.en || '';
                                            const bTranslation = b?.word.translations?.en || '';
                                            return aTranslation.localeCompare(bTranslation);
                                        })
                                        .map(item => (
                                            <option key={item?.index} value={item?.index}>
                                                {getFirstAvailableTranslation(item?.word)}
                                            </option>
                                        ));
                                })()}
                            </select>
                        </div>
                    </>
                );

            case 'complete_translation':
                return (
                    <>
                        <SentenceBuilder
                            register={register}
                            watch={watch}
                            setValue={setValue}
                            control={control}
                            words={words}
                            sortWordsByEnglishTranslation={sortWordsByEnglishTranslation}
                            getFirstAvailableTranslation={getFirstAvailableTranslation}
                            title="Build Your Sentence"
                            description="Click the + button to add words to your sentence. You must add at least one word."
                            fieldArrayName="content.sentenceWords"
                        />

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
                                    const sentenceWords = watch('content.sentenceWords') || [];
                                    return sentenceWords
                                        .map((wordId, index) => {
                                            const word = words.find(w => String(w.id) === String(wordId));
                                            return word ? { word, index } : null;
                                        })
                                        .filter(item => item !== null)
                                        .sort((a, b) => {
                                            const aTranslation = a?.word.translations?.en || '';
                                            const bTranslation = b?.word.translations?.en || '';
                                            return aTranslation.localeCompare(bTranslation);
                                        })
                                        .map(item => (
                                            <option key={item?.index} value={item?.index}>
                                                {getFirstAvailableTranslation(item?.word)}
                                            </option>
                                        ));
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
                                Match Type
                            </label>
                            <select
                                {...register('content.matchType')}
                                className="w-full p-2 border rounded-md mb-6"
                            >
                                <option value="">Select Type</option>
                                <option value="audio">Audio</option>
                                <option value="text">Text</option>
                            </select>
                            {formErrors.content?.matchType && (
                                <p className="text-red-500 text-sm mt-1">{formErrors.content.matchType.message}</p>
                            )}
                        </div>
                        <QuestionOptions
                            register={register}
                            watch={watch}
                            setValue={setValue}
                            control={control}
                            words={words}
                            sortWordsByEnglishTranslation={sortWordsByEnglishTranslation}
                            getFirstAvailableTranslation={getFirstAvailableTranslation}
                            title="Options"
                            description="Select up to 10 different words that will be shown as possible answers to the user."
                            fieldArrayName="content.options"
                        />
                    </>
                );

            default:
                return null;
        }
    };

    useEffect(() => {
        if (question && words.length > 0) {
            console.log('Question data:', question);
            console.log('Words data:', words);
            const currentOptions = watch('content.options');
            console.log('Current options before reset:', currentOptions);
            let newOptions;
            let newInitial: QuestionFormData;

            // Handle options based on question type
            switch (question.type) {
                case 'select_image':
                    newOptions = question.options || ['', '', '', ''];
                    break;
                case 'translate':
                    // For translate, ensure we have all options from the question
                    newOptions = question.options || [];
                    console.log('Translate question - Original options:', question.options);
                    console.log('Translate question - New options:', newOptions);
                    break;
                case 'fill_in_blank':
                case 'complete_translation':
                    newOptions = question.options || [];
                    break;
                case 'match_pairs':
                    newOptions = question.options || ['', '', '', '', ''];
                    break;
                case 'tap_what_you_hear':
                    newOptions = question.options || [];
                    break;
                case 'type_what_you_hear':
                    newOptions = question.sentenceWords || [];
                    break;
                default:
                    newOptions = question.options || [];
            }

            // Create new initial state based on question type
            switch (question.type) {
                case 'select_image':
                    newInitial = {
                        type: 'select_image',
                        content: {
                            type: 'select_image',
                            options: newOptions,
                            correct: question.correctOption ?? 0
                        }
                    } as QuestionFormData;
                    break;
                case 'translate':
                    console.log('Creating translate initial state with options:', question.options);
                    newInitial = {
                        type: 'translate',
                        content: {
                            type: 'translate',
                            options: question.options || [], // Use the original options array
                            sentenceWords: question.sentenceWords || [],
                            direction: question.direction as 'from_english' | 'to_english' || 'from_english'
                        }
                    } as QuestionFormData;
                    console.log('Translate initial state created:', newInitial);
                    break;
                case 'fill_in_blank':
                    newInitial = {
                        type: 'fill_in_blank',
                        content: {
                            type: 'fill_in_blank',
                            sentenceWords: question.sentenceWords || [], // Use sentenceWords directly instead of options
                            blankIndex: question.blankIndex ?? 0
                        }
                    } as QuestionFormData;
                    break;
                case 'complete_translation':
                    newInitial = {
                        type: 'complete_translation',
                        content: {
                            type: 'complete_translation',
                            sentenceWords: question.sentenceWords || [],
                            blankIndex: question.blankIndex ?? 0
                        }
                    } as QuestionFormData;
                    break;
                case 'match_pairs':
                    newInitial = {
                        type: 'match_pairs',
                        content: {
                            type: 'match_pairs',
                            options: newOptions,
                            matchType: 'text'
                        }
                    } as QuestionFormData;
                    break;
                case 'tap_what_you_hear':
                    newInitial = {
                        type: 'tap_what_you_hear',
                        content: {
                            type: 'tap_what_you_hear',
                            options: question.options || [],
                            sentenceWords: question.sentenceWords || []
                        }
                    } as QuestionFormData;
                    break;
                case 'type_what_you_hear':
                    newInitial = {
                        type: 'type_what_you_hear',
                        content: {
                            type: 'type_what_you_hear',
                            sentenceWords: question.sentenceWords || []
                        }
                    } as QuestionFormData;
                    break;
                default:
                    return;
            }

            console.log('About to reset form with:', newInitial);
            reset(newInitial);

            // Force update options for all question types except type_what_you_hear
            if (question.type !== 'type_what_you_hear') {
                // Ensure we're using the original options array with word IDs
                const optionsToSet = question.options || [];
                console.log('Setting options to:', optionsToSet);
                setValue('content.options', optionsToSet);

                // Log the state after setting options
                setTimeout(() => {
                    const currentOptionsAfterSet = watch('content.options');
                    console.log('Options after setValue:', currentOptionsAfterSet);
                }, 0);
            }

            console.log('Form reset complete');
        }
    }, [question, words, reset, setValue, watch]);

    // Reset form when type changes
    useEffect(() => {
        if (!question) {  // Only reset for new questions
            let newDefaults: QuestionFormData;

            switch (questionType) {
                case 'select_image':
                    newDefaults = {
                        type: 'select_image',
                        content: {
                            type: 'select_image',
                            options: ['', '', '', ''],
                            correct: 0
                        }
                    };
                    break;
                case 'translate':
                    newDefaults = {
                        type: 'translate',
                        content: {
                            type: 'translate',
                            options: [],
                            sentenceWords: [],
                            direction: ''
                        }
                    };
                    break;
                case 'tap_what_you_hear':
                    newDefaults = {
                        type: 'tap_what_you_hear',
                        content: {
                            type: 'tap_what_you_hear',
                            options: [],
                            sentenceWords: []
                        }
                    };
                    break;
                case 'type_what_you_hear':
                    newDefaults = {
                        type: 'type_what_you_hear',
                        content: {
                            type: 'type_what_you_hear',
                            sentenceWords: []
                        }
                    };
                    break;
                case 'fill_in_blank':
                    newDefaults = {
                        type: 'fill_in_blank',
                        content: {
                            type: 'fill_in_blank',
                            sentenceWords: [],
                            blankIndex: 0
                        }
                    };
                    break;
                case 'complete_translation':
                    newDefaults = {
                        type: 'complete_translation',
                        content: {
                            type: 'complete_translation',
                            sentenceWords: [],
                            blankIndex: 0
                        }
                    };
                    break;
                case 'match_pairs':
                    newDefaults = {
                        type: 'match_pairs',
                        content: {
                            type: 'match_pairs',
                            options: ['', '', '', '', ''],
                            matchType: ''
                        }
                    };
                    break;
                default:
                    return;
            }

            reset(newDefaults);
        }
    }, [questionType, reset, question]);

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
                    onClick={() => onSuccess?.()}
                >
                    Cancel
                </Button>
                {question && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            // Create a copy of the current question data without the ID
                            const questionData = { ...question };
                            delete questionData.id;

                            // Ensure we have a valid question type
                            if (!questionData.type) return;

                            // Reset the form with the copied data
                            let newFormData: QuestionFormData;

                            switch (questionData.type) {
                                case 'select_image':
                                    newFormData = {
                                        type: 'select_image',
                                        content: {
                                            type: 'select_image',
                                            options: questionData.options || [],
                                            correct: questionData.correctOption ?? 0
                                        }
                                    };
                                    break;
                                case 'translate':
                                    newFormData = {
                                        type: 'translate',
                                        content: {
                                            type: 'translate',
                                            options: questionData.options || [],
                                            sentenceWords: questionData.sentenceWords || [],
                                            direction: questionData.direction as 'from_english' | 'to_english' || 'from_english'
                                        }
                                    };
                                    break;
                                case 'tap_what_you_hear':
                                    newFormData = {
                                        type: 'tap_what_you_hear',
                                        content: {
                                            type: 'tap_what_you_hear',
                                            options: questionData.options || [],
                                            sentenceWords: questionData.sentenceWords || []
                                        }
                                    };
                                    break;
                                case 'type_what_you_hear':
                                    newFormData = {
                                        type: 'type_what_you_hear',
                                        content: {
                                            type: 'type_what_you_hear',
                                            sentenceWords: questionData.sentenceWords || []
                                        }
                                    };
                                    break;
                                case 'fill_in_blank':
                                    newFormData = {
                                        type: 'fill_in_blank',
                                        content: {
                                            type: 'fill_in_blank',
                                            sentenceWords: questionData.options || [],
                                            blankIndex: questionData.blankIndex ?? 0
                                        }
                                    };
                                    break;
                                case 'complete_translation':
                                    newFormData = {
                                        type: 'complete_translation',
                                        content: {
                                            type: 'complete_translation',
                                            sentenceWords: questionData.options || [],
                                            blankIndex: questionData.blankIndex ?? 0
                                        }
                                    };
                                    break;
                                case 'match_pairs':
                                    newFormData = {
                                        type: 'match_pairs',
                                        content: {
                                            type: 'match_pairs',
                                            options: questionData.options || [],
                                            matchType: 'text'
                                        }
                                    };
                                    break;
                                default:
                                    return;
                            }

                            reset(newFormData);
                            // Clear the question prop to treat it as a new question
                            question = null;
                        }}
                    >
                        Save as New
                    </Button>
                )}
                <Button type="submit" disabled={formIsSubmitting || !isFormValid}>
                    {formIsSubmitting
                        ? question
                            ? 'Updating...'
                            : 'Adding...'
                        : question
                            ? 'Update Question'
                            : 'Add Question'}
                </Button>
            </div>
        </form>
    );
} 