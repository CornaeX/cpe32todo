"use client";

import ActivityDashboard from "@/app/components/ActivityDashboard";
import LoginPage from "@/app/components/LoginPage";
import { useAuth } from "@/context/AuthContext";

function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#1b1c31] text-white font-sans">
      <div className="flex items-center gap-3 text-sm text-gray-400 font-light">
        <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
        กำลังโหลด...
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
