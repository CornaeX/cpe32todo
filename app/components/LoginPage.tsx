"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

const GoogleIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
    />
  </svg>
);

export default function LoginPage() {
  const { signInWithGoogle, signingIn, error, clearError } = useAuth();

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#1b1c31] text-white font-sans px-4">
      <div className="w-full max-w-sm bg-[#23253b] border border-[#2d2f48] rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-1.5">
          <div className="flex items-baseline justify-center gap-2">
            <h1 className="text-2xl font-light tracking-wide">Activity</h1>
            <span className="text-xs text-gray-400 uppercase font-mono">CPE32</span>
          </div>
          <p className="text-sm text-gray-400 font-light">เข้าสู่ระบบเพื่อดำเนินการต่อ</p>
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={signingIn}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 rounded-full py-2.5 text-sm font-medium hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          <GoogleIcon />
          {signingIn ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบด้วย Google"}
        </button>

        <p className="text-xs text-gray-400 text-center font-light leading-relaxed">
          อนุญาตเฉพาะบัญชี Google ของมหาวิทยาลัยนเรศวรที่ลงท้ายด้วย{" "}
          <span className="text-emerald-400 font-mono">@nu.ac.th</span> เท่านั้น
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-300 text-xs rounded-xl px-4 py-3 flex items-start justify-between gap-3 animate-fade-in">
            <span className="font-light leading-relaxed">{error}</span>
            <button
              type="button"
              onClick={clearError}
              className="text-red-300 hover:text-white shrink-0 font-bold"
              aria-label="ปิดข้อความแจ้งเตือน"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
