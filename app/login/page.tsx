'use client'

import { useState, useEffect } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      router.push('/')
      router.refresh()
    }
  }, [user, router])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Login error:', error)
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  // Don't render the login page if user is authenticated
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1e1b4b]">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-2">
            Exam Quiz <span className="text-3xl">👋</span>
          </h1>
          <p className="mt-4 text-xl text-white/90">
            Ready to ace those exams? Let's get started! 🚀
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignIn} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-4 bg-[#312e81]/30 text-white placeholder-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                placeholder="Email"
                disabled={loading}
              />
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-4 bg-[#312e81]/30 text-white placeholder-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                placeholder="Password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showPassword ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              href="/reset-password"
              className="text-white/90 hover:text-white text-sm"
            >
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-4 px-4 rounded-full text-lg font-semibold bg-white text-[#1e1b4b] hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-[#1e1b4b] disabled:opacity-50 transition-all duration-200"
          >
            {loading ? 'Signing in...' : 'Login 🚀'}
          </button>
        </form>

        <div className="text-center space-y-6">
          <p className="text-white/90">
            New to Exam Quiz? Join thousands of students acing their exams! 🎯
          </p>
          <Link
            href="/onboarding"
            className="block w-full py-4 px-4 rounded-full text-lg font-semibold text-white border-2 border-white/20 hover:bg-white/10 transition-all duration-200"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  )
} 