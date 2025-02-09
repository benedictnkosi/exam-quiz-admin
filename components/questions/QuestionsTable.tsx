import React, { useState } from 'react'
import { setQuestionInactive, getQuestionById, type Question, type DetailedQuestion } from '@/services/api'
import { useRouter } from 'next/navigation'
import ViewQuestionModal from './ViewQuestionModal'
import EditQuestionModal from './EditQuestionModal'

interface QuestionsTableProps {
  questions: Question[]
  isLoading?: boolean
  error?: string
  onDelete: (questionId: number) => void
}

export default function QuestionsTable({ questions, onDelete }: QuestionsTableProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<number | null>(null)
  const [viewingQuestion, setViewingQuestion] = useState<DetailedQuestion | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<DetailedQuestion | null>(null)
  const [loading, setLoading] = useState(false)

  const getSubjectDisplay = (subject: Question['subject']) => {
    if (typeof subject === 'string') return subject
    return subject.name
  }

  const getGradeDisplay = (subject: Question['subject']) => {
    if (typeof subject === 'string') return ''
    return `Grade ${subject.grade.number}`
  }

  const handleDelete = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return

    setDeleting(questionId)
    try {
      await setQuestionInactive(questionId.toString())
      onDelete(questionId)
    } catch (error) {
      alert('Failed to delete question')
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
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Question
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Grade
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Subject
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Capturer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {questions.map((question) => (
            <tr key={question.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {question.id}
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 max-w-md truncate">
                  {question.question}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {getGradeDisplay(question.subject)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {getSubjectDisplay(question.subject)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${question.status === 'Approved'
                    ? 'bg-green-100 text-green-800'
                    : question.status === 'Pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {question.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {question.capturer}
              </td>
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