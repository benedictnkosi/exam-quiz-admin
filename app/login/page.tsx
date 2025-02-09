'use client'

import { useState, useEffect } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const [error, setError] = useState('')
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      router.push('/')
      router.refresh()
    }
  }, [user, router])

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)

      // After successful sign in, redirect to dashboard
      router.push('/')
      router.refresh()
    } catch (error) {
      setError('Failed to sign in with Google')
      console.error(error)
    }
  }

  // Don't render the login page if user is authenticated
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Exam Quiz Admin</h1>
          <p className="mt-2 text-gray-600">Sign in to access the admin panel</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FcGoogle className="w-5 h-5" />
          Sign in with Google
        </button>
      </div>
    </div>
  )
} 