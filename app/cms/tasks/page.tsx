"use client";

import { useEffect, useState, useMemo } from "react";
import { cmsApi } from "@/lib/api-client";
import { AuthSession } from "@/lib/types/api";
import { 
  Plus, Edit2, Trash2, CheckCircle2, ClipboardList, 
  Calendar, FileClock, Info, Loader2, Save, X, BookOpen, AlertTriangle
} from "lucide-react";
import { CustomSelect } from "@/app/cms/components/ui/custom-select";
import { CustomCheckbox } from "@/app/cms/components/ui/custom-checkbox";
import { NotificationModal } from "@/app/cms/components/modals/NotificationModal";

// Constants for Frequencies
const FREQUENCY_OPTIONS = [
  { value: "SESSION_START", label: "🌅 Đầu buổi dạy" },
  { value: "SESSION_END", label: "🌇 Cuối buổi dạy" },
  { value: "WEEKLY", label: "📅 Hàng tuần" },
  { value: "MONTHLY", label: "📆 Hàng tháng" },
  { value: "ONCE", label: "🎯 Một lần" }
];

export default function TasksPage() {
  // Authentication & session state
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // General States
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("checklist"); // checklist, log, adminTasks, adminReports
  const [teachers, setTeachers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [teacherId, setTeacherId] = useState<string>("");
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionTaskNotes, setSessionTaskNotes] = useState<Record<string, string>>({}); // Key: taskId-sessionId

  // Filter States for Reports
  const [reportTeacherFilter, setReportTeacherFilter] = useState<string>("");
  const [reportFreqFilter, setReportFreqFilter] = useState<string>("");
  const [reportStartDate, setReportStartDate] = useState<string>("");
  const [reportEndDate, setReportEndDate] = useState<string>("");
  const [loadingReports, setLoadingReports] = useState(false);

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null); // null means creating
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    frequency: "WEEKLY",
    assignedTeacherId: ""
  });
  const [submittingTask, setSubmittingTask] = useState(false);

  // Notification Modal state
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info" | "confirm";
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showNotification = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "confirm",
    onConfirm?: () => void
  ) => {
    setNotification({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
    });
  };

  // 1. Fetch user session
  useEffect(() => {
    async function getSession() {
      try {
        const data = await cmsApi.auth.getSession();
        setSession(data);
      } catch (err) {
        console.error("Failed to load user session:", err);
      } finally {
        setLoadingSession(false);
      }
    }
    getSession();
  }, []);

  const role = session?.user?.role || "USER";

  // 2. Fetch Tasks & Teacher profile on mount
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch tasks list
      const tasksData = await cmsApi.tasks.list();
      setTasks(tasksData.tasks || []);
      if (tasksData.teacherId) {
        setTeacherId(tasksData.teacherId);
      }

      // If ADMIN, fetch teachers list for task configuration dropdown & reports
      if (role === "ADMIN") {
        const teachersData = await cmsApi.teachers.list();
        setTeachers(teachersData.teachers || []);
      }
    } catch (err: any) {
      showNotification("Lỗi tải dữ liệu", err.message || "Không thể tải danh sách công việc.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingSession && session) {
      fetchData();
    }
  }, [loadingSession, session]);

  // Set initial active tab based on role
  useEffect(() => {
    if (role === "ADMIN") {
      setActiveTab("adminTasks");
    } else {
      setActiveTab("checklist");
    }
  }, [role]);

  // 3. Fetch completion status for teachers
  const [myCompletions, setMyCompletions] = useState<Record<string, { completed: boolean; notes: string }>>({});
  const [loadingMyCompletions, setLoadingMyCompletions] = useState(false);

  const fetchMyCompletions = async () => {
    if (role !== "TEACHER" || !teacherId) return;
    setLoadingMyCompletions(true);
    try {
      // Get all completions for this teacher
      const data = await cmsApi.tasks.getCompletions({ teacherId });
      setCompletions(data.completions || []);

      // Build a map of current completions for weekly/monthly/once tasks
      const currentMap: Record<string, { completed: boolean; notes: string }> = {};
      
      // Determine what was completed during the active periods
      data.completions.forEach((comp: any) => {
        const now = new Date();
        let isValid = false;

        if (comp.frequency === "WEEKLY") {
          const compDate = new Date(comp.completedAt);
          // Simple current week check
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          const startOfWeek = new Date(now.setDate(diff));
          startOfWeek.setHours(0,0,0,0);
          isValid = compDate >= startOfWeek;
        } else if (comp.frequency === "MONTHLY") {
          const compDate = new Date(comp.completedAt);
          isValid = compDate.getFullYear() === now.getFullYear() && compDate.getMonth() === now.getMonth();
        } else if (comp.frequency === "ONCE") {
          isValid = true;
        }

        if (isValid) {
          currentMap[comp.taskId] = { completed: true, notes: comp.notes || "" };
        }
      });

      setMyCompletions(currentMap);
    } catch (err: any) {
      console.error("Failed to fetch completions:", err);
    } finally {
      setLoadingMyCompletions(false);
    }
  };

  const fetchTodaySessions = async (tId: string) => {
    setLoadingSessions(true);
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const todayStr = `${year}-${month}-${day}`;

      const sessionsData = await cmsApi.sessions.list({
        teacherId: tId,
        startDate: todayStr,
        endDate: todayStr
      });
      setTodaySessions(sessionsData.sessions || []);
    } catch (err) {
      console.error("Failed to load today's sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleSessionTaskToggle = async (taskId: string, sessionId: string, currentChecked: boolean, noteText: string = "") => {
    try {
      await cmsApi.tasks.toggleCompletion({
        taskId,
        sessionId,
        isCompleted: !currentChecked,
        notes: noteText
      });
      fetchMyCompletions();
    } catch (err: any) {
      showNotification("Lỗi thực hiện", err.message || "Không thể cập nhật tiến độ công việc.", "error");
    }
  };

  const handleSessionTaskNotesChange = (taskId: string, sessionId: string, val: string) => {
    setSessionTaskNotes(prev => ({
      ...prev,
      [`${taskId}-${sessionId}`]: val
    }));
  };

  const saveSessionTaskNotes = async (taskId: string, sessionId: string) => {
    const notes = sessionTaskNotes[`${taskId}-${sessionId}`] || "";
    try {
      await cmsApi.tasks.toggleCompletion({
        taskId,
        sessionId,
        isCompleted: true,
        notes
      });
      fetchMyCompletions();
      showNotification("Đã lưu ghi chú", "Ghi chú công việc đã được lưu lại.", "success");
    } catch (err: any) {
      showNotification("Lỗi lưu ghi chú", err.message || "Không thể lưu ghi chú công việc.", "error");
    }
  };

  useEffect(() => {
    if (teacherId && role === "TEACHER") {
      fetchMyCompletions();
      fetchTodaySessions(teacherId);
    }
  }, [teacherId, role]);

  // 4. Fetch completions report for Admin
  const fetchReports = async () => {
    if (role !== "ADMIN") return;
    setLoadingReports(true);
    try {
      const data = await cmsApi.tasks.getCompletions({
        teacherId: reportTeacherFilter || undefined,
        frequency: reportFreqFilter || undefined,
        startDate: reportStartDate || undefined,
        endDate: reportEndDate || undefined
      });
      setCompletions(data.completions || []);
    } catch (err: any) {
      showNotification("Lỗi tải báo cáo", err.message || "Không thể tải báo cáo công việc.", "error");
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (activeTab === "adminReports") {
      fetchReports();
    }
  }, [activeTab]);

  // 5. Tasks Management Actions (ADMIN)
  const openCreateModal = () => {
    setEditingTask(null);
    setTaskForm({
      title: "",
      description: "",
      frequency: "WEEKLY",
      assignedTeacherId: ""
    });
    setIsTaskModalOpen(true);
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      frequency: task.frequency,
      assignedTeacherId: task.assignedTeacherId || ""
    });
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title) return;

    setSubmittingTask(true);
    try {
      if (editingTask) {
        // Update
        await cmsApi.tasks.update(editingTask.id, {
          title: taskForm.title,
          description: taskForm.description || null,
          frequency: taskForm.frequency,
          assignedTeacherId: taskForm.assignedTeacherId || null
        });
        showNotification("Cập nhật thành công ✏️", "Công việc đã được lưu thay đổi.", "success");
      } else {
        // Create
        await cmsApi.tasks.create({
          title: taskForm.title,
          description: taskForm.description || null,
          frequency: taskForm.frequency,
          assignedTeacherId: taskForm.assignedTeacherId || null
        });
        showNotification("Tạo thành công 🎉", "Công việc mới đã được đưa vào hệ thống.", "success");
      }
      setIsTaskModalOpen(false);
      fetchData();
    } catch (err: any) {
      showNotification("Lỗi lưu dữ liệu", err.message || "Đã xảy ra lỗi khi lưu công việc.", "error");
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleDeleteTask = (task: any) => {
    showNotification(
      "Xác nhận xóa 🗑️",
      `Bạn có chắc chắn muốn xóa công việc "${task.title}" không? Hành động này không thể hoàn tác.`,
      "confirm",
      async () => {
        try {
          await cmsApi.tasks.delete(task.id);
          showNotification("Đã xóa công việc", "Công việc đã được loại bỏ.", "success");
          fetchData();
        } catch (err: any) {
          showNotification("Lỗi xóa công việc", err.message || "Không thể xóa công việc này.", "error");
        }
      }
    );
  };

  // 6. Completions Toggle (TEACHER)
  const handleTeacherTaskToggle = async (taskId: string, currentChecked: boolean, noteText?: string) => {
    // Optimistic UI update
    setMyCompletions(prev => ({
      ...prev,
      [taskId]: {
        completed: !currentChecked,
        notes: noteText || prev[taskId]?.notes || ""
      }
    }));

    try {
      await cmsApi.tasks.toggleCompletion({
        taskId,
        isCompleted: !currentChecked,
        notes: noteText || ""
      });
      fetchMyCompletions();
    } catch (err: any) {
      showNotification("Lỗi thực hiện", err.message || "Không thể cập nhật tiến độ công việc.", "error");
      // Revert on error
      setMyCompletions(prev => ({
        ...prev,
        [taskId]: {
          completed: currentChecked,
          notes: prev[taskId]?.notes || ""
        }
      }));
    }
  };

  const handleTeacherTaskNotesChange = async (taskId: string, val: string) => {
    setMyCompletions(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        notes: val
      }
    }));
  };

  const saveTeacherTaskNotes = async (taskId: string) => {
    const data = myCompletions[taskId];
    if (!data?.completed) return;
    try {
      await cmsApi.tasks.toggleCompletion({
        taskId,
        isCompleted: true,
        notes: data.notes
      });
      fetchMyCompletions();
      showNotification("Đã lưu ghi chú", "Ghi chú công việc đã được lưu lại.", "success");
    } catch (err: any) {
      showNotification("Lỗi lưu ghi chú", err.message || "Không thể lưu ghi chú công việc.", "error");
    }
  };

  if (loadingSession || loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        <p className="mt-4 font-bold text-gray-600">Đang tải danh sách công việc...</p>
      </div>
    );
  }

  if (role !== "ADMIN" && role !== "TEACHER") {
    return (
      <div className="border-4 border-black bg-white rounded-3xl p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto my-12">
        <span className="text-6xl mb-4 block">🚫</span>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h1>
        <p className="text-gray-600">Trang này chỉ dành cho Giáo viên hoặc Quản trị viên.</p>
      </div>
    );
  }

  // Filter lists by frequencies for teacher checklist display
  const teacherGeneralTasks = tasks.filter(t => t.frequency === "WEEKLY" || t.frequency === "MONTHLY" || t.frequency === "ONCE");
  const teacherSessionTasks = tasks.filter(t => t.frequency === "SESSION_START" || t.frequency === "SESSION_END");

  // Options for teacher dropdown inside Admin panel
  const teacherSelectOptions = [
    { value: "", label: "-- Tất cả giáo viên / Chung --" },
    ...teachers.map((t) => ({
      value: t.id,
      label: t.user.name || "Giáo viên"
    }))
  ];

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      
      {/* Title block */}
      <div className="border-4 border-black bg-white rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-black flex items-center gap-2">
              📋 Quản lý công việc
            </h2>
            <p className="text-gray-500 font-bold text-sm mt-1">
              {role === "ADMIN" 
                ? "Thiết lập nhiệm vụ định kỳ cho lớp học và theo dõi báo cáo của giáo viên" 
                : "Checklist công việc hàng ngày, hàng tuần và hàng tháng của bạn"}
            </p>
          </div>
          
          {role === "ADMIN" && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-[#ffd275] hover:bg-[#ffc342] border-3 border-black rounded-xl px-5 py-3 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer text-sm"
            >
              <Plus className="w-5 h-5 shrink-0 stroke-[3px]" />
              Thêm công việc mới
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {role === "TEACHER" && (
          <>
            <button
              onClick={() => setActiveTab("checklist")}
              className={`flex items-center gap-2 border-3 border-black rounded-xl px-4 py-2.5 font-black text-xs sm:text-sm transition-all shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none cursor-pointer ${
                activeTab === "checklist" ? "bg-[#a8e6cf]" : "bg-white hover:bg-gray-50"
              }`}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              Nhiệm vụ của tôi
            </button>
            <button
              onClick={() => setActiveTab("log")}
              className={`flex items-center gap-2 border-3 border-black rounded-xl px-4 py-2.5 font-black text-xs sm:text-sm transition-all shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none cursor-pointer ${
                activeTab === "log" ? "bg-[#bae1ff]" : "bg-white hover:bg-gray-50"
              }`}
            >
              <FileClock className="w-4 h-4 shrink-0" />
              Lịch sử check việc
            </button>
          </>
        )}
        
        {role === "ADMIN" && (
          <>
            <button
              onClick={() => setActiveTab("adminTasks")}
              className={`flex items-center gap-2 border-3 border-black rounded-xl px-4 py-2.5 font-black text-xs sm:text-sm transition-all shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none cursor-pointer ${
                activeTab === "adminTasks" ? "bg-[#ffd275]" : "bg-white hover:bg-gray-50"
              }`}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              Danh sách công việc
            </button>
            <button
              onClick={() => setActiveTab("adminReports")}
              className={`flex items-center gap-2 border-3 border-black rounded-xl px-4 py-2.5 font-black text-xs sm:text-sm transition-all shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none cursor-pointer ${
                activeTab === "adminReports" ? "bg-[#bae1ff]" : "bg-white hover:bg-gray-50"
              }`}
            >
              <FileClock className="w-4 h-4 shrink-0" />
              Báo cáo & Lịch sử
            </button>
          </>
        )}
      </div>

      {/* Tab 1: Teacher Checklist */}
      {role === "TEACHER" && activeTab === "checklist" && (
        <div className="space-y-6">
          {/* Today's Class Session Checklist */}
          {teacherSessionTasks.length > 0 && (
            <div className="border-4 border-black bg-white rounded-3xl p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] space-y-4">
              <h3 className="text-lg font-black text-black flex items-center gap-1.5 px-1 border-b-2 border-black/10 pb-2">
                🌅 Nhiệm vụ theo buổi dạy hôm nay ({todaySessions.length} buổi học)
              </h3>
              
              {loadingSessions ? (
                <div className="py-6 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              ) : todaySessions.length === 0 ? (
                <p className="text-gray-400 text-xs font-bold py-2 pl-1">Hôm nay bạn không có lịch dạy học nào, hoặc các buổi học không có nhiệm vụ.</p>
              ) : (
                <div className="space-y-4">
                  {todaySessions.map((session) => {
                    return (
                      <div key={session.id} className="border-3 border-black rounded-2xl p-4 bg-[#fff9ed] shadow-[3px_3px_0px_rgba(0,0,0,1)] space-y-3">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div>
                            <h4 className="font-black text-sm text-gray-900">🎨 Lớp: {session.class.name}</h4>
                            <p className="text-[10px] text-gray-500 font-bold mt-0.5">⏱️ {session.startTime} - {session.endTime} | 📍 Phòng: {session.room || "Chưa xếp phòng"}</p>
                          </div>
                          <span className={`text-[9px] font-black border-2 border-black rounded px-2 py-0.5 ${
                            session.status === "COMPLETED" 
                              ? "bg-[#baffc9] text-emerald-800" 
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {session.status === "COMPLETED" ? "✓ Đã hoàn thành dạy" : "⏰ Đang chờ dạy"}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-black/10 pt-3">
                          {/* SESSION_START tasks */}
                          <div className="space-y-2">
                            <h5 className="font-extrabold text-[11px] text-amber-700 uppercase tracking-wide">🌅 Đầu buổi</h5>
                            <div className="space-y-2">
                              {teacherSessionTasks.filter(t => t.frequency === "SESSION_START").length === 0 ? (
                                <p className="text-gray-400 text-[10px] font-bold">Không có việc đầu buổi.</p>
                              ) : (
                                teacherSessionTasks.filter(t => t.frequency === "SESSION_START").map(task => {
                                  const comp = completions.find(c => c.taskId === task.id && c.sessionId === session.id);
                                  const isCompleted = !!comp;
                                  const notesVal = sessionTaskNotes[`${task.id}-${session.id}`] !== undefined
                                    ? sessionTaskNotes[`${task.id}-${session.id}`]
                                    : (comp?.notes || "");
                                  return (
                                    <div key={task.id} className="bg-white border-2 border-black/5 rounded-xl p-2.5 space-y-2">
                                      <CustomCheckbox
                                        checked={isCompleted}
                                        onChange={() => handleSessionTaskToggle(task.id, session.id, isCompleted, notesVal)}
                                        label={
                                          <div className="flex flex-col">
                                            <span className="font-extrabold text-xs text-gray-900">{task.title}</span>
                                            {task.description && <span className="font-bold text-[9px] text-gray-500 mt-0.5">{task.description}</span>}
                                          </div>
                                        }
                                      />
                                      {isCompleted && (
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            value={notesVal}
                                            onChange={(e) => handleSessionTaskNotesChange(task.id, session.id, e.target.value)}
                                            placeholder="Kết quả thực hiện..."
                                            className="flex-1 border border-black rounded px-1.5 py-0.5 bg-gray-50 text-[10px] font-bold focus:outline-none"
                                          />
                                          <button
                                            onClick={() => saveSessionTaskNotes(task.id, session.id)}
                                            className="bg-[#bae1ff] border border-black rounded px-2 py-0.5 font-black text-[9px] shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shrink-0"
                                          >
                                            Lưu
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          {/* SESSION_END tasks */}
                          <div className="space-y-2">
                            <h5 className="font-extrabold text-[11px] text-purple-700 uppercase tracking-wide">🌇 Cuối buổi</h5>
                            <div className="space-y-2">
                              {teacherSessionTasks.filter(t => t.frequency === "SESSION_END").length === 0 ? (
                                <p className="text-gray-400 text-[10px] font-bold">Không có việc cuối buổi.</p>
                              ) : (
                                teacherSessionTasks.filter(t => t.frequency === "SESSION_END").map(task => {
                                  const comp = completions.find(c => c.taskId === task.id && c.sessionId === session.id);
                                  const isCompleted = !!comp;
                                  const notesVal = sessionTaskNotes[`${task.id}-${session.id}`] !== undefined
                                    ? sessionTaskNotes[`${task.id}-${session.id}`]
                                    : (comp?.notes || "");
                                  return (
                                    <div key={task.id} className="bg-white border-2 border-black/5 rounded-xl p-2.5 space-y-2">
                                      <CustomCheckbox
                                        checked={isCompleted}
                                        onChange={() => handleSessionTaskToggle(task.id, session.id, isCompleted, notesVal)}
                                        label={
                                          <div className="flex flex-col">
                                            <span className="font-extrabold text-xs text-gray-900">{task.title}</span>
                                            {task.description && <span className="font-bold text-[9px] text-gray-500 mt-0.5">{task.description}</span>}
                                          </div>
                                        }
                                      />
                                      {isCompleted && (
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            value={notesVal}
                                            onChange={(e) => handleSessionTaskNotesChange(task.id, session.id, e.target.value)}
                                            placeholder="Kết quả thực hiện..."
                                            className="flex-1 border border-black rounded px-1.5 py-0.5 bg-gray-50 text-[10px] font-bold focus:outline-none"
                                          />
                                          <button
                                            onClick={() => saveSessionTaskNotes(task.id, session.id)}
                                            className="bg-[#bae1ff] border border-black rounded px-2 py-0.5 font-black text-[9px] shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shrink-0"
                                          >
                                            Lưu
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Note about daily tasks */}
          {teacherSessionTasks.length > 0 && (
            <div className="border-3 border-black bg-[#fff9ed] rounded-2xl p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-start gap-3">
              <Info className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-gray-900 text-sm">💡 Cách hoạt động của Checklist buổi dạy</h4>
                <p className="text-gray-600 text-xs font-bold">
                  Các nhiệm vụ đầu buổi và cuối buổi dạy ở trên đồng bộ trực tiếp với màn hình <strong>Điểm danh buổi học</strong> của lớp học tương ứng. Bạn có thể đánh dấu hoàn thành nhanh tại đây hoặc khi đang đứng lớp và điểm danh lớp học.
                </p>
              </div>
            </div>
          )}

          {/* Teacher Periodic Tasks Checklists */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Weekly Tasks */}
            <div className="border-3 border-black bg-white rounded-3xl p-5 shadow-[5px_5px_0px_rgba(0,0,0,1)] space-y-4">
              <h3 className="font-extrabold text-sm text-amber-700 bg-amber-50 border-2 border-amber-200 rounded-lg px-2.5 py-1 w-fit">
                📅 Nhiệm vụ Hàng tuần
              </h3>
              <div className="space-y-4 pt-1">
                {teacherGeneralTasks.filter(t => t.frequency === "WEEKLY").length === 0 ? (
                  <p className="text-gray-400 text-xs font-bold text-center py-4">Không có nhiệm vụ hàng tuần</p>
                ) : (
                  teacherGeneralTasks.filter(t => t.frequency === "WEEKLY").map(task => {
                    const status = myCompletions[task.id] || { completed: false, notes: "" };
                    return (
                      <div key={task.id} className="flex flex-col gap-2 p-3 bg-gray-50 border-2 border-black/5 rounded-xl">
                        <CustomCheckbox
                          checked={status.completed}
                          onChange={() => handleTeacherTaskToggle(task.id, status.completed, status.notes)}
                          label={
                            <div className="flex flex-col">
                              <span className="font-extrabold text-sm text-gray-900">{task.title}</span>
                              {task.description && <span className="font-bold text-[10px] text-gray-500 mt-0.5">{task.description}</span>}
                            </div>
                          }
                        />
                        {status.completed && (
                          <div className="flex gap-2 mt-1.5">
                            <input
                              type="text"
                              value={status.notes}
                              onChange={(e) => handleTeacherTaskNotesChange(task.id, e.target.value)}
                              placeholder="Kết quả thực hiện..."
                              className="flex-1 border-2 border-black rounded-lg p-1 px-2 bg-white text-[11px] font-bold focus:outline-none"
                            />
                            <button
                              onClick={() => saveTeacherTaskNotes(task.id)}
                              className="bg-[#bae1ff] border-2 border-black rounded-lg p-1.5 font-black text-[10px] shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shrink-0"
                            >
                              Lưu
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Monthly Tasks */}
            <div className="border-3 border-black bg-white rounded-3xl p-5 shadow-[5px_5px_0px_rgba(0,0,0,1)] space-y-4">
              <h3 className="font-extrabold text-sm text-purple-700 bg-purple-50 border-2 border-purple-200 rounded-lg px-2.5 py-1 w-fit">
                📆 Nhiệm vụ Hàng tháng
              </h3>
              <div className="space-y-4 pt-1">
                {teacherGeneralTasks.filter(t => t.frequency === "MONTHLY").length === 0 ? (
                  <p className="text-gray-400 text-xs font-bold text-center py-4">Không có nhiệm vụ hàng tháng</p>
                ) : (
                  teacherGeneralTasks.filter(t => t.frequency === "MONTHLY").map(task => {
                    const status = myCompletions[task.id] || { completed: false, notes: "" };
                    return (
                      <div key={task.id} className="flex flex-col gap-2 p-3 bg-gray-50 border-2 border-black/5 rounded-xl">
                        <CustomCheckbox
                          checked={status.completed}
                          onChange={() => handleTeacherTaskToggle(task.id, status.completed, status.notes)}
                          label={
                            <div className="flex flex-col">
                              <span className="font-extrabold text-sm text-gray-900">{task.title}</span>
                              {task.description && <span className="font-bold text-[10px] text-gray-500 mt-0.5">{task.description}</span>}
                            </div>
                          }
                        />
                        {status.completed && (
                          <div className="flex gap-2 mt-1.5">
                            <input
                              type="text"
                              value={status.notes}
                              onChange={(e) => handleTeacherTaskNotesChange(task.id, e.target.value)}
                              placeholder="Kết quả thực hiện..."
                              className="flex-1 border-2 border-black rounded-lg p-1 px-2 bg-white text-[11px] font-bold focus:outline-none"
                            />
                            <button
                              onClick={() => saveTeacherTaskNotes(task.id)}
                              className="bg-[#bae1ff] border-2 border-black rounded-lg p-1.5 font-black text-[10px] shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shrink-0"
                            >
                              Lưu
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* One-time/Once Tasks */}
            <div className="border-3 border-black bg-white rounded-3xl p-5 shadow-[5px_5px_0px_rgba(0,0,0,1)] space-y-4">
              <h3 className="font-extrabold text-sm text-sky-700 bg-sky-50 border-2 border-sky-200 rounded-lg px-2.5 py-1 w-fit">
                🎯 Nhiệm vụ Một lần
              </h3>
              <div className="space-y-4 pt-1">
                {teacherGeneralTasks.filter(t => t.frequency === "ONCE").length === 0 ? (
                  <p className="text-gray-400 text-xs font-bold text-center py-4">Không có nhiệm vụ một lần</p>
                ) : (
                  teacherGeneralTasks.filter(t => t.frequency === "ONCE").map(task => {
                    const status = myCompletions[task.id] || { completed: false, notes: "" };
                    return (
                      <div key={task.id} className="flex flex-col gap-2 p-3 bg-gray-50 border-2 border-black/5 rounded-xl">
                        <CustomCheckbox
                          checked={status.completed}
                          onChange={() => handleTeacherTaskToggle(task.id, status.completed, status.notes)}
                          label={
                            <div className="flex flex-col">
                              <span className="font-extrabold text-sm text-gray-900">{task.title}</span>
                              {task.description && <span className="font-bold text-[10px] text-gray-500 mt-0.5">{task.description}</span>}
                            </div>
                          }
                        />
                        {status.completed && (
                          <div className="flex gap-2 mt-1.5">
                            <input
                              type="text"
                              value={status.notes}
                              onChange={(e) => handleTeacherTaskNotesChange(task.id, e.target.value)}
                              placeholder="Kết quả thực hiện..."
                              className="flex-1 border-2 border-black rounded-lg p-1 px-2 bg-white text-[11px] font-bold focus:outline-none"
                            />
                            <button
                              onClick={() => saveTeacherTaskNotes(task.id)}
                              className="bg-[#bae1ff] border-2 border-black rounded-lg p-1.5 font-black text-[10px] shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shrink-0"
                            >
                              Lưu
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 2: Teacher Completions Log */}
      {role === "TEACHER" && activeTab === "log" && (
        <div className="border-4 border-black bg-white rounded-3xl p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <h3 className="text-xl font-black text-black mb-4">Lịch sử check việc đã làm</h3>
          
          {completions.length === 0 ? (
            <div className="text-center py-12 border-3 border-dashed border-gray-300 rounded-2xl bg-gray-50">
              <p className="text-gray-400 font-bold">Bạn chưa hoàn thành công việc nào gần đây 🎨</p>
            </div>
          ) : (
            <div className="overflow-x-auto border-3 border-black rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-3 border-black text-sm font-black text-black">
                    <th className="p-3">Tên công việc</th>
                    <th className="p-3">Tần suất</th>
                    <th className="p-3">Ngày hoàn thành</th>
                    <th className="p-3">Ngữ cảnh</th>
                    <th className="p-3">Ghi chú thực hiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {completions.map((comp) => {
                    const freqLabel = FREQUENCY_OPTIONS.find(f => f.value === comp.frequency)?.label || comp.frequency;
                    return (
                      <tr key={comp.id} className="text-xs font-bold text-gray-700 bg-white hover:bg-gray-50">
                        <td className="p-3 font-extrabold text-gray-900">{comp.taskTitle}</td>
                        <td className="p-3">
                          <span className="border-2 border-black rounded px-1.5 py-0.5 bg-[#fefaf0]">
                            {freqLabel}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{new Date(comp.completedAt).toLocaleString("vi-VN")}</td>
                        <td className="p-3">
                          {comp.className ? (
                            <span className="text-indigo-600">Lớp {comp.className}</span>
                          ) : (
                            <span className="text-gray-400">Định kỳ</span>
                          )}
                        </td>
                        <td className="p-3 text-gray-500 font-medium italic">{comp.notes || "-- Không có --"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Admin Tasks Configurations */}
      {role === "ADMIN" && activeTab === "adminTasks" && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.length === 0 ? (
              <div className="col-span-full text-center py-20 border-4 border-dashed border-gray-300 rounded-3xl bg-white">
                <p className="text-lg font-bold text-gray-400">Chưa có công việc nào được định nghĩa 📋</p>
                <p className="text-gray-400 text-sm mt-1">Hãy nhấn nút "Thêm công việc mới" để tạo.</p>
              </div>
            ) : (
              tasks.map((task) => {
                const freqLabel = FREQUENCY_OPTIONS.find(f => f.value === task.frequency)?.label || task.frequency;
                const assignedName = task.assignedTeacher?.user.name || "Tất cả giáo viên / Chung";
                
                return (
                  <div key={task.id} className="border-4 border-black bg-white rounded-3xl p-5 shadow-[5px_5px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="border-2 border-black rounded-lg px-2 py-0.5 bg-[#bae1ff] font-bold text-[10px] text-sky-900 uppercase">
                          {freqLabel}
                        </span>
                        
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEditModal(task)}
                            className="bg-[#ffffba] hover:bg-[#ffff8d] border-2 border-black rounded-lg p-1.5 shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shrink-0"
                            title="Sửa công việc"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task)}
                            className="bg-[#ffb3ba] hover:bg-[#ff8b94] border-2 border-black rounded-lg p-1.5 shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer shrink-0"
                            title="Xóa công việc"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-extrabold text-base text-gray-900 leading-tight">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs font-medium text-gray-500 leading-relaxed line-clamp-3 bg-gray-50 p-2 border border-black/5 rounded-lg">{task.description}</p>
                      )}
                    </div>

                    <div className="pt-4 border-t-2 border-dashed border-black/10 mt-4">
                      <span className="text-[10px] font-black text-gray-400 block uppercase">Phân công cho</span>
                      <span className="font-bold text-xs text-gray-800 flex items-center gap-1.5 mt-0.5">
                        👤 {assignedName}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Admin Reports */}
      {role === "ADMIN" && activeTab === "adminReports" && (
        <div className="border-4 border-black bg-white rounded-3xl p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] space-y-6">
          <h3 className="text-xl font-black text-black">Báo cáo & Lịch sử kiểm tra công việc</h3>
          
          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <div>
              <label className="block text-xs font-black text-gray-700 mb-1.5 uppercase">Lọc theo giáo viên</label>
              <CustomSelect
                value={reportTeacherFilter}
                onChange={(val) => setReportTeacherFilter(val)}
                options={teacherSelectOptions}
              />
            </div>
            
            <div>
              <label className="block text-xs font-black text-gray-700 mb-1.5 uppercase">Lọc theo tần suất</label>
              <CustomSelect
                value={reportFreqFilter}
                onChange={(val) => setReportFreqFilter(val)}
                options={[
                  { value: "", label: "-- Tất cả tần suất --" },
                  ...FREQUENCY_OPTIONS
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 mb-1.5 uppercase">Từ ngày</label>
              <input
                type="date"
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
                className="w-full border-3 border-black rounded-xl p-2 bg-white font-bold text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 mb-1.5 uppercase">Đến ngày</label>
              <input
                type="date"
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
                className="w-full border-3 border-black rounded-xl p-2 bg-white font-bold text-xs"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-2 border-t border-black/10">
              <button
                type="button"
                onClick={() => {
                  setReportTeacherFilter("");
                  setReportFreqFilter("");
                  setReportStartDate("");
                  setReportEndDate("");
                }}
                className="bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-lg px-4 py-2 font-bold text-xs cursor-pointer"
              >
                Đặt lại lọc
              </button>
              <button
                type="button"
                onClick={fetchReports}
                className="bg-[#bae1ff] hover:bg-[#a0d2ff] border-2 border-black rounded-lg px-5 py-2 font-black text-xs shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                Áp dụng lọc
              </button>
            </div>
          </div>

          {/* Results table */}
          {loadingReports ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : completions.length === 0 ? (
            <div className="text-center py-12 border-3 border-dashed border-gray-300 rounded-2xl bg-gray-50">
              <p className="text-gray-400 font-bold">Không tìm thấy báo cáo công việc tương ứng với bộ lọc 🔍</p>
            </div>
          ) : (
            <div className="overflow-x-auto border-3 border-black rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-3 border-black text-sm font-black text-black">
                    <th className="p-3">Giáo viên</th>
                    <th className="p-3">Công việc</th>
                    <th className="p-3">Tần suất</th>
                    <th className="p-3">Ngày làm</th>
                    <th className="p-3">Ngữ cảnh</th>
                    <th className="p-3">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {completions.map((comp) => {
                    const freqLabel = FREQUENCY_OPTIONS.find(f => f.value === comp.frequency)?.label || comp.frequency;
                    return (
                      <tr key={comp.id} className="text-xs font-bold text-gray-700 bg-white hover:bg-gray-50">
                        <td className="p-3 font-black text-indigo-700">👤 {comp.teacherName}</td>
                        <td className="p-3 font-extrabold text-gray-900">{comp.taskTitle}</td>
                        <td className="p-3">
                          <span className="border-2 border-black rounded px-1.5 py-0.5 bg-yellow-50 text-[10px]">
                            {freqLabel}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{new Date(comp.completedAt).toLocaleString("vi-VN")}</td>
                        <td className="p-3">
                          {comp.className ? (
                            <span className="text-emerald-700">Lớp {comp.className}</span>
                          ) : (
                            <span className="text-gray-400">Định kỳ</span>
                          )}
                        </td>
                        <td className="p-3 text-gray-500 font-medium italic">{comp.notes || "-- Không có --"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT TASK MODAL (ADMIN) */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="border-4 border-black bg-white rounded-3xl max-w-md w-full p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] relative flex flex-col max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsTaskModalOpen(false)}
              className="absolute top-4 right-4 bg-gray-50 hover:bg-gray-100 border-2 border-black rounded-lg p-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer text-gray-700"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-black text-black mb-4 flex items-center gap-2">
              📝 {editingTask ? "Chỉnh sửa công việc" : "Thêm công việc mới"}
            </h3>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5 uppercase">Tên công việc *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Dọn sạch màu nước trên bàn vẽ"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5 uppercase">Mô tả công việc</label>
                <textarea
                  placeholder="Mô tả các đầu việc chi tiết..."
                  rows={3}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-medium text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5 uppercase">Tần suất thực hiện *</label>
                <CustomSelect
                  value={taskForm.frequency}
                  onChange={(val) => setTaskForm({ ...taskForm, frequency: val })}
                  options={FREQUENCY_OPTIONS}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5 uppercase">Phân công cho giáo viên</label>
                <CustomSelect
                  value={taskForm.assignedTeacherId}
                  onChange={(val) => setTaskForm({ ...taskForm, assignedTeacherId: val })}
                  options={teacherSelectOptions}
                />
                <span className="text-[10px] text-gray-400 font-bold block mt-1">Lưu ý: Để trống nếu muốn áp dụng cho tất cả giáo viên.</span>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-black/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 border-3 border-black rounded-xl px-5 py-2.5 font-bold text-sm cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submittingTask}
                  className="bg-[#a8e6cf] hover:bg-[#96d8c0] border-3 border-black rounded-xl px-6 py-2.5 font-black shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {submittingTask ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 shrink-0" />
                      Lưu công việc
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICATION MODAL */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => {
          setNotification(prev => ({ ...prev, isOpen: false }));
        }}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onConfirm={notification.onConfirm}
      />

    </div>
  );
}
