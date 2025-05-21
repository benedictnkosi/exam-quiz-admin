import { useState, useEffect } from 'react'
import { API_BASE_URL, getGrades } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'

interface Grade {
    id: number
    number: number
    active: number
}

interface Subject {
    id: number
    name: string
    active: boolean
    grade: {
        id: number
        number: number
        active: number
    }
}

interface BulkCreateQuestionModalProps {
    onClose: () => void
    onSuccess: () => void
}

export default function BulkCreateQuestionModal({ onClose, onSuccess }: BulkCreateQuestionModalProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [grades, setGrades] = useState<Grade[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loadingGrades, setLoadingGrades] = useState(true)
    const [loadingSubjects, setLoadingSubjects] = useState(false)
    const [formData, setFormData] = useState({
        grade: '',
        examYear: new Date().getFullYear(),
        subject: '',
        subjectId: 0,
        term: '',
        jsonInput: ''
    })

    const terms = ['1', '2', '3', '4']

    const [stats, setStats] = useState({
        completed: 0,
        failed: 0,
        total: 0
    })

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const gradesData = await getGrades()
                setGrades(gradesData)
            } catch (err) {
                console.error('Failed to fetch grades:', err)
                setError('Failed to load grades')
            } finally {
                setLoadingGrades(false)
            }
        }

        fetchGrades()
    }, [])

    useEffect(() => {
        const fetchSubjects = async () => {
            if (!formData.grade) {
                setSubjects([])
                return
            }

            setLoadingSubjects(true)

            try {
                const response = await fetch(`${API_BASE_URL}/subjects/active?grade=${formData.grade}`)
                const data = await response.json()

                if (data.status === 'OK' && data.subjects) {
                    const filteredSubjects = data.subjects.filter((subject: Subject) =>
                        !subject.name.includes('Consumer') &&
                        !subject.name.includes('Management') &&
                        !subject.name.includes('Religion')
                    )
                    setSubjects(filteredSubjects)
                } else {
                    setSubjects([])
                }
            } catch (err) {
                console.error('Failed to fetch subjects:', err)
                setError('Failed to load subjects')
                setSubjects([])
            } finally {
                setLoadingSubjects(false)
            }
        }

        fetchSubjects()
    }, [formData.grade])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.uid || !user?.email) {
            setError('User not authenticated')
            return
        }

        setLoading(true)
        setError('')
        setSuccess(false)
        setStats({ completed: 0, failed: 0, total: 0 })

        try {
            // Parse the JSON input
            const questions = JSON.parse(formData.jsonInput)
            if (!Array.isArray(questions)) {
                throw new Error('Input must be an array of questions')
            }

            setStats(prev => ({ ...prev, total: questions.length }))
            let successCount = 0
            let failureCount = 0
            let errors: string[] = []

            // Process each question
            for (const question of questions) {
                const payload = {
                    ...question,
                    // Set default values
                    type: "multiple_choice",
                    context: question.context || "",
                    capturer: user.email,
                    uid: user.uid,
                    question_id: 0,
                    curriculum: "CAPS",
                    // Add form-level values
                    grade: formData.grade,
                    year: formData.examYear,
                    term: formData.term,
                    subject: formData.subject,
                    subject_id: formData.subjectId
                }

                try {
                    const response = await fetch(`${API_BASE_URL}/question/create`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    })

                    const result = await response.json()
                    if (result.status === 'NOK') {
                        if (result.message?.includes('A question with the same subject and text already exists')) {
                            // Skip duplicate questions
                            console.log('Skipping duplicate question:', question.question)
                            continue
                        }
                        throw new Error(result.message || 'Failed to create question')
                    }
                    successCount++
                } catch (err) {
                    failureCount++
                    const errorMessage = err instanceof Error ? err.message : 'Failed to create question'
                    errors.push(`Question "${question.question?.substring(0, 50)}...": ${errorMessage}`)
                }
            }

            setStats({
                completed: successCount,
                failed: failureCount,
                total: questions.length
            })

            if (successCount > 0) {
                setSuccess(true)
                // Reset only the JSON input field, keeping other selections
                setFormData(prev => ({
                    ...prev,
                    jsonInput: ''
                }))
                // Call onSuccess to refresh the questions list without closing modal
                onSuccess()
            }

            if (errors.length > 0) {
                setError(errors.join('\n'))
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create questions')
            console.error('Error creating questions:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Bulk Create Questions</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">
                                Grade
                            </label>
                            <select
                                value={formData.grade}
                                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={loadingGrades}
                            >
                                <option value="">Select Grade</option>
                                {grades.map((grade) => (
                                    <option key={grade.id} value={grade.number.toString()}>
                                        Grade {grade.number}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-700 mb-1">
                                Exam Year
                            </label>
                            <input
                                type="number"
                                value={formData.examYear}
                                onChange={(e) => setFormData({ ...formData, examYear: parseInt(e.target.value) })}
                                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-700 mb-1">
                                Subject
                            </label>
                            <select
                                value={formData.subject}
                                onChange={(e) => {
                                    const selectedSubject = subjects.find(s => s.name === e.target.value)
                                    setFormData(prev => ({
                                        ...prev,
                                        subject: e.target.value,
                                        subjectId: selectedSubject?.id || 0
                                    }))
                                }}
                                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={loadingSubjects || !formData.grade}
                            >
                                <option value="">Select Subject</option>
                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.name}>
                                        {subject.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-700 mb-1">
                                Term
                            </label>
                            <select
                                value={formData.term}
                                onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select Term</option>
                                {terms.map((term) => (
                                    <option key={term} value={term}>
                                        Term {term}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-700 mb-1">
                            Questions JSON
                        </label>
                        <textarea
                            value={formData.jsonInput}
                            onChange={(e) => setFormData({ ...formData, jsonInput: e.target.value })}
                            className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-64 font-mono text-sm"
                            placeholder="Paste your questions JSON array here..."
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded whitespace-pre-line">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                            <p>Questions created successfully!</p>
                            <p className="text-sm mt-2">
                                Completed: {stats.completed} | Failed: {stats.failed} | Total: {stats.total}
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Creating Questions...' : 'Create Questions'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
} 