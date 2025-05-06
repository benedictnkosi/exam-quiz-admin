'use client'

import React, { useEffect, useState } from 'react'
import { API_HOST } from '@/config/constants'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: "AIzaSyA19oZVV-JIleL-XlEbDK8k-KPNk1vod8E",
    authDomain: "exam-quiz-b615e.firebaseapp.com",
    projectId: "exam-quiz-b615e",
    storageBucket: "exam-quiz-b615e.firebasestorage.app",
    messagingSenderId: "619089624841",
    appId: "1:619089624841:web:8cdb542ea7c8eb22681dd8",
    measurementId: "G-MR80CKN8H9"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

interface Report {
    id: number
    created_at: string
    author_id: string
    author_name: string
    reporter_id: string
    reporter_name: string
    message_uid: string
    message: string
}

interface ReportsResponse {
    status: string
    message: string
    reports: Report[]
    total: number
    limit: number
    offset: number
}

interface MessageDetails {
    id: string
    text: string
    userName: string
    createdAt: any
    threadId: string
}

export default function ReportedMessagesTable() {
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
    const [selectedMessage, setSelectedMessage] = useState<MessageDetails | null>(null)
    const [viewLoading, setViewLoading] = useState<number | null>(null)
    const [threadMessages, setThreadMessages] = useState<MessageDetails[]>([])
    const [loadingThread, setLoadingThread] = useState(false)

    const fetchReports = async () => {
        try {
            const response = await fetch(`${API_HOST}/api/reports`)
            const data: ReportsResponse = await response.json()

            if (data.status === 'OK') {
                setReports(data.reports)
            } else {
                setError('Failed to fetch reports')
            }
        } catch (err) {
            setError('Error fetching reports')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReports()
    }, [])

    const handleDelete = async (reportId: number) => {
        if (!window.confirm('Are you sure you want to delete this report?')) {
            return
        }

        setDeleteLoading(reportId)
        try {
            const response = await fetch(`${API_HOST}/api/reports/${reportId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setReports(reports.filter(report => report.id !== reportId))
            } else {
                setError('Failed to delete report')
            }
        } catch (err) {
            setError('Error deleting report')
        } finally {
            setDeleteLoading(null)
        }
    }

    const handleView = async (messageUid: string) => {
        setViewLoading(parseInt(messageUid))
        try {
            const messageRef = doc(db, 'messages', messageUid)
            const messageSnap = await getDoc(messageRef)

            if (messageSnap.exists()) {
                const messageData = {
                    id: messageSnap.id,
                    ...messageSnap.data()
                } as MessageDetails
                setSelectedMessage(messageData)
                setThreadMessages([]) // Reset thread messages when viewing a new message
            } else {
                setError('Message not found')
            }
        } catch (err) {
            setError('Error fetching message details')
        } finally {
            setViewLoading(null)
        }
    }

    const handleViewThread = async (threadId: string) => {
        setLoadingThread(true)
        try {
            const messagesQuery = query(
                collection(db, 'messages'),
                where('threadId', '==', threadId),
                orderBy('createdAt', 'asc')
            )

            const querySnapshot = await getDocs(messagesQuery)
            const messages: MessageDetails[] = []

            querySnapshot.forEach((doc) => {
                messages.push({
                    id: doc.id,
                    ...doc.data()
                } as MessageDetails)
            })

            setThreadMessages(messages)
        } catch (err) {
            setError('Error fetching thread messages')
        } finally {
            setLoadingThread(false)
        }
    }

    if (loading) {
        return <div className="text-center py-4">Loading reports...</div>
    }

    if (error) {
        return <div className="text-red-500 text-center py-4">{error}</div>
    }

    return (
        <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Reported Messages</h3>
                    <p className="mt-1 text-sm text-gray-500">List of messages that have been reported by users</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reports.map((report) => (
                                <tr key={report.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(report.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {report.author_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {report.reporter_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {report.message}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <button
                                            className="text-indigo-600 hover:text-indigo-900 mr-4 disabled:opacity-50"
                                            onClick={() => handleView(report.message_uid)}
                                            disabled={viewLoading === parseInt(report.message_uid)}
                                        >
                                            {viewLoading === parseInt(report.message_uid) ? 'Loading...' : 'View'}
                                        </button>
                                        <button
                                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                            onClick={() => handleDelete(report.id)}
                                            disabled={deleteLoading === report.id}
                                        >
                                            {deleteLoading === report.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Message Details Modal */}
            {selectedMessage && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Message Details</h3>
                            <button
                                onClick={() => {
                                    setSelectedMessage(null)
                                    setThreadMessages([])
                                }}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Author</p>
                                <p className="mt-1 text-sm text-gray-900">{selectedMessage.userName}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Message</p>
                                <p className="mt-1 text-sm text-gray-900">{selectedMessage.text}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Date</p>
                                <p className="mt-1 text-sm text-gray-900">
                                    {selectedMessage.createdAt?.toDate().toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Thread ID</p>
                                <p className="mt-1 text-sm text-gray-900">{selectedMessage.threadId}</p>
                            </div>

                            {threadMessages.length === 0 ? (
                                <button
                                    onClick={() => handleViewThread(selectedMessage.threadId)}
                                    disabled={loadingThread}
                                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {loadingThread ? 'Loading Thread...' : 'View Thread Messages'}
                                </button>
                            ) : (
                                <div className="mt-6">
                                    <h4 className="text-lg font-medium text-gray-900 mb-4">Thread Messages</h4>
                                    <div className="space-y-4">
                                        {threadMessages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`p-4 rounded-lg ${message.id === selectedMessage.id
                                                    ? 'bg-indigo-50 border-2 border-indigo-500'
                                                    : 'bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <p className="text-sm font-medium text-gray-900">{message.userName}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {message.createdAt?.toDate().toLocaleString()}
                                                    </p>
                                                </div>
                                                <p className="mt-2 text-sm text-gray-700">{message.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
} 