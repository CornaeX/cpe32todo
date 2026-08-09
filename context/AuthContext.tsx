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
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const NOT_ALLOWED_MESSAGE =
  "อนุญาตเฉพาะบัญชี Google ที่ได้รับสิทธิ์เท่านั้น กรุณาเข้าสู่ระบบด้วยบัญชีที่ถูกต้อง";

/**
 * Checks the `/allowlist` Firestore collection for an entry matching this
 * email (see firestore.rules — that's the actual access-control list;
 * this is just the client-side read of it, gated by the same rule that
 * only lets a signed-in user read their own entry). Any failure — no
 * entry, not signed in yet, a network error — is treated as "not allowed".
 */
async function isAllowedEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  try {
    const snap = await getDoc(doc(db, "allowlist", email.toLowerCase()));
    return snap.exists();
  } catch {
    return false;
  }
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
      if (firebaseUser && !(await isAllowedEmail(firebaseUser.email))) {
        // Defensive check: covers any session (e.g. from before this
        // account was allowlisted, or a stale token, or after being
        // removed from the allowlist) that isn't currently allowed.
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

    try {
      const result = await signInWithPopup(auth, provider);

      if (!(await isAllowedEmail(result.user.email))) {
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
