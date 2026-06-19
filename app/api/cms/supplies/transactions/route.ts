import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { saveBase64File } from "@/lib/image-upload";

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
    const transactions = await prisma.supplyTransaction.findMany({
      include: {
        item: {
          select: {
            name: true,
            unit: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        date: "desc"
      }
    });

    const mappedTransactions = transactions.map(tx => ({
      ...tx,
      item: tx.item ? {
        ...tx.item,
        category: tx.item.category?.name || "Chưa phân loại"
      } : null
    }));

    return NextResponse.json({ transactions: mappedTransactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { itemId, type, quantity, pricePerUnit, purpose, invoices } = body;

    if (!itemId || !type || !quantity) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ thông tin: Vật phẩm, Loại giao dịch và Số lượng" }, { status: 400 });
    }

    const qtyVal = Number(quantity);
    if (qtyVal <= 0) {
      return NextResponse.json({ error: "Số lượng nhập xuất phải lớn hơn 0" }, { status: 400 });
    }

    if (type !== "IMPORT" && type !== "EXPORT") {
      return NextResponse.json({ error: "Loại giao dịch không hợp lệ" }, { status: 400 });
    }

    // Teachers are blocked from IMPORT
    if (type === "IMPORT" && role !== "ADMIN") {
      return NextResponse.json({ error: "Chỉ Admin mới có quyền thực hiện nhập kho" }, { status: 403 });
    }

    const performer = session.user.name || (session.user as any).username || "CMS User";

    // Save invoices if IMPORT and invoices are provided
    const savedInvoices: string[] = [];
    if (type === "IMPORT" && invoices && Array.isArray(invoices)) {
      for (let i = 0; i < invoices.length; i++) {
        const fileData = invoices[i];
        try {
          const savedPath = await saveBase64File(fileData, `invoice-${itemId}-${i}`);
          savedInvoices.push(savedPath);
        } catch (uploadError) {
          console.error("Error saving invoice upload:", uploadError);
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.supplyItem.findUnique({
        where: { id: itemId }
      });

      if (!item) {
        throw new Error("Vật phẩm không tồn tại trong kho");
      }

      let newQuantity = item.quantity;

      if (type === "IMPORT") {
        newQuantity += qtyVal;
      } else {
        // EXPORT
        if (item.quantity < qtyVal) {
          throw new Error(`Số lượng trong kho không đủ để xuất (Tồn kho hiện tại: ${item.quantity} ${item.unit})`);
        }
        newQuantity -= qtyVal;
      }

      await tx.supplyItem.update({
        where: { id: itemId },
        data: { quantity: newQuantity }
      });

      const price = pricePerUnit !== undefined && pricePerUnit !== null ? Number(pricePerUnit) : null;
      const total = price !== null ? price * qtyVal : null;

      const transaction = await tx.supplyTransaction.create({
        data: {
          itemId,
          type,
          quantity: qtyVal,
          pricePerUnit: price,
          totalCost: total,
          purpose: purpose || "",
          performedBy: performer,
          invoices: savedInvoices
        }
      });

      return transaction;
    });

    return NextResponse.json({ transaction: result }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating supply transaction:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
