'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Thread, getThreadsBySubject, createThread } from '@/services/threads'
import { useSearchParams } from 'next/navigation'

// Helper function to get subject icon
function getSubjectIcon(subjectName: string): string {
  const nameMap: { [key: string]: string } = {
    'Physical Sciences': 'physics',
    'Agricultural Sciences': 'agriculture',
    'Mathematical Literacy': 'maths',
    'Life Sciences': 'life-science',
    'Business Studies': 'business-studies',
    'Life Orientation': 'life-orientation',
    'Economics': 'economics',
    'Geography': 'geography',
    'History': 'history',
    'Tourism': 'tourism',
    'Mathematics': 'mathematics'
  }

  const mappedName = nameMap[subjectName] || subjectName.toLowerCase().replace(/\s+/g, '-')
  return `/images/subjects/${mappedName}.png`
}

export default function ThreadsPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [threads, setThreads] = useState<Thread[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewThreadModal, setShowNewThreadModal] = useState(false)
  const [newThreadTitle, setNewThreadTitle] = useState('')
  const [subjectName, setSubjectName] = useState<string>('')
  const [grade, setGrade] = useState<number>(0)

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setIsLoading(true)
        const name = searchParams.get('subjectName')
        const gradeParam = searchParams.get('grade')
        
        if (!name || !gradeParam) {
          console.error('Subject name or grade not provided')
          return
        }

        const gradeNumber = parseInt(gradeParam)
        if (isNaN(gradeNumber)) {
          console.error('Invalid grade number')
          return
        }

        setSubjectName(name)
        setGrade(gradeNumber)

        // Fetch threads for this subject and grade
        const threadsData = await getThreadsBySubject(name, gradeNumber)
        setThreads(threadsData)
      } catch (error) {
        console.error('Error loading threads:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchThreads()
  }, [searchParams])

  const handleCreateThread = async () => {
    if (!newThreadTitle.trim() || !user?.uid) return

    try {
      const newThread = await createThread({
        title: newThreadTitle,
        subjectId: params.id,
        subjectName,
        grade,
        createdById: user.uid,
        createdByName: user.displayName || 'Anonymous'
      })

      setThreads(prev => [newThread, ...prev])
      setNewThreadTitle('')
      setShowNewThreadModal(false)
    } catch (error) {
      console.error('Error creating thread:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1B1464] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading threads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1B1464] text-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-white hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex items-center gap-3">
                <Image
                  src={getSubjectIcon(subjectName)}
                  alt={subjectName}
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <div>
                  <h1 className="text-2xl font-bold">{subjectName}</h1>
                  <p className="text-sm text-gray-300">Grade {grade}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowNewThreadModal(true)}
              className="bg-white/20 hover:bg-white/30 text-white rounded-xl py-2 px-4 transition-colors"
            >
              New Discussion
            </button>
          </div>
        </div>

        {/* Threads List */}
        <div className="space-y-4">
          {threads.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4">
                <svg className="w-full h-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-xl font-semibold mb-2">No discussions yet</p>
              <p className="text-gray-400">Be the first to start a discussion!</p>
            </div>
          ) : (
            threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/messages/${thread.id}`}
                className="block bg-white/10 backdrop-blur-lg rounded-xl p-6 hover:bg-white/20 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{thread.title}</h3>
                    <p className="text-sm text-gray-300">
                      Started by {thread.createdByName} • {thread.createdAt.toLocaleDateString()}
                    </p>
                    {thread.lastMessage && (
                      <p className="text-sm text-gray-400 mt-2 line-clamp-1">{thread.lastMessage}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {typeof thread.unreadCount === 'number' && thread.unreadCount > 0 && (
                      <div className="bg-indigo-600 text-white text-sm px-3 py-1 rounded-full">
                        new
                      </div>
                    )}
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* New Thread Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Discussion</h2>
              <button
                onClick={() => setShowNewThreadModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              placeholder="Discussion title..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              maxLength={100}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewThreadModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateThread}
                disabled={!newThreadTitle.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Discussion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 