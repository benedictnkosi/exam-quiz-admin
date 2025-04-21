'use client'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Head from 'next/head'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { API_BASE_URL, getSubjectStats, getRandomQuestion, setQuestionStatus, checkAnswer, getLearner, HOST_URL } from '@/services/api'
import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex'
import { logAnalyticsEvent } from '@/lib/analytics'
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
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

    useEffect(() => {
        if (isVisible && badge) {
            // Trigger confetti when badge appears
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
            })

        }
    }, [isVisible, badge])

    const handleClick = () => {
        setHasClicked(true)

        // More confetti on click!
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.7 },
        })

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
        "🎯 Brilliant! Keep it up!",
        "⭐ You're on fire!",
        "🌟 Outstanding work!",
        "💪 You're crushing it!",
        "🎨 Masterfully done!",
        "🚀 Excellent progress!",
        "🌈 You're a star!",
        "🎉 Perfect answer!"
    ]
    return messages[Math.floor(Math.random() * messages.length)]
}

function getRandomWrongMessage(): string {
    const messages = [
        "🎯 Almost there! Let's learn from this.",
        "💡 Good try! Keep learning.",
        "📚 Practice makes perfect!",
        "🌱 Every mistake helps us grow!",
        "🤔 Let's understand this better.",
        "💪 Don't give up! You've got this!",
        "🌟 Keep going! You're learning!",
        "🎨 Learning is a journey!"
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
    console.log('text', text)
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
    const [feedbackMessage, setFeedbackMessage] = useState('')
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

    // Add new state for badge modal
    const [newBadge, setNewBadge] = useState<{ name: string; description: string; image: string } | null>(null);
    const [isBadgeModalVisible, setIsBadgeModalVisible] = useState(false);

    const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'https://api.examquiz.co.za'

    // Add useEffect for streak modal confetti
    useEffect(() => {
        if (showStreakModal) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
            });
        }
    }, [showStreakModal]);

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

    const loadRandomQuestion = async (paper: string) => {
        if (!user?.uid || !subjectName || !subjectId) {
            return
        }
        // Set the selected paper
        setSelectedPaper(paper)
        // Close the sidebar on mobile when a paper is selected
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

        try {
            setLoading(true)
            const data = await getRandomQuestion(subjectName, paper, user.uid)

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

                // Check if this question is in favorites and set the star accordingly
                const isFavorited = favoriteQuestions.some(fav => fav.questionId === data.id)
                setIsCurrentQuestionFavorited(isFavorited)

                setNoMoreQuestions(false)
                startTimer()
            }

            const newStats = await getSubjectStats(user.uid, subjectName + " " + paper)
            setStats(newStats.data.stats)
        } catch (error) {
            console.error('Error loading question:', error)
            showMessage('Failed to load question: ' + error, 'error')
        } finally {
            setLoading(false)
        }
    }

    const loadQuickLesson = async (paper: string) => {
        if (!user?.uid || !subjectName) {
            return
        }
        // Set the selected paper
        setSelectedPaper(paper)
        // Reset all states before loading new question
        setSelectedAnswer(null)
        setShowExplanation(false)
        setIsCorrect(null)
        stopTimer()
        setIsImageLoading(false)
        setZoomImageUrl(null)
        setImageRotation(0)
        setIsSidebarVisible(false)
        setIsFromFavorites(false)

        try {
            setLoading(true)
            const response = await fetch(
                `${API_BASE_URL}/question/random?subject_name=${subjectName} ${paper}&uid=${user.uid}`
            )
            const data = await response.json()

            if (data.status === "NOK") {
                setNoMoreQuestions(true)
                setCurrentQuestion(null)
            } else {
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
                    },
                    ai_explanation: data.ai_explanation ? data.ai_explanation
                        .replace(/\\n/g, '\\newline')
                        .replace(/\\\(/g, '$')
                        .replace(/\\\),/g, '$')
                        .replace(/\[/g, '$')
                        .replace(/\]/g, '$')
                        .replace(/\\\)\./g, '$')
                        .replace(/\\\)/g, '$')
                        .replace(/\\\\/g, '\\')
                        .replace(/\\text\{([^}]+)\}/g, '\\text{$1}')
                        .replace(/\[/g, '$')
                        .replace(/\]/g, '$')
                        .replace(/\\[[\]]/g, '$')
                        // Remove newlines between $ signs to keep LaTeX on one line
                        .replace(/\$\s*\n\s*([^$]+)\s*\n\s*\$/g, '$ $1 $')
                        : ''
                }
                setCurrentQuestion(questionData)
                setNoMoreQuestions(false)
                startTimer()
            }

            const newStats = await getSubjectStats(user.uid, subjectName + " " + paper)
            setStats(newStats.data.stats)

            logAnalyticsEvent('lesson_view', {
                user_id: user.uid,
                subject_name: subjectName + " " + paper,
                paper: paper
            })
        } catch (error) {
            console.error('Error loading quick lesson:', error)
            showMessage('Failed to load quick lesson: ' + error, 'error')
        } finally {
            setLoading(false)
        }
    }

    const startQuizLesson = (paper: string) => {
        setIsQuizStarted(true)
        setSelectedPaper(paper)
        if (selectedLearningType === 'quiz') {
            loadRandomQuestion(paper)
        } else {
            loadQuickLesson(paper)
        }
    }

    const handleAnswer = async (answer: string) => {
        if (!user?.uid || !currentQuestion) return

        try {
            stopTimer()
            setIsAnswerLoading(true)
            setSelectedAnswer(answer)

            const response = await checkAnswer(user.uid, currentQuestion.id, answer, duration)

            // Log analytics event
            logAnalyticsEvent('submit_answer', {
                user_id: user.uid,
                question_id: currentQuestion.id,
                is_correct: response.correct
            });

            // Play sound based on answer correctness
            playSound(response.correct)
            setCorrectAnswer(response.correctAnswer)

            if (response.correct) {
                // Check for new badges when answer is correct
                checkForNewBadges(user.uid);
            }

            // Always award 1 point for correct answers
            const points = response.correct ? 1 : 0

            setShowFeedback(true)
            setIsCorrect(response.correct)
            setFeedbackMessage(response.correct ? getRandomSuccessMessage() : getRandomWrongMessage())
            setShowExplanation(true)

            if (response.correct) {
                //increament points by 1
                setPoints(points + 1)
            } else {
                //decreament points by 1
                setPoints(points - 1)
            }
            // Handle points and streak display
            if (response.streakUpdated && response.correct) {
                setEarnedPoints(points)
                setShowPoints(true)
                setTimeout(() => {
                    setShowPoints(false)
                    setCurrentStreak(response.streak)
                    setShowStreakModal(true)
                }, 5000)
            } else if (response.streakUpdated) {
                setCurrentStreak(response.streak)
                setShowStreakModal(true)
            }

            // Update local stats immediately
            if (stats) {
                const newStats = {
                    total_answers: stats.total_answers + 1,
                    correct_answers: response.correct
                        ? stats.correct_answers + 1
                        : stats.correct_answers,
                    incorrect_answers: !response.correct
                        ? stats.incorrect_answers + 1
                        : stats.incorrect_answers,
                    correct_percentage: response.correct
                        ? ((stats.correct_answers + 1) / (stats.total_answers + 1)) * 100
                        : (stats.correct_answers / (stats.total_answers + 1)) * 100,
                    incorrect_percentage: !response.correct
                        ? ((stats.incorrect_answers + 1) / (stats.total_answers + 1)) * 100
                        : (stats.incorrect_answers / (stats.total_answers + 1)) * 100,
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
            showMessage('Failed to submit answer', 'error')
        } finally {
            setIsAnswerLoading(false)
        }
    }

    const handleNext = () => {
        setSelectedAnswer('')
        setIsAnswered(false)
        setShowExplanation(false)
        if (selectedLearningType === 'quick_lessons') {
            loadQuickLesson(selectedPaper)
        } else {
            loadRandomQuestion(selectedPaper)
        }
    }

    const reportIssue = () => {
        setIsReportModalVisible(true)
    }

    const handleSubmitReport = async () => {
        if (!reportComment.trim()) {
            showMessage('Please enter a comment', 'error')
            return
        }

        try {
            setIsSubmitting(true)
            await setQuestionStatus({
                question_id: currentQuestion?.id || 0,
                status: 'rejected',
                email: user?.email || '',
                uid: user?.uid || '',
                comment: reportComment
            })

            // Close the report modal and show thank you modal
            setIsReportModalVisible(false)
            setIsThankYouModalVisible(true)
            setReportComment('')

        } catch (error) {
            console.error('Error reporting issue:', error)
            showMessage('Failed to report issue', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const fetchAIExplanation = async (questionId: number) => {
        setIsLoadingExplanation(true)
        try {
            const response = await fetch(
                `${API_BASE_URL}/question/ai-explanation?question_id=${questionId}`
            )
            const data = await response.json()
            if (data.status === "OK") {
                let explanation = data.explanation
                    .replace(/\\n/g, '\\newline')
                    .replace(/\\\(/g, '$')
                    .replace(/\\\),/g, '$')
                    .replace(/\[/g, '$')
                    .replace(/\]/g, '$')
                    .replace(/\\\)\./g, '$')
                    .replace(/\\\)/g, '$')
                    .replace(/\\\\/g, '\\')
                    .replace(/\\text\{([^}]+)\}/g, '\\text{$1}')
                    .replace(/\[/g, '$')
                    .replace(/\]/g, '$')
                    .replace(/\\[[\]]/g, '$')
                    // Remove newlines between $ signs to keep LaTeX on one line
                    .replace(/\$\s*\n\s*([^$]+)\s*\n\s*\$/g, '$ $1 $')

                setAiExplanation(explanation)
                setIsExplanationModalVisible(true)
            }
        } catch (error) {
            console.error('Error fetching AI explanation:', error)
            showMessage('Could not load AI explanation', 'error')
        } finally {
            setIsLoadingExplanation(false)
        }
    }

    // Add fetchFavoriteQuestions function
    const fetchFavoriteQuestions = async () => {
        if (!user?.uid || !subjectName) return;

        try {
            setIsFavoritesLoading(true)
            const response = await fetch(
                `${API_BASE_URL}/question/favorite?uid=${user.uid}&subject_name=${subjectName}`
            )

            if (!response.ok) {
                throw new Error('Failed to fetch favorites')
            }


            const data = await response.json()
            if (data.status === "OK") {
                setFavoriteQuestions(data.data || [])
            }
        } catch (error) {
            console.error('Error fetching favorites:', error)
            showMessage('Failed to load favorite questions', 'error')
        } finally {
            setIsFavoritesLoading(false)
        }
    }

    // Call fetchFavoriteQuestions when component mounts and when user changes
    useEffect(() => {
        if (user?.uid && subjectName) {
            fetchFavoriteQuestions();
        }
    }, [user?.uid, subjectName]);

    // Add handleFavoriteQuestion function
    const handleFavoriteQuestion = async () => {
        if (!user?.uid || !currentQuestion) return;

        // Optimistically update UI
        setIsCurrentQuestionFavorited(true)
        setIsFavoriting(true)

        try {
            const response = await fetch(`${API_BASE_URL}/question/favorite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: user.uid,
                    question_id: currentQuestion.id
                })
            })

            const data = await response.json()
            if (!response.ok) {
                if (data.message?.includes('You can only favorite up to')) {
                    showMessage('You can only favorite up to 20 questions per paper', 'error')
                }
                setIsCurrentQuestionFavorited(false)
            }

            if (data.status === "OK") {
                await fetchFavoriteQuestions()
            } else {
                setIsCurrentQuestionFavorited(false)
            }
        } catch (error) {
            setIsCurrentQuestionFavorited(false)
            console.error('Error favoriting question:', error)
            showMessage('Failed to favorite question', 'error')
        } finally {
            setIsFavoriting(false)
        }
    }

    // Add handleUnfavoriteQuestion function
    const handleUnfavoriteQuestion = async (favoriteId: string) => {
        if (!user?.uid) return;

        // Optimistically update UI
        setIsCurrentQuestionFavorited(false)
        setIsFavoriting(true)

        try {
            const response = await fetch(`${API_BASE_URL}/question/favorite`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: user.uid,
                    favorite_id: favoriteId
                })
            })

            if (!response.ok) {
                setIsCurrentQuestionFavorited(true)
                throw new Error('Failed to unfavorite question')
            }

            const data = await response.json()
            if (data.status === "OK") {
                await fetchFavoriteQuestions()
            } else {
                setIsCurrentQuestionFavorited(true)
            }
        } catch (error) {
            setIsCurrentQuestionFavorited(true)
            console.error('Error unfavoriting question:', error)
            showMessage('Failed to remove question from favorites', 'error')
        } finally {
            setIsFavoriting(false)
        }
    }

    // Add effect to check if current question is favorited
    useEffect(() => {
        if (currentQuestion) {
            const isFavorited = favoriteQuestions.some(fav => fav.questionId === currentQuestion.id)
            setIsCurrentQuestionFavorited(isFavorited)
        }
    }, [currentQuestion, favoriteQuestions])

    const showMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setMessageModal({ isVisible: true, message, type });
    };

    const handleRestart = async () => {
        if (!user?.uid || !subjectName || !selectedPaper) return;

        try {
            setLoading(true);

            // Call API to remove results
            const response = await fetch(`${API_BASE_URL}/learner/remove-results`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: user.uid,
                    subject_name: subjectName + " " + selectedPaper
                })
            });

            if (!response.ok) {
                throw new Error('Failed to reset progress');
            }

            // Reset states
            setCurrentQuestion(null);
            setSelectedAnswer(null);
            setShowFeedback(false);
            setIsCorrect(null);
            setNoMoreQuestions(false);
            setIsRestartModalVisible(false);

            // Load new question
            await loadRandomQuestion(selectedPaper);

            // Show success message
            showMessage('Progress reset successfully', 'success');

        } catch (error) {
            console.error('Error restarting quiz:', error);
            showMessage('Failed to reset progress', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadSpecificQuestion = async (questionId: number) => {
        if (!user?.uid || !subjectName) {
            return;
        }
        try {
            setIsQuizStarted(true);
            setSelectedLearningType('quiz');
            setLoading(true);
            // Close the sidebar on mobile when a favorite is clicked
            setIsSidebarVisible(false);
            // Set that this question is from favorites
            setIsFromFavorites(true);

            const response = await fetch(
                `${API_BASE_URL}/question/byname?subject_name=${subjectName}&paper_name=P1&uid=${user.uid}&question_id=${questionId}&platform=web`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch question');
            }

            const data = await response.json();

            if (data) {
                // The response is already in the correct format, just need to ensure options structure
                const questionData = {
                    ...data,
                    options: data.options || {
                        option1: '',
                        option2: '',
                        option3: '',
                        option4: ''
                    }
                };

                setCurrentQuestion(questionData);

                // Set the selectedPaper based on the question's subject name
                const paperName = data.subject.name.split(" ").pop() || 'P1';
                setSelectedPaper(paperName);

                // Check if this question is in favorites and set the star accordingly
                const isFavorited = favoriteQuestions.some(fav => fav.questionId === questionId);
                setIsCurrentQuestionFavorited(isFavorited);

                setNoMoreQuestions(false);

                // Reset the UI state for a new question
                setSelectedAnswer(null);
                setShowFeedback(false);
                setIsCorrect(null);
                setShowExplanation(false);

                // Scroll to top of the question
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } else {
                throw new Error('Question not found');
            }
        } catch (error) {
            console.error('Error loading favorite question:', error);
            showMessage('Failed to load saved question', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Add checkForNewBadges function
    const checkForNewBadges = async (uid: string) => {
        try {
            const response = await fetch(`${HOST_URL}/api/badges/check/${uid}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();

            if (data.status === "OK" && data.new_badges && data.new_badges.length > 0) {
                // Show badges in sequence with a delay between each
                data.new_badges.forEach((badge: { name: string; rules: string; image: string }, index: number) => {
                    setTimeout(() => {
                        setNewBadge({
                            name: badge.name,
                            description: badge.rules,
                            image: badge.image
                        });
                        setIsBadgeModalVisible(true);
                    }, 10000 + (index * 5000)); // Show each badge 5 seconds after the previous one
                });
            }
        } catch (error) {
            console.error('Error checking badges:', error);
        }
    };

    // Add fetchNotes function
    const fetchNotes = async () => {
        if (!user?.uid || !subjectName) return;

        try {
            const response = await fetch(
                `${API_BASE_URL}/notes?uid=${user.uid}&subject_name=${subjectName}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch notes');
            }

            const data = await response.json();
            if (data.status === "OK") {
                // Flatten the notes array and remove duplicates
                const uniqueNotes = data.notes.reduce((acc: Note[], note: Note) => {
                    // Check if we already have this note
                    if (!acc.find(n => n.id === note.id)) {
                        acc.push(note);
                    }
                    return acc;
                }, []);

                // Sort notes by creation date (newest first)
                uniqueNotes.sort((a: Note, b: Note) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );

                setNotes(uniqueNotes);
            }
        } catch (error) {
            console.error('Error fetching notes:', error);
            showMessage('Failed to load notes', 'error');
        }
    };

    // Add createNote function
    const createNote = async () => {
        if (!user?.uid || !subjectName || !newNoteText.trim()) return;

        try {
            setIsCreatingNote(true);
            const response = await fetch(`${API_BASE_URL}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: user.uid,
                    text: newNoteText,
                    subject_name: subjectName
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create note');
            }

            const data = await response.json();
            if (data.status === "OK") {
                setNotes(prevNotes => [...prevNotes, data.note]);
                setNewNoteText('');
            }
        } catch (error) {
            console.error('Error creating note:', error);
            showMessage('Failed to create note', 'error');
        } finally {
            setIsCreatingNote(false);
        }
    };

    // Add useEffect to fetch notes when component mounts and when subject changes
    useEffect(() => {
        if (user?.uid && subjectName) {
            fetchNotes();
        }
    }, [user?.uid, subjectName]);

    // Add createTodo function
    const createTodo = async () => {
        if (!user?.uid || !subjectName || !newTodoText.trim() || !todoDueDate) return;

        try {
            const response = await fetch(`${HOST_URL}/api/todos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    learnerUid: user.uid,
                    title: newTodoText,
                    subjectName: subjectName,
                    dueDate: todoDueDate
                })
            });

            if (response.ok) {
                const data = await response.json();
                const newTodo: Todo = {
                    id: data.todo.id,
                    title: data.todo.title,
                    completed: data.todo.status === 'completed',
                    created_at: data.todo.created_at,
                    due_date: new Date(data.todo.due_date).toISOString().split('T')[0]
                };
                setTodos(prevTodos => [...prevTodos, newTodo]);
                setNewTodoText('');
                setTodoDueDate('');
            }
        } catch (error) {
            console.error('Error creating todo:', error);
            showMessage('Failed to create todo', 'error');
        }
    };

    // Add updateTodo function
    const updateTodo = async (todoId: number, updates: {
        title?: string;
        dueDate?: string;
        status?: 'pending' | 'completed';
    }) => {
        if (!user?.uid) return;

        try {
            const response = await fetch(`${HOST_URL}/api/todos/${todoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    learnerUid: user.uid,
                    ...updates
                })
            });

            if (response.ok) {
                setTodos(prevTodos => prevTodos.map(todo =>
                    todo.id === todoId ? {
                        ...todo,
                        title: updates.title || todo.title,
                        completed: updates.status === 'completed',
                        due_date: updates.dueDate || todo.due_date
                    } : todo
                ));
            }
        } catch (error) {
            console.error('Error updating todo:', error);
            showMessage('Failed to update todo', 'error');
        }
    };

    // Update toggleTodoStatus function to use updateTodo
    const toggleTodoStatus = async (todoId: number) => {
        const todo = todos.find(t => t.id === todoId);
        if (!todo) return;

        await updateTodo(todoId, {
            status: todo.completed ? 'pending' : 'completed'
        });
    };

    // Add deleteTodo function
    const deleteTodo = async (todoId: number) => {
        if (!user?.uid) return;

        try {
            const response = await fetch(`${HOST_URL}/api/todos/${todoId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    learnerUid: user.uid
                })
            });

            if (response.ok) {
                setTodos(prevTodos => prevTodos.filter(todo => todo.id !== todoId));
                setTodoToDelete(null);
            }
        } catch (error) {
            console.error('Error deleting todo:', error);
            showMessage('Failed to delete task', 'error');
        }
    };

    // Add useEffect to fetch todos when component mounts and when subject changes
    useEffect(() => {
        if (user?.uid && subjectName) {
            fetchNotes();
        }
    }, [user?.uid, subjectName]);

    // Add deleteNote function
    const deleteNote = async (noteId: number) => {
        if (!user?.uid) return;

        try {
            const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    learnerUid: user.uid
                })
            });

            if (response.ok) {
                setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
            }
        } catch (error) {
            console.error('Error deleting note:', error);
            showMessage('Failed to delete note', 'error');
        }
    };

    // Add fetchTodos function
    const fetchTodos = async () => {
        if (!user?.uid || !subjectName) return;

        try {
            const response = await fetch(`${HOST_URL}/api/todos?learnerUid=${user.uid}&subjectName=${subjectName}`);
            if (response.ok) {
                const data = await response.json();
                const mappedTodos: Todo[] = data.map((todo: any) => ({
                    id: todo.id,
                    title: todo.title,
                    completed: todo.status === 'completed',
                    created_at: todo.created_at,
                    due_date: todo.due_date ? new Date(todo.due_date).toISOString().split('T')[0] : undefined
                }));

                // Sort todos by due date
                mappedTodos.sort((a, b) => {
                    if (!a.due_date && !b.due_date) return 0;
                    if (!a.due_date) return 1;
                    if (!b.due_date) return -1;
                    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                });

                setTodos(mappedTodos);
            }
        } catch (error) {
            console.error('Error fetching todos:', error);
            showMessage('Failed to fetch todos', 'error');
        }
    };

    // Update useEffect to fetch todos when component mounts and when user changes
    useEffect(() => {
        if (user?.uid) {
            fetchTodos();
        }
    }, [user?.uid]);

    // Add updateNote function
    const updateNote = async (noteId: number, newText: string) => {
        if (!user?.uid) return;

        try {
            const response = await fetch(`${API_BASE_URL}/notes/${noteId}/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: user.uid,
                    text: newText,
                    subject_name: subjectName
                })
            });

            if (response.ok) {
                setNotes(prevNotes => prevNotes.map(note =>
                    note.id === noteId ? { ...note, text: newText } : note
                ));
                setNoteToEdit(null);
                setEditNoteText('');
            }
        } catch (error) {
            console.error('Error updating note:', error);
            showMessage('Failed to update note', 'error');
        }
    };

    // Add useEffect to fetch notes when component mounts and when subject changes
    useEffect(() => {
        if (user?.uid && subjectName) {
            fetchNotes();
        }
    }, [user?.uid, subjectName]);



    // Add useEffect to fetch todos when component mounts and when subject changes
    useEffect(() => {
        if (user?.uid && subjectName) {
            fetchNotes();
        }
    }, [user?.uid, subjectName]);





    // Update useEffect to fetch todos when component mounts and when user changes
    useEffect(() => {
        if (user?.uid) {
            fetchTodos();
        }
    }, [user?.uid]);

    const [editingTodo, setEditingTodo] = useState<{ id: number, title: string, due_date: string } | null>(null);

    const handleEditTodo = (todo: Todo) => {
        setEditingTodo({
            id: todo.id,
            title: todo.title,
            due_date: todo.due_date || ''
        });
    };

    const handleCancelEdit = () => {
        setEditingTodo(null);
    };

    const handleUpdateTodo = async () => {
        if (!editingTodo) return;

        try {
            const response = await fetch(`${HOST_URL}/api/todos/${editingTodo.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    learnerUid: user?.uid,
                    title: editingTodo.title,
                    dueDate: editingTodo.due_date
                })
            });

            if (response.ok) {
                setTodos(prevTodos => prevTodos.map(todo =>
                    todo.id === editingTodo.id
                        ? { ...todo, title: editingTodo.title, due_date: editingTodo.due_date }
                        : todo
                ));
                setEditingTodo(null);
                showMessage('Task updated successfully', 'success');
            }
        } catch (error) {
            console.error('Error updating todo:', error);
            showMessage('Failed to update task', 'error');
        }
    };

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
                    <div className={`${isSidebarVisible ? 'block' : 'hidden'} lg:block fixed lg:static w-full lg:w-1/3 bg-[#1B1464]/90 backdrop-blur-sm p-6 flex flex-col h-screen overflow-y-auto z-40`}>
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

                        <div className="bg-white/10 rounded-xl p-6">
                            <h2 className="text-xl font-bold text-white mb-6 text-center">Choose Your Learning Mode</h2>

                            {/* Learning Type Selection */}
                            <div className="mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => {
                                            setSelectedLearningType('quiz')
                                            setSelectedPaper('')
                                        }}
                                        className={`relative text-white rounded-xl p-4 transition-all duration-200 ${selectedLearningType === 'quiz'
                                            ? 'bg-purple-600 shadow-lg shadow-purple-500/50 scale-105 border-2 border-white/50'
                                            : 'bg-purple-600/50 hover:bg-purple-600/70'
                                            }`}
                                    >
                                        {selectedLearningType === 'quiz' && (
                                            <div className="absolute -top-2 -right-2 bg-white rounded-full p-1">
                                                <span className="text-purple-600 text-sm">✓</span>
                                            </div>
                                        )}
                                        <div className="flex flex-col items-center">
                                            <span className="text-2xl mb-1">🎯</span>
                                            <span className="font-semibold">Quiz Mode</span>
                                            <span className="text-sm text-white/80 mt-1">Test your knowledge</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedLearningType('quick_lessons')
                                            setSelectedPaper('')
                                        }}
                                        className={`relative text-white rounded-xl p-4 transition-all duration-200 ${selectedLearningType === 'quick_lessons'
                                            ? 'bg-orange-500 shadow-lg shadow-orange-500/50 scale-105 border-2 border-white/50'
                                            : 'bg-orange-500/50 hover:bg-orange-500/70'
                                            }`}
                                    >
                                        {selectedLearningType === 'quick_lessons' && (
                                            <div className="absolute -top-2 -right-2 bg-white rounded-full p-1">
                                                <span className="text-orange-500 text-sm">✓</span>
                                            </div>
                                        )}
                                        <div className="flex flex-col items-center">
                                            <span className="text-2xl mb-1">📚</span>
                                            <span className="font-semibold">Quick Lessons</span>
                                            <span className="text-sm text-white/80 mt-1">AI generated lessons</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Paper Selection */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Choose Paper</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => startQuizLesson('P1')}
                                        className={`relative text-white rounded-xl p-4 transition-all duration-200 ${selectedPaper === 'P1'
                                            ? 'bg-blue-600 shadow-lg shadow-blue-500/50 scale-105 border-2 border-white/50'
                                            : 'bg-blue-600/50 hover:bg-blue-600/70'
                                            }`}
                                    >
                                        {selectedPaper === 'P1' && (
                                            <div className="absolute -top-2 -right-2 bg-white rounded-full p-1">
                                                <span className="text-blue-600 text-sm">✓</span>
                                            </div>
                                        )}
                                        <div className="flex flex-col items-center">
                                            <span className="text-2xl mb-1">📝</span>
                                            <span className="font-semibold">Paper 1</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => startQuizLesson('P2')}
                                        disabled={subjectName?.toLowerCase().includes('life orientation') || subjectName?.toLowerCase().includes('tourism')}
                                        className={`relative text-white rounded-xl p-4 transition-all duration-200 ${selectedPaper === 'P2'
                                            ? 'bg-green-600 shadow-lg shadow-green-500/50 scale-105 border-2 border-white/50'
                                            : 'bg-green-600/50 hover:bg-green-600/70'
                                            } ${(subjectName?.toLowerCase().includes('life orientation') || subjectName?.toLowerCase().includes('tourism')) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {selectedPaper === 'P2' && (
                                            <div className="absolute -top-2 -right-2 bg-white rounded-full p-1">
                                                <span className="text-green-600 text-sm">✓</span>
                                            </div>
                                        )}
                                        <div className="flex flex-col items-center">
                                            <span className="text-2xl mb-1">📖</span>
                                            <span className="font-semibold">Paper 2</span>
                                            {(subjectName?.toLowerCase().includes('life orientation') || subjectName?.toLowerCase().includes('tourism')) && (
                                                <span className="text-xs text-white/60 mt-1">Not Available</span>
                                            )}
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>



                        {/* Favorites Section */}
                        <div className="bg-white/10 rounded-xl p-6 flex-1 flex flex-col mt-6">
                            <div className="flex items-center justify-center gap-2 mb-4 relative">
                                <span className="text-2xl">⭐</span>
                                <h2 className="text-xl font-bold text-white">My Collection</h2>
                                {isFavoritesLoading && (
                                    <div className="absolute right-0 animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                                )}
                            </div>

                            {/* Tab Buttons */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setActiveTab('todo')}
                                    className={`flex-1 py-2 px-4 rounded-lg text-center transition-colors ${activeTab === 'todo'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                                        }`}
                                >
                                    To Do
                                </button>
                                <button
                                    onClick={() => setActiveTab('favorites')}
                                    className={`flex-1 py-2 px-4 rounded-lg text-center transition-colors ${activeTab === 'favorites'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                                        }`}
                                >
                                    Favorites
                                </button>
                                <button
                                    onClick={() => setActiveTab('notes')}
                                    className={`flex-1 py-2 px-4 rounded-lg text-center transition-colors ${activeTab === 'notes'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                                        }`}
                                >
                                    Notes
                                </button>
                            </div>

                            <div className="flex-1 min-h-[200px]">
                                {activeTab === 'favorites' ? (
                                    favoriteQuestions.length > 0 ? (
                                        <div className="space-y-3">
                                            {favoriteQuestions.map((fav, index) => {
                                                const colors = [
                                                    'bg-yellow-200',
                                                    'bg-pink-200',
                                                    'bg-blue-200',
                                                    'bg-green-200',
                                                    'bg-purple-200',
                                                    'bg-orange-200'
                                                ];
                                                const color = colors[index % colors.length];
                                                return (
                                                    <div
                                                        key={fav.id}
                                                        className={`${color} p-4 rounded-lg shadow-lg transform transition-transform hover:scale-105 relative group`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                                                                <span className="text-gray-600 text-sm">⭐</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-gray-800 text-sm font-medium mb-2 whitespace-pre-wrap pr-16">
                                                                    {fav.question}
                                                                </p>
                                                                <p className="text-gray-600 text-xs">
                                                                    {new Date(fav.createdAt.date).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/50 rounded-lg p-1">
                                                                <button
                                                                    onClick={() => loadSpecificQuestion(fav.questionId)}
                                                                    className="p-1 hover:bg-black/10 rounded"
                                                                >
                                                                    <span className="text-gray-600">▶️</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUnfavoriteQuestion(fav.id)}
                                                                    className="p-1 hover:bg-black/10 rounded"
                                                                >
                                                                    <span className="text-gray-600">✕</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="text-4xl mb-2">⭐</div>
                                                <p className="text-white/60 text-sm">
                                                    No saved questions yet
                                                </p>
                                            </div>
                                        </div>
                                    )
                                ) : activeTab === 'notes' ? (
                                    <div className="space-y-4">
                                        {/* Add Note Button */}
                                        <button
                                            onClick={() => setShowNoteForm(!showNoteForm)}
                                            className="w-full p-3 bg-white/5 rounded-lg flex items-center justify-center gap-2 text-white hover:bg-white/10 transition-colors"
                                        >
                                            <span className="text-xl">+</span>
                                            <span>Add New Note</span>
                                        </button>

                                        {/* Add Note Form - Only show when showNoteForm is true */}
                                        {showNoteForm && (
                                            <div className="bg-white/5 rounded-lg p-4">
                                                <textarea
                                                    value={newNoteText}
                                                    onChange={(e) => setNewNoteText(e.target.value)}
                                                    placeholder="Write your note here..."
                                                    className="w-full bg-transparent text-white placeholder-white/50 border border-white/10 rounded-lg p-3 mb-3 focus:outline-none focus:border-white/20"
                                                    rows={2}
                                                />
                                                <button
                                                    onClick={createNote}
                                                    disabled={isCreatingNote || !newNoteText.trim()}
                                                    className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isCreatingNote ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                            <span>Creating...</span>
                                                        </div>
                                                    ) : (
                                                        'Add Note'
                                                    )}
                                                </button>
                                            </div>
                                        )}

                                        {/* Notes List */}
                                        {notes.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-4">
                                                {notes.map((note, index) => {
                                                    // Define different colors for sticky notes
                                                    const colors = [
                                                        'bg-yellow-200',
                                                        'bg-pink-200',
                                                        'bg-blue-200',
                                                        'bg-green-200',
                                                        'bg-purple-200',
                                                        'bg-orange-200'
                                                    ];
                                                    const color = colors[index % colors.length];

                                                    return (
                                                        <div
                                                            key={note.id}
                                                            className={`${color} p-4 rounded-lg shadow-lg transform transition-transform hover:scale-105 relative group`}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                                                                    <span className="text-gray-600 text-sm">📝</span>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    {noteToEdit?.id === note.id ? (
                                                                        <div className="space-y-2">
                                                                            <textarea
                                                                                value={editNoteText}
                                                                                onChange={(e) => setEditNoteText(e.target.value)}
                                                                                className="w-full bg-white/50 text-gray-800 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                rows={3}
                                                                            />
                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    onClick={() => updateNote(note.id, editNoteText)}
                                                                                    disabled={isEditingNote || !editNoteText.trim()}
                                                                                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                                                                >
                                                                                    {isEditingNote ? 'Saving...' : 'Save'}
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setNoteToEdit(null);
                                                                                        setEditNoteText('');
                                                                                    }}
                                                                                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <p className="text-gray-800 text-sm font-medium mb-2 whitespace-pre-wrap pr-16">
                                                                                {note.text}
                                                                            </p>
                                                                            <p className="text-gray-500 text-xs">
                                                                                {new Date(note.created_at).toLocaleDateString()}
                                                                            </p>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                {!noteToEdit?.id && (
                                                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/50 rounded-lg p-1">
                                                                        <button
                                                                            onClick={() => {
                                                                                setNoteToEdit(note);
                                                                                setEditNoteText(note.text);
                                                                            }}
                                                                            className="p-1 hover:bg-black/10 rounded"
                                                                        >
                                                                            <span className="text-gray-600">✏️</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setNoteToDelete(note.id)}
                                                                            className="p-1 hover:bg-black/10 rounded"
                                                                        >
                                                                            <span className="text-gray-600">✕</span>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="text-4xl mb-2">📝</div>
                                                    <p className="text-white/60 text-sm">
                                                        No notes yet. Add your first note!
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Add To Do Button */}
                                        <button
                                            onClick={() => setShowTodoForm(!showTodoForm)}
                                            className="w-full p-3 bg-white/5 rounded-lg flex items-center justify-center gap-2 text-white hover:bg-white/10 transition-colors"
                                        >
                                            <span className="text-xl">+</span>
                                            <span>Add New Task</span>
                                        </button>

                                        {/* Add To Do Form - Only show when showTodoForm is true */}
                                        {showTodoForm && (
                                            <div className="bg-white/5 rounded-lg p-4">
                                                <textarea
                                                    value={newTodoText}
                                                    onChange={(e) => setNewTodoText(e.target.value)}
                                                    placeholder="Write your task here..."
                                                    className="w-full bg-transparent text-white placeholder-white/50 border border-white/10 rounded-lg p-3 mb-3 focus:outline-none focus:border-white/20"
                                                    rows={3}
                                                />

                                                <div className="mb-3">
                                                    <label className="block text-white/70 text-sm mb-1">Due Date *</label>
                                                    <div className="relative">
                                                        <input
                                                            type="date"
                                                            value={todoDueDate}
                                                            onChange={(e) => setTodoDueDate(e.target.value)}
                                                            className="w-full bg-transparent text-white border border-white/10 rounded-lg p-2 pr-10 focus:outline-none focus:border-white/20 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                                            required
                                                            min={new Date().toISOString().split('T')[0]}
                                                        />
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/70">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={createTodo}
                                                    disabled={isCreatingTodo || !newTodoText.trim() || !todoDueDate}
                                                    className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isCreatingTodo ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                            <span>Creating...</span>
                                                        </div>
                                                    ) : (
                                                        'Add Task'
                                                    )}
                                                </button>
                                            </div>
                                        )}

                                        {/* To Do List */}
                                        {todos.length > 0 ? (
                                            <div className="space-y-3">
                                                {todos.map((todo, index) => {
                                                    // Define different colors for todos
                                                    const colors = [
                                                        'bg-yellow-200',
                                                        'bg-pink-200',
                                                        'bg-blue-200',
                                                        'bg-green-200',
                                                        'bg-purple-200',
                                                        'bg-orange-200'
                                                    ];
                                                    const color = colors[index % colors.length];

                                                    return (
                                                        <div
                                                            key={todo.id}
                                                            className={`rounded-lg p-4 flex items-start gap-3 shadow-lg transform transition-transform hover:scale-105 ${todo.completed ? `${color} opacity-60` :
                                                                todo.due_date ? (() => {
                                                                    const dueDate = new Date(todo.due_date);
                                                                    const today = new Date();
                                                                    today.setHours(0, 0, 0, 0);
                                                                    dueDate.setHours(0, 0, 0, 0);
                                                                    const diffTime = dueDate.getTime() - today.getTime();
                                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                                    if (diffDays <= 3) return `${color} border-2 border-red-400`;
                                                                    if (diffDays <= 7) return `${color} border-2 border-amber-400`;
                                                                    return color;
                                                                })() : color
                                                                }`}
                                                        >
                                                            <button
                                                                onClick={() => toggleTodoStatus(todo.id)}
                                                                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${todo.completed
                                                                    ? 'border-green-600 bg-green-600/20'
                                                                    : 'border-gray-600'
                                                                    }`}
                                                            >
                                                                {todo.completed && (
                                                                    <span className="text-green-600">✓</span>
                                                                )}
                                                            </button>
                                                            <div className="flex-1 min-w-0">
                                                                {editingTodo?.id === todo.id ? (
                                                                    <div className="space-y-2">
                                                                        <textarea
                                                                            value={editingTodo.title}
                                                                            onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })}
                                                                            className="w-full bg-white/50 text-gray-800 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                            rows={3}
                                                                            placeholder="Update your task here..."
                                                                        />
                                                                        <div className="relative">
                                                                            <input
                                                                                type="date"
                                                                                value={editingTodo.due_date}
                                                                                onChange={(e) => setEditingTodo({ ...editingTodo, due_date: e.target.value })}
                                                                                className="w-full bg-white/50 text-gray-800 border border-gray-300 rounded-lg p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                min={new Date().toISOString().split('T')[0]}
                                                                            />
                                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
                                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                                </svg>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={handleUpdateTodo}
                                                                                disabled={!editingTodo.title.trim()}
                                                                                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                                            >
                                                                                Save
                                                                            </button>
                                                                            <button
                                                                                onClick={handleCancelEdit}
                                                                                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <p className={`text-gray-800 text-sm font-medium whitespace-pre-wrap ${todo.completed ? 'line-through opacity-60' : ''}`}>
                                                                            {todo.title}
                                                                        </p>
                                                                        {todo.due_date && (
                                                                            <p className={`text-sm mt-1 ${todo.completed ? 'text-gray-500' :
                                                                                (() => {
                                                                                    const dueDate = new Date(todo.due_date);
                                                                                    const today = new Date();
                                                                                    today.setHours(0, 0, 0, 0);
                                                                                    dueDate.setHours(0, 0, 0, 0);
                                                                                    const diffTime = dueDate.getTime() - today.getTime();
                                                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                                                    if (diffDays <= 3) return 'text-red-600 font-medium';
                                                                                    if (diffDays <= 7) return 'text-amber-600 font-medium';
                                                                                    return 'text-gray-600';
                                                                                })()
                                                                                }`}>
                                                                                Due: {todo.due_date}
                                                                            </p>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {!editingTodo && (
                                                                    <button
                                                                        onClick={() => handleEditTodo(todo)}
                                                                        className="text-gray-600 hover:text-gray-800 transition-colors"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                        </svg>
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => setTodoToDelete(todo.id)}
                                                                    className="text-gray-600 hover:text-gray-800 transition-colors"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="text-4xl mb-2">📋</div>
                                                    <p className="text-white/60 text-sm">
                                                        No tasks yet. Add your first task!
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>



                    </div>

                    {/* Right Panel - Quiz Content */}
                    <div className={`flex-1 p-3 mt-6 lg:p-6 min-h-screen ${isSidebarVisible ? 'hidden lg:block' : 'block'}`}>
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
                        ) : !selectedPaper ? (
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
                            <div className="max-w-3xl mx-auto">
                                {/* Question Card */}
                                {currentQuestion && (
                                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-0 lg:p-6 mb-8 mt-12 lg:mt-0">
                                        {/* Question Metadata */}
                                        {/* Stats Card */}
                                        {selectedLearningType === 'quiz' && (
                                            <div className="bg-white rounded-xl p-6 mb-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h2 className="text-black text-xl font-bold flex items-center gap-2">
                                                        {selectedPaper === 'P1' ? 'Paper 1' : selectedPaper === 'P2' ? 'Paper 2' : ''} Scoreboard! <span>🏆</span>
                                                    </h2>
                                                    <button className="text-2xl"
                                                        onClick={() => setIsRestartModalVisible(true)}
                                                    >🔄</button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-gray-50 rounded-xl p-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-2xl">🎯</span>
                                                            <div>
                                                                <div className="text-2xl font-bold text-black">{stats?.correct_answers || 0}</div>
                                                                <div className="text-gray-500">Bullseyes</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-gray-50 rounded-xl p-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-2xl">💥</span>
                                                            <div>
                                                                <div className="text-2xl font-bold text-black">{stats?.incorrect_answers || 0}</div>
                                                                <div className="text-gray-500">Oopsies</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-gray-600 text-sm">Progress</span>
                                                        <span className="text-gray-600 text-sm">{Math.round(stats?.correct_percentage || 0)}% GOAT 🐐</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div
                                                            className="bg-gradient-to-r from-[#00B894] to-[#00D1A3] h-2.5 rounded-full transition-all duration-500"
                                                            style={{ width: `${Math.min(Math.round(stats?.correct_percentage || 0), 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}


                                        <div className="flex flex-wrap gap-3 mb-4 text-sm p-6">
                                            <div className="bg-white/10 px-3 py-1.5 rounded-full text-white/80 flex items-center gap-1.5">
                                                <span className="text-xs">📅</span>
                                                <span>Term {currentQuestion.term}</span>
                                            </div>
                                            <div className="bg-white/10 px-3 py-1.5 rounded-full text-white/80 flex items-center gap-1.5">
                                                <span className="text-xs">📅</span>
                                                <span>{currentQuestion.year}</span>
                                            </div>
                                            <div className="bg-white/10 px-3 py-1.5 rounded-full text-white/80 flex items-center gap-1.5">
                                                <span className="text-xs">📚</span>
                                                <span>{currentQuestion.curriculum}</span>
                                            </div>
                                            {currentQuestion && (
                                                <button
                                                    onClick={isCurrentQuestionFavorited ? () => handleUnfavoriteQuestion(currentQuestion?.id?.toString() || '') : handleFavoriteQuestion}
                                                    disabled={isFavoriting}
                                                    className={`bg-white/10 px-3 py-1.5 rounded-full text-white/80 flex items-center gap-1.5 transition-colors ${isCurrentQuestionFavorited
                                                        ? 'text-yellow-400 hover:text-yellow-500'
                                                        : 'text-white/80 hover:text-white'
                                                        }`}
                                                    aria-label={isCurrentQuestionFavorited ? "Remove from favorites" : "Add to favorites"}
                                                >
                                                    {isFavoriting ? (
                                                        <div className="w-4 h-4 flex items-center justify-center">
                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs">⭐</span>
                                                    )}
                                                    <span>{isCurrentQuestionFavorited ? 'Favorited' : 'Add to Favorites'}</span>
                                                </button>
                                            )}
                                        </div>

                                        {/* Question Context - Only show for quiz mode */}
                                        {selectedLearningType === 'quiz' && (currentQuestion.context || currentQuestion.image_path) && (
                                            <div className="mb-4">

                                                {currentQuestion.context && (
                                                    <>
                                                        <h3 className="text-lg font-semibold mb-2 text-white">Context</h3>
                                                        <div className="p-4 bg-white/5 rounded-lg">
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
                                                {currentQuestion.image_path && currentQuestion.image_path !== 'NULL' && (
                                                    <div className="mt-4 flex justify-center">
                                                        <button
                                                            onClick={() => {
                                                                setZoomImageUrl(currentQuestion.image_path || null)
                                                                setIsZoomModalVisible(true)
                                                            }}
                                                            className="w-full max-w-2xl"
                                                        >
                                                            <Image
                                                                src={`${IMAGE_BASE_URL}${currentQuestion.image_path}`}
                                                                alt="Context Image"
                                                                width={400}
                                                                height={300}
                                                                className="rounded-lg mx-auto"
                                                                onLoad={() => setIsImageLoading(false)}
                                                            />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Question - Only show for quiz mode */}
                                        {selectedLearningType === 'quiz' && (
                                            <div className="mb-6">
                                                {currentQuestion.question && (
                                                    <>
                                                        <h3 className="text-lg font-semibold mb-2 text-white text-center">Question</h3>
                                                        <div className="text-xl mb-2 text-white text-center">
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
                                                    <div className="mt-4 flex justify-center">
                                                        <button
                                                            onClick={() => {
                                                                setZoomImageUrl(currentQuestion.question_image_path || null)
                                                                setIsZoomModalVisible(true)
                                                            }}
                                                            className="w-full max-w-2xl"
                                                        >
                                                            <Image
                                                                src={`${IMAGE_BASE_URL}${currentQuestion.question_image_path}`}
                                                                alt="Question Image"
                                                                width={400}
                                                                height={300}
                                                                className="rounded-lg mx-auto"
                                                                onLoad={() => setIsImageLoading(false)}
                                                            />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* AI Explanation for Quick Lessons */}
                                        {selectedLearningType === 'quick_lessons' && currentQuestion.ai_explanation && (
                                            <div className="mt-8">
                                                <div className="p-3 lg:p-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                                                    {/* Context */}
                                                    {currentQuestion.context && (
                                                        <div className="mb-6">
                                                            <h3 className="text-lg font-semibold mb-2 text-white">Context</h3>
                                                            <div className="p-4 bg-white/5 rounded-lg">
                                                                {renderMixedContent(currentQuestion.context, true)}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Context Image */}
                                                    {currentQuestion.image_path && currentQuestion.image_path !== 'NULL' && (
                                                        <div className="mb-6 flex justify-center">
                                                            <button
                                                                onClick={() => {
                                                                    setZoomImageUrl(currentQuestion.image_path || null)
                                                                    setIsZoomModalVisible(true)
                                                                }}
                                                                className="w-full max-w-2xl"
                                                            >
                                                                <Image
                                                                    src={`${IMAGE_BASE_URL}${currentQuestion.image_path}`}
                                                                    alt="Context Image"
                                                                    width={400}
                                                                    height={300}
                                                                    className="rounded-lg mx-auto"
                                                                    onLoad={() => setIsImageLoading(false)}
                                                                />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Question */}
                                                    <div className="mb-6">
                                                        <h3 className="text-lg font-semibold mb-2 text-white">Question</h3>
                                                        <div className="p-4 bg-white/5 rounded-lg">
                                                            {renderMixedContent(currentQuestion.question, true)}
                                                        </div>
                                                    </div>

                                                    {/* Question Image */}
                                                    {currentQuestion.question_image_path && currentQuestion.question_image_path !== 'NULL' && (
                                                        <div className="mb-6 flex justify-center">
                                                            <button
                                                                onClick={() => {
                                                                    setZoomImageUrl(currentQuestion.question_image_path || null)
                                                                    setIsZoomModalVisible(true)
                                                                }}
                                                                className="w-full max-w-2xl"
                                                            >
                                                                <Image
                                                                    src={`${IMAGE_BASE_URL}${currentQuestion.question_image_path}`}
                                                                    alt="Question Image"
                                                                    width={400}
                                                                    height={300}
                                                                    className="rounded-lg mx-auto"
                                                                    onLoad={() => setIsImageLoading(false)}
                                                                />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* AI Explanation */}
                                                    <div className="mt-8">
                                                        <div className="text-gray-200 space-y-4">
                                                            {currentQuestion.ai_explanation?.split('\n').map((line, index) => {

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
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Options - Only show for quiz mode */}
                                        {selectedLearningType === 'quiz' && (
                                            <div className="space-y-4">
                                                {Object.entries(currentQuestion.options).map(([key, value]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => handleAnswer(value)}
                                                        disabled={isAnswered}
                                                        className={`w-full p-4 rounded-lg text-center transition-all border ${selectedAnswer === value
                                                            ? isCorrect
                                                                ? 'bg-green-500/20 text-green-100 border-green-500/50'
                                                                : 'bg-red-500/20 text-red-100 border-red-500/50'
                                                            : cleanAnswer(value) === cleanAnswer(correctAnswer) && showExplanation
                                                                ? 'bg-green-500/20 text-green-100 border-green-500/50'
                                                                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                                                            } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                                                    >
                                                        {renderMixedContent(value, true)}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Report Issue Button - Show for both quiz and quick lessons */}
                                        <div className="flex gap-4 mt-4">
                                            <button
                                                onClick={reportIssue}
                                                className="flex-1 p-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors text-left"
                                            >
                                                <span className="text-red-300 font-medium">
                                                    🛑 Report an Issue with this {selectedLearningType === 'quiz' ? 'Question' : 'Lesson'}
                                                </span>
                                            </button>
                                            {learnerRole === 'admin' && (
                                                <button
                                                    onClick={async () => {
                                                        if (!user?.uid || !user?.email || !currentQuestion) return;
                                                        try {
                                                            await setQuestionStatus({
                                                                question_id: currentQuestion.id,
                                                                status: 'approved',
                                                                email: user.email,
                                                                uid: user.uid,
                                                                comment: 'Question approved by admin'
                                                            });
                                                            showMessage('Question approved successfully', 'success');
                                                        } catch (error) {
                                                            console.error('Error approving question:', error);
                                                            showMessage('Failed to approve question', 'error');
                                                        }
                                                    }}
                                                    className="flex-1 p-4 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors text-left"
                                                >
                                                    <span className="text-green-300 font-medium">
                                                        ✅ Approve this {selectedLearningType === 'quiz' ? 'Question' : 'Lesson'}
                                                    </span>
                                                </button>
                                            )}
                                        </div>

                                        {/* Explanation - Only show for quiz mode */}
                                        {selectedLearningType === 'quiz' && showExplanation && (
                                            <div className="mt-8">
                                                <div className={`p-6 rounded-lg ${isCorrect ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                                                    <p className="font-bold mb-4 text-white text-lg">
                                                        {isCorrect ? getRandomSuccessMessage() : getRandomWrongMessage()}
                                                    </p>

                                                    {/* Correct Answer Display */}
                                                    <div className="mb-6 bg-white/5 p-4 rounded-lg">
                                                        <p className="text-white font-semibold mb-2">✅ Correct Answer:</p>
                                                        <div className="text-green-200">
                                                            {renderMixedContent(correctAnswer, true)}
                                                        </div>
                                                    </div>

                                                    {/* Explanation Display */}
                                                    {currentQuestion?.explanation && currentQuestion.explanation.trim() !== '' && (
                                                        <div className="mb-6 bg-white/5 p-4 rounded-lg">
                                                            <p className="text-white font-semibold mb-2">📝 Explanation:</p>
                                                            <div className="text-gray-200">
                                                                {currentQuestion.explanation?.split('\n').map((line, index) => {

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
                                                        </div>
                                                    )}

                                                    {/* AI Explanation Button */}
                                                    <button
                                                        onClick={() => fetchAIExplanation(currentQuestion.id)}
                                                        disabled={isLoadingExplanation}
                                                        className="w-full p-4 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        {isLoadingExplanation ? (
                                                            <>
                                                                <span className="text-white">🤖 Pretending to think...</span>
                                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                                                            </>
                                                        ) : (
                                                            <span className="text-white">🤖 Break it Down for Me!</span>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Next Question Button */}
                                {currentQuestion && !isFromFavorites && (
                                    <div className="flex justify-center mb-8">
                                        <button
                                            onClick={handleNext}
                                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full py-4 px-8 flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
                                        >
                                            <span className="text-xl">▶</span>
                                            <span className="font-semibold">🎯 {selectedLearningType === 'quick_lessons' ? 'Next Lesson' : 'Next Question'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Overlay for smaller screens when sidebar is visible */}
                {isSidebarVisible && (
                    <div
                        className="lg:hidden fixed inset-0 bg-black/50 z-30"
                        onClick={() => setIsSidebarVisible(false)}
                    />
                )}

                {/* Image Zoom Modal */}
                {isZoomModalVisible && zoomImageUrl && (
                    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
                        <button
                            onClick={() => {
                                setIsZoomModalVisible(false)
                                setImageRotation(0)
                            }}
                            className="absolute top-4 right-4 text-white"
                        >
                            ✕
                        </button>
                        <button
                            onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
                            className="absolute top-4 left-4 text-white"
                        >
                            ↻
                        </button>
                        <div style={{ transform: `rotate(${imageRotation}deg)` }}>
                            <Image
                                src={`${IMAGE_BASE_URL}${zoomImageUrl}`}
                                alt="Zoomed Image"
                                width={800}
                                height={600}
                                className="rounded-lg"
                            />
                        </div>
                    </div>
                )}

                {/* Report Issue Modal */}
                {isReportModalVisible && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl p-6 max-w-lg w-full">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Report an Issue</h2>
                            <textarea
                                value={reportComment}
                                onChange={(e) => setReportComment(e.target.value)}
                                placeholder="Please describe the issue..."
                                className="w-full h-32 p-3 border rounded-lg text-gray-900 mb-4"
                                disabled={isSubmitting}
                            />
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsReportModalVisible(false)}
                                    className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitReport}
                                    className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Thank You Modal */}
                {isThankYouModalVisible && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center">
                            {/* Green Checkmark Circle */}
                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            {/* Title with Emojis */}
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
                                <span>🎉</span>
                                You&apos;re Awesome!
                                <span>👋</span>
                            </h2>

                            {/* Message */}
                            <p className="text-gray-600 mb-8 text-lg">
                                Your feedback helps us level up our questions! Thanks for making the quiz even better. 🚀💡
                            </p>

                            {/* Keep Going Button */}
                            <button
                                onClick={() => setIsThankYouModalVisible(false)}
                                className="w-full py-4 px-8 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                            >
                                Keep Going <span>🚀</span>
                            </button>
                        </div>
                    </div>
                )}


                {/* Streak Modal */}
                {showStreakModal && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-gradient-to-br from-[#1B1464] to-[#2B1F84] rounded-xl p-8 max-w-md w-full text-center relative overflow-hidden"
                        >
                            {/* Animated stars in background */}
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute"
                                    initial={{ scale: 0, rotate: 0 }}
                                    animate={{
                                        scale: [0, 1, 0],
                                        rotate: [0, 180, 360],
                                        x: [0, Math.random() * 100 - 50],
                                        y: [0, Math.random() * 100 - 50],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                    }}
                                >
                                    <Star className="w-6 h-6 text-yellow-400" />
                                </motion.div>
                            ))}

                            {/* Days of the week */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="mb-6"
                            >
                                <div className="grid grid-cols-7 gap-2 mb-4">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.3 + index * 0.1 }}
                                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto"
                                        >
                                            <span className="text-white font-medium">{day}</span>
                                        </motion.div>
                                    ))}
                                </div>
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.5, type: "spring" }}
                                    className="relative w-20 h-20 mx-auto mb-4"
                                >
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.1, 1],
                                            rotate: [0, 5, -5, 0],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                        className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                                    />
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.2, 1],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                        className="absolute inset-0 flex items-center justify-center"
                                    >
                                        <span className="text-4xl">⭐</span>
                                    </motion.div>
                                </motion.div>
                            </motion.div>

                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-3xl font-bold text-white mb-2"
                            >
                                🔥 {currentStreak}-Day Streak! 🔥
                            </motion.h2>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="text-gray-300 mb-8"
                            >
                                Keep the fire going — get 3 right answers every day to grow your streak!
                            </motion.p>
                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setShowStreakModal(false);
                                }}
                                className="w-full py-4 px-8 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                Keep Going! 🚀
                            </motion.button>
                        </motion.div>
                    </div>
                )}

                {/* AI Explanation Modal */}
                {isExplanationModalVisible && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 lg:p-6">
                        <div className="rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#1B1464]">
                            {/* Header - Fixed */}
                            <div className="flex justify-between items-center p-6 border-b border-gray-700">
                                <h2 className="text-xl font-bold text-white">🤖 AI Explanation</h2>
                                <button
                                    onClick={() => setIsExplanationModalVisible(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            {/* Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-3 lg:p-6 min-h-0">
                                <div className="prose prose-sm max-w-none prose-invert space-y-4">
                                    {aiExplanation?.split('\n').map((line, index) => {
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
                            </div>
                        </div>
                    </div>
                )}

                {/* Add MessageModal */}
                <MessageModal
                    isVisible={messageModal.isVisible}
                    message={messageModal.message}
                    type={messageModal.type}
                    onClose={() => setMessageModal(prev => ({ ...prev, isVisible: false }))}
                />

                {/* Add Restart Modal */}
                {isRestartModalVisible && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl p-6 max-w-lg w-full">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Reset Progress</h2>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to reset your progress for this paper? This action cannot be undone.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsRestartModalVisible(false)}
                                    className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRestart}
                                    className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add BadgeModal */}
                <BadgeModal
                    isVisible={isBadgeModalVisible}
                    onClose={() => setIsBadgeModalVisible(false)}
                    badge={newBadge}
                />

                {/* Delete Note Confirmation Modal */}
                {noteToDelete !== null && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl p-6 max-w-sm w-full">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Note</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete this note? This action cannot be undone.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setNoteToDelete(null)}
                                    className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (noteToDelete) {
                                            deleteNote(noteToDelete);
                                            setNoteToDelete(null);
                                        }
                                    }}
                                    className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add confirmation modal for todo deletion */}
                {todoToDelete !== null && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                            <h3 className="text-lg font-semibold mb-4">Delete Task</h3>
                            <p className="text-gray-600 mb-6">Are you sure you want to delete this task? This action cannot be undone.</p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setTodoToDelete(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => deleteTodo(todoToDelete)}
                                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
} 