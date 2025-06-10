import { toast } from "react-hot-toast";
import { API_HOST } from '@/config/constants';

export interface LanguageQuestion {
    id: string;
    type: string;
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

export async function getWords() {
    try {
        const response = await fetch(`${API_HOST}/api/words/all`);
        if (!response.ok) throw new Error('Failed to fetch words');
        return await response.json();
    } catch (error) {
        console.error('Error fetching words:', error);
        throw error;
    }
}

export async function createWord(wordData: any) {
    try {
        const response = await fetch(`${API_HOST}/api/words/word`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(wordData),
        });
        if (!response.ok) throw new Error('Failed to create word');
        return await response.json();
    } catch (error) {
        console.error('Error creating word:', error);
        throw error;
    }
}

export async function updateWord(id: string, wordData: any) {
    try {
        const response = await fetch(`${API_HOST}/api/words/word/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(wordData),
        });
        if (!response.ok) throw new Error('Failed to update word');
        return await response.json();
    } catch (error) {
        console.error('Error updating word:', error);
        throw error;
    }
}

export async function deleteWord(id: string) {
    try {
        const response = await fetch(`${API_HOST}/api/words/word/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete word');
        return await response.json();
    } catch (error) {
        console.error('Error deleting word:', error);
        throw error;
    }
}

export async function getWordGroups() {
    try {
        const response = await fetch(`${API_HOST}/api/words/groups`);
        if (!response.ok) throw new Error('Failed to fetch word groups');
        return await response.json();
    } catch (error) {
        console.error('Error fetching word groups:', error);
        throw error;
    }
}

export async function createWordGroup(groupData: any) {
    try {
        const response = await fetch(`${API_HOST}/api/words/group`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(groupData),
        });
        if (!response.ok) throw new Error('Failed to create word group');
        return await response.json();
    } catch (error) {
        console.error('Error creating word group:', error);
        throw error;
    }
}

export async function updateWordGroup(id: string, groupData: any) {
    try {
        const response = await fetch(`${API_HOST}/api/words/group/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(groupData),
        });
        if (!response.ok) throw new Error('Failed to update word group');
        return await response.json();
    } catch (error) {
        console.error('Error updating word group:', error);
        throw error;
    }
}

export async function deleteWordGroup(id: string) {
    try {
        const response = await fetch(`${API_HOST}/api/words/group/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete word group');
        return await response.json();
    } catch (error) {
        console.error('Error deleting word group:', error);
        throw error;
    }
}

export async function updateWordTranslation(id: string, languageCode: string, translation: string) {
    try {
        const response = await fetch(`${API_HOST}/api/words/word/${id}/translation`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ languageCode, translation }),
        });
        if (!response.ok) throw new Error('Failed to update translation');
        return await response.json();
    } catch (error) {
        console.error('Error updating translation:', error);
        throw error;
    }
}

export async function updateWordAudio(id: string, languageCode: string, audioUrl: string) {
    try {
        const response = await fetch(`${API_HOST}/api/words/word/${id}/audio`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ languageCode, audioUrl }),
        });
        if (!response.ok) throw new Error('Failed to update audio');
        return await response.json();
    } catch (error) {
        console.error('Error updating audio:', error);
        throw error;
    }
}

export async function getWordById(id: string) {
    const response = await fetch(`${API_HOST}/api/words/word/${id}`);
    if (!response.ok) throw new Error('Failed to fetch word');
    return await response.json();
}

export async function getLessonsByUnitId(unitId: string | number) {
    const response = await fetch(`${API_HOST}/api/lessons/unit/${unitId}`);
    if (!response.ok) throw new Error('Failed to fetch lessons for unit');
    return await response.json();
}

// Create a new lesson
export async function createLesson(lessonData: { title: string; lessonOrder: number; unitId: number }) {
    const response = await fetch(`${API_HOST}/api/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lessonData),
    });
    if (!response.ok) throw new Error('Failed to create lesson');
    return await response.json();
}

// Get all lessons
export async function getAllLessons() {
    const response = await fetch(`${API_HOST}/api/lessons`);
    if (!response.ok) throw new Error('Failed to fetch lessons');
    return await response.json();
}

// Get a single lesson by ID
export async function getLessonById(id: string | number) {
    const response = await fetch(`${API_HOST}/api/lessons/${id}`);
    if (!response.ok) throw new Error('Failed to fetch lesson');
    return await response.json();
}

// Update a lesson by ID
export async function updateLesson(id: string | number, lessonData: Partial<{ title: string; lessonOrder: number; unitId: number }>) {
    const response = await fetch(`${API_HOST}/api/lessons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lessonData),
    });
    if (!response.ok) throw new Error('Failed to update lesson');
    return await response.json();
}

// Delete a lesson by ID
export async function deleteLesson(id: string | number) {
    const response = await fetch(`${API_HOST}/api/lessons/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete lesson');
    return await response.json();
}

export async function createLanguageQuestion(data: Omit<LanguageQuestion, 'id'>): Promise<LanguageQuestion> {
    const response = await fetch(`${API_HOST}/api/language-questions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to create language question');
    }

    return response.json();
}

export async function getLanguageQuestions(): Promise<LanguageQuestion[]> {
    const response = await fetch(`${API_HOST}/api/language-questions`);

    if (!response.ok) {
        throw new Error('Failed to fetch language questions');
    }

    return response.json();
}

export async function getLanguageQuestionById(id: string): Promise<LanguageQuestion> {
    const response = await fetch(`${API_HOST}/api/language-questions/${id}`);

    if (!response.ok) {
        throw new Error('Failed to fetch language question');
    }

    return response.json();
}

export async function updateLanguageQuestion(id: string, data: Partial<LanguageQuestion>): Promise<LanguageQuestion> {
    const response = await fetch(`${API_HOST}/api/language-questions/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to update language question');
    }

    return response.json();
}

export async function deleteLanguageQuestion(id: string): Promise<void> {
    const response = await fetch(`${API_HOST}/api/language-questions/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete language question');
    }
}

export async function getQuestionsForLesson(lessonId: string): Promise<LanguageQuestion[]> {
    const response = await fetch(`${API_HOST}/api/language-questions/lesson/${lessonId}`);

    if (!response.ok) {
        throw new Error('Failed to fetch questions for lesson');
    }

    return response.json();
}

export async function addQuestionToLesson(lessonId: string, question: Omit<LanguageQuestion, 'id'>): Promise<LanguageQuestion> {
    const response = await fetch(`${API_HOST}/api/language-questions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...question,
            lessonId,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to add question to lesson');
    }

    return response.json();
}

export async function updateQuestion(lessonId: string, questionId: string, question: Partial<LanguageQuestion>): Promise<LanguageQuestion> {
    const response = await fetch(`${API_HOST}/api/language-questions/${questionId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...question,
            lessonId,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to update question');
    }

    return response.json();
} 