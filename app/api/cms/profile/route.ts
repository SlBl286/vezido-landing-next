import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import argon2 from "argon2";
import { saveBase64Image } from "@/lib/image-upload";

export async function GET() {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        role: true,
        teacherProfile: {
          select: {
            id: true,
            phone: true,
            bio: true,
            specialties: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    const { name, username, email, password, image, phone, bio, specialtyIds } = body;

    // Check if username is taken by another user
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId },
        },
      });
      if (existingUser) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
      }
    }

    // Check if email is taken by another user
    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId },
        },
      });
      if (existingEmail) {
        return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
      }
    }

    let imageUrl = image;
    if (imageUrl && imageUrl.startsWith("data:image/")) {
      try {
        imageUrl = await saveBase64Image(imageUrl, `profile-${username || userId}`);
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
    if (image !== undefined) userData.image = imageUrl;

    if (password) {
      userData.hashedPassword = await argon2.hash(password);
    }

    // Check if user has a teacher profile
    const teacherProfile = await prisma.teacher.findUnique({
      where: { userId },
    });

    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update User
      const u = await tx.user.update({
        where: { id: userId },
        data: userData,
      });

      // Update Teacher if profile exists
      if (teacherProfile) {
        await tx.teacher.update({
          where: { userId },
          data: {
            phone: phone !== undefined ? phone : undefined,
            bio: bio !== undefined ? bio : undefined,
            specialties: specialtyIds !== undefined ? {
              set: specialtyIds.map((sid: string) => ({ id: sid })),
            } : undefined,
          },
        });
      }

      return u;
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        image: updatedUser.image,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
