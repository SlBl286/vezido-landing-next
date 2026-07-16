import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { saveBase64Image } from "@/lib/image-upload";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentCode = searchParams.get("studentCode");
  const publicParam = searchParams.get("public");

  // Public gallery endpoint (no auth required)
  if (publicParam === "true") {
    try {
      const artworks = await prisma.studentArtwork.findMany({
        where: { isPublic: true },
        orderBy: { date: "desc" }
      });
      const artworksWithNames = await Promise.all(artworks.map(async (art) => {
        const student = await prisma.studentClass.findFirst({
          where: { studentCode: art.studentCode },
          select: { studentName: true }
        });
        return {
          ...art,
          studentName: student?.studentName || "Học viên"
        };
      }));
      return NextResponse.json({ artworks: artworksWithNames });
    } catch (error) {
      console.error("Error fetching public artworks:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }

  // If no studentCode is provided, require authenticated ADMIN or TEACHER session
  if (!studentCode) {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "ADMIN" && role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
      const artworks = await prisma.studentArtwork.findMany({
        orderBy: { date: "desc" }
      });
      return NextResponse.json({ artworks });
    } catch (error) {
      console.error("Error fetching all artworks:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }

  // If studentCode is provided, allow public access (for parent portfolio tracker)
  try {
    const artworks = await prisma.studentArtwork.findMany({
      where: { studentCode },
      orderBy: { date: "desc" }
    });

    // Fetch student profile, classes, and attendance stats across all enrollments
    const enrollments = await prisma.studentClass.findMany({
      where: { studentCode },
      include: {
        class: {
          include: {
            teachers: {
              include: {
                user: {
                  select: { name: true }
                }
              }
            }
          }
        },
        attendance: true
      }
    });

    if (enrollments.length === 0) {
      return NextResponse.json({ error: "Mã học viên không tồn tại" }, { status: 404 });
    }

    // Extract student basic details (use the first enrollment as source)
    const base = enrollments[0];
    
    // Extract enrolled classes
    const classes = enrollments.filter(e => e.class).map(e => ({
      id: e.class!.id,
      name: e.class!.name,
      schedule: e.class!.schedule || "Chưa xếp lịch",
      room: e.class!.room || "Trực tiếp tại trung tâm",
      teacherName: e.class!.teachers && e.class!.teachers.length > 0
        ? e.class!.teachers.map(t => t.user.name || "Giáo viên").join(", ")
        : "Chưa phân công"
    }));

    // Calculate attendance totals
    let total = 0;
    let present = 0;
    let absent = 0;
    let late = 0;

    enrollments.forEach(e => {
      e.attendance.forEach(att => {
        total++;
        if (att.status === "PRESENT") present++;
        else if (att.status === "ABSENT") absent++;
        else if (att.status === "LATE") late++;
      });
    });

    const studentInfo = {
      studentCode,
      studentName: base.studentName,
      studentAge: base.studentAge,
      parentName: base.parentName,
      parentPhone: base.parentPhone,
      classes,
      attendance: {
        total,
        present,
        absent,
        late
      }
    };

    return NextResponse.json({ artworks, student: studentInfo });
  } catch (error) {
    console.error("Error fetching student artworks:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { studentCode, imageUrl, title, comment, teacherName, className, isPublic } = body;

    if (!studentCode || !imageUrl) {
      return NextResponse.json({ error: "Mã học sinh và hình ảnh tranh là bắt buộc" }, { status: 400 });
    }

    // Save uploaded base64 image if applicable
    let finalImageUrl = imageUrl;
    try {
      finalImageUrl = await saveBase64Image(imageUrl, "artwork");
    } catch (uploadError) {
      console.error("Error saving artwork base64 image:", uploadError);
      return NextResponse.json({ error: "Lỗi lưu file ảnh tranh vẽ" }, { status: 400 });
    }

    const defaultTeacherName = session.user.name || "Giáo viên";

    const artwork = await prisma.studentArtwork.create({
      data: {
        studentCode,
        imageUrl: finalImageUrl,
        title: title || "Tác phẩm chưa đặt tên",
        comment: comment || "",
        teacherName: teacherName || defaultTeacherName,
        className: className || "Lớp vẽ",
        isPublic: !!isPublic
      }
    });

    return NextResponse.json({ artwork }, { status: 201 });
  } catch (error) {
    console.error("Error creating student artwork:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Artwork ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { title, comment, isPublic } = body;

    const artwork = await prisma.studentArtwork.update({
      where: { id },
      data: {
        title,
        comment,
        isPublic: isPublic !== undefined ? !!isPublic : undefined
      }
    });

    return NextResponse.json({ artwork });
  } catch (error) {
    console.error("Error updating student artwork:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Artwork ID is required" }, { status: 400 });
    }

    await prisma.studentArtwork.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Artwork deleted successfully" });
  } catch (error) {
    console.error("Error deleting student artwork:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
