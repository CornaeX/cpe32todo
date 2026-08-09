import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Verifies a Firebase Auth ID token *server-side*, without pulling in the
 * full firebase-admin SDK or a service-account secret.
 *
 * Firebase ID tokens are standard RS256 JWTs signed by Google. Their
 * signature can be checked against Google's public keys alone — the same
 * technique Firebase's own docs describe for "verifying ID tokens without
 * the Admin SDK" (https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library).
 * All we additionally need is the Firebase project id, which is already
 * public (`NEXT_PUBLIC_FIREBASE_PROJECT_ID`) — no extra secret to manage.
 *
 * This is what actually enforces "allowlisted accounts only" on the API routes that
 * the browser talks to directly (UploadThing upload/delete). Firebase
 * Authentication + Firestore Security Rules already reject unauthorized
 * reads/writes at the database layer, but Next.js API routes are separate
 * endpoints that must check identity for themselves — nothing does that
 * for them automatically.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const GOOGLE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

// Reused across invocations (module-level) so the public keys are cached
// instead of being re-fetched on every request.
const jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

export interface VerifiedFirebaseUser {
  uid: string;
  email: string;
}

/**
 * Verifies a Firebase ID token and returns the caller's uid/email, or null
 * if the token is missing, invalid, expired, or not from this Firebase
 * project. Callers must still apply their own authorization checks (e.g.
 * the allowed-account restriction) on top of this — this function only
 * proves the token is a genuine, unexpired Firebase credential.
 */
export async function verifyFirebaseIdToken(
  idToken: string | null | undefined
): Promise<VerifiedFirebaseUser | null> {
  if (!idToken || !PROJECT_ID) return null;

  try {
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
      algorithms: ["RS256"],
    });

    const uid = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    if (!uid || !email) return null;

    return { uid, email };
  } catch {
    // Expired, malformed, wrong project, bad signature, etc.
    return null;
  }
}

/**
 * Checks the same `/allowlist` Firestore collection that firestore.rules
 * and AuthContext.tsx use, via the Firestore REST API. Passing the
 * caller's own verified ID token as the Bearer credential means this read
 * is subject to the exact same security rule as the client (a signed-in
 * user may only read their own allowlist entry) — no service account or
 * elevated credentials needed here either. Returns false on any error
 * (not found, network failure, etc.) — fail closed.
 */
export async function isAllowlistedEmail(idToken: string, email: string): Promise<boolean> {
  if (!PROJECT_ID) return false;
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/allowlist/${encodeURIComponent(
    email.toLowerCase()
  )}`;

  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
    return res.ok;
  } catch {
    return false;
  }
}
