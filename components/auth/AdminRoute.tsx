'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const { user, loading } = useAuth()

    useEffect(() => {
        if (!loading && (!user || !user.isAdmin)) {
            router.push('/')
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    if (!user || !user.isAdmin) {
        return null
    }

    return <>{children}</>
} 