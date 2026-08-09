"use client";

import React from "react";
import type { TaskStatus } from "@/lib/firestore";
import { useTheme } from "@/context/ThemeContext";
import { CloseIcon, MoonIcon, SpinnerIcon, SunIcon, UserIcon } from "@/app/components/icons";

/* ============================= Button ============================= */

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover shadow-sm shadow-primary/25",
  secondary: "bg-surface text-ink border border-border-strong hover:bg-surface-muted",
  danger: "bg-danger-soft text-danger border border-danger/30 hover:bg-danger/15",
  ghost: "text-ink-muted hover:text-ink hover:bg-surface-muted",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "text-xs px-3.5 py-2 gap-1.5",
  md: "text-sm px-4 py-2.5 gap-2",
  lg: "text-sm px-5 py-3 gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded-xl transition-all focus-ring disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <SpinnerIcon width={14} height={14} />}
      {children}
    </button>
  );
}

/* ============================ Icon button =========================== */

export function IconButton({
  className = "",
  children,
  "aria-label": ariaLabel,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center rounded-full transition-colors focus-ring active:scale-[0.96] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ============================ Progress ring =========================== */

export function ProgressRing({
  percent,
  size = 56,
  strokeWidth = 6,
  color = "var(--color-primary)",
  trackColor = "var(--color-border)",
  children,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = c - (clamped / 100) * c;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}

/* ============================ Progress bar =========================== */

export function ProgressBar({ percent, color = "bg-primary" }: { percent: number; color?: string }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-500 ease-out`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

/* ======================== Per-activity / per-department accents ======================== */
/* Curated hue sets used purely to help tell activities and departments apart
   in lists — never used to convey status (status always pairs a color with
   a label so meaning never rides on color alone). */

export const ACTIVITY_TAG_COLORS = ["#5B57F2", "#14919B", "#EA6C4D", "#D99B1F", "#3B82C4", "#D6538F"];
export function tagColorForIndex(index: number): string {
  return ACTIVITY_TAG_COLORS[index % ACTIVITY_TAG_COLORS.length];
}

export const DEPARTMENT_ACCENTS = ["#3B82C4", "#8B7CF0", "#3FAE7B", "#D6538F", "#D99B1F", "#5B6B8C"];
export function departmentAccent(index: number): string {
  return DEPARTMENT_ACCENTS[index % DEPARTMENT_ACCENTS.length];
}

/* ============================ Status styling =========================== */

export const STATUS_META: Record<TaskStatus, { label: string; dot: string; text: string; bg: string }> = {
  todo: { label: "สิ่งที่ต้องทำ", dot: "bg-todo", text: "text-todo", bg: "bg-todo-soft" },
  doing: { label: "กำลังทำ", dot: "bg-doing", text: "text-doing", bg: "bg-doing-soft" },
  done: { label: "สำเร็จ", dot: "bg-done", text: "text-done", bg: "bg-done-soft" },
};

export function StatusDot({ status, className = "" }: { status: TaskStatus; className?: string }) {
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${STATUS_META[status].dot} ${className}`} />;
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.bg} ${meta.text}`}>
      <StatusDot status={status} />
      {meta.label}
    </span>
  );
}

export function StatusSegmented({
  value,
  onChange,
  className = "",
}: {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {(Object.keys(STATUS_META) as TaskStatus[]).map((key) => {
        const meta = STATUS_META[key];
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-2 text-xs font-medium transition-all focus-ring ${
              active ? `${meta.bg} ${meta.text} border-current` : "border-border text-ink-muted bg-surface hover:border-border-strong"
            }`}
          >
            <StatusDot status={key} />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

/* ================================ Sheet ================================ */
/* Adaptive modal: a bottom sheet on narrow screens, a centered dialog on
   larger ones. Used for every modal in the app so the interaction pattern
   stays consistent. */

export function Sheet({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${
          wide ? "sm:max-w-lg" : "sm:max-w-md"
        } sm:mx-4 sm:mb-4 bg-surface rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-sheet-up`}
      >
        <div className="sticky top-0 bg-surface/95 backdrop-blur flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border rounded-t-3xl sm:rounded-t-2xl">
          <div className="flex flex-col gap-1.5">
            <span className="sm:hidden mx-auto -mt-1 mb-1 h-1 w-9 rounded-full bg-border-strong" />
            <h3 className="text-base font-semibold text-ink">{title}</h3>
          </div>
          <IconButton
            onClick={onClose}
            aria-label="ปิด"
            className="w-8 h-8 text-ink-muted hover:bg-surface-muted hover:text-ink -mr-1.5"
          >
            <CloseIcon width={18} height={18} />
          </IconButton>
        </div>
        <div className="px-5 sm:px-6 py-5 pb-safe">{children}</div>
      </div>
    </div>
  );
}

/* =============================== Theme toggle ============================ */

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <IconButton
      onClick={toggleTheme}
      aria-label={isDark ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}
      title={isDark ? "โหมดสว่าง" : "โหมดมืด"}
      className={`w-9 h-9 text-ink-muted hover:text-ink hover:bg-surface-muted ${className}`}
    >
      {isDark ? <SunIcon width={18} height={18} /> : <MoonIcon width={18} height={18} />}
    </IconButton>
  );
}

/* =============================== Avatar ================================ */

export function Avatar({ src, alt, size = 32 }: { src?: string | null; alt: string; size?: number }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        style={{ width: size, height: size }}
        className="rounded-full object-cover border border-border shrink-0"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size }}
      className="rounded-full bg-primary-soft text-primary flex items-center justify-center border border-border shrink-0"
    >
      <UserIcon width={size * 0.55} height={size * 0.55} />
    </span>
  );
}

/* ============================== Empty state ============================= */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-14 px-6">
      <div className="w-12 h-12 rounded-2xl bg-surface-muted text-ink-faint flex items-center justify-center">{icon}</div>
      <div className="space-y-1 max-w-xs">
        <p className="text-sm font-medium text-ink">{title}</p>
        {description && <p className="text-xs text-ink-muted leading-relaxed">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ================================ Skeleton =============================== */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-surface-muted rounded-lg ${className}`} />;
}

/* ================================= Field ================================= */

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      className={`w-full bg-surface-muted border border-border rounded-xl px-4 py-2.5 text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-primary focus:bg-surface transition-colors focus-ring ${className}`}
      {...rest}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      className={`w-full bg-surface-muted border border-border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-primary focus:bg-surface transition-colors resize-none focus-ring ${className}`}
      {...rest}
    />
  );
}
