"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TaskStatus } from "@/lib/firestore";
import { EmptyState, ProgressRing, STATUS_META, Skeleton, StatusDot, departmentAccent } from "@/app/components/ui";
import { ChevronRightIcon, ClipboardIcon, GripIcon, PlusIcon } from "@/app/components/icons";
import type { Department, Task } from "./types";

interface BoardViewProps {
  activityName: string;
  activityColor: string;
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
  progressPercent: number;
  departmentsLoading: boolean;
  departments: Department[];
  onOpenTask: (deptId: string, task: Task) => void;
  onAddTask: (deptId: string) => void;
  onMoveTask: (fromDeptId: string, toDeptId: string, taskId: string) => void;
}

interface DragState {
  taskId: string;
  fromDeptId: string;
  title: string;
  status: TaskStatus;
  pointerX: number;
  pointerY: number;
}

function StatChip({ label, value, tone }: { label: string; value: number; tone: TaskStatus }) {
  const meta = STATUS_META[tone];
  return (
    <div className={`shrink-0 min-w-[104px] rounded-2xl border border-border ${meta.bg} px-4 py-2.5 text-center`}>
      <div className={`text-lg font-bold ${meta.text}`}>{value}</div>
      <div className="text-[11px] text-ink-muted mt-0.5">{label}</div>
    </div>
  );
}

function DepartmentCard({
  dept,
  accent,
  onOpenTask,
  onAddTask,
  isDropTarget,
  draggingTaskId,
  registerCardRef,
  onTaskPointerDown,
}: {
  dept: Department;
  accent: string;
  onOpenTask: (deptId: string, task: Task) => void;
  onAddTask: (deptId: string) => void;
  isDropTarget: boolean;
  draggingTaskId: string | null;
  registerCardRef: (deptId: string, el: HTMLDivElement | null) => void;
  onTaskPointerDown: (e: React.PointerEvent, deptId: string, task: Task) => void;
}) {
  const total = dept.tasks.length;
  const done = dept.tasks.filter((t) => t.status === "done").length;

  return (
    <div
      ref={(el) => registerCardRef(dept.id, el)}
      className={`bg-surface border rounded-2xl overflow-hidden flex flex-col shadow-sm shadow-ink/[0.02] transition-colors ${
        isDropTarget ? "border-primary ring-2 ring-primary/30" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: accent }} />
          <h3 className="text-sm font-semibold text-ink truncate">{dept.name}</h3>
        </div>
        <span className="text-[11px] text-ink-faint font-mono shrink-0">
          {done}/{total}
        </span>
      </div>

      <div className="flex-1 divide-y divide-border min-h-[64px]">
        {dept.tasks.length === 0 ? (
          <p
            className={`px-4 py-7 text-xs text-center transition-colors ${
              isDropTarget ? "text-primary font-medium" : "text-ink-faint"
            }`}
          >
            {isDropTarget ? "ปล่อยที่นี่เพื่อย้ายงาน" : "ยังไม่มีงานในฝ่ายนี้"}
          </p>
        ) : (
          dept.tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center transition-opacity ${
                draggingTaskId === task.id ? "opacity-30" : "opacity-100"
              }`}
            >
              <span
                onPointerDown={(e) => onTaskPointerDown(e, dept.id, task)}
                className="pl-3 py-3 pr-1 text-ink-faint/50 hover:text-ink-faint cursor-grab active:cursor-grabbing touch-none shrink-0"
                aria-label="ลากเพื่อย้ายงานไปฝ่ายอื่น"
                role="button"
              >
                <GripIcon width={14} height={14} />
              </span>
              <button
                onClick={() => onOpenTask(dept.id, task)}
                className="flex-1 flex items-center gap-2.5 pr-4 pl-1 py-3 text-left hover:bg-surface-muted transition-colors focus-ring min-w-0"
              >
                <StatusDot status={task.status} />
                <span className="text-sm text-ink truncate flex-1">{task.title}</span>
                <ChevronRightIcon width={15} height={15} className="text-ink-faint shrink-0" />
              </button>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => onAddTask(dept.id)}
        className="flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold text-primary hover:bg-primary-soft transition-colors border-t border-border focus-ring"
      >
        <PlusIcon width={14} height={14} />
        เพิ่มงาน
      </button>
    </div>
  );
}

export default function BoardView({
  activityName,
  activityColor,
  todoCount,
  inProgressCount,
  doneCount,
  progressPercent,
  departmentsLoading,
  departments,
  onOpenTask,
  onAddTask,
  onMoveTask,
}: BoardViewProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoveredDeptId, setHoveredDeptId] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const hoveredDeptIdRef = useRef<string | null>(null);
  const dragInfoRef = useRef<{ taskId: string; fromDeptId: string } | null>(null);

  // Drag only ever starts from a client-side pointer event, so by the time
  // `drag` is non-null we're guaranteed to be on the client and `document`
  // is safe to use for the portal below — no separate mount-detection
  // effect needed.

  const registerCardRef = useCallback((deptId: string, el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(deptId, el);
    else cardRefs.current.delete(deptId);
  }, []);

  const handleTaskPointerDown = useCallback((e: React.PointerEvent, deptId: string, task: Task) => {
    // Only left click / primary touch/pen contact should start a drag.
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    dragInfoRef.current = { taskId: task.id, fromDeptId: deptId };
    setDrag({
      taskId: task.id,
      fromDeptId: deptId,
      title: task.title,
      status: task.status,
      pointerX: e.clientX,
      pointerY: e.clientY,
    });
  }, []);

  const isDragging = drag !== null;

  useEffect(() => {
    if (!isDragging) return;

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    const updateHoveredDept = (x: number, y: number) => {
      let found: string | null = null;
      cardRefs.current.forEach((el, deptId) => {
        const rect = el.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          found = deptId;
        }
      });
      hoveredDeptIdRef.current = found;
      setHoveredDeptId(found);
    };

    const handleMove = (e: PointerEvent) => {
      e.preventDefault();
      setDrag((prev) => (prev ? { ...prev, pointerX: e.clientX, pointerY: e.clientY } : prev));
      updateHoveredDept(e.clientX, e.clientY);
    };

    const finishDrag = () => {
      const info = dragInfoRef.current;
      const dropDeptId = hoveredDeptIdRef.current;
      if (info && dropDeptId && dropDeptId !== info.fromDeptId) {
        onMoveTask(info.fromDeptId, dropDeptId, info.taskId);
      }
      dragInfoRef.current = null;
      hoveredDeptIdRef.current = null;
      setDrag(null);
      setHoveredDeptId(null);
    };

    window.addEventListener("pointermove", handleMove, { passive: false });
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    return () => {
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
    };
  }, [isDragging, onMoveTask]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-7 max-w-6xl mx-auto w-full">
      <section className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
        <div className="flex items-center gap-4 min-w-0">
          <ProgressRing percent={progressPercent} size={64} strokeWidth={6} color={activityColor}>
            <span className="text-sm font-semibold text-ink">{progressPercent}%</span>
          </ProgressRing>
          <div className="min-w-0">
            <p className="text-xs text-ink-faint mb-0.5">กิจกรรมที่เลือก</p>
            <h2 className="text-lg sm:text-xl font-semibold text-ink truncate">{activityName}</h2>
          </div>
        </div>

        <div className="flex gap-2.5 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:ml-auto">
          <StatChip label="สิ่งที่ต้องทำ" value={todoCount} tone="todo" />
          <StatChip label="กำลังทำ" value={inProgressCount} tone="doing" />
          <StatChip label="สำเร็จ" value={doneCount} tone="done" />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h3 className="text-sm font-semibold text-ink-muted">การดำเนินงานของแต่ละฝ่าย</h3>
          {departments.length > 1 && (
            <p className="text-[11px] text-ink-faint hidden sm:block">ลากไอคอน ⠿ เพื่อย้ายงานข้ามฝ่ายได้</p>
          )}
        </div>

        {departmentsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        ) : departments.length === 0 ? (
          <EmptyState
            icon={<ClipboardIcon width={22} height={22} />}
            title="ยังไม่มีฝ่ายงาน"
            description="กิจกรรมนี้ยังไม่มีฝ่ายที่ตั้งไว้"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept, index) => (
              <DepartmentCard
                key={dept.id}
                dept={dept}
                accent={departmentAccent(index)}
                onOpenTask={onOpenTask}
                onAddTask={onAddTask}
                isDropTarget={hoveredDeptId === dept.id && !!drag && drag.fromDeptId !== dept.id}
                draggingTaskId={drag?.taskId ?? null}
                registerCardRef={registerCardRef}
                onTaskPointerDown={handleTaskPointerDown}
              />
            ))}
          </div>
        )}
      </section>

      {drag &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-[100] pointer-events-none flex items-center gap-2 max-w-[240px] px-3 py-2 rounded-xl bg-surface border border-primary shadow-lg shadow-ink/10 text-sm font-medium text-ink"
            style={{ left: drag.pointerX + 14, top: drag.pointerY + 14 }}
          >
            <StatusDot status={drag.status} />
            <span className="truncate">{drag.title}</span>
          </div>,
          document.body
        )}
    </div>
  );
}
