import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const filterLowStock = searchParams.get("lowStock") === "true";

    const supplies = await prisma.supplyItem.findMany({
      where: {
        AND: [
          search ? {
            name: { contains: search, mode: "insensitive" }
          } : {},
          category ? {
            category: category
          } : {}
        ]
      },
      orderBy: {
        name: "asc"
      }
    });

    // Filter by low stock in-memory because Prisma doesn't support field-to-field comparison natively
    const result = filterLowStock
      ? supplies.filter(item => item.quantity <= item.minQuantity)
      : supplies;

    return NextResponse.json({ supplies: result });
  } catch (error) {
    console.error("Error fetching supplies:", error);
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
    const { name, category, unit, minQuantity, initialQuantity } = body;

    if (!name || !category || !unit) {
      return NextResponse.json({ error: "Tên, Phân loại và Đơn vị không được để trống" }, { status: 400 });
    }

    // Check unique name
    const existing = await prisma.supplyItem.findUnique({
      where: { name }
    });
    if (existing) {
      return NextResponse.json({ error: "Tên vật phẩm này đã tồn tại trong kho" }, { status: 400 });
    }

    const minQtyVal = minQuantity !== undefined ? Number(minQuantity) : 5;
    const initQtyVal = initialQuantity !== undefined ? Number(initialQuantity) : 0;

    // Create item with transaction history if initial quantity > 0
    const supply = await prisma.supplyItem.create({
      data: {
        name,
        category,
        unit,
        minQuantity: minQtyVal,
        quantity: initQtyVal,
        ...(initQtyVal > 0 ? {
          transactions: {
            create: {
              type: "IMPORT",
              quantity: initQtyVal,
              purpose: "Khởi tạo số lượng kho ban đầu",
              performedBy: session.user.name || (session.user as any).username || "Admin"
            }
          }
        } : {})
      }
    });

    return NextResponse.json({ supply }, { status: 201 });
  } catch (error) {
    console.error("Error creating supply item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Supply ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { name, category, unit, minQuantity } = body;

    if (!name || !category || !unit) {
      return NextResponse.json({ error: "Tên, Phân loại và Đơn vị không được để trống" }, { status: 400 });
    }

    // Check unique name excluding this item
    const existing = await prisma.supplyItem.findFirst({
      where: {
        name,
        NOT: { id }
      }
    });
    if (existing) {
      return NextResponse.json({ error: "Tên vật phẩm này đã trùng với vật phẩm khác" }, { status: 400 });
    }

    const supply = await prisma.supplyItem.update({
      where: { id },
      data: {
        name,
        category,
        unit,
        minQuantity: minQuantity !== undefined ? Number(minQuantity) : 5
      }
    });

    return NextResponse.json({ supply });
  } catch (error) {
    console.error("Error updating supply item:", error);
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Supply ID is required" }, { status: 400 });
    }

    await prisma.supplyItem.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Supply item deleted successfully" });
  } catch (error) {
    console.error("Error deleting supply item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
