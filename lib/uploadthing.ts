"use client";

import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys, urls }),
    });
  } catch (error) {
    console.error("Failed to request deletion of orphaned uploaded image(s)", error);
  }
}
