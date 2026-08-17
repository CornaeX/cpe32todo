import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { TaskStatus, TaskWithId } from "./types";

function tasksCollection(activityId: string, departmentId: string) {
  return collection(db, "activities", activityId, "departments", departmentId, "tasks");
}

function activityDocRef(activityId: string) {
  return doc(db, "activities", activityId);
}

/**
 * Subscribes to a department's tasks in real time, ordered by creation
 * date. Returns an unsubscribe function.
 */
export function getTasks(
  activityId: string,
  departmentId: string,
  callback: (tasks: TaskWithId[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(tasksCollection(activityId, departmentId), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks = snapshot.docs.map(
        (docSnap) =>
          ({
            id: docSnap.id,
            ...docSnap.data(),
          }) as TaskWithId
      );
      callback(tasks);
    },
    (error) => onError?.(error)
  );
}

/**
 * Creates a new task under a department, and atomically bumps the parent
 * activity's `taskStats` counters (used for the sidebar progress bar).
 */
export async function createTask(
  activityId: string,
  departmentId: string,
  input: {
    title: string;
    status: TaskStatus;
    statusText: string;
    details?: string;
    imageUrl?: string | null;
    imageKey?: string | null;
    createdBy: string;
  }
): Promise<string> {
  const taskRef = await addDoc(tasksCollection(activityId, departmentId), {
    title: input.title,
    status: input.status,
    statusText: input.statusText,
    details: input.details ?? "",
    imageUrl: input.imageUrl ?? null,
    imageKey: input.imageKey ?? null,
    createdBy: input.createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(activityDocRef(activityId), {
    "taskStats.total": increment(1),
    ...(input.status === "done" ? { "taskStats.done": increment(1) } : {}),
  });

  return taskRef.id;
}

/**
 * Updates a task's fields. If `status` changes to/from "done", the parent
 * activity's `taskStats.done` counter is atomically adjusted — pass the
 * task's previous status so the delta can be computed correctly.
 */
export async function updateTask(
  activityId: string,
  departmentId: string,
  taskId: string,
  updates: Partial<{
    title: string;
    status: TaskStatus;
    statusText: string;
    details: string;
    imageUrl: string | null;
    imageKey: string | null;
  }>,
  previousStatus?: TaskStatus
): Promise<void> {
  const taskRef = doc(tasksCollection(activityId, departmentId), taskId);
  await updateDoc(taskRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  if (updates.status && previousStatus && updates.status !== previousStatus) {
    const wasDone = previousStatus === "done";
    const isDone = updates.status === "done";
    if (wasDone !== isDone) {
      await updateDoc(activityDocRef(activityId), {
        "taskStats.done": increment(isDone ? 1 : -1),
      });
    }
  }
}

/**
 * Moves a task from one department to another (e.g. via drag and drop on
 * the board). Since tasks live in a subcollection keyed by department,
 * "moving" means copying the task doc into the target department's
 * subcollection and deleting it from the source — done atomically via a
 * batch write so the task is never briefly duplicated or lost. The
 * activity's `taskStats` counters are untouched since the task stays
 * within the same activity.
 */
export async function moveTask(
  activityId: string,
  fromDepartmentId: string,
  toDepartmentId: string,
  taskId: string
): Promise<void> {
  if (fromDepartmentId === toDepartmentId) return;

  const sourceRef = doc(tasksCollection(activityId, fromDepartmentId), taskId);
  const sourceSnap = await getDoc(sourceRef);
  if (!sourceSnap.exists()) return;

  const targetRef = doc(tasksCollection(activityId, toDepartmentId));

  const batch = writeBatch(db);
  batch.set(targetRef, {
    ...sourceSnap.data(),
    updatedAt: serverTimestamp(),
  });
  batch.delete(sourceRef);
  await batch.commit();
}

/**
 * Deletes a task and atomically decrements the parent activity's
 * `taskStats` counters. Pass the task's current status so `done` is only
 * decremented when it was actually counted as done.
 */
export async function deleteTask(
  activityId: string,
  departmentId: string,
  taskId: string,
  status: TaskStatus
): Promise<void> {
  const taskRef = doc(tasksCollection(activityId, departmentId), taskId);
  await deleteDoc(taskRef);

  await updateDoc(activityDocRef(activityId), {
    "taskStats.total": increment(-1),
    ...(status === "done" ? { "taskStats.done": increment(-1) } : {}),
  });
}
