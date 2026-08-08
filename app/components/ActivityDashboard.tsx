"use client";

import React, { useState } from 'react';

// Types
interface Task {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  statusColor: string;
}

interface Department {
  id: string;
  name: string;
  topGlowColor: string;
  tasks: Task[];
}

interface Activity {
  id: string;
  name: string;
  statusDotColor: string;
  progressColor: string;
  progressPercent: number;
  bgGradient: string;
}

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

  // Modal State for Adding Tasks
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [activeDeptId, setActiveDeptId] = useState<string | null>(null);
  const [taskTitleInput, setTaskTitleInput] = useState<string>('');
  const [taskStatusInput, setTaskStatusInput] = useState<'todo' | 'doing' | 'done'>('todo');

  // Department Columns State
  const [departments, setDepartments] = useState<Department[]>([
    { id: '1', name: 'ประธาน/รอง', topGlowColor: 'bg-blue-400', tasks: [] },
    { id: '2', name: 'เอกสาร', topGlowColor: 'bg-white', tasks: [] },
    {
      id: '3',
      name: 'ศิลป์',
      topGlowColor: 'bg-[#8ec63f]',
      tasks: [{ id: 't1', title: 'ออกแบบเว็บ', status: 'doing', statusColor: 'bg-yellow-400' }],
    },
    { id: '4', name: 'สื่อ', topGlowColor: 'bg-purple-500', tasks: [] },
    { id: '5', name: 'เลขา', topGlowColor: 'bg-red-500', tasks: [] },
    {
      id: '6',
      name: 'เหรัญญิก',
      topGlowColor: 'bg-emerald-400',
      tasks: [{ id: 't2', title: 'เว็บ To-Do', status: 'todo', statusColor: 'bg-orange-500' }],
    },
  ]);

  // Dynamic board statistics derived from departments data
  const allTasks = departments.flatMap((d) => d.tasks);
  const todoCount = allTasks.filter((t) => t.status === 'todo').length;
  const inProgressCount = allTasks.filter((t) => t.status === 'doing').length;
  const doneCount = allTasks.filter((t) => t.status === 'done').length;
  const progressPercentage = 20;

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

  // Modal Handlers
  const openAddTaskModal = (deptId: string) => {
    setActiveDeptId(deptId);
    setTaskTitleInput('');
    setTaskStatusInput('todo');
    setIsTaskModalOpen(true);
  };

  const closeAddTaskModal = () => {
    setIsTaskModalOpen(false);
    setActiveDeptId(null);
  };

  const handleApplyTask = () => {
    if (!taskTitleInput.trim() || !activeDeptId) return;

    let color = 'bg-orange-500'; // todo
    if (taskStatusInput === 'doing') color = 'bg-yellow-400';
    if (taskStatusInput === 'done') color = 'bg-emerald-400';

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskTitleInput.trim(),
      status: taskStatusInput,
      statusColor: color,
    };

    setDepartments((prevDepts) =>
      prevDepts.map((dept) => {
        if (dept.id === activeDeptId) {
          return { ...dept, tasks: [...dept.tasks, newTask] };
        }
        return dept;
      })
    );

    closeAddTaskModal();
  };

  return (
    <div className="flex h-screen w-full bg-[#1b1c31] text-white font-sans overflow-hidden relative">
      {/* Sidebar */}
      <aside className="w-64 bg-[#23253b] p-4 flex flex-col border-r border-[#2d2f48]">
        <div className="flex items-baseline gap-2 mb-6">
          <h1 className="text-2xl font-light tracking-wide">Activity</h1>
          <span className="text-xs text-gray-400 uppercase font-mono">CPE32</span>
        </div>

        <button
          onClick={handleAddActivity}
          className="w-full py-2 mb-6 border border-gray-500/60 rounded-full text-sm font-light hover:bg-[#2d2f48] active:scale-95 transition-all"
        >
          + เพิ่มกิจกรรม
        </button>

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
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-3 h-3 rounded-full ${act.statusDotColor} shadow-sm`} />
                  <span className="text-sm font-medium text-gray-100">{act.name}</span>
                </div>
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

            <div className="grid grid-cols-3 gap-4 max-w-3xl">
              <div className="bg-[#24263e] border border-orange-500/80 rounded-2xl py-3 px-4 text-center">
                <div className="text-lg font-bold text-orange-400 mb-0.5">{todoCount}</div>
                <div className="text-xs text-gray-300 font-light">สิ่งที่ต้องทำ</div>
              </div>

              <div className="bg-[#24263e] border border-yellow-500/80 rounded-2xl py-3 px-4 text-center">
                <div className="text-lg font-bold text-yellow-400 mb-0.5">
                  {inProgressCount}
                </div>
                <div className="text-xs text-gray-300 font-light">กำลังทำ</div>
              </div>

              <div className="bg-[#24263e] border border-emerald-500/80 rounded-2xl py-3 px-4 text-center">
                <div className="text-lg font-bold text-emerald-400 mb-0.5">{doneCount}</div>
                <div className="text-xs text-gray-300 font-light">สำเร็จ</div>
              </div>
            </div>
          </section>

          {/* Department Progress Section */}
          <section>
            <h2 className="text-xl font-normal mb-6">การดำเนินงานของแต่ละฝ่าย</h2>

            <div className="grid grid-cols-6 gap-3">
              {departments.map((dept) => (
                <div key={dept.id} className="flex flex-col items-center gap-2">
                  <div className="relative w-full pt-1">
                    <div
                      className={`absolute top-0 left-1/2 -translate-x-1/2 w-11/12 h-3 ${dept.topGlowColor} rounded-t-xl opacity-90`}
                    />
                    <div className="relative w-full py-2 px-3 bg-[#2b2c40] border border-gray-300/60 rounded-xl text-center text-xs font-light text-gray-200 z-10 shadow-md">
                      {dept.name}
                    </div>
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

                  {/* Add Task Button */}
                  <button
                    onClick={() => openAddTaskModal(dept.id)}
                    className="text-xs text-gray-400 font-light hover:text-white transition-colors mt-1"
                  >
                    + เพิ่มงาน
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Floating Add Task Panel Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#23253b] border border-gray-600 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-700/60 pb-3">
              <h3 className="text-lg font-medium text-white">เพิ่มงานใหม่</h3>
              <button
                onClick={closeAddTaskModal}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Task Name Text Box */}
            <div className="space-y-2">
              <label className="text-xs text-gray-300 font-light">ชื่องาน (Work Name)</label>
              <input
                type="text"
                value={taskTitleInput}
                onChange={(e) => setTaskTitleInput(e.target.value)}
                placeholder="กรอกชื่องาน..."
                className="w-full bg-[#1b1c31] border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-colors"
                autoFocus
              />
            </div>

            {/* Status Selector Options */}
            <div className="space-y-2">
              <label className="text-xs text-gray-300 font-light">สถานะ (Status)</label>
              <div className="grid grid-cols-3 gap-2">
                {/* TODO */}
                <button
                  type="button"
                  onClick={() => setTaskStatusInput('todo')}
                  className={`py-2 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 border transition-all ${
                    taskStatusInput === 'todo'
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400 font-medium'
                      : 'border-gray-700 bg-[#1b1c31] text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  สิ่งที่ต้องทำ
                </button>

                {/* DOING */}
                <button
                  type="button"
                  onClick={() => setTaskStatusInput('doing')}
                  className={`py-2 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 border transition-all ${
                    taskStatusInput === 'doing'
                      ? 'border-yellow-400 bg-yellow-400/10 text-yellow-300 font-medium'
                      : 'border-gray-700 bg-[#1b1c31] text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  กำลังทำ
                </button>

                {/* DONE */}
                <button
                  type="button"
                  onClick={() => setTaskStatusInput('done')}
                  className={`py-2 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 border transition-all ${
                    taskStatusInput === 'done'
                      ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300 font-medium'
                      : 'border-gray-700 bg-[#1b1c31] text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  สำเร็จ
                </button>
              </div>
            </div>

            {/* Floating Action Buttons under the Panel */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeAddTaskModal}
                className="px-5 py-2 text-xs font-medium text-gray-400 hover:text-white border border-gray-600 rounded-full hover:bg-gray-700/50 transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleApplyTask}
                disabled={!taskTitleInput.trim()}
                className="px-6 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 rounded-full hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              >
                APPLY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityDashboard;