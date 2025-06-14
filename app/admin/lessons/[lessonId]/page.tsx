'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { getLessonById as getLessonByIdApi, getQuestionsForLesson, getWords, updateQuestion, createWord, getWordGroups, updateLesson } from '@/lib/api-helpers';

import { useRouter } from 'next/navigation';
import { WordFormModal } from '@/components/word/WordFormModal';
import { LessonForm } from '@/app/admin/lessons/lesson-form';
import { QuestionForm } from '@/app/admin/lessons/[lessonId]/questions/question-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';


interface Question {
    id: string;
    type: string;
    order: number;
    options?: string[];
    correctOption: string | null;
    questionOrder: number;
    blankIndex: number | null;
    sentenceWords: string[] | null;
    direction: string | null;
    question?: string;
    correctAnswer?: string;
    explanation?: string;
    difficultyLevel?: number;
    questionType?: {
        id: number;
    };
    unit?: {
        id: number;
    };
    language?: {
        id: number;
    };
    typeId?: number;
    content?: {
        sentenceWords?: string[];
        options?: string[];
        correct?: number;
        direction?: string;
        blankIndex?: number;
        pairs?: Array<{
            wordId: string;
        }>;
    };
}

// Interface for the form component's Question type
interface FormQuestion extends Omit<Question, 'correctOption'> {
    type: 'select_image' | 'translate' | 'tap_what_you_hear' | 'type_what_you_hear' | 'fill_in_blank' | 'match_pairs' | 'complete_translation';
    options: string[];
    correctOption: number | null;
    words: Array<{
        id: string;
        image?: string;
        audio?: Record<string, string>;
        translations?: Record<string, string>;
    }>;
}

interface Word {
    id: string;
    image?: string;
    translations?: {
        en?: string;
    };
}

interface Lesson {
    id: string;
    title: string;
    order: number;
    unitId: string;
}

const LANGUAGE_OPTIONS = [
    "af", // Afrikaans
    "nr", // Ndebele
    "st", // Sesotho
    "ss", // Swati
    "tn", // Tswana
    "ts", // Tsonga
    "ve", // Venda
    "xh", // Xhosa
    "zu", // Zulu
    "en", // English
    "se", // Northern Sotho
];


export default function LessonDetailPage({
    params,
}: {
    params: { lessonId: string };
}) {
    const router = useRouter();
    const { lessonId } = params;
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [words, setWords] = useState<Word[]>([]);
    const [wordGroups, setWordGroups] = useState<Array<{ id: number; name: string }>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isWordModalOpen, setIsWordModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<FormQuestion | null>(null);

    const fetchData = async () => {
        try {
            const currentLesson = await getLessonByIdApi(lessonId);
            if (!currentLesson) {
                toast.error('Lesson not found');
                return;
            }
            setLesson(currentLesson);
            const lessonQuestions = await getQuestionsForLesson(lessonId);
            // Sort questions by order
            const sortedQuestions = lessonQuestions
                .map(q => ({
                    ...q,
                    order: q.questionOrder
                }))
                .sort((a, b) => a.order - b.order);
            setQuestions(sortedQuestions);

            // Fetch all words for mapping
            const wordsData = await getWords();
            setWords(wordsData as Word[]);

            // Fetch word groups
            const groups = await getWordGroups();
            setWordGroups(groups);

            // Debug logging
            console.log('Fetched questions:', sortedQuestions);
            console.log('Fetched words:', wordsData);
        } catch (error: any) {
            console.error('Error fetching lesson data:', error);
            toast.error('Failed to load lesson data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Save lesson ID to localStorage
        localStorage.setItem('lastViewedLessonId', lessonId);
    }, [lessonId]);

    // Helper to get word by ID
    const getWordById = (id: string | number) => {
        const word = words.find(w => String(w.id) === String(id));
        if (!word) {
            console.warn('Word not found for option:', id, 'in words:', words.map(w => w.id));
        }
        return word;
    };

    const handleOrderChange = async (questionId: string, direction: 'up' | 'down') => {
        const currentIndex = questions.findIndex(q => q.id === questionId);
        if (
            (direction === 'up' && currentIndex === 0) ||
            (direction === 'down' && currentIndex === questions.length - 1)
        ) {
            return;
        }

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const currentQuestion = questions[currentIndex];
        const targetQuestion = questions[newIndex];

        try {
            // Update both questions' orders
            await updateQuestion(lessonId, currentQuestion.id, { questionOrder: newIndex });
            await updateQuestion(lessonId, targetQuestion.id, { questionOrder: currentIndex });

            // Update local state
            const newQuestions = [...questions];
            newQuestions[currentIndex] = { ...currentQuestion, order: newIndex };
            newQuestions[newIndex] = { ...targetQuestion, order: currentIndex };
            setQuestions(newQuestions.sort((a, b) => a.order - b.order));

            toast.success('Question order updated successfully');
        } catch (error) {
            console.error('Error updating question order:', error);
            toast.error('Failed to update question order');
        }
    };

    const renderQuestionContent = (question: Question) => {
        switch (question.type) {
            case 'select_image':
                return (
                    <>
                        <div className="mt-2">
                            <p className="text-sm font-medium">Options:</p>
                            {(!question.options || question.options.length === 0) ? (
                                <span className="text-gray-400">No options available.</span>
                            ) : (
                                <ul className="list-disc list-inside text-sm text-gray-600">
                                    {question.options.map((option, index) => {
                                        const word = getWordById(option);
                                        return (
                                            <li key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {word?.translations?.en || <span style={{ color: 'red' }}>Word not found for ID: {option}</span>}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Correct:</span> {(
                                typeof question.correctOption === 'number' && question.options?.[question.correctOption] !== undefined
                                    ? getWordById(question.options[question.correctOption])?.translations?.en || question.options[question.correctOption]
                                    : <span className="text-gray-400">No correct answer set.</span>
                            )}
                        </p>
                    </>
                );
            case 'translate':
                return (
                    <>
                        <div className="mt-2">
                            <p className="text-sm font-medium">Options:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                                {question.options?.map((option, index) => {
                                    const word = getWordById(option);
                                    const translation = word?.translations?.en ||
                                        (word?.translations && Object.values(word.translations)[0]) ||
                                        'No translation available';
                                    return (
                                        <li key={index}>{translation}</li>
                                    );
                                })}
                            </ul>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Correct Answer:</span> {(
                                question.sentenceWords && question.sentenceWords.length > 0
                                    ? question.sentenceWords.map(wordId => {
                                        const word = getWordById(wordId);
                                        const translation = word?.translations?.en ||
                                            (word?.translations && Object.values(word.translations)[0]) ||
                                            'No translation available';
                                        return translation;
                                    }).join(' ')
                                    : <span className="text-red-500">Please set the correct answer by editing this question</span>
                            )}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Direction:</span> {question.direction || 'Not specified'}
                        </p>
                    </>
                );
            case 'tap_what_you_hear':
                return (
                    <>
                        <div className="mt-2">
                            <p className="text-sm font-medium">Options:</p>
                            {(!question.options || question.options.length === 0) ? (
                                <span className="text-gray-400">No options available.</span>
                            ) : (
                                <ul className="list-disc list-inside text-sm text-gray-600">
                                    {question.options.map((option, index) => {
                                        const word = getWordById(option);
                                        const translation = word?.translations?.en ||
                                            (word?.translations && Object.values(word.translations)[0]) ||
                                            'No translation available';
                                        return (
                                            <li key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {translation}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Correct Answer:</span> {(
                                question.sentenceWords && question.sentenceWords.length > 0
                                    ? question.sentenceWords.map(wordId => {
                                        const word = getWordById(wordId);
                                        const translation = word?.translations?.en ||
                                            (word?.translations && Object.values(word.translations)[0]) ||
                                            'No translation available';
                                        return translation;
                                    }).join(' ')
                                    : <span className="text-gray-400">No correct answer set.</span>
                            )}
                        </p>
                    </>
                );
            case 'type_what_you_hear':
                return (
                    <>
                        <div className="mt-2">
                            <p className="text-sm font-medium">Options:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                                {question.options?.map((option, index) => {
                                    const word = getWordById(option);
                                    return (
                                        <li key={index}>{word?.translations?.en || option}</li>
                                    );
                                })}
                            </ul>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Correct Answer:</span> {(
                                question.sentenceWords && question.sentenceWords.length > 0
                                    ? question.sentenceWords.map(wordId => {
                                        const word = getWordById(wordId);
                                        return word?.translations?.en || wordId;
                                    }).join(' ')
                                    : <span className="text-gray-400">No correct answer set.</span>
                            )}
                        </p>
                    </>
                );
            case 'match_pairs':
                return (
                    <div className="mt-2">
                        <p className="text-sm font-medium">Options:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                            {question.options?.map((option, index) => {
                                const word = getWordById(option);
                                return (
                                    <li key={index}>{word?.translations?.en || option}</li>
                                );
                            })}
                        </ul>

                    </div>
                );
            case 'fill_in_blank':
                return (
                    <>
                        <div className="mt-2">
                            <p className="text-sm font-medium">Sentence Words:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                                {question.sentenceWords?.map((wordId, index) => {
                                    const word = getWordById(wordId);
                                    return (
                                        <li key={index}>{word?.translations?.en || wordId}</li>
                                    );
                                })}
                            </ul>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            Blank Word: {getWordById(question.sentenceWords?.[question.blankIndex ?? -1] || '')?.translations?.en || question.sentenceWords?.[question.blankIndex ?? -1]}
                        </p>
                    </>
                );
            case 'complete_translation':
                return (
                    <>
                        <div className="mt-2">
                            <p className="text-sm font-medium">Sentence:</p>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                                {question.sentenceWords?.map((wordId, index) => {
                                    const word = getWordById(wordId);
                                    const isBlank = index === question.blankIndex;
                                    return (
                                        <li key={index}>
                                            {isBlank ? '_____' : (word?.translations?.en || wordId)}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Blank Word:</span> {getWordById(question.sentenceWords?.[question.blankIndex ?? -1] || '')?.translations?.en || question.sentenceWords?.[question.blankIndex ?? -1]}
                        </p>
                    </>
                );
            default:
                return <p className="text-sm text-gray-600">Unknown question type</p>;
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Lesson Details</h1>
                </div>
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="container mx-auto py-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Lesson Not Found</h1>
                    <Link href="/admin">
                        <Button>Back to Dashboard</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">{lesson.title}</h1>
                    <p className="text-gray-600">Order: {lesson.order}</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Link href="/admin/units" className="flex-1 sm:flex-none">
                        <Button variant="outline" className="w-full sm:w-auto">Home</Button>
                    </Link>
                    <Link href="/admin/words" className="flex-1 sm:flex-none">
                        <Button variant="outline" className="w-full sm:w-auto">Manage Words</Button>
                    </Link>
                    <LessonForm
                        initialData={lesson ? {
                            id: lesson.id,
                            title: lesson.title,
                            lessonOrder: lesson.order,
                            unitId: lesson.unitId
                        } : undefined}
                        unitId={lesson?.unitId || ''}
                        open={isEditModalOpen}
                        onOpenChange={setIsEditModalOpen}
                        onLessonAdded={() => {
                            fetchData();
                            toast.success('Lesson updated successfully');
                        }}
                        trigger={<Button variant="outline" className="flex-1 sm:flex-none w-full sm:w-auto">Edit Lesson</Button>}
                    />
                    <Button onClick={() => setIsWordModalOpen(true)} className="flex-1 sm:flex-none w-full sm:w-auto">Quick Add Word</Button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl font-semibold">Questions ({questions.length})</h2>
                <Button onClick={() => setIsQuestionModalOpen(true)} className="w-full sm:w-auto">Add New Question</Button>
            </div>

            <div className="grid gap-4">
                {questions.map((question) => (
                    <div
                        key={question.id}
                        className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => {
                            setEditingQuestion(question as FormQuestion);
                            setIsQuestionModalOpen(true);
                        }}
                    >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="flex-1 w-full">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h3 className="font-medium">
                                        {question.type.split('_').map(word =>
                                            word.charAt(0).toUpperCase() + word.slice(1)
                                        ).join(' ')}
                                    </h3>
                                    <span className="text-sm text-gray-500">(Order: {question.order})</span>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOrderChange(question.id, 'up');
                                            }}
                                            disabled={question.order === 0}
                                        >
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOrderChange(question.id, 'down');
                                            }}
                                            disabled={question.order === questions.length - 1}
                                        >
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                {renderQuestionContent(question)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Word Creation Modal */}
            <WordFormModal
                open={isWordModalOpen}
                onOpenChange={setIsWordModalOpen}
                onSuccess={() => {
                    toast.success('Word added successfully');
                }}
                wordGroups={wordGroups}
            />

            {/* Question Creation/Edit Modal */}
            <Dialog
                open={isQuestionModalOpen}
                onOpenChange={(open) => {
                    setIsQuestionModalOpen(open);
                    if (!open) {
                        setEditingQuestion(null);
                    }
                }}
            >
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
                    </DialogHeader>
                    <QuestionForm
                        lessonId={lessonId}
                        question={editingQuestion as FormQuestion | null | undefined}
                        onSuccess={() => {
                            setIsQuestionModalOpen(false);
                            setEditingQuestion(null);
                            fetchData();
                            toast.success(editingQuestion ? 'Question updated successfully' : 'Question added successfully');
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
} 