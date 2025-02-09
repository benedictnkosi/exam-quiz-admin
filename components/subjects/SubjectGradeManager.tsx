'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSubjectsForGrade, updateSubjectGradeStatus, addSubject, getSubjectNames } from '@/services/api'
import type { Subject } from '@/types/subjects'

export default function SubjectGradeManager({ gradeId }: { gradeId: string }) {
    const { user } = useAuth()
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedSubject, setSelectedSubject] = useState('')
    const [isAddingSubject, setIsAddingSubject] = useState(false)

    const fetchSubjects = useCallback(async () => {
        if (!user?.uid) return

        try {
            const data = await getSubjectsForGrade(gradeId, user.uid)
            setSubjects(data.subjects || [])
        } catch (err) {
            setError('Failed to load subjects')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [gradeId, user?.uid])

    const fetchAvailableSubjects = useCallback(async () => {
        try {
            const names = await getSubjectNames()
            setAvailableSubjects(names)
        } catch (err) {
            console.error('Error fetching subject names:', err)
            setError('Failed to load available subjects')
        }
    }, [])

    useEffect(() => {
        fetchSubjects()
        fetchAvailableSubjects()
    }, [fetchSubjects, fetchAvailableSubjects])

    const toggleSubjectStatus = async (subjectId: number, currentStatus: boolean) => {
        if (!user?.uid) return

        try {
            await updateSubjectGradeStatus({
                subject_id: subjectId,
                grade: parseInt(gradeId),
                active: !currentStatus
            }, user.uid)

            // Update local state
            setSubjects(subjects.map(subject =>
                subject.id === subjectId
                    ? { ...subject, active: !currentStatus }
                    : subject
            ))
        } catch (err) {
            console.error('Error updating subject status:', err)
            setError('Failed to update subject status')
        }
    }

    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.uid || !selectedSubject) return

        setIsAddingSubject(true)
        setError('')

        try {
            await addSubject({
                name: selectedSubject,
                grade: parseInt(gradeId)
            }, user.uid)

            // Refresh the subjects list
            await fetchSubjects()
            setSelectedSubject('')
        } catch (err) {
            console.error('Error adding subject:', err)
            setError('Failed to add subject')
        } finally {
            setIsAddingSubject(false)
        }
    }

    if (loading) return <div>Loading subjects...</div>
    if (error) return <div className="text-red-500">{error}</div>

    // Filter out subjects that are already added to this grade
    const unusedSubjects = availableSubjects.filter(
        name => !subjects.some(subject => subject.name === name)
    )

    return (
        <div className="space-y-6">
            {/* Add Subject Form */}
            <div className="bg-white p-4 rounded-lg shadow">
                <form onSubmit={handleAddSubject} className="flex gap-3">
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="flex-1 min-w-0 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        disabled={isAddingSubject}
                    >
                        <option value="">Select a subject</option>
                        {unusedSubjects.map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
                    <button
                        type="submit"
                        disabled={isAddingSubject || !selectedSubject}
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {isAddingSubject ? 'Adding...' : 'Add Subject'}
                    </button>
                </form>
            </div>

            {/* Existing Subjects List */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Current Subjects</h3>
                {subjects.length === 0 ? (
                    <p className="text-gray-500">No subjects found for this grade.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {subjects.map((subject) => (
                            <div
                                key={subject.id}
                                className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
                            >
                                <span className={`${subject.active ? 'text-gray-900' : 'text-gray-500'}`}>
                                    {subject.name}
                                </span>
                                <button
                                    onClick={() => toggleSubjectStatus(subject.id, subject.active)}
                                    className={`px-4 py-2 rounded ${subject.active
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                        }`}
                                >
                                    {subject.active ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
} 