import { prisma } from "../lib/prisma";
import argon2 from "argon2";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

async function main() {
  const username = "superadmin";
  const email = "superadmin@vezido.edu.vn";
  const password = "Admin123@";
  const name = "Super Admin";

  console.log(`Bắt đầu tạo tài khoản admin mặc định...`);

  try {
    // Hash password with argon2
    const hashed = await argon2.hash(password);

    // Upsert admin user
    const admin = await prisma.user.upsert({
      where: { username },
      update: {
        name,
        email,
        hashedPassword: hashed,
        role: "ADMIN",
      },
      create: {
        name,
        username,
        email,
        hashedPassword: hashed,
        role: "ADMIN",
      },
    });

    console.log(`Đã tạo/cập nhật thành công tài khoản Admin mặc định:`);
    console.log(`- Username (Tên đăng nhập): ${admin.username}`);
    console.log(`- Email: ${admin.email}`);
    console.log(`- Mật khẩu: ${password}`);
    console.log(`- Vai trò: ${admin.role}`);

    // Create default specialties
    const defaultSpecialties = [
      "Màu nước",
      "Màu chì",
      "Sơn dầu/Acrylic",
      "Phác thảo/Chì",
      "Đất sét tạo hình",
      "Thủ công sáng tạo"
    ];

    console.log(`Bắt đầu tạo các chuyên môn mặc định...`);
    for (const specName of defaultSpecialties) {
      await prisma.specialty.upsert({
        where: { name: specName },
        update: {},
        create: { name: specName }
      });
    }
    console.log(`Đã tạo/cập nhật thành công các chuyên môn mặc định.`);
  } catch (error) {
    console.error(`Lỗi khi tạo tài khoản admin:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
