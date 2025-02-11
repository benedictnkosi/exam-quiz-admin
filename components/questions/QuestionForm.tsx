'use client'

import { useState, useEffect } from 'react'
import ImageUpload from './ImageUpload'
import {
  createQuestion,
  uploadQuestionImage,
  type QuestionPayload,
  getGrades,
  getActiveSubjects,
  type DetailedQuestion
} from '@/services/api'
import { API_BASE_URL } from '../../config/constants.js'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AIOptionsGenerator from './AIOptionsGenerator'

interface ImageInfo {
  file: File | null
  path?: string  // Only used for context images
  isNew: boolean // Only used for context images
}

interface FormData {
  questionText: string
  examYear: number
  grade: string
  subject: string
  questionType: string
  term: string
  context: string
  answer: string
  explanation: string
  options: string[]
  contextImage: ImageInfo | null
  questionImage: File | null  // Simplified to just File
  explanationImage: File | null  // Simplified to just File
}

interface QuestionFormProps {
  initialData?: DetailedQuestion
  mode?: 'create' | 'edit'
  onSuccess?: () => void
}

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

interface ApiResponse {
  status: 'OK' | 'NOK'
  message?: string
  question_id?: number
}

export default function QuestionForm({ initialData, mode = 'create', onSuccess }: QuestionFormProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [grades, setGrades] = useState<Grade[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loadingGrades, setLoadingGrades] = useState(true)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [lastContextImage, setLastContextImage] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)

  const initialFormState = {
    questionText: '',
    examYear: new Date().getFullYear(),
    grade: '',
    subject: '',
    questionType: 'single',
    term: '',
    context: '',
    answer: '',
    explanation: '',
    options: ['', '', '', ''],
    contextImage: null,
    questionImage: null,
    explanationImage: null,
  }

  const [formData, setFormData] = useState<FormData>(() => {
    if (initialData) {
      // Convert API question type to form question type
      const questionType = initialData.type === 'multiple_choice' ? 'multiple' :
        initialData.type === 'true_false' ? 'true_false' : 'single'

      // Parse the answer if it's a string representation of an array
      let parsedAnswer = initialData.answer
      try {
        if (typeof initialData.answer === 'string' && initialData.answer.startsWith('[')) {
          const parsed = JSON.parse(initialData.answer)
          parsedAnswer = Array.isArray(parsed) ? parsed[0] : parsed
        }
      } catch (e) {
        console.error('Error parsing answer:', e)
      }

      return {
        questionText: initialData.question || '',
        examYear: initialData.year || new Date().getFullYear(),
        grade: initialData.subject?.grade?.number?.toString() || '',
        subject: initialData.subject?.id?.toString() || '',
        questionType: questionType, // Use the converted question type
        term: initialData.term?.toString() || '',
        context: initialData.context || '',
        answer: parsedAnswer || '',
        explanation: initialData.explanation || '',
        options: [
          initialData.options?.option1 || '',
          initialData.options?.option2 || '',
          initialData.options?.option3 || '',
          initialData.options?.option4 || '',
        ],
        contextImage: initialData.image_path ? {
          file: null,
          path: initialData.image_path,
          isNew: false
        } : null,
        questionImage: null,
        explanationImage: null,
      }
    }
    return initialFormState
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
        const subjectsData = await getActiveSubjects(formData.grade)
        setSubjects(subjectsData)

        // Only set subject if in edit mode and we have initialData
        if (initialData && mode === 'edit') {
          setFormData(prev => ({
            ...prev,
            subject: initialData.subject.name
          }))
        } else {
          setFormData(prev => ({ ...prev, subject: '' }))
        }
      } catch (err) {
        console.error('Failed to fetch subjects:', err)
        setError('Failed to load subjects')
      } finally {
        setLoadingSubjects(false)
      }
    }

    fetchSubjects()
  }, [formData.grade, initialData, mode])

  const terms = ['1', '2', '3', '4']

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData({ ...formData, options: newOptions })
  }

  const handleImageChange = (field: 'contextImage' | 'questionImage' | 'explanationImage') =>
    (file: File | null, imagePath?: string) => {
      if (field === 'contextImage') {
        const newContextImage = file ? {
          file,
          path: imagePath || '',
          isNew: !imagePath
        } : null;
        setFormData({
          ...formData,
          [field]: newContextImage
        });
        if (file) {
          setLastContextImage(null); // Clear last used when new file selected
        }
      } else {
        setFormData({
          ...formData,
          [field]: file
        });
      }
    }

  const handleReuseContextImage = () => {
    if (lastContextImage) {
      setFormData(prev => ({
        ...prev,
        contextImage: {
          file: null,
          path: lastContextImage,
          isNew: false
        }
      }));
    }
  }

  const handleResetContextImage = () => {
    setFormData(prev => ({
      ...prev,
      contextImage: null
    }));
    setLastContextImage(null);
  }

  const isMultipleChoice = formData.questionType === 'multiple'

  const handleImageUpload = async (file: File, type: 'question_context' | 'question' | 'answer', qId: string) => {
    if (!user?.uid) return null;

    try {
      const response = await uploadQuestionImage(
        file,
        qId,
        type,
        user.uid
      )
      return response.fileName
    } catch (error) {
      console.error(`Error uploading ${type} image:`, error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.uid) return

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      if (!user?.email) {
        throw new Error('User email not found')
      }

      if (isMultipleChoice && formData.options.some(option => !option.trim())) {
        throw new Error('All options are required for multiple choice questions')
      }

      const payload: QuestionPayload = {
        question: formData.questionText,
        type: formData.questionType === 'single' ? 'single' :
          formData.questionType === 'multiple' ? 'multiple_choice' : 'true_false',
        subject: formData.subject,
        context: formData.context || '',
        answer: formData.answer,
        options: {
          option1: formData.options[0],
          option2: formData.options[1],
          option3: formData.options[2],
          option4: formData.options[3],
        },
        explanation: formData.explanation || '',
        year: formData.examYear,
        term: formData.term,
        capturer: user.email,
        uid: user.uid,
        question_id: mode === 'edit' && initialData ? initialData.id : 0  // Set proper question_id for updates
      }

      const response: ApiResponse = await createQuestion(payload)

      if (response.status === 'NOK') {
        throw new Error(response.message || 'Failed to create question')
      }

      const questionId = response.question_id
      if (!questionId) {
        throw new Error('Question ID not received from server')
      }

      // Handle context image - only upload if it's a new file
      if (formData.contextImage?.file && formData.contextImage.isNew) {
        const fileName = await handleImageUpload(formData.contextImage.file, 'question_context', questionId.toString())
        if (fileName) {
          setLastContextImage(fileName);
        }
      } else if (formData.contextImage?.path) {
        // Reuse existing context image
        await fetch(`${API_BASE_URL}/question/set-image-path`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question_id: questionId.toString(),
            image_name: formData.contextImage.path,
            image_type: 'question_context',
            uid: user.uid
          })
        })
      }

      // Handle other images normally...
      if (formData.questionImage) {
        await handleImageUpload(formData.questionImage, 'question', questionId.toString())
      }

      if (formData.explanationImage) {
        await handleImageUpload(formData.explanationImage, 'answer', questionId.toString())
      }

      setSuccess(true)
      // Only reset question-specific fields
      setFormData(prev => ({
        ...prev,
        questionText: '',
        context: '',
        answer: '',
        explanation: '',
        options: ['', '', '', ''],
        contextImage: null,
        questionImage: null,
        explanationImage: null,
      }))
      setResetKey(prev => prev + 1) // Still reset images
      // Call onSuccess if provided (for edit mode)
      if (mode === 'edit') {
        onSuccess?.()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create question')
      console.error('Error creating question:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">
              Question Text
            </label>
            <textarea
              value={formData.questionText}
              onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
              required
            />
            <ImageUpload
              key={`question-image-${resetKey}`}
              onFileSelect={handleImageChange('questionImage')}
              label="Upload Question Image"
              imageName={formData.questionImage ? undefined : undefined}
            />
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
                <option key={grade.id} value={grade.number}>
                  Grade {grade.number}
                </option>
              ))}
            </select>
            {loadingGrades && (
              <p className="text-sm text-gray-500 mt-1">Loading grades...</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Subject
            </label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
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
            {loadingSubjects && (
              <p className="text-sm text-gray-500 mt-1">Loading subjects...</p>
            )}
            {!formData.grade && (
              <p className="text-sm text-gray-500 mt-1">Select a grade first</p>
            )}
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

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">
              Question Type
            </label>
            <select
              value={formData.questionType}
              onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="single">Single Answer</option>
              <option value="multiple">Multiple Choice</option>
              <option value="true_false">True/False</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">
              Question Context (Optional)
            </label>
            <textarea
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value })}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            />
            <ImageUpload
              key={`context-image-${resetKey}`}
              onFileSelect={handleImageChange('contextImage')}
              label="Upload Context Image (Optional)"
              imageName={formData.contextImage?.path}
              showReuseOption={true}
              lastUsedImage={lastContextImage}
              onReuseImage={handleReuseContextImage}
              onResetImage={handleResetContextImage}
              showResetButton={true}
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm text-gray-700">Answer</label>
            </div>
            <input
              type="text"
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              className="w-full border border-gray-300 rounded p-2"
              required
            />
          </div>

          {formData.questionType === 'multiple' && (
            <div className="md:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm text-gray-700">Answer Options</label>
                <AIOptionsGenerator
                  questionText={formData.questionText}
                  context={formData.context}
                  correctAnswer={formData.answer}
                  disabled={!formData.questionText || !formData.answer}
                  onOptionsGenerated={(options) => {
                    setFormData(prev => ({
                      ...prev,
                      options: options // No need to filter or shuffle, correct answer is always last
                    }))
                  }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.options.map((option, index) => (
                  <div key={index}>
                    <label className="block text-xs text-gray-500 mb-1">
                      Option {index + 1}
                      {index === 3 && ' (Correct Answer)'}
                    </label>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={isMultipleChoice}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">
              Answer Explanation (Optional)
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            />
            <ImageUpload
              key={`explanation-image-${resetKey}`}
              onFileSelect={handleImageChange('explanationImage')}
              label="Upload Explanation Image (Optional)"
              imageName={formData.explanationImage ? undefined : undefined}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded space-y-1">
            <p>Question {mode === 'edit' ? 'updated' : 'created'} successfully!</p>
            {formData.contextImage?.path && !formData.contextImage.isNew && (
              <p className="text-sm">
                Used existing image: <span className="font-medium">{formData.contextImage.path}</span>
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : mode === 'edit' ? 'Update Question' : 'Create Question'}
          </button>
        </div>
      </form>
    </div>
  )
} 