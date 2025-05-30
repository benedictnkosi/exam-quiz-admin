import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore'

interface CreateThreadRequest {
    threadName: string
    messageBody: string
    subjectName: string
    grade: number
    createdById: string
    createdByName: string
}

export async function createThreadAndPostMessage({
    threadName,
    messageBody,
    subjectName,
    grade,
    createdById,
    createdByName
}: CreateThreadRequest) {
    try {
        // Create the thread
        const threadsRef = collection(db, 'threads')
        const threadDoc = await addDoc(threadsRef, {
            title: threadName,
            subjectName,
            grade,
            createdById,
            createdByName,
            createdAt: serverTimestamp(),
        })

        // Post the initial message
        const messagesRef = collection(db, 'messages')
        await addDoc(messagesRef, {
            text: messageBody,
            authorUID: createdById,
            threadId: threadDoc.id,
            createdAt: serverTimestamp(),
            userName: createdByName,
        })

        return {
            threadId: threadDoc.id,
            success: true
        }
    } catch (error) {
        console.error('Error creating thread and posting message:', error)
        throw error
    }
} 