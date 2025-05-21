'use client'
import React, { useState, useEffect, useRef } from 'react'
import Sidebar from '../../../components/layout/Sidebar'
import AdminRoute from '../../../components/auth/AdminRoute'
import StoryArcForm, { StoryArcData } from '../../../components/story-arcs/StoryArcForm'
import { API_BASE_URL, API_HOST } from '@/config/constants'
import ImageUpload from '@/components/questions/ImageUpload'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'

interface StoryArc extends StoryArcData {
    id: number
    image_path?: string
    chapter_number: number
    publish_date: string
}

interface BulkUploadStoryArc {
    theme: string
    goal: string
    chapter_name: string
    outline: string
    status: string
    image_prompt: string
}

export default function StoryArcsManagement() {
    const [showForm, setShowForm] = useState(false)
    const [showBulkUpload, setShowBulkUpload] = useState(false)
    const [storyArcs, setStoryArcs] = useState<StoryArc[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [bulkUploadError, setBulkUploadError] = useState<string | null>(null)
    const [bulkUploadSuccess, setBulkUploadSuccess] = useState(false)
    const formRef = useRef<{ resetFields: () => void }>(null)
    const { user } = useAuth()

    const sampleJson = `[
  {
    "theme": "Countdown to Change",
    "goal": "Introduce character and build tension before the move",
    "chapter_name": "First Day of the Countdown",
    "outline": "Nelo wakes up early, feeling the pressure of upcoming exams. At breakfast, his mom reminds him to focus but also mentions the holiday. At school, Nelo meets his best friend and they joke about failing. A teacher announces the exam schedule — nerves ripple through. Nelo writes in his notebook: 'I'll be ready… I have to be.'",
    "status": "new",
    "image_prompt": "A 12-year-old South African boy named Nelo, in school uniform, standing near the school gate with a notebook in hand. His expression shows determination and anxiety. The morning is slightly cloudy, students are arriving, and the mood feels tense but hopeful. Use the provided headshot of Nelo."
  },
  {
    "theme": "Distraction and Anticipation",
    "goal": "Show Nelo's shifting attention and growing inner conflict",
    "chapter_name": "Classroom Buzz",
    "outline": "During class, Nelo daydreams about the holiday. His friend teases him about cousin Amahle. The teacher gives a surprise quiz. Nelo remembers playing with Amahle. After school, he texts her and gets a funny video back.",
    "status": "new",
    "image_prompt": "Nelo sitting at his desk in a colorful classroom, half-focused on his workbook, eyes slightly glazed. Behind him, classmates are writing a quiz. There's a hint of a smile as he glances at his phone. A playful memory of Amahle is shown as a faint overlay in the background."
  },
  {
    "theme": "Hidden Hints",
    "goal": "Plant the first subtle clues about the move",
    "chapter_name": "Homework and Whispers",
    "outline": "Nelo struggles with homework but doesn't give up. He hears his parents whispering about something official and change. He wonders about Durban. Later, he dreams of the ocean and his grandmother's smile.",
    "status": "new",
    "image_prompt": "Nelo at the dining table late at night, surrounded by books and notes. A door behind him is slightly open with parents' silhouettes talking. His face is tired but determined. The dream scene in a thought bubble: waves, Gogo's face, a warm sunset."
  },
  {
    "theme": "Mixed Signals",
    "goal": "Build emotional tension and foreshadow departure",
    "chapter_name": "Friends and Fears",
    "outline": "Nelo's friend talks about after-school plans. Nelo laughs but feels something different. A classmate jokes about moving. Amahle messages asking if he's ready. He doesn't reply.",
    "status": "new",
    "image_prompt": "A school playground during break. Nelo stands with his friend, smiling but distant. A phone buzzes in his hand with Amahle's message. Around them, kids play and chat, unaware of Nelo's inner unease."
  },
  {
    "theme": "Weekend Uncertainty",
    "goal": "End the week with rising suspense",
    "chapter_name": "A Quiet Weekend Ahead",
    "outline": "Nelo stays after school to revise. At home, his parents quietly pack. Amahle calls and they playfully argue. Nelo promises to visit. That night, he writes: 'Counting down days, not knowing what's next.'",
    "status": "new",
    "image_prompt": "Nelo sitting at a desk under lamplight, scribbling in his notebook. His parents are in the background with half-open suitcases. On his phone screen, Amahle is mid-laugh on a video call. The room is cozy but filled with quiet tension."
  }
]`

    const handleCopySample = () => {
        navigator.clipboard.writeText(sampleJson)
            .then(() => {
                const textarea = document.querySelector('textarea')
                if (textarea) {
                    textarea.value = sampleJson
                }
            })
            .catch(err => {
                console.error('Failed to copy sample JSON:', err)
            })
    }

    const fetchStoryArcs = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await fetch(`${API_HOST}/api/story-arcs`)
            if (!response.ok) {
                throw new Error('Failed to fetch story arcs')
            }
            const data = await response.json()
            setStoryArcs(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching story arcs')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchStoryArcs()
    }, [])

    const handleSubmit = async (data: StoryArcData) => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await fetch(`${API_HOST}/api/story-arcs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                throw new Error('Failed to create story arc')
            }

            const newStoryArc = await response.json()
            setStoryArcs(prev => [...prev, newStoryArc])
            formRef.current?.resetFields()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const handleImageUpload = async (file: File, arcId: number) => {
        if (!user?.uid) return null;

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('imageName', `chapter-${storyArcs.find(arc => arc.id === arcId)?.chapter_number}.png`);

            const response = await fetch(`${API_HOST}/api/upload/image`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to upload image');
            }

            // Update the story arc with the new image path
            setStoryArcs(prev => prev.map(arc =>
                arc.id === arcId
                    ? { ...arc, image_path: result.filename }
                    : arc
            ));

            return result.filename;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    }

    const handleBulkUpload = async (file: File) => {
        setIsLoading(true)
        setBulkUploadError(null)
        setBulkUploadSuccess(false)

        try {
            const text = await file.text()
            // Validate JSON format
            const storyArcs: BulkUploadStoryArc[] = JSON.parse(text)

            // Validate required fields
            const requiredFields = ['theme', 'goal', 'chapter_name', 'outline', 'status', 'image_prompt']
            const invalidArcs = storyArcs.filter(arc =>
                requiredFields.some(field => !arc[field as keyof BulkUploadStoryArc])
            )

            if (invalidArcs.length > 0) {
                throw new Error('Some story arcs are missing required fields')
            }

            const response = await fetch(`${API_HOST}/api/story-arcs/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(storyArcs),
            })

            if (!response.ok) {
                throw new Error('Failed to upload story arcs')
            }

            const result = await response.json()
            setBulkUploadSuccess(true)
            fetchStoryArcs() // Refresh the list
            setShowBulkUpload(false)
        } catch (err) {
            setBulkUploadError(err instanceof Error ? err.message : 'Invalid JSON format')
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleBulkUpload(file)
        }
    }

    return (
        <AdminRoute>
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-6">
                    <h1 className="text-2xl font-semibold mb-6">Story Arcs Management</h1>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-medium">Story Arcs</h2>
                            <div className="space-x-3">
                                <button
                                    onClick={() => setShowBulkUpload(true)}
                                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                >
                                    Bulk Upload
                                </button>
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    Add New Story Arc
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                                {error}
                            </div>
                        )}

                        {isLoading && (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                        )}

                        {!isLoading && storyArcs.length > 0 ? (
                            <div className="space-y-4">
                                {storyArcs.map((arc) => (
                                    <div key={arc.id} className="border rounded-lg p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h3 className="text-lg font-medium">
                                                    {arc.chapter_name} #{arc.chapter_number}
                                                </h3>
                                                <p className="text-gray-600 mt-2">Theme: {arc.theme}</p>
                                                <p className="text-gray-600">Goal: {arc.goal}</p>
                                                <p className="text-gray-600">Publish Date: {new Date(arc.publish_date).toLocaleString()}</p>
                                                <p className="text-gray-600 mt-2">{arc.outline}</p>
                                            </div>
                                            <div>
                                                <ImageUpload
                                                    onFileSelect={(file) => handleImageUpload(file, arc.id)}
                                                    label="Upload Chapter Image"
                                                    imageName={arc.image_path}
                                                    showResetButton={true}
                                                />

                                                <div className="mt-4 relative h-48 w-full">
                                                    <Image
                                                        src={`${API_HOST}/public/learn/learner/get-image?image=chapter-${arc.chapter_number}.png`}
                                                        alt="Chapter Image"
                                                        fill
                                                        className="object-contain"
                                                    />
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : !isLoading && (
                            <div className="space-y-4">
                                <p className="text-gray-500">No story arcs found. Add your first story arc to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showForm && (
                <StoryArcForm
                    ref={formRef}
                    onSubmit={handleSubmit}
                    onClose={() => setShowForm(false)}
                />
            )}

            {showBulkUpload && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                        <h2 className="text-xl font-semibold mb-4">Bulk Upload Story Arcs</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-600">
                                    Upload a JSON file containing story arcs. Each story arc should include theme, goal, chapter_name, outline, status, and image_prompt.
                                </p>
                                <button
                                    onClick={handleCopySample}
                                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                    </svg>
                                    Download Sample JSON
                                </button>
                            </div>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="jsonFileInput"
                                />
                                <label
                                    htmlFor="jsonFileInput"
                                    className="cursor-pointer flex flex-col items-center"
                                >
                                    <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span className="text-sm text-gray-600">
                                        Click to upload or drag and drop
                                    </span>
                                    <span className="text-xs text-gray-500 mt-1">
                                        JSON file only
                                    </span>
                                </label>
                            </div>
                            {bulkUploadError && (
                                <div className="p-3 bg-red-100 text-red-700 rounded">
                                    {bulkUploadError}
                                </div>
                            )}
                            {bulkUploadSuccess && (
                                <div className="p-3 bg-green-100 text-green-700 rounded">
                                    Story arcs uploaded successfully!
                                </div>
                            )}
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowBulkUpload(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminRoute>
    )
} 