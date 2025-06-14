"use client";

import { useEffect, useState, useRef } from "react";
import { getWords, createWord, updateWord, deleteWord, getWordGroups, createWordGroup, updateWordGroup, deleteWordGroup, updateWordTranslation, updateWordAudio, getWordById } from "@/lib/api-helpers";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Link from "next/link";
import React from "react";
import { API_HOST } from "@/config/constants";
import { WordFormModal } from '@/components/word/WordFormModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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

const LANGUAGE_LABELS: Record<string, string> = {
    af: "Afrikaans",
    nr: "Ndebele",
    st: "Sesotho",
    ss: "Swati",
    tn: "Tswana",
    ts: "Tsonga",
    ve: "Venda",
    xh: "Xhosa",
    zu: "Zulu",
    en: "English",
    se: "Northern Sotho",
};

export default function WordsPage() {
    const { user } = useAuth();
    const [words, setWords] = useState<Array<{
        id: number;
        translations: Record<string, string>;
        audio: Record<string, string> | any[];
        image: string | null;
        groupId: string | null;
    }>>([]);
    const [units, setUnits] = useState<Array<{ id: string; title: string }>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isWordModalOpen, setIsWordModalOpen] = useState(false);
    const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>("all");
    const [editingWord, setEditingWord] = useState<{
        id: string;
        translations: Record<string, string>;
        audio: Record<string, string>;
        image: string;
        groupId: number;
    } | null>(null);
    const [lastViewedLessonId, setLastViewedLessonId] = useState<string | null>(null);

    useEffect(() => {
        fetchWords();
        fetchUnits();
        // Get the last viewed lesson ID from localStorage
        const savedLessonId = localStorage.getItem('lastViewedLessonId');
        setLastViewedLessonId(savedLessonId);
    }, [selectedUnitFilter]);

    async function fetchUnits() {
        try {
            const response = await fetch(`${API_HOST}/api/units`);
            if (!response.ok) throw new Error('Failed to fetch units');
            const data = await response.json();
            setUnits(data);
        } catch (error) {
            toast.error("Failed to fetch units");
        }
    }

    async function fetchWords() {
        setIsLoading(true);
        try {
            let data;
            if (selectedUnitFilter && selectedUnitFilter !== "all") {
                const response = await fetch(`${API_HOST}/api/words/unit/${selectedUnitFilter}`);
                if (!response.ok) throw new Error('Failed to fetch words');
                data = await response.json();
            } else {
                data = await getWords();
            }
            setWords(data);
        } catch (error) {
            toast.error("Failed to fetch words");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("Are you sure you want to delete this word?")) return;
        try {
            await deleteWord(id.toString());
            toast.success("Word deleted");
            fetchWords();
        } catch (error) {
            toast.error("Failed to delete word");
        }
    }

    return (
        <div className="container mx-auto px-4 py-4 sm:py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 gap-2">
                <Link href="/admin/units">
                    <Button variant="secondary" className="w-full sm:w-auto">Home</Button>
                </Link>
                {lastViewedLessonId && (
                    <Link href={`/admin/lessons/${lastViewedLessonId}`}>
                        <Button variant="outline" className="w-full sm:w-auto">Back to Lesson</Button>
                    </Link>
                )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Manage Words</h1>
            <div className="flex flex-col gap-2 mb-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <Select
                        value={selectedUnitFilter}
                        onValueChange={setSelectedUnitFilter}
                    >
                        <SelectTrigger className="w-full sm:w-[180px] h-8 text-sm">
                            <SelectValue placeholder="Filter by Unit" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Units</SelectItem>
                            {units.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id}>
                                    {unit.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={() => setIsWordModalOpen(true)} className="w-full sm:w-auto h-8 text-sm">Create New Word</Button>
            </div>

            {/* Word Creation Modal */}
            <WordFormModal
                open={isWordModalOpen}
                onOpenChange={(open) => {
                    setIsWordModalOpen(open);
                    if (!open) {
                        setEditingWord(null);
                    }
                }}
                onSuccess={() => {
                    fetchWords();
                    toast.success(editingWord ? 'Word updated successfully' : 'Word added successfully');
                    setEditingWord(null);
                }}
                wordGroups={units.map(unit => ({ id: Number(unit.id), name: unit.title }))}
                initialData={editingWord || (selectedUnitFilter !== "all" ? {
                    id: '',
                    translations: {},
                    audio: {},
                    image: '',
                    groupId: Number(selectedUnitFilter)
                } : undefined)}
                learnerUid={user?.uid || ''}
            />

            {/* Words List */}
            <div className="space-y-4">
                {words.map((word) => (
                    <div key={word.id} className="p-4 bg-white rounded-lg shadow-sm border flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            {word.image && (
                                <img
                                    src={`${API_HOST}/api/word/image/get/${word.image}`}
                                    alt="Word"
                                    className="w-16 h-16 object-cover rounded"
                                />
                            )}
                            <div className="flex-1">
                                <div className="font-semibold">{word.translations?.en || word.id}</div>
                                <div className="text-sm text-gray-500">
                                    {Object.entries(word.translations || {})
                                        .filter(([lang]) => lang !== 'en')
                                        .map(([lang, val]) => (
                                            <div key={lang} className="flex items-center gap-1">
                                                <span className="font-medium">{lang.toUpperCase()}:</span> {val}
                                                {!Array.isArray(word.audio) && word.audio && word.audio[lang] && (
                                                    <Volume2 className="w-4 h-4 text-blue-500" />
                                                )}
                                            </div>
                                        ))}
                                </div>
                                {word.groupId && (
                                    <div>
                                        <span className="font-medium">Unit:</span>
                                        <span className="ml-2">
                                            {units.find(u => u.id === word.groupId)?.title || word.groupId}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 self-end sm:self-center">
                            <Button variant="outline" onClick={() => {
                                setEditingWord({
                                    id: word.id.toString(),
                                    translations: word.translations || {},
                                    audio: Array.isArray(word.audio) ? {} : (word.audio || {}),
                                    image: word.image || '',
                                    groupId: word.groupId ? Number(word.groupId) : 0,
                                });
                                setIsWordModalOpen(true);
                            }}>Edit</Button>
                            <Button variant="destructive" onClick={() => handleDelete(word.id)}>Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 