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
  question: DetailedQuestion & {
    answer_sheet?: string
  }
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

// Helper function to clean the answer string
function cleanAnswer(answer: string): string {
  try {
    // If it's a JSON array, parse first
    let cleanedAnswer = answer;
    if (answer.startsWith('[')) {
      cleanedAnswer = JSON.parse(answer)
        .map((a: string) => a.trim())
        .join(', ');
    }

    // If answer contains pipe character, split into new lines
    if (cleanedAnswer.includes('|')) {
      return cleanedAnswer
        .split('|')
        .map(part => part.trim())
        .join('\n');
    }

    // Return single line answer
    return cleanedAnswer.trim();
  } catch {
    // If parsing fails, return the original answer
    return answer;
  }
}

export default function ViewQuestionModal({
  question: initialQuestion,
  onClose,
  onQuestionUpdate
}: ViewQuestionModalProps) {
  const { user } = useAuth()
  const [question, setQuestion] = useState({
    ...initialQuestion,
    answer: cleanAnswer(initialQuestion.answer)
  })
  const [answer, setAnswer] = useState('test')
  const [showAnswer, setShowAnswer] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectComment, setRejectComment] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [canApprove, setCanApprove] = useState(false)
  const [answerSheet, setAnswerSheet] = useState<Array<{
    A: string
    B: {
      value: string
      isEditable: boolean
      correct: string
      options: string[]
      explanation?: string
    }
  }> | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({})

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanApprove(true)
    }, 15000) // 30 seconds

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (question.answer_sheet) {
      try {
        const parsedSheet = JSON.parse(question.answer_sheet)
        setAnswerSheet(parsedSheet)
        // Initialize selected answers as empty
        const initialAnswers = parsedSheet.reduce((acc: { [key: number]: string }, _: any, index: number) => {
          acc[index] = ''
          return acc
        }, {})
        setSelectedAnswers(initialAnswers)
      } catch (error) {
        console.error('Error parsing answer sheet:', error)
      }
    }
  }, [question.answer_sheet])

  const getImageUrl = (imageName: string) => {
    if (!imageName) return '';

    // If the URL already includes the full path, return it as is
    if (imageName.startsWith('http')) {
      return imageName;
    }

    // Direct path to the image in the bucket
    return `${IMAGE_BASE_URL}${imageName}`;
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
        answer: cleanAnswer(nextQuestion.answer)
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
      const response = await fetch(`${API_BASE_URL}/question/status`, {
        method: 'PUT',
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

  const handleOptionSelect = async (rowIndex: number, option: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [rowIndex]: option
    }))

    try {
      setLoading(true)
      const correct = await checkAnswer(option)
      setIsCorrect(correct)
      setShowAnswer(true)
    } catch (error) {
      console.error('Error checking answer:', error)
    } finally {
      setLoading(false)
    }
  }

  const isMultipleChoice = question.type === 'multiple_choice'
  const isAccounting = question.subject.name.toLowerCase() === 'accounting'
  const hasAnswerSheet = answerSheet !== null

  const renderMixedContent = (text: string) => {
    // Handle LaTeX content first
    if (text.startsWith('$') && text.endsWith('$')) {
      return text.split(/(\$.*?\$)/).map((chunk, index) => {
        if (chunk.startsWith('$') && chunk.endsWith('$')) {
          const latex = chunk.slice(1, -1);
          return <InlineMath key={index} math={latex} />;
        }
        return <span key={index}>{chunk}</span>;
      });
    }

    // Split the text into lines
    const lines = text.split('\n');

    return (
      <div className="text-gray-700">
        {lines.map((line, index) => {
          const trimmedLine = line.trim();

          // Handle headings (lines starting with ###)
          if (trimmedLine.startsWith('###')) {
            return (
              <div key={index} className="text-lg font-bold mb-2 mt-3">
                {trimmedLine.replace(/^###\s*/, '')}
              </div>
            );
          }

          // Handle bold text
          const boldProcessedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

          // Create a list item style for bullet points
          const style = trimmedLine.startsWith('- ') ? {
            paddingLeft: '1.5em',
            position: 'relative' as const,
            marginBottom: '0.5rem'
          } : {
            marginBottom: '0.5rem'
          };

          // Add bullet point before the content if line starts with -
          const content = trimmedLine.startsWith('- ') ? (
            <div style={style}>
              <span style={{
                position: 'absolute',
                left: '0.5em',
                top: '0'
              }}>•</span>
              <span dangerouslySetInnerHTML={{
                __html: boldProcessedLine.substring(2)
              }} />
            </div>
          ) : (
            <div style={style} dangerouslySetInnerHTML={{
              __html: boldProcessedLine
            }} />
          );

          return (
            <div key={index}>
              {content}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">Question Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Rejection Comment */}
          {question.status === 'rejected' && question.comment && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Rejection Comment</h3>
              <p className="text-red-700">{question.comment}</p>
            </div>
          )}

          {/* Question Content */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Context</h3>
            <div className="bg-gray-50 p-4 rounded">
              {renderMixedContent(question.context)}
            </div>
          </div>

          {/* Context Image */}
          {question.image_path && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Context Image</h3>
              <div className="relative w-full h-64">
                <Image
                  src={getImageUrl(question.image_path)}
                  alt="Context"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}

          {/* Additional Context Images */}
          {question.other_context_images && question.other_context_images.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Additional Context Images</h3>
              <div className="grid grid-cols-2 gap-4">
                {question.other_context_images.map((imagePath, index) => (
                  <div key={index} className="relative w-full h-48">
                    <Image
                      src={getImageUrl(imagePath)}
                      alt={`Additional Context ${index + 1}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* question Image */}
          {question.question_image_path && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Question Image</h3>
              <div className="relative w-full h-64">
                <Image
                  src={getImageUrl(question.question_image_path || '')}
                  alt="Question"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}


          {/* Question Content */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Question</h3>
            <div className="bg-gray-50 p-4 rounded">
              {renderMixedContent(question.question)}
            </div>
          </div>

          {/* Answer Section */}
          {isMultipleChoice && !hasAnswerSheet ? (
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
                    {renderMixedContent(value)}
                  </button>
                ))}
              </div>
            </div>
          ) : hasAnswerSheet ? (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Answer Sheet</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">A</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">B</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {answerSheet.map((row, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {row.A}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="space-y-2">
                            {typeof row.B === 'string' ? (
                              <div className="p-2 border rounded">
                                {row.B}
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                {row.B.options?.map((option, optIndex) => (
                                  <button
                                    key={optIndex}
                                    onClick={() => handleOptionSelect(index, option)}
                                    className={`p-2 text-left border rounded ${showAnswer
                                      ? option === row.B.correct
                                        ? 'bg-green-50 border-green-500 text-green-700'
                                        : selectedAnswers[index] === option
                                          ? 'bg-red-50 border-red-500 text-red-700'
                                          : 'border-gray-200'
                                      : selectedAnswers[index] === option
                                        ? 'bg-blue-50 border-blue-500'
                                        : 'border-gray-200 hover:bg-gray-50'
                                      }`}
                                    disabled={showAnswer || loading}
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                <p className="mt-1 text-gray-700">{renderMixedContent(question.answer)}</p>
              </div>

              {/* Explanation */}
              {(question.explanation || question.answer_image) && (
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Explanation</h3>
                  {question.explanation && (
                    <p className="text-gray-700">{renderMixedContent(question.explanation)}</p>
                  )}
                  {question.answer_image && (
                    <div className="relative h-64 w-full mt-2">
                      <Image
                        src={getImageUrl(question.answer_image)}
                        alt="Answer explanation"
                        fill
                        unoptimized
                        className="object-contain"
                        onError={(e) => {
                          console.error('Failed to load answer image:', question.answer_image);
                          e.currentTarget.style.display = 'none';
                        }}
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