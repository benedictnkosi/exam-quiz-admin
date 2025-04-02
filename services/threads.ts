import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'

export interface Thread {
  id: string
  title: string
  createdAt: Date
  createdById: string
  createdByName: string
  subjectName: string
  grade: number
  lastMessage?: string
  lastMessageTime?: Date
  messageCount?: number
  lastRead?: Date
  unreadCount?: number
}

// Function to get last read timestamp from localStorage
function getLastReadTimestamp(threadId: string): Date | null {
  if (typeof window === 'undefined') return null
  const timestamp = localStorage.getItem(`thread_${threadId}_last_read`)
  return timestamp ? new Date(parseInt(timestamp)) : null
}

// Function to update last read timestamp in localStorage
function updateLastReadTimestamp(threadId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`thread_${threadId}_last_read`, Date.now().toString())
}

// Function to calculate unread count for a thread
function calculateUnreadCount(thread: Thread): number {
  if (!thread.lastMessageTime) return 0
  const lastRead = getLastReadTimestamp(thread.id)
  if (!lastRead) return thread.messageCount || 0
  return thread.lastMessageTime > lastRead ? (thread.messageCount || 0) : 0
}

export async function getThreadsBySubject(subjectName: string, grade: number): Promise<Thread[]> {
  try {
    // Get threads for this subject and grade
    const threadsRef = collection(db, 'threads')
    console.log('subjectName', subjectName)
    console.log('grade', grade)
    const threadsQuery = query(
      threadsRef,
      where('subjectName', '==', subjectName),
      where('grade', '==', grade),
      orderBy('createdAt', 'desc')
    )
    const threadsSnapshot = await getDocs(threadsQuery)

    // Get message counts and last messages for each thread
    const threadsWithMessages = await Promise.all(
      threadsSnapshot.docs.map(async (doc) => {
        const threadData = doc.data()
        const messagesRef = collection(db, 'messages')
        const messagesQuery = query(
          messagesRef,
          where('threadId', '==', doc.id),
          orderBy('createdAt', 'desc')
        )
        const messagesSnapshot = await getDocs(messagesQuery)
        const lastMessage = messagesSnapshot.docs[0]?.data()

        const thread: Thread = {
          id: doc.id,
          title: threadData.title,
          createdAt: (threadData.createdAt as Timestamp).toDate(),
          createdById: threadData.createdById,
          createdByName: threadData.createdByName,
          subjectName: threadData.subjectName,
          grade: threadData.grade,
          messageCount: messagesSnapshot.size,
          lastMessage: lastMessage?.content,
          lastMessageTime: lastMessage?.createdAt ? (lastMessage.createdAt as Timestamp).toDate() : undefined,
          lastRead: getLastReadTimestamp(doc.id) || undefined
        }

        // Calculate unread count
        thread.unreadCount = calculateUnreadCount(thread)

        return thread
      })
    )

    return threadsWithMessages
  } catch (error) {
    console.error('Error fetching threads:', error)
    throw error
  }
}

// Function to mark a thread as read
export function markThreadAsRead(threadId: string): void {
  updateLastReadTimestamp(threadId)
}

export async function createThread(data: {
  title: string
  subjectId: string
  subjectName: string
  createdById: string
  createdByName: string
  grade: number
}): Promise<Thread> {
  try {
    const threadsRef = collection(db, 'threads')
    const threadDoc = await addDoc(threadsRef, {
      ...data,
      createdAt: serverTimestamp(),
    })

    return {
      id: threadDoc.id,
      title: data.title,
      createdAt: new Date(),
      createdById: data.createdById,
      createdByName: data.createdByName,
      subjectName: data.subjectName,
      grade: data.grade,
      messageCount: 0
    }
  } catch (error) {
    console.error('Error creating thread:', error)
    throw error
  }
} 