"use client";

import React from "react";
import type { ActivityWithId } from "@/lib/firestore";
import { Button, IconButton, ProgressRing, Skeleton, EmptyState, tagColorForIndex } from "@/app/components/ui";
import { PlusIcon, TrashIcon, SpinnerIcon, CalendarPlusIcon } from "@/app/components/icons";

interface ActivitiesNavProps {
  activities: ActivityWithId[];
  activitiesLoading: boolean;
  selectedActivityId: string | null;
  onSelect: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
  deletingId: string | null;
  onAddActivity: () => void;
}

export default function ActivitiesNav({
  activities,
  activitiesLoading,
  selectedActivityId,
  onSelect,
  onDelete,
  deletingId,
  onAddActivity,
}: ActivitiesNavProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <Button variant="secondary" size="md" onClick={onAddActivity} className="w-full mb-4 !rounded-2xl shrink-0">
        <PlusIcon width={16} height={16} />
        เพิ่มกิจกรรม
      </Button>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none -mx-1 px-1 space-y-1.5">
        {activitiesLoading ? (
          <div className="space-y-2 pt-0.5">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            icon={<CalendarPlusIcon width={22} height={22} />}
            title="ยังไม่มีกิจกรรม"
            description="กดปุ่มด้านบนเพื่อสร้างกิจกรรมแรกของคุณ"
          />
        ) : (
          activities.map((act, index) => {
            const isSelected = act.id === selectedActivityId;
            const total = act.taskStats?.total ?? 0;
            const done = act.taskStats?.done ?? 0;
            const progress = total === 0 ? 0 : Math.round((done / total) * 100);
            const color = tagColorForIndex(index);
            const deleting = deletingId === act.id;

            return (
              <div
                key={act.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(act.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelect(act.id);
                }}
                className={`group relative flex items-center gap-3 rounded-2xl border p-2.5 transition-all cursor-pointer focus-ring ${
                  isSelected ? "border-border-strong bg-surface shadow-sm" : "border-transparent hover:bg-surface-muted"
                }`}
              >
                <ProgressRing percent={progress} size={40} strokeWidth={4} color={color} />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm truncate ${isSelected ? "font-semibold text-ink" : "font-medium text-ink-muted"}`}>
                    {act.name}
                  </p>
                  <p className="text-[11px] text-ink-faint">
                    {done}/{total} งานสำเร็จ
                  </p>
                </div>
                <IconButton
                  onClick={(e) => onDelete(e, act.id, act.name)}
                  disabled={deleting}
                  aria-label={`ลบกิจกรรม ${act.name}`}
                  title="ลบกิจกรรม"
                  className="w-7 h-7 text-ink-faint hover:text-danger hover:bg-danger-soft shrink-0 disabled:opacity-40"
                >
                  {deleting ? <SpinnerIcon width={14} height={14} /> : <TrashIcon width={14} height={14} />}
                </IconButton>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
