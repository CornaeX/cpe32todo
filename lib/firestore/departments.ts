import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { DepartmentWithId } from "./types";

function departmentsCollection(activityId: string) {
  return collection(db, "activities", activityId, "departments");
}

/**
 * Subscribes to an activity's departments in real time, ordered by their
 * `order` field. Returns an unsubscribe function.
 */
export function getDepartments(
  activityId: string,
  callback: (departments: DepartmentWithId[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(departmentsCollection(activityId), orderBy("order", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const departments = snapshot.docs.map(
        (docSnap) =>
          ({
            id: docSnap.id,
            ...docSnap.data(),
          }) as DepartmentWithId
      );
      callback(departments);
    },
    (error) => onError?.(error)
  );
}

/** Creates a new department column under an activity. */
export async function createDepartment(
  activityId: string,
  input: { name: string; topGlowColor?: string; order: number }
): Promise<string> {
  const ref = await addDoc(departmentsCollection(activityId), {
    name: input.name,
    topGlowColor: input.topGlowColor ?? "bg-gray-400",
    order: input.order,
  });
  return ref.id;
}
