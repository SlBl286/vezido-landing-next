"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cmsApi } from "@/lib/api-client";
import { AuthSession } from "@/lib/types/api";
import { 
  ArrowLeft, Calendar, MapPin, User, FileText, Check, Loader2, 
  Trash2, UploadCloud, Smile, Sparkles, Plus, CheckCircle2, Clock, XCircle
} from "lucide-react";
import { CustomSelect } from "@/app/cms/components/ui/custom-select";
import { NotificationModal } from "@/app/cms/components/modals/NotificationModal";
import { CustomCheckbox } from "@/app/cms/components/ui/custom-checkbox";
import { getImageUrl } from "@/lib/utils";

const PLACEHOLDER_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' font-size='14' font-family='sans-serif' font-weight='bold' fill='%239ca3af' dominant-baseline='middle' text-anchor='middle'>Chưa tải ảnh bài vẽ</text></svg>";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SessionDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  // Authentication & session state
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Data states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [teachersPool, setTeachersPool] = useState<any[]>([]);
  const [sessionTasks, setSessionTasks] = useState<any[]>([]);

  // Metadata edit states
  const [assignedTeacherId, setAssignedTeacherId] = useState<string>("");
  const [room, setRoom] = useState<string>("");

  // Attendance states map: { studentClassId: { status, notes } }
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: string; notes: string }>>({});

  // Artworks state map: { studentCode: { id, imageUrl, title, comment, isDeleted } }
  const [artworksMap, setArtworksMap] = useState<Record<string, {
    id?: string;
    imageUrl: string;
    title: string;
    comment: string;
    isDeleted: boolean;
  }>>({});

  // Notification State
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

  // Get session on mount
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

  // Fetch session details
  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await cmsApi.sessions.getDetail(id);
      setSessionInfo(data.session);
      setStudentsList(data.students || []);
      setTeachersPool(data.teachersPool || []);
      setSessionTasks(data.sessionTasks || []);

      setAssignedTeacherId(data.session.teacherId || "");
      setRoom(data.session.room || "");

      const initialAttendance: Record<string, { status: string; notes: string }> = {};
      const initialArtworks: Record<string, { id?: string; imageUrl: string; title: string; comment: string; isDeleted: boolean }> = {};

      data.students.forEach((student: any) => {
        initialAttendance[student.id] = student.attendance 
          ? { status: student.attendance.status, notes: student.attendance.notes || "" }
          : { status: "PRESENT", notes: "" };

        if (student.artwork) {
          initialArtworks[student.studentCode] = {
            id: student.artwork.id,
            imageUrl: student.artwork.imageUrl,
            title: student.artwork.title || "",
            comment: student.artwork.comment || "",
            isDeleted: false,
          };
        }
      });

      setAttendanceMap(initialAttendance);
      setArtworksMap(initialArtworks);
    } catch (err: any) {
      console.error("Failed to fetch session detail:", err);
      showNotification("Lỗi tải thông tin", err.message || "Không thể tải chi tiết buổi học.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingSession && session) {
      fetchDetail();
    }
  }, [loadingSession, session, id]);

  // Handle Attendance status toggle
  const handleAttendanceChange = (studentClassId: string, status: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentClassId]: {
        ...prev[studentClassId],
        status,
      }
    }));
  };

  // Handle Attendance notes text field
  const handleAttendanceNotesChange = (studentClassId: string, notes: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentClassId]: {
        ...prev[studentClassId],
        notes,
      }
    }));
  };

  // Handle session tasks interactions
  const handleTaskToggle = (taskId: string, checked: boolean) => {
    setSessionTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, isCompleted: checked } : task
    ));
  };

  const handleTaskNotesChange = (taskId: string, notes: string) => {
    setSessionTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, notes } : task
    ));
  };

  // Convert uploaded image file to Base64
  const handleFileChange = (studentCode: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      showNotification("Định dạng không hợp lệ", "Vui lòng chọn một tệp hình ảnh (PNG, JPG, WebP).", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const defaultTitle = `Tranh vẽ ngày ${sessionInfo ? new Date(sessionInfo.date).toLocaleDateString("vi-VN") : new Date().toLocaleDateString("vi-VN")}`;
      
      setArtworksMap(prev => ({
        ...prev,
        [studentCode]: {
          id: prev[studentCode]?.id, // Keep ID if updating existing
          imageUrl: base64String,
          title: prev[studentCode]?.title || defaultTitle,
          comment: prev[studentCode]?.comment || "",
          isDeleted: false,
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  // Handle local artwork detail changes (title or comment)
  const handleArtworkDataChange = (studentCode: string, field: "title" | "comment", value: string) => {
    setArtworksMap(prev => {
      const current = prev[studentCode] || { imageUrl: "", title: "", comment: "", isDeleted: false };
      return {
        ...prev,
        [studentCode]: {
          ...current,
          [field]: value,
        }
      };
    });
  };

  // Handle local artwork removal
  const handleDeleteArtwork = (studentCode: string) => {
    setArtworksMap(prev => {
      const current = prev[studentCode];
      if (!current) return prev;
      return {
        ...prev,
        [studentCode]: {
          ...current,
          imageUrl: "",
          isDeleted: true,
        }
      };
    });
  };

  // Save changes
  const handleSaveDetail = async () => {
    setSaving(true);
    try {
      const attendancePayload = Object.entries(attendanceMap).map(([studentClassId, val]) => ({
        studentClassId,
        status: val.status,
        notes: val.notes
      }));

      const artworksPayload = Object.entries(artworksMap)
        .filter(([_, val]) => val.imageUrl || val.title || val.comment || val.isDeleted)
        .map(([studentCode, val]) => ({
          studentCode,
          imageUrl: val.imageUrl || (val.isDeleted ? "" : PLACEHOLDER_IMAGE),
          title: val.title || `Tranh vẽ ngày ${sessionInfo ? new Date(sessionInfo.date).toLocaleDateString("vi-VN") : new Date().toLocaleDateString("vi-VN")}`,
          comment: val.comment || "",
          isDeleted: val.isDeleted
        }));

      const tasksPayload = sessionTasks.map(task => ({
        taskId: task.id,
        isCompleted: task.isCompleted,
        notes: task.notes || ""
      }));

      await cmsApi.sessions.saveDetail(id, {
        teacherId: assignedTeacherId || null,
        room: room || null,
        attendance: attendancePayload,
        artworks: artworksPayload,
        taskCompletions: tasksPayload
      });

      showNotification("Lưu thành công 🎨", "Mọi thay đổi về điểm danh và bài làm học sinh đã được cập nhật.", "success", () => {
        fetchDetail();
      });
    } catch (err: any) {
      showNotification("Lỗi lưu dữ liệu", err.message || "Đã xảy ra lỗi khi lưu thông tin buổi học.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loadingSession) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        <p className="mt-4 font-bold text-gray-600">Đang tải trang...</p>
      </div>
    );
  }

  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "TEACHER" && role !== "ASSISTANT") {
    return (
      <div className="border-4 border-black bg-white rounded-3xl p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto my-12">
        <span className="text-6xl mb-4 block">🚫</span>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h1>
        <p className="text-gray-600">Trang này chỉ dành cho Giáo viên hoặc Quản trị viên.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        <p className="mt-4 font-bold text-gray-600">Đang tải thông tin chi tiết buổi học...</p>
      </div>
    );
  }

  // Calculate live statistics
  const stats = {
    total: studentsList.length,
    present: Object.values(attendanceMap).filter(v => v.status === "PRESENT").length,
    late: Object.values(attendanceMap).filter(v => v.status === "LATE").length,
    absent: Object.values(attendanceMap).filter(v => v.status === "ABSENT").length,
    drawings: Object.values(artworksMap).filter(v => v.imageUrl && !v.isDeleted).length
  };

  const formattedDate = sessionInfo ? new Date(sessionInfo.date).toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }) : "";

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-200">
      
      {/* Back to calendar row */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.push("/cms/schedule")}
          className="flex items-center gap-1.5 bg-white hover:bg-gray-50 border-3 border-black rounded-xl px-4 py-2 text-xs font-black shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Lịch học
        </button>

        <span className={`text-xs font-black border-2 border-black rounded-lg px-2.5 py-1 ${
          sessionInfo?.status === "COMPLETED" 
            ? "bg-[#baffc9] text-emerald-800" 
            : "bg-amber-100 text-amber-800"
        }`}>
          {sessionInfo?.status === "COMPLETED" ? "✓ Đã Điểm Danh & Nhận Xét" : "⏰ Buổi học chuẩn bị diễn ra"}
        </span>
      </div>

      {/* Overview Block */}
      <div className="border-4 border-black bg-white rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
        <div>
          <span className="text-[10px] bg-amber-200 border-2 border-black rounded-lg px-2 py-0.5 font-black text-black uppercase tracking-wider">
            Chi tiết lớp học
          </span>
          <h2 className="text-3xl font-black text-black mt-2">
            Lớp: {sessionInfo?.className}
          </h2>
          <p className="text-gray-500 font-bold text-sm mt-1">Lên lịch: {formattedDate} | {sessionInfo?.startTime} - {sessionInfo?.endTime}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t-2 border-dashed border-black/10">
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1.5 uppercase tracking-wide">👩‍🏫 Giáo viên đứng lớp</label>
            <CustomSelect
              value={assignedTeacherId}
              onChange={(val) => setAssignedTeacherId(val)}
              placeholder="-- Chưa phân công --"
              options={[
                { value: "", label: "-- Chưa phân công --" },
                ...teachersPool.map((t) => ({
                  value: t.id,
                  label: t.name
                }))
              ]}
            />
            <p className="text-[10px] text-gray-400 font-bold mt-1.5">Danh sách này gồm các giáo viên được phụ trách lớp học này.</p>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 mb-1.5 uppercase tracking-wide">📍 Phòng học / Đường dẫn Zoom</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Ví dụ: Phòng 102, Link Zoom..."
              className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-sm"
            />
          </div>
        </div>
      </div>

      {/* Live Statistics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-sky-100 border-3 border-black rounded-2xl p-3 text-center shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          <div className="text-[10px] font-black text-sky-800 uppercase">Sĩ số lớp</div>
          <div className="text-2xl font-black text-black mt-0.5">{stats.total}</div>
        </div>
        <div className="bg-emerald-100 border-3 border-black rounded-2xl p-3 text-center shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          <div className="text-[10px] font-black text-emerald-800 uppercase">✓ Đi học</div>
          <div className="text-2xl font-black text-black mt-0.5">{stats.present}</div>
        </div>
        <div className="bg-amber-100 border-3 border-black rounded-2xl p-3 text-center shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          <div className="text-[10px] font-black text-amber-800 uppercase">⏰ Đi muộn</div>
          <div className="text-2xl font-black text-black mt-0.5">{stats.late}</div>
        </div>
        <div className="bg-rose-100 border-3 border-black rounded-2xl p-3 text-center shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          <div className="text-[10px] font-black text-rose-800 uppercase">✗ Nghỉ học</div>
          <div className="text-2xl font-black text-black mt-0.5">{stats.absent}</div>
        </div>
        <div className="bg-purple-100 border-3 border-black rounded-2xl p-3 text-center col-span-2 sm:col-span-1 shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          <div className="text-[10px] font-black text-purple-800 uppercase">🎨 Tranh vẽ nộp</div>
          <div className="text-2xl font-black text-black mt-0.5">{stats.drawings} / {stats.total}</div>
        </div>
      </div>

      {/* Checklist Widget */}
      <div className="border-4 border-black bg-white rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
        <h3 className="text-lg font-black text-black flex items-center gap-1.5 px-1 border-b-2 border-black/10 pb-2">
          📋 Checklist nhiệm vụ dạy học ({sessionTasks.length})
        </h3>
        
        {sessionTasks.length === 0 ? (
          <p className="text-gray-400 text-sm font-bold py-2 px-1">Không có nhiệm vụ đầu buổi/cuối buổi nào được phân công.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start of Session Tasks */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-sm text-amber-700 bg-amber-50 border-2 border-amber-200 rounded-lg px-2.5 py-1 w-fit">
                🌅 Đầu buổi dạy
              </h4>
              <div className="space-y-3 pl-1">
                {sessionTasks.filter(t => t.frequency === "SESSION_START").length === 0 ? (
                  <p className="text-gray-400 text-xs font-bold">Không có việc đầu buổi.</p>
                ) : (
                  sessionTasks.filter(t => t.frequency === "SESSION_START").map(task => (
                    <div key={task.id} className="flex flex-col gap-1.5 p-2.5 bg-gray-50 border-2 border-black/5 rounded-xl">
                      <CustomCheckbox
                        checked={task.isCompleted}
                        onChange={(checked) => handleTaskToggle(task.id, checked)}
                        label={
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-sm text-gray-900">{task.title}</span>
                              {task.reward && (
                                <span className="text-[9px] font-black bg-[#a8e6cf] border border-black rounded px-1 text-emerald-800">
                                  🎁 {task.reward}
                                </span>
                              )}
                              {task.penalty && (
                                <span className="text-[9px] font-black bg-[#ffb3ba] border border-black rounded px-1 text-red-800">
                                  ⚠️ {task.penalty}
                                </span>
                              )}
                            </div>
                            {task.description && <span className="font-bold text-[10px] text-gray-500 mt-0.5">{task.description}</span>}
                          </div>
                        }
                      />
                      {task.isCompleted && (
                        <input
                          type="text"
                          value={task.notes}
                          onChange={(e) => handleTaskNotesChange(task.id, e.target.value)}
                          placeholder="Ghi chú kết quả thực hiện (nếu có)..."
                          className="w-full mt-1 border-2 border-black rounded-lg p-1.5 bg-white text-xs font-bold focus:outline-none"
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* End of Session Tasks */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-sm text-purple-700 bg-purple-50 border-2 border-purple-200 rounded-lg px-2.5 py-1 w-fit">
                🌇 Cuối buổi dạy
              </h4>
              <div className="space-y-3 pl-1">
                {sessionTasks.filter(t => t.frequency === "SESSION_END").length === 0 ? (
                  <p className="text-gray-400 text-xs font-bold">Không có việc cuối buổi.</p>
                ) : (
                  sessionTasks.filter(t => t.frequency === "SESSION_END").map(task => (
                    <div key={task.id} className="flex flex-col gap-1.5 p-2.5 bg-gray-50 border-2 border-black/5 rounded-xl">
                      <CustomCheckbox
                        checked={task.isCompleted}
                        onChange={(checked) => handleTaskToggle(task.id, checked)}
                        label={
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-sm text-gray-900">{task.title}</span>
                              {task.reward && (
                                <span className="text-[9px] font-black bg-[#a8e6cf] border border-black rounded px-1 text-emerald-800">
                                  🎁 {task.reward}
                                </span>
                              )}
                              {task.penalty && (
                                <span className="text-[9px] font-black bg-[#ffb3ba] border border-black rounded px-1 text-red-800">
                                  ⚠️ {task.penalty}
                                </span>
                              )}
                            </div>
                            {task.description && <span className="font-bold text-[10px] text-gray-500 mt-0.5">{task.description}</span>}
                          </div>
                        }
                      />
                      {task.isCompleted && (
                        <input
                          type="text"
                          value={task.notes}
                          onChange={(e) => handleTaskNotesChange(task.id, e.target.value)}
                          placeholder="Ghi chú kết quả thực hiện (nếu có)..."
                          className="w-full mt-1 border-2 border-black rounded-lg p-1.5 bg-white text-xs font-bold focus:outline-none"
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Student List Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-black flex items-center gap-1.5 px-1">
          👥 Danh sách học sinh & Điểm danh buổi học
        </h3>

        {studentsList.length === 0 ? (
          <div className="border-4 border-dashed border-gray-300 rounded-3xl p-12 text-center bg-white">
            <p className="text-lg font-bold text-gray-400">Lớp học này chưa có học sinh nào đăng ký 🎨</p>
            <p className="text-gray-400 text-sm mt-1">Vui lòng đăng ký học sinh vào lớp trước từ trang danh sách lớp.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {studentsList.map((student) => {
              const currentAttendance = attendanceMap[student.id] || { status: "PRESENT", notes: "" };
              const currentArtwork = artworksMap[student.studentCode];
              const showArtworkPolaroid = currentArtwork && currentArtwork.imageUrl && !currentArtwork.isDeleted;

              return (
                <div 
                  key={student.id} 
                  className={`border-4 border-black rounded-3xl p-5 md:p-6 bg-white shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-all ${
                    currentAttendance.status === "ABSENT" ? "bg-rose-50/20" : ""
                  }`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Column 1: Info and Attendance Selection (lg:col-span-7) */}
                    <div className="lg:col-span-7 space-y-4">
                      {/* Student Heading */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xl font-black text-black">{student.studentName}</h4>
                          <span className="bg-amber-100 border-2 border-black rounded px-1.5 py-0.5 text-[9px] font-black text-black uppercase">
                            Mã: {student.studentCode}
                          </span>
                          <span className="bg-sky-100 border-2 border-black rounded px-1.5 py-0.5 text-[9px] font-black text-black">
                            {student.studentAge} tuổi
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-bold mt-1">Phụ huynh: {student.parentName} ({student.parentPhone})</p>
                      </div>

                      {/* Attendance Radio Selector */}
                      <div>
                        <label className="block text-xs font-black text-gray-700 mb-1.5 uppercase">Điểm danh học sinh</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => handleAttendanceChange(student.id, "PRESENT")}
                            className={`flex items-center justify-center gap-1.5 border-3 border-black rounded-xl py-2 px-3 font-black text-xs transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
                              currentAttendance.status === "PRESENT"
                                ? "bg-[#baffc9] text-emerald-800"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>Đi học</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleAttendanceChange(student.id, "LATE")}
                            className={`flex items-center justify-center gap-1.5 border-3 border-black rounded-xl py-2 px-3 font-black text-xs transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
                              currentAttendance.status === "LATE"
                                ? "bg-[#ffdfba] text-amber-800"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <Clock className="w-4 h-4 shrink-0" />
                            <span>Muộn</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAttendanceChange(student.id, "ABSENT")}
                            className={`flex items-center justify-center gap-1.5 border-3 border-black rounded-xl py-2 px-3 font-black text-xs transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
                              currentAttendance.status === "ABSENT"
                                ? "bg-[#ffb3ba] text-rose-800"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <XCircle className="w-4 h-4 shrink-0" />
                            <span>Vắng học</span>
                          </button>
                        </div>
                      </div>

                      {/* Attendance Notes */}
                      <div>
                        <label className="block text-xs font-black text-gray-700 mb-1 uppercase">Ghi chú điểm danh / Lý do vắng</label>
                        <input
                          type="text"
                          value={currentAttendance.notes}
                          onChange={(e) => handleAttendanceNotesChange(student.id, e.target.value)}
                          placeholder="Ví dụ: Nghỉ phép có báo trước, Đi muộn 15p..."
                          className="w-full border-3 border-black rounded-xl p-2 bg-gray-50 text-xs font-semibold"
                        />
                      </div>
                    </div>

                    {/* Column 2: Artwork & Comments (lg:col-span-5) */}
                    <div className="lg:col-span-5 border-t-2 lg:border-t-0 lg:border-l-2 border-dashed border-black/15 pt-5 lg:pt-0 lg:pl-6 space-y-4">
                      <label className="block text-xs font-black text-gray-700 uppercase">Bài làm / Tác phẩm trong buổi</label>

                      {showArtworkPolaroid ? (
                        // Polaroid view for uploaded artwork
                        <div className="border-3 border-black bg-white p-3 pb-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] rotate-1 mx-auto max-w-[260px] flex flex-col items-center">
                          <div className="relative aspect-square w-full border-2 border-black overflow-hidden bg-gray-100">
                            <img 
                              src={getImageUrl(currentArtwork.imageUrl)} 
                              alt={`Tranh vẽ của ${student.studentName}`}
                              className="object-cover w-full h-full"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteArtwork(student.studentCode)}
                              className="absolute top-2 right-2 bg-rose-100 hover:bg-rose-200 border-2 border-black text-rose-700 rounded-full p-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] cursor-pointer"
                              title="Xóa ảnh tranh vẽ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Upload area
                        <div className="relative border-3 border-dashed border-black/30 bg-gray-50 rounded-2xl p-6 hover:bg-black/5 hover:border-black/60 transition-all flex flex-col items-center text-center cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileChange(student.studentCode, file);
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                          <span className="text-xs font-black text-black">Tải ảnh tranh vẽ lên</span>
                          <span className="text-[9px] text-gray-500 font-bold mt-1">Chấp nhận JPG, PNG, WebP</span>
                        </div>
                      )}

                      {/* Artwork Title & Teacher Comment Inputs (Always Visible) */}
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Tên tranh vẽ</label>
                          <input
                            type="text"
                            value={currentArtwork?.title || ""}
                            onChange={(e) => handleArtworkDataChange(student.studentCode, "title", e.target.value)}
                            placeholder="Nhập tên tranh..."
                            className="w-full border-3 border-black rounded-xl p-2 bg-gray-50 text-xs font-semibold focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-purple-700 mb-1 uppercase flex items-center gap-1">
                            <Smile className="w-3.5 h-3.5" /> Nhận xét của giáo viên
                          </label>
                          <textarea
                            rows={2}
                            value={currentArtwork?.comment || ""}
                            onChange={(e) => handleArtworkDataChange(student.studentCode, "comment", e.target.value)}
                            placeholder="Nhận xét bé vẽ như thế nào, sử dụng màu sắc phối hợp ra sao..."
                            className="w-full border-3 border-black rounded-xl p-2.5 bg-purple-50/10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar for Saving */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t-4 border-black py-4 px-6 flex items-center justify-between z-40 max-w-7xl mx-auto rounded-t-3xl shadow-[0_-8px_16px_rgba(0,0,0,0.08)]">
        <div className="hidden sm:block">
          <p className="text-xs font-black text-gray-600">Sĩ số: {stats.total} | Đi học: {stats.present} | Muộn: {stats.late} | Tranh nộp: {stats.drawings}</p>
        </div>
        <div className="flex gap-3 ml-auto">
          <button
            type="button"
            onClick={() => router.push("/cms/schedule")}
            className="bg-gray-100 hover:bg-gray-200 border-3 border-black rounded-xl px-5 py-2.5 font-bold shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-sm cursor-pointer"
          >
            Hủy bỏ
          </button>
          
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveDetail}
            className="bg-[#a8e6cf] hover:bg-[#96d8c0] border-3 border-black rounded-xl px-6 py-2.5 font-black shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 text-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 shrink-0" />
                Lưu buổi học
              </>
            )}
          </button>
        </div>
      </div>

      {/* CUSTOM NOTIFICATION MODAL */}
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
