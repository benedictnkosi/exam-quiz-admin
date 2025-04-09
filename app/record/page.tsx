'use client'
import React, { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Head from 'next/head'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { API_BASE_URL, getSubjectStats, getRandomQuestion, setQuestionStatus, checkAnswer, getLearner, HOST_URL, checkRecordingAnswer, getRecordignRandomQuestion, getGrades, getActiveSubjects } from '@/services/api'
import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex'
import { logAnalyticsEvent } from '@/lib/analytics'
import { motion, AnimatePresence } from "framer-motion"
import { Star } from "lucide-react"

// Interfaces
interface Question {
    id: number
    question: string
    type: 'multiple_choice'
    context: string
    answer: string
    options: string[] | {
        option1: string
        option2: string
        option3: string
        option4: string
    }
    term: number
    explanation: string
    active: boolean
    year: number
    capturer: {
        id: number
        uid: string
        name: string
        grade: any
        points: number
    }
    status: string
    message?: string
    comment?: string
    reviewer: {
        id: number
        uid: string
        name: string
        grade: any
        points: number
    }
    created: string
    subject: {
        id: number
        name: string
        active: boolean
        grade: any
    }
    image_path?: string
    question_image_path?: string
    answer_image?: string
    curriculum: string
    posted: boolean
    reviewed_at?: string
    updated?: string
    ai_explanation?: string | null
}

interface Todo {
    id: number;
    title: string;
    completed: boolean;
    created_at: string;
    due_date?: string;
}

function getSubjectIcon(subjectName: string): string {
    const nameMap: { [key: string]: string } = {
        'Physical Sciences': 'physics',
        'Agricultural Sciences': 'agriculture',
        'Mathematical Literacy': 'maths',
        'Life Sciences': 'life-science',
        'Business Studies': 'business-studies',
        'Life Orientation': 'life-orientation',
        'Economics': 'economics',
        'Geography': 'geography',
        'History': 'history',
        'Tourism': 'tourism',
        'Mathematics': 'mathematics'
    }

    const mappedName = nameMap[subjectName] || subjectName.toLowerCase().replace(/\s+/g, '-')
    return `/images/subjects/${mappedName}.png`
}

interface SubjectStats {
    status: string;
    data: {
        subject: {
            id: number;
            name: string;
        };
        stats: {
            total_answers: number;
            correct_answers: number;
            incorrect_answers: number;
            correct_percentage: number;
            incorrect_percentage: number;
        };
    };
}

// Add FavoriteQuestion interface
interface FavoriteQuestion {
    id: string;
    createdAt: {
        date: string;
        timezone_type: number;
        timezone: string;
    };
    questionId: number;
    question: string;
    aiExplanation: string;
    subjectId: number;
    context: string;
}

// Add Note interface
interface Note {
    id: number;
    created_at: string;
    text: string;
    description?: string;
    subject_name: string;
    learner: {
        id: number;
        uid: string;
        name: string;
        grade: {
            id: number;
            number: number;
            active: number;
        };
        points: number;
        notification_hour: number;
        role: string;
        created: string;
        last_seen: string;
        school_address: string;
        school_name: string;
        school_latitude: number;
        school_longitude: number;
        terms: string;
        curriculum: string;
        private_school: boolean;
        email: string;
        rating: number;
        streak: number;
        streak_last_updated: string;
        avatar: string;
        expo_push_token: string;
        learner_badges: Array<{
            id: number;
            created_at: string;
            badge: {
                id: number;
                created_at: string;
                name: string;
                rules: string;
                image: string;
                learner_badges: any[];
            };
        }>;
        notes: Array<Note> | Record<string, Note>;
    };
}

// Add MessageModal interface
interface MessageModalProps {
    isVisible: boolean;
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
}

// Add MessageModal component
const MessageModal: React.FC<MessageModalProps> = ({ isVisible, message, type = 'info', onClose }) => {
    if (!isVisible) return null;

    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className={`${bgColor} rounded-xl p-6 max-w-lg w-full text-center transition-opacity duration-200 ease-in-out`}>
                <div className="text-4xl mb-4">{icon}</div>
                <p className="text-white text-lg font-medium mb-4">{message}</p>
                <button
                    onClick={onClose}
                    className="py-2 px-8 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

// Add Badge Modal Component after MessageModal component
interface BadgeModalProps {
    isVisible: boolean;
    onClose: () => void;
    badge: {
        name: string;
        description: string;
        image: string;
    } | null;
}

const BadgeModal = ({ isVisible, onClose, badge }: BadgeModalProps) => {
    const [hasClicked, setHasClicked] = useState<boolean>(false)

    const handleClick = () => {
        setHasClicked(true)

        // Fade out after celebration
        setTimeout(() => {
            onClose()
        }, 2000)
    }

    if (!isVisible || !badge) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <AnimatePresence>
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{
                        scale: 1,
                        opacity: 1,
                        rotate: [0, -2, 2, -2, 0],
                        y: [0, -10, 0],
                    }}
                    exit={{ scale: 0.5, opacity: 0, y: 50 }}
                    transition={{
                        duration: 0.5,
                        rotate: { repeat: 2, duration: 0.3 },
                        y: { repeat: 3, duration: 0.5 },
                    }}
                    className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
                >
                    {/* Background with gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 to-purple-900 rounded-3xl" />

                    {/* Stars animation in background */}
                    <div className="absolute inset-0 overflow-hidden">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute text-yellow-300"
                                initial={{
                                    x: Math.random() * 100 - 50 + "%",
                                    y: Math.random() * 100 + "%",
                                    opacity: 0,
                                }}
                                animate={{
                                    opacity: [0, 1, 0],
                                    scale: [0.5, 1.5, 0.5],
                                }}
                                transition={{
                                    duration: 2 + Math.random() * 3,
                                    repeat: Number.POSITIVE_INFINITY,
                                    delay: Math.random() * 5,
                                }}
                            >
                                <Star size={10 + Math.random() * 10} />
                            </motion.div>
                        ))}
                    </div>

                    {/* Badge content */}
                    <div className="relative p-6 flex flex-col items-center">
                        {/* Badge circle */}
                        <motion.div
                            className="w-32 h-32 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 flex items-center justify-center border-4 border-amber-600 shadow-lg mb-4"
                            animate={{
                                rotate: 360,
                                scale: [1, 1.05, 1],
                            }}
                            transition={{
                                rotate: { duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                                scale: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                            }}
                        >
                            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center overflow-hidden">
                                <Image
                                    src={`/images/badges/${badge.image}`}
                                    alt={badge.name}
                                    width={96}
                                    height={96}
                                    className="object-contain"
                                />
                            </div>
                        </motion.div>

                        {/* Text content */}
                        <motion.div
                            className="text-center"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <motion.span
                                    animate={{ rotate: [-10, 10, -10] }}
                                    transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY }}
                                    className="text-2xl"
                                >
                                    🎉
                                </motion.span>
                                <h2 className="text-2xl font-bold text-white">New Badge Unlocked!</h2>
                                <motion.span
                                    animate={{ rotate: [10, -10, 10] }}
                                    transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY }}
                                    className="text-2xl"
                                >
                                    🎉
                                </motion.span>
                            </div>

                            <motion.h3
                                className="text-3xl font-extrabold text-yellow-300 mb-2"
                                animate={{
                                    scale: [1, 1.1, 1],
                                    textShadow: ["0 0 0px #fff", "0 0 10px #fff", "0 0 0px #fff"],
                                }}
                                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                            >
                                {badge.name}
                            </motion.h3>

                            <p className="text-white/80 mb-6">{badge.description}</p>

                            <motion.button
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-xl shadow-lg"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleClick}
                                animate={
                                    hasClicked
                                        ? {
                                            backgroundColor: ["#4F46E5", "#10B981", "#4F46E5"],
                                            transition: { duration: 1, repeat: 3 },
                                        }
                                        : {}
                                }
                            >
                                {hasClicked ? "WOOHOO!" : "AWESOME!"}
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

// Helper functions
function cleanAnswer(answer: string): string {
    return answer.trim().toLowerCase().replace(/\s+/g, ' ')
}

function getRandomSuccessMessage(): string {
    const messages = [
        "Brilliant! Keep it up!",
        "You're on fire!",
        "Outstanding work!",
        "You're crushing it!",
        "Masterfully done!",
        "Excellent progress!",
        "You're a star!",
        "Perfect answer!"
    ]
    return messages[Math.floor(Math.random() * messages.length)]
}


function getRandomLoadingMessage(): string {
    const messages = [
        "Teaching the AI not to eat crayons… 🖍️🤖 Please hold!",
        "Convincing the AI it's smarter than a goldfish… 🐟💡",
        "Loading… The robots are arguing over who's in charge 🤖🤖⚔️",
        "Polishing ones and zeros until they sparkle ✨0️⃣1️⃣✨",
        "Hold on… the AI just went for a coffee ☕🤖 (typical!)",
        "Almost ready… just untangling the robot's shoelaces 🤖👟",
        "Your smart lesson is brewing… we hope the AI didn't forget the sugar 🍯🧠"
    ]
    return messages[Math.floor(Math.random() * messages.length)]
}

// Add helper function
let isOpeningDollarSign = false
let isClosingDollarSignNextLine = false

function renderMixedContent(text: string, isDark: boolean = false) {
    if (!text) return null;

    if (text.includes('$') && text.trim().length < 3 && !isOpeningDollarSign && !isClosingDollarSignNextLine) {
        isOpeningDollarSign = true
        return ''
    }

    if (isOpeningDollarSign) {
        isOpeningDollarSign = false
        isClosingDollarSignNextLine = true
        text = `$${text}$`
    }

    if (text.includes('$') && text.trim().length < 3 && isClosingDollarSignNextLine) {
        isClosingDollarSignNextLine = false
        return ''
    }

    // Handle headings first
    if (text.startsWith('# ') && !text.includes('$')) {
        //replace ** with ""
        text = text.replace(/\*\*/g, '')
        return (
            <h1 className={`text-3xl font-bold text-center mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                🤖 {text.substring(2).trim()}
            </h1>
        );
    }
    if (text.startsWith('## ') && !text.includes('$')) {
        //replace ** with ""
        text = text.replace(/\*\*/g, '')
        return (
            <h2 className={`text-2xl font-bold text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {text.substring(3).trim()}
            </h2>
        );
    }
    if (text.startsWith('### ') && !text.includes('$')) {
        //replace ** with ""
        text = text.replace(/\*\*/g, '')
        return (
            <h3 className={`text-xl font-bold text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {text.substring(4).trim()}
            </h3>
        );
    }
    if (text.startsWith('#### ') && !text.includes('$')) {
        //replace ** with ""
        text = text.replace(/\*\*/g, '')
        return (
            <h4 className={`text-lg font-bold text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {text.substring(5).trim()}
            </h4>
        );
    }

    // Handle bullet points
    if (text.trim().startsWith('-')) {
        const content = text.trim().substring(1).trim();
        const hasBold = content.includes('**');

        // Split content into bold parts first
        const boldParts = content.split(/(\*\*[^*]+\*\*)/g);

        return (
            <div className="flex items-start space-x-2 mb-4">
                <span className={`bullet-point ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {hasBold ? '✅' : '🎯'}
                </span>
                <div className={`flex-1 ${!hasBold ? 'ml-4' : ''}`}>
                    {boldParts.map((part, index) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            // Handle bold text
                            const innerContent = part.slice(2, -2);
                            return (
                                <span
                                    key={index}
                                    className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
                                >
                                    {innerContent.includes('$') ? (
                                        // Handle formulas within bold text
                                        <>{renderMixedContent(innerContent, isDark)}</>
                                    ) : (
                                        innerContent
                                    )}
                                </span>
                            );
                        } else if (part.includes('$')) {
                            // Handle formulas in non-bold text
                            return <span key={index}>{renderMixedContent(part, isDark)}</span>;
                        } else {
                            // Regular text
                            return part ? (
                                <span
                                    key={index}
                                    className={`${isDark ? 'text-white' : 'text-gray-900'}`}
                                >
                                    {part}
                                </span>
                            ) : null;
                        }
                    })}
                </div>
            </div>
        );
    }

    // Handle formulas and regular text
    if (text.includes('$')) {
        //replace \$ with $
        text = text.replace(/\\\$/g, '$')
        //remove ** from the text
        text = text.replace(/\*\*/g, '')

        // Clean up LaTeX commands
        text = text.replace(/\\newlineeq/g, '=')  // Replace \newlineeq with =
        //text = text.replace(/\\newline/g, ' ')    // Replace \newline with space

        // First split by LaTeX delimiters
        const parts = text.split(/(\$[^$]+\$)/g);

        return (
            <div className="mixed-content-container space-y-2 inline">
                {parts.map((part, index) => {
                    if (part.startsWith('$') && part.endsWith('$')) {
                        // LaTeX content
                        const formula = part.slice(1, -1).trim()
                        return (
                            <div key={index} className={`latex-container inline-block ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                <InlineMath math={formula} />
                            </div>
                        );
                    } else {
                        // Regular text with potential bold formatting
                        const boldParts = part.split(/(\*\*[^*]+\*\*)/g);

                        return (
                            <span key={index} className={`content-text ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {boldParts.map((boldPart, boldIndex) => {
                                    if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
                                        return (
                                            <span
                                                key={`${index}-${boldIndex}`}
                                                className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
                                            >
                                                {boldPart.slice(2, -2)}
                                            </span>
                                        );
                                    }
                                    // Handle headings first
                                    if (boldPart.startsWith('# ') && !boldPart.includes('$')) {
                                        //replace ** with ""
                                        boldPart = boldPart.replace(/\*\*/g, '')
                                        return (
                                            <h1 key={`h1-${index}`} className={`text-3xl font-bold text-center mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                🤖 {boldPart.substring(2).trim()}
                                            </h1>
                                        );
                                    }
                                    if (boldPart.startsWith('## ') && !boldPart.includes('$')) {
                                        //replace ** with ""
                                        boldPart = boldPart.replace(/\*\*/g, '')
                                        return (
                                            <h2 key={`h2-${index}`} className={`text-2xl font-bold text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {boldPart.substring(3).trim()}
                                            </h2>
                                        );
                                    }
                                    if (boldPart.startsWith('### ') && !boldPart.includes('$')) {
                                        //replace ** with ""
                                        boldPart = boldPart.replace(/\*\*/g, '')
                                        return (
                                            <h3 key={`h3-${index}`} className={`text-xl font-bold text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {boldPart.substring(4).trim()}
                                            </h3>
                                        );
                                    }
                                    if (boldPart.startsWith('#### ') && !boldPart.includes('$')) {
                                        //replace ** with ""
                                        boldPart = boldPart.replace(/\*\*/g, '')
                                        return (
                                            <h4 key={`h4-${index}`} className={`text-lg font-bold text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {boldPart.substring(5).trim()}
                                            </h4>
                                        );
                                    }

                                    return boldPart;
                                })}
                            </span>
                        );
                    }
                })}
            </div>
        );
    }

    // Handle regular text with bold formatting
    const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
        <div className="text-container inline">
            {boldParts.map((boldPart, boldIndex) => {
                if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
                    return (
                        <span
                            key={`${boldIndex}`}
                            className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
                        >
                            {boldPart.slice(2, -2)}
                        </span>
                    );
                }
                return boldPart ? (
                    <span
                        key={`${boldIndex}`}
                        className={`${isDark ? 'text-white' : 'text-gray-900'}`}
                    >
                        {boldPart}
                    </span>
                ) : null;
            })}
        </div>
    );
}

export default function QuizPage() {
    const { user } = useAuth()
    const searchParams = useSearchParams()
    const subjectId = searchParams.get('subjectId')
    const subjectName = searchParams.get('subjectName')
    const router = useRouter()

    // Add new state variables
    const [selectedLearningType, setSelectedLearningType] = useState<'quiz' | 'quick_lessons' | null>('quiz')
    const [isQuizStarted, setIsQuizStarted] = useState(false)
    const [selectedPaper, setSelectedPaper] = useState<string>('')
    const [learnerRole, setLearnerRole] = useState<string>('learner')
    const [nextQuestionCountdown, setNextQuestionCountdown] = useState<number>(5)
    const [grades, setGrades] = useState<{ id: number; number: number; active: number }[]>([])
    const [subjects, setSubjects] = useState<{ id: number; name: string; active: boolean; grade: { id: number; number: number; active: number } }[]>([])
    const [selectedGrade, setSelectedGrade] = useState<string>('12')
    const [selectedSubject, setSelectedSubject] = useState<string>('')
    const [loadingGrades, setLoadingGrades] = useState(true)
    const [loadingSubjects, setLoadingSubjects] = useState(false)
    const [selectedTerm, setSelectedTerm] = useState<number>(2)
    const [isMobileView, setIsMobileView] = useState(false);

    // Add effect to fetch grades
    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const gradesData = await getGrades()
                setGrades(gradesData)
            } catch (err) {
                console.error('Failed to fetch grades:', err)
            } finally {
                setLoadingGrades(false)
            }
        }
        fetchGrades()
    }, [])

    // Add effect to fetch subjects when grade changes
    useEffect(() => {
        if (selectedGrade) {
            const fetchSubjects = async () => {
                setLoadingSubjects(true)
                try {
                    const response = await fetch(`${API_BASE_URL}/subjects/active?grade=${selectedGrade}`)
                    const data = await response.json()
                    if (data.status === 'OK' && data.subjects) {
                        setSubjects(data.subjects)
                    }
                } catch (err) {
                    console.error('Failed to fetch subjects:', err)
                } finally {
                    setLoadingSubjects(false)
                }
            }
            fetchSubjects()
        } else {
            setSubjects([])
        }
    }, [selectedGrade])

    // Add effect to fetch learner role
    useEffect(() => {
        async function fetchLearnerRole() {
            if (!user?.uid) return;
            try {
                const learnerData = await getLearner(user.uid);
                setLearnerRole(learnerData.role || 'learner');
            } catch (error) {
                console.error('Error fetching learner role:', error);
                setLearnerRole('learner');
            }
        }
        fetchLearnerRole();
    }, [user?.uid]);

    // Add audio refs
    const correctAudioRef = typeof Audio !== 'undefined' ? new Audio('/audio/correct_answer.mp3') : null
    const wrongAudioRef = typeof Audio !== 'undefined' ? new Audio('/audio/bad_answer.mp3') : null
    const timer1AudioRef = typeof Audio !== 'undefined' ? new Audio('/audio/timer1.wav') : null
    const timer2AudioRef = typeof Audio !== 'undefined' ? new Audio('/audio/timer2.wav') : null

    // Add function to play sound
    const playSound = (isCorrect: boolean) => {
        // Check if sound is enabled in localStorage
        const soundEnabled = localStorage.getItem('soundEnabled')
        if (soundEnabled === 'false') return

        if (isCorrect && correctAudioRef) {
            correctAudioRef.play().catch(error => console.error('Error playing sound:', error))
        } else if (!isCorrect && wrongAudioRef) {
            wrongAudioRef.play().catch(error => console.error('Error playing sound:', error))
        }
    }

    // Add function to play timer sound
    const playTimerSound = (duration: number) => {
        // Check if sound is enabled in localStorage

        const audioRef = duration === 10 ? timer1AudioRef : timer2AudioRef
        if (audioRef) {
            audioRef.play().catch(error => console.error('Error playing timer sound:', error))
        }
    }

    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [isAnswered, setIsAnswered] = useState(false)
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
    const [showExplanation, setShowExplanation] = useState(false)
    const [streak, setStreak] = useState(0)
    const [points, setPoints] = useState(0)
    const [loading, setLoading] = useState(false)
    const [noMoreQuestions, setNoMoreQuestions] = useState(false)
    const [stats, setStats] = useState<SubjectStats['data']['stats'] | null>(null)
    const [favoriteQuestions, setFavoriteQuestions] = useState<FavoriteQuestion[]>([])
    const [isCurrentQuestionFavorited, setIsCurrentQuestionFavorited] = useState(false)
    const [isFromFavorites, setIsFromFavorites] = useState(false)
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)
    const [isImageLoading, setIsImageLoading] = useState(false)
    const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null)
    const [isZoomModalVisible, setIsZoomModalVisible] = useState(false)
    const [imageRotation, setImageRotation] = useState(0)
    const [isReportModalVisible, setIsReportModalVisible] = useState(false)
    const [isThankYouModalVisible, setIsThankYouModalVisible] = useState(false)
    const [reportComment, setReportComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isAnswerLoading, setIsAnswerLoading] = useState(false)
    const [showFeedback, setShowFeedback] = useState(false)
    const [feedbackMessage, setFeedbackMessage] = useState<string>('')
    const [earnedPoints, setEarnedPoints] = useState(0)
    const [showPoints, setShowPoints] = useState(false)
    const [currentStreak, setCurrentStreak] = useState(0)
    const [showStreakModal, setShowStreakModal] = useState(false)
    const [duration, setDuration] = useState(0)
    const [isLoadingExplanation, setIsLoadingExplanation] = useState(false)
    const [aiExplanation, setAiExplanation] = useState<string>('')
    const [isExplanationModalVisible, setIsExplanationModalVisible] = useState(false)
    const [isFavoritesLoading, setIsFavoritesLoading] = useState(false)
    const [isFavoriting, setIsFavoriting] = useState(false)
    const [correctAnswer, setCorrectAnswer] = useState<string>('')
    const [autoAnswerTimer, setAutoAnswerTimer] = useState<NodeJS.Timeout | null>(null)
    const [countdown, setCountdown] = useState<number>(10)
    const [questionCount, setQuestionCount] = useState<number>(0)
    const [targetQuestionCount, setTargetQuestionCount] = useState<number>(5)
    const [nextQuestionTimer, setNextQuestionTimer] = useState<NodeJS.Timeout | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('soundEnabled') !== 'false'
        }
        return true
    })
    const [answerAudioBlob, setAnswerAudioBlob] = useState<Blob | null>(null)

    const [messageModal, setMessageModal] = useState<{
        isVisible: boolean;
        message: string;
        type: 'success' | 'error' | 'info';
    }>({
        isVisible: false,
        message: '',
        type: 'info'
    });
    const [isRestartModalVisible, setIsRestartModalVisible] = useState(false)
    const [isSidebarVisible, setIsSidebarVisible] = useState(true)
    const [activeTab, setActiveTab] = useState<'favorites' | 'notes' | 'todo'>('todo')
    const [notes, setNotes] = useState<Note[]>([])
    const [newNoteText, setNewNoteText] = useState('')
    const [isCreatingNote, setIsCreatingNote] = useState(false)
    const [showNoteForm, setShowNoteForm] = useState(false)
    const [noteToDelete, setNoteToDelete] = useState<number | null>(null)
    const [noteToEdit, setNoteToEdit] = useState<Note | null>(null)
    const [editNoteText, setEditNoteText] = useState('')
    const [isEditingNote, setIsEditingNote] = useState(false)
    const [todoToDelete, setTodoToDelete] = useState<number | null>(null);
    const [todos, setTodos] = useState<Todo[]>([]);
    const [newTodoText, setNewTodoText] = useState('');
    const [isCreatingTodo, setIsCreatingTodo] = useState(false);
    const [showTodoForm, setShowTodoForm] = useState(false);
    const [todoDueDate, setTodoDueDate] = useState('');
    const [speechFinished, setSpeechFinished] = useState(false);
    // Add new state for badge modal
    const [newBadge, setNewBadge] = useState<{name: string; description: string; image: string} | null>(null);
    const [isBadgeModalVisible, setIsBadgeModalVisible] = useState(false);

    const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'https://api.examquiz.co.za'

    const startTimer = () => {
        // Implement timer logic here
        // This is a placeholder for the timer implementation
    }

    const stopTimer = () => {
        if (timer) {
            clearTimeout(timer)
            setTimer(null)
        }
    }

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) { // lg breakpoint
                setIsSidebarVisible(true);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const startQuizLesson = (paper: string) => {
        if (!selectedSubject || !selectedGrade) {
            setMessageModal({
                isVisible: true,
                message: 'Please select both grade and subject before starting',
                type: 'error'
            })
            return
        }
        setIsQuizStarted(true)
        setSelectedPaper(paper)
        if (selectedLearningType === 'quiz') {
            loadRandomQuestion(paper)
        }
    }

    const loadRandomQuestion = async (paper: string) => {
        if (!user?.uid || !selectedSubject || !selectedGrade) {
            return
        }
        // Set the selected paper
        setSelectedPaper(paper)
        // Hide the sidebar when question loads
        setIsSidebarVisible(false)
        // Reset all states before loading new question
        setSelectedAnswer(null)
        setShowExplanation(false)
        setIsCorrect(null)
        stopTimer()
        setIsImageLoading(false)
        setZoomImageUrl(null)
        setImageRotation(0)
        setIsFromFavorites(false)
        setSpeechFinished(false) // Reset speechFinished state

        try {
            setLoading(true)
            const data = await getRecordignRandomQuestion(selectedSubject, user.uid, selectedTerm, selectedGrade)

            if (data.status === "NOK") {
                console.log("No more questions")
                setNoMoreQuestions(true)
                setCurrentQuestion(null)
            } else {
                console.log("Question loaded")
                // Convert array options to object format
                const optionsArray = Array.isArray(data.options) ? data.options : [
                    data.options.option1,
                    data.options.option2,
                    data.options.option3,
                    data.options.option4
                ]

                // Shuffle the options
                const shuffledOptions = [...optionsArray].sort(() => Math.random() - 0.5)
                const questionData = {
                    ...data,
                    options: {
                        option1: shuffledOptions[0],
                        option2: shuffledOptions[1],
                        option3: shuffledOptions[2],
                        option4: shuffledOptions[3]
                    }
                }
                setCurrentQuestion(questionData)
                setQuestionCount(prev => prev + 1)
                setNoMoreQuestions(false)
                setLoading(false)

                // Speak the question and start timer only after speech is complete
                const textToSpeak = [
                    questionData.context,
                    questionData.question,
                    Object.values(questionData.options).join(". ")
                ].filter(Boolean).join(". ");

                try {
                    await speakText(textToSpeak);
                    setSpeechFinished(true); // Set speechFinished to true after speech is complete 
                } catch (error) {
                    console.error('Error in text-to-speech:', error);
                }
            }

            const newStats = await getSubjectStats(user.uid, selectedSubject + " " + paper)
            setStats(newStats.data.stats)
        } catch (error) {
            console.error('Error loading question:', error)
            setMessageModal({ isVisible: true, message: 'Failed to load question', type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    // Initialize audio element
    useEffect(() => {
        if (typeof Audio !== 'undefined') {
            audioRef.current = new Audio();
            audioRef.current.onended = () => setIsPlaying(false);
            audioRef.current.onerror = (e) => console.error('Audio playback error:', e);
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Function to play audio blob
    const playAudioBlob = async (blob: Blob) => {
        try {
            if (!audioRef.current) {
                console.log('Creating new Audio element');
                audioRef.current = new Audio();
            }

            const audioUrl = URL.createObjectURL(blob);
            console.log('Created audio URL:', audioUrl);

            audioRef.current.src = audioUrl;
            setIsPlaying(true);

            await audioRef.current.play();
            console.log('Audio started playing');

            // Clean up the URL after playback
            audioRef.current.onended = () => {
                URL.revokeObjectURL(audioUrl);
                setIsPlaying(false);
                console.log('Audio finished playing');
            };
        } catch (error) {
            console.error('Error playing audio:', error);
            setIsPlaying(false);
        }
    };

    // Add useEffect for auto-answering
    useEffect(() => {
        if (currentQuestion && !isAnswered && speechFinished) {
            // Reset countdown
            const timerDuration = isSoundEnabled ? 10 : 20;
            setCountdown(timerDuration)

            // Play timer sound
            playTimerSound(timerDuration)

            // Pre-fetch the answer speech
            if (isSoundEnabled) {
                console.log('Fetching answer speech...');
                const successMessage = getRandomSuccessMessage();
                const textToSpeak = `${successMessage}. The answer is: ${currentQuestion.answer}`;
                fetch(`/api/text-to-speech`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: textToSpeak,
                        voice: 'alloy',
                        speed: 1.0
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to convert text to speech');
                    }
                    console.log('Answer speech fetched successfully');
                    return response.blob();
                })
                .then(blob => {
                    console.log('Answer speech blob received');
                    setAnswerAudioBlob(blob);
                })
                .catch(error => {
                    console.error('Error pre-fetching answer speech:', error);
                });
            }

            // Start countdown interval
            const countdownInterval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval)
                    }
                    return prev - 1
                })
            }, 1000)

            // Clear any existing timer
            if (autoAnswerTimer) {
                clearTimeout(autoAnswerTimer)
            }

            // Set new timer based on sound toggle state
            const timer = setTimeout(async () => {
                if (!isAnswered && currentQuestion) {
                    // Get the correct answer from the question
                    const correctAnswer = currentQuestion.answer;
                    
                    // Play the pre-fetched answer audio if available
                    if (isSoundEnabled && answerAudioBlob) {
                        console.log('Playing pre-fetched answer audio');
                        await playAudioBlob(answerAudioBlob);
                    }
                    
                    handleAnswer(correctAnswer)
                }
            }, timerDuration * 1000)

            setAutoAnswerTimer(timer)

            // Cleanup timer and interval on unmount or when question changes
            return () => {
                if (timer) {
                    clearTimeout(timer)
                }
                clearInterval(countdownInterval)
                // Stop any playing timer sounds
                if (timer1AudioRef) {
                    timer1AudioRef.pause()
                    timer1AudioRef.currentTime = 0
                }
                if (timer2AudioRef) {
                    timer2AudioRef.pause()
                    timer2AudioRef.currentTime = 0
                }
                // Clear the pre-fetched audio blob
                setAnswerAudioBlob(null)
                // Stop any playing audio
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.src = '';
                }
            }
        }
    }, [currentQuestion, isAnswered, speechFinished, isSoundEnabled])

    // Modify the useEffect for auto-progression to include countdown
    useEffect(() => {
        if (showExplanation && questionCount < targetQuestionCount) {
            // Reset countdown
            setNextQuestionCountdown(5)

            // Clear any existing next question timer
            if (nextQuestionTimer) {
                clearTimeout(nextQuestionTimer)
            }

            // Start countdown interval
            const countdownInterval = setInterval(() => {
                setNextQuestionCountdown((prev: number) => prev - 1)
            }, 1000)

            // Set new timer for 5 seconds
            const timer = setTimeout(() => {
                handleNext()
            }, 5000)

            setNextQuestionTimer(timer)

            // Cleanup timer and interval on unmount
            return () => {
                if (timer) {
                    clearTimeout(timer)
                }
                clearInterval(countdownInterval)
            }
        }
    }, [showExplanation, questionCount, targetQuestionCount])

    // Modify handleAnswer to clear timer
    const handleAnswer = async (answer: string) => {
        if (!user?.uid || !currentQuestion) return

        try {
            // Clear the auto-answer timer
            if (autoAnswerTimer) {
                clearTimeout(autoAnswerTimer)
                setAutoAnswerTimer(null)
                setSpeechFinished(false); // Set speechFinished to false after answer is submitted
            }

            stopTimer()
            setIsAnswerLoading(true)
            setSelectedAnswer(answer)

            // Log analytics event
            logAnalyticsEvent('submit_answer', {
                user_id: user.uid,
                question_id: currentQuestion.id,
                is_correct: true, // Always set to true
                subject: currentQuestion.subject?.name,
                grade: currentQuestion.subject?.grade?.number,
                duration: duration,
                streak: 1, // Default streak
                points: 1 // Always award 1 point
            });

            // Play sound for correct answer
            playSound(true)
            setCorrectAnswer(currentQuestion.answer)

            // Always award 1 point
            const points = 1

            setShowFeedback(true)
            setIsCorrect(true) // Always set to true
            setFeedbackMessage(getRandomSuccessMessage())
            setShowExplanation(true)

            // Speak the answer
            const successMessage = getRandomSuccessMessage();
            const textToSpeak = `${successMessage}. The answer is: ${currentQuestion.answer}`;
            try {
                await speakText(textToSpeak);
            } catch (error) {
                console.error('Error in text-to-speech:', error);
            }

            // Increment points by 1
            setPoints(points + 1)

            // Handle points and streak display
            setEarnedPoints(points)
            setShowPoints(true)
            setTimeout(() => {
                setShowPoints(false)
                setCurrentStreak(1) // Default streak
                setShowStreakModal(true)    
            }, 5000)

            // Update local stats immediately
            if (stats) {
                const newStats = {
                    total_answers: stats.total_answers + 1,
                    correct_answers: stats.correct_answers + 1,
                    incorrect_answers: stats.incorrect_answers,
                    correct_percentage: ((stats.correct_answers + 1) / (stats.total_answers + 1)) * 100,
                    incorrect_percentage: (stats.incorrect_answers / (stats.total_answers + 1)) * 100,
                }
                setStats(newStats)
            }

            // Scroll to bottom to show feedback
            setTimeout(() => {
                window.scrollTo({
                    top: document.documentElement.scrollHeight,
                    behavior: 'smooth'
                })
            }, 100)

        } catch (error) {
            console.error('Error submitting answer:', error)
            setMessageModal({ isVisible: true, message: 'Failed to submit answer', type: 'error' })
        } finally {
            setIsAnswerLoading(false)
        }
    }

    // Modify handleNext to use targetQuestionCount
    const handleNext = () => {
        // Clear any existing next question timer
        if (nextQuestionTimer) {
            clearTimeout(nextQuestionTimer)
            setNextQuestionTimer(null)
        }

        if (questionCount >= targetQuestionCount) {
            // Show completion message
            setMessageModal({
                isVisible: true,
                message: `🎉 You have completed ${targetQuestionCount} questions! Take a break or start a new session.`,
                type: 'success'
            })
            return
        }

        setSelectedAnswer('')
        setIsAnswered(false)
        setShowExplanation(false)
        if (selectedLearningType === 'quick_lessons') {
            //loadQuickLesson(selectedPaper)
        } else {
            loadRandomQuestion(selectedPaper)
        }
    }

   


    // Add the countdown display in the question card
    const renderCountdown = () => {
        if (!isAnswered && countdown > 0) {
            return (
                <div className="absolute top-6 right-6">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border-4 border-white/20">
                        <span className="text-4xl font-bold text-white">{countdown}</span>
                    </div>
                </div>
            )
        }
        return null
    }

    const speakText = async (text: string): Promise<void> => {
        // Check if sound is enabled
        if (!isSoundEnabled) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            try {
                fetch(`/api/text-to-speech`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: text,
                        voice: 'alloy',
                        speed: 1.0
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to convert text to speech');
                    }
                    return response.blob();
                })
                .then(audioBlob => {
                    const audioUrl = URL.createObjectURL(audioBlob);
                    if (audioRef.current) {
                        audioRef.current.src = audioUrl;
                        audioRef.current.onended = () => {
                            setIsPlaying(false);
                            resolve();
                        };
                        audioRef.current.onerror = (error) => {
                            console.error('Error playing audio:', error);
                            setMessageModal({
                                isVisible: true,
                                message: 'Failed to play audio. Please check your audio settings.',
                                type: 'error'
                            });
                            reject(error);
                        };
                        audioRef.current.play().catch(error => {
                            console.error('Error playing audio:', error);
                            setMessageModal({
                                isVisible: true,
                                message: 'Failed to play audio. Please check your audio settings.',
                                type: 'error'
                            });
                            reject(error);
                        });
                        setIsPlaying(true);
                    } else {
                        reject(new Error('Audio element not found'));
                    }
                })
                .catch(error => {
                    console.error('Error converting text to speech:', error);
                    setMessageModal({
                        isVisible: true,
                        message: 'Failed to convert text to speech',
                        type: 'error'
                    });
                    reject(error);
                });
            } catch (error) {
                console.error('Error in speakText:', error);
                reject(error);
            }
        });
    };

    // Add this near the other useEffect hooks
    useEffect(() => {
        // Set initial view based on screen width
        setIsMobileView(window.innerWidth < 1024);
    }, []);

    // Remove the initial loading check
    return (
        <>
            <Head>
                <meta name="google-site-verification" content="yfhZrnvqHP_FjjF34b1TKGn9-3fUGY5kOe0f-Ls_0QY" />
            </Head>
            <div className="min-h-screen bg-[#1B1464] relative">
                {/* Toggle Button - Only visible on smaller screens */}
                <button
                    onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                    className="lg:hidden fixed top-4 left-4 z-20 bg-white shadow-lg p-3 rounded-xl text-[#00B894] hover:bg-gray-100 transition-colors"
                >
                    {isSidebarVisible ? '✕ Close' : '☰ Menu'}
                </button>

                <div className="flex h-full">
                    {/* Left Panel - Subject Info */}
                    <div className={`${isSidebarVisible ? 'w-full lg:w-1/3' : 'w-0'} transition-all duration-300`}>
                        <div className={`${isSidebarVisible ? 'block' : 'hidden'} fixed lg:static w-full lg:w-full bg-[#1B1464]/90 backdrop-blur-sm p-6 flex flex-col h-screen overflow-y-auto z-40`}>
                            {/* Close button - Only visible on mobile when paper is selected */}
                            {selectedPaper && (
                                <button
                                    onClick={() => setIsSidebarVisible(false)}
                                    className="lg:hidden absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
                                    aria-label="Close menu"
                                >
                                    ✕
                                </button>
                            )}

                            <div className="flex items-center gap-4 mb-6 mt-12 lg:mt-0">
                                <button
                                    onClick={() => router.push('/')}
                                    className="text-white hover:text-white/80 transition-colors"
                                    aria-label="Go back to home"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </button>
                                <Image
                                    src={getSubjectIcon(subjectName || '')}
                                    alt={subjectName || ''}
                                    width={64}
                                    height={64}
                                    className="rounded-full"
                                />
                                <h1 className="text-2xl font-bold text-white">{subjectName}</h1>
                            </div>

                            {/* Selection Screen */}
                            {!currentQuestion && (
                                <div className="bg-white/10 rounded-xl p-6">
                                    <h2 className="text-xl font-bold text-white mb-6 text-center">Choose Your Learning Mode</h2>

                                    {/* Grade and Subject Selection */}
                                    <div className="mb-6">
                                        <div className="grid grid-cols-1 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-white mb-2">Grade</label>
                                                <select
                                                    value={selectedGrade}
                                                    onChange={(e) => {
                                                        setSelectedGrade(e.target.value)
                                                        setSelectedSubject('')
                                                    }}
                                                    className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-white/40 focus:outline-none transition-colors"
                                                    disabled={loadingGrades}
                                                >
                                                    <option value="">Select Grade</option>
                                                    {grades.map((grade) => (
                                                        <option key={grade.id} value={grade.id}>
                                                            Grade {grade.number}
                                                        </option>
                                                    ))}
                                                </select>
                                                {loadingGrades && (
                                                    <p className="text-sm text-white/60 mt-1">Loading grades...</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-white mb-2">Subject</label>
                                                <select
                                                    value={selectedSubject}
                                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                                    className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-white/40 focus:outline-none transition-colors"
                                                    disabled={loadingSubjects || !selectedGrade}
                                                >
                                                    <option value="">Select Subject</option>
                                                    {subjects.map((subject) => (
                                                        <option key={subject.id} value={subject.name}>
                                                            {subject.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {loadingSubjects && (
                                                    <p className="text-sm text-white/60 mt-1">Loading subjects...</p>
                                                )}
                                                {!selectedGrade && (
                                                    <p className="text-sm text-white/60 mt-1">Select a grade first</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-white mb-2">Term</label>
                                                <select
                                                    value={selectedTerm}
                                                    onChange={(e) => setSelectedTerm(Number(e.target.value))}
                                                    className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-white/40 focus:outline-none transition-colors"
                                                >
                                                    <option value={1}>Term 1</option>
                                                    <option value={2}>Term 2</option>
                                                    <option value={3}>Term 3</option>
                                                    <option value={4}>Term 4</option>
                                                </select>
                                            </div>
                                            {/* Question Count Selection */}
                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium text-white mb-2">Number of Questions</h4>
                                        <select
                                            value={targetQuestionCount}
                                            onChange={(e) => setTargetQuestionCount(Number(e.target.value))}
                                            className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-white/40 focus:outline-none transition-colors"
                                        >
                                            <option value={5}>5 Questions</option>
                                            <option value={10}>10 Questions</option>
                                            <option value={15}>15 Questions</option>
                                            <option value={20}>20 Questions</option>
                                        </select>
                                    </div>

                                    {/* Sound Toggle */}
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-white">Sound Effects</span>
                                            <button
                                                onClick={() => {
                                                    const newSoundEnabled = !isSoundEnabled
                                                    setIsSoundEnabled(newSoundEnabled)
                                                    localStorage.setItem('soundEnabled', String(newSoundEnabled))
                                                }}
                                                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
                                                style={{
                                                    backgroundColor: isSoundEnabled ? 'rgb(59 130 246)' : 'rgb(75 85 99)'
                                                }}
                                            >
                                                <span
                                                    className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                                                    style={{
                                                        transform: isSoundEnabled ? 'translateX(26px)' : 'translateX(1px)'
                                                    }}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                   
                                        </div>
                                    </div>

                                    {/* Learning Type Selection */}
                                    <div className="mb-6">
                                        <div className="grid grid-cols-1 gap-4">
                                            <button
                                                onClick={() => {
                                                    setSelectedLearningType('quiz');
                                                    setIsQuizStarted(true);
                                                    setSelectedPaper('recording');
                                                    loadRandomQuestion('');
                                                }}
                                                className={`relative text-white rounded-xl p-4 transition-all duration-200 bg-purple-600 shadow-lg shadow-purple-500/50 scale-105 border-2 border-white/50`}
                                            >
                                                <div className="flex flex-col items-center">
                                                    <span className="text-2xl mb-1">🎤</span>
                                                    <span className="font-semibold">Start Recording</span>
                                                    <span className="text-sm text-white/80 mt-1">Record your answer</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Quiz Content */}
                    <div className={`${isSidebarVisible ? 'lg:w-2/3' : 'w-full'} transition-all duration-300 p-3 mt-6 lg:p-6 min-h-screen`}>
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                                    <div className="text-white text-lg font-medium">
                                        {selectedLearningType === 'quick_lessons'
                                            ? getRandomLoadingMessage()
                                            : 'Loading your question...'}
                                    </div>
                                </div>
                            </div>
                        ) : !isQuizStarted ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center max-w-md mx-auto">
                                    <div className="text-6xl mb-6">🎓</div>
                                    <h2 className="text-2xl font-bold text-white mb-4">Welcome to {subjectName}!</h2>
                                    <p className="text-gray-300 mb-6">
                                        Please select your learning mode and paper from the menu to begin your learning journey.
                                    </p>
                                    <div className="bg-white/10 rounded-xl p-4">
                                        <p className="text-white/80 text-sm">
                                            💡 <span className="font-medium">Tip:</span> Choose Quiz Mode to test your knowledge or Quick Lessons to learn at your own pace.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : !isQuizStarted && !setSelectedSubject ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-center max-w-md mx-auto">
                                    <div className="text-6xl mb-6">📚</div>
                                    <h2 className="text-2xl font-bold text-white mb-4">Ready to Start Learning?</h2>
                                    <p className="text-gray-300 mb-6">
                                        Choose either Paper 1 or Paper 2 from the menu to begin your {selectedLearningType === 'quiz' ? 'quiz' : 'learning'} journey.
                                    </p>
                                    <div className="bg-white/10 rounded-xl p-4">
                                        <p className="text-white/80 text-sm">
                                            💡 <span className="font-medium">Tip:</span> Each paper contains unique content to help you master the subject.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : noMoreQuestions ? (
                            <div className="p-6">
                                <div className="max-w-3xl mx-auto">
                                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center">
                                        <div className="w-24 h-24 rounded-full bg-blue-400 overflow-hidden mb-4 mx-auto">
                                            <Image
                                                src="/images/avatars/5.png"
                                                alt="Profile"
                                                width={96}
                                                height={96}
                                                className="w-full h-full object-cover"
                                                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                    e.currentTarget.src = '/images/subjects/icon.png'
                                                }}
                                            />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white mb-2">
                                            🐛 Oops! Looks like the quiz gremlins ate all the questions!
                                        </h2>
                                        <p className="text-gray-300 mb-8">
                                            Check your profile for selected school terms and curriculum
                                        </p>

                                        <button
                                            onClick={() => router.push('/profile')}
                                            className="w-full mb-4 p-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-white"
                                        >
                                            <span className="text-xl">⚙️</span>
                                            <span>Go to Profile Settings</span>
                                        </button>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => {
                                                    setIsRestartModalVisible(true);
                                                }}
                                                className="p-4 rounded-lg bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-white"
                                            >
                                                <span className="text-xl">🔄</span>
                                                <span>Restart Subject</span>
                                            </button>

                                            <button
                                                onClick={() => router.push('/')}
                                                className="p-4 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-white"
                                            >
                                                <span className="text-xl">🏠</span>
                                                <span>Go Home</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-7xl mx-auto px-4">
                                {/* Question Card */}
                                <div className="text-center mb-8">
                                    <h1 className="text-3xl font-bold text-white mb-4">
                                        <span className="mr-4">📚</span>
                                        examquiz.co.za
                                        <span className="ml-4">🎓</span>
                                    </h1>
                                    <div className="flex flex-col items-center mt-1">
                                        <div className="flex flex-wrap justify-center">
                                            <Image 
                                                src="/images/download-app.png" 
                                                alt="Download our app" 
                                                width={500} 
                                                height={100} 
                                                className="w-auto h-auto"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {currentQuestion && (
                                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 lg:p-10 mb-8 mt-6 lg:mt-0 relative">
                                        {renderCountdown()}
                                       
                                        {/* Question Metadata */}
                                        <div className="flex items-center justify-center gap-3 mb-4">
                                            <Image
                                                src={getSubjectIcon(currentQuestion?.subject?.name || selectedSubject || '')}
                                                alt={currentQuestion?.subject?.name || selectedSubject || ''}
                                                width={32}
                                                height={32}
                                                className="rounded-full"
                                                onError={(e) => {
                                                    e.currentTarget.src = '/images/subjects/icon.png'
                                                }}
                                            />
                                            <h2 className="text-xl lg:text-2xl font-bold text-white">{currentQuestion?.subject?.name || selectedSubject}</h2>
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-2 lg:gap-3 mb-4 lg:mb-6 text-xs lg:text-sm px-2 lg:px-6">
                                            <div className="bg-white/10 px-2 py-1 lg:px-3 lg:py-1.5 rounded-full text-white/80 flex items-center gap-1.5">
                                                <span className="text-xs">📅</span>
                                                <span>Grade {currentQuestion?.subject?.grade?.number || selectedGrade}</span>
                                            </div>
                                            <div className="bg-white/10 px-2 py-1 lg:px-3 lg:py-1.5 rounded-full text-white/80 flex items-center gap-1.5">
                                                <span className="text-xs">📚</span>
                                                <span>Term {currentQuestion?.term || selectedTerm}</span>
                                            </div>
                                            <div className="bg-white/10 px-2 py-1 lg:px-3 lg:py-1.5 rounded-full text-white/80 flex items-center gap-1.5">
                                                <span className="text-xs">📆</span>
                                                <span>Year {currentQuestion?.year || new Date().getFullYear()}</span>
                                            </div>
                                            <div className="bg-white/10 px-2 py-1 lg:px-3 lg:py-1.5 rounded-full text-white/80 flex items-center gap-1.5">
                                                <span className="text-xs">📘</span>
                                                <span>{currentQuestion?.curriculum || 'CAPS'}</span>
                                            </div>
                                        </div>

                                        {/* Main Content Grid */}
                                        <div className={`${isMobileView ? 'flex flex-col gap-4 lg:gap-8' : 'grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8'}`}>
                                            {/* Left Column - Context and Question */}
                                            <div className="space-y-4 lg:space-y-6">
                                                {/* Question Context - Only show for quiz mode */}
                                                {selectedLearningType === 'quiz' && (currentQuestion.context || currentQuestion.image_path) && (
                                                    <div>
                                                        {currentQuestion.context && (
                                                            <>
                                                                <h3 className="text-base lg:text-lg font-semibold mb-2 text-white">Context</h3>
                                                                <div className="p-3 lg:p-4 bg-white/5 rounded-lg">
                                                                    {currentQuestion.context?.split('\n').map((line, index) => {
                                                                        const trimmedLine = line.trim();
                                                                        if (trimmedLine.startsWith('-')) {
                                                                            const content = trimmedLine.substring(1).trim();
                                                                            const indentLevel = line.indexOf('-') / 2;
                                                                            return (
                                                                                <div
                                                                                    key={index}
                                                                                    className="flex items-start gap-3"
                                                                                    style={{ marginLeft: `${indentLevel * 20}px` }}
                                                                                >
                                                                                    <span className="text-white mt-1">
                                                                                        {indentLevel > 0 ? '🎯' : '✅'}
                                                                                    </span>
                                                                                    <div className="flex-1">
                                                                                        {renderMixedContent(content, true)}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        }
                                                                        return (
                                                                            <div key={index}>
                                                                                {renderMixedContent(line, true)}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Question - Only show for quiz mode */}
                                                {selectedLearningType === 'quiz' && (
                                                    <div>
                                                        {currentQuestion.question && (
                                                            <>
                                                                <h3 className="text-base lg:text-lg font-semibold mb-2 text-white">Question</h3>
                                                                <div className="p-3 lg:p-4 bg-white/5 rounded-lg">
                                                                    {currentQuestion.question?.split('\n').map((line, index) => {
                                                                        const trimmedLine = line.trim();
                                                                        if (trimmedLine.startsWith('-')) {
                                                                            const content = trimmedLine.substring(1).trim();
                                                                            const indentLevel = line.indexOf('-') / 2;
                                                                            return (
                                                                                <div
                                                                                    key={index}
                                                                                    className="flex items-start gap-3"
                                                                                    style={{ marginLeft: `${indentLevel * 20}px` }}
                                                                                >
                                                                                    <span className="text-white mt-1">
                                                                                        {indentLevel > 0 ? '🎯' : '✅'}
                                                                                    </span>
                                                                                    <div className="flex-1">
                                                                                        {renderMixedContent(content, true)}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        }
                                                                        return (
                                                                            <div key={index}>
                                                                                {renderMixedContent(line, true)}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </>
                                                        )}
                                                        {currentQuestion.question_image_path && currentQuestion.question_image_path !== 'NULL' && (
                                                            <div className="mt-4">
                                                                <button
                                                                    onClick={() => {
                                                                        setZoomImageUrl(currentQuestion.question_image_path || null)
                                                                        setIsZoomModalVisible(true)
                                                                    }}
                                                                    className="w-full"
                                                                >
                                                                    <Image
                                                                        src={`${IMAGE_BASE_URL}${currentQuestion.question_image_path}`}
                                                                        alt="Question Image"
                                                                        width={400}
                                                                        height={300}
                                                                        className="rounded-lg w-full h-auto"
                                                                        onLoad={() => setIsImageLoading(false)}
                                                                    />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Column - Answer Options */}
                                            {selectedLearningType === 'quiz' && (
                                                <div className="space-y-4">
                                                    <h3 className="text-lg font-semibold text-white mb-4">Choose the correct answer</h3>
                                                    {Object.entries(currentQuestion.options).map(([key, value]) => (
                                                        <button
                                                            key={key}
                                                            onClick={() => handleAnswer(value)}
                                                            disabled={isAnswered}
                                                            className={`w-full p-4 rounded-lg text-center transition-all border ${
                                                                cleanAnswer(value) === cleanAnswer(correctAnswer) && showExplanation
                                                                    ? 'bg-green-500/20 text-green-100 border-green-500/50 animate-pulse'
                                                                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                                                            } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                                                        >
                                                            {renderMixedContent(value, true)}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                    
                            </div>
                        )}
                    </div>
                </div>
                
            </div>
        </>
    )
} 