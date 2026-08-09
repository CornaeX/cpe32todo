"use client";

import React from "react";
import type { TaskStatus } from "@/lib/firestore";
import { Button, Field, Sheet, StatusSegmented, TextInput } from "@/app/components/ui";

interface TaskSheetProps {
  open: boolean;
  title: string;
  status: TaskStatus;
  onTitleChange: (title: string) => void;
  onStatusChange: (status: TaskStatus) => void;
  onClose: () => void;
  onApply: () => void;
}

export default function TaskSheet({ open, title, status, onTitleChange, onStatusChange, onClose, onApply }: TaskSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="เพิ่มงานใหม่">
      <div className="space-y-5">
        <Field label="ชื่องาน (Work Name)">
          <TextInput
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="กรอกชื่องาน..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && title.trim()) onApply();
            }}
          />
        </Field>

        <Field label="สถานะ (Status)">
          <StatusSegmented value={status} onChange={onStatusChange} />
        </Field>

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="ghost" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button variant="primary" onClick={onApply} disabled={!title.trim()}>
            เพิ่มงาน
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
