import { Teacher, Class, StudentClass, User, Specialty, ClassSession } from "@/lib/generated/prisma/client";

// Shape of models populated with their relations by Prisma
export type TeacherWithUserAndClasses = Omit<Teacher, "createdAt" | "updatedAt"> & {
  user: Pick<User, "id" | "name" | "username" | "email" | "image" | "role"> & {
    createdAt: string;
  };
  specialties: Pick<Specialty, "id" | "name">[];
  classes: Pick<Class, "id" | "name" | "schedule">[];
};

export type ClassWithTeacherAndCount = Omit<Class, "createdAt" | "updatedAt"> & {
  teacher: (Pick<Teacher, "id"> & {
    user: Pick<User, "name">;
  }) | null;
  specialties: Pick<Specialty, "id" | "name">[];
  _count: {
    students: number;
  };
};

export type StudentRoster = Omit<StudentClass, "createdAt" | "updatedAt"> & {
  createdAt: string;
};

// NextAuth Session type
export interface AuthSession {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
    username?: string | null;
  };
  expires: string;
}

// API Endpoint Request Payload Types
export interface TeacherCreateInput {
  username: string;
  password?: string;
  name: string;
  email?: string;
  phone?: string;
  specialtyIds?: string[];
  bio?: string;
  image?: string;
  role?: string;
}

export interface TeacherUpdateInput {
  id: string;
  username?: string;
  password?: string;
  name?: string;
  email?: string;
  phone?: string;
  specialtyIds?: string[];
  bio?: string;
  image?: string;
  role?: string;
}

export interface ClassCreateInput {
  name: string;
  schedule?: string;
  room?: string;
  specialtyIds?: string[];
  teacherId?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  autoSchedule?: boolean;
  startDate?: string;
  weeksCount?: string;
}

export interface StudentEnrollInput {
  studentName: string;
  studentAge: string | number;
  parentName: string;
  parentPhone: string;
  classId: string;
}

export interface ProfileUpdateInput {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  image?: string;
  phone?: string;
  bio?: string;
  specialtyIds?: string[];
}

// API Endpoint Response Payload Types
export interface TeachersGetResponse {
  teachers: TeacherWithUserAndClasses[];
}

export interface TeachersPostResponse {
  teacher: Teacher & {
    user: Omit<User, "hashedPassword" | "emailVerified">;
  };
}

export interface ClassesGetResponse {
  classes: ClassWithTeacherAndCount[];
}

export interface ClassesPostResponse {
  class: ClassWithTeacherAndCount;
}

export interface StudentsGetResponse {
  students: StudentRoster[];
}

export interface StudentsPostResponse {
  student: StudentRoster;
}

// Session payloads and responses
export interface SessionCreateInput {
  classId: string;
  teacherId?: string | null;
  date?: string; // single
  startTime: string;
  endTime: string;
  room?: string | null;
  isMakeup?: boolean;
  description?: string | null;
  isRecurring?: boolean;
  dayOfWeek?: number; // 0-6 (0 is Sunday, 1 is Monday...)
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface SessionUpdateInput {
  id: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  room?: string | null;
  teacherId?: string | null;
  isMakeup?: boolean;
  status?: string;
  description?: string | null;
}

export type ClassSessionWithRelations = Omit<ClassSession, "date" | "createdAt" | "updatedAt"> & {
  date: string;
  createdAt: string;
  updatedAt: string;
  class: {
    id: string;
    name: string;
    specialties: Pick<Specialty, "id" | "name">[];
  };
  teacher?: {
    id: string;
    user: {
      name: string | null;
    };
  } | null;
};

export interface SessionsGetResponse {
  sessions: ClassSessionWithRelations[];
}
