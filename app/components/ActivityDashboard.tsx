"use client";

import React, { useState } from 'react';

// Types
interface Task {
  id: string;
  title: string;
  statusColor: string;
}

interface Department {
  id: string;
  name: string;
  borderColor: string;
  tasks: Task[];
}

interface Activity {
  id: string;
  name: string;
  statusDotColor: string;
  progressColor: string;
  progressPercent: number;
  bgGradient: string; // Tailwind gradient classes
}

// Preset gradients with dark overlay on left fading into accent color on right
const GRADIENT_PALETTES = [
  {
    dot: 'bg-[#00ff66]',
    progress: 'bg-[#50f1b5]',
    bgGradient: 'bg-gradient-to-r from-[#222436] via-[#222436] to-[#3a7550]',
  },
  {
    dot: 'bg-[#ffcc00]',
    progress: 'bg-[#50f1b5]',
    bgGradient: 'bg-gradient-to-r from-[#222436] via-[#222436] to-[#756832]',
  },
  {
    dot: 'bg-[#a855f7]',
    progress: 'bg-[#c084fc]',
    bgGradient: 'bg-gradient-to-r from-[#222436] via-[#222436] to-[#5b3275]',
  },
  {
    dot: 'bg-[#38bdf8]',
    progress: 'bg-[#38bdf8]',
    bgGradient: 'bg-gradient-to-r from-[#222436] via-[#222436] to-[#265375]',
  },
  {
    dot: 'bg-[#f43f5e]',
    progress: 'bg-[#fb7185]',
    bgGradient: 'bg-gradient-to-r from-[#222436] via-[#222436] to-[#752636]',
  },
];

const getRandomPalette = () => {
  return GRADIENT_PALETTES[Math.floor(Math.random() * GRADIENT_PALETTES.length)];
};

export const ActivityDashboard: React.FC = () => {
  // Navigation / Sidebar State
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      name: 'รับน้อง69',
      statusDotColor: 'bg-[#00ff66]',
      progressColor: 'bg-[#50f1b5]',
      progressPercent: 100,
      bgGradient: 'bg-gradient-to-r from-[#222436] via-[#242c38] to-[#376949]',
    },
    {
      id: '2',
      name: 'เว็บTo-Do',
      statusDotColor: 'bg-[#ffcc00]',
      progressColor: 'bg-[#50f1b5]',
      progressPercent: 30,
      bgGradient: 'bg-gradient-to-r from-[#222436] via-[#2a2c38] to-[#696137]',
    },
  ]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('2');

  // Board Task Counts
  const [todoCount] = useState<number>(1);
  const [inProgressCount] = useState<number>(1);
  const [doneCount] = useState<number>(0);
  const progressPercentage = 20;

  // Function to add a new activity with a randomized gradient background
  const handleAddActivity = () => {
    const palette = getRandomPalette();
    const newId = String(activities.length + 1);
    const newActivity: Activity = {
      id: newId,
      name: `กิจกรรม ${newId}`,
      statusDotColor: palette.dot,
      progressColor: palette.progress,
      progressPercent: Math.floor(Math.random() * 80) + 20,
      bgGradient: palette.bgGradient,
    };

    setActivities((prev) => [...prev, newActivity]);
    setSelectedActivityId(newId);
  };

  // Department Columns State
  const [departments] = useState<Department[]>([
    { id: '1', name: 'ประธาน/รอง', borderColor: 'border-blue-400', tasks: [] },
    { id: '2', name: 'เอกสาร', borderColor: 'border-slate-300', tasks: [] },
    {
      id: '3',
      name: 'ศิลป์',
      borderColor: 'border-purple-300',
      tasks: [{ id: 't1', title: 'ออกแบบเว็บ', statusColor: 'bg-yellow-400' }],
    },
    { id: '4', name: 'สื่อ', borderColor: 'border-purple-500', tasks: [] },
    { id: '5', name: 'เลขา', borderColor: 'border-red-400', tasks: [] },
    {
      id: '6',
      name: 'เหรัญญิก',
      borderColor: 'border-green-400',
      tasks: [{ id: 't2', title: 'เว็บ To-Do', statusColor: 'bg-orange-500' }],
    },
  ]);

  return (
    <div className="flex h-screen w-full bg-[#1b1c31] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#23253b] p-4 flex flex-col border-r border-[#2d2f48]">
        {/* Header */}
        <div className="flex items-baseline gap-2 mb-6">
          <h1 className="text-2xl font-light tracking-wide">Activity</h1>
          <span className="text-xs text-gray-400 uppercase font-mono">CPE32</span>
        </div>

        {/* Add Activity Button */}
        <button
          onClick={handleAddActivity}
          className="w-full py-2 mb-6 border border-gray-500/60 rounded-full text-sm font-light hover:bg-[#2d2f48] active:scale-95 transition-all"
        >
          + เพิ่มกิจกรรม
        </button>

        {/* Activity List */}
        <div className="space-y-3 overflow-y-auto pr-1">
          {activities.map((act) => {
            const isSelected = act.id === selectedActivityId;
            return (
              <div
                key={act.id}
                onClick={() => setSelectedActivityId(act.id)}
                className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${act.bgGradient} ${
                  isSelected
                    ? 'border-gray-300 ring-1 ring-gray-300/30'
                    : 'border-gray-600/60 opacity-80 hover:opacity-100 hover:border-gray-400'
                }`}
              >
                {/* Title & Dot */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-3 h-3 rounded-full ${act.statusDotColor} shadow-sm`} />
                  <span className="text-sm font-medium text-gray-100">{act.name}</span>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full bg-[#2a2c3a] h-2 rounded-full overflow-hidden p-0.5 border border-gray-700/50">
                  <div
                    className={`h-full ${act.progressColor} rounded-full transition-all duration-300`}
                    style={{ width: `${act.progressPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-12 px-8 flex justify-end items-center bg-[#1e2038]">
          <span className="text-xs text-gray-400 font-mono">555@nu.ac.th</span>
        </header>

        {/* Board Content */}
        <div className="p-8 space-y-8 overflow-y-auto">
          {/* Team Board Section */}
          <section>
            <div className="flex items-center gap-6 mb-4">
              <h2 className="text-xl font-normal">Team Board</h2>

              {/* Segmented Progress Indicator */}
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-2.5 bg-emerald-300 rounded-full" />
                <div className="w-8 h-2.5 bg-gray-700 rounded-full" />
                <div className="w-8 h-2.5 bg-gray-700 rounded-full" />
                <div className="w-8 h-2.5 bg-gray-700 rounded-full" />
                <div className="w-8 h-2.5 bg-gray-700 rounded-full" />
              </div>

              <span className="text-lg text-gray-300 font-light ml-2">
                {progressPercentage}%
              </span>
            </div>

            {/* Task Status Cards */}
            <div className="grid grid-cols-3 gap-4 max-w-3xl">
              {/* To Do */}
              <div className="bg-[#24263e] border border-orange-500/80 rounded-2xl py-3 px-4 text-center">
                <div className="text-lg font-bold text-orange-400 mb-0.5">{todoCount}</div>
                <div className="text-xs text-gray-300 font-light">สิ่งที่ต้องทำ</div>
              </div>

              {/* In Progress */}
              <div className="bg-[#24263e] border border-yellow-500/80 rounded-2xl py-3 px-4 text-center">
                <div className="text-lg font-bold text-yellow-400 mb-0.5">
                  {inProgressCount}
                </div>
                <div className="text-xs text-gray-300 font-light">กำลังทำ</div>
              </div>

              {/* Done */}
              <div className="bg-[#24263e] border border-emerald-500/80 rounded-2xl py-3 px-4 text-center">
                <div className="text-lg font-bold text-emerald-400 mb-0.5">{doneCount}</div>
                <div className="text-xs text-gray-300 font-light">สำเร็จ</div>
              </div>
            </div>
          </section>

          {/* Department Progress Section */}
          <section>
            <h2 className="text-xl font-normal mb-6">การดำเนินงานของแต่ละฝ่าย</h2>

            {/* Department Columns Grid */}
            <div className="grid grid-cols-6 gap-3">
              {departments.map((dept) => (
                <div key={dept.id} className="flex flex-col items-center gap-2">
                  {/* Department Pill Header */}
                  <div
                    className={`w-full py-1.5 px-3 bg-[#24263e] border ${dept.borderColor} rounded-full text-center text-xs font-light text-gray-200`}
                  >
                    {dept.name}
                  </div>

                  {/* Tasks List */}
                  {dept.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="w-full py-1.5 px-3 bg-[#2a2c47] border border-gray-700 rounded-full flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span className={`w-2 h-2 rounded-full ${task.statusColor}`} />
                      <span className="text-[11px] text-gray-300 truncate">{task.title}</span>
                    </div>
                  ))}

                  {/* Add Task Link */}
                  <button className="text-xs text-gray-400 font-light hover:text-white transition-colors mt-1">
                    + เพิ่มงาน
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ActivityDashboard;