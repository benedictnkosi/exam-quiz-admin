'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import { API_HOST } from "@/config/constants";
import { createWord, updateWord, updateWordTranslation, updateWordAudio, getWordById } from "@/lib/api-helpers";
import React from "react";
import dynamic from 'next/dynamic';

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

const LAST_SELECTED_LANGUAGE_KEY = 'lastSelectedLanguage';
const LAST_SELECTED_GROUP_KEY = 'lastSelectedWordGroup';

interface WordFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    initialData?: {
        id: string;
        translations: Record<string, string>;
        audio: Record<string, string>;
        image: string;
        groupId: number;
    };
    wordGroups?: Array<{
        id: number;
        name: string;
    }>;
}

const AudioRecordingModal = dynamic(() => import('./AudioRecordingModal').then(mod => mod.AudioRecordingModal), { ssr: false });

export function WordFormModal({ open, onOpenChange, onSuccess, initialData, wordGroups = [] }: WordFormModalProps) {
    const [form, setForm] = useState({
        id: initialData?.id || "",
        translations: initialData?.translations || {} as Record<string, string>,
        audio: initialData?.audio || {} as Record<string, string>,
        image: initialData?.image || "",
        groupId: initialData?.groupId || 0,
    });
    const isEditing = !!initialData?.id;
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingAudio, setIsUploadingAudio] = useState(false);
    const [selectedLang, setSelectedLang] = useState("");
    const [translationInput, setTranslationInput] = useState("");
    const [isAddingTranslation, setIsAddingTranslation] = useState(false);
    const audioInputRef = useRef<HTMLInputElement | null>(null);
    const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
    const [startTime, setStartTime] = useState<number | undefined>(undefined);
    const [endTime, setEndTime] = useState<number | undefined>(undefined);
    const [recordedAudioFileName, setRecordedAudioFileName] = useState<string | null>(null);

    // Load last selected language and group when modal opens
    useEffect(() => {
        if (open) {
            console.log("Modal opened, checking localStorage");
            const lastLang = localStorage.getItem(LAST_SELECTED_LANGUAGE_KEY);
            const lastGroup = localStorage.getItem(LAST_SELECTED_GROUP_KEY);
            console.log("Last language from localStorage:", lastLang);
            console.log("Last group from localStorage:", lastGroup);
            if (lastLang) {
                setSelectedLang(lastLang);
            }
            if (lastGroup) {
                setForm(prev => ({ ...prev, groupId: Number(lastGroup) }));
            }
        }
    }, [open]);

    // Save selected language to localStorage
    const handleLanguageChange = (lang: string) => {
        console.log("handleLanguageChange called with:", lang);
        setSelectedLang(lang);
        if (lang) {
            console.log("Saving language to localStorage:", lang);
            localStorage.setItem(LAST_SELECTED_LANGUAGE_KEY, lang);
        }
    };

    // Save selected group to localStorage
    const handleGroupChange = (groupId: number) => {
        setForm(prev => ({ ...prev, groupId }));
        if (groupId) {
            localStorage.setItem(LAST_SELECTED_GROUP_KEY, groupId.toString());
        }
    };

    // Sync form state with initialData when it changes
    useEffect(() => {
        if (initialData) {
            setForm({
                id: initialData.id || "",
                translations: initialData.translations || {},
                audio: initialData.audio || {},
                image: initialData.image || "",
                groupId: initialData.groupId || 0,
            });
        } else {
            setForm({
                id: "",
                translations: {},
                audio: {},
                image: "",
                groupId: 0,
            });
        }
    }, [initialData]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            if (isEditing) {
                if (!form.id) {
                    toast.error("Word ID is missing.");
                    return;
                }
                // Convert form data to match WordData interface
                const wordData = {
                    ...form,
                    groupId: form.groupId || undefined
                };
                await updateWord(form.id, wordData);
                toast.success("Word updated");
            } else {
                // Convert form data to match WordData interface
                const wordData = {
                    ...form,
                    groupId: form.groupId || undefined
                };
                await createWord(wordData);
                toast.success("Word created");
            }
            setForm({ id: "", translations: {}, audio: {}, image: "", groupId: 0 });
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            toast.error("Failed to save word");
        }
    }

    async function handleImageUpload() {
        if (!form.id) {
            toast.error("Please save the word first before uploading an image");
            return;
        }

        if (!selectedFile) {
            toast.error("Please select an image to upload");
            return;
        }

        if (!form.translations.en) {
            toast.error("Please add an English translation for the word first");
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', selectedFile);

            const response = await fetch(`${API_HOST}/api/word/image/upload?word=${form.id}`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Failed to upload image');
            const data = await response.json();
            console.log('Image upload response:', data);
            setForm(prev => {
                const updated = {
                    ...prev,
                    image: data.imagePath
                };
                console.log('Updated form.image:', updated.image);
                return updated;
            });

            toast.success("Image uploaded successfully");
        } catch (error) {
            console.error("Error uploading image:", error);
            toast.error("Failed to upload image");
        } finally {
            setIsUploading(false);
            setSelectedFile(null);
        }
    }

    async function handleAddTranslation() {
        setIsAddingTranslation(true);
        if (!selectedLang) {
            toast.error("Please select a language");
            setIsAddingTranslation(false);
            return;
        }
        if (!translationInput) {
            toast.error("Please enter a translation");
            setIsAddingTranslation(false);
            return;
        }
        if (selectedLang !== 'en' && !recordedAudioFileName) {
            toast.error(`Audio file is required for ${LANGUAGE_LABELS[selectedLang]}`);
            setIsAddingTranslation(false);
            return;
        }
        try {
            let audioUrl = "";
            if (selectedLang !== 'en' && recordedAudioFileName) {
                audioUrl = recordedAudioFileName;
            }

            if (isEditing && form.id) {
                await updateWordTranslation(form.id, selectedLang, translationInput);
                if (audioUrl) {
                    await updateWordAudio(form.id, selectedLang, audioUrl);
                }
                // Fetch the updated word and update the form state
                const updatedWord = await getWordById(form.id);
                setForm(prev => ({
                    ...prev,
                    translations: updatedWord.translations || {},
                    audio: updatedWord.audio || {},
                }));
            } else {
                setForm(prev => ({
                    ...prev,
                    translations: { ...prev.translations, [selectedLang]: translationInput },
                    audio: audioUrl
                        ? { ...prev.audio, [selectedLang]: audioUrl }
                        : prev.audio,
                }));
            }

            setSelectedLang("");
            setTranslationInput("");
            setSelectedAudioFile(null);
            if (audioInputRef.current) {
                audioInputRef.current.value = "";
            }
            setRecordedAudioFileName(null);

            toast.success("Translation added successfully");
        } catch (error) {
            console.error("Error adding translation:", error);
            toast.error("Failed to add translation");
        } finally {
            setIsAddingTranslation(false);
        }
    }

    function handleRemoveTranslation(lang: string) {
        setForm((prev) => {
            const newTranslations = { ...prev.translations };
            const newAudio = { ...prev.audio };
            delete newTranslations[lang];
            delete newAudio[lang];
            return { ...prev, translations: newTranslations, audio: newAudio };
        });
    }

    const handleAudioRecorded = (audioBlob: Blob, fileName?: string) => {
        const file = new File([audioBlob], `recording-${selectedLang}.webm`, { type: 'audio/webm' });
        setSelectedAudioFile(file);
        if (fileName) setRecordedAudioFileName(fileName);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl sm:text-2xl">{isEditing ? "Edit Word" : "Create Word"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {wordGroups.length > 0 && (
                        <div className="w-full mb-4">
                            <label className="block text-sm font-medium mb-2">Word Group</label>
                            <select
                                className="w-full p-2 border rounded-md text-base"
                                value={form.groupId}
                                onChange={(e) => handleGroupChange(Number(e.target.value))}
                            >
                                <option value="">Select a group</option>
                                {wordGroups.map((group) => (
                                    <option key={group.id} value={group.id.toString()}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="w-full mb-4">
                        <div className="flex flex-col gap-3 w-full">
                            <select
                                className="w-full p-2 border rounded-md text-base h-12"
                                value={selectedLang}
                                onChange={(e) => {
                                    console.log("Select onChange triggered");
                                    handleLanguageChange(e.target.value);
                                }}
                            >
                                <option value="">Select language</option>
                                {LANGUAGE_OPTIONS.filter(lang => !form.translations[lang]).map((lang) => (
                                    <option key={lang} value={lang}>
                                        {LANGUAGE_LABELS[lang] || lang.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-md text-base h-12"
                                placeholder="Translation"
                                value={translationInput}
                                onChange={e => setTranslationInput(e.target.value)}
                            />
                            <div className="flex flex-col gap-2">
                                {selectedLang && selectedLang !== 'en' && (
                                    <>
                                        <Button
                                            type="button"
                                            onClick={() => setIsRecordingModalOpen(true)}
                                            className="w-full h-12 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                                            variant="secondary"
                                            disabled={!translationInput.trim()}
                                        >
                                            🎤 Record Audio
                                        </Button>
                                        {recordedAudioFileName && (
                                            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-sm text-green-700">Audio recorded and ready to be added</span>
                                            </div>
                                        )}
                                    </>
                                )}
                                {selectedLang && selectedLang !== 'en' && !recordedAudioFileName && (
                                    <span className="text-sm text-red-500">* Audio recording required</span>
                                )}
                                <Button
                                    type="button"
                                    className="w-full h-12"
                                    onClick={handleAddTranslation}
                                    disabled={isAddingTranslation || (selectedLang !== 'en' && !recordedAudioFileName)}
                                >
                                    {isAddingTranslation ? 'Adding...' : 'Add Translation'}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div>
                        {Object.keys(form.translations).length > 0 && (
                            <div className="mb-2">
                                <div className="font-medium mb-2 text-lg">Added Translations:</div>
                                <div className="space-y-4">
                                    {Object.entries(form.translations).map(([lang, translation], idx, arr) => (
                                        <React.Fragment key={lang}>
                                            <div className="mb-2">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{LANGUAGE_LABELS[lang] || lang.toUpperCase()}:</span>
                                                        <span className="break-words">{translation}</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveTranslation(lang)}
                                                        className="self-start sm:self-center"
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                                {form.audio && form.audio[lang] && (
                                                    <div className="mt-2">
                                                        <audio
                                                            controls
                                                            src={`${API_HOST}/api/word/audio/get/${form.audio[lang]}`}
                                                            className="w-full"
                                                        >
                                                            Your browser does not support the audio element.
                                                        </audio>
                                                    </div>
                                                )}
                                            </div>
                                            {idx < arr.length - 1 && (
                                                <hr className="my-4 border-t-2 border-gray-200" />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Image</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                className="w-full p-2 border rounded-md text-base"
                            />
                            <Button
                                type="button"
                                onClick={handleImageUpload}
                                disabled={!selectedFile || isUploading || !form.id}
                                className="w-full sm:w-auto h-12"
                            >
                                {isUploading ? "Uploading..." : "Upload"}
                            </Button>
                        </div>
                        {form.image && (
                            <div className="mt-2">
                                <img
                                    src={`${API_HOST}/api/word/image/get/${form.image}`}
                                    alt="Word image"
                                    className="w-16 h-16 object-cover rounded-md"
                                />
                                <div className="text-green-600 font-medium mt-1 flex items-center gap-1">
                                    <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    Image uploaded!
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
                        <Button type="submit" className="w-full sm:w-auto h-12">{isEditing ? "Update" : "Create"} Word</Button>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-12">
                            Cancel
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
            <AudioRecordingModal
                open={isRecordingModalOpen}
                onOpenChange={setIsRecordingModalOpen}
                onAudioRecorded={handleAudioRecorded}
                language={LANGUAGE_LABELS[selectedLang] || selectedLang}
                word={translationInput}
            />
        </Dialog>
    );
} 