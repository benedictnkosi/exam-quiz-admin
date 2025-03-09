'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import QuestionsTable from '@/components/questions/QuestionsTable'
import QuestionsFilter from '@/components/questions/QuestionsFilter'
import CreateQuestionModal from '@/components/questions/CreateQuestionModal'
import { getQuestions, type Question, getRejectedQuestionsByUid } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

export default function QuestionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { user } = useAuth()

  // Get filters from URL parameters
  const filters = {
    grade: searchParams.get('grade') || '',
    subject: searchParams.get('subject') || '',
    status: searchParams.get('status') || '',
  }

  const updateFilters = (newFilters: typeof filters) => {
    const params = new URLSearchParams()
    if (newFilters.grade) params.set('grade', newFilters.grade)
    if (newFilters.subject) params.set('subject', newFilters.subject)
    if (newFilters.status) params.set('status', newFilters.status)
    router.push(`/questions?${params.toString()}`)
  }

  // Wrap handleSearch in useCallback to prevent unnecessary re-renders
  const handleSearch = useCallback(async () => {
    if (!filters.grade || !filters.subject) {
      setError('Please select grade and subject')
      return
    }

    setLoading(true)
    setError('')

    try {
      const questionsData = await getQuestions(filters.grade, filters.subject, filters.status)
      setQuestions(questionsData)
    } catch (err) {
      console.error('Failed to fetch questions:', err)
      setError('Failed to load questions')
    } finally {
      setLoading(false)
    }
  }, [filters.grade, filters.subject, filters.status, setError, setQuestions, setLoading])

  const handleFetchRejected = async () => {
    if (!user?.uid) return

    setLoading(true)
    setError('')

    try {
      const rejectedQuestions = await getRejectedQuestionsByUid(user.uid)
      setQuestions(rejectedQuestions.questions)
    } catch (err) {
      console.error('Failed to fetch rejected questions:', err)
      setError('Failed to load rejected questions')
    } finally {
      setLoading(false)
    }
  }

  // Fetch questions when URL parameters change
  useEffect(() => {
    if (filters.grade && filters.subject) {
      handleSearch()
    }
  }, [searchParams, filters.grade, filters.subject, handleSearch])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Questions</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Question
        </button>
      </div>

      <QuestionsFilter
        filters={filters}
        setFilters={updateFilters}
        onSearch={handleSearch}
        onFetchRejected={handleFetchRejected}
      />

      <QuestionsTable
        questions={questions}
        isLoading={loading}
        error={error}
        onDelete={(id) => setQuestions(prev => prev.filter(q => q.id !== id))}
      />

      {showCreateModal && (
        <CreateQuestionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            handleSearch()
          }}
        />
      )}
    </div>
  )
} 