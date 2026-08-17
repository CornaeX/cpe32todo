"use client";

import React, { useCallback, useRef, useState } from "react";
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
  onGripPointerDown,
  onGripPointerMove,
  onGripPointerUp,
  onGripPointerCancel,
}: {
  dept: Department;
  accent: string;
  onOpenTask: (deptId: string, task: Task) => void;
  onAddTask: (deptId: string) => void;
  isDropTarget: boolean;
  draggingTaskId: string | null;
  onGripPointerDown: (e: React.PointerEvent<HTMLSpanElement>, deptId: string, task: Task) => void;
  onGripPointerMove: (e: React.PointerEvent<HTMLSpanElement>) => void;
  onGripPointerUp: (e: React.PointerEvent<HTMLSpanElement>) => void;
  onGripPointerCancel: (e: React.PointerEvent<HTMLSpanElement>) => void;
}) {
  const total = dept.tasks.length;
  const done = dept.tasks.filter((t) => t.status === "done").length;

  return (
    <div
      // Read by elementFromPoint(...).closest("[data-dept-id]") while a
      // drag is in progress, to figure out which department the pointer
      // is currently over.
      data-dept-id={dept.id}
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
                onPointerDown={(e) => onGripPointerDown(e, dept.id, task)}
                onPointerMove={onGripPointerMove}
                onPointerUp={onGripPointerUp}
                onPointerCancel={onGripPointerCancel}
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
  const dragInfoRef = useRef<{ taskId: string; fromDeptId: string } | null>(null);
  const hoveredDeptIdRef = useRef<string | null>(null);

  // Using setPointerCapture means every subsequent pointermove/up/cancel
  // for this pointer fires on the SAME grip element no matter where the
  // finger/cursor actually travels — so we attach the move/up handlers
  // directly on the grip span itself rather than relying on window
  // listeners (which turned out to miss drops in some browsers).
  const handleGripPointerDown = useCallback((e: React.PointerEvent<HTMLSpanElement>, deptId: string, task: Task) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    dragInfoRef.current = { taskId: task.id, fromDeptId: deptId };
    hoveredDeptIdRef.current = null;
    document.body.style.userSelect = "none";

    setDrag({
      taskId: task.id,
      fromDeptId: deptId,
      title: task.title,
      status: task.status,
      pointerX: e.clientX,
      pointerY: e.clientY,
    });
    setHoveredDeptId(null);
  }, []);

  const handleGripPointerMove = useCallback((e: React.PointerEvent<HTMLSpanElement>) => {
    if (!dragInfoRef.current) return;
    e.preventDefault();

    setDrag((prev) => (prev ? { ...prev, pointerX: e.clientX, pointerY: e.clientY } : prev));

    // Pointer capture retargets hit-testing for the element that owns the
    // capture, but elementFromPoint still tells us the real element under
    // the cursor/finger — that's what we want for drop-target detection.
    const elUnderPointer = document.elementFromPoint(e.clientX, e.clientY);
    const deptEl = elUnderPointer?.closest<HTMLElement>("[data-dept-id]");
    const deptId = deptEl?.getAttribute("data-dept-id") ?? null;

    hoveredDeptIdRef.current = deptId;
    setHoveredDeptId(deptId);
  }, []);

  const finishDrag = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>, commit: boolean) => {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // no-op — capture may already have been released
      }

      const info = dragInfoRef.current;
      const dropDeptId = hoveredDeptIdRef.current;

      if (commit && info && dropDeptId && dropDeptId !== info.fromDeptId) {
        onMoveTask(info.fromDeptId, dropDeptId, info.taskId);
      }

      dragInfoRef.current = null;
      hoveredDeptIdRef.current = null;
      document.body.style.userSelect = "";
      setDrag(null);
      setHoveredDeptId(null);
    },
    [onMoveTask]
  );

  const handleGripPointerUp = useCallback((e: React.PointerEvent<HTMLSpanElement>) => finishDrag(e, true), [finishDrag]);
  const handleGripPointerCancel = useCallback((e: React.PointerEvent<HTMLSpanElement>) => finishDrag(e, false), [finishDrag]);

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
                onGripPointerDown={handleGripPointerDown}
                onGripPointerMove={handleGripPointerMove}
                onGripPointerUp={handleGripPointerUp}
                onGripPointerCancel={handleGripPointerCancel}
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