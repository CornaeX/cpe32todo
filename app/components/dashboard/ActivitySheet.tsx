"use client";

import React from "react";
import { Button, Field, Sheet, TextInput } from "@/app/components/ui";

interface ActivitySheetProps {
  open: boolean;
  name: string;
  creating: boolean;
  onNameChange: (name: string) => void;
  onClose: () => void;
  onCreate: () => void;
}

export default function ActivitySheet({ open, name, creating, onNameChange, onClose, onCreate }: ActivitySheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="เพิ่มกิจกรรมใหม่">
      <div className="space-y-5">
        <Field label="ชื่อกิจกรรม (Activity Name)">
          <TextInput
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="กรอกชื่อกิจกรรม..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim() && !creating) onCreate();
            }}
          />
        </Field>

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={creating}>
            ยกเลิก
          </Button>
          <Button variant="primary" onClick={onCreate} loading={creating} disabled={!name.trim() || creating}>
            สร้างกิจกรรม
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
