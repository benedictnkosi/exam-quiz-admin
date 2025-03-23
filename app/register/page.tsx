'use client'

import { useState, useEffect } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5'
import { logAnalyticsEvent } from '@/lib/analytics'

export default function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    // Get onboarding data from URL params
    const onboardingData = {
        grade: searchParams.get('grade') || '',
        school_name: searchParams.get('school') || '',
        school_address: searchParams.get('school_address') || '',
        school_latitude: searchParams.get('school_latitude') || '',
        school_longitude: searchParams.get('school_longitude') || '',
        curriculum: searchParams.get('curriculum') || '',
        difficultSubject: searchParams.get('difficultSubject') || '',
        avatar: searchParams.get('avatar') || '1',
        name: searchParams.get('name') || '',
    }

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            setLoading(false)
            return
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            // Store user data including onboarding information
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/learner/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    terms: "1,2,3,4",
                    ...onboardingData
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                if (data.message !== 'Successfully created learner') {
                    throw new Error('Failed to create user profile')
                }
            }

            // Log registration success
            await logAnalyticsEvent('register_success', {
                user_id: user.uid,
                email: email,
                grade: onboardingData.grade,
                school: onboardingData.school_name,
                curriculum: onboardingData.curriculum
            });

            router.push('/')
            router.refresh()
        } catch (error) {
            console.error('Registration error:', error)
            setError('Failed to create account')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1B1464] to-[#2B2F77]">
            <div className="w-full max-w-md space-y-8 p-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white">Create Your Account</h1>
                    <p className="mt-4 text-xl text-white/90">
                        🎯 Final step! Set up your login details to start your learning journey.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleEmailSignUp} className="mt-8 space-y-6">
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
                                className="appearance-none relative block w-full px-4 py-4 bg-white/10 text-white placeholder-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-base"
                                placeholder="Email address"
                                disabled={loading}
                            />
                        </div>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-4 bg-white/10 text-white placeholder-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-base"
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
                        <div className="relative">
                            <input
                                id="confirm-password"
                                name="confirm-password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-4 bg-white/10 text-white placeholder-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-base"
                                placeholder="Confirm password"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-4 px-4 rounded-full text-lg font-semibold bg-white text-[#1e1b4b] hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-[#1e1b4b] disabled:opacity-50 transition-all duration-200"
                    >
                        {loading ? 'Creating account...' : 'Create Account 🚀'}
                    </button>
                </form>

                <div className="text-center text-white/90">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-white hover:text-white/80 underline">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    )
} 