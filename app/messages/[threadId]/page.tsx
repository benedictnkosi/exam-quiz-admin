'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { collection, query, where, onSnapshot, addDoc, orderBy, doc, getDoc, limit, startAfter, getDocs, deleteDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { markThreadAsRead } from '@/services/threads'

interface Message {
  id: string
  text: string
  authorUID: string
  createdAt: Date
  threadId: string
  userName: string
  avatar?: string
  replyTo?: {
    id: string
    text: string
    userName: string
  }
  attachment?: {
    url: string
    type: 'image' | 'pdf'
    name: string
  }
}

interface Thread {
  id: string
  title: string
  subjectName: string
  grade: number
  createdById: string
  createdByName: string
  createdAt: Date
}

const MESSAGES_PER_PAGE = 100

// Basic profanity detection
const PROFANITY_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn', 'crap', 'dick', 'piss', 'wanker',
  'cunt', 'bollocks', 'prick', 'twat', 'bugger', 'slut', 'whore', 'arse', 'douche',
  'jackass', 'motherfucker', 'faggot', 'nigger', 'spic', 'chink', 'kike', 'retard',
  'gook', 'tranny', 'hoe', 'cock', 'pussy', 'tit', 'boob', 'cum', 'dildo', 'fag',
  'skank', 'slag', 'tosser', 'wank', 'bollock', 'minge', 'shag', 'git', 'bellend'
]

function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase()
  return PROFANITY_WORDS.some(word => lowerText.includes(word))
}

export default function ThreadMessagesPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const threadId = params.threadId as string
  const [messages, setMessages] = useState<Message[]>([])
  const [thread, setThread] = useState<Thread | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [lastVisible, setLastVisible] = useState<any>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [contextMenu, setContextMenu] = useState<{x: number; y: number; message: Message} | null>(null)

  useEffect(() => {
    if (!threadId) {
      setLoadError('Missing thread ID')
      setIsLoading(false)
      return
    }

    loadThreadAndMessages()
    // Mark thread as read when component mounts
    markThreadAsRead(threadId)

    return () => {
      // Cleanup subscription if needed
    }
  }, [threadId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadThreadAndMessages = async () => {
    try {
      setIsLoading(true)
      setLoadError(null)

      // Load thread details
      const threadDoc = await getDoc(doc(db, 'threads', threadId))
      if (!threadDoc.exists()) {
        setLoadError('Thread not found')
        setIsLoading(false)
        return
      }

      const threadData = {
        id: threadDoc.id,
        ...threadDoc.data(),
        createdAt: threadDoc.data().createdAt.toDate()
      } as Thread
      setThread(threadData)

      // Set up initial messages query with limit
      const messagesRef = collection(db, 'messages')
      const q = query(
        messagesRef,
        where('threadId', '==', threadId),
        orderBy('createdAt', 'desc'),
        limit(MESSAGES_PER_PAGE)
      )

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate()
        })) as Message[]

        setMessages(messagesData.reverse())
        setLastVisible(snapshot.docs[snapshot.docs.length - 1])
        setHasMoreMessages(snapshot.docs.length === MESSAGES_PER_PAGE)
        setIsLoading(false)
      }, (error) => {
        console.error('Error listening to messages:', error)
        setLoadError('Failed to load messages')
        setIsLoading(false)
      })

      return () => unsubscribe()
    } catch (error) {
      console.error('Error loading thread:', error)
      setLoadError('Failed to load thread')
      setIsLoading(false)
    }
  }

  const loadMoreMessages = async () => {
    if (!lastVisible || isLoadingMore || !hasMoreMessages) return

    try {
      setIsLoadingMore(true)
      const messagesRef = collection(db, 'messages')
      const q = query(
        messagesRef,
        where('threadId', '==', threadId),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(MESSAGES_PER_PAGE)
      )

      const snapshot = await getDocs(q)
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      })) as Message[]

      if (newMessages.length > 0) {
        setMessages(prev => [...prev, ...newMessages.reverse()])
        setLastVisible(snapshot.docs[snapshot.docs.length - 1])
        setHasMoreMessages(snapshot.docs.length === MESSAGES_PER_PAGE)
      } else {
        setHasMoreMessages(false)
      }
    } catch (error) {
      console.error('Error loading more messages:', error)
      toast.error('Failed to load more messages')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      toast.success(`Selected: ${file.name}`)
    }
  }

  const handleReply = (message: Message) => {
    setReplyingTo(message)
  }

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !user?.uid || !threadId) {
      console.log('Cannot send message:', {
        hasText: !!newMessage.trim(),
        hasFile: !!selectedFile,
        hasUser: !!user?.uid,
        hasThreadId: !!threadId
      })
      return
    }

    // Check for profanity in text message
    if (newMessage.trim() && containsProfanity(newMessage.trim())) {
      toast.error('Please keep the discussion respectful. Profanity and bullying are not allowed.')
      return
    }

    try {
      let attachmentUrl = null
      let attachmentType: 'image' | 'pdf' | null = null
      let attachmentName = null

      // Handle file upload if a file is selected
      if (selectedFile) {
        const fileType = selectedFile.type
        const isImage = fileType.startsWith('image/')
        const isPDF = fileType === 'application/pdf'

        if (!isImage && !isPDF) {
          toast.error('Only images and PDF files are allowed')
          return
        }

        // Upload file to backend
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('thread_id', threadId)
        formData.append('uid', user.uid)
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://examquiz.dedicated.co.za/public/learn'

        const response = await fetch(`${API_BASE_URL}/chat/upload-file`, {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error('Failed to upload file')
        }

        const data = await response.json()
        if (data.status === 'NOK') {
          throw new Error(data.message || 'Failed to upload file')
        }

        // Construct the full URL for the attachment
        attachmentUrl = `${API_BASE_URL}/get-chat-file?file=${data.fileName}`
        attachmentType = isImage ? 'image' : 'pdf'
        attachmentName = selectedFile.name
      }

      const messageData: Omit<Message, 'id'> = {
        text: newMessage.trim(),
        authorUID: user.uid,
        threadId: threadId,
        createdAt: new Date(),
        userName: user.displayName || 'Anonymous',
        avatar: '1.png', // Default avatar
        ...(replyingTo && {
          replyTo: {
            id: replyingTo.id,
            text: replyingTo.text,
            userName: replyingTo.userName
          }
        }),
        ...(attachmentUrl && attachmentType && attachmentName && {
          attachment: {
            url: attachmentUrl,
            type: attachmentType,
            name: attachmentName
          }
        })
      }

      await addDoc(collection(db, 'messages'), messageData)
      setNewMessage('')
      setSelectedFile(null)
      setReplyingTo(null)
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  const handleDeleteMessage = async (message: Message) => {
    try {
      const messageRef = doc(db, 'messages', message.id)
      await deleteDoc(messageRef)
      toast.success('Message deleted successfully')
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Failed to delete message')
    }
  }

  const formatMessageTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDateDivider = (date: Date): string => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString([], { month: 'long', day: 'numeric' })
    }
  }

  // Add this function to handle right click on messages
  const handleMessageContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault()
    const x = e.pageX
    const y = e.pageY
    setContextMenu({ x, y, message })
  }

  // Add this function to handle context menu actions
  const handleContextMenuAction = (action: 'reply' | 'delete') => {
    if (!contextMenu) return

    if (action === 'reply') {
      handleReply(contextMenu.message)
    } else if (action === 'delete' && contextMenu.message.authorUID === user?.uid) {
      handleDeleteMessage(contextMenu.message)
    }
    setContextMenu(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1B1464] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    )
  }

  if (loadError || !thread) {
    return (
      <div className="min-h-screen bg-[#1B1464] flex items-center justify-center">
        <div className="text-white text-center">
          <p className="mb-4">{loadError}</p>
          <button
            onClick={loadThreadAndMessages}
            className="bg-white/20 hover:bg-white/30 text-white rounded-xl py-2 px-4 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1B1464] text-white" onClick={() => setContextMenu(null)}>
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-white hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold">{thread.title}</h1>
              <p className="text-sm text-gray-300">
                Created by {thread.createdByName} • {thread.createdAt.toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-4xl mx-auto p-4 pb-32">
        <div className="space-y-4">
          {messages.map((message, index) => {
            const isOwnMessage = message.authorUID === user?.uid
            const showDateDivider = index === 0 ||
              new Date(message.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString()

            return (
              <div key={message.id}>
                {showDateDivider && (
                  <div className="flex items-center justify-center my-4">
                    <div className="flex-1 h-px bg-white/20"></div>
                    <span className="mx-4 text-sm text-gray-400">
                      {formatDateDivider(message.createdAt)}
                    </span>
                    <div className="flex-1 h-px bg-white/20"></div>
                  </div>
                )}
                <div 
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
                  onContextMenu={(e) => handleMessageContextMenu(e, message)}
                >
                  <div 
                    className={`max-w-[80%] ${isOwnMessage ? 'ml-auto' : 'mr-auto'} group cursor-pointer`}
                    onClick={() => handleReply(message)}
                  >
                    <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 mb-1`}>
                      <Image
                        src={`/images/avatars/${message.avatar || '1.png'}`}
                        alt={message.userName}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <div>
                        <p className={`text-sm font-medium ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                          {message.userName}
                        </p>
                        <div className={`rounded-lg p-3 relative ${
                          isOwnMessage ? 'bg-indigo-600' : 'bg-white/10'
                        } group-hover:ring-2 ring-white/20 transition-all`}>
                          {isOwnMessage && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering reply
                                handleDeleteMessage(message);
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete message"
                            >
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                          {message.replyTo && (
                            <div className={`mb-2 p-2 rounded ${
                              isOwnMessage ? 'bg-white/10' : 'bg-black/20'
                            }`}>
                              <p className="text-sm font-medium">{message.replyTo.userName}</p>
                              <p className="text-sm opacity-75">{message.replyTo.text}</p>
                            </div>
                          )}
                          {message.text && <p className="text-white">{message.text}</p>}
                          {message.attachment && (
                            <div className="mt-2">
                              {message.attachment.type === 'image' ? (
                                <img
                                  src={message.attachment.url}
                                  alt={message.attachment.name}
                                  className="rounded-lg max-w-full"
                                />
                              ) : (
                                <a
                                  href={message.attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-white/80 hover:text-white"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  {message.attachment.name}
                                </a>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-white/60 mt-1">
                            {formatMessageTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {hasMoreMessages && (
          <div className="text-center py-4">
            <button
              onClick={loadMoreMessages}
              disabled={isLoadingMore}
              className="bg-white/20 hover:bg-white/30 text-white rounded-xl py-2 px-4 transition-colors disabled:opacity-50"
            >
              {isLoadingMore ? 'Loading...' : 'Load More Messages'}
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#1B1464] border-t border-white/10 p-4">
          <div className="max-w-4xl mx-auto">
            {replyingTo && (
              <div className="flex items-center justify-between mb-2 bg-white/10 rounded-lg p-2">
                <div>
                  <p className="text-sm font-medium">Replying to {replyingTo.userName}</p>
                  <p className="text-sm opacity-75">{replyingTo.text}</p>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-white/60 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <input
                type="file"
                onChange={handleFileSelect}
                accept="image/*,.pdf"
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="bg-white/20 hover:bg-white/30 text-white rounded-xl p-2 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </label>
              {selectedFile && (
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1">
                  <span className="text-sm">{selectedFile.name}</span>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-white/60 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white/10 rounded-xl p-3 text-white placeholder-white/50 resize-none max-h-32"
                rows={1}
                maxLength={250}
              />
              <button
                onClick={sendMessage}
                disabled={(!newMessage.trim() && !selectedFile)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-50 bg-gray-800 rounded-lg shadow-lg overflow-hidden"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <button
            className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-2"
            onClick={() => handleContextMenuAction('reply')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Reply
          </button>
          {contextMenu.message.authorUID === user?.uid && (
            <button
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 flex items-center gap-2"
              onClick={() => handleContextMenuAction('delete')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
} 