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
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const NOT_ALLOWED_MESSAGE =
  "อนุญาตเฉพาะบัญชี Google ที่ได้รับสิทธิ์เท่านั้น กรุณาเข้าสู่ระบบด้วยบัญชีที่ถูกต้อง";

const NOT_NU_EMAIL_MESSAGE = "อนุญาตเฉพาะบัญชีอีเมล @nu.ac.th เท่านั้น";

/**
 * sessionStorage flag so the "signing in..." state survives the full page
 * reload that `signInWithRedirect` performs — set right before navigating
 * away, cleared once the redirect result (success or failure) comes back.
 */
const REDIRECT_PENDING_KEY = "nu-todo-auth-redirect-pending";

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
  const [signingIn, setSigningIn] = useState<boolean>(
    () => typeof window !== "undefined" && sessionStorage.getItem(REDIRECT_PENDING_KEY) === "1"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Resolve any pending redirect sign-in. This must run on every load
    // (it's a no-op — resolves to null quickly — when there's no pending
    // redirect) because it's the only place redirect-flow errors (e.g. an
    // unauthorized domain, or a genuinely failed sign-in) surface; they
    // don't come back through onAuthStateChanged.
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result) return;
        const email = result.user.email;
        if (!email || !email.toLowerCase().endsWith("@nu.ac.th")) {
          await signOut(auth);
          if (!cancelled) setError(NOT_NU_EMAIL_MESSAGE);
        } else if (!(await isAllowedEmail(email))) {
          await signOut(auth);
          if (!cancelled) setError(NOT_ALLOWED_MESSAGE);
        }
      })
      .catch(() => {
        if (!cancelled) setError("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      })
      .finally(() => {
        sessionStorage.removeItem(REDIRECT_PENDING_KEY);
        if (!cancelled) setSigningIn(false);
      });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email;
        if (!email || !email.toLowerCase().endsWith("@nu.ac.th")) {
          await signOut(auth);
          setUser(null);
          setError(NOT_NU_EMAIL_MESSAGE);
          setLoading(false);
          return;
        }

        if (!(await isAllowedEmail(email))) {
          // Defensive check: covers any session (e.g. from before this
          // account was allowlisted, or a stale token, or after being
          // removed from the allowlist) that isn't currently allowed.
          await signOut(auth);
          setUser(null);
          setError(NOT_ALLOWED_MESSAGE);
          setLoading(false);
          return;
        }
      }

      setUser(firebaseUser);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setSigningIn(true);
    sessionStorage.setItem(REDIRECT_PENDING_KEY, "1");

    const provider = new GoogleAuthProvider();

    // Redirect-based sign-in (a plain page navigation) is used instead of
    // a popup because popup sign-in depends on a popup window reliably
    // communicating back to the opener tab, which many tablet browsers
    // (Samsung Internet, in-app/WebView browsers, Chrome builds with
    // stricter third-party storage partitioning, differing popup-blocker
    // defaults) handle inconsistently — some silently fail to complete
    // the handshake even though the popup opens. That's what caused
    // sign-in to work on some devices/browsers but not others. Redirect
    // works the same way everywhere since there's no cross-window
    // messaging involved.
    try {
      await signInWithRedirect(auth, provider);
      // The browser navigates away here; nothing after this line runs
      // until the user is back and this provider re-mounts.
    } catch {
      sessionStorage.removeItem(REDIRECT_PENDING_KEY);
      setSigningIn(false);
      setError("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
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