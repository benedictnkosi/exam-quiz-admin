import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyA19oZVV-JIleL-XlEbDK8k-KPNk1vod8E",
  authDomain: "exam-quiz-b615e.firebaseapp.com",
  projectId: "exam-quiz-b615e",
  storageBucket: "exam-quiz-b615e.firebasestorage.app",
  messagingSenderId: "619089624841",
  appId: "1:619089624841:web:8cdb542ea7c8eb22681dd8",
  measurementId: "G-MR80CKN8H9"
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)

// Analytics can only be initialized on the client side
let analytics = null
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app)
}

export { app, db, auth, analytics, storage } 