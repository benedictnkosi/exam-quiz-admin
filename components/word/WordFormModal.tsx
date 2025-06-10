'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import { API_HOST } from "@/config/constants";
import { createWord, updateWord, updateWordTranslation, updateWordAudio, getWordById } from "@/lib/api-helpers";
import React from "react";

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

interface WordFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    initialData?: {
        id: string;
        translations: Record<string, string>;
        audio: Record<string, string>;
        image: string;
        groupId: string;
    };
    wordGroups?: Array<{
        id: number;
        name: string;
    }>;
}

export function WordFormModal({ open, onOpenChange, onSuccess, initialData, wordGroups = [] }: WordFormModalProps) {
    const [form, setForm] = useState({
        id: initialData?.id || "",
        translations: initialData?.translations || {} as Record<string, string>,
        audio: initialData?.audio || {} as Record<string, string>,
        image: initialData?.image || "",
        groupId: initialData?.groupId || "",
    });
    const isEditing = !!initialData;
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingAudio, setIsUploadingAudio] = useState(false);
    const [selectedLang, setSelectedLang] = useState("");
    const [translationInput, setTranslationInput] = useState("");
    const [isAddingTranslation, setIsAddingTranslation] = useState(false);
    const audioInputRef = useRef<HTMLInputElement | null>(null);

    // Load last selected language when modal opens
    useEffect(() => {
        if (open) {
            console.log("Modal opened, checking localStorage");
            const lastLang = localStorage.getItem(LAST_SELECTED_LANGUAGE_KEY);
            console.log("Last language from localStorage:", lastLang);
            if (lastLang) {
                setSelectedLang(lastLang);
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

    // Sync form state with initialData when it changes
    useEffect(() => {
        if (initialData) {
            setForm({
                id: initialData.id || "",
                translations: initialData.translations || {},
                audio: initialData.audio || {},
                image: initialData.image || "",
                groupId: initialData.groupId || "",
            });
        } else {
            setForm({
                id: "",
                translations: {},
                audio: {},
                image: "",
                groupId: "",
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
                await updateWord(form.id, form);
                toast.success("Word updated");
            } else {
                await createWord(form);
                toast.success("Word created");
            }
            setForm({ id: "", translations: {}, audio: {}, image: "", groupId: "" });
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            toast.error("Failed to save word");
        }
    }

    async function handleImageUpload() {
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

            const response = await fetch(`${API_HOST}/api/word/image/upload?word=${form.id || form.translations.en}`, {
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

        if (selectedLang !== 'en' && !selectedAudioFile) {
            toast.error(`Audio file is required for ${LANGUAGE_LABELS[selectedLang]}`);
            setIsAddingTranslation(false);
            return;
        }

        try {
            let audioUrl = "";
            if (selectedLang !== 'en' && selectedAudioFile) {
                const formData = new FormData();
                formData.append('file', selectedAudioFile);
                formData.append('word', translationInput);

                const response = await fetch(`${API_HOST}/api/word/audio/upload`, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) throw new Error('Failed to upload audio');
                const data = await response.json();
                audioUrl = `${data.wordAudio.filename}`;
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Word" : "Create Word"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {wordGroups.length > 0 && (
                        <div className="w-full mb-4">
                            <label className="block text-sm font-medium mb-2">Word Group</label>
                            <select
                                className="w-full p-2 border rounded-md"
                                value={form.groupId}
                                onChange={(e) => setForm(prev => ({ ...prev, groupId: e.target.value }))}
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
                        <div className="flex flex-wrap gap-2 items-center w-full">
                            <select
                                className="p-2 border rounded-md min-w-[160px] h-10 flex-shrink-0"
                                value={selectedLang}
                                onChange={(e) => {
                                    console.log("Select onChange triggered");
                                    handleLanguageChange(e.target.value);
                                }}
                            >
                                <option value="">Select language</option>
                                {LANGUAGE_OPTIONS.filter(lang => !form.translations[lang] && lang).map((lang) => (
                                    <option key={lang} value={lang}>
                                        {LANGUAGE_LABELS[lang] || lang.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                className="p-2 border rounded-md flex-1 h-10 min-w-[120px]"
                                placeholder="Translation"
                                value={translationInput}
                                onChange={e => setTranslationInput(e.target.value)}
                            />
                            <div className="flex gap-2 flex-1">
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={e => setSelectedAudioFile(e.target.files?.[0] || null)}
                                    className="flex-1 p-2 border rounded-md h-10"
                                    ref={audioInputRef}
                                />
                            </div>
                            {selectedLang && selectedLang !== 'en' && (
                                <span className="text-sm text-red-500">* Required</span>
                            )}
                            <Button type="button" className="h-10 px-4" onClick={handleAddTranslation}
                                disabled={isAddingTranslation || (selectedLang !== 'en' && !selectedAudioFile)}
                            >
                                {isAddingTranslation ? 'Adding...' : 'Add Translation'}
                            </Button>
                        </div>
                    </div>
                    <div>
                        {Object.keys(form.translations).length > 0 && (
                            <div className="mb-2">
                                <div className="font-medium mb-1">Added Translations:</div>
                                <div className="space-y-2">
                                    {Object.entries(form.translations).map(([lang, translation], idx, arr) => (
                                        <React.Fragment key={lang}>
                                            <div className="mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{LANGUAGE_LABELS[lang] || lang.toUpperCase()}:</span>
                                                    <span>{translation}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveTranslation(lang)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                                {form.audio && form.audio[lang] && (
                                                    <div className="mt-1">
                                                        <audio controls src={form.audio[lang]} style={{ height: 28 }}>
                                                            Your browser does not support the audio element.
                                                        </audio>
                                                    </div>
                                                )}
                                            </div>
                                            {idx < arr.length - 1 && (
                                                <hr className="my-6 border-t-2 border-gray-200" />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Image</label>
                        <div className="flex gap-2">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                className="flex-1 p-2 border rounded-md"
                            />
                            <Button
                                type="button"
                                onClick={handleImageUpload}
                                disabled={!selectedFile || isUploading}
                            >
                                {isUploading ? "Uploading..." : "Upload"}
                            </Button>
                        </div>
                        {form.image && (
                            <div className="mt-2">
                                <img
                                    src={`${API_HOST}/api/word/image/get/${form.image}`}
                                    alt="Word image"
                                    className="w-48 h-48 object-cover rounded-md"
                                />
                                <div className="text-green-600 font-medium mt-1 flex items-center gap-1">
                                    <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    Image uploaded!
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="flex gap-4 mt-4">
                        <Button type="submit">{isEditing ? "Update" : "Create"} Word</Button>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
} 