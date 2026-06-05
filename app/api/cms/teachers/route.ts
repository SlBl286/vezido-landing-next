import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import argon2 from "argon2";
import { saveBase64Image } from "@/lib/image-upload";

export async function GET() {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
          },
        },
        specialties: {
          select: {
            id: true,
            name: true,
          },
        },
        classes: {
          select: {
            id: true,
            name: true,
            schedule: true,
          },
        },
      },
      orderBy: {
        user: {
          createdAt: "desc",
        },
      },
    });

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { username, password, name, email, phone, specialtyIds, bio, image, role } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: "Email is already registered" },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await argon2.hash(password);

    // Save image to file system if it is a base64 string
    let imageUrl = image || null;
    if (imageUrl && imageUrl.startsWith("data:image/")) {
      try {
        imageUrl = await saveBase64Image(imageUrl, `teacher-${username}`);
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        return NextResponse.json(
          { error: "Không thể lưu ảnh đại diện" },
          { status: 500 }
        );
      }
    }

    // Create user and teacher profile in a transaction
    const newTeacher = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          hashedPassword,
          name,
          email,
          role: role || "TEACHER",
          image: imageUrl,
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          phone,
          bio,
          specialties: {
            connect: (specialtyIds || []).map((id: string) => ({ id })),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              image: true,
              role: true,
              createdAt: true,
            },
          },
          specialties: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return teacher;
    });

    return NextResponse.json({ teacher: newTeacher }, { status: 201 });
  } catch (error) {
    console.error("Error creating teacher:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, username, password, name, email, phone, specialtyIds, bio, image, role } = body;

    if (!id) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    // Find the teacher to get user details
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Check if new username is already taken by another user
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: teacher.userId },
        },
      });
      if (existingUser) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
      }
    }

    // Check if new email is registered
    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: teacher.userId },
        },
      });
      if (existingEmail) {
        return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
      }
    }

    let imageUrl = image;
    if (imageUrl && imageUrl.startsWith("data:image/")) {
      try {
        imageUrl = await saveBase64Image(imageUrl, `teacher-${username || id}`);
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        return NextResponse.json(
          { error: "Không thể lưu ảnh đại diện" },
          { status: 500 }
        );
      }
    }

    const userData: any = {};
    if (username) userData.username = username;
    if (name !== undefined) userData.name = name;
    if (email !== undefined) userData.email = email;
    if (role) userData.role = role;
    if (image !== undefined) userData.image = imageUrl;

    if (password) {
      userData.hashedPassword = await argon2.hash(password);
    }

    // Update in transaction
    const updatedTeacher = await prisma.$transaction(async (tx) => {
      // Update User
      await tx.user.update({
        where: { id: teacher.userId },
        data: userData,
      });

      // Update Teacher profile
      const t = await tx.teacher.update({
        where: { id },
        data: {
          phone: phone !== undefined ? phone : undefined,
          bio: bio !== undefined ? bio : undefined,
          specialties: specialtyIds !== undefined ? {
            set: specialtyIds.map((sid: string) => ({ id: sid })),
          } : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              image: true,
              role: true,
              createdAt: true,
            },
          },
          specialties: {
            select: {
              id: true,
              name: true,
            },
          },
          classes: {
            select: {
              id: true,
              name: true,
              schedule: true,
            },
          },
        },
      });

      return t;
    });

    return NextResponse.json({ teacher: updatedTeacher });
  } catch (error) {
    console.error("Error updating teacher:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id"); // This is the Teacher.id

    if (!id) {
      return NextResponse.json({ error: "Teacher ID is required" }, { status: 400 });
    }

    // Find the teacher to get their userId
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Deleting the User will cascade delete the Teacher profile
    await prisma.user.delete({
      where: { id: teacher.userId },
    });

    return NextResponse.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
