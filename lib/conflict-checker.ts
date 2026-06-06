import { prisma } from "./prisma";

export interface SessionConflictInput {
  date: Date | string;
  startTime: string;
  endTime: string;
  teacherId?: string | null;
  room?: string | null;
  classId?: string;
  excludeSessionId?: string;
}

export interface ConflictResult {
  conflict: boolean;
  type?: "TEACHER" | "ROOM" | "CLASS" | "SELF";
  message?: string;
}

// Helper: check if two time ranges (format "HH:mm") overlap
export function isTimeOverlapping(start1: string, end1: string, start2: string, end2: string): boolean {
  return start1 < end2 && end1 > start2;
}

// Helper: format Date object to "YYYY-MM-DD" local date representation
export function getLocalDateString(dateInput: Date | string): string {
  const d = new Date(dateInput);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Checks a batch of proposed sessions for conflicts with existing sessions in the database,
 * as well as conflicts among themselves.
 */
export async function checkSessionsConflictBatch(
  sessionsToCheck: SessionConflictInput[]
): Promise<ConflictResult> {
  if (sessionsToCheck.length === 0) {
    return { conflict: false };
  }

  // 1. Check self-overlaps within the list of proposed sessions
  for (let i = 0; i < sessionsToCheck.length; i++) {
    const s1 = sessionsToCheck[i];
    const d1Str = getLocalDateString(s1.date);

    for (let j = i + 1; j < sessionsToCheck.length; j++) {
      const s2 = sessionsToCheck[j];
      const d2Str = getLocalDateString(s2.date);

      if (d1Str === d2Str && isTimeOverlapping(s1.startTime, s1.endTime, s2.startTime, s2.endTime)) {
        // Teacher conflict in the same batch
        if (s1.teacherId && s2.teacherId && s1.teacherId === s2.teacherId) {
          return {
            conflict: true,
            type: "SELF",
            message: `Trùng lịch trong danh sách tạo mới: Giáo viên được xếp lịch dạy 2 ca chồng chéo lúc ${s1.startTime}-${s1.endTime} và ${s2.startTime}-${s2.endTime} vào ngày ${d1Str}.`,
          };
        }
        // Room conflict in the same batch
        if (s1.room && s2.room && s1.room.toLowerCase().trim() === s2.room.toLowerCase().trim()) {
          return {
            conflict: true,
            type: "SELF",
            message: `Trùng lịch trong danh sách tạo mới: Phòng/Link "${s1.room}" được xếp lịch cho 2 ca chồng chéo lúc ${s1.startTime}-${s1.endTime} và ${s2.startTime}-${s2.endTime} vào ngày ${d1Str}.`,
          };
        }
        // Class conflict in the same batch
        if (s1.classId && s2.classId && s1.classId === s2.classId) {
          return {
            conflict: true,
            type: "SELF",
            message: `Trùng lịch trong danh sách tạo mới: Lớp học có 2 buổi bị xếp trùng giờ lúc ${s1.startTime}-${s1.endTime} và ${s2.startTime}-${s2.endTime} vào ngày ${d1Str}.`,
          };
        }
      }
    }
  }

  // 2. Fetch existing sessions from database in the date range of the proposed sessions
  const dates = sessionsToCheck.map((s) => new Date(s.date));
  const minTime = Math.min(...dates.map((d) => d.getTime()));
  const maxTime = Math.max(...dates.map((d) => d.getTime()));

  const minDate = new Date(minTime);
  minDate.setHours(0, 0, 0, 0);
  const maxDate = new Date(maxTime);
  maxDate.setHours(23, 59, 59, 999);

  const excludeIds = sessionsToCheck
    .map((s) => s.excludeSessionId)
    .filter((id): id is string => !!id);

  const existingSessions = await prisma.classSession.findMany({
    where: {
      date: {
        gte: minDate,
        lte: maxDate,
      },
      id: excludeIds.length > 0 ? { notIn: excludeIds } : undefined,
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
        },
      },
      teacher: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // 3. Check overlaps between proposed sessions and existing database sessions
  for (const proposed of sessionsToCheck) {
    const propDateStr = getLocalDateString(proposed.date);

    for (const existing of existingSessions) {
      const existDateStr = getLocalDateString(existing.date);

      if (propDateStr === existDateStr && isTimeOverlapping(proposed.startTime, proposed.endTime, existing.startTime, existing.endTime)) {
        // Teacher conflict
        if (proposed.teacherId && existing.teacherId === proposed.teacherId) {
          return {
            conflict: true,
            type: "TEACHER",
            message: `Trùng lịch giáo viên: Giáo viên ${
              existing.teacher?.user?.name || "phụ trách"
            } đã có lịch dạy lớp "${existing.class.name}" vào ngày ${propDateStr} lúc ${existing.startTime} - ${existing.endTime}.`,
          };
        }

        // Room conflict
        if (
          proposed.room &&
          existing.room &&
          proposed.room.toLowerCase().trim() === existing.room.toLowerCase().trim()
        ) {
          return {
            conflict: true,
            type: "ROOM",
            message: `Trùng lịch phòng học: Phòng/Link "${existing.room}" đã bị trùng với lịch học lớp "${existing.class.name}" vào ngày ${propDateStr} lúc ${existing.startTime} - ${existing.endTime}.`,
          };
        }

        // Class conflict (ignore if we are checking session updates for the same session or creating within class,
        // but block if classId is matching and it's a different session ID)
        if (proposed.classId && existing.classId === proposed.classId && existing.id !== proposed.excludeSessionId) {
          return {
            conflict: true,
            type: "CLASS",
            message: `Trùng lịch lớp học: Lớp đã có buổi học được lên lịch vào ngày ${propDateStr} lúc ${existing.startTime} - ${existing.endTime}.`,
          };
        }
      }
    }
  }

  return { conflict: false };
}
