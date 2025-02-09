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
          // Create learner record when user logs in
          await createLearner(user.uid, user.email || '', user.displayName)
          // Get the ID token and set it in a cookie
          const token = await user.getIdToken()
          Cookies.set('__firebase_auth_token', token)
        } catch (error) {
          console.error('Error creating learner:', error)
        }
      } else {
        // Remove the token cookie when signed out
        Cookies.remove('__firebase_auth_token')
        if (pathname !== '/login') {
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