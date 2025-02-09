'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

const menuItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/questions', label: 'Questions' },
  { path: '/subjects', label: 'Manage Subjects' },
  { path: '/admin-requests', label: 'Admin Requests' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const handleLogout = async () => {
    try {
      await auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (!user) return null

  return (
    <div className="w-64 bg-gray-800 text-white p-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Exam Quiz Admin</h1>
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
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="pt-6 border-t border-gray-700">
          <div className="flex items-center mb-4">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName || ''}
                className="w-8 h-8 rounded-full mr-2"
              />
            )}
            <div className="text-sm">
              <div className="font-medium">{user.displayName}</div>
              <div className="text-gray-400">{user.email}</div>
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