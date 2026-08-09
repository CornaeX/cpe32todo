import type { TaskStatus, TaskWithId } from "@/lib/firestore";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  statusText: string;
  details: string;
  imageUrl?: string;
  imageKey?: string;
}

export interface Department {
  id: string;
  name: string;
  tasks: Task[];
}

export function toUiTask(t: TaskWithId): Task {
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    statusText: t.statusText,
    details: t.details,
    imageUrl: t.imageUrl ?? undefined,
    imageKey: t.imageKey ?? undefined,
  };
}
