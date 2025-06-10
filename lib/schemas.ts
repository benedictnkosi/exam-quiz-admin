import { z } from 'zod';

export const unitSchema = z.object({
    unitId: z.string().min(1, 'Unit ID is required'),
    title: z.string().min(1, 'Title is required'),
    availableLanguages: z.array(z.string()).min(1, 'At least one language must be selected'),
});

export const lessonSchema = z.object({
    unitId: z.string().min(1, 'Unit ID is required'),
    title: z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(100, 'Title must be less than 100 characters')
        .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Title can only contain letters, numbers, spaces, hyphens, and underscores'),
    lessonOrder: z.number().optional(),
});

export const questionSchema = z.object({
    type: z.enum([
        'select_image',
        'translate',
        'tap_what_you_hear',
        'type_what_you_hear',
        'fill_in_blank',
        'match_pairs',
        'complete_translation',
    ]),
    order: z.number().optional(),
    content: z.discriminatedUnion('type', [
        z.object({
            type: z.literal('select_image'),
            options: z.array(z.string()).length(4, 'Must provide exactly 6 word options'),
            correct: z.number().min(0).max(3, 'Correct answer must be between 0 and 3'),
        }),
        z.object({
            type: z.literal('translate'),
            sentence: z.array(z.string()).min(1, 'At least one word is required for the sentence'),
            options: z.array(z.string()).length(6, 'Must provide exactly 6 possible answers'),
            direction: z.enum(['from_english', 'to_english'], {
                required_error: 'Translation direction is required',
            }),
        }),
        z.object({
            type: z.literal('tap_what_you_hear'),
            options: z.array(z.string()).min(1, 'At least one word is required'),
            possibleAnswers: z.array(z.string()).length(6, 'Must provide exactly 6 possible answers'),
        }),
        z.object({
            type: z.literal('type_what_you_hear'),
            options: z.array(z.string()).min(1, 'At least one word is required'),
        }),
        z.object({
            type: z.literal('fill_in_blank'),
            options: z.array(z.string()).min(1, 'At least one word is required'),
            blankIndex: z.number().min(0, 'Must select a word to omit'),
        }),
        z.object({
            type: z.literal('complete_translation'),
            options: z.array(z.string()).min(1, 'At least one word is required'),
            blankIndex: z.number().min(0, 'Must select a word to omit'),
        }),
        z.object({
            type: z.literal('match_pairs'),
            options: z.array(z.string()).length(4, 'Must provide exactly 4 options'),
        }),
    ]),
});

export type UnitFormData = z.infer<typeof unitSchema>;
export type LessonFormData = z.infer<typeof lessonSchema>;
export type QuestionFormData = z.infer<typeof questionSchema>; 