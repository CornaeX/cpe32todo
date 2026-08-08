"use client";

import React, { useState } from 'react';

// Types
interface Task {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  statusText: string;
  statusColor: string;
  details: string;
  imageUrl?: string;
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
  statusDotColor: string; // e.g. bg-[#00ff66] or bg-[#ffcc00]
  activeBorderColor: string; // e.g. border-[#00ff66]
  activeRightBarColor: string; // e.g. bg-[#00ff66]
  progressColor: string;
  progressPercent: number;
  bgGradient: string;
}

export const ActivityDashboard: React.FC = () => {
  // Navigation / Sidebar State with distinct colors per item
  const [activities] = useState<Activity[]>([
    {
      id: '1',
      name: 'รับน้อง69',
      statusDotColor: 'bg-[#00ff66]',
      activeBorderColor: 'border-[#00ff66]',
      activeRightBarColor: 'bg-[#00ff66]',
      progressColor: 'bg-[#50f1b5]',
      progressPercent: 100,
      bgGradient: 'from-[#222436] via-[#242c38] to-[#376949]',
    },
    {
      id: '2',
      name: 'เว็บTo-Do',
      statusDotColor: 'bg-[#ffcc00]',
      activeBorderColor: 'border-[#ffcc00]',
      activeRightBarColor: 'bg-[#ffcc00]',
      progressColor: 'bg-[#ffcc00]',
      progressPercent: 30,
      bgGradient: 'from-[#222436] via-[#2a2c38] to-[#696137]',
    },
  ]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('2');

  // View Navigation: 'board' vs 'detail-editor'
  const [currentView, setCurrentView] = useState<'board' | 'detail-editor'>('board');

  // Floating Modal State (Step 1)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTargetDeptId, setModalTargetDeptId] = useState<string | null>(null);
  const [modalTaskTitle, setModalTaskTitle] = useState<string>('');
  const [modalTaskStatus, setModalTaskStatus] = useState<'todo' | 'doing' | 'done'>('doing');

  // Active Task for Detail Editor (Step 2)
  const [activeDeptId, setActiveDeptId] = useState<string | null>('3');
  const [editingTask, setEditingTask] = useState<Task>({
    id: 't1',
    title: 'ออกแบบเว็บ',
    status: 'doing',
    statusText: 'กำลังทำเรื่องยื่น',
    statusColor: 'bg-yellow-400',
    details:
      '• 55555555555555555555555555555555555555\n55555555555555555555555555555555555555\n55555555555555555555555555555555555555\n55555555555555555555555555555555555555\n55555555555555555555555555555555555555\n55555555',
    imageUrl: 'https://placehold.co/400x400/22253b/8ee3f5?text=Miku+Image',
  });

  // Department Columns
  const [departments, setDepartments] = useState<Department[]>([
    { id: '1', name: 'ประธาน/รอง', topGlowColor: 'bg-blue-400', tasks: [] },
    { id: '2', name: 'เอกสาร', topGlowColor: 'bg-white', tasks: [] },
    {
      id: '3',
      name: 'ศิลป์',
      topGlowColor: 'bg-[#8ec63f]',
      tasks: [
        {
          id: 't1',
          title: 'ออกแบบเว็บ',
          status: 'doing',
          statusText: 'กำลังทำเรื่องยื่น',
          statusColor: 'bg-yellow-400',
          details:
            '• 55555555555555555555555555555555555555\n55555555555555555555555555555555555555\n55555555555555555555555555555555555555\n55555555555555555555555555555555555555\n55555555555555555555555555555555555555\n55555555',
          imageUrl: 'https://placehold.co/400x400/22253b/8ee3f5?text=Miku+Image',
        },
      ],
    },
    { id: '4', name: 'สื่อ', topGlowColor: 'bg-purple-500', tasks: [] },
    { id: '5', name: 'เลขา', topGlowColor: 'bg-red-500', tasks: [] },
    { id: '6', name: 'เหรัญญิก', topGlowColor: 'bg-emerald-400', tasks: [] },
  ]);

  // Statistics
  const allTasks = departments.flatMap((d) => d.tasks);
  const todoCount = allTasks.filter((t) => t.status === 'todo').length;
  const inProgressCount = allTasks.filter((t) => t.status === 'doing').length;
  const doneCount = allTasks.filter((t) => t.status === 'done').length;

  // Handlers
  const handleOpenModal = (deptId: string) => {
    setModalTargetDeptId(deptId);
    setModalTaskTitle('');
    setModalTaskStatus('doing');
    setIsModalOpen(true);
  };

  const handleModalApply = () => {
    if (!modalTaskTitle.trim() || !modalTargetDeptId) return;

    let color = 'bg-orange-500';
    let defaultStatusText = 'สิ่งที่ต้องทำ';

    if (modalTaskStatus === 'doing') {
      color = 'bg-yellow-400';
      defaultStatusText = 'กำลังทำเรื่องยื่น';
    } else if (modalTaskStatus === 'done') {
      color = 'bg-emerald-400';
      defaultStatusText = 'สำเร็จ';
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: modalTaskTitle.trim(),
      status: modalTaskStatus,
      statusText: defaultStatusText,
      statusColor: color,
      details: '',
      imageUrl: '',
    };

    setActiveDeptId(modalTargetDeptId);
    setEditingTask(newTask);
    setIsModalOpen(false);

    setCurrentView('detail-editor');
  };

  const handleSaveDetails = () => {
    if (!activeDeptId) return;

    setDepartments((prev) =>
      prev.map((dept) => {
        if (dept.id === activeDeptId) {
          const exists = dept.tasks.some((t) => t.id === editingTask.id);
          const updatedTasks = exists
            ? dept.tasks.map((t) => (t.id === editingTask.id ? editingTask : t))
            : [...dept.tasks, editingTask];
          return { ...dept, tasks: updatedTasks };
        }
        return dept;
      })
    );

    setCurrentView('board');
  };

  const handleOpenExistingTask = (deptId: string, task: Task) => {
    setActiveDeptId(deptId);
    setEditingTask(task);
    setCurrentView('detail-editor');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setEditingTask((prev) => ({ ...prev, imageUrl }));
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#1b1c31] text-white font-sans overflow-hidden relative">
      {/* ================= UPDATED SIDEBAR WITH DYNAMIC COLORS & RIGHT BAR ================= */}
      <aside className="w-64 bg-[#23253b] p-4 flex flex-col border-r border-[#2d2f48] h-full overflow-hidden shrink-0 relative">
        {/* Title */}
        <div className="flex items-baseline gap-2 mb-5 shrink-0">
          <h1 className="text-2xl font-light tracking-wide">Activity</h1>
          <span className="text-xs text-gray-400 uppercase font-mono">CPE32</span>
        </div>

        {/* Add Activity Button */}
        <button className="w-full py-2 mb-5 border border-gray-500/60 rounded-full text-sm font-light hover:bg-[#2d2f48] hover:border-gray-400 transition-all shrink-0">
          + เพิ่มกิจกรรม
        </button>

        {/* Scrollable Badges (No visible scrollbar) */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-0.5 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {activities.map((act) => {
            const isSelected = act.id === selectedActivityId;
            return (
              <div
                key={act.id}
                onClick={() => setSelectedActivityId(act.id)}
                className={`group relative p-3 rounded-2xl bg-gradient-to-r ${act.bgGradient} transition-all duration-200 cursor-pointer overflow-hidden ${
                  isSelected
                    ? `border ${act.activeBorderColor} shadow-lg scale-[1.02] opacity-100 ring-1 ring-white/20`
                    : 'border border-gray-700/60 opacity-60 hover:opacity-100 hover:border-gray-500'
                }`}
              >
                {/* Dynamic Right Side Accent Bar for Selected Item */}
                {isSelected && (
                  <div
                    className={`absolute right-0 top-0 bottom-0 w-1.5 ${act.activeRightBarColor} rounded-r-2xl shadow-sm`}
                  />
                )}

                <div className="flex items-center justify-between mb-2.5 pr-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${act.statusDotColor} shadow-sm shrink-0`} />
                    <span
                      className={`text-sm truncate transition-colors ${
                        isSelected ? 'font-semibold text-white' : 'font-light text-gray-300'
                      }`}
                    >
                      {act.name}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#1b1c31]/80 h-2 rounded-full overflow-hidden p-0.5 border border-gray-700/50">
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
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-12 px-8 flex justify-end items-center bg-[#1e2038] shrink-0 border-b border-[#2a2c47]">
          <span className="text-xs text-gray-400 font-mono">555@nu.ac.th</span>
        </header>

        {currentView === 'board' ? (
          /* BOARD VIEW */
          <div className="p-8 space-y-8 overflow-y-auto flex-1">
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
                <span className="text-lg text-gray-300 font-light ml-2">20%</span>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-3xl">
                <div className="bg-[#24263e] border border-orange-500/80 rounded-2xl py-3 px-4 text-center">
                  <div className="text-lg font-bold text-orange-400 mb-0.5">{todoCount}</div>
                  <div className="text-xs text-gray-300 font-light">สิ่งที่ต้องทำ</div>
                </div>
                <div className="bg-[#24263e] border border-yellow-500/80 rounded-2xl py-3 px-4 text-center">
                  <div className="text-lg font-bold text-yellow-400 mb-0.5">{inProgressCount}</div>
                  <div className="text-xs text-gray-300 font-light">กำลังทำ</div>
                </div>
                <div className="bg-[#24263e] border border-emerald-500/80 rounded-2xl py-3 px-4 text-center">
                  <div className="text-lg font-bold text-emerald-400 mb-0.5">{doneCount}</div>
                  <div className="text-xs text-gray-300 font-light">สำเร็จ</div>
                </div>
              </div>
            </section>

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

                    {dept.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleOpenExistingTask(dept.id, task)}
                        className="w-full py-1.5 px-3 bg-[#2a2c47] border border-gray-700 rounded-full flex items-center justify-center gap-2 shadow-sm cursor-pointer hover:border-gray-400 transition-all"
                      >
                        <span className={`w-2 h-2 rounded-full ${task.statusColor}`} />
                        <span className="text-[11px] text-gray-300 truncate">{task.title}</span>
                      </div>
                    ))}

                    <button
                      onClick={() => handleOpenModal(dept.id)}
                      className="text-xs text-gray-400 font-light hover:text-white transition-colors mt-1"
                    >
                      + เพิ่มงาน
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          /* DETAIL EDITOR VIEW */
          <div className="p-8 space-y-6 overflow-y-auto flex-1">
            <div className="flex items-center gap-3">
              <span className={`w-3.5 h-3.5 rounded-full ${editingTask.statusColor}`} />

              <input
                type="text"
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                className="bg-[#2a2d42] border border-gray-400/80 rounded-2xl px-6 py-1.5 text-sm text-gray-200 font-light focus:outline-none focus:border-white min-w-[200px]"
              />

              <button
                onClick={handleSaveDetails}
                className="bg-[#2a2d42] border border-gray-400/80 hover:bg-[#343852] text-xs text-gray-300 px-5 py-2 rounded-xl transition-all"
              >
                APPLY
              </button>

              <button
                onClick={() => setCurrentView('board')}
                className="bg-[#2a2d42] border border-gray-400/80 hover:bg-[#343852] text-xs text-red-400 px-5 py-2 rounded-xl transition-all"
              >
                CANCEL
              </button>
            </div>

            <div>
              <div className="inline-block bg-[#2a2d42] border border-gray-400/80 rounded-2xl px-5 py-1.5 text-xs text-gray-300 font-light">
                สถานะ :{' '}
                <input
                  type="text"
                  value={editingTask.statusText}
                  onChange={(e) => setEditingTask({ ...editingTask, statusText: e.target.value })}
                  className="bg-transparent focus:outline-none text-gray-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-8 pt-2">
              <div className="col-span-7 space-y-3">
                <h3 className="text-base text-gray-200 font-light">รายละเอียด</h3>
                <div className="bg-[#2a2d42]/60 border border-gray-400/80 rounded-2xl p-4 min-h-[260px] flex flex-col">
                  <textarea
                    value={editingTask.details}
                    onChange={(e) => setEditingTask({ ...editingTask, details: e.target.value })}
                    placeholder="• กรอกรายละเอียดงาน..."
                    className="w-full flex-1 bg-transparent text-gray-300 text-sm font-light leading-relaxed resize-none focus:outline-none"
                  />
                </div>
              </div>

              <div className="col-span-5 flex justify-end">
                <div className="w-[300px] bg-[#2a2d42]/80 border border-gray-400/80 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg">
                  <div className="p-3 flex items-center justify-center flex-1 bg-[#23253b]/50 min-h-[240px]">
                    {editingTask.imageUrl ? (
                      <img
                        src={editingTask.imageUrl}
                        alt="Task Attachment"
                        className="max-h-[220px] object-contain rounded-lg"
                      />
                    ) : (
                      <div className="text-xs text-gray-500 font-light text-center">
                        ยังไม่ได้เลือกรูปภาพ
                      </div>
                    )}
                  </div>

                  <label className="border-t border-gray-500/50 py-3 text-center text-xs text-gray-300 font-light cursor-pointer hover:bg-[#343852] transition-colors block">
                    แก้ไข/เพิ่มรูปภาพ (ได้แค่รูปเดียว)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FLOATING MODAL PANEL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#23253b] border border-gray-600 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-700/60 pb-3">
              <h3 className="text-lg font-medium text-white">เพิ่มงานใหม่</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-300 font-light">ชื่องาน (Work Name)</label>
              <input
                type="text"
                value={modalTaskTitle}
                onChange={(e) => setModalTaskTitle(e.target.value)}
                placeholder="กรอกชื่องาน..."
                className="w-full bg-[#1b1c31] border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-colors"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-300 font-light">สถานะ (Status)</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setModalTaskStatus('todo')}
                  className={`py-2 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 border transition-all ${
                    modalTaskStatus === 'todo'
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400 font-medium'
                      : 'border-gray-700 bg-[#1b1c31] text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  สิ่งที่ต้องทำ
                </button>

                <button
                  type="button"
                  onClick={() => setModalTaskStatus('doing')}
                  className={`py-2 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 border transition-all ${
                    modalTaskStatus === 'doing'
                      ? 'border-yellow-400 bg-yellow-400/10 text-yellow-300 font-medium'
                      : 'border-gray-700 bg-[#1b1c31] text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  กำลังทำ
                </button>

                <button
                  type="button"
                  onClick={() => setModalTaskStatus('done')}
                  className={`py-2 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 border transition-all ${
                    modalTaskStatus === 'done'
                      ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300 font-medium'
                      : 'border-gray-700 bg-[#1b1c31] text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  สำเร็จ
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 text-xs font-medium text-gray-400 hover:text-white border border-gray-600 rounded-full hover:bg-gray-700/50 transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleModalApply}
                disabled={!modalTaskTitle.trim()}
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