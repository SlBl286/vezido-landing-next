"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cmsApi } from "@/lib/api-client";
import { AuthSession, ClassSessionWithRelations } from "@/lib/types/api";
import { 
  ChevronLeft, ChevronRight, Calendar, Loader2, MapPin, 
  User, CheckCircle2, AlertCircle, RefreshCw, ClipboardList, Info, X
} from "lucide-react";
import { StudentAttendanceModal } from "@/app/cms/components/modals/StudentAttendanceModal";
import { NotificationModal } from "@/app/cms/components/modals/NotificationModal";

export default function SchedulePage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [teacherProfileId, setTeacherProfileId] = useState<string | undefined>(undefined);

  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<ClassSessionWithRelations[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [viewType, setViewType] = useState<"center" | "personal">("center");

  // Selected session detail state
  const [selectedSession, setSelectedSession] = useState<ClassSessionWithRelations | null>(null);
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState<any | null>(null);

  // Notification State
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info" | "confirm";
    onCloseCallback?: () => void;
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
    onCloseCallback?: () => void,
    onConfirm?: () => void
  ) => {
    setNotification({
      isOpen: true,
      title,
      message,
      type,
      onCloseCallback,
      onConfirm
    });
  };

  // Fetch session & teacher profile
  useEffect(() => {
    async function loadUserSession() {
      try {
        const data = await cmsApi.auth.getSession();
        setSession(data);
        
        if (data.user?.role === "TEACHER") {
          setViewType("personal");
        }

        // Fetch profile to get teacher profile ID
        const profileData = await cmsApi.profile.get();
        if (profileData.user?.teacherProfile?.id) {
          setTeacherProfileId(profileData.user.teacherProfile.id);
        }
      } catch (err) {
        console.error("Failed to load session/profile:", err);
      } finally {
        setLoadingSession(false);
      }
    }
    loadUserSession();
  }, []);

  // Construct month grid days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const daysGrid: { date: Date; isCurrentMonth: boolean }[] = [];
  const firstDayOfMonth = new Date(year, month, 1);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday, 1 is Monday...
  
  // Adjust Monday offset (Monday is 0, Tuesday is 1... Sunday is 6)
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const prevMonthLastDate = new Date(year, month, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    daysGrid.push({
      date: new Date(year, month - 1, prevMonthLastDate - i),
      isCurrentMonth: false
    });
  }

  const lastDate = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= lastDate; i++) {
    daysGrid.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }

  const remaining = 42 - daysGrid.length;
  for (let i = 1; i <= remaining; i++) {
    daysGrid.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }

  // Fetch sessions when date range or filter changes
  const fetchCalendarSessions = async () => {
    if (daysGrid.length === 0) return;
    setLoadingSessions(true);

    const formatDateString = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const startDate = formatDateString(daysGrid[0].date);
    const endDate = formatDateString(daysGrid[daysGrid.length - 1].date);

    try {
      const params: any = { startDate, endDate };
      if (viewType === "personal" && teacherProfileId) {
        params.teacherId = teacherProfileId;
      }
      
      const data = await cmsApi.sessions.list(params);
      setSessions(data.sessions || []);
    } catch (err: any) {
      console.error("Failed to load sessions:", err);
      showNotification("Lỗi tải lịch học", err.message || "Không thể tải lịch học cho khoảng thời gian này.", "error");
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (!loadingSession && session) {
      fetchCalendarSessions();
    }
  }, [loadingSession, session, currentDate, viewType, teacherProfileId]);

  if (loadingSession) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        <p className="mt-4 font-bold text-gray-600">Đang tải lịch học...</p>
      </div>
    );
  }

  const user = session?.user;
  if (!user || user.role === "ASSISTANT") {
    return (
      <div className="border-4 border-black bg-white rounded-3xl p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto my-12">
        <span className="text-6xl mb-4 block">🚫</span>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h1>
        <p className="text-gray-600">Trang này không khả dụng đối với vai trò của bạn.</p>
      </div>
    );
  }

  // Group sessions by day
  const sessionsByDay: { [key: string]: ClassSessionWithRelations[] } = {};
  sessions.forEach(session => {
    // session.date comes as ISO string e.g. "2026-06-06T00:00:00.000Z"
    const localDate = new Date(session.date);
    const key = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;
    if (!sessionsByDay[key]) {
      sessionsByDay[key] = [];
    }
    sessionsByDay[key].push(session);
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formattedMonthName = currentDate.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric"
  });

  // Calculate upcoming sessions
  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingSessions = [...sessions]
    .filter(s => {
      const sDate = s.date.split("T")[0];
      return sDate >= todayStr && s.status !== "CANCELLED";
    })
    .slice(0, 5);

  const WEEK_DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-4 border-black bg-white rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            📅 Lịch học & Giảng dạy
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Theo dõi và quản lý lịch trình các buổi học vẽ thuận tiện dưới dạng lịch biểu quan sát trực quan
          </p>
        </div>

        {user.role === "ADMIN" && (
          <div className="flex border-3 border-black rounded-xl overflow-hidden bg-white shrink-0 self-start sm:self-center shadow-[3px_3px_0px_rgba(0,0,0,1)]">
            <button
              onClick={() => setViewType("center")}
              className={`px-4 py-2 text-xs font-black cursor-pointer transition-all ${
                viewType === "center" 
                  ? "bg-sky-200 text-black border-r-3 border-black" 
                  : "bg-white text-gray-600 hover:bg-gray-50 border-r-3 border-black"
              }`}
            >
              🏢 Lịch trung tâm
            </button>
            <button
              onClick={() => setViewType("personal")}
              className={`px-4 py-2 text-xs font-black cursor-pointer transition-all ${
                viewType === "personal" 
                  ? "bg-amber-200 text-black" 
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              👩‍🏫 Lịch cá nhân
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Left Side: Upcoming Sessions List */}
        <div className="border-4 border-black bg-white rounded-3xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] xl:col-span-1 space-y-4">
          <h3 className="text-base font-black text-black border-b-2 border-black pb-2 flex items-center gap-1.5">
            <ClipboardList className="w-5 h-5 text-amber-500" /> Lịch sắp diễn ra
          </h3>

          {loadingSessions ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <p className="mt-2 text-xs text-gray-500 font-bold">Đang tải...</p>
            </div>
          ) : upcomingSessions.length === 0 ? (
            <p className="text-xs text-gray-400 font-bold italic py-4 text-center">Không có lịch học nào sắp diễn ra.</p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((s) => {
                const dateVal = new Date(s.date);
                const isMakeup = s.isMakeup;
                const status = s.status;

                return (
                  <div 
                    key={s.id}
                    onClick={() => setSelectedSession(s)}
                    className="border-2 border-black rounded-xl p-3 bg-gray-50 hover:bg-[#fff9ed] hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-0 cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-black text-xs text-gray-900 line-clamp-1">{s.class?.name}</span>
                      {isMakeup && (
                        <span className="bg-purple-100 border border-purple-300 rounded px-1 text-[9px] font-black text-purple-700 whitespace-nowrap">
                          Bù
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-black text-amber-600">
                      📅 {dateVal.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" })} | ⏰ {s.startTime} - {s.endTime}
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-gray-500 font-semibold">
                      <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                      <span className="line-clamp-1">{s.room || "Tại trung tâm"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border border-black/10 rounded-xl bg-amber-50/20 p-3 text-[11px] text-gray-600 font-semibold space-y-1">
            <p className="font-black text-gray-800 text-xs mb-1">💡 Hướng dẫn nhanh:</p>
            <p>• Nhấp vào buổi học trong lịch để xem thông tin chi tiết.</p>
            <p>• Thầy/Cô có thể nhấp <strong>Điểm danh</strong> trực tiếp từ thông tin buổi học.</p>
            <p>• Click các nút mũi tên để chuyển tháng.</p>
          </div>
        </div>

        {/* Right Side: The Grid Calendar */}
        <div className="border-4 border-black bg-white rounded-3xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] xl:col-span-3 space-y-4">
          
          {/* Calendar Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h3 className="text-xl font-black text-black capitalize">
              {formattedMonthName}
            </h3>
            
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={handleToday}
                className="bg-white hover:bg-gray-50 border-2 border-black rounded-lg px-3 py-1.5 text-xs font-black shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                Hôm nay
              </button>
              <div className="flex border-2 border-black rounded-lg overflow-hidden bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-gray-50 border-r-2 border-black cursor-pointer transition-all"
                  title="Tháng trước"
                >
                  <ChevronLeft className="w-4 h-4 text-black" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-gray-50 cursor-pointer transition-all"
                  title="Tháng sau"
                >
                  <ChevronRight className="w-4 h-4 text-black" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid View */}
          <div className="border-3 border-black rounded-2xl overflow-hidden bg-white">
            
            {/* Week days header */}
            <div className="grid grid-cols-7 border-b-3 border-black bg-gray-50">
              {WEEK_DAYS.map((day, idx) => (
                <div 
                  key={day} 
                  className={`py-2 text-center text-xs font-black uppercase text-gray-800 ${
                    idx < 6 ? "border-r-2 border-black" : ""
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grid days */}
            {loadingSessions ? (
              <div className="py-32 flex flex-col items-center justify-center col-span-7">
                <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
                <p className="mt-4 font-bold text-gray-600 text-sm">Đang tải lịch học của tháng...</p>
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {daysGrid.map((cell, idx) => {
                  const cellDate = cell.date;
                  const key = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, "0")}-${String(cellDate.getDate()).padStart(2, "0")}`;
                  const daySessions = sessionsByDay[key] || [];

                  // Check if cell is today
                  const isToday = new Date().toDateString() === cellDate.toDateString();

                  // Layout indices
                  const colIdx = idx % 7;
                  const rowIdx = Math.floor(idx / 7);

                  return (
                    <div 
                      key={idx}
                      className={`min-h-[90px] md:min-h-[110px] p-1.5 flex flex-col justify-between transition-colors ${
                        cell.isCurrentMonth ? "bg-white" : "bg-gray-50/50 text-gray-400"
                      } ${
                        isToday ? "bg-amber-50/50" : ""
                      } ${
                        colIdx < 6 ? "border-r-2 border-black" : ""
                      } ${
                        rowIdx < 5 ? "border-b-2 border-black" : ""
                      }`}
                    >
                      {/* Date label */}
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] md:text-xs font-black px-1.5 py-0.5 rounded ${
                          isToday ? "bg-amber-400 text-black border border-black font-black" : ""
                        }`}>
                          {cellDate.getDate()}
                        </span>
                      </div>

                      {/* Sessions inside cell */}
                      <div className="flex-1 space-y-1 overflow-y-auto max-h-[60px] md:max-h-[80px] custom-scrollbar pr-0.5">
                        {daySessions.map((s) => {
                          let statusColor = "bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100";
                          if (s.status === "COMPLETED") {
                            statusColor = "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100";
                          } else if (s.status === "CANCELLED") {
                            statusColor = "bg-rose-50 text-rose-800 border-rose-300 line-through opacity-60 hover:bg-rose-100";
                          }
                          if (s.isMakeup) {
                            statusColor = "bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100";
                          }

                          return (
                            <div
                              key={s.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSession(s);
                              }}
                              className={`text-[8px] md:text-[10px] font-bold border rounded p-1 cursor-pointer transition-all line-clamp-1 truncate ${statusColor}`}
                              title={`${s.startTime} - ${s.class?.name}`}
                            >
                              ⏰ {s.startTime} {s.class?.name}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: SESSION DETAILS POPUP */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border-4 border-black rounded-[30px_10px_25px_10px/10px_25px_10px_30px] max-w-sm w-full p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedSession(null)}
              className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] bg-sky-100 border-2 border-black rounded px-2 py-0.5 font-black text-sky-800 uppercase tracking-wider">
                Chi tiết buổi học
              </span>
              <h4 className="text-xl font-black text-black mt-2 leading-tight">
                {selectedSession.class?.name}
              </h4>
            </div>

            <hr className="my-3 border-t-2 border-black/10 border-dashed" />

            <div className="space-y-2.5 text-xs text-gray-700 font-semibold">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <div className="font-black text-gray-900">Thời gian</div>
                  <div>
                    {new Date(selectedSession.date).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </div>
                  <div className="text-amber-700 font-bold">⏰ Giờ: {selectedSession.startTime} - {selectedSession.endTime}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
                <div>
                  <div className="font-black text-gray-900">Phòng học</div>
                  <div>{selectedSession.room || "Trực tiếp tại trung tâm"}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-purple-500 shrink-0" />
                <div>
                  <div className="font-black text-gray-900">Giáo viên</div>
                  <div>{selectedSession.teacher?.user?.name || "Chưa phân công"}</div>
                </div>
              </div>

              {selectedSession.description && (
                <div className="flex items-start gap-2 bg-gray-50 border border-black/10 rounded-lg p-2 mt-2">
                  <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-black text-gray-900 text-[10px] uppercase">Ghi chú</div>
                    <div className="text-gray-600 font-medium italic text-[11px]">{selectedSession.description}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mt-1">
                {selectedSession.status === "COMPLETED" ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-black">
                    <CheckCircle2 className="w-4 h-4" /> Đã hoàn thành học tập
                  </span>
                ) : selectedSession.status === "CANCELLED" ? (
                  <span className="flex items-center gap-1 text-rose-500 font-black">
                    <AlertCircle className="w-4 h-4" /> Đã hủy buổi học
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sky-600 font-black">
                    <RefreshCw className="w-4 h-4 animate-spin-slow" /> Đang chuẩn bị lên lịch
                  </span>
                )}
                {selectedSession.isMakeup && (
                  <span className="bg-purple-100 border border-purple-300 rounded px-1.5 py-0.5 text-[9px] font-black text-purple-700">
                    Bù
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-black/10 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 border-2 border-black bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  router.push(`/cms/sessions/${selectedSession.id}`);
                  setSelectedSession(null);
                }}
                className="px-4 py-2 border-2 border-black bg-[#baffc9] hover:bg-[#a3e9b3] rounded-lg text-xs font-black transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                📝 Điểm danh & Nhận xét tác phẩm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: STUDENT ATTENDANCE DIRECT INTEGRATION */}
      <StudentAttendanceModal
        isOpen={selectedSessionForAttendance !== null}
        onClose={() => setSelectedSessionForAttendance(null)}
        session={selectedSessionForAttendance}
        onSaveSuccess={fetchCalendarSessions}
      />

      {/* CUSTOM NOTIFICATION MODAL */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => {
          setNotification(prev => ({ ...prev, isOpen: false }));
          if (notification.onCloseCallback) notification.onCloseCallback();
        }}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onConfirm={notification.onConfirm}
      />

    </div>
  );
}

// Inline simple anim style for slow rotating icon
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin-slow {
    animation: spin-slow 8s linear infinite;
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(style);
}
