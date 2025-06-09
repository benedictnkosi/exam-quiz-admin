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
    const [words, setWords] = useState<Array<{
        id: number;
        translations: Record<string, string>;
        audio: Record<string, string> | any[];
        image: string | null;
        groupId: string | null;
    }>>([]);
    const [wordGroups, setWordGroups] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isWordModalOpen, setIsWordModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [groupForm, setGroupForm] = useState({
        id: "",
        name: "",
        description: "",
        image: null as string | null,
    });
    const [isEditingGroup, setIsEditingGroup] = useState(false);
    const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("");

    useEffect(() => {
        fetchWords();
        fetchWordGroups();
    }, [selectedGroupFilter]);

    async function fetchWords() {
        setIsLoading(true);
        try {
            let data;
            if (selectedGroupFilter) {
                data = await fetch(`${API_HOST}/api/words/group/${selectedGroupFilter}`).then(res => res.json());
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

    async function fetchWordGroups() {
        try {
            const data = await getWordGroups();
            setWordGroups(data);
        } catch (error) {
            toast.error("Failed to fetch word groups");
        }
    }

    async function handleGroupSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            if (isEditingGroup) {
                if (!groupForm.id) {
                    toast.error("Group ID is missing.");
                    return;
                }
                const { id, ...updateData } = groupForm;
                await updateWordGroup(groupForm.id, updateData);
                toast.success("Group updated");
            } else {
                const { id, ...createData } = groupForm;
                await createWordGroup(createData);
                toast.success("Group created");
            }
            setGroupForm({ id: "", name: "", description: "", image: null });
            setIsEditingGroup(false);
            fetchWordGroups();
        } catch (error) {
            toast.error("Failed to save group");
        }
    }

    function handleEditGroup(group: any) {
        setGroupForm({
            id: group.id.toString(),
            name: group.name,
            description: group.description || "",
            image: group.image,
        });
        setIsEditingGroup(true);
    }

    function handleCreateGroup() {
        setGroupForm({ id: "", name: "", description: "", image: null });
        setIsEditingGroup(false);
    }

    async function handleDeleteGroup(groupId: string) {
        // Check if any words are using this group
        const wordsUsingGroup = words.filter(word => word.groupId === groupId);
        if (wordsUsingGroup.length > 0) {
            toast.error(`Cannot delete group: ${wordsUsingGroup.length} word(s) are using it`);
            return;
        }

        if (!confirm("Are you sure you want to delete this group?")) return;
        try {
            await deleteWordGroup(groupId);
            toast.success("Group deleted");
            fetchWordGroups();
        } catch (error) {
            toast.error("Failed to delete group");
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
        <div className="container mx-auto py-8">
            <div className="flex items-center mb-4 gap-2">
                <Link href="/admin/units">
                    <Button variant="secondary">Home</Button>
                </Link>
                <Button variant="outline" onClick={() => setIsGroupModalOpen(true)}>Manage Word Groups</Button>
            </div>
            <h1 className="text-3xl font-bold mb-8">Manage Words</h1>
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={selectedGroupFilter === "" ? "default" : "outline"}
                        onClick={() => setSelectedGroupFilter("")}
                    >
                        All Groups
                    </Button>
                    {wordGroups.map((group) => (
                        <Button
                            key={group.id}
                            variant={selectedGroupFilter === group.id.toString() ? "default" : "outline"}
                            onClick={() => setSelectedGroupFilter(group.id.toString())}
                        >
                            {group.name}
                        </Button>
                    ))}
                </div>
                <Button onClick={() => setIsWordModalOpen(true)}>Create New Word</Button>
            </div>

            {/* Word Creation Modal */}
            <WordFormModal
                open={isWordModalOpen}
                onOpenChange={setIsWordModalOpen}
                onSuccess={() => {
                    fetchWords();
                    toast.success('Word added successfully');
                }}
                wordGroups={wordGroups}
            />

            {/* Word Groups Modal */}
            <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Manage Word Groups</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <form onSubmit={handleGroupSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Group Name</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-md"
                                    value={groupForm.name}
                                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    className="w-full p-2 border rounded-md"
                                    value={groupForm.description}
                                    onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit">{isEditingGroup ? "Update" : "Create"} Group</Button>
                                {isEditingGroup && (
                                    <Button type="button" variant="outline" onClick={handleCreateGroup}>
                                        Cancel Edit
                                    </Button>
                                )}
                            </DialogFooter>
                        </form>

                        <div className="mt-6">
                            <h3 className="text-lg font-medium mb-4">Existing Groups</h3>
                            <div className="space-y-2">
                                {wordGroups.map((group) => (
                                    <div key={group.id} className="p-4 bg-white rounded-lg shadow-sm border flex justify-between items-center">
                                        <div>
                                            <div className="font-semibold">{group.name}</div>
                                            {group.description && (
                                                <div className="text-sm text-gray-500">{group.description}</div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleEditGroup(group)}>
                                                Edit
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteGroup(group.id.toString())}>
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Words List */}
            <div className="space-y-4">
                {words.map((word) => (
                    <div key={word.id} className="p-4 bg-white rounded-lg shadow-sm border flex justify-between items-center">
                        <div>
                            <div className="font-semibold">{word.translations?.en || word.id}</div>
                            <div className="text-sm text-gray-500">
                                {Object.entries(word.translations || {})
                                    .filter(([lang]) => lang !== 'en')
                                    .map(([lang, val]) => (
                                        <div key={lang}>
                                            <span className="font-medium">{lang.toUpperCase()}:</span> {val}
                                        </div>
                                    ))}
                            </div>
                            {word.groupId && (
                                <div>
                                    <span className="font-medium">Group:</span>
                                    <span className="ml-2">
                                        {wordGroups.find(g => g.id.toString() === word.groupId)?.name || word.groupId}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => {
                                setIsWordModalOpen(true);
                                // TODO: Pass initialData to WordFormModal for editing
                            }}>Edit</Button>
                            <Button variant="destructive" onClick={() => handleDelete(word.id)}>Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 