"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

/** Only Google accounts on this domain are allowed to use the app. */
const ALLOWED_EMAIL_DOMAIN = "@nu.ac.th";

const NOT_ALLOWED_MESSAGE =
  "อนุญาตเฉพาะบัญชี Google ของมหาวิทยาลัยนเรศวรที่ลงท้ายด้วย @nu.ac.th เท่านั้น กรุณาเข้าสู่ระบบด้วยอีเมลมหาวิทยาลัยของคุณ";

function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN);
}

interface AuthContextValue {
  /** The signed-in Firebase user, or null if signed out / not yet loaded. */
  user: User | null;
  /** True while the initial auth state is being resolved. */
  loading: boolean;
  /** True while a sign-in popup is in flight. */
  signingIn: boolean;
  /** Friendly error message to show on the login page, if any. */
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && !isAllowedEmail(firebaseUser.email)) {
        // Defensive check: covers any session (e.g. from before this
        // restriction existed, or a stale token) that isn't @nu.ac.th.
        await signOut(auth);
        setUser(null);
        setError(NOT_ALLOWED_MESSAGE);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setSigningIn(true);

    const provider = new GoogleAuthProvider();
    // Hints Google to prefer nu.ac.th accounts in the picker. This is only a
    // UX hint — Google does not enforce it, so we still validate the email
    // ourselves below and in onAuthStateChanged.
    provider.setCustomParameters({ hd: "nu.ac.th" });

    try {
      const result = await signInWithPopup(auth, provider);

      if (!isAllowedEmail(result.user.email)) {
        await signOut(auth);
        setUser(null);
        setError(NOT_ALLOWED_MESSAGE);
        return;
      }

      setUser(result.user);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // User simply closed the popup — not an error worth surfacing.
        return;
      }
      setError("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSigningIn(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{ user, loading, signingIn, error, signInWithGoogle, logout, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
