import { Button } from '@/components/ui/button';
import { useFieldArray, UseFormRegister, UseFormWatch, UseFormSetValue, Control } from 'react-hook-form';
import { QuestionFormData } from '@/lib/schemas';
import { useEffect } from 'react';

interface Word {
    id: string;
    image?: string;
    translations?: {
        en?: string;
        [key: string]: string | undefined;
    };
}

interface SentenceBuilderProps {
    register: UseFormRegister<any>;
    watch: UseFormWatch<any>;
    setValue: UseFormSetValue<any>;
    control: Control<any>;
    words: Word[];
    sortWordsByEnglishTranslation: (words: Word[]) => Word[];
    getFirstAvailableTranslation: (word: Word | undefined) => string;
    title?: string;
    description?: string;
    error?: string | null;
    syncWithOptions?: boolean;
    fieldArrayName: string;
}

export function SentenceBuilder({
    register,
    watch,
    setValue,
    control,
    words,
    sortWordsByEnglishTranslation,
    getFirstAvailableTranslation,
    title = 'Build Your Sentence',
    description = 'Click the + button to add words to your sentence. You must add at least one word.',
    error,
    syncWithOptions = false,
    fieldArrayName,
}: SentenceBuilderProps) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: fieldArrayName,
    });

    const handleOptionChange = (index: number, value: string) => {
        const currentOptions = watch(fieldArrayName) || [];
        const newOptions = [...currentOptions];
        newOptions[index] = value;
        setValue(fieldArrayName, newOptions);

        // Add the word to options if it's not already there
        if (value) {
            const currentOptions = watch('content.options') || [];
            if (!currentOptions.includes(value)) {
                const newOptions = [...currentOptions, value];
                setValue('content.options', newOptions);
            }
        }
    };

    // Sync sentence words with options if needed
    useEffect(() => {
        if (syncWithOptions) {
            const sentenceWords = watch(fieldArrayName) || [];
            const currentOptions = watch('content.options') || [];

            // Only add new sentence words to options, don't remove existing ones
            const newOptions = [...currentOptions];
            sentenceWords.forEach((word: string) => {
                if (word && !newOptions.includes(word)) {
                    newOptions.push(word);
                }
            });

            // Update options if they've changed
            if (JSON.stringify(newOptions) !== JSON.stringify(currentOptions)) {
                console.log('SentenceBuilder: Updating options from', currentOptions, 'to', newOptions);
                setValue('content.options', newOptions);
            }
        }
    }, [watch(fieldArrayName), syncWithOptions]);

    return (
        <div>
            <label className="block text-sm font-medium mb-2">
                {title}
            </label>
            <p className="text-sm text-gray-500 mb-4">
                {description}
            </p>
            {error && (
                <p className="text-red-500 text-sm mb-2">{error}</p>
            )}
            <div className="space-y-2">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-center">
                        <select
                            {...register(`${fieldArrayName}.${index}`)}
                            className="flex-1 p-2 border rounded-md"
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            value={watch(fieldArrayName)[index] || ''}
                        >
                            <option value="">Select a word</option>
                            {sortWordsByEnglishTranslation(words).map((word) => {
                                const selectedOptions = watch(fieldArrayName) || [];
                                const isSelectedElsewhere = selectedOptions.some((opt: string, i: number) => i !== index && String(opt) === String(word.id));
                                return (
                                    <option
                                        key={word.id}
                                        value={word.id}
                                        disabled={isSelectedElsewhere}
                                    >
                                        {getFirstAvailableTranslation(word)}
                                    </option>
                                );
                            })}
                        </select>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => remove(index)}
                        >
                            Remove
                        </Button>
                    </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => append('')}
                >
                    + Add Word
                </Button>
            </div>
        </div>
    );
} 