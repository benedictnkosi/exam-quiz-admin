'use client'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getLearner, createLearner, getGrades } from '@/services/api'
import { auth } from '@/lib/firebase'
import { signOut as firebaseSignOut, deleteUser } from 'firebase/auth'
import { Autocomplete, LoadScriptNext } from '@react-google-maps/api'
import { FiInfo } from 'react-icons/fi'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'

async function getSchoolFunfacts(schoolName: string, schoolAddress: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/school/fact?school_name=${encodeURIComponent(schoolName)} ${encodeURIComponent(schoolAddress)}`)
        const data = await response.json()
        if (data.status === "OK") {
            return {
                fact: data.fact
            }
        }
        throw new Error('Failed to fetch school facts')
    } catch (error) {
        console.error('Error fetching school facts:', error)
        return {
            fact: `${schoolName} is a great place to learn!`
        }
    }
}

interface Grade {
    id: number
    number: number
    active: number
}

interface LearnerInfo {
    name: string
    grade: string
    school_name: string
    school_address: string
    school_latitude: number
    school_longitude: number
    curriculum: string
    terms: string
    avatar: string
}

const TERMS = [1, 2, 3, 4]
const CURRICULA = ['CAPS', 'IEB']

export default function ProfilePage() {
    const { user } = useAuth()
    const [learnerInfo, setLearnerInfo] = useState<LearnerInfo | null>(null)
    const [editName, setEditName] = useState('')
    const [editGrade, setEditGrade] = useState('')
    const [editSchool, setEditSchool] = useState('')
    const [editSchoolAddress, setEditSchoolAddress] = useState('')
    const [editSchoolLatitude, setEditSchoolLatitude] = useState(0)
    const [editSchoolLongitude, setEditSchoolLongitude] = useState(0)
    const [editCurriculum, setEditCurriculum] = useState('')
    const [editTerms, setEditTerms] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [grades, setGrades] = useState<Grade[]>([])
    const [showGradeChangeModal, setShowGradeChangeModal] = useState(false)
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [statusModalConfig, setStatusModalConfig] = useState<{
        title: string
        message: string
        type: 'success' | 'error'
    }>({ title: '', message: '', type: 'success' })
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
    const [schoolFunfact, setSchoolFunfact] = useState<string>('')
    const [isLoadingFact, setIsLoadingFact] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleteConfirmation, setDeleteConfirmation] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        async function loadData() {
            if (!user?.uid) return

            try {
                const [learner, gradesData] = await Promise.all([
                    getLearner(user.uid),
                    getGrades()
                ])

                const name = learner.name || ''
                const gradeNumber = learner.grade?.number?.toString() || ''

                setLearnerInfo({
                    name,
                    grade: gradeNumber,
                    school_name: learner.school_name || '',
                    school_address: learner.school_address || '',
                    school_latitude: learner.school_latitude || 0,
                    school_longitude: learner.school_longitude || 0,
                    curriculum: learner.curriculum || '',
                    terms: learner.terms || '',
                    avatar: learner.avatar || ''
                })

                setEditName(name)
                setEditGrade(gradeNumber)
                setEditSchool(learner.school_name || '')
                setEditSchoolAddress(learner.school_address || '')
                setEditSchoolLatitude(learner.school_latitude || 0)
                setEditSchoolLongitude(learner.school_longitude || 0)
                setEditCurriculum(learner.curriculum || '')
                setEditTerms(learner.terms || '')

                // Sort grades in descending order
                const sortedGrades = gradesData
                    .filter((grade: Grade) => grade.active === 1)
                    .sort((a: Grade, b: Grade) => b.number - a.number)
                setGrades(sortedGrades)
            } catch (error) {
                console.error('Failed to load data:', error)
            }
        }

        loadData()
    }, [user?.uid])

    useEffect(() => {
        // Load sound preference from localStorage
        const savedSoundPreference = localStorage.getItem('soundEnabled')
        setSoundEnabled(savedSoundPreference === null ? true : savedSoundPreference === 'true')
    }, [])

    const handleSoundToggle = () => {
        const newSoundEnabled = !soundEnabled
        setSoundEnabled(newSoundEnabled)
        localStorage.setItem('soundEnabled', newSoundEnabled.toString())
    }

    const handleSave = async () => {
        if (!user?.uid) return

        // Validate required fields
        if (!editSchool) {
            setStatusModalConfig({
                title: 'Missing Information',
                message: 'Please select your school before saving.',
                type: 'error'
            })
            setShowStatusModal(true)
            return
        }

        // Validate curriculum and terms selection
        const selectedCurricula = editCurriculum.split(',').map(c => c.trim()).filter(Boolean)
        const selectedTerms = editTerms.split(',').map(t => t.trim()).filter(Boolean)

        if (selectedCurricula.length === 0 || selectedTerms.length === 0) {
            setStatusModalConfig({
                title: 'Missing Information',
                message: 'Please select at least one curriculum and one term.',
                type: 'error'
            })
            setShowStatusModal(true)
            return
        }

        if (editGrade !== learnerInfo?.grade) {
            setShowGradeChangeModal(true)
            return
        }

        await saveChanges()
    }

    const saveChanges = async () => {
        if (!user?.uid) return

        setIsSaving(true)
        try {
            const cleanTerms = editTerms.split(',')
                .map(t => t.trim())
                .filter(Boolean)
                .join(', ')

            const cleanCurriculum = editCurriculum.split(',')
                .map(c => c.trim())
                .filter(Boolean)
                .join(', ')

            await createLearner(user.uid, {
                name: editName.trim(),
                grade: parseInt(editGrade),
                school: editSchool,
                school_address: editSchoolAddress,
                school_latitude: editSchoolLatitude,
                school_longitude: editSchoolLongitude,
                terms: cleanTerms,
                curriculum: cleanCurriculum,
                email: user.email || '',
                avatar: learnerInfo?.avatar || ''
            })

            setLearnerInfo({
                name: editName.trim(),
                grade: editGrade,
                school_name: editSchool,
                school_address: editSchoolAddress,
                school_latitude: editSchoolLatitude,
                school_longitude: editSchoolLongitude,
                curriculum: cleanCurriculum,
                terms: cleanTerms,
                avatar: learnerInfo?.avatar || ''
            })

            setStatusModalConfig({
                title: 'Success!',
                message: 'Your profile has been updated successfully.',
                type: 'success'
            })
            setShowStatusModal(true)
        } catch (error) {
            console.error('Failed to update profile:', error)
            setStatusModalConfig({
                title: 'Error',
                message: 'Failed to update profile. Please try again.',
                type: 'error'
            })
            setShowStatusModal(true)
        } finally {
            setIsSaving(false)
            setShowGradeChangeModal(false)
        }
    }

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true)
            await firebaseSignOut(auth)
            window.location.href = '/login'
        } catch (error) {
            console.error('Logout error:', error)
            setStatusModalConfig({
                title: 'Error',
                message: 'Failed to logout. Please try again.',
                type: 'error'
            })
            setShowStatusModal(true)
        } finally {
            setIsLoggingOut(false)
        }
    }

    const handlePlaceSelect = async () => {
        if (autocomplete) {
            const place = autocomplete.getPlace()
            if (place) {
                setEditSchool(place.name || '')
                setEditSchoolAddress(place.formatted_address || '')
                if (place.geometry?.location) {
                    setEditSchoolLatitude(place.geometry.location.lat())
                    setEditSchoolLongitude(place.geometry.location.lng())
                }

                // Fetch fun fact when school is selected
                setIsLoadingFact(true)
                try {
                    const { fact } = await getSchoolFunfacts(place.name || '', place.formatted_address || '')
                    setSchoolFunfact(fact)
                } catch (error) {
                    console.error('Error loading fun fact:', error)
                } finally {
                    setIsLoadingFact(false)
                }
            }
        }
    }

    const handleDeleteAccount = async () => {
        if (!user?.uid) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/learner/delete?uid=${user.uid}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error('Failed to delete account');
            }

            if (data.message === 'Learner and associated data deleted successfully') {
                // Delete Firebase user account
                try {
                    await deleteUser(auth.currentUser!);
                    setStatusModalConfig({
                        title: 'Success',
                        message: 'Account deleted successfully',
                        type: 'success'
                    });
                    setShowStatusModal(true);
                    setTimeout(async () => {
                        await firebaseSignOut(auth);
                        window.location.href = '/login';
                    }, 3000);
                } catch (firebaseError) {
                    console.error('Error deleting Firebase account:', firebaseError);
                    // Continue with sign out even if Firebase deletion fails
                }
            } else {
                setStatusModalConfig({
                    title: 'Error',
                    message: data.message || 'Failed to delete account',
                    type: 'error'
                });
                setShowStatusModal(true);
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            setStatusModalConfig({
                title: 'Error',
                message: 'Failed to delete account',
                type: 'error'
            });
            setShowStatusModal(true);
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setDeleteConfirmation('');
        }
    };

    return (
        <div className="min-h-screen bg-[#1B1464] text-white p-6">
            <LoadScriptNext
                googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
                libraries={['places']}
            >
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/" className="text-white hover:text-gray-300">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <h1 className="text-2xl font-bold">Profile Settings</h1>
                    </div>

                    {/* Profile Form */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-24 h-24 rounded-full bg-blue-400 overflow-hidden mb-4">
                                <Image
                                    src={learnerInfo?.avatar ? `/images/avatars/${learnerInfo.avatar}` : '/images/avatars/1.png'}
                                    alt="Profile"
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover"
                                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                        e.currentTarget.src = '/images/subjects/icon.png'
                                    }}
                                />
                            </div>
                            <h2 className="text-xl font-semibold">{editName || 'Quiz Champion'}</h2>
                            <p className="text-gray-300">{user?.email}</p>
                        </div>

                        <div className="space-y-6">
                            {/* Name Input */}
                            <div>
                                <label className="block text-sm font-medium mb-2">🔹 What do we call our quiz champion?</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                    placeholder="Enter your name"
                                    maxLength={50}
                                />
                            </div>

                            {/* Grade Select */}
                            <div>
                                <label className="block text-sm font-medium mb-2">🏆 Grade</label>
                                <select
                                    value={editGrade}
                                    onChange={(e) => setEditGrade(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                >
                                    <option value="">Select Grade</option>
                                    {grades.map((grade) => (
                                        <option key={grade.id} value={grade.number}>
                                            Grade {grade.number}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* School Input */}
                            <div>
                                <label className="block text-sm font-medium mb-2">🏫 School</label>
                                {editSchool && (
                                    <div className="mb-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                                        <p className="font-medium text-white">{editSchool}</p>
                                        <p className="text-sm text-gray-300">{editSchoolAddress}</p>
                                    </div>
                                )}
                                <Autocomplete
                                    options={{
                                        types: ['school'],
                                        componentRestrictions: { country: 'za' }
                                    }}
                                    onLoad={(autocompleteInstance: google.maps.places.Autocomplete) => {
                                        setAutocomplete(autocompleteInstance)
                                    }}
                                    onPlaceChanged={handlePlaceSelect}
                                >
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                        placeholder="Search for your school..."
                                    />
                                </Autocomplete>
                                {!editSchool && (
                                    <p className="mt-2 text-sm text-red-400">Please select your school</p>
                                )}

                                {/* Fun Fact Display */}
                                {editSchool && (
                                    <div className="mt-4 bg-indigo-600/20 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FiInfo className="w-5 h-5 text-indigo-400" />
                                            <h4 className="font-medium text-indigo-400">Did you know?</h4>
                                        </div>
                                        <p className="text-sm text-gray-300">
                                            {isLoadingFact ? (
                                                <span className="inline-flex items-center">
                                                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Loading fun fact...
                                                </span>
                                            ) : schoolFunfact}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Curriculum Selection */}
                            <div>
                                <label className="block text-sm font-medium mb-2"> Choose Your Curriculums</label>
                                <p className="text-sm text-gray-400 mb-3">Only questions from the selected curriculum&apos;s will appear in the quiz.</p>
                                <div className="flex flex-wrap gap-2">
                                    {CURRICULA.map((curr) => (
                                        <button
                                            key={curr}
                                            onClick={() => {
                                                const currArray = editCurriculum.split(',').map(c => c.trim()).filter(Boolean)
                                                if (currArray.includes(curr)) {
                                                    setEditCurriculum(currArray.filter(c => c !== curr).join(','))
                                                } else {
                                                    setEditCurriculum(currArray.concat(curr).join(','))
                                                }
                                            }}
                                            className={`px-4 py-2 rounded-full border transition-colors ${editCurriculum.split(',').map(c => c.trim()).includes(curr)
                                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                                : 'bg-white/5 border-white/10 text-white'
                                                }`}
                                        >
                                            {curr}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Terms Selection */}
                            <div>
                                <label className="block text-sm font-medium mb-2">🔹 Which terms are you mastering today?</label>
                                <p className="text-sm text-gray-400 mb-3">Only questions from the selected terms will appear in the quiz.</p>
                                <div className="flex flex-wrap gap-2">
                                    {TERMS.map((term) => (
                                        <button
                                            key={term}
                                            onClick={() => {
                                                const termsArray = editTerms.split(',').map(t => t.trim()).filter(Boolean)
                                                if (termsArray.includes(term.toString())) {
                                                    setEditTerms(termsArray.filter(t => t !== term.toString()).join(','))
                                                } else {
                                                    setEditTerms(termsArray.concat(term.toString()).join(','))
                                                }
                                            }}
                                            className={`px-4 py-2 rounded-full border transition-colors ${editTerms.split(',').map(t => t.trim()).includes(term.toString())
                                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                                : 'bg-white/5 border-white/10 text-white'
                                                }`}
                                        >
                                            Term {term}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sound Toggle */}
                            <div>
                                <label className="block text-sm font-medium mb-2">🔊 Sound Effects</label>
                                <p className="text-sm text-gray-400 mb-3">Toggle sound effects for correct and incorrect answers.</p>
                                <button
                                    onClick={handleSoundToggle}
                                    className={`w-full px-4 py-3 rounded-xl border transition-colors flex items-center justify-between ${soundEnabled
                                        ? 'bg-indigo-600 border-indigo-500'
                                        : 'bg-white/5 border-white/10'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-xl">{soundEnabled ? '🔊' : '🔇'}</span>
                                        <span>Sound Effects</span>
                                    </span>
                                    <span className="text-sm">
                                        {soundEnabled ? 'On' : 'Off'}
                                    </span>
                                </button>
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-4 px-6 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Lock in your settings! 🔒'}
                            </button>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-4 px-6 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mb-4"
                    >
                        {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                    </button>

                    {/* Delete Account Button */}
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full bg-red-900 hover:bg-red-800 text-white rounded-xl py-4 px-6 flex items-center justify-center gap-2 transition-colors"
                    >
                        Delete Account
                    </button>

                    {/* Delete Account Modal */}
                    {showDeleteModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
                            <div className="bg-[#1B1464] rounded-xl p-6 max-w-md w-full">
                                <h3 className="text-xl font-bold mb-4">⚠️ Delete Account?</h3>
                                <p className="text-gray-300 mb-6">
                                    This action cannot be undone. All your data, including progress, settings, and history will be permanently deleted.
                                </p>

                                <div className="mb-6">
                                    <p className="text-sm text-gray-400 mb-2">
                                        Type <span className="text-red-500">delete</span> to confirm
                                    </p>
                                    <input
                                        type="text"
                                        value={deleteConfirmation}
                                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                                        placeholder="Type 'delete'"
                                        maxLength={50}
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setDeleteConfirmation('');
                                        }}
                                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white rounded-xl py-3"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={isDeleting || deleteConfirmation !== 'delete'}
                                        className={`flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 transition-colors ${(isDeleting || deleteConfirmation !== 'delete') ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete Account'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </LoadScriptNext>

            {/* Status Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-[#1B1464] rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">{statusModalConfig.title}</h3>
                        <p className="text-gray-300 mb-6">{statusModalConfig.message}</p>
                        <button
                            onClick={() => setShowStatusModal(false)}
                            className={`w-full py-3 rounded-xl text-white ${statusModalConfig.type === 'success'
                                ? 'bg-indigo-600 hover:bg-indigo-700'
                                : 'bg-red-600 hover:bg-red-700'
                                }`}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Grade Change Modal */}
            {showGradeChangeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-[#1B1464] rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">🎓 Change Grade?</h3>
                        <p className="text-gray-300 mb-6">
                            ⚠️ Heads up! Switching grades will wipe out your progress like a clean slate! 🧹✨
                            Are you super sure you want to start fresh? 🚀
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowGradeChangeModal(false)}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white rounded-xl py-3"
                            >
                                ❌ Nope, Go Back!
                            </button>
                            <button
                                onClick={saveChanges}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3"
                            >
                                ✅ Yes, Let&apos;s Do It!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
} 