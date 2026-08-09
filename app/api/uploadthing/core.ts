import { createUploadthing, type FileRouter } from "uploadthing/next";

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
      // Identity is established client-side via Firebase Authentication.
      // Verifying the Firebase ID token server-side (so this endpoint can
      // reject unauthenticated requests outright) is deferred to a later
      // security-hardening pass — for now we just record whatever the
      // client sends for traceability in upload logs.
      const uploaderEmail = req.headers.get("x-user-email") ?? "unknown";
      return { uploaderEmail };
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
