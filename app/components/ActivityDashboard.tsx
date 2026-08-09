"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  createActivity,
  createTask,
  getActivities,
  getDepartments,
  getTasks,
  updateTask,
  type ActivityWithId,
  type DepartmentWithId,
  type TaskStatus,
  type TaskWithId,
} from '@/lib/firestore';

// ================= UI-facing types =================
// These mirror the original prototype's shapes so the JSX below stays
// untouched. Firestore documents are mapped into these via toUiTask().
interface Task {
  id: string;
  title: string;
  status: TaskStatus;
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

interface ActivityTheme {
  statusDotColor: string;
  activeBorderColor: string;
  activeRightBarColor: string;
  progressColor: string;
  bgGradient: string;
}

// Cosmetic per-activity color themes. Firestore only stores the activity's
// name/owner/stats — these purely visual tokens are assigned deterministically
// by position so every activity still gets the same kind of distinct look the
// original mock data had, without redesigning anything.
const ACTIVITY_THEMES: ActivityTheme[] = [
  {
    statusDotColor: 'bg-[#00ff66]',
    activeBorderColor: 'border-[#00ff66]',
    activeRightBarColor: 'bg-[#00ff66]',
    progressColor: 'bg-[#50f1b5]',
    bgGradient: 'from-[#222436] via-[#242c38] to-[#376949]',
  },
  {
    statusDotColor: 'bg-[#ffcc00]',
    activeBorderColor: 'border-[#ffcc00]',
    activeRightBarColor: 'bg-[#ffcc00]',
    progressColor: 'bg-[#ffcc00]',
    bgGradient: 'from-[#222436] via-[#2a2c38] to-[#696137]',
  },
  {
    statusDotColor: 'bg-[#38bdf8]',
    activeBorderColor: 'border-[#38bdf8]',
    activeRightBarColor: 'bg-[#38bdf8]',
    progressColor: 'bg-[#38bdf8]',
    bgGradient: 'from-[#222436] via-[#243244] to-[#2f5a76]',
  },
  {
    statusDotColor: 'bg-[#c084fc]',
    activeBorderColor: 'border-[#c084fc]',
    activeRightBarColor: 'bg-[#c084fc]',
    progressColor: 'bg-[#c084fc]',
    bgGradient: 'from-[#222436] via-[#2c2440] to-[#5b3f76]',
  },
];

function themeForIndex(index: number): ActivityTheme {
  return ACTIVITY_THEMES[index % ACTIVITY_THEMES.length];
}

function statusColorFor(status: TaskStatus): string {
  if (status === 'todo') return 'bg-orange-500';
  if (status === 'doing') return 'bg-yellow-400';
  return 'bg-emerald-400';
}

function toUiTask(t: TaskWithId): Task {
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    statusText: t.statusText,
    statusColor: statusColorFor(t.status),
    details: t.details,
    imageUrl: t.imageUrl ?? undefined,
  };
}

export const ActivityDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  // ================= Activities (Firestore, real-time) =================
  const [activities, setActivities] = useState<ActivityWithId[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = getActivities(
      (data) => {
        setActivities(data);
        setActivitiesLoading(false);
      },
      (error) => {
        console.error('Failed to load activities', error);
        setActivitiesLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Which activity is selected. Stored as a manual override; the effective
  // value falls back to the first activity whenever the override is unset
  // or no longer exists, computed during render instead of via an effect
  // (avoids a redundant render-then-setState round trip).
  const [manualSelectedActivityId, setManualSelectedActivityId] = useState<string | null>(null);
  const selectedActivityId =
    manualSelectedActivityId && activities.some((a) => a.id === manualSelectedActivityId)
      ? manualSelectedActivityId
      : (activities[0]?.id ?? null);

  // ================= Departments (Firestore, real-time) =================
  const [departmentsRaw, setDepartmentsRaw] = useState<DepartmentWithId[]>([]);
  // Tracks which activity the current departmentsRaw snapshot belongs to, so
  // "loading" can be derived during render instead of via setState in the effect.
  const [departmentsSourceActivityId, setDepartmentsSourceActivityId] = useState<string | null>(null);
  const departmentsLoading = selectedActivityId !== departmentsSourceActivityId;

  useEffect(() => {
    if (!selectedActivityId) {
      // Nothing to subscribe to — the board isn't rendered without a
      // selected activity, so a stale departmentsRaw from a previous
      // selection is simply unused until a real activity is picked.
      return;
    }
    const unsubscribe = getDepartments(
      selectedActivityId,
      (data) => {
        setDepartmentsRaw(data);
        setDepartmentsSourceActivityId(selectedActivityId);
      },
      (error) => {
        console.error('Failed to load departments', error);
        setDepartmentsSourceActivityId(selectedActivityId);
      }
    );
    return () => unsubscribe();
  }, [selectedActivityId]);

  // ================= Tasks per department (Firestore, real-time) =================
  const [tasksByDept, setTasksByDept] = useState<Record<string, TaskWithId[]>>({});

  useEffect(() => {
    if (!selectedActivityId || departmentsRaw.length === 0) {
      // Nothing to subscribe to yet; departments (built from departmentsRaw)
      // renders as an empty list either way, so any stale tasksByDept
      // entries from a previous activity simply go unused — Firestore
      // document ids are unique per activity, so they're never matched.
      return;
    }
    const unsubscribers = departmentsRaw.map((dept) =>
      getTasks(
        selectedActivityId,
        dept.id,
        (tasks) => {
          setTasksByDept((prev) => ({ ...prev, [dept.id]: tasks }));
        },
        (error) => console.error(`Failed to load tasks for department ${dept.id}`, error)
      )
    );
    return () => unsubscribers.forEach((unsub) => unsub());
  }, [selectedActivityId, departmentsRaw]);

  // Merge Firestore departments + their live tasks into the UI shape the
  // existing JSX below already expects.
  const departments: Department[] = departmentsRaw.map((dept) => ({
    id: dept.id,
    name: dept.name,
    topGlowColor: dept.topGlowColor ?? 'bg-gray-400',
    tasks: (tasksByDept[dept.id] ?? []).map(toUiTask),
  }));

  // View Navigation: 'board' vs 'detail-editor'
  const [currentView, setCurrentView] = useState<'board' | 'detail-editor'>('board');

  // Floating Modal State (new task)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTargetDeptId, setModalTargetDeptId] = useState<string | null>(null);
  const [modalTaskTitle, setModalTaskTitle] = useState<string>('');
  const [modalTaskStatus, setModalTaskStatus] = useState<TaskStatus>('doing');

  // Floating Modal State (new activity)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState<boolean>(false);
  const [activityNameInput, setActivityNameInput] = useState<string>('');
  const [isCreatingActivity, setIsCreatingActivity] = useState<boolean>(false);

  // Active Task and State Snapshot for checking edits
  const [activeDeptId, setActiveDeptId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [initialTaskState, setInitialTaskState] = useState<Task | null>(null);
  const [isSavingTask, setIsSavingTask] = useState<boolean>(false);

  // Check if anything changed in editingTask vs initialTaskState
  const isDirty =
    !!editingTask &&
    !!initialTaskState &&
    (editingTask.title !== initialTaskState.title ||
      editingTask.statusText !== initialTaskState.statusText ||
      editingTask.details !== initialTaskState.details ||
      editingTask.imageUrl !== initialTaskState.imageUrl ||
      editingTask.status !== initialTaskState.status);

  // Statistics — computed from live Firestore task data for the selected activity
  const allTasks = departments.flatMap((d) => d.tasks);
  const todoCount = allTasks.filter((t) => t.status === 'todo').length;
  const inProgressCount = allTasks.filter((t) => t.status === 'doing').length;
  const doneCount = allTasks.filter((t) => t.status === 'done').length;
  const totalCount = allTasks.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);
  const filledSegments = Math.max(0, Math.min(5, Math.round(progressPercent / 20)));

  // Handlers
  const handleOpenModal = (deptId: string) => {
    setModalTargetDeptId(deptId);
    setModalTaskTitle('');
    setModalTaskStatus('todo');
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

    // Not persisted to Firestore yet — mirrors the original prototype's
    // behavior where a new task only exists locally until the detail
    // editor's own APPLY button is pressed.
    const draftTask: Task = {
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: modalTaskTitle.trim(),
      status: modalTaskStatus,
      statusText: defaultStatusText,
      statusColor: color,
      details: '',
      imageUrl: '',
    };

    setActiveDeptId(modalTargetDeptId);
    setEditingTask(draftTask);
    setInitialTaskState(draftTask);
    setIsModalOpen(false);

    setCurrentView('detail-editor');
  };

  const handleSaveDetails = async () => {
    if (!activeDeptId || !editingTask || !selectedActivityId || !user?.email) return;

    setIsSavingTask(true);
    try {
      const isDraft = editingTask.id.startsWith('draft-');
      if (isDraft) {
        await createTask(selectedActivityId, activeDeptId, {
          title: editingTask.title,
          status: editingTask.status,
          statusText: editingTask.statusText,
          details: editingTask.details,
          imageUrl: editingTask.imageUrl || null,
          createdBy: user.email,
        });
      } else {
        await updateTask(
          selectedActivityId,
          activeDeptId,
          editingTask.id,
          {
            title: editingTask.title,
            status: editingTask.status,
            statusText: editingTask.statusText,
            details: editingTask.details,
            imageUrl: editingTask.imageUrl || null,
          },
          initialTaskState?.status
        );
      }
      setCurrentView('board');
    } catch (error) {
      console.error('Failed to save task', error);
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleCancelDetails = () => {
    // Revert edits back to initial state
    setEditingTask(initialTaskState);
  };

  const handleOpenExistingTask = (deptId: string, task: Task) => {
    setActiveDeptId(deptId);
    setEditingTask(task);
    setInitialTaskState(task); // Set initial snapshot
    setCurrentView('detail-editor');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setEditingTask((prev) => (prev ? { ...prev, imageUrl } : prev));
    }
  };

  const handleOpenActivityModal = () => {
    setActivityNameInput('');
    setIsActivityModalOpen(true);
  };

  const handleCreateActivity = async () => {
    if (!activityNameInput.trim() || !user?.email) return;
    setIsCreatingActivity(true);
    try {
      const newId = await createActivity({ name: activityNameInput.trim(), createdBy: user.email });
      setManualSelectedActivityId(newId);
      setIsActivityModalOpen(false);
    } catch (error) {
      console.error('Failed to create activity', error);
    } finally {
      setIsCreatingActivity(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#1b1c31] text-white font-sans overflow-hidden relative">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-[#23253b] p-4 flex flex-col border-r border-[#2d2f48] h-full overflow-hidden shrink-0 relative">
        {/* Title */}
        <div className="flex items-baseline gap-2 mb-5 shrink-0">
          <h1 className="text-2xl font-light tracking-wide">Activity</h1>
          <span className="text-xs text-gray-400 uppercase font-mono">CPE32</span>
        </div>

        {/* Add Activity Button */}
        <button
          onClick={handleOpenActivityModal}
          className="w-full py-2 mb-5 border border-gray-500/60 rounded-full text-sm font-light hover:bg-[#2d2f48] hover:border-gray-400 transition-all shrink-0"
        >
          + เพิ่มกิจกรรม
        </button>

        {/* Scrollable Badges */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-0.5 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {activitiesLoading ? (
            <div className="text-xs text-gray-500 font-light text-center pt-4">กำลังโหลด...</div>
          ) : activities.length === 0 ? (
            <div className="text-xs text-gray-500 font-light text-center pt-4 leading-relaxed">
              ยังไม่มีกิจกรรม
              <br />
              กดปุ่มด้านบนเพื่อสร้างกิจกรรมแรก
            </div>
          ) : (
            activities.map((act, index) => {
              const theme = themeForIndex(index);
              const isSelected = act.id === selectedActivityId;
              const total = act.taskStats?.total ?? 0;
              const done = act.taskStats?.done ?? 0;
              const activityProgress = total === 0 ? 0 : Math.round((done / total) * 100);
              return (
                <div
                  key={act.id}
                  onClick={() => setManualSelectedActivityId(act.id)}
                  className={`group relative p-3 rounded-2xl bg-gradient-to-r ${theme.bgGradient} transition-all duration-200 cursor-pointer overflow-hidden ${
                    isSelected
                      ? `border ${theme.activeBorderColor} shadow-lg scale-[1.02] opacity-100 ring-1 ring-white/20`
                      : 'border border-gray-700/60 opacity-60 hover:opacity-100 hover:border-gray-500'
                  }`}
                >
                  {isSelected && (
                    <div
                      className={`absolute right-0 top-0 bottom-0 w-1.5 ${theme.activeRightBarColor} rounded-r-2xl shadow-sm`}
                    />
                  )}

                  <div className="flex items-center justify-between mb-2.5 pr-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${theme.statusDotColor} shadow-sm shrink-0`} />
                      <span
                        className={`text-sm truncate transition-colors ${
                          isSelected ? 'font-semibold text-white' : 'font-light text-gray-300'
                        }`}
                      >
                        {act.name}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-[#1b1c31]/80 h-2 rounded-full overflow-hidden p-0.5 border border-gray-700/50">
                    <div
                      className={`h-full ${theme.progressColor} rounded-full transition-all duration-300`}
                      style={{ width: `${activityProgress}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-12 px-8 flex justify-end items-center gap-3 bg-[#1e2038] shrink-0 border-b border-[#2a2c47]">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName ?? 'Profile'}
              className="w-6 h-6 rounded-full border border-gray-600 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="w-6 h-6 rounded-full bg-[#2a2d42] border border-gray-600" />
          )}

          <span className="text-xs text-gray-400 font-mono">{user?.email}</span>

          <button
            onClick={logout}
            className="ml-1 px-3 py-1 text-[11px] text-gray-400 hover:text-white border border-gray-600 rounded-full hover:bg-[#2a2d42] transition-all"
          >
            ออกจากระบบ
          </button>
        </header>

        {!activitiesLoading && !selectedActivityId ? (
          /* EMPTY STATE: no activities exist yet */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-sm text-gray-400 font-light text-center leading-relaxed">
              ยังไม่มีกิจกรรม กดปุ่ม &ldquo;+ เพิ่มกิจกรรม&rdquo; ที่แถบด้านซ้ายเพื่อเริ่มต้น
            </div>
          </div>
        ) : currentView === 'detail-editor' && editingTask ? (
          /* DETAIL EDITOR VIEW */
          <div className="p-8 space-y-6 overflow-y-auto flex-1">
            <div className="flex items-center gap-3">
              {/* Back to Board Button */}
              <button
                onClick={() => setCurrentView('board')}
                className="mr-2 p-1.5 rounded-full bg-[#2a2d42] border border-gray-500/50 hover:bg-[#343852] text-gray-300 hover:text-white transition-all text-sm flex items-center justify-center"
                title="กลับไปหน้ากระดาน"
              >
                ←
              </button>

              <span className={`w-3.5 h-3.5 rounded-full ${editingTask.statusColor}`} />

              <input
                type="text"
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                className="bg-[#2a2d42] border border-gray-400/80 rounded-2xl px-6 py-1.5 text-sm text-gray-200 font-light focus:outline-none focus:border-white min-w-[200px]"
              />

              {/* ONLY RENDER APPLY AND CANCEL WHEN ANYTHING CHANGED */}
              {isDirty && (
                <div className="flex items-center gap-3 animate-fade-in">
                  <button
                    onClick={handleSaveDetails}
                    disabled={isSavingTask}
                    className="bg-[#2a2d42] border border-gray-400/80 hover:bg-[#343852] text-xs text-emerald-400 hover:text-emerald-300 px-5 py-2 rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingTask ? 'กำลังบันทึก...' : 'APPLY'}
                  </button>

                  <button
                    onClick={handleCancelDetails}
                    disabled={isSavingTask}
                    className="bg-[#2a2d42] border border-gray-400/80 hover:bg-[#343852] text-xs text-red-400 hover:text-red-300 px-5 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    CANCEL
                  </button>
                </div>
              )}
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
        ) : (
          /* BOARD VIEW */
          <div className="p-8 space-y-8 overflow-y-auto flex-1">
            <section>
              <div className="flex items-center gap-6 mb-4">
                <h2 className="text-xl font-normal">Team Board</h2>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-8 h-2.5 rounded-full ${i < filledSegments ? 'bg-emerald-300' : 'bg-gray-700'}`}
                    />
                  ))}
                </div>
                <span className="text-lg text-gray-300 font-light ml-2">{progressPercent}%</span>
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
              {departmentsLoading ? (
                <div className="text-xs text-gray-500 font-light">กำลังโหลด...</div>
              ) : (
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
              )}
            </section>
          </div>
        )}
      </main>

      {/* FLOATING MODAL PANEL: NEW TASK */}
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

      {/* FLOATING MODAL PANEL: NEW ACTIVITY */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#23253b] border border-gray-600 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-700/60 pb-3">
              <h3 className="text-lg font-medium text-white">เพิ่มกิจกรรมใหม่</h3>
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-300 font-light">ชื่อกิจกรรม (Activity Name)</label>
              <input
                type="text"
                value={activityNameInput}
                onChange={(e) => setActivityNameInput(e.target.value)}
                placeholder="กรอกชื่อกิจกรรม..."
                className="w-full bg-[#1b1c31] border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-colors"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
                disabled={isCreatingActivity}
                className="px-5 py-2 text-xs font-medium text-gray-400 hover:text-white border border-gray-600 rounded-full hover:bg-gray-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleCreateActivity}
                disabled={!activityNameInput.trim() || isCreatingActivity}
                className="px-6 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 rounded-full hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              >
                {isCreatingActivity ? 'กำลังสร้าง...' : 'APPLY'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityDashboard;
