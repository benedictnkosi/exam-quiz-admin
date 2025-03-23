'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import { IoEyeOutline, IoEyeOffOutline, IoInformationCircle, IoLocation } from 'react-icons/io5'
import { Autocomplete, LoadScriptNext } from '@react-google-maps/api'

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
    const [school, setSchool] = useState('')
    const [schoolAddress, setSchoolAddress] = useState('')
    const [schoolLatitude, setSchoolLatitude] = useState(0)
    const [schoolLongitude, setSchoolLongitude] = useState(0)
    const [schoolName, setSchoolName] = useState('')
    const [curriculum, setCurriculum] = useState('')
    const [difficultSubject, setDifficultSubject] = useState('')
    const [selectedAvatar, setSelectedAvatar] = useState('1')
    const [schoolFunfacts, setSchoolFunfacts] = useState('')
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
    const [isLoadingFact, setIsLoadingFact] = useState(false)
    const [schoolFunfact, setSchoolFunfact] = useState('')

    const [errors, setErrors] = useState({
        name: '',
        grade: '',
        school: '',
        curriculum: '',
        difficultSubject: '',
        avatar: ''
    })

    const router = useRouter()
    const { user } = useAuth()

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
        if (step === 3 && !school) {
            setErrors(prev => ({ ...prev, school: 'Please select your school' }))
            return
        }
        if (step === 4 && !curriculum) {
            setErrors(prev => ({ ...prev, curriculum: 'Please select your curriculum' }))
            return
        }
        if (step === 5 && !difficultSubject) {
            setErrors(prev => ({ ...prev, difficultSubject: 'Please select your most challenging subject' }))
            return
        }
        if (step === 6 && !selectedAvatar) {
            setErrors(prev => ({ ...prev, avatar: 'Please select an avatar' }))
            return
        }
        if (step === 6) {
            handleComplete()
            return
        }

        setErrors({
            name: '',
            grade: '',
            school: '',
            curriculum: '',
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
                            <h2 className="text-3xl font-bold text-white">🎓 Which school do you rep?</h2>
                            <p className="text-xl text-white/90">Join the learning squad! 🚀📚</p>
                            <LoadScriptNext
                                googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
                                libraries={['places']}
                            >
                                <Autocomplete
                                    options={{
                                        types: ['school'],
                                        componentRestrictions: { country: 'za' }
                                    }}
                                    onLoad={(autocompleteInstance: google.maps.places.Autocomplete) => {
                                        setAutocomplete(autocompleteInstance)
                                        console.log('Autocomplete loaded:', autocompleteInstance)
                                    }}
                                    onPlaceChanged={() => {
                                        if (autocomplete) {
                                            const place = autocomplete.getPlace()
                                            if (place) {
                                                setSchool(place.formatted_address || '')
                                                setSchoolName(place.name || '')
                                                setSchoolAddress(place.formatted_address || '')
                                                if (place.geometry?.location) {
                                                    setSchoolLatitude(place.geometry.location.lat())
                                                    setSchoolLongitude(place.geometry.location.lng())
                                                }
                                                setErrors(prev => ({ ...prev, school: '' }))

                                                // Fetch fun fact when school is selected
                                                setIsLoadingFact(true)
                                                getSchoolFunfacts(place.name || '', place.formatted_address || '').then(({ fact }) => {
                                                    setSchoolFunfact(fact)
                                                    setIsLoadingFact(false)
                                                })
                                            }
                                        }
                                    }}
                                >
                                    <input
                                        type="text"
                                        placeholder="Search for your school..."
                                        className="w-full p-4 rounded-xl bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                                    />
                                </Autocomplete>
                            </LoadScriptNext>
                            {school && (
                                <>
                                    <div className="bg-white/10 rounded-xl p-4 space-y-2">
                                        <div className="flex items-center gap-2 text-white/80">
                                            <IoLocation className="w-5 h-5" />
                                            <span>Selected School</span>
                                        </div>
                                        <p className="text-white font-semibold">{schoolName}</p>
                                        <p className="text-white/80">{schoolAddress}</p>
                                    </div>

                                    {/* Fun Fact Display */}
                                    <div className="mt-4 bg-indigo-600/20 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <IoInformationCircle className="w-5 h-5 text-indigo-400" />
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
                                </>
                            )}
                            {errors.school && <p className="text-red-400">{errors.school}</p>}
                        </div>
                    </div>
                )

            case 4:
                return (
                    <div className="space-y-8">
                        <div className="relative w-full h-[200px]">
                            <Image
                                src={ILLUSTRATIONS.school}
                                alt="Curriculum Selection"
                                layout="fill"
                                objectFit="contain"
                            />
                        </div>
                        <div className="text-center space-y-6">
                            <h2 className="text-3xl font-bold text-white">📚 Which curriculum are you following?</h2>
                            <div className="space-y-4">
                                {[
                                    { id: 'CAPS', label: 'CAPS', emoji: '📘' },
                                    { id: 'IEB', label: 'IEB', emoji: '📗' }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        className={`w-full p-4 rounded-xl text-lg font-semibold transition-all ${curriculum === item.id
                                            ? 'bg-white text-[#1e1b4b] shadow-lg'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                            }`}
                                        onClick={() => setCurriculum(item.id)}
                                    >
                                        {item.emoji} {item.label}
                                    </button>
                                ))}
                            </div>
                            {errors.curriculum && <p className="text-red-400">{errors.curriculum}</p>}
                        </div>
                    </div>
                )

            case 5:
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
                                    { id: 'english', label: 'English', emoji: '📚' }
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

            case 6:
                return (
                    <div className="space-y-8">
                        <div className="relative w-full h-[200px]">
                            <Image
                                src={ILLUSTRATIONS.ready}
                                alt="Avatar Selection"
                                layout="fill"
                                objectFit="contain"
                            />
                        </div>
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
                        {step === 6 ? 'Create Account 🚀' : 'Next 🚀'}
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