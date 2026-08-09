import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ActivityWithId, DepartmentDoc } from "./types";

/**
 * Standard department columns every activity board starts with, matching
 * the original prototype's fixed 6-column layout. New activities are seeded
 * with these so the board renders identically to before, just backed by
 * real Firestore documents instead of hardcoded state.
 */
const DEFAULT_DEPARTMENTS: Array<Pick<DepartmentDoc, "name" | "topGlowColor">> = [
  { name: "ประธาน/รอง", topGlowColor: "bg-blue-400" },
  { name: "เอกสาร", topGlowColor: "bg-white" },
  { name: "ศิลป์", topGlowColor: "bg-[#8ec63f]" },
  { name: "สื่อ", topGlowColor: "bg-purple-500" },
  { name: "เลขา", topGlowColor: "bg-red-500" },
  { name: "เหรัญญิก", topGlowColor: "bg-emerald-400" },
];

function activitiesCollection() {
  return collection(db, "activities");
}

/**
 * Subscribes to the activities list in real time, ordered by creation date.
 * Returns an unsubscribe function — call it on cleanup (e.g. in a
 * useEffect's return) to stop listening.
 */
export function getActivities(
  callback: (activities: ActivityWithId[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(activitiesCollection(), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const activities = snapshot.docs.map(
        (docSnap) =>
          ({
            id: docSnap.id,
            ...docSnap.data(),
          }) as ActivityWithId
      );
      callback(activities);
    },
    (error) => onError?.(error)
  );
}

/**
 * Creates a new activity and seeds it with the standard department columns.
 * Returns the new activity's document id.
 */
export async function createActivity(input: {
  name: string;
  createdBy: string;
}): Promise<string> {
  const activityRef = await addDoc(activitiesCollection(), {
    name: input.name,
    createdAt: serverTimestamp(),
    createdBy: input.createdBy,
    taskStats: { total: 0, done: 0 },
  });

  const batch = writeBatch(db);
  const departmentsRef = collection(db, "activities", activityRef.id, "departments");
  DEFAULT_DEPARTMENTS.forEach((dept, index) => {
    const deptRef = doc(departmentsRef);
    batch.set(deptRef, {
      name: dept.name,
      topGlowColor: dept.topGlowColor,
      order: index,
    });
  });
  await batch.commit();

  return activityRef.id;
}
