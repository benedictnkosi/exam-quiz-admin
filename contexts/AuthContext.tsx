'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter, usePathname } from 'next/navigation'
import Cookies from 'js-cookie'
import { createLearner } from '@/services/api'

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get the ID token and set it in a cookie
          const token = await user.getIdToken()
          Cookies.set('__firebase_auth_token', token)
        } catch (error) {
          console.error('Error creating learner:', error)
        }
      } else {
        // Remove the token cookie when signed out
        console.log('Removing token cookie')
        Cookies.remove('__firebase_auth_token')
        const publicPaths = ['/login', '/register', '/reset-password', '/onboarding']
        if (!publicPaths.includes(pathname)) {
          router.push('/login')
        }
      }
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [pathname])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 