'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAllBadges, getLearnerBadges, Badge, LearnerBadge, getLearner } from '@/services/api'
import Image from 'next/image'
import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import MainMenu from '@/components/MainMenu'

interface BadgeCategory {
  title: string
  badges: (Badge & { earned: boolean })[]
}

interface LearnerInfo {
  id: number;
  uid: string;
  name: string;
  grade: {
    id: number;
    number: number;
    active: number;
  };
  school_name: string;
  school_address: string;
  school_latitude: number;
  school_longitude: number;
  curriculum: string;
  terms: string;
  email: string;
  role?: string;
  points: number;
  streak: number;
  avatar: string;
}

export default function AchievementsPage() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [badgeCategories, setBadgeCategories] = useState<BadgeCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [learnerInfo, setLearnerInfo] = useState<LearnerInfo | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return
      setIsLoading(true)
      try {
        const [allBadges, learnerBadges, learnerData] = await Promise.all([
          getAllBadges(),
          getLearnerBadges(user.uid),
          getLearner(user.uid)
        ])
        
        setLearnerInfo(learnerData)
        const earnedBadgeIds = new Set(learnerBadges.map(badge => badge.badge_id))

        const badgesWithStatus = allBadges.map(badge => ({
          ...badge,
          earned: earnedBadgeIds.has(badge.id)
        }))

        // Categorize badges
        const categories: BadgeCategory[] = [
          {
            title: 'Learning Marathon 🏃‍♂️📚',
            badges: badgesWithStatus.filter(badge =>
              badge.image.includes('day-streak')
            )
          },
          {
            title: 'Sharp Shooter 🎯',
            badges: badgesWithStatus.filter(badge =>
              badge.image.includes('in-a-row')
            )
          },
          {
            title: 'Quiz Master 🎓',
            badges: badgesWithStatus.filter(badge =>
              !badge.image.includes('in-a-row') &&
              !badge.image.includes('day-streak')
            )
          }
        ]

        setBadgeCategories(categories)
      } catch (error) {
        console.error('Failed to fetch badges:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user?.uid])

  const handleShareBadge = async (badge: Badge) => {
    try {
      const message = `I just earned the ${badge.name} badge on Exam Quiz! 🎉\n\n${badge.rules}\n\nJoin me on Exam Quiz and start earning badges too! https://examquiz.co.za`
      
      if (navigator.share) {
        await navigator.share({
          title: 'Share Badge Achievement',
          text: message
        })
      } else {
        await navigator.clipboard.writeText(message)
        alert('Achievement copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing badge:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1B1464]">
        <div className="max-w-4xl mx-auto">
          <MainMenu learnerInfo={learnerInfo} />
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1B1464] text-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <MainMenu learnerInfo={learnerInfo} />

        <Link 
          href="/"
          className="inline-flex items-center text-white hover:text-gray-300 mb-8 transition-colors"
        >
          <svg
            className="w-6 h-6 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Home
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">🏆 Achievements</h1>
          <p className="text-lg text-gray-300">
            Collect badges as you progress!
          </p>
        </div>

        {badgeCategories.map((category) => (
          <div key={category.title} className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
              {category.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {category.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="bg-white/10 backdrop-blur-lg rounded-xl p-6 relative hover:bg-white/20 transition-all"
                >
                  <div className="relative aspect-square mb-4">
                    <Image
                      src={`/badges/${badge.image}`}
                      alt={badge.name}
                      fill
                      className={`object-contain ${!badge.earned ? 'opacity-50' : ''}`}
                    />
                    {!badge.earned && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                        <svg
                          className="w-12 h-12 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {badge.name}
                  </h3>
                  <p className="text-sm text-gray-300 mb-4">
                    {badge.rules}
                  </p>
                  {badge.earned && (
                    <button
                      onClick={() => handleShareBadge(badge)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                      Share
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 