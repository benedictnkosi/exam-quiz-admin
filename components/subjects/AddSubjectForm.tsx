'use client'

import { useState } from 'react'

interface AddSubjectFormProps {
  onAddSubject: (name: string) => void
}

export default function AddSubjectForm({ onAddSubject }: AddSubjectFormProps) {
  const [subjectName, setSubjectName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!subjectName.trim()) {
      setError('Subject name is required')
      return
    }

    onAddSubject(subjectName.trim())
    setSubjectName('')
    setError('')
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-medium mb-4">Add New Subject</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="subjectName" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Subject Name
          </label>
          <input
            id="subjectName"
            type="text"
            value={subjectName}
            onChange={(e) => {
              setSubjectName(e.target.value)
              setError('')
            }}
            className="w-full border rounded-md p-2"
            placeholder="Enter subject name"
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Subject
        </button>
      </form>
    </div>
  )
} 