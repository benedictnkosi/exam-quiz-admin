import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Learner {
  id: number
  uid: string
}

interface LearnerBadge {
  id: number
  badge_id: number
  learner_id: number
  earned_at: string
  name: string
  image: string
  rules: string
  category: string
}

export async function GET(
  request: Request,
  { params }: { params: { uid: string } }
) {
  try {
    const { uid } = params

    // First get the learner's ID
    const learners = await db.query<Learner>(
      'SELECT id FROM learners WHERE uid = ?',
      [uid]
    )

    if (!learners || learners.length === 0) {
      return NextResponse.json(
        { error: 'Learner not found' },
        { status: 404 }
      )
    }

    // Get the learner's badges
    const badges = await db.query<LearnerBadge>(
      `SELECT lb.id, lb.badge_id, lb.learner_id, lb.earned_at,
              b.name, b.image, b.rules, b.category
       FROM learner_badges lb
       JOIN badges b ON lb.badge_id = b.id
       WHERE lb.learner_id = ?
       ORDER BY lb.earned_at DESC`,
      [learners[0].id]
    )

    return NextResponse.json({ badges })
  } catch (error) {
    console.error('Error fetching learner badges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch learner badges' },
      { status: 500 }
    )
  }
} 