import { NextResponse } from 'next/server'

interface Badge {
  id: number
  name: string
  image: string
  rules: string
  category: string
}

// Mock data for badges
const mockBadges: Badge[] = [
  {
    id: 1,
    name: "First Quiz",
    image: "/badges/first-quiz.png",
    rules: "Complete your first quiz",
    category: "Achievement"
  },
  {
    id: 2,
    name: "Perfect Score",
    image: "/badges/perfect-score.png",
    rules: "Get 100% on a quiz",
    category: "Achievement"
  },
  {
    id: 3,
    name: "Streak Master",
    image: "/badges/streak-master.png",
    rules: "Maintain a 7-day quiz streak",
    category: "Streak"
  },
  {
    id: 4,
    name: "Subject Expert",
    image: "/badges/subject-expert.png",
    rules: "Complete 50 questions in a subject",
    category: "Subject"
  }
]

export async function GET() {
  try {
    // Return mock data instead of querying a database
    return NextResponse.json({ badges: mockBadges })
  } catch (error) {
    console.error('Error fetching badges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    )
  }
} 