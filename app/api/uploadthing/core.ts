import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { isNuEmail, verifyFirebaseIdToken } from "@/lib/verifyFirebaseIdToken";

const f = createUploadthing();

/**
 * Task image uploads.
 *
 * UploadThing's route builder only restricts by broad category ("image")
 * server-side — it doesn't support limiting to specific extensions like
 * JPG/PNG/WEBP at this layer. The JPG/JPEG/PNG/WEBP restriction requested
 * for this app is enforced client-side (accept attribute + MIME-type check
 * before upload, see lib/uploadthing.ts / ActivityDashboard.tsx). This
 * route still caps file size and count as a server-side guard.
 */
export const ourFileRouter = {
  taskImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      // This endpoint is hit directly by the browser, outside Firestore —
      // Firestore Security Rules don't cover it, so identity has to be
      // checked here too, the same way the UI and Firestore both restrict
      // to the one allowed account. The client sends its Firebase ID token
      // as a Bearer token (see lib/uploadthing.ts); reject anything else
      // outright so this route can't be used to upload files anonymously
      // or from any other account, even by someone calling it directly.
      const authHeader = req.headers.get("authorization");
      const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      const verified = await verifyFirebaseIdToken(idToken);

      if (!verified || !isNuEmail(verified.email)) {
        throw new UploadThingError("Unauthorized");
      }

      return { uploaderEmail: verified.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Task image uploaded", {
        by: metadata.uploaderEmail,
        key: file.key,
        url: file.ufsUrl,
      });
      return { uploadedBy: metadata.uploaderEmail };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
