'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getQuestions, getGrades, getActiveSubjects, type Question, type Grade, type Subject, type DetailedQuestion, getQuestionById } from '@/services/api'
import EditQuestionModal from '@/components/questions/EditQuestionModal'

interface Filters {
  grade: string
  subject: string
  status: string
}

export default function QuestionsList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedQuestion, setSelectedQuestion] = useState<DetailedQuestion | null>(null)

  // Get filters from URL parameters
  const [filters, setFilters] = useState<Filters>(() => ({
    grade: searchParams.get('grade') || '',
    subject: searchParams.get('subject') || '',
    status: searchParams.get('status') || ''
  }))

  // Update URL when filters change
  const updateURL = (newFilters: Filters) => {
    const params = new URLSearchParams()
    if (newFilters.grade) params.set('grade', newFilters.grade)
    if (newFilters.subject) params.set('subject', newFilters.subject)
    if (newFilters.status) params.set('status', newFilters.status)

    router.push(`/questions?${params.toString()}`, { scroll: false })
  }

  // Handle filter changes
  const handleFilterChange = (name: keyof Filters, value: string) => {
    const newFilters = { ...filters, [name]: value }
    setFilters(newFilters)
    updateURL(newFilters)
  }

  // Fetch questions with current filters
  const fetchQuestions = async () => {
    if (!filters.grade || !filters.subject) return

    setLoading(true)
    try {
      const data = await getQuestions(filters.grade, filters.subject, filters.status)
      setQuestions(data)
    } catch (err) {
      console.error('Failed to fetch questions:', err)
      setError('Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  // Handle question updates
  const handleQuestionUpdate = async () => {
    await fetchQuestions()
  }

  // Update the click handler to fetch detailed question
  const handleEdit = async (question: Question) => {
    try {
      const detailedQuestion = await getQuestionById(question.id.toString())
      setSelectedQuestion(detailedQuestion)
    } catch (err) {
      console.error('Failed to fetch question details:', err)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const gradesData = await getGrades()
        setGrades(gradesData)
      } catch (err) {
        console.error('Failed to fetch grades:', err)
        setError('Failed to load grades')
      } finally {
        setLoading(false)
      }
    }

    if (mounted) {
      fetchGrades()
    }
  }, [mounted])

  useEffect(() => {
    if (filters.grade) {
      const fetchSubjects = async () => {
        try {
          const subjectsData = await getActiveSubjects(filters.grade)
          setSubjects(subjectsData)
          setFilters(prev => ({ ...prev, subject: '' }))
        } catch (err) {
          console.error('Failed to fetch subjects:', err)
          setError('Failed to load subjects')
        }
      }
      fetchSubjects()
    } else {
      setSubjects([])
    }
  }, [filters.grade])

  useEffect(() => {
    if (mounted && (filters.grade && filters.subject)) {
      fetchQuestions()
    }
  }, [filters, mounted])

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          value={filters.grade}
          onChange={(e) => handleFilterChange('grade', e.target.value)}
          className="border rounded-md p-2"
        >
          <option value="">All Grades</option>
          {grades.map((grade) => (
            <option key={grade.id} value={grade.id}>
              Grade {grade.number}
            </option>
          ))}
        </select>

        <select
          value={filters.subject}
          onChange={(e) => handleFilterChange('subject', e.target.value)}
          className="border rounded-md p-2"
        >
          <option value="">All Subjects</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="border rounded-md p-2"
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div>Loading questions...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Answer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capturer</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {questions.map(question => (
              <tr key={question.id} onClick={() => handleEdit(question)}>
                <td className="px-6 py-4 whitespace-nowrap">{question.id}</td>
                <td className="px-6 py-4">{question.question.substring(0, 100)}...</td>
                <td className="px-6 py-4">{question.answer}</td>
                <td className="px-6 py-4">{question.status}</td>
                <td className="px-6 py-4">{question.capturer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedQuestion && (
        <EditQuestionModal
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          onUpdate={handleQuestionUpdate}
        />
      )}
    </div>
  )
} 