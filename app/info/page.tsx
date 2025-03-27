'use client'
import React from 'react'
import Link from 'next/link'

const faqs = [
    {
        question: "How does ExamQuiz work?",
        answer: "ExamQuiz helps you practice with real past exam questions tailored to your grade and curriculum. Choose your subjects, select Paper 1 or Paper 2, and start practicing! Each question comes with detailed solutions and explanations. Your progress is tracked separately for each paper and subject, helping you focus on areas that need improvement."
    },
    {
        question: "What is the difference between Paper 1 and Paper 2?",
        answer: "Each subject is divided into Paper 1 and Paper 2, following the official exam structure. Each paper covers different topics and sections of the curriculum. Paper 1 typically focuses on theory and conceptual understanding, while Paper 2 often covers practical applications and problem-solving. You can practice both papers separately to ensure complete preparation."
    },
    {
        question: "How does the AI help me learn?",
        answer: "Our AI assistant provides personalized learning support in multiple ways: it explains concepts in detail when you get a question wrong, breaks down solutions step-by-step, identifies your specific misconceptions, and provides additional examples tailored to your learning style. The AI adapts to your performance over time, focusing more on areas where you need extra help."
    },
    {
        question: "How do I select my curriculum and terms?",
        answer: "In your profile settings, you can choose between CAPS and IEB curricula or both, and select which terms (1-4) you want to see questions from. This helps customize your practice to match your school's curriculum and current term. You can update these settings anytime as you progress through the school year."
    },
    {
        question: "How do streaks work?",
        answer: "To maintain your daily streak, you need to get at least 3 correct answers each day. Miss a day or fail to get 3 correct answers, and your streak resets. Keep practicing daily to build your streak! Longer streaks unlock special achievements and badges to showcase your consistency. 🔥"
    },
    {
        question: "How do points work?",
        answer: "You earn 1 point for each correct answer. Points contribute to your overall ranking and unlock special features and achievements. Keep practicing daily to maximize your points and improve your knowledge! ⭐"
    },
    {
        question: "How does the progress tracking work?",
        answer: "Each subject shows your performance with:\n• Total questions attempted\n• Correct answers (Bullseyes)\n• Incorrect answers (Oopsies)\n• Overall mastery percentage\nThe progress bar color indicates your performance level: green for high scores (>70%), amber for medium (40-70%), and red for areas needing improvement (<40%). You can view detailed analytics for each subject to identify specific topics to focus on."
    },
    {
        question: "Can I change my grade or school?",
        answer: "Yes, you can update your grade and school in the profile section. Note that changing your grade will reset your progress as questions are grade-specific. Your school information helps us provide relevant curriculum content and allows you to compare your performance with peers at your school (if enabled in privacy settings)."
    },
    {
        question: "What if I find an issue with a question?",
        answer: "You can report any issues with questions using the report button in the quiz screen. Our team will review and address the reported issues to ensure accuracy. We appreciate your feedback as it helps us improve the quality of our question bank for all users."
    },
    {
        question: "How do I reset my progress?",
        answer: "You can reset your progress for individual subjects from the subject screen. This will clear your progress for that specific subject and let you start fresh. This is useful when you want to retry a subject after studying or when you want to practice with a clean slate at the beginning of a new term."
    },
    {
        question: "Why do I keep seeing the same question?",
        answer: "This is part of our spaced repetition learning system! We show you questions multiple times to reinforce your learning. Only after you've answered a question correctly 3 times do we consider it 'mastered,' and then it will appear less frequently. This approach is based on educational research showing that repeated exposure with increasing intervals helps move information from short-term to long-term memory."
    }
]

export default function InfoPage() {
    return (
        <div className="min-h-screen bg-[#1B1464] text-white p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="text-white hover:text-gray-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-2xl font-bold">Information & Help</h1>
                </div>

                {/* WhatsApp Contact Button */}
                <a
                    href="https://api.whatsapp.com/send/?phone=27837917430&text=Hi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl py-4 px-6 flex items-center justify-center gap-2 mb-6 transition-colors"
                >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span>Need help? Chat with us on WhatsApp 👋</span>
                </a>

                {/* Email Support Button */}
                <a
                    href="mailto:support@examquiz.co.za"
                    className="block w-full bg-[#EA4335] hover:bg-[#C62828] text-white rounded-xl py-4 px-6 flex items-center justify-center gap-2 mb-12 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Email us at support@examquiz.co.za 📧</span>
                </a>

                {/* FAQs */}
                <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
                <div className="space-y-6">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 hover:bg-white/20 transition-all"
                        >
                            <h3 className="text-xl font-semibold mb-4">{faq.question}</h3>
                            <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
} 