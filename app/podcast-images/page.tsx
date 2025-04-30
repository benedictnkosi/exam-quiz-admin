'use client'
import React, { useEffect, useState, useRef } from 'react'
import Sidebar from '../../components/layout/Sidebar'
import AdminRoute from '../../components/auth/AdminRoute'
import { API_BASE_URL, API_HOST } from '@/config/constants';
import PodcastCard from './PodcastCard';

interface PodcastImage {
    recordingFileName: string
    lecture_name: string
    image: string | null
    main_topic: string
    id: number
    image_search: string
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
    exam_date?: string
    grade: Grade
    topics?: Record<string, string[]>
}

export default function PodcastImages() {
    const [podcasts, setPodcasts] = useState<PodcastImage[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [selectedSubject, setSelectedSubject] = useState<string>('Physical Sciences P1')
    const [loading, setLoading] = useState(true)
    const [loadingSubjects, setLoadingSubjects] = useState(true)
    const [selectedPodcast, setSelectedPodcast] = useState<PodcastImage | null>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [pasteAreaActive, setPasteAreaActive] = useState(false)
    const pasteAreaRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const response = await fetch(`${API_HOST}/public/learn/subjects/active?grade=12`)
                const data = await response.json()
                if (data.status === 'OK') {
                    setSubjects(data.subjects)
                }
            } catch (error) {
                console.error('Error fetching subjects:', error)
            } finally {
                setLoadingSubjects(false)
            }
        }

        fetchSubjects()
    }, [])

    useEffect(() => {
        const fetchPodcasts = async () => {
            setLoading(true)
            try {
                const response = await fetch(`${API_HOST}/api/topics/recordings/${selectedSubject}`)
                const data = await response.json()
                if (data.status === 'success') {
                    setPodcasts(data.data)
                }
            } catch (error) {
                console.error('Error fetching podcasts:', error)
            } finally {
                setLoading(false)
            }
        }

        if (selectedSubject) {
            fetchPodcasts()
        }
    }, [selectedSubject])

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedPodcast || !event.target.files?.length) return

        const file = event.target.files[0]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('topicId', selectedPodcast.id.toString())

        setUploading(true)
        setUploadError(null)

        try {
            const response = await fetch(`${API_HOST}/public/learn/chat/upload-lecture-image`, {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                throw new Error('Failed to upload image')
            }

            // Refresh the podcasts list to show the new image
            const fetchResponse = await fetch(`${API_HOST}/api/topics/recordings/${selectedSubject}`)
            const fetchData = await fetchResponse.json()
            if (fetchData.status === 'success') {
                setPodcasts(fetchData.data)
            }

            setSelectedPodcast(null)
        } catch (error) {
            console.error('Error uploading image:', error)
            setUploadError('Failed to upload image. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    const handlePaste = async (event: React.ClipboardEvent) => {
        const items = event.clipboardData.items
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile()
                if (file) {
                    const formData = new FormData()
                    formData.append('file', file)
                    if (selectedPodcast) {
                        formData.append('topic_id', selectedPodcast.id.toString())
                    }

                    setUploading(true)
                    setUploadError(null)

                    try {
                        const response = await fetch(`${API_HOST}/public/learn/chat/upload-lecture-image`, {
                            method: 'POST',
                            body: formData,
                        })

                        if (!response.ok) {
                            throw new Error('Failed to upload image')
                        }

                        // Refresh the podcasts list to show the new image
                        const fetchResponse = await fetch(`${API_HOST}/api/topics/recordings/${selectedSubject}`)
                        const fetchData = await fetchResponse.json()
                        if (fetchData.status === 'success') {
                            setPodcasts(fetchData.data)
                        }
                    } catch (error) {
                        console.error('Error uploading image:', error)
                        setUploadError('Failed to upload image. Please try again.')
                    } finally {
                        setUploading(false)
                    }
                }
            }
        }
    }

    return (
        <AdminRoute>
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold">Podcast Images</h1>
                        <div className="w-64">
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {loadingSubjects ? (
                                    <option>Loading subjects...</option>
                                ) : (
                                    subjects.map((subject) => (
                                        <option key={subject.id} value={subject.name}>
                                            {subject.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {podcasts.map((podcast) => (
                                <PodcastCard
                                    key={podcast.id}
                                    podcast={podcast}
                                    selectedSubject={selectedSubject}
                                    API_HOST={API_HOST}
                                    setPodcasts={setPodcasts}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminRoute>
    )
} 