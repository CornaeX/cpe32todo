import type { Timestamp } from "firebase/firestore";

export type TaskStatus = "todo" | "doing" | "done";

/** Denormalized counters kept on the activity doc so the sidebar can show
 * real-time progress without a listener per activity's task subcollections. */
export interface ActivityTaskStats {
  total: number;
  done: number;
}

export interface ActivityDoc {
  name: string;
  createdAt: Timestamp | null;
  createdBy: string;
  taskStats: ActivityTaskStats;
}

export interface DepartmentDoc {
  name: string;
  topGlowColor?: string;
  order: number;
}

export interface TaskDoc {
  title: string;
  status: TaskStatus;
  statusText: string;
  details: string;
  imageUrl: string | null;
  /**
   * UploadThing file key for imageUrl, when it was uploaded through this
   * app. Stored alongside the URL so a replaced/deleted image can be
   * cleaned up from UploadThing storage reliably (without needing to
   * parse the key back out of the URL). Older tasks saved before this
   * field existed will simply have it as null/undefined.
   */
  imageKey?: string | null;
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface ActivityWithId extends ActivityDoc {
  id: string;
}

export interface DepartmentWithId extends DepartmentDoc {
  id: string;
}

export interface TaskWithId extends TaskDoc {
  id: string;
}
