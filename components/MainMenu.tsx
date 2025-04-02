'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'

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

interface MainMenuProps {
  learnerInfo: LearnerInfo | null;
}

export default function MainMenu({ learnerInfo }: MainMenuProps) {
  const { user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [avatarError, setAvatarError] = useState(false)

  return (
    <>
      <div className="flex justify-between items-center p-4 sm:p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 flex items-center justify-center">
            <Image
              src={logoError ? '/images/icon.png' : '/images/icon.png'}
              alt="Exam Quiz"
              width={40}
              height={40}
              priority
              onError={() => setLogoError(true)}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Exam Quiz ✨</h1>
            <p className="text-gray-300">Explore the Joy of Learning! 🎓</p>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          {learnerInfo?.role === 'admin' && (
            <Link
              href="/admin"
              className="text-white hover:text-gray-300 transition-colors flex items-center gap-2"
            >
              <span className="text-xl">⚙️</span>
              <span>Admin Panel</span>
            </Link>
          )}
          <Link
            href="/info"
            className="text-white hover:text-gray-300 transition-colors flex items-center gap-2"
          >
            <span className="text-xl">ℹ️</span>
            <span>Info</span>
          </Link>
          <Link
            href="/achievements"
            className="text-white hover:text-gray-300 transition-colors flex items-center gap-2"
          >
            <span className="text-xl">🏆</span>
            <span>Achievements</span>
          </Link>
          <Link
            href="/chat"
            className="text-white hover:text-gray-300 transition-colors flex items-center gap-2"
          >
            <span className="text-xl">💬</span>
            <span>Chat</span>
          </Link>
          <Link href="/profile" className="block">
            <div className="w-12 h-12 rounded-full bg-blue-400 overflow-hidden hover:opacity-80 transition-opacity">
              <Image
                src={avatarError ? '/images/avatars/1.png' : learnerInfo?.avatar ? `/images/avatars/${learnerInfo.avatar}.png` : '/images/avatars/1.png'}
                alt="Profile"
                width={48}
                height={48}
                priority
                onError={() => setAvatarError(true)}
              />
            </div>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-white hover:text-gray-300 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-[#1B1464] z-50 p-4">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center">
                <Image
                  src={logoError ? '/images/icon.png' : '/images/icon.png'}
                  alt="Exam Quiz"
                  width={40}
                  height={40}
                  priority
                  onError={() => setLogoError(true)}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Exam Quiz ✨</h1>
                <p className="text-gray-300">Explore the Joy of Learning! 🎓</p>
              </div>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col gap-6">
            {learnerInfo?.role === 'admin' && (
              <Link
                href="/admin"
                className="text-white hover:text-gray-300 transition-colors flex items-center gap-3 text-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-2xl">⚙️</span>
                <span>Admin Panel</span>
              </Link>
            )}
            <Link
              href="/info"
              className="text-white hover:text-gray-300 transition-colors flex items-center gap-3 text-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="text-2xl">ℹ️</span>
              <span>Info</span>
            </Link>
            <Link
              href="/achievements"
              className="text-white hover:text-gray-300 transition-colors flex items-center gap-3 text-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="text-2xl">🏆</span>
              <span>Achievements</span>
            </Link>
            <Link
              href="/chat"
              className="text-white hover:text-gray-300 transition-colors flex items-center gap-3 text-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="text-2xl">💬</span>
              <span>Chat</span>
            </Link>
            <Link
              href="/profile"
              className="text-white hover:text-gray-300 transition-colors flex items-center gap-3 text-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="w-8 h-8 rounded-full bg-blue-400 overflow-hidden">
                <Image
                  src={avatarError ? '/images/avatars/1.png' : learnerInfo?.avatar ? `/images/avatars/${learnerInfo.avatar}.png` : '/images/avatars/1.png'}
                  alt="Profile"
                  width={32}
                  height={32}
                  priority
                  onError={() => setAvatarError(true)}
                />
              </div>
              <span>Profile</span>
            </Link>
          </div>
        </div>
      )}
    </>
  )
} 