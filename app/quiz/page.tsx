'use client'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Head from 'next/head'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { API_BASE_URL, getSubjectStats, getRandomQuestion, setQuestionStatus, checkAnswer } from '@/services/api'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'
import type { JSX } from 'react'
import { logAnalyticsEvent } from '@/lib/analytics'

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

interface QuestionResponse extends Question {
    status: string;
    message?: string;
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

// Add helper function
function renderMixedContent(text: string, isDark: boolean = false) {
    if (!text) return null;

    if (text.includes('$')) {
        // First split by LaTeX delimiters
        const parts = text.split(/(\$[^$]+\$)/g);

        return (
            <div className="mixed-content-container space-y-2">
                {parts.map((part, index) => {
                    if (part.startsWith('$') && part.endsWith('$')) {
                        // LaTeX content
                        return (
                            <div key={index} className={`latex-container inline-block ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                <InlineMath math={part.slice(1, -1)} />
                            </div>
                        );
                    } else {
                        return (
                            <span key={index} className={`content-text ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {part}
                            </span>
                        );
                    }
                })}
            </div>
        );
    }

    // Split by new line
    const parts = text.split(/\n/g);

    return (
        <div className="mixed-content-container space-y-2">
            {parts.map((part, index) => {
                if (part.trim()) {
                    const needsExtraSpacing = part.trim().startsWith('***');
                    const fontSize = part.length > 500 ? 'text-sm' : 'text-lg';

                    // Handle headers
                    if (part.startsWith('# ')) {
                        return (
                            <h1 key={index} className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} ${fontSize}`}>
                                {part.substring(2).trim()}
                            </h1>
                        );
                    }
                    if (part.startsWith('## ')) {
                        return (
                            <h2 key={index} className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} ${fontSize}`}>
                                {part.substring(3).trim()}
                            </h2>
                        );
                    }
                    if (part.startsWith('### ')) {
                        return (
                            <h3 key={index} className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} ${fontSize}`}>
                                {part.substring(4).trim()}
                            </h3>
                        );
                    }

                    // Handle bullet points and regular text
                    const lines = part.split('\n').filter(line => line.trim());
                    const hasBulletPoints = lines.some(line => line.trim().startsWith('-'));

                    if (hasBulletPoints) {
                        return (
                            <div key={index} className={`bullet-list-container ${needsExtraSpacing ? 'mt-6' : ''}`}>
                                {lines.map((line, lineIndex) => {
                                    const trimmedLine = line.trim();
                                    if (trimmedLine.startsWith('-')) {
                                        const bulletContent = trimmedLine.substring(1).trim();
                                        const bulletBoldParts = bulletContent.split(/(\*\*[^*]+\*\*)/g);

                                        return (
                                            <div key={`${index}-${lineIndex}`} className="flex items-start space-x-2 mb-2">
                                                <span className={`bullet-point ${isDark ? 'text-white' : 'text-gray-900'}`}>•</span>
                                                <div className="flex-1">
                                                    {bulletBoldParts.map((bpart, bindex) => {
                                                        if (bpart.startsWith('**') && bpart.endsWith('**')) {
                                                            return (
                                                                <span
                                                                    key={`bullet-bold-${bindex}`}
                                                                    className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'} ${fontSize}`}
                                                                >
                                                                    {bpart.slice(2, -2).trim()}
                                                                </span>
                                                            );
                                                        }
                                                        return bpart ? (
                                                            <span
                                                                key={`bullet-text-${bindex}`}
                                                                className={`${isDark ? 'text-gray-300' : 'text-gray-700'} ${fontSize}`}
                                                            >
                                                                {bpart.trim()}
                                                            </span>
                                                        ) : null;
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        );
                    }

                    // Handle regular text with bold formatting
                    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
                    return (
                        <div key={index} className={`text-container ${needsExtraSpacing ? 'mt-6' : ''}`}>
                            {boldParts.map((boldPart, boldIndex) => {
                                if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
                                    return (
                                        <span
                                            key={`${index}-${boldIndex}`}
                                            className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'} ${fontSize}`}
                                        >
                                            {boldPart.slice(2, -2)}
                                        </span>
                                    );
                                }
                                return boldPart ? (
                                    <span
                                        key={`${index}-${boldIndex}`}
                                        className={`${isDark ? 'text-gray-300' : 'text-gray-700'} ${fontSize}`}
                                    >
                                        {boldPart.replace(/^\*\*\*/, '')}
                                    </span>
                                ) : null;
                            })}
                        </div>
                    );
                }
                return null;
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
    const [selectedPaper, setSelectedPaper] = useState<string>('')
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

    const loadRandomQuestion = async (paper: string) => {
        if (!user?.uid || !subjectName) {
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

        try {
            setLoading(true)
            const data = await getRandomQuestion(subjectName, paper, user.uid)
            console.log("context ", data)

            if (data.status === "NOK" && data.message === "No more questions available") {
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
                is_correct: response.correct,
                subject: currentQuestion.subject?.name,
                grade: currentQuestion.subject?.grade?.number,
                duration: duration,
                streak: response.streak,
                points: response.correct ? 1 : 0
            });

            // Play sound based on answer correctness
            playSound(response.correct)
            setCorrectAnswer(response.correctAnswer)

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
        loadRandomQuestion('P1')
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

            // TODO: Implement analytics
            console.log('Report submitted:', {
                user_id: user?.uid,
                question_id: currentQuestion?.id
            })
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
                    .replace(/\\\[/g, '$')
                    .replace(/\\\]/g, '$')
                    .replace(/\\\)\./g, '$')
                    .replace(/\\\)/g, '$')
                    .replace(/\\\\/g, '\\')
                    .replace(/\\text\{([^}]+)\}/g, '\\text{$1}')
                    .replace(/\[/g, '$')
                    .replace(/\]/g, '$')
                    .replace(/\\[[]]/g, '$')
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
        if (!user?.uid || !subjectName || !selectedPaper) return;

        try {
            setIsFavoritesLoading(true)
            const response = await fetch(
                `${API_BASE_URL}/question/favorite?uid=${user.uid}&subject_name=${subjectName} ${selectedPaper}`
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
        if (user?.uid && subjectName && selectedPaper) {
            console.log("fetching favorites")
            fetchFavoriteQuestions();
        } else {
            console.log("no user or subject name")
        }
    }, [user?.uid, subjectName, selectedPaper]);

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
                showMessage('Question added to favorites!', 'success')
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
    const handleUnfavoriteQuestion = async () => {
        if (!user?.uid || !currentQuestion) return;

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
                    question_id: currentQuestion.id
                })
            })

            if (!response.ok) {
                setIsCurrentQuestionFavorited(true)
                throw new Error('Failed to unfavorite question')
            }

            const data = await response.json()
            if (data.status === "OK") {
                showMessage('Question removed from favorites!', 'success')
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
            console.log("No user or subject name");
            return;
        }
        try {
            setLoading(true);
            // Close the sidebar on mobile when a favorite is clicked
            setIsSidebarVisible(false);

            const response = await fetch(
                `${API_BASE_URL}/question/byname?subject_name=${subjectName}&paper_name=P1&uid=${user.uid}&question_id=${questionId}`
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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#1B1464] flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Loading your question...</p>
                </div>
            </div>
        )
    }

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
                    <div className={`${isSidebarVisible ? 'block' : 'hidden'} lg:block fixed lg:static w-full lg:w-1/3 bg-[#00B894] p-6 flex flex-col h-screen overflow-y-auto z-40`}>
                        {/* Close button - Only visible on mobile */}
                        <button
                            onClick={() => setIsSidebarVisible(false)}
                            className="lg:hidden absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
                            aria-label="Close menu"
                        >
                            ✕
                        </button>

                        <div className="flex items-center gap-4 mb-6 mt-12 lg:mt-0">
                            <Image
                                src={getSubjectIcon(subjectName || '')}
                                alt={subjectName || ''}
                                width={64}
                                height={64}
                                className="rounded-full"
                            />
                            <h1 className="text-2xl font-bold text-white">{subjectName}</h1>
                        </div>

                        {/* Stats Card */}
                        {selectedPaper && (
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

                        {/* Paper Selection */}
                        <div className="bg-white/10 rounded-xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Choose Paper</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => loadRandomQuestion('P1')}
                                    className={`relative text-white rounded-xl p-4 transition-all duration-200 ${selectedPaper === 'P1'
                                        ? 'bg-purple-600 shadow-lg shadow-purple-500/50 scale-105 border-2 border-white/50'
                                        : 'bg-purple-600/50 hover:bg-purple-600/70'
                                        }`}
                                >
                                    {selectedPaper === 'P1' && (
                                        <div className="absolute -top-2 -right-2 bg-white rounded-full p-1">
                                            <span className="text-purple-600 text-sm">✓</span>
                                        </div>
                                    )}
                                    <div className="flex flex-col items-center">
                                        <span className="text-2xl mb-1">📚</span>
                                        <span className="font-semibold">Paper 1</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => loadRandomQuestion('P2')}
                                    className={`relative text-white rounded-xl p-4 transition-all duration-200 ${selectedPaper === 'P2'
                                        ? 'bg-orange-500 shadow-lg shadow-orange-500/50 scale-105 border-2 border-white/50'
                                        : 'bg-orange-500/50 hover:bg-orange-500/70'
                                        }`}
                                >
                                    {selectedPaper === 'P2' && (
                                        <div className="absolute -top-2 -right-2 bg-white rounded-full p-1">
                                            <span className="text-orange-500 text-sm">✓</span>
                                        </div>
                                    )}
                                    <div className="flex flex-col items-center">
                                        <span className="text-2xl mb-1">📝</span>
                                        <span className="font-semibold">Paper 2</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Favorites Section */}
                        <div className="bg-white/10 rounded-xl p-6 flex-1 flex flex-col mt-6">
                            <div className="flex items-center justify-center gap-2 mb-4 relative">
                                <span className="text-2xl">⭐</span>
                                <h2 className="text-xl font-bold text-white">Favorite Questions</h2>
                                {isFavoritesLoading && (
                                    <div className="absolute right-0 animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[calc(100vh-600px)] lg:max-h-[400px]">
                                {favoriteQuestions.length > 0 ? (
                                    <div className="space-y-3">
                                        {favoriteQuestions.map((fav, index) => {
                                            // Rotate through background colors with better opacity
                                            const bgColors = [
                                                'bg-pink-500/20',
                                                'bg-orange-500/20',
                                                'bg-green-500/20',
                                                'bg-blue-500/20',
                                                'bg-purple-500/20'
                                            ];
                                            const bgColor = bgColors[index % bgColors.length];

                                            return (
                                                <button
                                                    key={fav.id}
                                                    onClick={() => loadSpecificQuestion(fav.questionId)}
                                                    className={`w-full text-left p-4 ${bgColor} rounded-2xl transition-all duration-200 hover:scale-[1.02] hover:bg-opacity-30 relative group backdrop-blur-sm border border-white/10`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                            <span className="text-white text-sm">#{index + 1}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white text-sm font-medium line-clamp-2 pr-8">
                                                                {fav.question || fav.context || `Question #${fav.questionId}`}
                                                            </p>
                                                        </div>
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                                                <span className="text-white">→</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
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
                                )}
                            </div>
                        </div>

                        {/* Back to Home Button */}
                        <button
                            onClick={() => router.push('/')}
                            className="mt-6 bg-white/20 text-white rounded-xl p-4 hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="text-xl">🏠</span>
                            <span className="font-semibold">Back to Home</span>
                        </button>
                    </div>

                    {/* Right Panel - Quiz Content */}
                    <div className={`flex-1 p-6 lg:p-6 min-h-screen ${isSidebarVisible ? 'hidden lg:block' : 'block'}`}>
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="text-white text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                                    <p>Loading your question...</p>
                                </div>
                            </div>
                        ) : noMoreQuestions ? (
                            <div className="p-6">
                                <div className="max-w-3xl mx-auto">
                                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center">
                                        <Image
                                            src="/images/illustrations/stressed.png"
                                            alt="No Questions"
                                            width={200}
                                            height={200}
                                            className="mx-auto mb-6"
                                        />
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
                                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8 mt-12 lg:mt-0">
                                        {/* Question Metadata */}
                                        <div className="flex flex-wrap gap-3 mb-4 text-sm">
                                            <div className="bg-white/10 px-3 py-1.5 rounded-full text-white/80 flex items-center gap-1.5">
                                                <span className="text-xs">📅</span>
                                                <span>Term {currentQuestion.term}</span>
                                            </div>
                                            <div className="bg-white/10 px-3 py-1.5 rounded-full text-white/80 flex items-center gap-1.5">
                                                <span className="text-xs">📆</span>
                                                <span>{currentQuestion.year}</span>
                                            </div>
                                            <div className="bg-white/10 px-3 py-1.5 rounded-full text-white/80 flex items-center gap-1.5">
                                                <span className="text-xs">📚</span>
                                                <span>{currentQuestion.curriculum}</span>
                                            </div>
                                            {currentQuestion && (
                                                <button
                                                    onClick={isCurrentQuestionFavorited ? handleUnfavoriteQuestion : handleFavoriteQuestion}
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

                                        {/* Question Context */}
                                        {(currentQuestion.context || currentQuestion.image_path) && (
                                            <div className="mb-4">
                                                <h3 className="text-lg font-semibold mb-2 text-white">Context</h3>
                                                {currentQuestion.context && (
                                                    <div className="p-4 bg-white/5 rounded-lg">
                                                        {renderMixedContent(currentQuestion.context, true)}
                                                    </div>
                                                )}
                                                {currentQuestion.image_path && currentQuestion.image_path !== 'NULL' && (
                                                    <div className="mt-4">
                                                        <button
                                                            onClick={() => {
                                                                setZoomImageUrl(currentQuestion.image_path || null)
                                                                setIsZoomModalVisible(true)
                                                            }}
                                                            className="w-full"
                                                        >
                                                            <Image
                                                                src={`${IMAGE_BASE_URL}${currentQuestion.image_path}`}
                                                                alt="Context Image"
                                                                width={400}
                                                                height={300}
                                                                className="rounded-lg"
                                                                onLoad={() => setIsImageLoading(false)}
                                                            />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Question */}
                                        <div className="mb-6">
                                            <h3 className="text-lg font-semibold mb-2 text-white text-center">Question</h3>
                                            <div className="text-xl mb-2 text-white text-center">
                                                {renderMixedContent(currentQuestion.question, true)}
                                            </div>
                                            {currentQuestion.question_image_path && currentQuestion.question_image_path !== 'NULL' && (
                                                <div className="mt-4 text-center">
                                                    <button
                                                        onClick={() => {
                                                            setZoomImageUrl(currentQuestion.question_image_path || null)
                                                            setIsZoomModalVisible(true)
                                                        }}
                                                        className="inline-block"
                                                    >
                                                        <Image
                                                            src={`${IMAGE_BASE_URL}${currentQuestion.question_image_path}`}
                                                            alt="Question Image"
                                                            width={400}
                                                            height={300}
                                                            className="rounded-lg"
                                                            onLoad={() => setIsImageLoading(false)}
                                                        />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Options */}
                                        <div className="space-y-4">
                                            {Object.entries(currentQuestion.options).map(([key, value]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => handleAnswer(value)}
                                                    disabled={isAnswered}
                                                    className={`w-full p-4 rounded-lg text-center transition-all border ${selectedAnswer === value
                                                        ? isCorrect
                                                            ? 'bg-green-100 text-green-900 border-green-500'
                                                            : 'bg-red-100/90 text-gray-900 border-red-400'
                                                        : cleanAnswer(value) === cleanAnswer(correctAnswer) && showExplanation
                                                            ? 'bg-green-100 text-green-900 border-green-500'
                                                            : 'bg-white/95 hover:bg-gray-50 border-gray-200'
                                                        } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                                                >
                                                    {renderMixedContent(value, false)}
                                                </button>
                                            ))}
                                        </div>

                                        {/* AI Explanation Button */}
                                        <button
                                            onClick={() => fetchAIExplanation(currentQuestion.id)}
                                            disabled={isLoadingExplanation}
                                            className="w-full mt-4 p-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
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

                                        {/* Report Issue Button */}
                                        <button
                                            onClick={reportIssue}
                                            className="w-full mt-4 p-4 rounded-lg bg-red-100/10 hover:bg-red-100/20 transition-colors text-left"
                                        >
                                            <span className="text-red-500 font-medium">
                                                🛑 Report an Issue with this Question
                                            </span>
                                        </button>

                                        {/* Explanation */}
                                        {showExplanation && (
                                            <div className="mt-8">
                                                <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                                    <p className="font-bold mb-2 text-white">
                                                        {isCorrect ? getRandomSuccessMessage() : getRandomWrongMessage()}
                                                    </p>

                                                    {/* Correct Answer Display */}
                                                    <div className="mb-4">
                                                        <p className="text-white font-semibold">✅ Correct Answer:</p>
                                                        <div className="text-green-300 mt-1">
                                                            {renderMixedContent(correctAnswer, true)}
                                                        </div>
                                                    </div>

                                                    {/* Explanation Display */}
                                                    {currentQuestion?.explanation && currentQuestion.explanation.trim() !== '' && (
                                                        <div className="mb-4">
                                                            <p className="text-white font-semibold">📝 Explanation:</p>
                                                            <div className="mt-1">
                                                                {renderMixedContent(currentQuestion.explanation, true)}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* AI Explanation */}
                                                    {currentQuestion?.ai_explanation && (
                                                        <div className="mt-4 p-4 bg-white/5 rounded-lg">
                                                            <p className="text-white font-semibold mb-2">🤖 AI Explanation:</p>
                                                            <div className="text-gray-300">
                                                                {renderMixedContent(currentQuestion.ai_explanation, true)}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Next Question Button */}
                                <div className="flex justify-center mb-8">
                                    <button
                                        onClick={handleNext}
                                        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full py-4 px-8 flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
                                    >
                                        <span className="text-xl">▶</span>
                                        <span className="font-semibold">🎯 Next Question</span>
                                    </button>
                                </div>
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
                        <div className="bg-[#1B1464] rounded-xl p-8 max-w-md w-full text-center">
                            {/* Days of the week */}
                            <div className="mb-6">
                                <div className="grid grid-cols-7 gap-2 mb-4">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                                        <div
                                            key={index}
                                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto"
                                        >
                                            <span className="text-white font-medium">{day}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="relative w-20 h-20 mx-auto mb-4">
                                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-4xl">⭐</span>
                                    </div>
                                </div>
                            </div>

                            <h2 className="text-3xl font-bold text-white mb-2">
                                🔥 {currentStreak}-Day Streak! 🔥
                            </h2>
                            <p className="text-gray-300 mb-8">
                                Keep the fire going — get 3 right answers every day to grow your streak!
                            </p>
                            <button
                                onClick={() => setShowStreakModal(false)}
                                className="w-full py-4 px-8 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
                            >
                                CONTINUE
                            </button>
                        </div>
                    </div>
                )}

                {/* AI Explanation Modal */}
                {isExplanationModalVisible && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className="rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900">
                            {/* Header - Fixed */}
                            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">🤖 AI Explanation</h2>
                                <button
                                    onClick={() => setIsExplanationModalVisible(false)}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    ✕
                                </button>
                            </div>
                            {/* Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-6 min-h-0">
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                    {renderMixedContent(aiExplanation, false)}
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
            </div>
        </>
    )
} 