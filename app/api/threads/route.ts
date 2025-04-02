import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(request: Request) {
  try {
    const { title, subjectId, subjectName, createdById, createdByName } = await request.json()

    // Validate required fields
    if (!title || !subjectId || !createdById) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create new thread
    const threadsRef = collection(db, 'threads')
    const threadDoc = await addDoc(threadsRef, {
      title,
      subjectId,
      createdById,
      createdByName: createdByName || 'Anonymous',
      createdAt: serverTimestamp(),
    })

    // Get the created thread data
    const threadSnapshot = await getDoc(doc(db, 'threads', threadDoc.id))
    const threadData = threadSnapshot.data()

    const thread = {
      id: threadDoc.id,
      title: threadData?.title,
      createdAt: threadData?.createdAt.toDate(),
      createdById: threadData?.createdById,
      createdByName: threadData?.createdByName,
      subjectName,
      messageCount: 0
    }

    return NextResponse.json({
      thread
    })
  } catch (error) {
    console.error('Error creating thread:', error)
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    )
  }
} 