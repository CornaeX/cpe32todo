import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";

/**
 * Firebase client configuration.
 *
 * All values are read from NEXT_PUBLIC_* environment variables so they are
 * safely exposed to the browser bundle. Never hardcode credentials here —
 * set them in `.env.local` (see `.env.example`).
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Avoid re-initializing the app on every hot-reload / re-render in the browser.
const firebaseApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const auth: Auth = getAuth(firebaseApp);

export { firebaseApp, auth };
