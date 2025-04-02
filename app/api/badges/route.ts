import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Badge {
  id: number
  name: string
  image: string
  rules: string
  category: string
}

export async function GET() {
  try {
    const badges = await db.query<Badge>(
      `SELECT id, name, image, rules, category 
       FROM badges 
       WHERE active = 1 
       ORDER BY category, name`
    )

    return NextResponse.json({ badges })
  } catch (error) {
    console.error('Error fetching badges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    )
  }
} 