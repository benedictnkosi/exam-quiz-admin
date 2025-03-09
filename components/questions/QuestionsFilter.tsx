'use client'

import { useState, useEffect } from 'react'
import { getGrades, getActiveSubjects, type Grade } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { API_BASE_URL } from '@/config/constants'

// Define interfaces for the new nested subject response format
interface Paper {
  id: number;
  name: string;
}

interface SubjectCategory {
  name: string;
  papers: Paper[];
}

interface GradeSubjects {
  grade: number;
  subjects: SubjectCategory[];
}

interface SubjectsResponse {
  status: string;
  subjects: GradeSubjects[];
}

interface QuestionsFilterProps {
  filters: {
    grade: string
    subject: string
    status: string
  }
  setFilters: (filters: { grade: string; subject: string; status: string }) => void
  onSearch: () => void
  onFetchRejected: () => void
}

export default function QuestionsFilter({ filters, setFilters, onSearch, onFetchRejected }: QuestionsFilterProps) {
  const { user } = useAuth()
  const [grades, setGrades] = useState<Grade[]>([])
  const [subjectGroups, setSubjectGroups] = useState<GradeSubjects[]>([])
  const [papers, setPapers] = useState<Paper[]>([])
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
          const response = await fetch(`${API_BASE_URL}/subjects/active?grade=${filters.grade}`);
          const data: SubjectsResponse = await response.json();

          if (data.status === 'OK' && data.subjects && data.subjects.length > 0) {
            setSubjectGroups(data.subjects);

            // Flatten all papers into a single array for the dropdown
            const allPapers: Paper[] = [];
            data.subjects.forEach(gradeSubject => {
              gradeSubject.subjects.forEach(subject => {
                subject.papers.forEach(paper => {
                  allPapers.push(paper);
                });
              });
            });

            setPapers(allPapers);
          } else {
            setPapers([]);
          }
        } catch (err) {
          console.error('Failed to fetch subjects:', err)
          setPapers([]);
        }
      }
      fetchSubjects()
    } else {
      setPapers([])
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
              {subjectGroups.length > 0 && subjectGroups[0].subjects.map(category => (
                <optgroup key={category.name} label={category.name}>
                  {category.papers.map(paper => (
                    <option key={paper.id} value={paper.id.toString()}>
                      {paper.name}
                    </option>
                  ))}
                </optgroup>
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

        <div className="flex justify-center space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 min-w-[200px]"
          >
            {loading ? 'Searching...' : 'Search Questions'}
          </button>

          {user?.email && (
            <button
              type="button"
              onClick={onFetchRejected}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-w-[200px]"
            >
              My Rejected Questions
            </button>
          )}
        </div>
      </form>
    </div>
  )
} 