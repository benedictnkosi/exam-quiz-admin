'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const { user, loading } = useAuth()
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!user) {
                setIsAdmin(false)
                return
            }

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/learner?uid=${user.uid}`)
                const data = await response.json()
                setIsAdmin(data.role === 'admin')
            } catch (error) {
                console.error('Error checking admin status:', error)
                setIsAdmin(false)
            }
        }

        if (!loading) {
            checkAdminStatus()
        }
    }, [user, loading])

    useEffect(() => {
        if (!loading && isAdmin === false) {
            router.push('/')
        }
    }, [loading, isAdmin, router])

    if (loading || isAdmin === null) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    if (!isAdmin) {
        return null
    }

    return <>{children}</>
} 