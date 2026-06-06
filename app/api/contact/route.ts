import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendNotifications } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, email, message } = body;

    if (!name?.trim() || !phone?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ họ tên, số điện thoại và nội dung tin nhắn." },
        { status: 400 }
      );
    }

    // Save to database
    const submission = await prisma.contactSubmission.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        message: message.trim(),
        status: "NEW",
      },
    });

    // Fire-and-forget notifications (email + Zalo)
    sendNotifications({ name: name.trim(), phone: phone.trim(), email: email?.trim(), message: message.trim() });

    return NextResponse.json({ success: true, id: submission.id }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/contact] Error:", error);
    return NextResponse.json({ error: "Có lỗi xảy ra, vui lòng thử lại sau." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Admin-only: list all contact submissions
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = 20;

  try {
    const [submissions, total] = await Promise.all([
      prisma.contactSubmission.findMany({
        where: status && status !== "ALL" ? { status } : undefined,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contactSubmission.count({
        where: status && status !== "ALL" ? { status } : undefined,
      }),
    ]);

    return NextResponse.json({ submissions, total, page, limit });
  } catch (error) {
    console.error("[GET /api/contact] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  // Update status or note on a submission
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID bắt buộc" }, { status: 400 });

  try {
    const body = await req.json();
    const { status, note } = body;

    const updated = await prisma.contactSubmission.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(note !== undefined ? { note } : {}),
      },
    });

    return NextResponse.json({ submission: updated });
  } catch (error) {
    console.error("[PATCH /api/contact] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID bắt buộc" }, { status: 400 });

  try {
    await prisma.contactSubmission.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/contact] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
