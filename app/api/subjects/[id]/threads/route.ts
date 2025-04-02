import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get subject name first
    const subjectsRef = collection(db, 'subjects')
    const subjectQuery = query(subjectsRef, where('id', '==', params.id))
    const subjectSnapshot = await getDocs(subjectQuery)

    if (subjectSnapshot.empty) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      )
    }

    const subject = subjectSnapshot.docs[0].data()

    // Get threads for this subject
    const threadsRef = collection(db, 'threads')
    const threadsQuery = query(
      threadsRef,
      where('subjectId', '==', params.id),
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

        return {
          id: doc.id,
          title: threadData.title,
          createdAt: threadData.createdAt.toDate(),
          createdById: threadData.createdById,
          createdByName: threadData.createdByName,
          subjectName: subject.name,
          messageCount: messagesSnapshot.size,
          lastMessage: lastMessage?.content,
          lastMessageTime: lastMessage?.createdAt?.toDate()
        }
      })
    )

    return NextResponse.json({
      threads: threadsWithMessages,
      subjectName: subject.name
    })
  } catch (error) {
    console.error('Error fetching threads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    )
  }
} 