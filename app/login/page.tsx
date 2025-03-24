'use client'

import { useState, useEffect } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import Image from 'next/image'
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5'
import { IoLogoApple, IoLogoGooglePlaystore } from 'react-icons/io5'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showAndroidModal, setShowAndroidModal] = useState(false)
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
    <div className="min-h-screen flex bg-[#1e1b4b]">
      {/* Left Section - Marketing Content */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#312e81] to-[#1e1b4b] p-16 flex-col justify-between relative overflow-hidden">
        {/* Mock Image */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[60%] max-w-[400px]" style={{ transform: 'rotate(12deg)' }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#312e81] via-transparent to-transparent z-10" />
            <Image
              src="/images/mock.png"
              alt="Exam Quiz App Interface"
              width={400}
              height={800}
              className="w-full h-auto relative z-0 drop-shadow-2xl"
              priority
            />
          </div>
        </div>

        {/* Download Buttons - Desktop Only */}
        <div className="relative z-20 mt-auto space-y-4">
          <a
            href="https://apps.apple.com/za/app/past-papers-exam-quiz/id6742684696"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-full bg-white text-[#1e1b4b] hover:bg-white/90 transition-all duration-300 transform hover:scale-[1.02]"
          >
            <IoLogoApple size={24} />
            <span className="font-semibold">Download on App Store</span>
          </a>

          <button
            onClick={() => setShowAndroidModal(true)}
            className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02]"
          >
            <IoLogoGooglePlaystore size={24} />
            <span className="font-semibold">Get it on Google Play</span>
          </button>
        </div>
      </div>

      {/* Android Coming Soon Modal */}
      {showAndroidModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowAndroidModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-[#1e1b4b] mb-4">Coming Soon!</h2>
            <p className="text-gray-600 mb-6">
              We&apos;re working hard to bring Exam Quiz to Android. Stay tuned for updates!
            </p>
            <button
              onClick={() => setShowAndroidModal(false)}
              className="w-full py-3 px-6 rounded-full bg-[#1e1b4b] text-white hover:bg-[#312e81] transition-all duration-300"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-10">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold text-white flex items-center justify-center gap-3">
              Exam Quiz <span className="text-3xl">👋</span>
            </h1>
            <p className="text-xl text-white/90">
              Ready to ace those exams? Let&apos;s get started! 🚀
            </p>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-6">
            <div className="space-y-4">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-5 py-4 bg-white rounded-2xl text-gray-900 text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                placeholder="email@example.com"
                disabled={loading}
              />
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-5 py-4 bg-white rounded-2xl text-gray-900 text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300"
                >
                  {showPassword ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-center text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Link
                href="/reset-password"
                className="text-white/90 hover:text-white text-base transition-colors duration-300"
              >
                Forgot your password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-4 px-6 rounded-full text-lg font-semibold bg-white text-[#1e1b4b] hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-[#1e1b4b] disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02] gap-2"
            >
              Login <span role="img" aria-label="rocket">🚀</span>
            </button>
          </form>

          <div className="text-center space-y-4">
            <p className="text-lg text-white/90">
              New to Exam Quiz? Join thousands of students acing their exams! 🎯
            </p>
            <Link
              href="/onboarding"
              className="block w-full py-4 px-6 rounded-full text-lg font-semibold bg-gradient-to-r from-[#4338ca] to-[#6366f1] text-white hover:from-[#4338ca]/90 hover:to-[#6366f1]/90 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-[#1e1b4b]"
            >
              Create an account
            </Link>
          </div>

          {/* Download Buttons - Mobile Only */}
          <div className="lg:hidden space-y-4">
            <a
              href="https://apps.apple.com/za/app/past-papers-exam-quiz/id6742684696"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-full bg-white text-[#1e1b4b] hover:bg-white/90 transition-all duration-300 transform hover:scale-[1.02]"
            >
              <IoLogoApple size={24} />
              <span className="font-semibold">Download on App Store</span>
            </a>

            <button
              onClick={() => setShowAndroidModal(true)}
              className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02]"
            >
              <IoLogoGooglePlaystore size={24} />
              <span className="font-semibold">Get it on Google Play</span>
            </button>
          </div>

          <div className="text-center">
            <p className="text-base text-white/70">
              By signing in, you agree to our{' '}
              <Link href="/privacy" className="text-[#6366f1] hover:text-[#818cf8] underline transition-colors duration-300">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 