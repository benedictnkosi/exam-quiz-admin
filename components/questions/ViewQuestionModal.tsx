'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { type DetailedQuestion } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { API_BASE_URL, IMAGE_BASE_URL } from '../../config/constants.js'
import { getNextNewQuestion } from '@/services/api'
import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex'

interface ViewQuestionModalProps {
  question: DetailedQuestion
  onClose: () => void
  onQuestionUpdate?: (newQuestion: DetailedQuestion) => void
}

interface CheckAnswerResponse {
  status: string
  result: 'correct' | 'incorrect'
  message?: string
}

// interface ApproveResponse {
//   status: string
//   message?: string
// }

interface RejectResponse {
  status: string
  message?: string
}

export default function ViewQuestionModal({
  question: initialQuestion,
  onClose,
  onQuestionUpdate
}: ViewQuestionModalProps) {
  const { user } = useAuth()
  const [question, setQuestion] = useState({
    ...initialQuestion,
    answer: initialQuestion.answer.replace(/[\[\]"]/g, '').trim()
  })
  const [answer, setAnswer] = useState('test')
  const [showAnswer, setShowAnswer] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectComment, setRejectComment] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [canApprove, setCanApprove] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanApprove(true)
    }, 30000) // 30 seconds

    return () => clearTimeout(timer)
  }, [])

  const getImageUrl = (imageName: string) => {
    return `${IMAGE_BASE_URL}?image=${imageName}`
  }

  const checkAnswer = async (userAnswer: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/learner/check-answer`, {
        method: 'POST',
        body: JSON.stringify({
          question_id: question.id,
          answer: userAnswer,
          requesting_type: 'mock',
          uid: user?.uid
        }),
      })

      const data: CheckAnswerResponse = await response.json()
      return data.result == 'correct'
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
    } catch (error) {
      console.error('Error submitting answer:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadNextQuestion = async () => {
    try {
      const nextQuestion = await getNextNewQuestion(question.id.toString())
      setQuestion({
        ...nextQuestion,
        answer: nextQuestion.answer.replace(/[\[\]"]/g, '').trim()
      })
      // Reset states for new question
      setAnswer('')
      setShowAnswer(false)
      setIsCorrect(null)
      onQuestionUpdate?.(nextQuestion)
    } catch (error) {
      console.error('Error loading next question:', error)
      alert('No more questions to review')
      onClose()
    }
  }

  const handleApprove = async () => {
    alert('Use the mobile app to approve questions')
  }

  const handleReject = async () => {
    if (!user?.email) return
    setRejecting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/question/set-status`, {
        method: 'POST',
        body: JSON.stringify({
          question_id: question.id,
          status: 'rejected',
          comment: rejectComment,
          email: user.email,
          uid: user.uid
        }),
      })

      const data: RejectResponse = await response.json()

      if (data.status === 'OK') {
        setShowRejectModal(false)
        await loadNextQuestion()
      } else {
        console.error('Error rejecting question:', data.message)
        alert(data.message || 'Failed to reject question')
      }
    } catch (error) {
      console.error('Error rejecting question:', error)
      alert('Failed to reject question')
    } finally {
      setRejecting(false)
    }
  }

  const isMultipleChoice = question.type === 'multiple_choice'

  const renderLatex = (text: string) => {
    return text.split(/(\$.*?\$)/).map((chunk, index) => {
      if (chunk.startsWith('$') && chunk.endsWith('$')) {
        const latex = chunk.slice(1, -1)
        return <InlineMath key={index} math={latex} />
      }
      return <span key={index}>{chunk}</span>
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-[400px] w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header with Status and Buttons */}
          <div className="flex flex-col justify-between items-start">
            <div className="flex items-center space-x-4 mt-4">
              {/* Only show approve button if answer has been checked */}


              {/* Only show reject button if status is not rejected */}
              {question.status !== 'rejected' && (
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={rejecting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {rejecting ? 'Rejecting...' : 'Reject Question'}
                </button>
              )}

              {question.status !== 'rejected' && (
                <button
                  onClick={handleApprove}
                  disabled={!canApprove}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {!canApprove ? 'Please review for 30s' : 'Approve Question'}
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
            <div>
              <h2 className="text-xl font-medium text-gray-900">Question - {question.id}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Grade {question.subject.grade.number} • {question.subject.name} • Term {question.term}
              </p>
              {question.status === 'rejected' && question.comment && (
                <div className="mt-2 p-3 bg-red-50 rounded-md">
                  <p className="text-sm font-medium text-red-800">Rejection Comment:</p>
                  <p className="text-sm text-red-700">{question.comment}</p>
                </div>
              )}
            </div>

          </div>

          {/* Context */}
          {(question.context || question.image_path) && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Context</h3>
              {question.context && (

                <p className="text-gray-700">{renderLatex(question.context)}</p>
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
              <p className="text-gray-800">
                {renderLatex(question.question)}
              </p>
            </div>
            {question.question_image_path && (
              <div className="relative h-64 w-full">
                <Image
                  src={getImageUrl(question.question_image_path)}
                  alt="Question Image"
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </div>

          {/* Answer Section */}
          {isMultipleChoice ? (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Choose an Answer</h3>
              <div className="space-y-2">
                {Object.entries(question.options || {}).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={async () => {
                      try {
                        setLoading(true)
                        const correct = await checkAnswer(value)
                        setAnswer(value)
                        setIsCorrect(correct)
                        setShowAnswer(true)
                      } catch (error) {
                        console.error('Error submitting answer:', error)
                      } finally {
                        setLoading(false)
                      }
                    }}
                    className={`w-full p-3 text-left rounded-lg border ${showAnswer
                      ? value === question.answer
                        ? 'bg-green-50 border-green-500'
                        : value === answer
                          ? isCorrect
                            ? 'bg-green-50 border-green-500'
                            : 'bg-red-50 border-red-500'
                          : 'border-gray-200'
                      : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    disabled={showAnswer || loading}
                  >
                    {renderLatex(value)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
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
          )}

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
                <p className="mt-1 text-gray-700">{renderLatex(question.answer)}</p>
              </div>

              {/* Explanation */}
              {(question.explanation || question.answer_image) && (
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Explanation</h3>
                  {question.explanation && (
                    <p className="text-gray-700">{renderLatex(question.explanation)}</p>
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

          {/* Add Reject Modal */}
          {showRejectModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 w-96">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Question</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="rejectComment" className="block text-sm font-medium text-gray-700">
                      Rejection Comment
                    </label>
                    <textarea
                      id="rejectComment"
                      value={rejectComment}
                      onChange={(e) => setRejectComment(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      rows={4}
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowRejectModal(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={!rejectComment.trim() || rejecting}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {rejecting ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 