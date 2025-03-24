'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const { user, loading } = useAuth()

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!user) return

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/learner?uid=${user.uid}`)
            const data = await response.json()
            console.log(data)

            if (!loading && (!user || data.role !== 'admin')) {
                router.push('/')
            }
        }
        checkAdminStatus()
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        )
    }


    return <>{children}</>
} 