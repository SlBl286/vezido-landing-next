"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Loader2, Ticket, TrendingUp, DollarSign, Calendar, RefreshCcw, Printer, Undo, Search, X, Edit2, Trash2, Plus, Percent, CreditCard, PieChart, FileSpreadsheet } from "lucide-react";
import { cmsApi } from "@/lib/api-client";
import { NotificationModal } from "@/app/cms/components/modals/NotificationModal";
import * as XLSX from "xlsx-js-style";

export default function CMSInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalRevenue: 0,
    totalExpense: 0,
    netProfit: 0,
    totalInvoices: 0,
    courses: [],
    expenseCategories: [],
    months: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"REVENUE" | "EXPENSE">("REVENUE");

  // Expense modal states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "Vận hành",
    date: new Date().toISOString().split("T")[0],
    description: "",
    invoices: [] as string[]
  });
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleViewInvoiceImage = (url: string) => {
    if (url.toLowerCase().endsWith(".pdf")) {
      window.open(url, "_blank");
    } else {
      setPreviewImage(url);
    }
  };

  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info" | "confirm";
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showNotification = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "confirm",
    onConfirm?: () => void
  ) => {
    setNotification({ isOpen: true, title, message, type, onConfirm });
  };

  const fetchSession = async () => {
    try {
      const data = await cmsApi.auth.getSession();
      setSession(data);
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  };

  const fetchInvoicesData = async () => {
    setLoading(true);
    try {
      const data = await cmsApi.invoices.list();
      setInvoices(data.invoices || []);
      setExpenses(data.expenses || []);
      setStats(data.stats || { totalRevenue: 0, totalExpense: 0, netProfit: 0, totalInvoices: 0, courses: [], expenseCategories: [], months: [] });
    } catch (err: any) {
      showNotification("Lỗi tải dữ liệu", err.message || "Không thể tải báo cáo doanh thu & chi tiêu.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchInvoicesData();
  }, []);

  const handleRefund = (id: string, name: string) => {
    showNotification(
      "Xác nhận Hủy đóng học phí",
      `Bạn có chắc chắn muốn hoàn tác thanh toán của bé "${name}"? Trạng thái sẽ được chuyển về "Chưa đóng học phí" và số tiền đóng sẽ bị xóa khỏi doanh thu.`,
      "confirm",
      async () => {
        try {
          await cmsApi.students.updatePayment(id, {
            isPaid: false,
            amountPaid: null,
            discountCode: null,
            paymentDate: null,
          });
          showNotification("Thành công 💸", "Đã hoàn tác trạng thái đóng học phí của học sinh.", "success");
          fetchInvoicesData();
        } catch (err: any) {
          showNotification("Lỗi", err.message || "Hoàn tác thanh toán thất bại.", "error");
        }
      }
    );
  };

  // Expense CRUD handlers
  const handleOpenAddExpense = () => {
    setSelectedExpense(null);
    setExpenseForm({
      title: "",
      amount: "",
      category: "Vận hành",
      date: new Date().toISOString().split("T")[0],
      description: "",
      invoices: []
    });
    setExpenseError("");
    setShowExpenseModal(true);
  };

  const handleOpenEditExpense = (exp: any) => {
    setSelectedExpense(exp);
    setExpenseForm({
      title: exp.title,
      amount: String(exp.amount),
      category: exp.category || "Vận hành",
      date: exp.date ? new Date(exp.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      description: exp.description || "",
      invoices: exp.invoices || []
    });
    setExpenseError("");
    setShowExpenseModal(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title.trim() || !expenseForm.amount) {
      setExpenseError("Vui lòng nhập tên khoản chi và số tiền");
      return;
    }
    setSubmittingExpense(true);
    setExpenseError("");

    const payload = {
      title: expenseForm.title.trim(),
      amount: Number(expenseForm.amount),
      category: expenseForm.category,
      date: new Date(expenseForm.date).toISOString(),
      description: expenseForm.description.trim() || null,
      invoices: expenseForm.invoices
    };

    try {
      if (selectedExpense) {
        await cmsApi.expenses.update(selectedExpense.id, payload);
        showNotification("Thành công 🎉", "Cập nhật chi tiêu thành công", "success");
      } else {
        await cmsApi.expenses.create(payload);
        showNotification("Thành công 💸", "Ghi nhận khoản chi tiêu mới thành công", "success");
      }
      setShowExpenseModal(false);
      fetchInvoicesData();
    } catch (err: any) {
      setExpenseError(err.message || "Lỗi khi lưu thông tin chi tiêu");
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = (id: string, title: string) => {
    showNotification(
      "Xác nhận xóa chi tiêu 🗑️",
      `Bạn có chắc chắn muốn xóa khoản chi tiêu "${title}"? Dữ liệu này sẽ bị xóa khỏi tất cả báo cáo tài chính.`,
      "confirm",
      async () => {
        try {
          await cmsApi.expenses.delete(id);
          showNotification("Thành công", "Đã xóa khoản chi tiêu thành công", "success");
          fetchInvoicesData();
        } catch (err: any) {
          showNotification("Lỗi", err.message || "Không thể xóa khoản chi tiêu", "error");
        }
      }
    );
  };

  const handleExportExcel = () => {
    try {
      // Helper to set column auto-widths
      const autoFitColumns = (worksheet: any, rows: any[]) => {
        if (rows.length === 0) return;
        const keys = Object.keys(rows[0]);
        worksheet['!cols'] = keys.map(key => {
          let maxLen = key.toString().length;
          rows.forEach(row => {
            const val = row[key];
            if (val !== undefined && val !== null) {
              const len = val.toString().length;
              if (len > maxLen) maxLen = len;
            }
          });
          return { wch: Math.min(Math.max(maxLen + 3, 12), 40) }; // min width 12, max width 40
        });
      };

      // Helper to apply currency format (#,##0 "đ")
      const formatCurrencyColumn = (worksheet: any, colLetter: string, startRow: number, endRow: number) => {
        for (let r = startRow; r <= endRow; r++) {
          const cellRef = `${colLetter}${r}`;
          if (worksheet[cellRef]) {
            worksheet[cellRef].z = '#,##0" đ"';
          }
        }
      };

      // Borders config
      const borderThin = {
        top: { style: "thin", color: { rgb: "CCCCCC" } },
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
        left: { style: "thin", color: { rgb: "E2E8F0" } },
        right: { style: "thin", color: { rgb: "E2E8F0" } }
      };

      const borderBlackThin = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      };

      // Style helper for Data Sheets
      const styleJsonSheet = (worksheet: any, headerFillColor: string) => {
        if (!worksheet['!ref']) return;
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        
        for (let R = range.s.r; R <= range.e.r; R++) {
          for (let C = range.s.c; C <= range.e.c; C++) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = worksheet[cellRef];
            if (!cell) continue;

            if (R === 0) {
              // Header Row
              cell.s = {
                font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "000000" } },
                fill: { fgColor: { rgb: headerFillColor } }, // e.g. "A8E6CF"
                alignment: { horizontal: "center", vertical: "center", wrapText: true },
                border: {
                  top: { style: "medium", color: { rgb: "000000" } },
                  bottom: { style: "medium", color: { rgb: "000000" } },
                  left: { style: "thin", color: { rgb: "000000" } },
                  right: { style: "thin", color: { rgb: "000000" } }
                }
              };
            } else {
              // Data Row
              const isNumeric = cell.t === 'n' || (cell.z && cell.z.includes('đ'));
              cell.s = {
                font: { name: "Segoe UI", sz: 10, color: { rgb: "333333" } },
                alignment: { 
                  horizontal: isNumeric ? "right" : (cell.v?.toString().length < 15 ? "center" : "left"),
                  vertical: "center" 
                },
                border: borderThin
              };
            }
          }
        }
      };

      // 1. Prepare Revenue Data
      const revenueRows = invoices.map(inv => ({
        "Mã học sinh": inv.studentCode || "",
        "Tên học sinh": inv.studentName || "",
        "Phụ huynh": inv.parentName || "",
        "Số điện thoại PH": inv.parentPhone || "",
        "Lớp học": inv.className || "",
        "Khóa học": inv.courseTitle || "",
        "Số tiền nộp (VNĐ)": inv.amountPaid || 0,
        "Phương thức": inv.paymentMethod === "TRANSFER" ? "Chuyển khoản" : 
                       inv.paymentMethod === "CASH" ? "Tiền mặt" : "Trực tuyến",
        "Mã ưu đãi": inv.discountCode || "Không có",
        "Ngày thanh toán": inv.paymentDate ? new Date(inv.paymentDate).toLocaleString("vi-VN") : "N/A"
      }));

      // 2. Prepare Expense Data
      const expenseRows = expenses.map(exp => ({
        "Nội dung khoản chi": exp.title || "",
        "Loại chi phí": exp.category || "",
        "Số tiền chi (VNĐ)": exp.amount || 0,
        "Ngày chi": exp.date ? new Date(exp.date).toLocaleDateString("vi-VN") : "N/A",
        "Mô tả / Chi tiết": exp.description || "",
        "Loại ghi nhận": exp.isReadOnly ? "Tự động" : "Thủ công"
      }));

      const revLen = Math.max(2, revenueRows.length + 1);
      const expLen = Math.max(2, expenseRows.length + 1);

      // 3. Create Summary Data
      const summaryData = [
        ["BÁO CÁO TÀI CHÍNH TỔNG HỢP - VẼ ZÌ ĐÓ STUDIO"],
        [`Ngày xuất báo cáo: ${new Date().toLocaleString("vi-VN")}`],
        [],
        ["Chỉ tiêu", "Giá trị (VNĐ)", "Mô tả"],
        ["Tổng Doanh Thu Học Phí", { f: `SUM('Doanh thu học phí'!G2:G${revLen})` }, "Tổng số tiền học phí thực tế đã thu nhận"],
        ["Tổng Chi Tiêu Thực Tế", { f: `SUM('Nhật ký chi tiêu'!C2:C${expLen})` }, "Tổng chi phí vận hành, lương, họa cụ, v.v."],
        ["Lợi Nhuận Thực Tế (Lãi/Lỗ)", { f: "B5-B6" }, "Hiệu số giữa Doanh thu và Chi phí"],
        [],
        ["Cơ cấu doanh thu theo phương thức thanh toán:"],
        ["Phương thức", "Số tiền (VNĐ)"],
        ["Chuyển khoản", { f: `SUMIF('Doanh thu học phí'!H2:H${revLen}, "Chuyển khoản", 'Doanh thu học phí'!G2:G${revLen})` }],
        ["Tiền mặt", { f: `SUMIF('Doanh thu học phí'!H2:H${revLen}, "Tiền mặt", 'Doanh thu học phí'!G2:G${revLen})` }],
        ["Trực tuyến", { f: `SUMIF('Doanh thu học phí'!H2:H${revLen}, "Trực tuyến", 'Doanh thu học phí'!G2:G${revLen})` }],
      ];

      // 4. Create Workbook & Sheets
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Summary Sheet
      const worksheetSummary = XLSX.utils.aoa_to_sheet(summaryData);
      worksheetSummary['!cols'] = [
        { wch: 35 }, // Col A width
        { wch: 20 }, // Col B width
        { wch: 45 }  // Col C width
      ];
      // Format currency fields in Summary Sheet
      ["B5", "B6", "B7", "B11", "B12", "B13"].forEach(cellRef => {
        if (worksheetSummary[cellRef]) {
          worksheetSummary[cellRef].z = '#,##0" đ"';
          worksheetSummary[cellRef].t = 'n';
        }
      });

      // Merge header title A1:C1
      worksheetSummary['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }
      ];

      // Style Summary Sheet cells
      const rangeSum = XLSX.utils.decode_range(worksheetSummary['!ref'] || "A1:C13");
      for (let R = rangeSum.s.r; R <= rangeSum.e.r; R++) {
        for (let C = rangeSum.s.c; C <= rangeSum.e.c; C++) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = worksheetSummary[cellRef];
          if (!cell) continue;

          if (R === 0) {
            // Main title style
            cell.s = {
              font: { name: "Segoe UI", sz: 14, bold: true, color: { rgb: "000000" } },
              alignment: { horizontal: "left", vertical: "center" }
            };
          } else if (R === 1) {
            // Date description style
            cell.s = {
              font: { name: "Segoe UI", sz: 9.5, italic: true, color: { rgb: "666666" } }
            };
          } else if (R === 3) {
            // Main table header style
            cell.s = {
              font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "000000" } },
              fill: { fgColor: { rgb: "FFD275" } }, // Yellow/Gold
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "medium", color: { rgb: "000000" } },
                bottom: { style: "medium", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
              }
            };
          } else if (R === 4) {
            // Total Revenue (Green highlighting)
            cell.s = {
              font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "1B5E20" } },
              fill: { fgColor: { rgb: "E8F5E9" } }, // Emerald-50
              border: borderBlackThin,
              alignment: { horizontal: C === 1 ? "right" : "left", vertical: "center" }
            };
          } else if (R === 5) {
            // Total Expenditure (Red highlighting)
            cell.s = {
              font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "B71C1C" } },
              fill: { fgColor: { rgb: "FFEBEE" } }, // Rose-50
              border: borderBlackThin,
              alignment: { horizontal: C === 1 ? "right" : "left", vertical: "center" }
            };
          } else if (R === 6) {
            // Net Profit (Blue highlighting & Double bottom border)
            cell.s = {
              font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "0D47A1" } },
              fill: { fgColor: { rgb: "E3F2FD" } }, // Blue-50
              border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "double", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
              },
              alignment: { horizontal: C === 1 ? "right" : "left", vertical: "center" }
            };
          } else if (R === 8) {
            // Subtitle
            cell.s = {
              font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "000000" } }
            };
          } else if (R === 9) {
            // Sub-table headers
            cell.s = {
              font: { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "000000" } },
              fill: { fgColor: { rgb: "BAE1FF" } }, // Light Blue
              alignment: { horizontal: "center", vertical: "center" },
              border: borderBlackThin
            };
          } else if (R >= 10 && R <= 12) {
            // Payment breakdown rows
            cell.s = {
              font: { name: "Segoe UI", sz: 10, color: { rgb: "333333" } },
              border: borderBlackThin,
              alignment: { horizontal: C === 1 ? "right" : "left", vertical: "center" }
            };
          }
        }
      }

      XLSX.utils.book_append_sheet(workbook, worksheetSummary, "Tổng hợp tài chính");
      
      // Sheet 2: Revenue Sheet
      const worksheetRevenue = XLSX.utils.json_to_sheet(revenueRows);
      autoFitColumns(worksheetRevenue, revenueRows);
      formatCurrencyColumn(worksheetRevenue, "G", 2, revenueRows.length + 1);
      styleJsonSheet(worksheetRevenue, "A8E6CF"); // Mint Green headers
      XLSX.utils.book_append_sheet(workbook, worksheetRevenue, "Doanh thu học phí");

      // Sheet 3: Expense Sheet
      const worksheetExpense = XLSX.utils.json_to_sheet(expenseRows);
      autoFitColumns(worksheetExpense, expenseRows);
      formatCurrencyColumn(worksheetExpense, "C", 2, expenseRows.length + 1);
      styleJsonSheet(worksheetExpense, "FFAAA6"); // Light Pink/Rose headers
      XLSX.utils.book_append_sheet(workbook, worksheetExpense, "Nhật ký chi tiêu");

      // 5. Write Excel File
      XLSX.writeFile(workbook, `Bao_cao_thu_chi_Vezido_${new Date().toISOString().split("T")[0]}.xlsx`);
      showNotification("Thành công 🎉", "Xuất file Excel báo cáo thu chi thành công.", "success");
    } catch (err: any) {
      showNotification("Lỗi xuất file", err.message || "Không thể xuất file Excel.", "error");
    }
  };

  const isAdmin = session?.user?.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="border-4 border-black bg-white rounded-3xl p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto my-12">
        <span className="text-6xl mb-4 block">🚫</span>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h1>
        <p className="text-gray-600">Trang này chỉ dành riêng cho Quản trị viên (Super Admin).</p>
      </div>
    );
  }

  if (loading && invoices.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
          <p className="font-extrabold text-black">Đang tải báo cáo doanh thu & chi tiêu...</p>
        </div>
      </div>
    );
  }

  // Filters
  const filteredInvoices = invoices.filter((inv) => {
    const term = searchQuery.toLowerCase();
    return (
      inv.studentName.toLowerCase().includes(term) ||
      (inv.studentCode && inv.studentCode.toLowerCase().includes(term)) ||
      (inv.parentPhone && inv.parentPhone.includes(term)) ||
      (inv.className && inv.className.toLowerCase().includes(term))
    );
  });

  const filteredExpenses = expenses.filter((exp) => {
    const term = searchQuery.toLowerCase();
    return (
      exp.title.toLowerCase().includes(term) ||
      exp.category.toLowerCase().includes(term) ||
      (exp.description && exp.description.toLowerCase().includes(term))
    );
  });

  // Scale value for monthly profit chart
  const maxVal = stats.months.reduce((max: number, m: any) => Math.max(max, m.revenue, m.expense), 0) || 1;

  const totalExpenseSum = stats.totalExpense || 0;
  const totalRevenueSum = stats.totalRevenue || 0;
  const netProfitSum = stats.netProfit || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Neobrutalism Header */}
      <div className="bg-[#ffd275] border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-black tracking-tight flex items-center gap-2.5">
            🧾 HÓA ĐƠN & BÁO CÁO TÀI CHÍNH
          </h2>
          <p className="text-gray-800 font-bold text-sm mt-1">
            Theo dõi dòng tiền học phí, quản lý chi tiêu nội bộ và thống kê báo cáo Lãi/Lỗ của trung tâm.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="bg-[#a8e6cf] hover:bg-[#8fd4ba] text-black border-3 border-black font-black text-sm px-5 py-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={fetchInvoicesData}
            className="bg-white hover:bg-stone-50 text-black border-3 border-black font-black text-sm px-5 py-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Stats Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total revenue box */}
        <div className="border-4 border-black bg-white rounded-[30px_10px_25px_10px/10px_25px_10px_30px] p-5 shadow-[5px_5px_0px_rgba(0,0,0,1)] flex items-center gap-4">
          <div className="w-12 h-12 bg-[#baffc9] border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)] shrink-0">
            <DollarSign className="w-6 h-6 text-emerald-800" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Tổng Doanh Thu</span>
            <span className="text-xl font-black text-black block">{totalRevenueSum.toLocaleString("vi-VN")} đ</span>
          </div>
        </div>

        {/* Total expense box */}
        <div className="border-4 border-black bg-white rounded-[10px_25px_10px_30px/30px_10px_25px_10px] p-5 shadow-[5px_5px_0px_rgba(0,0,0,1)] flex items-center gap-4">
          <div className="w-12 h-12 bg-[#ffaaa6] border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)] shrink-0">
            <CreditCard className="w-6 h-6 text-rose-800" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Tổng Chi Tiêu</span>
            <span className="text-xl font-black text-black block">{totalExpenseSum.toLocaleString("vi-VN")} đ</span>
          </div>
        </div>

        {/* Net Profit box */}
        <div className={`border-4 border-black p-5 rounded-[20px_20px_20px_20px] shadow-[5px_5px_0px_rgba(0,0,0,1)] flex items-center gap-4 transition-colors ${
          netProfitSum >= 0 ? "bg-[#e8f5e9]" : "bg-[#ffebee]"
        }`}>
          <div className={`w-12 h-12 border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)] shrink-0 ${
            netProfitSum >= 0 ? "bg-[#a8e6cf]" : "bg-[#ffb3b3]"
          }`}>
            <TrendingUp className={`w-6 h-6 ${netProfitSum >= 0 ? "text-emerald-800" : "text-rose-800"}`} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block">
              {netProfitSum >= 0 ? "Lợi Nhuận Thực Tế (Lãi)" : "Lợi Nhuận Thực Tế (Lỗ)"}
            </span>
            <span className={`text-xl font-black block ${netProfitSum >= 0 ? "text-emerald-800" : "text-rose-800"}`}>
              {netProfitSum >= 0 ? "+" : ""}{netProfitSum.toLocaleString("vi-VN")} đ
            </span>
          </div>
        </div>

      </div>

      {/* Charts & breakdown segment */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left: Monthly revenue & expense chart (Span 3) */}
        <div className="lg:col-span-3 border-4 border-black bg-white rounded-3xl p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] space-y-4">
          <h3 className="text-lg font-black text-black border-b-2 border-black pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">📅 Thống kê thu chi hàng tháng</span>
            <span className="text-[10px] bg-stone-100 border border-black rounded px-2 py-0.5 font-bold flex gap-3 text-stone-600">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#ffd275] border border-black rounded-full block" /> Thu</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#ffaaa6] border border-black rounded-full block" /> Chi</span>
            </span>
          </h3>
          
          {stats.months.length === 0 ? (
            <div className="py-12 text-center text-gray-400 font-bold italic">Chưa có đủ dữ liệu thống kê tháng</div>
          ) : (
            <div className="h-64 flex items-end gap-6 pt-6 px-4">
              {stats.months.map((m: any) => {
                const revHeight = Math.round((m.revenue / maxVal) * 100);
                const expHeight = Math.round((m.expense / maxVal) * 100);
                return (
                  <div key={m.key} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 bg-black text-white text-[10px] p-2.5 rounded-xl border-2 border-white absolute bottom-full mb-2 transition-opacity shadow-lg pointer-events-none z-10 w-44">
                      <p className="font-black border-b border-white/20 pb-1 mb-1 text-center">{m.label}</p>
                      <p className="text-[#a8e6cf]">✓ Thu: {m.revenue.toLocaleString("vi-VN")} đ</p>
                      <p className="text-[#ffaaa6]">✗ Chi: {m.expense.toLocaleString("vi-VN")} đ</p>
                      <p className={`font-black pt-1 border-t border-white/20 mt-1 ${m.profit >= 0 ? "text-[#ffd275]" : "text-rose-400"}`}>
                        💵 {m.profit >= 0 ? "Lãi" : "Lỗ"}: {Math.abs(m.profit).toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                    {/* The Bars Side by Side */}
                    <div className="flex items-end gap-1.5 w-full h-full justify-center">
                      {/* Revenue Bar */}
                      <div
                        style={{ height: `${Math.max(5, revHeight)}%` }}
                        className="w-4 bg-[#ffd275] border-2 border-black rounded-t shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all group-hover:-translate-y-0.5"
                      />
                      {/* Expense Bar */}
                      <div
                        style={{ height: `${Math.max(5, expHeight)}%` }}
                        className="w-4 bg-[#ffaaa6] border-2 border-black rounded-t shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all group-hover:-translate-y-0.5"
                      />
                    </div>
                    {/* Label */}
                    <span className="text-[9px] font-black text-gray-500 whitespace-nowrap">{m.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Expense category share (Span 2) */}
        <div className="lg:col-span-2 border-4 border-black bg-white rounded-3xl p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] space-y-4">
          <h3 className="text-lg font-black text-black border-b-2 border-black pb-2 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-rose-600" /> Cơ cấu phân bổ chi phí
          </h3>
          
          {stats.expenseCategories.length === 0 ? (
            <div className="py-12 text-center text-gray-400 font-bold italic">Chưa ghi nhận chi phí nào</div>
          ) : (
            <div className="space-y-4 pr-1 max-h-64 overflow-y-auto">
              {stats.expenseCategories.map((c: any, idx: number) => {
                const sharePercentage = totalExpenseSum > 0 ? Math.round((c.revenue / totalExpenseSum) * 100) : 0;
                const colors = ["bg-[#ffaaa6]", "bg-[#ffd275]", "bg-[#bae1ff]", "bg-[#ffc6ff]", "bg-[#baffc9]", "bg-gray-300"];
                const color = colors[idx % colors.length];

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-black text-gray-800">
                      <span>🏷️ {c.category}</span>
                      <span>{c.revenue.toLocaleString("vi-VN")} đ ({sharePercentage}%)</span>
                    </div>
                    <div className="w-full h-3 border-2 border-black rounded-lg bg-gray-50 overflow-hidden shadow-[1px_1px_0px_rgba(0,0,0,0.1)]">
                      <div
                        style={{ width: `${sharePercentage}%` }}
                        className={`${color} h-full border-r border-black`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Tabs segment control */}
      <div className="flex border-4 border-black rounded-2xl overflow-hidden max-w-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white">
        <button
          onClick={() => setActiveTab("REVENUE")}
          className={`flex-1 py-3 text-sm font-black transition-colors cursor-pointer ${
            activeTab === "REVENUE" ? "bg-[#ffd275] text-black border-r-4 border-black" : "bg-white text-gray-700 border-r-4 border-black hover:bg-amber-50"
          }`}
        >
          Doanh thu học phí
        </button>
        <button
          onClick={() => setActiveTab("EXPENSE")}
          className={`flex-1 py-3 text-sm font-black transition-colors cursor-pointer ${
            activeTab === "EXPENSE" ? "bg-[#ffaaa6] text-black" : "bg-white text-gray-700 hover:bg-rose-50"
          }`}
        >
          Nhập & Quản lý Chi phí
        </button>
      </div>

      {/* Tab 1: REVENUE PANEL */}
      {activeTab === "REVENUE" && (
        <div className="border-4 border-black bg-white rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="text-xl font-black text-black flex items-center gap-2">
              🧾 Nhật ký đóng học phí ({filteredInvoices.length})
            </h3>
            
            {/* Search box */}
            <div className="relative max-w-sm w-full">
              <input
                type="text"
                placeholder="Tìm theo tên học sinh, lớp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-3 border-black rounded-xl p-2.5 pl-9 bg-white text-xs font-bold focus:outline-none shadow-[2px_2px_0px_rgba(0,0,0,0.15)] placeholder-gray-400"
              />
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="border-4 border-dashed border-black/10 rounded-2xl p-12 text-center bg-gray-50">
              <p className="font-bold text-gray-400">Không tìm thấy hóa đơn đóng học phí nào 🎒</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-4 border-black">
                    <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-xs">Học viên</th>
                    <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-xs">Lớp học</th>
                    <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-xs">Số tiền đã nộp</th>
                    <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-xs">Mã ưu đãi</th>
                    <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-xs">Ngày thanh toán</th>
                    <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-xs text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b-2 border-gray-200 hover:bg-[#fff9ed] transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-black text-gray-950 text-sm">{invoice.studentName}</span>
                          {invoice.studentCode && (
                            <span className="text-[10px] text-purple-700 font-extrabold">Mã HS: {invoice.studentCode}</span>
                          )}
                          <span className="text-[10px] text-gray-400 font-semibold">PH: {invoice.parentName} - {invoice.parentPhone}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-gray-700 text-sm">
                        <div className="flex flex-col">
                          <span>{invoice.className}</span>
                          <span className="text-[9px] text-gray-400 font-semibold">Khóa: {invoice.courseTitle}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <div className="flex flex-col">
                          <span className="font-black text-emerald-800">
                            {invoice.amountPaid ? `${invoice.amountPaid.toLocaleString("vi-VN")} đ` : "0 đ"}
                          </span>
                          {invoice.paymentMethod && (
                            <span className="text-[9px] text-gray-400 font-bold mt-0.5 whitespace-nowrap">
                              {invoice.paymentMethod === "TRANSFER" ? "🏦 Chuyển khoản" : 
                               invoice.paymentMethod === "CASH" ? "💵 Tiền mặt" : "🌐 Trực tuyến"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {invoice.discountCode ? (
                          <span className="bg-purple-100 border border-purple-300 rounded px-1.5 py-0.5 font-black text-purple-800 text-[10px] uppercase whitespace-nowrap">
                            {invoice.discountCode}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium italic text-xs">Không áp dụng</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-bold text-gray-500 text-xs">
                        {invoice.paymentDate ? new Date(invoice.paymentDate).toLocaleDateString("vi-VN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        }) : "N/A"}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex gap-2 justify-center">
                          {invoice.paymentProof && (
                            <button
                              onClick={() => handleViewInvoiceImage(invoice.paymentProof)}
                              className="p-2 bg-purple-100 hover:bg-purple-200 border-2 border-black rounded-lg text-purple-800 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer inline-flex items-center justify-center"
                              title="Xem biên lai chuyển khoản"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => window.open(`/print/receipt/${invoice.id}`, "In Biên Lai", "width=900,height=900,scrollbars=yes")}
                            className="p-2 bg-sky-100 hover:bg-sky-200 border-2 border-black rounded-lg text-sky-800 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer inline-flex items-center justify-center"
                            title="In Biên lai / Hóa đơn"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRefund(invoice.id, invoice.studentName)}
                            className="p-2 bg-rose-100 hover:bg-rose-200 border-2 border-black rounded-lg text-rose-700 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer inline-flex items-center justify-center"
                            title="Hủy/Hoàn tác đóng phí"
                          >
                            <Undo className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: EXPENSE PANEL */}
      {activeTab === "EXPENSE" && (
        <div className="border-4 border-black bg-white rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-black text-black flex items-center gap-2">
                💸 Nhật ký chi tiêu thực tế ({filteredExpenses.length})
              </h3>
              <button
                onClick={handleOpenAddExpense}
                className="bg-[#a8e6cf] hover:bg-[#8fd4ba] text-black border-3 border-black font-black text-xs px-4 py-2.5 rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Nhập chi tiêu mới
              </button>
            </div>
            
            {/* Search box */}
            <div className="relative max-w-sm w-full">
              <input
                type="text"
                placeholder="Tìm theo nội dung, loại chi tiêu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-3 border-black rounded-xl p-2.5 pl-9 bg-white text-xs font-bold focus:outline-none shadow-[2px_2px_0px_rgba(0,0,0,0.15)] placeholder-gray-400"
              />
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="border-4 border-dashed border-black/10 rounded-2xl p-12 text-center bg-gray-50">
              <p className="font-bold text-gray-400">Chưa ghi nhận khoản chi tiêu nào 💸</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-4 border-black">
                    <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-xs">Nội dung khoản chi</th>
                    <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-xs">Loại chi phí</th>
                    <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-xs">Số tiền nộp</th>
                    <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-xs">Ngày chi</th>
                    <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-xs">Hóa đơn</th>
                    <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-xs">Ghi chú</th>
                    <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-xs text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((exp) => {
                    const isReadOnly = exp.isReadOnly;
                    const catColors: Record<string, string> = {
                      "Mặt bằng": "bg-amber-100 text-amber-800 border-amber-300",
                      "Lương": "bg-sky-100 text-sky-800 border-sky-300",
                      "Marketing": "bg-purple-100 text-purple-800 border-purple-300",
                      "Vận hành": "bg-emerald-100 text-emerald-800 border-emerald-300",
                      "Họa cụ": "bg-[#ffaaa6]/20 text-[#d85c5c] border-[#ffaaa6]",
                      "Khác": "bg-gray-100 text-gray-700 border-gray-300"
                    };
                    const badgeClass = catColors[exp.category] || "bg-gray-100 text-gray-700 border-gray-300";

                    return (
                      <tr key={exp.id} className="border-b-2 border-gray-200 hover:bg-[#fff9ed] transition-colors">
                        <td className="py-4 px-4 font-black text-gray-950 text-sm">
                          {exp.title}
                          {isReadOnly && (
                            <span className="ml-2 bg-gray-100 text-gray-400 font-extrabold text-[9px] border border-gray-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Tự động
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-xs font-bold">
                          <span className={`border px-2 py-0.5 rounded font-black text-[10px] uppercase whitespace-nowrap ${badgeClass}`}>
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-black text-rose-700 text-sm">
                          - {exp.amount?.toLocaleString("vi-VN")} đ
                        </td>
                        <td className="py-4 px-4 font-bold text-gray-500 text-xs">
                          {exp.date ? new Date(exp.date).toLocaleDateString("vi-VN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          }) : "N/A"}
                        </td>
                        <td className="py-4 px-4">
                          {exp.invoices && exp.invoices.length > 0 ? (
                            <div className="flex gap-1.5 flex-wrap">
                              {exp.invoices.map((invUrl: string, idx: number) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleViewInvoiceImage(invUrl)}
                                  className="w-8 h-8 border-2 border-black rounded overflow-hidden hover:translate-y-[-1px] transition-transform cursor-pointer shadow-[1px_1px_0px_rgba(0,0,0,1)] bg-stone-100 flex items-center justify-center text-[8px] font-black text-gray-500"
                                >
                                  {invUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) || invUrl.startsWith("data:image/") ? (
                                    <img src={invUrl} alt={`invoice-${idx}`} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>📄 File</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 font-medium italic text-xs">Không có</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-gray-400 font-medium text-xs max-w-xs truncate" title={exp.description || ""}>
                          {exp.description || <span className="italic text-stone-300">Không có ghi chú</span>}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex gap-2 justify-center">
                            {!isReadOnly ? (
                              <>
                                <button
                                  onClick={() => handleOpenEditExpense(exp)}
                                  className="p-2 bg-amber-100 hover:bg-amber-200 border-2 border-black rounded-lg text-black transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer inline-flex items-center justify-center"
                                  title="Chỉnh sửa chi tiêu"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(exp.id, exp.title)}
                                  className="p-2 bg-rose-100 hover:bg-rose-200 border-2 border-black rounded-lg text-rose-700 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer inline-flex items-center justify-center"
                                  title="Xóa khoản chi tiêu"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-gray-300 italic font-semibold">Chỉ xem</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT EXPENSE */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border-4 border-black rounded-[35px_15px_30px_10px/10px_30px_15px_35px] max-w-md w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowExpenseModal(false)}
              className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer z-10"
            >
              <X className="w-5 h-5 text-black" />
            </button>

            <h3 className="text-2xl font-black text-black mb-1 flex items-center gap-2">
              {selectedExpense ? "✏️ Sửa Khoản Chi Tiêu" : "💸 Nhập Chi Tiêu Mới"}
            </h3>
            <p className="text-gray-500 text-sm mb-6">Điền đầy đủ thông tin để ghi nhận các khoản chi của trung tâm.</p>

            {expenseError && (
              <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl p-3 mb-4 font-bold text-sm">
                ⚠️ {expenseError}
              </div>
            )}

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">Tên khoản chi *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tiền thuê nhà Tháng 7"
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                  value={expenseForm.title}
                  onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">Loại chi phí *</label>
                  <select
                    required
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs h-[42px]"
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  >
                    <option value="Vận hành">Vận hành</option>
                    <option value="Mặt bằng">Mặt bằng</option>
                    <option value="Lương">Lương nhân sự</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Họa cụ">Họa cụ / Thiết bị</option>
                    <option value="Khác">Phần chi khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">Ngày chi *</label>
                  <input
                    type="date"
                    required
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                    value={expenseForm.date}
                    onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">Số tiền chi (VNĐ) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 12.000.000"
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-sm"
                  value={expenseForm.amount ? Number(expenseForm.amount).toLocaleString("vi-VN") : ""}
                  onChange={e => {
                    const rawValue = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
                    setExpenseForm({ ...expenseForm, amount: rawValue });
                  }}
                />
                {expenseForm.amount && Number(expenseForm.amount) > 0 && (
                  <p className="text-[10px] text-amber-700 font-extrabold mt-1.5 italic bg-amber-50 border border-amber-200 rounded-lg p-2 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    ✍️ Bằng chữ: {spellNumberVietnamese(Number(expenseForm.amount))}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">Mô tả thêm</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú chi tiết về khoản chi này..."
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs resize-none"
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">Ảnh Hóa đơn / Chứng từ thanh toán</label>
                <div className="border-3 border-dashed border-black rounded-xl p-4 bg-gray-50 flex flex-col items-center justify-center gap-3">
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files) return;
                      const filePromises = Array.from(files).map((file) => {
                        return new Promise<string>((resolve) => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            resolve(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        });
                      });
                      const base64Files = await Promise.all(filePromises);
                      setExpenseForm(prev => ({
                        ...prev,
                        invoices: [...prev.invoices, ...base64Files]
                      }));
                    }}
                    className="hidden"
                    id="expense-invoice-input"
                  />
                  <label
                    htmlFor="expense-invoice-input"
                    className="bg-[#ffd275] hover:bg-[#ffc342] border-2 border-black rounded-lg px-4 py-2 font-black text-xs shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    Chọn file hoặc chụp ảnh
                  </label>
                  <p className="text-[9px] text-gray-400 font-bold">Hỗ trợ định dạng Ảnh hoặc file PDF</p>
                  
                  {expenseForm.invoices && expenseForm.invoices.length > 0 && (
                    <div className="w-full border-t border-dashed border-gray-300 pt-3 flex gap-2 flex-wrap">
                      {expenseForm.invoices.map((invUrl, idx) => (
                        <div key={idx} className="relative w-12 h-12 border-2 border-black rounded-lg overflow-hidden group shadow-[1px_1px_0px_rgba(0,0,0,1)] bg-stone-100 flex items-center justify-center text-[9px] font-black text-gray-500">
                          {invUrl.startsWith("data:") ? (
                            invUrl.includes("application/pdf") ? (
                              <span>📄 PDF</span>
                            ) : (
                              <img src={invUrl} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                            )
                          ) : (
                            invUrl.toLowerCase().endsWith(".pdf") ? (
                              <span>📄 PDF</span>
                            ) : (
                              <img src={invUrl} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                            )
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setExpenseForm(prev => ({
                                ...prev,
                                invoices: prev.invoices.filter((_, i) => i !== idx)
                              }));
                            }}
                            className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 border border-black hover:bg-rose-600 transition-colors shadow-sm"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-black/15">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="bg-white hover:bg-gray-50 border-3 border-black rounded-xl px-5 py-3 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="bg-[#a8e6cf] hover:bg-[#8fd4ba] disabled:bg-gray-200 border-3 border-black rounded-xl px-5 py-3 font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer text-xs"
                >
                  {submittingExpense ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Lưu lại"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICATION MODAL */}
      <NotificationModal
        isOpen={notification.isOpen}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        onConfirm={notification.onConfirm}
      />

      {/* LIGHTBOX PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="relative max-w-4xl max-h-[85vh] bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[12px_12px_0px_rgba(0,0,0,1)] p-2">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer z-10"
            >
              <X className="w-4 h-4 text-black" />
            </button>
            <img src={previewImage} alt="Hóa đơn phóng to" className="max-w-full max-h-[80vh] object-contain rounded-lg border-2 border-black" />
            <div className="p-3 text-center bg-gray-50 border-t-2 border-black">
              <a
                href={previewImage}
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-[#bae1ff] hover:bg-[#a2d4fc] border-2 border-black text-black text-xs font-black px-4 py-1.5 rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
              >
                Mở trong tab mới ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function spellNumberVietnamese(num: number): string {
  if (num === 0) return "Không đồng";
  
  const units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  
  let words: string[] = [];
  let chunkCount = 0;
  let temp = num;
  
  while (temp > 0) {
    const chunk = temp % 1000;
    if (chunk > 0) {
      const chunkWords = readThreeDigits(chunk, temp >= 1000);
      const unit = units[chunkCount];
      if (unit) {
        chunkWords.push(unit);
      }
      words = [...chunkWords, ...words];
    }
    temp = Math.floor(temp / 1000);
    chunkCount++;
  }
  
  function readThreeDigits(n: number, hasHigher: boolean): string[] {
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const one = n % 10;
    
    const chunkWords: string[] = [];
    
    if (hundred > 0 || hasHigher) {
      chunkWords.push(digits[hundred], "trăm");
    }
    
    if (ten > 0) {
      if (ten === 1) {
        chunkWords.push("mười");
      } else {
        chunkWords.push(digits[ten], "mươi");
      }
    } else if (one > 0 && (hundred > 0 || hasHigher)) {
      chunkWords.push("lẻ");
    }
    
    if (one > 0) {
      if (one === 1 && ten > 1) {
        chunkWords.push("mốt");
      } else if (one === 5 && ten > 0) {
        chunkWords.push("lăm");
      } else if (one === 4 && ten > 1) {
        chunkWords.push("tư");
      } else {
        chunkWords.push(digits[one]);
      }
    }
    
    return chunkWords;
  }
  
  const result = words.join(" ").trim();
  if (!result) return "";
  
  return result.charAt(0).toUpperCase() + result.slice(1) + " đồng";
}