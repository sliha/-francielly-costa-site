import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAuth, Auth } from 'firebase/auth'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { getMessaging, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const isConfigured = !!firebaseConfig.apiKey

let _app: FirebaseApp | null = null

if (isConfigured) {
  _app = getApps().length ? getApp() : initializeApp(firebaseConfig)
}

// Type assertions are safe: on Vercel env vars are always set.
// During local builds without env vars these are null but never called.
export const db = (isConfigured ? getFirestore(_app!) : null) as Firestore
export const auth = (isConfigured ? getAuth(_app!) : null) as Auth
export const storage = (isConfigured ? getStorage(_app!) : null) as FirebaseStorage

export const getMessagingInstance = async () => {
  if (!_app) return null
  const supported = await isSupported()
  if (!supported) return null
  return getMessaging(_app)
}

export default _app
