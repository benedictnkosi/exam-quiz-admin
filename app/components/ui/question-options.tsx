import { Button } from '@/components/ui/button';
import { useFieldArray, UseFormRegister, UseFormWatch, UseFormSetValue, Control } from 'react-hook-form';
import { QuestionFormData } from '@/lib/schemas';

interface Word {
    id: string;
    image?: string;
    translations?: {
        en?: string;
        [key: string]: string | undefined;
    };
}

interface QuestionOptionsProps {
    register: UseFormRegister<any>;
    watch: UseFormWatch<any>;
    setValue: UseFormSetValue<any>;
    control: Control<any>;
    words: Word[];
    sortWordsByEnglishTranslation: (words: Word[]) => Word[];
    getFirstAvailableTranslation: (word: Word | undefined) => string;
    title: string;
    description: string;
    maxOptions?: number;
    minOptions?: number;
    fieldArrayName: string;
}

export function QuestionOptions({
    register,
    watch,
    setValue,
    control,
    words,
    sortWordsByEnglishTranslation,
    getFirstAvailableTranslation,
    title,
    description,
    maxOptions = 10,
    minOptions = 1,
    fieldArrayName,
}: QuestionOptionsProps) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: fieldArrayName,
    });

    const handleOptionChange = (index: number, value: string) => {
        const currentOptions = watch(fieldArrayName) || [];
        const newOptions = [...currentOptions];
        newOptions[index] = value;
        setValue(fieldArrayName, newOptions);
        // No longer sync with sentence
    };

    return (
        <div className="mt-6">
            <label className="block text-sm font-medium mb-2">
                {title} {minOptions > 1 ? `(${minOptions} required)` : '(at least 1 required)'}
            </label>
            <p className="text-sm text-gray-500 mb-4">
                {description}
            </p>
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
                {fields.length < maxOptions && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => append('')}
                    >
                        + Add Option
                    </Button>
                )}
            </div>
        </div>
    );
} 