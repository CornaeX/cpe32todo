import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

/**
 * Extracts an UploadThing file key from one of its file URLs
 * (e.g. "https://<app>.ufs.sh/f/<key>" or the legacy "https://utfs.io/f/<key>").
 * Used as a fallback for images saved before an explicit `imageKey` was
 * stored alongside `imageUrl` in Firestore.
 */
function extractFileKeyFromUrl(url: string): string | null {
  try {
    const { pathname } = new URL(url);
    const match = pathname.match(/\/f\/([^/]+)\/?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Best-effort cleanup of task images that were uploaded to UploadThing but
 * are no longer referenced (replaced by a newer upload, or discarded by
 * cancelling an edit). This is intentionally lenient: any failure here just
 * means an orphaned file lingers in storage, which isn't harmful, so we
 * never surface an error to the caller for this endpoint.
 *
 * NOTE: this route does not verify the caller's identity server-side yet —
 * that's deferred to a later security-hardening phase, consistent with the
 * rest of this app's auth model (Firebase Auth is only checked client-side
 * so far).
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { keys?: unknown; urls?: unknown };
    const keysInput = Array.isArray(body.keys) ? body.keys.filter((k): k is string => typeof k === "string") : [];
    const urlsInput = Array.isArray(body.urls) ? body.urls.filter((u): u is string => typeof u === "string") : [];

    const keysFromUrls = urlsInput
      .map(extractFileKeyFromUrl)
      .filter((k): k is string => !!k);

    const keys = Array.from(new Set([...keysInput, ...keysFromUrls]));

    if (keys.length === 0) {
      return NextResponse.json({ deleted: [] });
    }

    await utapi.deleteFiles(keys);
    return NextResponse.json({ deleted: keys });
  } catch (error) {
    console.error("Failed to delete UploadThing file(s)", error);
    return NextResponse.json({ deleted: [] });
  }
}
