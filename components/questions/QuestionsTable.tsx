import React, { useState } from 'react'
import { getQuestionById, type Question, type DetailedQuestion, updatePostedStatus, deleteQuestion } from '@/services/api'
import ViewQuestionModal from './ViewQuestionModal'
import EditQuestionModal from './EditQuestionModal'
import { useAuth } from '@/contexts/AuthContext'

interface QuestionsTableProps {
  questions: Question[]
  isLoading?: boolean
  error?: string
  onDelete: (questionId: number) => void
}

export default function QuestionsTable({ questions, onDelete }: QuestionsTableProps) {
  const { user } = useAuth()
  const [deleting, setDeleting] = useState<number | null>(null)
  const [viewingQuestion, setViewingQuestion] = useState<DetailedQuestion | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<DetailedQuestion | null>(null)
  const [posting, setPosting] = useState<number | null>(null)
  const [loadingView, setLoadingView] = useState<number | null>(null)
  const [showContext, setShowContext] = useState(false)
  const [detailedQuestions, setDetailedQuestions] = useState<Record<number, DetailedQuestion>>({})
  const [loadingContext, setLoadingContext] = useState(false)

  const fetchAllContexts = async () => {
    if (showContext) return // Don't fetch if we're already showing context
    setLoadingContext(true)
    try {
      const contexts = await Promise.all(
        questions.map(q => getQuestionById(q.id.toString()))
      )
      const contextMap = contexts.reduce((acc, q) => {
        if (q) acc[q.id] = q
        return acc
      }, {} as Record<number, DetailedQuestion>)
      setDetailedQuestions(contextMap)
    } catch (error) {
      console.error('Failed to fetch contexts:', error)
      alert('Failed to load contexts')
    } finally {
      setLoadingContext(false)
    }
  }

  const handleToggleContext = () => {
    if (!showContext) {
      fetchAllContexts()
    }
    setShowContext(!showContext)
  }

  const handleDelete = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return
    if (!user) return

    setDeleting(questionId)
    try {
      await deleteQuestion(questionId.toString(), user.uid)
      onDelete(questionId)
    } catch (error) {
      alert(`Failed to delete question ${error}`)
    } finally {
      setDeleting(null)
    }

  }

  const handleView = async (question: Question) => {
    try {
      setLoadingView(question.id);
      const detailedQuestion = await getQuestionById(question.id.toString());

      if (detailedQuestion) {
        setViewingQuestion(detailedQuestion);
      } else {
        console.error('Failed to fetch question details: Question data not found');
        alert('Failed to fetch question details. Please try again.');
      }
    } catch (error) {
      console.error('Failed to fetch question details:', error);
      alert('Error loading question details. Please try again.');
    } finally {
      setLoadingView(null);
    }
  }

  const handleEdit = async (question: Question) => {
    try {
      const detailedQuestion = await getQuestionById(question.id.toString())
      setEditingQuestion(detailedQuestion)
    } catch (error) {
      console.error('Failed to fetch question details:', error)
    }
  }

  const handleUpdatePosted = async (questionId: number) => {
    try {
      setPosting(questionId)
      await updatePostedStatus(questionId.toString(), true)
      // Refresh the page to show updated status
      window.location.reload()
    } catch (error) {
      console.error('Failed to update posted status:', error)
      alert('Failed to update posted status')
    } finally {
      setPosting(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center space-x-2">
                <span>{showContext ? 'Context' : 'Question'}</span>
                <button
                  onClick={handleToggleContext}
                  disabled={loadingContext}
                  className="text-xs text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                >
                  {loadingContext ? 'Loading...' : `Switch to ${showContext ? 'Question' : 'Context'}`}
                </button>
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Capturer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Comment
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {questions.map((question) => (
            <tr key={question.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleView(question)}
                    disabled={loadingView === question.id}
                    className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                  >
                    {loadingView === question.id ? 'Loading...' : 'View'}
                  </button>
                  <button
                    onClick={() => handleEdit(question)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(question.id)}
                    disabled={deleting === question.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    {deleting === question.id ? 'Deleting...' : 'Delete'}
                  </button>

                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {question.id.toString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {question.question_number}
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 whitespace-pre-wrap">
                  {showContext
                    ? (detailedQuestions[question.id]?.context || 'Loading context...')
                    : String(question.question)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${(question.status === 'approved' && question.comment === 'approved')
                    ? 'bg-green-100 text-green-800'
                    : (question.status === 'approved' && (question.comment === 'new' || question.comment === ''))
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {question.status === 'approved' && question.comment === 'new' ? 'Review' : question.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {question.capturer?.name || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {question.comment && question.comment !== 'approved' && question.comment !== 'new' ? (
                  <span className="text-red-600">{question.comment}</span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {viewingQuestion && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex">
          <ViewQuestionModal
            question={viewingQuestion}
            onClose={() => setViewingQuestion(null)}
          />
        </div>
      )}

      {editingQuestion && (
        <EditQuestionModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onUpdate={() => {
            // Refresh the questions list
            window.location.reload()
          }}
        />
      )}
    </div>
  )
} 