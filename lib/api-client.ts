import { 
  TeachersGetResponse, TeachersPostResponse, TeacherCreateInput, TeacherUpdateInput,
  ClassesGetResponse, ClassesPostResponse, ClassCreateInput,
  StudentsGetResponse, StudentsPostResponse, StudentEnrollInput,
  AuthSession, ProfileUpdateInput,
  SessionCreateInput, SessionUpdateInput, SessionsGetResponse, ClassSessionWithRelations,
  AttendanceSaveInput
} from "./types/api";
import { Specialty } from "./generated/prisma/client";

// Helper fetch wrapper to enforce strong types
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Lỗi hệ thống (Mã lỗi: ${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const cmsApi = {
  auth: {
    getSession: () => fetchJson<AuthSession>("/api/auth/session")
  },
  
  teachers: {
    list: () => fetchJson<TeachersGetResponse>("/api/cms/teachers"),
    
    create: (data: TeacherCreateInput) => fetchJson<TeachersPostResponse>("/api/cms/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

    update: (data: TeacherUpdateInput) => fetchJson<{ teacher: any }>("/api/cms/teachers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    
    delete: (id: string) => fetchJson<{ message: string }>(`/api/cms/teachers?id=${id}`, {
      method: "DELETE",
    }),
    getStats: (teacherId: string, startDate?: string, endDate?: string) => {
      const query = new URLSearchParams();
      if (startDate) query.append("startDate", startDate);
      if (endDate) query.append("endDate", endDate);
      return fetchJson<{
        totalSessions: number;
        regularSessions: number;
        makeupSessions: number;
        completedSessions: number;
        cancelledSessions: number;
      }>(`/api/cms/teachers/stats?teacherId=${teacherId}&${query.toString()}`);
    },
  },
  
  classes: {
    list: () => fetchJson<ClassesGetResponse>("/api/cms/classes"),
    
    listForTeacher: () => fetchJson<ClassesGetResponse>("/api/cms/teacher-classes"),
    
    create: (data: ClassCreateInput) => fetchJson<ClassesPostResponse>("/api/cms/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    
    update: (id: string, data: { name: string; schedule?: string; room?: string | null; teacherIds?: string[]; specialtyIds?: string[] }) => fetchJson<ClassesPostResponse>(`/api/cms/classes?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    
    delete: (id: string) => fetchJson<{ message: string }>(`/api/cms/classes?id=${id}`, {
      method: "DELETE",
    }),
  },
  
  sessions: {
    list: (params: { classId?: string; teacherId?: string; startDate?: string; endDate?: string }) => {
      const query = new URLSearchParams();
      if (params.classId) query.append("classId", params.classId);
      if (params.teacherId) query.append("teacherId", params.teacherId);
      if (params.startDate) query.append("startDate", params.startDate);
      if (params.endDate) query.append("endDate", params.endDate);
      return fetchJson<SessionsGetResponse>(`/api/cms/sessions?${query.toString()}`);
    },
    create: (data: SessionCreateInput) => fetchJson<any>("/api/cms/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    update: (data: SessionUpdateInput) => fetchJson<{ message: string; session: ClassSessionWithRelations }>("/api/cms/sessions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchJson<{ message: string }>(`/api/cms/sessions?id=${id}`, {
      method: "DELETE",
    }),
    getDetail: (id: string) => fetchJson<{
      session: {
        id: string;
        date: string;
        startTime: string;
        endTime: string;
        room: string;
        status: string;
        description: string;
        className: string;
        teacherId: string;
        teacherName: string;
      };
      students: {
        id: string;
        studentName: string;
        studentAge: number;
        studentCode: string;
        parentName: string;
        parentPhone: string;
        attendance: {
          status: string;
          notes: string;
        } | null;
        artwork: {
          id: string;
          title: string;
          comment: string;
          imageUrl: string;
        } | null;
      }[];
      teachersPool: { id: string; name: string }[];
    }>(`/api/cms/sessions/${id}`),
    saveDetail: (id: string, data: {
      teacherId?: string | null;
      room?: string | null;
      attendance?: { studentClassId: string; status: string; notes?: string }[];
      artworks?: { studentCode: string; imageUrl?: string; title?: string; comment?: string; isDeleted?: boolean }[];
    }) => fetchJson<{ message: string }>(`/api/cms/sessions/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  },
  
  students: {
    list: (classId: string) => fetchJson<StudentsGetResponse>(`/api/cms/students?classId=${classId}`),
    
    enroll: (data: StudentEnrollInput) => fetchJson<StudentsPostResponse>("/api/cms/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    
    delete: (id: string) => fetchJson<{ message: string }>(`/api/cms/students?id=${id}`, {
      method: "DELETE",
    }),
  },

  specialties: {
    list: () => fetchJson<{ specialties: any[] }>("/api/cms/specialties"),
    create: (data: { name: string }) => fetchJson<{ specialty: any }>("/api/cms/specialties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchJson<{ message: string }>(`/api/cms/specialties?id=${id}`, {
      method: "DELETE",
    }),
  },

  attendance: {
    get: (sessionId: string) => fetchJson<{
      attendance: {
        studentClassId: string;
        studentName: string;
        studentAge: number;
        status: string | null;
        notes: string | null;
      }[]
    }>(`/api/cms/attendance?sessionId=${sessionId}`),
    
    save: (data: AttendanceSaveInput) => fetchJson<{ message: string }>("/api/cms/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  },

  profile: {
    get: () => fetchJson<{ user: any }>("/api/cms/profile"),
    update: (data: ProfileUpdateInput) => fetchJson<{ message: string, user: any }>("/api/cms/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  },

  faqs: {
    list: (search?: string) => fetchJson<{ faqs: any[] }>(`/api/cms/faqs${search ? `?search=${encodeURIComponent(search)}` : ""}`),
    create: (data: { question: string; answer: string; category?: string }) => fetchJson<{ faq: any }>("/api/cms/faqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    update: (id: string, data: { question: string; answer: string; category?: string }) => fetchJson<{ faq: any }>(`/api/cms/faqs?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchJson<{ message: string }>(`/api/cms/faqs?id=${id}`, {
      method: "DELETE",
    }),
  },

  artworks: {
    list: (params: { studentCode?: string } = {}) => {
      const query = new URLSearchParams();
      if (params.studentCode) query.append("studentCode", params.studentCode);
      return fetchJson<{ artworks: any[] }>(`/api/cms/artworks?${query.toString()}`);
    },
    create: (data: { studentCode: string; imageUrl: string; title?: string; comment?: string; teacherName?: string; className?: string }) => fetchJson<{ artwork: any }>("/api/cms/artworks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    update: (id: string, data: { title?: string; comment?: string }) => fetchJson<{ artwork: any }>(`/api/cms/artworks?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchJson<{ message: string }>(`/api/cms/artworks?id=${id}`, {
      method: "DELETE",
    }),
  },
};
