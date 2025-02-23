import React, { useState } from 'react'
import { setQuestionInactive, getQuestionById, type Question, type DetailedQuestion } from '@/services/api'
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


  const handleDelete = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return
    if (!user) return

    setDeleting(questionId)
    try {
      await setQuestionInactive(questionId.toString(), user.uid)
      onDelete(questionId)
    } catch (error) {
      alert(`Failed to delete question ${error}`)
    } finally {
      setDeleting(null)
    }

  }

  const handleView = async (question: Question) => {
    try {
      const detailedQuestion = await getQuestionById(question.id.toString())
      setViewingQuestion(detailedQuestion)
    } catch (error) {
      console.error('Failed to fetch question details:', error)
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
              Question
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Capturer
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
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    View
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
                {question.id}
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 max-w-md truncate">
                  {question.question}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {question.type}
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
                  {question.status === 'approved' && question.comment === 'new' ? 'new' : question.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {question.capturer}
              </td>

            </tr>
          ))}
        </tbody>
      </table>
      {viewingQuestion && (
        <ViewQuestionModal
          question={viewingQuestion}
          onClose={() => setViewingQuestion(null)}
        />
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