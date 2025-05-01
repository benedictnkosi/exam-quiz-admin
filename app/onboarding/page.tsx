'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import { IoInformationCircle, IoLocation } from 'react-icons/io5'
import { Autocomplete, LoadScriptNext } from '@react-google-maps/api'
import { API_HOST } from '@/config/constants'

async function getSchoolFunfacts(schoolName: string, schoolAddress: string) {
    try {
        const response = await fetch(`${API_HOST}/api/school/fact?school_name=${encodeURIComponent(schoolName)} ${encodeURIComponent(schoolAddress)}`)
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

const ILLUSTRATIONS = {
    welcome: '/images/illustrations/school.png',
    grade: '/images/illustrations/stressed.png',
    school: '/images/illustrations/friends.png',
    ready: '/images/illustrations/exam.png',
}

const AVATAR_IMAGES = {
    '1': '/images/avatars/1.png',
    '2': '/images/avatars/2.png',
    '3': '/images/avatars/3.png',
    '4': '/images/avatars/4.png',
    '5': '/images/avatars/5.png',
    '6': '/images/avatars/6.png',
    '7': '/images/avatars/7.png',
    '8': '/images/avatars/8.png',
    '9': '/images/avatars/9.png',
}

export default function OnboardingPage() {
    const [step, setStep] = useState(0)
    const [learnerName, setLearnerName] = useState('')
    const [grade, setGrade] = useState('')
    const [school, setSchool] = useState('Default School')
    const [schoolAddress, setSchoolAddress] = useState('Default Address')
    const [schoolLatitude, setSchoolLatitude] = useState(0)
    const [schoolLongitude, setSchoolLongitude] = useState(0)
    const [schoolName, setSchoolName] = useState('Default School')
    const [curriculum, setCurriculum] = useState('CAPS')
    const [difficultSubject, setDifficultSubject] = useState('')
    const [selectedAvatar, setSelectedAvatar] = useState('1')
    const [schoolFunfacts, setSchoolFunfacts] = useState('')
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
    const [isLoadingFact, setIsLoadingFact] = useState(false)
    const [schoolFunfact, setSchoolFunfact] = useState('')

    const [errors, setErrors] = useState({
        name: '',
        grade: '',
        difficultSubject: '',
        avatar: ''
    })

    const router = useRouter()

    // useEffect(() => {
    //     console.log(user)
    //     if (user) {
    //         router.push('/')
    //     }
    // }, [user, router])

    const handleNextStep = () => {
        if (step === 1 && !learnerName.trim()) {
            setErrors(prev => ({ ...prev, name: 'Please enter your name' }))
            return
        }
        if (step === 2 && !grade) {
            setErrors(prev => ({ ...prev, grade: 'Please select your grade' }))
            return
        }
        if (step === 3 && !difficultSubject) {
            setErrors(prev => ({ ...prev, difficultSubject: 'Please select your most challenging subject' }))
            return
        }
        if (step === 4 && !selectedAvatar) {
            setErrors(prev => ({ ...prev, avatar: 'Please select an avatar' }))
            return
        }
        if (step === 4) {
            handleComplete()
            return
        }

        setErrors({
            name: '',
            grade: '',
            difficultSubject: '',
            avatar: ''
        })
        setStep(step + 1)
    }

    const handleComplete = () => {
        const params = new URLSearchParams({
            name: learnerName,
            grade,
            school: schoolName,
            school_address: schoolAddress,
            school_latitude: schoolLatitude.toString(),
            school_longitude: schoolLongitude.toString(),
            curriculum,
            difficultSubject,
            avatar: selectedAvatar,

        })
        router.push(`/register?${params.toString()}`)
    }

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <div className="space-y-8">
                        <div className="mb-12">
                            <button
                                onClick={() => router.push('/login')}
                                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-lg"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                <span>Back to Login</span>
                            </button>
                        </div>
                        <div className="relative w-full h-[200px]">
                            <Image
                                src={ILLUSTRATIONS.welcome}
                                alt="Welcome"
                                layout="fill"
                                objectFit="contain"
                            />
                        </div>
                        <div className="text-center space-y-6">
                            <h1 className="text-4xl font-bold text-white">
                                🎉 Welcome to Exam Quiz! 🚀
                            </h1>
                            <p className="text-xl text-white/90">
                                📝 Get ready to boost your brainpower and ace your exams! 🏆
                            </p>
                            <p className="text-lg text-white/90">
                                💡 Join 4,000+ students sharpening their skills with 8,000+ brain-boosting questions every day! 🧠🔥
                            </p>
                        </div>
                    </div>
                )

            case 1:
                return (
                    <div className="space-y-8">
                        <div className="relative w-full h-[200px]">
                            <Image
                                src={ILLUSTRATIONS.welcome}
                                alt="Name Input"
                                layout="fill"
                                objectFit="contain"
                            />
                        </div>
                        <div className="text-center space-y-6">
                            <h2 className="text-3xl font-bold text-white">What&apos;s your name? 👋</h2>
                            <p className="text-xl text-white/90">Let&apos;s make this journey personal!</p>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={learnerName}
                                    onChange={(e) => setLearnerName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full p-4 rounded-xl bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                                    maxLength={50}
                                />
                                {errors.name && <p className="text-red-400">{errors.name}</p>}
                            </div>
                        </div>
                    </div>
                )

            case 2:
                return (
                    <div className="space-y-8">
                        <div className="relative w-full h-[200px]">
                            <Image
                                src={ILLUSTRATIONS.grade}
                                alt="Grade Selection"
                                layout="fill"
                                objectFit="contain"
                            />
                        </div>
                        <div className="text-center space-y-6">
                            <h2 className="text-3xl font-bold text-white">What grade are you in?</h2>
                            <div className="space-y-4">
                                {[10, 11, 12].map((g) => (
                                    <button
                                        key={g}
                                        className={`w-full p-4 rounded-xl text-lg font-semibold transition-all ${grade === g.toString()
                                            ? 'bg-white text-[#1e1b4b] shadow-lg'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                            }`}
                                        onClick={() => setGrade(g.toString())}
                                    >
                                        Grade {g}
                                    </button>
                                ))}
                            </div>
                            {errors.grade && <p className="text-red-400">{errors.grade}</p>}
                        </div>
                    </div>
                )

            case 3:
                return (
                    <div className="space-y-8">
                        <div className="text-center space-y-6">
                            <h2 className="text-3xl font-bold text-white">🤔 Which subject challenges you the most?</h2>
                            <p className="text-xl text-white/90">We&apos;ll give extra attention to this one! 💪</p>
                            <div className="space-y-4">
                                {[
                                    { id: 'mathematics', label: 'Mathematics', emoji: '1️⃣' },
                                    { id: 'physics', label: 'Physical Sciences', emoji: '⚡' },
                                    { id: 'life_sciences', label: 'Life Sciences', emoji: '🧬' },
                                    { id: 'accounting', label: 'Accounting', emoji: '📊' },
                                    { id: 'geography', label: 'Geography', emoji: '🌍' },
                                    { id: 'other', label: 'Other', emoji: '📚' }
                                ].map((subject) => (
                                    <button
                                        key={subject.id}
                                        className={`w-full p-4 rounded-xl text-lg font-semibold transition-all ${difficultSubject === subject.id
                                            ? 'bg-white text-[#1e1b4b] shadow-lg'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                            }`}
                                        onClick={() => setDifficultSubject(subject.id)}
                                    >
                                        <span className="flex items-center gap-3">
                                            <span>{subject.emoji}</span>
                                            <span>{subject.label}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                            {errors.difficultSubject && <p className="text-red-400">{errors.difficultSubject}</p>}
                        </div>
                    </div>
                )

            case 4:
                return (
                    <div className="space-y-8">
                        <div className="text-center space-y-6">
                            <h2 className="text-3xl font-bold text-white">🎨 Choose Your Avatar</h2>
                            <p className="text-xl text-white/90">Pick a cool avatar to represent you! ✨</p>
                            <div className="grid grid-cols-3 gap-4">
                                {Object.entries(AVATAR_IMAGES).map(([num, src]) => (
                                    <button
                                        key={num}
                                        className={`relative aspect-square rounded-xl overflow-hidden transition-all ${selectedAvatar === num ? 'ring-4 ring-white' : ''}`}
                                        onClick={() => setSelectedAvatar(num)}
                                    >
                                        <Image
                                            src={src}
                                            alt={`Avatar ${num}`}
                                            layout="fill"
                                            objectFit="cover"
                                        />
                                    </button>
                                ))}
                            </div>
                            {errors.avatar && <p className="text-red-400">{errors.avatar}</p>}
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#1B1464] to-[#2B2F77]">
            <div className="max-w-md mx-auto min-h-screen flex flex-col p-6">
                <div className="flex-1 flex flex-col justify-center">
                    {renderStep()}
                </div>

                <div className="mt-8 space-y-4">
                    <button
                        onClick={handleNextStep}
                        className="w-full p-4 rounded-full font-semibold bg-white text-[#1e1b4b] hover:bg-white/90 transition-all"
                    >
                        {step === 4 ? 'Create Account 🚀' : 'Next 🚀'}
                    </button>
                    {step > 0 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="w-full p-4 rounded-full text-white bg-white/10 hover:bg-white/20 transition-all"
                        >
                            Back
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
} 