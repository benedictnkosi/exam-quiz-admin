'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, ArrowUp, ArrowDown, Trash2, ArrowLeft } from 'lucide-react';
import { UnitForm } from './new/unit-form';
import { API_HOST } from '@/config/constants';

interface Unit {
    id: string;
    title: string;
    description: string;
    unitId: string;
    availableLanguages: string[];
    order: number;
}

const AVAILABLE_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'af', name: 'Afrikaans' },
    { code: 'zu', name: 'Zulu' },
    { code: 'xh', name: 'Xhosa' },
    { code: 'st', name: 'Sesotho' },
    { code: 'tn', name: 'Setswana' },
    { code: 'ss', name: 'Siswati' },
    { code: 've', name: 'Tshivenda' },
    { code: 'ts', name: 'Xitsonga' },
    { code: 'nr', name: 'isiNdebele' },
];

export default function AdminDashboard() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLanguages, setSelectedLanguages] = useState<{ [key: string]: string }>({});
    const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({});

    const fetchUnits = async () => {
        try {
            const response = await fetch(`${API_HOST}/api/units`);
            if (!response.ok) {
                throw new Error('Failed to fetch units');
            }
            const data = await response.json();
            // Sort units by order
            const sortedUnits = data
                .map((unit: any) => ({
                    id: unit.id,
                    title: unit.title,
                    description: unit.description,
                    unitId: unit.unitId,
                    availableLanguages: unit.availableLanguages || [],
                    order: unit.unitOrder ?? 0
                }))
                .sort((a: Unit, b: Unit) => (a.order ?? 0) - (b.order ?? 0));
            setUnits(sortedUnits);
        } catch (error: any) {
            console.error('Error fetching units:', error);
            toast.error('Failed to load units');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUnits();
    }, []);

    const handleOrderChange = async (unitId: string, direction: 'up' | 'down') => {
        const currentIndex = units.findIndex(u => u.id === unitId);
        if (
            (direction === 'up' && currentIndex === 0) ||
            (direction === 'down' && currentIndex === units.length - 1)
        ) {
            return;
        }

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const currentUnit = units[currentIndex];
        const targetUnit = units[newIndex];

        try {
            // Update both units' orders
            await fetch(`${API_HOST}/api/units/${currentUnit.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unitOrder: newIndex })
            });

            await fetch(`${API_HOST}/api/units/${targetUnit.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unitOrder: currentIndex })
            });

            // Update local state
            const newUnits = [...units];
            newUnits[currentIndex] = { ...currentUnit, order: newIndex };
            newUnits[newIndex] = { ...targetUnit, order: currentIndex };
            setUnits(newUnits.sort((a: Unit, b: Unit) => (a.order ?? 0) - (b.order ?? 0)));

            toast.success('Unit order updated successfully');
        } catch (error) {
            console.error('Error updating unit order:', error);
            toast.error('Failed to update unit order');
        }
    };

    const handleAddLanguage = async (unitId: string, languageCode: string) => {
        try {
            const unit = units.find(u => u.id === unitId);
            if (!unit) return;

            const currentLanguages = unit.availableLanguages || [];
            if (currentLanguages.includes(languageCode)) {
                toast.error('This language is already added to the unit');
                return;
            }

            const updatedLanguages = [...currentLanguages, languageCode];
            const response = await fetch(`${API_HOST}/api/units/${unitId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ availableLanguages: updatedLanguages })
            });

            if (!response.ok) {
                throw new Error('Failed to add language');
            }

            // Update local state only after successful API call
            setUnits(units.map(u =>
                u.id === unitId
                    ? { ...u, availableLanguages: updatedLanguages }
                    : u
            ));

            toast.success('Language added successfully');
            setSelectedLanguages({ ...selectedLanguages, [unitId]: '' });
        } catch (error) {
            console.error('Error adding language:', error);
            toast.error('Failed to add language');
        }
    };

    const handleRemoveLanguage = async (unitId: string, languageCode: string) => {
        try {
            const unit = units.find(u => u.id === unitId);
            if (!unit) return;

            const updatedLanguages = (unit.availableLanguages || []).filter(
                (lang: string) => lang !== languageCode
            );

            await fetch(`${API_HOST}/api/units/${unitId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ availableLanguages: updatedLanguages })
            });

            setUnits(units.map(u =>
                u.id === unitId
                    ? { ...u, availableLanguages: updatedLanguages }
                    : u
            ));

            toast.success('Language removed successfully');
        } catch (error) {
            console.error('Error removing language:', error);
            toast.error('Failed to remove language');
        }
    };

    const handleDeleteUnit = async (unitId: string) => {
        if (!window.confirm('Are you sure you want to delete this unit? This action cannot be undone.')) {
            return;
        }

        setIsDeleting({ ...isDeleting, [unitId]: true });
        try {
            const response = await fetch(`${API_HOST}/api/units/${unitId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete unit');
            }

            setUnits(units.filter(u => u.id !== unitId));
            toast.success('Unit deleted successfully');
        } catch (error) {
            console.error('Error deleting unit:', error);
            toast.error('Failed to delete unit');
        } finally {
            setIsDeleting({ ...isDeleting, [unitId]: false });
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Language Learning Admin</h1>
                </div>
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold">Language Learning Admin</h1>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Link href="/admin/words" className="w-full sm:w-auto">
                        <Button variant="secondary" className="w-full sm:w-auto">Manage Words</Button>
                    </Link>
                    <UnitForm onSuccess={fetchUnits} />
                </div>
            </div>

            <div className="grid gap-4 sm:gap-6">
                {units.map((unit) => (
                    <div
                        key={unit.id}
                        className="p-4 sm:p-6 bg-white rounded-lg shadow-sm border border-gray-200 relative group cursor-pointer"
                        onClick={() => window.location.href = `/admin/units/${unit.id}`}
                    >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="flex-1 w-full">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                    <h2 className="text-lg sm:text-xl font-semibold">{unit.title}</h2>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOrderChange(unit.id, 'up');
                                            }}
                                            disabled={unit.order === 0}
                                        >
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOrderChange(unit.id, 'down');
                                            }}
                                            disabled={unit.order === units.length - 1}
                                        >
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-gray-600 mb-4">{unit.description}</p>
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                        <Select
                                            value={selectedLanguages[unit.id] || ''}
                                            onValueChange={(value) => {
                                                setSelectedLanguages({
                                                    ...selectedLanguages,
                                                    [unit.id]: value
                                                });
                                                handleAddLanguage(unit.id, value);
                                            }}
                                        >
                                            <SelectTrigger className="w-full sm:w-[200px]">
                                                <SelectValue placeholder="Add language" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {AVAILABLE_LANGUAGES
                                                    .filter(lang => !unit.availableLanguages?.includes(lang.code))
                                                    .map(lang => (
                                                        <SelectItem key={lang.code} value={lang.code}>
                                                            {lang.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {unit.availableLanguages?.map((lang: string) => {
                                            const languageInfo = AVAILABLE_LANGUAGES.find(l => l.code === lang);
                                            return (
                                                <div
                                                    key={lang}
                                                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <span>{languageInfo?.name || lang}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveLanguage(unit.id, lang);
                                                        }}
                                                        className="text-gray-500 hover:text-gray-700"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteUnit(unit.id);
                                }}
                                disabled={isDeleting[unit.id]}
                                className="absolute top-4 right-4"
                            >
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 