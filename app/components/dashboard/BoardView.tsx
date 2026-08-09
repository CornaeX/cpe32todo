"use client";

import React from "react";
import type { TaskStatus } from "@/lib/firestore";
import { EmptyState, ProgressRing, STATUS_META, Skeleton, StatusDot, departmentAccent } from "@/app/components/ui";
import { ChevronRightIcon, ClipboardIcon, PlusIcon } from "@/app/components/icons";
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
}: {
  dept: Department;
  accent: string;
  onOpenTask: (deptId: string, task: Task) => void;
  onAddTask: (deptId: string) => void;
}) {
  const total = dept.tasks.length;
  const done = dept.tasks.filter((t) => t.status === "done").length;

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col shadow-sm shadow-ink/[0.02]">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: accent }} />
          <h3 className="text-sm font-semibold text-ink truncate">{dept.name}</h3>
        </div>
        <span className="text-[11px] text-ink-faint font-mono shrink-0">
          {done}/{total}
        </span>
      </div>

      <div className="flex-1 divide-y divide-border">
        {dept.tasks.length === 0 ? (
          <p className="px-4 py-7 text-xs text-ink-faint text-center">ยังไม่มีงานในฝ่ายนี้</p>
        ) : (
          dept.tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => onOpenTask(dept.id, task)}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-surface-muted transition-colors focus-ring"
            >
              <StatusDot status={task.status} />
              <span className="text-sm text-ink truncate flex-1">{task.title}</span>
              <ChevronRightIcon width={15} height={15} className="text-ink-faint shrink-0" />
            </button>
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
}: BoardViewProps) {
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
        <h3 className="text-sm font-semibold text-ink-muted mb-3 px-0.5">การดำเนินงานของแต่ละฝ่าย</h3>

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
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
