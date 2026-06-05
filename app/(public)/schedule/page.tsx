import { prisma } from "@/lib/prisma";
import { ScheduleClient } from "./components/schedule-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vẽ zì đó - Lịch lớp",
  description: "Lịch các lớp học vẽ online và offline",
};

export default async function Schedule() {
  const now = new Date();
  
  // Calculate Monday and Sunday of current week in local time
  const currentDay = now.getDay();
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Fetch this week's sessions from the database
  const sessions = await prisma.classSession.findMany({
    where: {
      date: {
        gte: monday,
        lte: sunday,
      },
      status: {
        not: "CANCELLED", // Exclude cancelled sessions on the public schedule
      },
    },
    include: {
      class: {
        include: {
          specialties: {
            select: {
              id: true,
              name: true,
            },
          },
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
    orderBy: [
      { date: "asc" },
      { startTime: "asc" },
    ],
  });

  // Convert Date objects to ISO strings for Next.js server-to-client component serialization
  const serializedSessions = sessions.map((s) => ({
    ...s,
    date: s.date.toISOString(),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  const formatLocalDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const startDateStr = formatLocalDate(monday);
  const endDateStr = formatLocalDate(sunday);

  return (
    <main className="flex flex-col items-center flex-1 text-center bg-[radial-gradient(circle_at_2px_2px,#bec7d1_1px,transparent_0)] bg-[size:24px_24px] pb-12 w-full">
      <div className="p-4 lg:p-0 container">
        <ScheduleClient
          initialSessions={serializedSessions as any}
          startDateStr={startDateStr}
          endDateStr={endDateStr}
        />
      </div>
    </main>
  );
}
