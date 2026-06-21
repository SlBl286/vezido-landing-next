import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      include: { classCategory: true },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Error fetching public courses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
