"use client";

import React from "react";
import type { TaskStatus } from "@/lib/firestore";
import { Button, Field, Sheet, StatusSegmented, TextInput } from "@/app/components/ui";

interface TaskSheetProps {
  open: boolean;
  title: string;
  status: TaskStatus;
  creating?: boolean;
  onTitleChange: (title: string) => void;
  onStatusChange: (status: TaskStatus) => void;
  onClose: () => void;
  onApply: () => void;
}

export default function TaskSheet({
  open,
  title,
  status,
  creating = false,
  onTitleChange,
  onStatusChange,
  onClose,
  onApply,
}: TaskSheetProps) {
  return (
    <Sheet open={open} onClose={creating ? () => {} : onClose} title="เพิ่มงานใหม่">
      <div className="space-y-5">
        <Field label="ชื่องาน (Work Name)">
          <TextInput
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="กรอกชื่องาน..."
            autoFocus
            disabled={creating}
            onKeyDown={(e) => {
              if (e.key === "Enter" && title.trim() && !creating) onApply();
            }}
          />
        </Field>

        <Field label="สถานะ (Status)">
          <StatusSegmented value={status} onChange={onStatusChange} />
        </Field>

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={creating}>
            ยกเลิก
          </Button>
          <Button variant="primary" onClick={onApply} disabled={!title.trim() || creating} loading={creating}>
            เพิ่มงาน
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
