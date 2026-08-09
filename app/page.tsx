"use client";

import ActivityDashboard from "@/app/components/dashboard/ActivityDashboard";
import LoginPage from "@/app/components/LoginPage";
import { useAuth } from "@/context/AuthContext";
import { ProgressRing } from "@/app/components/ui";

function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <ProgressRing percent={40} size={40} strokeWidth={4} />
        <span className="text-xs text-ink-muted">กำลังโหลด...</span>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return <ActivityDashboard />;
}
