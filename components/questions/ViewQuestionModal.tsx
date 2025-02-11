'use client'

import { useState } from 'react'
import Image from 'next/image'
import { type DetailedQuestion } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { API_BASE_URL, IMAGE_BASE_URL } from '../../config/constants.js'

interface ViewQuestionModalProps {
  question: DetailedQuestion
  onClose: () => void
}

interface CheckAnswerResponse {
  status: string
  correct: boolean
  message?: string
}

interface ApproveResponse {
  status: string
  message?: string
}

export default function ViewQuestionModal({ question, onClose }: ViewQuestionModalProps) {
  const { user } = useAuth()
  const [answer, setAnswer] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState(false)
  const [hasCheckedAnswer, setHasCheckedAnswer] = useState(false)

  const getImageUrl = (imageName: string) => {
    return `${IMAGE_BASE_URL}?image=${imageName}`
  }

  const checkAnswer = async (userAnswer: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/learner/check-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: question.id,
          answer: userAnswer,
          requesting_type: 'mock',
          uid: user?.uid
        }),
      })

      const data: CheckAnswerResponse = await response.json()
      return data.correct
    } catch (error) {
      console.error('Error checking answer:', error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const correct = await checkAnswer(answer)
      setIsCorrect(correct)
      setShowAnswer(true)
      setHasCheckedAnswer(true)
    } catch (error) {
      console.error('Error submitting answer:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!user?.email) return
    setApproving(true)

    try {
      const response = await fetch(`${API_BASE_URL}/question/set-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: question.id,
          status: 'approved',
          email: user.email,
          uid: user.uid
        }),
      })

      const data: ApproveResponse = await response.json()

      if (data.status === 'OK') {
        onClose() // Close modal after successful approval
      }
    } catch (error) {
      console.error('Error approving question:', error)
    } finally {
      setApproving(false)
    }
  }

  return (

    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header with Approve Button */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-medium text-gray-900">Question</h2>
              <p className="text-sm text-gray-500 mt-1">
                Grade {question.subject.grade.number} • {question.subject.name} • Term {question.term}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Only show approve button if answer has been checked */}
              {hasCheckedAnswer && user?.email && question.status !== 'approved' && (
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {approving ? 'Approving...' : 'Approve Question'}
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Context */}
          {(question.context || question.image_path) && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Context</h3>
              {question.context && (
                <p className="text-gray-700">{question.context}</p>
              )}
              {question.image_path && (
                <div className="relative h-64 w-full">
                  <Image
                    src={getImageUrl(question.image_path)}
                    alt="Question context"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {/* Question */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Question</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800">{question.question}</p>
            </div>
          </div>

          {/* Answer Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="answer" className="block text-sm font-medium text-gray-700">
                Your Answer
              </label>
              <input
                type="text"
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your answer"
                required
              />
            </div>
            <button
              type="submit"
              className={`w-full py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              disabled={loading}
            >
              {loading ? 'Checking...' : 'Check Answer'}
            </button>
          </form>

          {/* Show result and explanation */}
          {showAnswer && (
            <div className="space-y-4">
              {/* Result message */}
              <div className={`p-4 rounded-md ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                {isCorrect ? 'Correct!' : 'Incorrect. Try again!'}
              </div>

              {/* Correct Answer */}
              <div className="p-4 rounded-md bg-gray-50">
                <h3 className="font-medium text-gray-900">Correct Answer</h3>
                <p className="mt-1 text-gray-700">{question.answer}</p>
              </div>

              {/* Explanation */}
              {(question.explanation || question.answer_image) && (
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Explanation</h3>
                  {question.explanation && (
                    <p className="text-gray-700">{question.explanation}</p>
                  )}
                  {question.answer_image && (
                    <div className="relative h-64 w-full">
                      <Image
                        src={getImageUrl(question.answer_image)}
                        alt="Answer explanation"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

  )
} 