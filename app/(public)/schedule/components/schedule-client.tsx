"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Specialty {
  id: string;
  name: string;
}

interface ClassSession {
  id: string;
  classId: string;
  teacherId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  room: string | null;
  isMakeup: boolean;
  description: string | null;
  status: string;
  class: {
    id: string;
    name: string;
    specialties: Specialty[];
  };
  teacher?: {
    id: string;
    user: {
      name: string | null;
    };
  } | null;
}

interface ScheduleClientProps {
  initialSessions: ClassSession[];
  startDateStr: string;
  endDateStr: string;
}

export function ScheduleClient({ initialSessions, startDateStr, endDateStr }: ScheduleClientProps) {
  const [ageFilter, setAgeFilter] = useState<string>("ALL");

  const matchesAgeFilter = (className: string, filter: string) => {
    if (filter === "ALL") return true;
    if (filter === "4-6") {
      return className.includes("4-6") || className.includes("4 - 6") || className.toLowerCase().includes("mầm non");
    }
    if (filter === "7-9") {
      return className.includes("7-9") || className.includes("7 - 9") || className.toLowerCase().includes("thiếu nhi");
    }
    if (filter === "10-12") {
      return className.includes("10-12") || className.includes("10 - 12") || className.toLowerCase().includes("thiếu niên");
    }
    return true;
  };

  const filteredSessions = initialSessions.filter((s) =>
    matchesAgeFilter(s.class.name, ageFilter)
  );

  // Helper to get neobrutalist theme styling based on specialty tags
  const getSessionStyle = (specialties: Specialty[]) => {
    const specNames = specialties.map((s) => s.name.toLowerCase());
    if (
      specNames.some(
        (name) =>
          name.includes("chuyên sâu") ||
          name.includes("sơn dầu") ||
          name.includes("acrylic")
      )
    ) {
      return {
        bg: "bg-red-500/10 border-red-500",
        bar: "bg-red-500",
        label: "Chuyên sâu",
      };
    }
    if (
      specNames.some(
        (name) =>
          name.includes("nâng cao") ||
          name.includes("màu nước") ||
          name.includes("chì")
      )
    ) {
      return {
        bg: "bg-amber-400/10 border-amber-400",
        bar: "bg-amber-400",
        label: "Nâng cao",
      };
    }
    return {
      bg: "bg-blue-500/10 border-blue-500",
      bar: "bg-blue-500",
      label: "Cơ bản",
    };
  };

  // Group sessions by day of week
  // 1: Monday, 2: Tuesday, ..., 6: Saturday, 0: Sunday
  const daysOfWeek = [
    { label: "Thứ 2", value: 1 },
    { label: "Thứ 3", value: 2 },
    { label: "Thứ 4", value: 3 },
    { label: "Thứ 5", value: 4 },
    { label: "Thứ 6", value: 5 },
    { label: "Thứ 7", value: 6 },
    { label: "Chủ nhật", value: 0 },
  ];

  const getSessionsForDay = (dayValue: number) => {
    return filteredSessions.filter((s) => {
      const d = new Date(s.date);
      return d.getDay() === dayValue;
    });
  };

  return (
    <div className="w-full">
      <div className="flex flex-col w-full bg-transparent justify-center my-10 gap-y-2">
        <h1 className="text-3xl lg:text-5xl font-black text-sky-600 uppercase tracking-tight">
          Lịch các lớp theo tuần 🎨
        </h1>
        <p className="ml-4 font-bold text-gray-500">
          Từ {startDateStr} đến {endDateStr}
        </p>
      </div>

      {/* Filter panel */}
      <div className="w-full justify-between gap-y-4 px-6 py-5 border-4 border-black rounded-[30px_10px_25px_15px/15px_25px_10px_30px] flex flex-col lg:flex-row mx-auto container bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col items-start gap-y-2 w-full">
          <p className="font-black text-sm uppercase text-gray-800 tracking-wider">Lọc theo độ tuổi</p>
          <div className="flex gap-x-2.5 flex-wrap w-full gap-y-2.5">
            <Button
              onClick={() => setAgeFilter("ALL")}
              variant="outline"
              className={`px-5 py-2.5 rounded-xl border-3 font-bold text-sm transition-all shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 ${
                ageFilter === "ALL"
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-700 border-black hover:bg-gray-50"
              }`}
            >
              Tất cả
            </Button>
            <Button
              onClick={() => setAgeFilter("4-6")}
              variant="outline"
              className={`px-5 py-2.5 rounded-xl border-3 font-bold text-sm transition-all shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 ${
                ageFilter === "4-6"
                  ? "bg-[#bae1ff] text-black border-black"
                  : "bg-white text-gray-700 border-black hover:bg-[#bae1ff]/10"
              }`}
            >
              4-6 tuổi
            </Button>
            <Button
              onClick={() => setAgeFilter("7-9")}
              variant="outline"
              className={`px-5 py-2.5 rounded-xl border-3 font-bold text-sm transition-all shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 ${
                ageFilter === "7-9"
                  ? "bg-[#baffc9] text-black border-black"
                  : "bg-white text-gray-700 border-black hover:bg-[#baffc9]/10"
              }`}
            >
              7-9 tuổi
            </Button>
            <Button
              onClick={() => setAgeFilter("10-12")}
              variant="outline"
              className={`px-5 py-2.5 rounded-xl border-3 font-bold text-sm transition-all shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 ${
                ageFilter === "10-12"
                  ? "bg-[#ffaaa6] text-black border-black"
                  : "bg-white text-gray-700 border-black hover:bg-[#ffaaa6]/10"
              }`}
            >
              10-12 tuổi
            </Button>
          </div>
        </div>

        {/* Legend panel */}
        <div className="flex items-center lg:justify-end gap-x-6 w-full flex-wrap gap-y-2 text-sm font-bold">
          <div className="flex items-center gap-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-lg border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]"></div>
            <span>Vẽ màu cơ bản</span>
          </div>
          <div className="flex items-center gap-x-2">
            <div className="w-4 h-4 bg-amber-400 rounded-lg border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]"></div>
            <span>Vẽ màu nâng cao</span>
          </div>
          <div className="flex items-center gap-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-lg border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]"></div>
            <span>Vẽ màu chuyên sâu</span>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6 my-10 w-full mx-auto container px-4 lg:px-0">
        {daysOfWeek.map((day, idx) => {
          const daySessions = getSessionsForDay(day.value);
          const isToday = new Date().getDay() === day.value;

          return (
            <div key={day.value} className="flex flex-col gap-4 min-w-[150px]">
              {/* Day Header */}
              <div
                className={`text-center p-3 font-black rounded-xl border-3 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] -rotate-1 ${
                  isToday
                    ? "bg-amber-300 text-black"
                    : "bg-white text-gray-900"
                }`}
              >
                {day.label}
              </div>

              {/* Sessions stack */}
              <div className="flex flex-col gap-4 flex-1 min-h-[100px]">
                {daySessions.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-6 border-3 border-dashed border-gray-300 rounded-2xl bg-gray-50 text-xs font-bold text-gray-400 italic">
                    Không có lớp học
                  </div>
                ) : (
                  daySessions.map((session) => {
                    const style = getSessionStyle(session.class.specialties);
                    
                    return (
                      <div
                        key={session.id}
                        className={`p-4 rounded-2xl border-3 border-black bg-white relative group hover:scale-[1.03] active:scale-100 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] text-left flex flex-col justify-between`}
                      >
                        <div className="absolute top-0 left-0 w-full h-2 rounded-t-xl border-b-3 border-black bg-black -mt-0.5 overflow-hidden">
                          <div className={`w-full h-full ${style.bar}`}></div>
                        </div>

                        <div className="pt-2">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <span className="text-[11px] font-black text-black tracking-wide uppercase">
                              ⏰ {session.startTime} - {session.endTime}
                            </span>
                            {session.isMakeup && (
                              <span className="bg-purple-100 border-2 border-black rounded px-1 text-[9px] font-black text-purple-900 shadow-[1px_1px_0px_rgba(0,0,0,1)] animate-pulse uppercase">
                                Bù 🔄
                              </span>
                            )}
                          </div>

                          <h4 className="font-black text-sm text-black mt-2 leading-tight">
                            {session.class.name}
                          </h4>
                        </div>

                        <div className="mt-4 pt-3 border-t-2 border-black/10 text-[11px] font-bold text-gray-600 space-y-1">
                          <div>
                            👩‍🏫 GV: <span className="text-gray-900">{session.teacher?.user?.name || "Chưa phân công"}</span>
                          </div>
                          <div>
                            📍 Phòng: <span className="text-gray-900">{session.room || "Tại trung tâm"}</span>
                          </div>
                          {session.description && (
                            <div className="text-gray-500 italic text-[10px] line-clamp-2">
                              📝 {session.description}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
