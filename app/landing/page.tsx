'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import Image from 'next/image'
import { IoLogoApple, IoLogoGooglePlaystore, IoGlobeOutline } from 'react-icons/io5'

export default function LandingPage() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
      router.refresh()
    }
  }, [user, router])

  // Don't render the landing page if user is authenticated
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1e1b4b]">
      {/* Main Content - Marketing */}
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 p-8">
        {/* Heading - Shown first on mobile */}
        <div className="lg:hidden w-full text-center mb-8">
          <h1 className="text-5xl font-bold text-white flex items-center justify-center gap-3">
            Exam Quiz <span className="text-3xl">👋</span>
          </h1>
          <p className="text-xl text-white/90 mt-4">
            Ready to ace those exams? Let&apos;s get started! 🚀
          </p>
        </div>

        {/* Mock Image - Left Side on Desktop */}
        <div className="w-full lg:w-1/2 max-w-[300px] lg:max-w-[350px] flex items-center justify-center">
          <div className="relative w-[80%]" style={{ transform: 'rotate(12deg)' }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#312e81] via-transparent to-transparent z-10" />
            <Image
              src="/images/mock.png"
              alt="Exam Quiz App Interface"
              width={250}
              height={500}
              className="w-full h-auto relative z-0 drop-shadow-2xl"
              priority
            />
          </div>
        </div>

        {/* Content - Right Side on Desktop */}
        <div className="w-full lg:w-1/2 max-w-md space-y-8 text-center lg:text-left">
          {/* Heading - Only shown on desktop */}
          <div className="hidden lg:block space-y-4">
            <h1 className="text-5xl font-bold text-white flex items-center justify-start gap-3">
              Exam Quiz <span className="text-3xl">👋</span>
            </h1>
            <p className="text-xl text-white/90">
              Ready to ace those exams? Let&apos;s get started! 🚀
            </p>
          </div>

          {/* Download Buttons */}
          <div className="space-y-4">
            <a
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-full bg-white text-[#1e1b4b] hover:bg-white/90 transition-all duration-300 transform hover:scale-[1.02]"
            >
              <IoGlobeOutline size={24} />
              <span className="font-semibold">Continue Here</span>
            </a>

            <a
              href="https://apps.apple.com/za/app/past-papers-exam-quiz/id6742684696"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-full bg-white text-[#1e1b4b] hover:bg-white/90 transition-all duration-300 transform hover:scale-[1.02]"
            >
              <IoLogoApple size={24} />
              <span className="font-semibold">Download on App Store</span>
            </a>

            <a
              href="https://play.google.com/store/apps/details?id=za.co.examquizafrica"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-[1.02]"
            >
              <IoLogoGooglePlaystore size={24} />
              <span className="font-semibold">Get it on Google Play</span>
            </a>
          </div>

          <div className="text-center lg:text-left">
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