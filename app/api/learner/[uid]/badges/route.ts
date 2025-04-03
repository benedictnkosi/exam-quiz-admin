import { NextResponse } from 'next/server'

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

// Mock data for learner badges
const mockLearnerBadges: Record<string, LearnerBadge[]> = {
  'user123': [
    {
      id: 1,
      badge_id: 1,
      learner_id: 101,
      earned_at: '2023-01-15T10:30:00Z',
      name: 'First Quiz',
      image: '/badges/first-quiz.png',
      rules: 'Complete your first quiz',
      category: 'Achievement'
    },
    {
      id: 2,
      badge_id: 3,
      learner_id: 101,
      earned_at: '2023-02-20T14:45:00Z',
      name: 'Streak Master',
      image: '/badges/streak-master.png',
      rules: 'Maintain a 7-day quiz streak',
      category: 'Streak'
    }
  ],
  'user456': [
    {
      id: 3,
      badge_id: 2,
      learner_id: 102,
      earned_at: '2023-03-10T09:15:00Z',
      name: 'Perfect Score',
      image: '/badges/perfect-score.png',
      rules: 'Get 100% on a quiz',
      category: 'Achievement'
    }
  ]
}

export async function GET(
  request: Request,
  { params }: { params: { uid: string } }
) {
  try {
    const { uid } = params

    // Return mock data for the specific user
    const badges = mockLearnerBadges[uid] || []

    return NextResponse.json({ badges })
  } catch (error) {
    console.error('Error fetching learner badges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch learner badges' },
      { status: 500 }
    )
  }
} 