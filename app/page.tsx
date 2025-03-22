'use client'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { fetchMySubjects, getLearner } from '@/services/api'

interface Subject {
  id: number;
  name: string;
  totalSubjectQuestions: number;
  totalResults: number;
  correctAnswers: number;
  active: boolean;
}

interface GroupedSubject {
  id: string;
  name: string;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
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

// Helper function to get subject icon
function getSubjectIcon(subjectName: string): string {
  const nameMap: { [key: string]: string } = {
    'Physical Sciences': 'physics',
    'Agricultural Sciences': 'agriculture',
    'Mathematical Literacy': 'maths',
    'Life Sciences': 'life-science',
    'Business Studies': 'business-studies',
    'Life Orientation': 'life-orientation',
    'Economics': 'economics',
    'Geography': 'geography',
    'History': 'history',
    'Tourism': 'tourism',
    'Mathematics': 'mathematics'
  }

  const mappedName = nameMap[subjectName] || subjectName.toLowerCase().replace(/\s+/g, '-')
  return `/images/subjects/${mappedName}.png`
}

export default function Home() {
  const { user } = useAuth()
  const [learnerInfo, setLearnerInfo] = useState<LearnerInfo | null>(null)
  const [subjects, setSubjects] = useState<GroupedSubject[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!user?.uid) return

      try {
        setIsLoading(true)
        const [learnerData, subjectsData] = await Promise.all([
          getLearner(user.uid),
          fetchMySubjects(user.uid)
        ])

        setLearnerInfo(learnerData)
        if (subjectsData?.subjects) {
          // Group subjects and combine P1/P2 stats
          const subjectGroups = subjectsData.subjects.reduce((acc: Record<string, GroupedSubject>, curr: Subject) => {
            if (!curr?.name) return acc;

            // Extract base subject name without P1/P2
            const baseName = curr.name.split(' P')[0];

            if (!acc[baseName]) {
              acc[baseName] = {
                id: curr.id.toString(),
                name: baseName,
                total_questions: curr.totalSubjectQuestions || 0,
                answered_questions: curr.totalResults || 0,
                correct_answers: curr.correctAnswers || 0
              };
            } else {
              acc[baseName].total_questions += curr.totalSubjectQuestions || 0;
              acc[baseName].answered_questions += curr.totalResults || 0;
              acc[baseName].correct_answers += curr.correctAnswers || 0;
            }

            return acc;
          }, {});

          setSubjects(Object.values(subjectGroups))
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user?.uid])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1B1464] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1B1464] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with Logo and Profile */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 flex items-center justify-center">
              <Image
                src="/images/icon.png"
                alt="Exam Quiz"
                width={40}
                height={40}
                onError={(e: any) => {
                  e.target.src = '/images/icon.png'
                }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Exam Quiz ✨</h1>
              <p className="text-gray-300">Explore the Joy of Learning! 🎓</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/info"
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Link>
            <Link href="/profile" className="block">
              <div className="w-12 h-12 rounded-full bg-blue-400 overflow-hidden hover:opacity-80 transition-opacity">
                <Image
                  src={learnerInfo?.avatar ? `/images/avatars/${learnerInfo.avatar}.png` : '/images/avatars/1.png'}
                  alt="Profile"
                  width={48}
                  height={48}
                  onError={(e: any) => {
                    e.target.src = '/images/subjects/icon.png'
                  }}
                />
              </div>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center">
                <Image
                  src="/images/points.png"
                  alt="Points"
                  width={36}
                  height={36}
                />
              </div>
              <div>
                <p className="text-gray-300">points</p>
                <p className="text-2xl font-bold">{learnerInfo?.points || 0}</p>
              </div>
            </div>
            <div className="w-px h-12 bg-gray-600" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center">
                <Image
                  src="/images/streak.png"
                  alt="Streak"
                  width={36}
                  height={36}
                />
              </div>
              <div>
                <p className="text-gray-300">Streak</p>
                <p className="text-2xl font-bold">{learnerInfo?.streak || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Share Button */}
        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-4 px-6 flex items-center justify-center gap-2 mb-12">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>Spread the fun, tell your friends! 📢</span>
        </button>

        {/* Subject Grid */}
        <h2 className="text-2xl font-bold mb-8">🤸‍♂️ Learn, Play, and Grow!</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map(subject => {
            const masteryPercentage = subject.answered_questions === 0 ? 0 :
              Math.round((subject.correct_answers / subject.answered_questions) * 100)

            return (
              <Link
                key={subject.id}
                href={`/quiz?subjectId=${subject.id}&subjectName=${encodeURIComponent(subject.name)}`}
                className="block"
              >
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 relative hover:bg-white/20 transition-all cursor-pointer">
                  <div className="absolute -top-6 left-4">
                    <Image
                      src={getSubjectIcon(subject.name)}
                      alt={subject.name}
                      width={72}
                      height={72}
                      onError={(e: any) => {
                        e.target.src = '/images/subjects/icon.png'
                      }}
                    />
                  </div>
                  <div className="mt-12">
                    <h3 className="font-semibold mb-2">{subject.name}</h3>
                    <p className="text-sm text-gray-300 mb-4">{subject.total_questions} questions</p>
                    <div className="w-full bg-gray-700 rounded-full h-1 mb-2">
                      <div
                        className="bg-green-500 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${masteryPercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-sm text-gray-300">{masteryPercentage}% GOAT 🐐</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
