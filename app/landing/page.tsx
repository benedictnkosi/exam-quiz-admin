'use client'

import Image from 'next/image'
import Link from 'next/link'
import { IoLogoApple, IoLogoGooglePlaystore } from 'react-icons/io5'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useMetaPixel } from '@/app/hooks/useMetaPixel'
import { logAnalyticsEvent } from '@/lib/analytics'

export default function LandingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { pageView } = useMetaPixel()

  useEffect(() => {
    if (user) {
      router.push('/')
    }

    // Check for redirect=app parameter
    const redirectParam = searchParams.get('redirect')
    if (redirectParam === 'app') {
      logAnalyticsEvent('facebook_referal', {
        value: 0,
        currency: 'USD',
      })
      window.location.href = 'https://play.google.com/store/apps/details?id=za.co.examquizafrica'
      return
    }

    // Defer pageView tracking to improve initial load
    setTimeout(() => {
      pageView()
    }, 0)
  }, [user, router, pageView, searchParams])

  // Don't render the landing page if user is authenticated
  if (user) {
    return null
  }

  const handleAppStoreClick = () => {
    logAnalyticsEvent('AppStoreClick', {
      value: 0,
      currency: 'USD',
    })
  }

  const handlePlayStoreClick = () => {
    logAnalyticsEvent('PlayStoreClick', {
      value: 0,
      currency: 'USD',
    })
  }

  const handleLoginClick = () => {
    logAnalyticsEvent('LoginClick', {
      value: 0,
      currency: 'USD',
    })
  }

  return (
    <div className="min-h-screen flex bg-[#1e1b4b]">
      {/* Left Section - Marketing Content */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#312e81] to-[#1e1b4b] p-16 flex-col justify-between relative overflow-hidden">
        {/* Mock Image - Only render on desktop */}
        {typeof window !== 'undefined' && window.innerWidth >= 1024 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[60%] max-w-[400px]" style={{ transform: 'rotate(12deg)' }}>
              <div className="absolute inset-0 bg-gradient-to-t from-[#312e81] via-transparent to-transparent z-10" />
              <Image
                src="/images/mock.png"
                alt="Dimpo Learning App App Interface"
                width={400}
                height={800}
                className="w-full h-auto relative z-0 drop-shadow-2xl"
                priority
                loading="eager"
                quality={75}
                sizes="(max-width: 400px) 100vw, 400px"
              />
            </div>
          </div>
        )}

        {/* Download Buttons - Desktop Only */}
        <div className="relative z-20 mt-auto space-y-4">
          <a
            href="https://apps.apple.com/za/app/past-papers-exam-quiz/id6742684696"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-full bg-white text-[#1e1b4b] hover:bg-white/90 transition-all duration-300 transform hover:scale-[1.02]"
            onClick={handleAppStoreClick}
          >
            <IoLogoApple size={24} />
            <span className="font-semibold">Download on App Store</span>
          </a>

          <a
            href="https://play.google.com/store/apps/details?id=za.co.examquizafrica"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02]"
            onClick={handlePlayStoreClick}
          >
            <IoLogoGooglePlaystore size={24} />
            <span className="font-semibold">Get it on Google Play</span>
          </a>
        </div>
      </div>

      {/* Right Section - Marketing Content */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-6 sm:space-y-10">
          <div className="text-center space-y-3 sm:space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-white flex items-center justify-center gap-3">
              Dimpo Learning App <span className="text-2xl sm:text-3xl"></span>
            </h1>
            <p className="text-lg sm:text-xl text-white/90">
              Ready to ace those exams? Let&apos;s get started! 🚀
            </p>
          </div>

          {/* Features Section */}
          <div className="text-center space-y-4">
            <div className="bg-white/5 rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Comprehensive Exam Prep</h2>
              <p className="text-white/90 text-sm sm:text-base">
                Covering Grades 10, 11, and 12 with over 16,000+ practice questions
              </p>
              <div className="flex justify-center gap-2 sm:gap-4">
                <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 rounded-full text-white text-sm">Grade 10</span>
                <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 rounded-full text-white text-sm">Grade 11</span>
                <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 rounded-full text-white text-sm">Grade 12</span>
              </div>
            </div>
          </div>

          {/* Download Buttons - Mobile Only */}
          <div className="lg:hidden space-y-3 sm:space-y-4 text-center">
            <p className="text-base sm:text-lg text-white/90">
              Join thousands of students acing their exams! 🎯
            </p>
            <a
              href="https://apps.apple.com/za/app/past-papers-exam-quiz/id6742684696"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-full bg-white text-[#1e1b4b] hover:bg-white/90 transition-all duration-300 transform hover:scale-[1.02]"
              onClick={handleAppStoreClick}
            >
              <IoLogoApple size={24} />
              <span className="font-semibold">Download on App Store</span>
            </a>

            <a
              href="https://play.google.com/store/apps/details?id=za.co.examquizafrica"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02]"
              onClick={handlePlayStoreClick}
            >
              <IoLogoGooglePlaystore size={24} />
              <span className="font-semibold">Get it on Google Play</span>
            </a>
          </div>

          <div className="text-center space-y-4">
            <p className="text-lg text-white/90">
              OR
            </p>

            <Link
              href="/login"
              className="block w-full py-4 px-6 rounded-full text-lg font-semibold bg-gradient-to-r from-[#4338ca] to-[#6366f1] text-white hover:from-[#4338ca]/90 hover:to-[#6366f1]/90 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-[#1e1b4b]"
              onClick={handleLoginClick}
            >
              Login Here
            </Link>
          </div>

          <div className="text-center">
            <p className="text-base text-white/70">
              By continuing, you agree to our{' '}
              <Link href="/privacy" className="text-[#6366f1] hover:text-[#818cf8] underline transition-colors duration-300">
                Privacy Policy
              </Link>
              {' '}and{' '}
              <Link href="/info" className="text-[#6366f1] hover:text-[#818cf8] underline transition-colors duration-300">
                Terms of Service
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 