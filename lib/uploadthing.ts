"use client";

import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { auth } from "@/lib/firebase";

/**
 * Fresh Firebase ID token for the signed-in user, as an `Authorization:
 * Bearer <token>` header. Both UploadThing API routes verify this token
 * server-side (see lib/verifyFirebaseIdToken.ts) — they aren't covered by
 * Firestore Security Rules, so this is what actually keeps them restricted
 * to signed-in @nu.ac.th users instead of being callable anonymously.
 * Returns an empty object (no header) if nobody is signed in; the routes
 * then simply reject the request.
 */
export async function uploadThingAuthHeaders(): Promise<HeadersInit> {
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const { useUploadThing } = generateReactHelpers<OurFileRouter>();

/** Image types this app accepts for task attachments. */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;

/** `accept` attribute value for the file input, matching ACCEPTED_IMAGE_TYPES. */
export const ACCEPTED_IMAGE_ACCEPT_ATTR = "image/jpeg,image/jpg,image/png,image/webp";

export function isAcceptedImageType(mimeType: string): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(mimeType);
}

/**
 * Best-effort request to delete one or more UploadThing files, by key
 * and/or by URL (URLs are resolved to keys server-side). Never throws —
 * a failed cleanup just leaves an orphaned file in storage, which isn't
 * harmful, so callers can fire-and-forget this.
 */
export async function deleteUploadedFiles(input: { keys?: string[]; urls?: string[] }): Promise<void> {
  const keys = (input.keys ?? []).filter(Boolean);
  const urls = (input.urls ?? []).filter(Boolean);
  if (keys.length === 0 && urls.length === 0) return;

  try {
    await fetch("/api/uploadthing/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await uploadThingAuthHeaders()) },
      body: JSON.stringify({ keys, urls }),
    });
  } catch (error) {
    console.error("Failed to request deletion of orphaned uploaded image(s)", error);
  }
}
