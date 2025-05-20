'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { getRejectedQuestionsCount } from '@/services/api'
import { signOut } from 'firebase/auth'
import Image from 'next/image'

const menuItems = [
  { path: '/admin', label: 'Dashboard' },
  { path: '/questions', label: 'Questions', showRejected: true },
  { path: '/admin/ai-questions/upload-exam-paper', label: 'Upload Exam Paper' },
  { path: '/admin/app-management', label: 'App Management' },
  { path: '/admin/story-arcs', label: 'Story Arcs' },
  { path: '/', label: 'APP' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [rejectedCount, setRejectedCount] = useState(0)

  useEffect(() => {
    if (user?.uid) {
      getRejectedQuestionsCount(user.uid)
        .then(count => setRejectedCount(count))
        .catch(console.error)
    }
  }, [user?.uid])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (!user) return null

  return (
    <div className="w-64 bg-gray-800 text-white p-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Dimpo Learning App Admin</h1>
      </div>
      <nav className="space-y-6">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`block p-2 rounded hover:bg-gray-700 ${pathname === item.path ? 'bg-gray-700' : ''
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span>{item.label}</span>
                  {item.showRejected && rejectedCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {rejectedCount}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="pt-6 border-t border-gray-700">
          <div className="flex items-center mb-4">
            {user.photoURL && (
              <Image
                src={user.photoURL}
                alt={user.displayName || ''}
                width={32}
                height={32}
                className="rounded-full mr-2"
                unoptimized={user.photoURL.startsWith('data:')}
              />
            )}
            <div className="text-sm">
              <div className="font-medium text-white">{user.displayName || ''}</div>
              <div className="text-gray-400">{user.email || ''}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded"
          >
            Sign Out
          </button>
        </div>
      </nav>
    </div>
  )
} 