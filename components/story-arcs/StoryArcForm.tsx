'use client'
import React, { useState, forwardRef, useImperativeHandle } from 'react'

interface StoryArcFormProps {
    onSubmit: (data: StoryArcData) => void
    onClose: () => void
}

export interface StoryArcData {
    theme: string
    goal: string
    chapter_name: string
    outline: string
    status: string
}

export interface StoryArcFormRef {
    resetFields: () => void
}

const StoryArcForm = forwardRef<StoryArcFormRef, StoryArcFormProps>(({ onSubmit, onClose }, ref) => {
    const [formData, setFormData] = useState<StoryArcData>({
        theme: '',
        goal: '',
        chapter_name: '',
        outline: '',
        status: 'new'
    })

    const resetFields = () => {
        setFormData(prev => ({
            ...prev,
            chapter_name: '',
            outline: ''
        }))
    }

    useImperativeHandle(ref, () => ({
        resetFields
    }))

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Add New Story Arc</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Theme
                        </label>
                        <input
                            type="text"
                            name="theme"
                            value={formData.theme}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Goal
                        </label>
                        <input
                            type="text"
                            name="goal"
                            value={formData.goal}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Chapter Name
                        </label>
                        <input
                            type="text"
                            name="chapter_name"
                            value={formData.chapter_name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Outline
                        </label>
                        <textarea
                            name="outline"
                            value={formData.outline}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows={4}
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Create Story Arc
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
})

StoryArcForm.displayName = 'StoryArcForm'

export default StoryArcForm 