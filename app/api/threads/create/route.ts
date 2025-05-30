import { NextResponse } from 'next/server'
import { createThreadAndPostMessage } from '@/services/threadService'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { threadName, messageBody, subjectName, grade, createdById, createdByName } = body

        // Validate required fields
        if (!threadName || !messageBody || !subjectName || !grade || !createdById) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const result = await createThreadAndPostMessage({
            threadName,
            messageBody,
            subjectName,
            grade,
            createdById,
            createdByName: createdByName || 'Anonymous'
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error in thread creation endpoint:', error)
        return NextResponse.json(
            { error: 'Failed to create thread and post message' },
            { status: 500 }
        )
    }
} 