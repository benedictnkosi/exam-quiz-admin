'use client'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { fetchMySubjects, getLearner, getRandomAIQuestion, RandomAIQuestion } from '@/services/api'

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
  const [randomLesson, setRandomLesson] = useState<RandomAIQuestion['question'] | null>(null)
  const [hiddenSubjects, setHiddenSubjects] = useState<string[]>([])

  // Load hidden subjects from localStorage on component mount
  useEffect(() => {
    const storedHiddenSubjects = localStorage.getItem('hiddenSubjects')
    if (storedHiddenSubjects) {
      setHiddenSubjects(JSON.parse(storedHiddenSubjects))
    }
  }, [])

  // Function to handle hiding a subject
  const handleHideSubject = (subjectId: string) => {
    const newHiddenSubjects = [...hiddenSubjects, subjectId]
    setHiddenSubjects(newHiddenSubjects)
    localStorage.setItem('hiddenSubjects', JSON.stringify(newHiddenSubjects))
  }

  // Function to show all subjects
  const handleShowAllSubjects = () => {
    setHiddenSubjects([])
    localStorage.removeItem('hiddenSubjects')
  }

  useEffect(() => {
    async function loadData() {
      if (!user?.uid) return

      try {
        setIsLoading(true)
        const [learnerData, subjectsData, randomLessonData] = await Promise.all([
          getLearner(user.uid),
          fetchMySubjects(user.uid),
          getRandomAIQuestion(user.uid)
        ])

        setLearnerInfo(learnerData)
        console.log("learnerData.role", learnerData.role)
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
        setRandomLesson(randomLessonData.question)
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
    <div className="min-h-screen bg-[#1B1464] text-white p-4 sm:p-6">
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
            {learnerInfo?.role === 'admin' && (
              <Link
                href="/admin"
                className="text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            )}
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

        {/* Share Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <button
            onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://examquiz.co.za')}`, '_blank', 'width=600,height=400')}
            className="flex-1 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl py-4 px-6 flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Share on Facebook</span>
          </button>
          <button
            onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent('https://examquiz.co.za')}&text=${encodeURIComponent('Check out Exam Quiz - Learn, Play, and Grow! 🎓')}`, '_blank', 'width=600,height=400')}
            className="flex-1 bg-[#1DA1F2] hover:bg-[#1A8CD8] text-white rounded-xl py-4 px-6 flex items-center justify-center gap-2"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
            <span>Share on Twitter</span>
          </button>
        </div>

        {/* Quick Lesson Section */}
        {randomLesson && randomLesson.ai_explanation.includes('***Key Lesson') && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-12">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 flex items-center justify-center">
                <Image
                  src={getSubjectIcon(randomLesson.subject.name.split(' P')[0])}
                  alt={randomLesson.subject.name}
                  width={32}
                  height={32}
                  onError={(e: any) => {
                    e.target.src = '/images/subjects/icon.png'
                  }}
                />
              </div>
              <h2 className="text-base font-bold">Quick Bite: {randomLesson.subject.name}</h2>
            </div>
            <div className="text-gray-300">
              {randomLesson.ai_explanation.split('***Key Lesson:')[1]?.trim().replace('***', '').trim()}
            </div>
          </div>
        )}

        {/* Subject Grid */}
        <h2 className="text-2xl font-bold mb-8">🤸‍♂️ Learn, Play, and Grow!</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {subjects
            .filter(subject => !hiddenSubjects.includes(subject.id))
            .map(subject => {
              const masteryPercentage = subject.answered_questions === 0 ? 0 :
                Math.round((subject.correct_answers / subject.answered_questions) * 100)

              return (
                <div key={subject.id} className="relative">
                  <button
                    onClick={() => handleHideSubject(subject.id)}
                    className="absolute -top-2 -right-2 z-10 bg-gray-600/80 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-500/80 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <Link
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
                        <h3 className="font-semibold mb-2 min-h-[2.5rem]">{subject.name}</h3>
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
                </div>
              )
            })}
        </div>

        {/* Show All Subjects Button */}
        {hiddenSubjects.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleShowAllSubjects}
              className="bg-white/20 hover:bg-white/30 text-white rounded-xl py-3 px-6 transition-colors"
            >
              Show All Subjects
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
