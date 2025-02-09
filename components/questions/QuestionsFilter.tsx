'use client'

import { useState, useEffect } from 'react'
import { getGrades, getActiveSubjects, type Grade, type Subject } from '@/services/api'

interface QuestionsFilterProps {
  filters: {
    grade: string
    subject: string
    status: string
  }
  setFilters: (filters: any) => void
  onSearch: () => void
}

export default function QuestionsFilter({ filters, setFilters, onSearch }: QuestionsFilterProps) {
  const [grades, setGrades] = useState<Grade[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const statuses = ['New', 'Approved', 'Rejected']

  // Handle filter changes
  const handleFilterChange = (name: string, value: string) => {
    const newFilters = { ...filters, [name]: value }
    if (name === 'grade') {
      newFilters.subject = '' // Reset subject when grade changes
    }
    setFilters(newFilters)
  }

  // Fetch grades on mount
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const gradesData = await getGrades()
        const sortedGrades = [...gradesData].sort((a, b) => b.number - a.number)
        setGrades(sortedGrades)
      } catch (err) {
        console.error('Failed to fetch grades:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchGrades()
  }, [])

  // Fetch subjects when grade changes
  useEffect(() => {
    if (filters.grade) {
      const fetchSubjects = async () => {
        try {
          const subjectsData = await getActiveSubjects(filters.grade)
          setSubjects(subjectsData)
        } catch (err) {
          console.error('Failed to fetch subjects:', err)
        }
      }
      fetchSubjects()
    } else {
      setSubjects([])
    }
  }, [filters.grade])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch()
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grade
            </label>
            <select
              value={filters.grade}
              onChange={(e) => handleFilterChange('grade', e.target.value)}
              className="w-full border rounded-md p-2"
              disabled={loading}
            >
              <option value="">Select Grade</option>
              {grades.map(grade => (
                <option
                  key={grade.id}
                  value={grade.number}
                  disabled={!grade.active}
                >
                  Grade {grade.number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <select
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              className="w-full border rounded-md p-2"
              disabled={!filters.grade}
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.name}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border rounded-md p-2"
            >
              <option value="">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status.toLowerCase()}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 min-w-[200px]"
          >
            {loading ? 'Searching...' : 'Search Questions'}
          </button>
        </div>
      </form>
    </div>
  )
} 