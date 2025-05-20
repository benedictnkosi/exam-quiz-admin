'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAllBadges, getLearnerBadges, Badge, LearnerBadge, getLearner, getLeaderboard } from '@/services/api'
import Image from 'next/image'
import { useTheme } from '@/contexts/ThemeContext'
import MainMenu from '@/components/MainMenu'

interface BadgeCategory {
  title: string
  badges: (Badge & { earned: boolean })[]
}

interface LeaderboardEntry {
  name: string
  points: number
  position: number
  isCurrentLearner: boolean
  avatar: string
}

interface LeaderboardData {
  status: string
  rankings: LeaderboardEntry[]
  currentLearnerPoints: number
  currentLearnerPosition: number | null
  totalLearners: number
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
  const [badgeCategories, setBadgeCategories] = useState<BadgeCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [learnerInfo, setLearnerInfo] = useState<LearnerInfo | null>(null)
  const [activeTab, setActiveTab] = useState<'badges' | 'scoreboard'>('scoreboard')
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return
      setIsLoading(true)
      try {
        const [allBadges, learnerBadges, learnerData, leaderboardData] = await Promise.all([
          getAllBadges(),
          getLearnerBadges(user.uid),
          getLearner(user.uid),
          getLeaderboard(user.uid)
        ])

        setLearnerInfo(learnerData)
        setLeaderboard(leaderboardData)
        const earnedBadgeIds = new Set(learnerBadges.map(badge => badge.id))

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
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user?.uid])

  const handleShareBadge = async (badge: Badge) => {
    try {
      const badgeImageUrl = `${window.location.origin}/images/badges/${badge.image}`
      const message = `I just earned the ${badge.name} badge on Dimpo Learning App! 🎉\n\n${badge.rules}\n\nJoin me on Dimpo Learning App and start earning badges too! https://examquiz.co.za`

      if (navigator.share) {
        const response = await fetch(badgeImageUrl)
        const blob = await response.blob()
        const file = new File([blob], badge.image, { type: blob.type })

        await navigator.share({
          title: 'Share Badge Achievement',
          text: message,
          files: [file]
        })
      } else {
        // Fallback for browsers that don't support sharing files
        await navigator.clipboard.writeText(`${message}\n\nBadge image: ${badgeImageUrl}`)
        alert('Achievement and image URL copied to clipboard!')
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

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🏆 Achievements</h1>
          <p className="text-lg text-gray-300">
            Track your progress and compete with others!
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-full p-1">
            <button
              onClick={() => setActiveTab('scoreboard')}
              className={`px-6 py-2 rounded-full transition-all ${activeTab === 'scoreboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
                }`}
            >
              Scoreboard
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`px-6 py-2 rounded-full transition-all ${activeTab === 'badges'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
                }`}
            >
              Badges
            </button>
          </div>
        </div>

        {activeTab === 'scoreboard' ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            {/* Top 3 Learners */}
            <div className="flex justify-center items-end gap-4 mb-12 mt-8">
              {/* Second Place */}
              {leaderboard?.rankings[1] && (
                <div className="flex-1 max-w-[150px] translate-y-8">
                  <div className="text-center mb-2">
                    <div className="w-20 h-20 rounded-full bg-white/10 overflow-hidden mx-auto">
                      <Image
                        src={`/images/avatars/${leaderboard.rankings[1].avatar ? (leaderboard.rankings[1].avatar.endsWith('.png') ? leaderboard.rankings[1].avatar : `${leaderboard.rankings[1].avatar}.png`) : '1.png'}`}
                        alt={leaderboard.rankings[1].name}
                        width={80}
                        height={80}
                        className="object-cover"
                      />
                    </div>
                    <div className="mt-2">
                      <div className="text-xl font-bold">🥈</div>
                      <div className="font-semibold truncate">{leaderboard.rankings[1].name}</div>
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <Image
                          src="/images/points.png"
                          alt="Points"
                          width={16}
                          height={16}
                        />
                        <span>{leaderboard.rankings[1].points}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* First Place */}
              {leaderboard?.rankings[0] && (
                <div className="flex-1 max-w-[180px] -translate-y-4">
                  <div className="text-center mb-2">
                    <div className="relative">
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-3xl">👑</div>
                      <div className="w-24 h-24 rounded-full bg-white/10 overflow-hidden mx-auto border-2 border-yellow-400">
                        <Image
                          src={`/images/avatars/${leaderboard.rankings[0].avatar ? (leaderboard.rankings[0].avatar.endsWith('.png') ? leaderboard.rankings[0].avatar : `${leaderboard.rankings[0].avatar}.png`) : '1.png'}`}
                          alt={leaderboard.rankings[0].name}
                          width={96}
                          height={96}
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="font-semibold truncate">{leaderboard.rankings[0].name}</div>
                      <div className="flex items-center justify-center gap-1">
                        <Image
                          src="/images/points.png"
                          alt="Points"
                          width={20}
                          height={20}
                        />
                        <span className="font-bold">{leaderboard.rankings[0].points}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Third Place */}
              {leaderboard?.rankings[2] && (
                <div className="flex-1 max-w-[150px] translate-y-8">
                  <div className="text-center mb-2">
                    <div className="w-20 h-20 rounded-full bg-white/10 overflow-hidden mx-auto">
                      <Image
                        src={`/images/avatars/${leaderboard.rankings[2].avatar ? (leaderboard.rankings[2].avatar.endsWith('.png') ? leaderboard.rankings[2].avatar : `${leaderboard.rankings[2].avatar}.png`) : '1.png'}`}
                        alt={leaderboard.rankings[2].name}
                        width={80}
                        height={80}
                        className="object-cover"
                      />
                    </div>
                    <div className="mt-2">
                      <div className="text-xl font-bold">🥉</div>
                      <div className="font-semibold truncate">{leaderboard.rankings[2].name}</div>
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <Image
                          src="/images/points.png"
                          alt="Points"
                          width={16}
                          height={16}
                        />
                        <span>{leaderboard.rankings[2].points}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rest of the Leaderboard */}
            <div className="space-y-4">
              {leaderboard?.rankings.slice(3).map((entry) => (
                <div
                  key={`${entry.name}-${entry.position}`}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${entry.isCurrentLearner
                      ? 'bg-blue-600'
                      : 'bg-white/5 hover:bg-white/10'
                    }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-8 text-xl font-bold">
                      #{entry.position}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden">
                      <Image
                        src={`/images/avatars/${entry.avatar ? (entry.avatar.endsWith('.png') ? entry.avatar : `${entry.avatar}.png`) : '1.png'}`}
                        alt={entry.name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{entry.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image
                        src="/images/points.png"
                        alt="Points"
                        width={24}
                        height={24}
                      />
                      <span className="font-bold">{entry.points}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Current Learner Position (if not in top 10) */}
            {leaderboard?.currentLearnerPosition !== null && !leaderboard?.rankings.some(r => r.isCurrentLearner) && leaderboard && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-blue-600">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-8 text-xl font-bold">
                      #{leaderboard?.currentLearnerPosition}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden">
                      <Image
                        src={`/images/avatars/${learnerInfo?.avatar ? (learnerInfo.avatar.endsWith('.png') ? learnerInfo.avatar : `${learnerInfo.avatar}.png`) : '1.png'}`}
                        alt={learnerInfo?.name || 'You'}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">You</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Image
                        src="/images/points.png"
                        alt="Points"
                        width={24}
                        height={24}
                      />
                      <span className="font-bold">{leaderboard?.currentLearnerPoints}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          badgeCategories.map((category) => (
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
                        src={`/images/badges/${badge.image}`}
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
          ))
        )}
      </div>
    </div>
  )
} 