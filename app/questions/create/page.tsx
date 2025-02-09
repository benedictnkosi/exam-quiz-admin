'use client'

import { useState } from 'react'
import QuestionForm from '@/components/questions/QuestionForm'

export default function CreateQuestionPage() {
  const [formData, setFormData] = useState({
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
    contextImage: null as File | null,
    questionImage: null as File | null,
    explanationImage: null as File | null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement form submission to backend
    console.log('Form submitted:', formData)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1>Create New Question</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <QuestionForm />
      </div>
    </div>
  )
} 