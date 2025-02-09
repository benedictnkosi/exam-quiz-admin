'use client'

import { useState, useEffect } from 'react'
import { getGrades, type Grade } from '@/services/api'
import SubjectGradeManager from './SubjectGradeManager'

export default function GradeSubjectManager() {
    const [selectedGrade, setSelectedGrade] = useState<string>('')
    const [grades, setGrades] = useState<Grade[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const gradesData = await getGrades()
                setGrades(gradesData)
            } catch (err) {
                setError('Failed to load grades')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchGrades()
    }, [])

    if (loading) return <div className="p-4">Loading...</div>
    if (error) return <div className="p-4 text-red-500">{error}</div>

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-8">
                {/* Grade Selection */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Select Grade</h2>
                    <div className="flex flex-wrap gap-2">
                        {grades.map((grade) => (
                            <button
                                key={grade.id}
                                onClick={() => setSelectedGrade(grade.number.toString())}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                                    ${selectedGrade === grade.number.toString()
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Grade {grade.number}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Subject Management */}
                {selectedGrade && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">
                            Manage Subjects for Grade {selectedGrade}
                        </h2>
                        <SubjectGradeManager gradeId={selectedGrade} />
                    </div>
                )}
            </div>
        </div>
    )
} 