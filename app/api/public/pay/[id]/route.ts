import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const studentClass = await prisma.studentClass.findUnique({
      where: { id },
      include: {
        class: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!studentClass) {
      return NextResponse.json({ error: "Không tìm thấy thông tin đăng ký học viên" }, { status: 404 });
    }

    return NextResponse.json({
      id: studentClass.id,
      studentName: studentClass.studentName,
      studentCode: studentClass.studentCode,
      parentName: studentClass.parentName,
      className: studentClass.class.name,
      courseTitle: studentClass.class.course?.title || null,
      courseFee: (parseInt(studentClass.class.course?.duration || "0", 10) || 0) * (studentClass.class.course?.fee || 0),
      isPaid: studentClass.isPaid,
      amountPaid: studentClass.amountPaid,
      discountCode: studentClass.discountCode,
      paymentDate: studentClass.paymentDate,
    });
  } catch (error) {
    console.error("Error fetching public payment details:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { amountPaid, discountCode } = body;

    const studentClass = await prisma.studentClass.findUnique({
      where: { id },
    });

    if (!studentClass) {
      return NextResponse.json({ error: "Không tìm thấy học viên" }, { status: 404 });
    }

    const updated = await prisma.studentClass.update({
      where: { id },
      data: {
        isPaid: true,
        amountPaid: amountPaid ? Number(amountPaid) : 0,
        discountCode: discountCode || null,
        paymentDate: new Date(),
      },
    });

    if (discountCode) {
      const codes = discountCode.split(",").map((c: string) => c.trim().toUpperCase());
      await prisma.promotion.updateMany({
        where: { code: { in: codes } },
        data: { usedCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ student: updated });
  } catch (error) {
    console.error("Error updating public payment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
