"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  createActivity,
  createTask,
  deleteActivity,
  deleteTask,
  getActivities,
  getDepartments,
  getTasks,
  updateTask,
  type ActivityWithId,
  type DepartmentWithId,
  type TaskStatus,
  type TaskWithId,
} from "@/lib/firestore";
import { deleteUploadedFiles, isAcceptedImageType, uploadThingAuthHeaders, useUploadThing } from "@/lib/uploadthing";

import { EmptyState, tagColorForIndex } from "@/app/components/ui";
import { CalendarPlusIcon, CloseIcon } from "@/app/components/icons";
import AppHeader from "./AppHeader";
import ActivitiesNav from "./ActivitiesNav";
import BoardView from "./BoardView";
import TaskDetailView from "./TaskDetailView";
import TaskSheet from "./TaskSheet";
import ActivitySheet from "./ActivitySheet";
import { toUiTask, type Department, type Task } from "./types";

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
        console.error("Failed to load activities", error);
        setActivitiesLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Which activity is selected. Stored as a manual override; the effective
  // value falls back to the first activity whenever the override is unset
  // or no longer exists, computed during render instead of via an effect.
  const [manualSelectedActivityId, setManualSelectedActivityId] = useState<string | null>(null);
  const selectedActivityId =
    manualSelectedActivityId && activities.some((a) => a.id === manualSelectedActivityId)
      ? manualSelectedActivityId
      : (activities[0]?.id ?? null);

  const selectedActivityIndex = activities.findIndex((a) => a.id === selectedActivityId);
  const selectedActivity = selectedActivityIndex >= 0 ? activities[selectedActivityIndex] : null;
  const selectedActivityColor = tagColorForIndex(Math.max(selectedActivityIndex, 0));

  // ================= Departments (Firestore, real-time) =================
  const [departmentsRaw, setDepartmentsRaw] = useState<DepartmentWithId[]>([]);
  const [departmentsSourceActivityId, setDepartmentsSourceActivityId] = useState<string | null>(null);
  const departmentsLoading = selectedActivityId !== departmentsSourceActivityId;

  useEffect(() => {
    if (!selectedActivityId) return;
    const unsubscribe = getDepartments(
      selectedActivityId,
      (data) => {
        setDepartmentsRaw(data);
        setDepartmentsSourceActivityId(selectedActivityId);
      },
      (error) => {
        console.error("Failed to load departments", error);
        setDepartmentsSourceActivityId(selectedActivityId);
      }
    );
    return () => unsubscribe();
  }, [selectedActivityId]);

  // ================= Tasks per department (Firestore, real-time) =================
  const [tasksByDept, setTasksByDept] = useState<Record<string, TaskWithId[]>>({});

  useEffect(() => {
    if (!selectedActivityId || departmentsRaw.length === 0) return;
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

  const departments: Department[] = departmentsRaw.map((dept) => ({
    id: dept.id,
    name: dept.name,
    tasks: (tasksByDept[dept.id] ?? []).map(toUiTask),
  }));

  // View navigation: 'board' vs 'detail-editor'
  const [currentView, setCurrentView] = useState<"board" | "detail-editor">("board");

  // Mobile activities drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // New-task sheet state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTargetDeptId, setModalTargetDeptId] = useState<string | null>(null);
  const [modalTaskTitle, setModalTaskTitle] = useState<string>("");
  const [modalTaskStatus, setModalTaskStatus] = useState<TaskStatus>("doing");
  const [isCreatingTask, setIsCreatingTask] = useState<boolean>(false);

  // New-activity sheet state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState<boolean>(false);
  const [activityNameInput, setActivityNameInput] = useState<string>("");
  const [isCreatingActivity, setIsCreatingActivity] = useState<boolean>(false);

  // Active task and state snapshot for checking edits
  const [activeDeptId, setActiveDeptId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [initialTaskState, setInitialTaskState] = useState<Task | null>(null);
  const [isSavingTask, setIsSavingTask] = useState<boolean>(false);
  const [isDeletingTask, setIsDeletingTask] = useState<boolean>(false);

  // Image upload (UploadThing) state for the task being edited
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [sessionUploads, setSessionUploads] = useState<Array<{ url: string; key: string }>>([]);

  const { startUpload, isUploading } = useUploadThing("taskImage", {
    onUploadProgress: (progress) => setUploadProgress(progress),
    headers: uploadThingAuthHeaders,
  });

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
  const todoCount = allTasks.filter((t) => t.status === "todo").length;
  const inProgressCount = allTasks.filter((t) => t.status === "doing").length;
  const doneCount = allTasks.filter((t) => t.status === "done").length;
  const totalCount = allTasks.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  // Handlers
  const handleSelectActivity = (id: string) => {
    setManualSelectedActivityId(id);
    setIsDrawerOpen(false);
  };

  const handleOpenModal = (deptId: string) => {
    setModalTargetDeptId(deptId);
    setModalTaskTitle("");
    setModalTaskStatus("todo");
    setIsModalOpen(true);
  };

  const handleModalApply = async () => {
    if (!modalTaskTitle.trim() || !modalTargetDeptId || !selectedActivityId || !user?.email) return;

    let defaultStatusText = "สิ่งที่ต้องทำ";
    if (modalTaskStatus === "doing") defaultStatusText = "กำลังทำเรื่องยื่น";
    else if (modalTaskStatus === "done") defaultStatusText = "สำเร็จ";

    setIsCreatingTask(true);
    try {
      // Saved directly to Firestore here — the detail editor (with the
      // image-upload flow) is only reached later, by opening the task
      // from the board.
      await createTask(selectedActivityId, modalTargetDeptId, {
        title: modalTaskTitle.trim(),
        status: modalTaskStatus,
        statusText: defaultStatusText,
        details: "",
        imageUrl: null,
        imageKey: null,
        createdBy: user.email,
      });

      setIsModalOpen(false);
      setModalTargetDeptId(null);
      setModalTaskTitle("");
      setModalTaskStatus("todo");
    } catch (error) {
      console.error("Failed to create task", error);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const discardSessionUploads = (keepUrl?: string | null) => {
    const keysToDelete = sessionUploads.filter((u) => u.url !== keepUrl).map((u) => u.key);
    if (keysToDelete.length > 0) {
      void deleteUploadedFiles({ keys: keysToDelete });
    }
    setSessionUploads([]);
  };

  const handleSaveDetails = async () => {
    if (!activeDeptId || !editingTask || !selectedActivityId || !user?.email) return;

    setIsSavingTask(true);
    try {
      const isDraft = editingTask.id.startsWith("draft-");
      if (isDraft) {
        await createTask(selectedActivityId, activeDeptId, {
          title: editingTask.title,
          status: editingTask.status,
          statusText: editingTask.statusText,
          details: editingTask.details,
          imageUrl: editingTask.imageUrl || null,
          imageKey: editingTask.imageKey || null,
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
            imageKey: editingTask.imageKey || null,
          },
          initialTaskState?.status
        );
      }

      const finalUrl = editingTask.imageUrl || null;
      discardSessionUploads(finalUrl);
      if (initialTaskState?.imageUrl && initialTaskState.imageUrl !== finalUrl) {
        void deleteUploadedFiles({
          keys: initialTaskState.imageKey ? [initialTaskState.imageKey] : [],
          urls: initialTaskState.imageKey ? [] : [initialTaskState.imageUrl],
        });
      }

      setCurrentView("board");
    } catch (error) {
      console.error("Failed to save task", error);
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!activeDeptId || !editingTask || !selectedActivityId) return;

    if (editingTask.id.startsWith("draft-")) {
      discardSessionUploads(null);
      setImageUploadError(null);
      setCurrentView("board");
      return;
    }

    const confirmed = window.confirm(`ลบงาน "${editingTask.title}" ใช่หรือไม่? การลบนี้ไม่สามารถย้อนกลับได้`);
    if (!confirmed) return;

    setIsDeletingTask(true);
    try {
      await deleteTask(selectedActivityId, activeDeptId, editingTask.id, editingTask.status);
      discardSessionUploads(null);
      if (editingTask.imageUrl) {
        void deleteUploadedFiles({
          keys: editingTask.imageKey ? [editingTask.imageKey] : [],
          urls: editingTask.imageKey ? [] : [editingTask.imageUrl],
        });
      }
      setImageUploadError(null);
      setCurrentView("board");
    } catch (error) {
      console.error("Failed to delete task", error);
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleCancelDetails = () => {
    discardSessionUploads(null);
    setImageUploadError(null);
    setEditingTask(initialTaskState);
  };

  const handleBackToBoard = () => {
    discardSessionUploads(null);
    setImageUploadError(null);
    setCurrentView("board");
  };

  const handleOpenExistingTask = (deptId: string, task: Task) => {
    setActiveDeptId(deptId);
    setEditingTask(task);
    setInitialTaskState(task);
    setImageUploadError(null);
    setUploadProgress(0);
    setSessionUploads([]);
    setCurrentView("detail-editor");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editingTask) return;

    if (!isAcceptedImageType(file.type)) {
      setImageUploadError("รองรับเฉพาะไฟล์ JPG, JPEG, PNG หรือ WEBP เท่านั้น");
      return;
    }

    setImageUploadError(null);
    setUploadProgress(0);

    try {
      const result = await startUpload([file]);
      const uploaded = result?.[0];
      if (!uploaded) {
        setImageUploadError("อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        return;
      }

      const newUrl = uploaded.ufsUrl;
      const newKey = uploaded.key;

      setSessionUploads((prev) => [...prev, { url: newUrl, key: newKey }]);
      setEditingTask((prev) => (prev ? { ...prev, imageUrl: newUrl, imageKey: newKey } : prev));
    } catch (error) {
      console.error("Image upload failed", error);
      setImageUploadError("อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleOpenActivityModal = () => {
    setActivityNameInput("");
    setIsActivityModalOpen(true);
  };

  const handleCreateActivity = async () => {
    if (!activityNameInput.trim() || !user?.email) return;
    setIsCreatingActivity(true);
    try {
      const newId = await createActivity({ name: activityNameInput.trim(), createdBy: user.email });
      setManualSelectedActivityId(newId);
      setIsActivityModalOpen(false);
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Failed to create activity", error);
    } finally {
      setIsCreatingActivity(false);
    }
  };

  const [isDeletingActivity, setIsDeletingActivity] = useState<string | null>(null);

  const handleDeleteActivity = async (e: React.MouseEvent, activityId: string, activityName: string) => {
    e.stopPropagation();
    const confirmed = window.confirm(`ลบกิจกรรม "${activityName}" ใช่หรือไม่?\nการลบนี้ไม่สามารถย้อนกลับได้`);
    if (!confirmed) return;
    setIsDeletingActivity(activityId);
    try {
      await deleteActivity(activityId);
      if (manualSelectedActivityId === activityId) {
        setManualSelectedActivityId(null);
      }
    } catch (error) {
      console.error("Failed to delete activity", error);
    } finally {
      setIsDeletingActivity(null);
    }
  };

  return (
    <div className="flex h-screen w-full bg-bg text-ink overflow-hidden relative">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex w-72 bg-surface p-4 flex-col border-r border-border h-full overflow-hidden shrink-0">
        <div className="flex items-baseline gap-2 mb-5 shrink-0 px-1">
          <h1 className="text-xl font-semibold tracking-tight text-ink">Activity</h1>
          <span className="text-[10px] text-primary bg-primary-soft px-1.5 py-0.5 rounded-full font-mono font-medium">CPE32</span>
        </div>
        <ActivitiesNav
          activities={activities}
          activitiesLoading={activitiesLoading}
          selectedActivityId={selectedActivityId}
          onSelect={handleSelectActivity}
          onDelete={handleDeleteActivity}
          deletingId={isDeletingActivity}
          onAddActivity={handleOpenActivityModal}
        />
      </aside>

      {/* ================= MOBILE DRAWER ================= */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsDrawerOpen(false)} aria-hidden="true" />
          <div className="relative w-[86%] max-w-xs bg-surface h-full flex flex-col p-4 pt-safe shadow-2xl animate-slide-in-left">
            <div className="flex items-center justify-between mb-5 shrink-0 px-1">
              <div className="flex items-baseline gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-ink">Activity</h1>
                <span className="text-[10px] text-primary bg-primary-soft px-1.5 py-0.5 rounded-full font-mono font-medium">CPE32</span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                aria-label="ปิดเมนู"
                className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-ink transition-colors focus-ring"
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>
            <ActivitiesNav
              activities={activities}
              activitiesLoading={activitiesLoading}
              selectedActivityId={selectedActivityId}
              onSelect={handleSelectActivity}
              onDelete={handleDeleteActivity}
              deletingId={isDeletingActivity}
              onAddActivity={() => {
                handleOpenActivityModal();
              }}
            />
          </div>
        </div>
      )}

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <AppHeader
          onOpenDrawer={() => setIsDrawerOpen(true)}
          userPhotoURL={user?.photoURL}
          userEmail={user?.email}
          userName={user?.displayName}
          onLogout={logout}
        />

        {!activitiesLoading && !selectedActivityId ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState
              icon={<CalendarPlusIcon width={22} height={22} />}
              title="ยังไม่มีกิจกรรม"
              description={
                'กดปุ่ม "+ เพิ่มกิจกรรม" ที่แถบด้านข้าง (หรือเมนูด้านบนบนมือถือ) เพื่อเริ่มต้น'
              }
            />
          </div>
        ) : currentView === "detail-editor" && editingTask ? (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <TaskDetailView
              task={editingTask}
              isDirty={isDirty}
              isSaving={isSavingTask}
              isDeleting={isDeletingTask}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              imageError={imageUploadError}
              onBack={handleBackToBoard}
              onTitleChange={(title) => setEditingTask((prev) => (prev ? { ...prev, title } : prev))}
              onStatusChange={(status) => setEditingTask((prev) => (prev ? { ...prev, status } : prev))}
              onStatusTextChange={(statusText) => setEditingTask((prev) => (prev ? { ...prev, statusText } : prev))}
              onDetailsChange={(details) => setEditingTask((prev) => (prev ? { ...prev, details } : prev))}
              onImageUpload={handleImageUpload}
              onSave={handleSaveDetails}
              onCancel={handleCancelDetails}
              onDelete={handleDeleteTask}
              onDismissImageError={() => setImageUploadError(null)}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <BoardView
              activityName={selectedActivity?.name ?? ""}
              activityColor={selectedActivityColor}
              todoCount={todoCount}
              inProgressCount={inProgressCount}
              doneCount={doneCount}
              progressPercent={progressPercent}
              departmentsLoading={departmentsLoading}
              departments={departments}
              onOpenTask={handleOpenExistingTask}
              onAddTask={handleOpenModal}
            />
          </div>
        )}
      </main>

      <TaskSheet
        open={isModalOpen}
        title={modalTaskTitle}
        status={modalTaskStatus}
        creating={isCreatingTask}
        onTitleChange={setModalTaskTitle}
        onStatusChange={setModalTaskStatus}
        onClose={() => setIsModalOpen(false)}
        onApply={handleModalApply}
      />

      <ActivitySheet
        open={isActivityModalOpen}
        name={activityNameInput}
        creating={isCreatingActivity}
        onNameChange={setActivityNameInput}
        onClose={() => setIsActivityModalOpen(false)}
        onCreate={handleCreateActivity}
      />
    </div>
  );
};

export default ActivityDashboard;
