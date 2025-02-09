'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import QuestionForm from './QuestionForm'
import { getQuestionById, type DetailedQuestion } from '@/services/api'

export default function EditQuestionForm({ questionId }: { questionId: string }) {
  const router = useRouter()
  const [question, setQuestion] = useState<DetailedQuestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const data = await getQuestionById(questionId)
        setQuestion(data)
      } catch (err) {
        console.error('Failed to fetch question:', err)
        setError('Failed to load question')
      } finally {
        setLoading(false)
      }
    }

    fetchQuestion()
  }, [questionId])

  if (loading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-600">{error}</div>
  if (!question) return <div className="p-4">Question not found</div>

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-700">Update Question</h1>
        <p className="text-sm text-gray-500 mt-1">Edit the question details below</p>
      </div>

      <QuestionForm
        initialData={question}
        mode="edit"
      />
    </div>
  )
} 