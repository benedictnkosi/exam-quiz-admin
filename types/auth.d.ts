import { User as FirebaseUser } from 'firebase/auth'

declare module 'firebase/auth' {
  interface User extends FirebaseUser {
    role?: 'admin' | 'admin_pending' | 'learner'
  }
} 