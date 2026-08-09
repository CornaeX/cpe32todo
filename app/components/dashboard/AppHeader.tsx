"use client";

import React, { useState } from "react";
import { Avatar, IconButton, ThemeToggle } from "@/app/components/ui";
import { ChevronDownIcon, LogOutIcon, MenuIcon } from "@/app/components/icons";

interface AppHeaderProps {
  onOpenDrawer: () => void;
  userPhotoURL?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  onLogout: () => void;
}

export default function AppHeader({ onOpenDrawer, userPhotoURL, userEmail, userName, onLogout }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="h-14 md:h-16 px-3 md:px-8 flex items-center justify-between gap-3 bg-surface/85 backdrop-blur border-b border-border shrink-0 pt-safe">
      <div className="flex items-center gap-1.5 md:hidden">
        <IconButton onClick={onOpenDrawer} aria-label="เปิดเมนูกิจกรรม" className="w-9 h-9 text-ink hover:bg-surface-muted">
          <MenuIcon width={20} height={20} />
        </IconButton>
        <div className="flex items-baseline gap-1.5 pl-0.5">
          <span className="text-base font-semibold text-ink tracking-tight">Activity</span>
          <span className="text-[10px] text-primary bg-primary-soft px-1.5 py-0.5 rounded-full font-mono font-medium">CPE32</span>
        </div>
      </div>

      <div className="hidden md:block" />

      <div className="flex items-center gap-1.5 shrink-0">
        <ThemeToggle />
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full pl-0.5 pr-0.5 md:pr-3 py-0.5 hover:bg-surface-muted transition-colors focus-ring"
          >
            <Avatar src={userPhotoURL} alt={userName ?? "Profile"} size={32} />
            <span className="hidden md:inline text-xs text-ink-muted font-mono max-w-[180px] truncate">{userEmail}</span>
            <ChevronDownIcon width={14} height={14} className="hidden md:inline text-ink-faint shrink-0" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-2xl shadow-xl shadow-ink/10 z-50 py-1.5 animate-scale-in origin-top-right">
                <div className="px-4 py-2.5 border-b border-border mb-1 md:hidden">
                  <p className="text-xs text-ink-muted font-mono truncate">{userEmail}</p>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-surface-muted transition-colors focus-ring"
                >
                  <LogOutIcon width={16} height={16} className="text-ink-muted" />
                  ออกจากระบบ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
