import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'

// Check if we're running in a browser (Vite) or Node.js environment
const isBrowser = typeof window !== 'undefined'

function getFirebaseConfig() {
  if (isBrowser) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }
  } else {
    return {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID,
    }
  }
}

// Lazy initialization - only initialize when first accessed
let _db: Firestore | null = null

export function getDb(): Firestore {
  if (!_db) {
    const config = getFirebaseConfig()
    console.log('Initializing Firebase with project:', config.projectId)
    const app = getApps().length === 0 ? initializeApp(config) : getApp()
    _db = getFirestore(app)
  }
  return _db
}
