"use client";

import React from "react";
import type { TaskStatus } from "@/lib/firestore";
import { ACCEPTED_IMAGE_ACCEPT_ATTR } from "@/lib/uploadthing";
import { Button, IconButton, StatusDot, StatusSegmented, TextArea } from "@/app/components/ui";
import { ChevronLeftIcon, CloseIcon, ImageIcon, TrashIcon } from "@/app/components/icons";
import type { Task } from "./types";

interface TaskDetailViewProps {
  task: Task;
  isDirty: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isUploading: boolean;
  uploadProgress: number;
  imageError: string | null;
  onBack: () => void;
  onTitleChange: (title: string) => void;
  onStatusChange: (status: TaskStatus) => void;
  onStatusTextChange: (text: string) => void;
  onDetailsChange: (details: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onDismissImageError: () => void;
}

export default function TaskDetailView({
  task,
  isDirty,
  isSaving,
  isDeleting,
  isUploading,
  uploadProgress,
  imageError,
  onBack,
  onTitleChange,
  onStatusChange,
  onStatusTextChange,
  onDetailsChange,
  onImageUpload,
  onSave,
  onCancel,
  onDelete,
  onDismissImageError,
}: TaskDetailViewProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border shrink-0">
        <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-3 max-w-5xl mx-auto w-full">
          <IconButton
            onClick={onBack}
            aria-label="กลับไปหน้ากระดาน"
            className="w-9 h-9 bg-surface border border-border text-ink-muted hover:text-ink hover:bg-surface-muted shrink-0"
          >
            <ChevronLeftIcon width={18} height={18} />
          </IconButton>
          <StatusDot status={task.status} className="w-3 h-3 shrink-0" />
          <input
            type="text"
            value={task.title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="ชื่องาน"
            className="flex-1 min-w-0 bg-transparent text-base font-semibold text-ink placeholder-ink-faint focus:outline-none focus-ring rounded-lg px-1 -mx-1"
          />
          <IconButton
            onClick={onDelete}
            disabled={isDeleting || isSaving}
            aria-label="ลบงาน"
            title="ลบงาน"
            className="w-9 h-9 text-ink-faint hover:text-danger hover:bg-danger-soft shrink-0 disabled:opacity-40"
          >
            <TrashIcon width={17} height={17} />
          </IconButton>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-8 space-y-6 max-w-5xl mx-auto w-full">
          <div className="space-y-3">
            <StatusSegmented value={task.status} onChange={onStatusChange} className="max-w-md" />
            <div className="inline-flex items-center gap-2 bg-surface border border-border rounded-2xl px-4 py-2 text-xs text-ink-muted max-w-full">
              <span className="shrink-0">รายละเอียดสถานะ</span>
              <input
                type="text"
                value={task.statusText}
                onChange={(e) => onStatusTextChange(e.target.value)}
                className="bg-transparent focus:outline-none text-ink min-w-0 flex-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-2.5">
              <h3 className="text-sm font-semibold text-ink-muted">รายละเอียด</h3>
              <TextArea
                value={task.details}
                onChange={(e) => onDetailsChange(e.target.value)}
                placeholder="กรอกรายละเอียดงาน..."
                className="min-h-[220px] lg:min-h-[280px]"
              />
            </div>

            <div className="lg:col-span-5 space-y-2.5">
              <h3 className="text-sm font-semibold text-ink-muted">รูปภาพแนบ</h3>
              <div className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col shadow-sm shadow-ink/[0.02]">
                <div className="relative flex items-center justify-center min-h-[220px] bg-surface-muted/60 p-3">
                  {task.imageUrl ? (
                    <img src={task.imageUrl} alt="รูปแนบของงาน" className="max-h-[240px] w-auto object-contain rounded-xl" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-ink-faint">
                      <ImageIcon width={26} height={26} />
                      <span className="text-xs">ยังไม่ได้เลือกรูปภาพ</span>
                    </div>
                  )}

                  {isUploading && (
                    <div className="absolute inset-0 bg-ink/70 rounded-xl flex flex-col items-center justify-center gap-2 text-white">
                      <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span className="text-xs">กำลังอัปโหลด... {uploadProgress}%</span>
                    </div>
                  )}
                </div>

                <label
                  className={`border-t border-border py-3 text-center text-xs font-medium text-ink-muted block transition-colors ${
                    isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-surface-muted hover:text-ink"
                  }`}
                >
                  {isUploading ? "กำลังอัปโหลด..." : "แก้ไข/เพิ่มรูปภาพ (ได้แค่รูปเดียว)"}
                  <input
                    type="file"
                    accept={ACCEPTED_IMAGE_ACCEPT_ATTR}
                    onChange={onImageUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>

              {imageError && (
                <div className="bg-danger-soft border border-danger/25 text-danger text-[11px] rounded-xl px-3 py-2.5 flex items-start justify-between gap-2">
                  <span className="leading-relaxed">{imageError}</span>
                  <button
                    type="button"
                    onClick={onDismissImageError}
                    className="shrink-0 hover:opacity-70 focus-ring rounded"
                    aria-label="ปิดข้อความแจ้งเตือน"
                  >
                    <CloseIcon width={13} height={13} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isDirty && (
        <div className="md:static fixed bottom-0 left-0 right-0 z-10 bg-surface/95 backdrop-blur border-t border-border px-4 sm:px-6 lg:px-8 py-3 pb-safe animate-fade-in shrink-0">
          <div className="flex items-center gap-3 max-w-5xl mx-auto w-full">
            <Button variant="secondary" onClick={onCancel} disabled={isSaving} className="flex-1 sm:flex-none sm:ml-auto">
              ยกเลิก
            </Button>
            <Button variant="primary" onClick={onSave} loading={isSaving} className="flex-1 sm:flex-none">
              บันทึกการเปลี่ยนแปลง
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
