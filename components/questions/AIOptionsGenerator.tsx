'use client'

import { useState } from 'react'

interface AIOptionsGeneratorProps {
  questionText: string
  context?: string
  correctAnswer: string
  onOptionsGenerated: (options: string[]) => void
  disabled?: boolean
}

export default function AIOptionsGenerator({
  questionText,
  context = '',
  correctAnswer,
  onOptionsGenerated,
  disabled = false
}: AIOptionsGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerateOptions = async () => {
    if (!questionText || !correctAnswer) {
      setError('Question and correct answer are required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "user",
              content: `question: ${questionText}. context: ${context}. Correct Answer: ${correctAnswer}. Give me exactly 3 wrong answers for this question. I am setting up a mock test. separate the answers by an underscore sign, do not number the answers, do not return the string as json, do not add new line to the string`
            }
          ]
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to generate options')
      }

      const generatedText = data.choices[0].message.content
      const wrongOptions = generatedText.split('_').filter(Boolean)

      // Always put correct answer as option 4
      const allOptions = [...wrongOptions.slice(0, 3), correctAnswer]
      onOptionsGenerated(allOptions)
    } catch (err) {
      console.error('Failed to generate options:', err)
      setError('Failed to generate options. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleGenerateOptions}
        disabled={disabled || loading}
        className={`px-4 py-2 text-sm rounded-md ${disabled || loading
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'text-blue-600 border border-blue-600 hover:bg-blue-50'
          }`}
      >
        {loading ? 'Generating...' : 'Generate Options with AI'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
} 