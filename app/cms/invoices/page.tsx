"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Loader2, Ticket, TrendingUp, DollarSign, Calendar, RefreshCcw, Printer, Undo, Search, X, Edit2, Trash2, Plus, Percent, CreditCard, PieChart, FileSpreadsheet } from "lucide-react";
import { cmsApi } from "@/lib/api-client";
import { NotificationModal } from "@/app/cms/components/modals/NotificationModal";
import { CustomSelect } from "@/app/cms/components/ui/custom-select";
import { CustomCheckbox } from "@/app/cms/components/ui/custom-checkbox";
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
  // Month & Year Filter states
  const [filterMonth, setFilterMonth] = useState<string>("ALL");
  const [filterYear, setFilterYear] = useState<string>("ALL");

  // Expense categories states
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  // Recurring templates states
  const [recurringTemplates, setRecurringTemplates] = useState<any[]>([]);
  const [loadingRecurring, setLoadingRecurring] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showAddEditRecurringModal, setShowAddEditRecurringModal] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<any>(null);
  const [recurringForm, setRecurringForm] = useState({
    title: "",
    amount: "",
    type: "EXPENSE", // "EXPENSE" or "REVENUE"
    dayOfMonth: "1",
    categoryId: "",
    description: "",
    isActive: true
  });
  const [submittingRecurring, setSubmittingRecurring] = useState(false);
  const [recurringError, setRecurringError] = useState("");

  // Expense modal states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    type: "EXPENSE", // "EXPENSE" or "REVENUE"
    categoryId: "",
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

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await cmsApi.expenses.listCategories();
      setCategories(data.categories || []);
    } catch (err: any) {
      console.error("Failed to load expense categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchRecurringTemplates = async () => {
    setLoadingRecurring(true);
    try {
      const data = await cmsApi.expenses.listRecurring();
      setRecurringTemplates(data.templates || []);
    } catch (err: any) {
      console.error("Failed to load recurring templates:", err);
    } finally {
      setLoadingRecurring(false);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchInvoicesData();
    fetchCategories();
    fetchRecurringTemplates();
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
      type: "EXPENSE",
      categoryId: categories[0]?.id || "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      invoices: []
    });
    setExpenseError("");
    setShowExpenseModal(true);
  };

  const handleOpenEditExpense = (exp: any) => {
    setSelectedExpense(exp);
    const matchedCat = categories.find(c => c.id === exp.categoryId || c.name === exp.category);
    setExpenseForm({
      title: exp.title,
      amount: String(exp.amount),
      type: exp.type || "EXPENSE",
      categoryId: matchedCat?.id || categories[0]?.id || "",
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
      setExpenseError("Vui lòng nhập tên khoản và số tiền");
      return;
    }
    setSubmittingExpense(true);
    setExpenseError("");

    const payload = {
      title: expenseForm.title.trim(),
      amount: Number(expenseForm.amount),
      type: expenseForm.type,
      categoryId: expenseForm.categoryId,
      date: new Date(expenseForm.date).toISOString(),
      description: expenseForm.description.trim() || null,
      invoices: expenseForm.invoices
    };

    try {
      if (selectedExpense) {
        await cmsApi.expenses.update(selectedExpense.id, payload);
        showNotification("Thành công 🎉", "Cập nhật thành công", "success");
      } else {
        await cmsApi.expenses.create(payload);
        showNotification("Thành công 💸", "Ghi nhận giao dịch mới thành công", "success");
      }
      setShowExpenseModal(false);
      fetchInvoicesData();
    } catch (err: any) {
      setExpenseError(err.message || "Lỗi khi lưu giao dịch");
    } finally {
      setSubmittingExpense(false);
    }
  };

  // Recurring Template CRUD handlers
  const handleOpenAddRecurring = () => {
    setSelectedRecurring(null);
    setRecurringForm({
      title: "",
      amount: "",
      type: "EXPENSE",
      dayOfMonth: "1",
      categoryId: categories[0]?.id || "",
      description: "",
      isActive: true
    });
    setRecurringError("");
    setShowAddEditRecurringModal(true);
  };

  const handleOpenEditRecurring = (template: any) => {
    setSelectedRecurring(template);
    setRecurringForm({
      title: template.title,
      amount: String(template.amount),
      type: template.type || "EXPENSE",
      dayOfMonth: String(template.dayOfMonth),
      categoryId: template.categoryId || categories[0]?.id || "",
      description: template.description || "",
      isActive: template.isActive
    });
    setRecurringError("");
    setShowAddEditRecurringModal(true);
  };

  const handleSaveRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recurringForm.title.trim() || !recurringForm.amount || !recurringForm.dayOfMonth) {
      setRecurringError("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }
    setSubmittingRecurring(true);
    setRecurringError("");

    const payload = {
      title: recurringForm.title.trim(),
      amount: Number(recurringForm.amount),
      type: recurringForm.type,
      dayOfMonth: Number(recurringForm.dayOfMonth),
      categoryId: recurringForm.categoryId || null,
      description: recurringForm.description.trim() || null,
      isActive: recurringForm.isActive
    };

    try {
      if (selectedRecurring) {
        await cmsApi.expenses.updateRecurring(selectedRecurring.id, payload);
        showNotification("Thành công 🎉", "Cập nhật cấu hình định kỳ thành công", "success");
      } else {
        await cmsApi.expenses.createRecurring(payload);
        showNotification("Thành công 💸", "Thêm cấu hình định kỳ mới thành công", "success");
      }
      setShowAddEditRecurringModal(false);
      fetchRecurringTemplates();
      fetchInvoicesData();
    } catch (err: any) {
      setRecurringError(err.message || "Lỗi khi lưu cấu hình");
    } finally {
      setSubmittingRecurring(false);
    }
  };

  const handleDeleteRecurring = (id: string, title: string) => {
    showNotification(
      "Xác nhận xóa cấu hình định kỳ 🗑️",
      `Bạn có chắc chắn muốn xóa cấu hình chi phí cố định "${title}"? Việc này sẽ không xóa các khoản thu/chi đã tự động tạo trước đó.`,
      "confirm",
      async () => {
        try {
          await cmsApi.expenses.deleteRecurring(id);
          showNotification("Thành công", "Đã xóa cấu hình thành công", "success");
          fetchRecurringTemplates();
        } catch (err: any) {
          showNotification("Lỗi", err.message || "Không thể xóa cấu hình", "error");
        }
      }
    );
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    try {
      await cmsApi.expenses.createCategory({ name: newCategoryName });
      setNewCategoryName("");
      showNotification("Thành công 🎉", "Đã thêm danh mục chi phí mới thành công.", "success");
      fetchCategories();
    } catch (err: any) {
      showNotification("Lỗi", err.message || "Không thể thêm danh mục chi phí", "error");
    } finally {
      setAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    showNotification(
      "Xác nhận xóa danh mục 🗑️",
      `Bạn có chắc chắn muốn xóa danh mục "${name}"? Chỉ có thể xóa danh mục khi không có khoản chi tiêu nào sử dụng nó.`,
      "confirm",
      async () => {
        try {
          await cmsApi.expenses.deleteCategory(id);
          showNotification("Thành công", "Đã xóa danh mục thành công", "success");
          fetchCategories();
        } catch (err: any) {
          showNotification("Lỗi", err.message || "Không thể xóa danh mục", "error");
        }
      }
    );
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
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
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
      const revenueRows = filteredInvoicesList.map(inv => ({
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
      const expenseRows = filteredExpensesList.map(exp => ({
        "Nội dung giao dịch": exp.title || "",
        "Loại giao dịch": exp.type === "REVENUE" ? "Thu nhập khác" : "Chi tiêu thực tế",
        "Danh mục": exp.category || "",
        "Số tiền (VNĐ)": exp.amount || 0,
        "Ngày giao dịch": exp.date ? new Date(exp.date).toLocaleDateString("vi-VN") : "N/A",
        "Mô tả / Chi tiết": exp.description || "",
        "Loại ghi nhận": exp.isReadOnly ? "Tự động" : "Thủ công"
      }));

      const revLen = Math.max(2, revenueRows.length + 1);
      const expLen = Math.max(2, expenseRows.length + 1);

      // Construct dynamic title based on filters
      let reportTitle = "BÁO CÁO TÀI CHÍNH TỔNG HỢP";
      if (filterYear !== "ALL" && filterMonth !== "ALL") {
        reportTitle = `BÁO CÁO TÀI CHÍNH TỔNG HỢP - THÁNG ${filterMonth}/${filterYear}`;
      } else if (filterYear !== "ALL") {
        reportTitle = `BÁO CÁO TÀI CHÍNH TỔNG HỢP - NĂM ${filterYear}`;
      } else if (filterMonth !== "ALL") {
        reportTitle = `BÁO CÁO TÀI CHÍNH TỔNG HỢP - THÁNG ${filterMonth} (TẤT CẢ CÁC NĂM)`;
      } else {
        reportTitle = "BÁO CÁO TÀI CHÍNH TỔNG HỢP - TOÀN BỘ THỜI GIAN";
      }

      // 3. Create Summary Data
      const summaryData = [
        [reportTitle],
        [`Ngày xuất báo cáo: ${new Date().toLocaleString("vi-VN")}`],
        [],
        ["Chỉ tiêu", "Giá trị (VNĐ)", "Mô tả"],
        ["Doanh Thu Học Phí", { f: `SUM('Doanh thu học phí'!G2:G${revLen})`, v: 0 }, "Tổng số tiền học phí thực tế đã thu nhận"],
        ["Doanh Thu Khác", { f: `SUMIF('Nhật ký thu chi'!B2:B${expLen}, "Thu nhập khác", 'Nhật ký thu chi'!D2:D${expLen})`, v: 0 }, "Các khoản thu nhập khác ngoài học phí"],
        ["Tổng Chi Tiêu Thực Tế", { f: `SUMIF('Nhật ký thu chi'!B2:B${expLen}, "Chi tiêu thực tế", 'Nhật ký thu chi'!D2:D${expLen})`, v: 0 }, "Tổng chi phí vận hành, lương, họa cụ, v.v."],
        ["Lợi Nhuận Thực Tế (Lãi/Lỗ)", { f: "B5+B6-B7", v: 0 }, "Hiệu số giữa Doanh thu và Chi phí"],
        [],
        ["Cơ cấu doanh thu theo phương thức thanh toán:"],
        ["Phương thức", "Số tiền (VNĐ)"],
        ["Chuyển khoản", { f: `SUMIF('Doanh thu học phí'!H2:H${revLen}, "Chuyển khoản", 'Doanh thu học phí'!G2:G${revLen})`, v: 0 }],
        ["Tiền mặt", { f: `SUMIF('Doanh thu học phí'!H2:H${revLen}, "Tiền mặt", 'Doanh thu học phí'!G2:G${revLen})`, v: 0 }],
        ["Trực tuyến", { f: `SUMIF('Doanh thu học phí'!H2:H${revLen}, "Trực tuyến", 'Doanh thu học phí'!G2:G${revLen})`, v: 0 }],
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
      ["B5", "B6", "B7", "B8", "B12", "B13", "B14"].forEach(cellRef => {
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
      const rangeSum = XLSX.utils.decode_range(worksheetSummary['!ref'] || "A1:C14");
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
          } else if (R === 4 || R === 5) {
            // Doanh thu (Green highlighting)
            cell.s = {
              font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "1B5E20" } },
              fill: { fgColor: { rgb: "E8F5E9" } }, // Emerald-50
              border: borderBlackThin,
              alignment: { horizontal: C === 1 ? "right" : "left", vertical: "center" }
            };
          } else if (R === 6) {
            // Total Expenditure (Red highlighting)
            cell.s = {
              font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "B71C1C" } },
              fill: { fgColor: { rgb: "FFEBEE" } }, // Rose-50
              border: borderBlackThin,
              alignment: { horizontal: C === 1 ? "right" : "left", vertical: "center" }
            };
          } else if (R === 7) {
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
          } else if (R === 9) {
            // Subtitle
            cell.s = {
              font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: "000000" } }
            };
          } else if (R === 10) {
            // Sub-table headers
            cell.s = {
              font: { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "000000" } },
              fill: { fgColor: { rgb: "BAE1FF" } }, // Light Blue
              alignment: { horizontal: "center", vertical: "center" },
              border: borderBlackThin
            };
          } else if (R >= 11 && R <= 13) {
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
      const revenueHeaders = [
        "Mã học sinh", "Tên học sinh", "Phụ huynh", "Số điện thoại PH",
        "Lớp học", "Khóa học", "Số tiền nộp (VNĐ)", "Phương thức",
        "Mã ưu đãi", "Ngày thanh toán"
      ];
      const worksheetRevenue = revenueRows.length === 0 
        ? XLSX.utils.aoa_to_sheet([revenueHeaders])
        : XLSX.utils.json_to_sheet(revenueRows);
      autoFitColumns(worksheetRevenue, revenueRows);
      formatCurrencyColumn(worksheetRevenue, "G", 2, revenueRows.length + 1);
      styleJsonSheet(worksheetRevenue, "A8E6CF"); // Mint Green headers
      XLSX.utils.book_append_sheet(workbook, worksheetRevenue, "Doanh thu học phí");

      // Sheet 3: Expense Sheet
      const expenseHeaders = [
        "Nội dung giao dịch", "Loại giao dịch", "Danh mục", "Số tiền (VNĐ)",
        "Ngày giao dịch", "Mô tả / Chi tiết", "Loại ghi nhận"
      ];
      const worksheetExpense = expenseRows.length === 0
        ? XLSX.utils.aoa_to_sheet([expenseHeaders])
        : XLSX.utils.json_to_sheet(expenseRows);
      autoFitColumns(worksheetExpense, expenseRows);
      formatCurrencyColumn(worksheetExpense, "D", 2, expenseRows.length + 1);
      styleJsonSheet(worksheetExpense, "FFAAA6"); // Light Pink/Rose headers
      XLSX.utils.book_append_sheet(workbook, worksheetExpense, "Nhật ký thu chi");

      // 5. Write Excel File
      XLSX.writeFile(workbook, `Bao_cao_thu_chi_Vezido_${new Date().toISOString().split("T")[0]}.xlsx`);
      showNotification("Thành công 🎉", "Xuất file Excel báo cáo thu chi thành công.", "success");
    } catch (err: any) {
      showNotification("Lỗi xuất file", err.message || "Không thể xuất file Excel.", "error");
    }
  };

  // Calculate available years dynamically
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    invoices.forEach(inv => {
      if (inv.paymentDate) {
        years.add(new Date(inv.paymentDate).getFullYear().toString());
      }
    });
    expenses.forEach(exp => {
      if (exp.date) {
        years.add(new Date(exp.date).getFullYear().toString());
      }
    });
    if (years.size === 0) {
      years.add(new Date().getFullYear().toString());
    }
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [invoices, expenses]);

  // Filter lists and calculate stats dynamically
  const { filteredInvoicesList, filteredExpensesList, filteredStats } = useMemo(() => {
    const filteredInvs = invoices.filter(inv => {
      if (!inv.paymentDate) return false;
      const d = new Date(inv.paymentDate);
      const yMatch = filterYear === "ALL" || d.getFullYear().toString() === filterYear;
      const mMatch = filterMonth === "ALL" || (d.getMonth() + 1).toString() === filterMonth;
      return yMatch && mMatch;
    });

    const filteredExps = expenses.filter(exp => {
      if (!exp.date) return false;
      const d = new Date(exp.date);
      const yMatch = filterYear === "ALL" || d.getFullYear().toString() === filterYear;
      const mMatch = filterMonth === "ALL" || (d.getMonth() + 1).toString() === filterMonth;
      return yMatch && mMatch;
    });

    let totalRevenue = 0;
    let totalExpense = 0;
    const courseBreakdown: Record<string, { title: string; count: number; revenue: number }> = {};
    const expenseCategoryBreakdown: Record<string, { category: string; revenue: number }> = {};
    const monthlyBreakdown: Record<string, { label: string; revenue: number; expense: number; profit: number }> = {};

    filteredInvs.forEach((inv) => {
      const amount = inv.amountPaid || 0;
      totalRevenue += amount;

      const courseTitle = inv.courseTitle || "Không có liên kết";
      const courseId = inv.courseId || "unlinked";
      if (!courseBreakdown[courseId]) {
        courseBreakdown[courseId] = { title: courseTitle, count: 0, revenue: 0 };
      }
      courseBreakdown[courseId].count += 1;
      courseBreakdown[courseId].revenue += amount;

      const payDate = new Date(inv.paymentDate);
      const monthKey = `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = `Tháng ${payDate.getMonth() + 1}/${payDate.getFullYear()}`;
      if (!monthlyBreakdown[monthKey]) {
        monthlyBreakdown[monthKey] = { label: monthLabel, revenue: 0, expense: 0, profit: 0 };
      }
      monthlyBreakdown[monthKey].revenue += amount;
    });

    filteredExps.forEach((exp) => {
      const amount = exp.amount || 0;
      const isRevenue = exp.type === "REVENUE";
      
      if (isRevenue) {
        totalRevenue += amount;
      } else {
        totalExpense += amount;
      }

      if (!isRevenue) {
        const cat = exp.category || "Khác";
        if (!expenseCategoryBreakdown[cat]) {
          expenseCategoryBreakdown[cat] = { category: cat, revenue: 0 };
        }
        expenseCategoryBreakdown[cat].revenue += amount;
      }

      const expDate = new Date(exp.date);
      const monthKey = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = `Tháng ${expDate.getMonth() + 1}/${expDate.getFullYear()}`;
      if (!monthlyBreakdown[monthKey]) {
        monthlyBreakdown[monthKey] = { label: monthLabel, revenue: 0, expense: 0, profit: 0 };
      }
      
      if (isRevenue) {
        monthlyBreakdown[monthKey].revenue += amount;
      } else {
        monthlyBreakdown[monthKey].expense += amount;
      }
    });

    Object.keys(monthlyBreakdown).forEach((monthKey) => {
      monthlyBreakdown[monthKey].profit = monthlyBreakdown[monthKey].revenue - monthlyBreakdown[monthKey].expense;
    });

    const courses = Object.values(courseBreakdown).sort((a, b) => b.revenue - a.revenue);
    const expenseCategories = Object.values(expenseCategoryBreakdown).sort((a, b) => b.revenue - a.revenue);
    const months = Object.entries(monthlyBreakdown)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => ({ key, ...value }));

    return {
      filteredInvoicesList: filteredInvs,
      filteredExpensesList: filteredExps,
      filteredStats: {
        totalRevenue,
        totalExpense,
        netProfit: totalRevenue - totalExpense,
        totalInvoices: filteredInvs.length,
        courses,
        expenseCategories,
        months
      }
    };
  }, [invoices, expenses, filterMonth, filterYear]);

  // Filters based on search term
  const filteredInvoices = filteredInvoicesList.filter((inv) => {
    const term = searchQuery.toLowerCase();
    return (
      inv.studentName.toLowerCase().includes(term) ||
      (inv.studentCode && inv.studentCode.toLowerCase().includes(term)) ||
      (inv.parentPhone && inv.parentPhone.includes(term)) ||
      (inv.className && inv.className.toLowerCase().includes(term))
    );
  });

  const filteredExpenses = filteredExpensesList.filter((exp) => {
    const term = searchQuery.toLowerCase();
    return (
      exp.title.toLowerCase().includes(term) ||
      exp.category.toLowerCase().includes(term) ||
      (exp.description && exp.description.toLowerCase().includes(term))
    );
  });

  // Scale value for monthly profit chart based on filtered data
  const maxVal = filteredStats.months.reduce((max: number, m: any) => Math.max(max, m.revenue, m.expense), 0) || 1;

  const totalExpenseSum = filteredStats.totalExpense || 0;
  const totalRevenueSum = filteredStats.totalRevenue || 0;
  const netProfitSum = filteredStats.netProfit || 0;

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

      {/* Filters & Manage Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border-4 border-black rounded-3xl p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
          <span className="font-black text-xs text-black shrink-0 w-full sm:w-auto">📅 Lọc thời gian:</span>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1 sm:flex-initial">
            <div className="flex-1 sm:w-36 sm:flex-initial">
              <CustomSelect
                value={filterYear}
                onChange={val => setFilterYear(val)}
                options={[
                  { value: "ALL", label: "Tất cả các năm" },
                  ...availableYears.map(y => ({ value: y, label: `Năm ${y}` }))
                ]}
                placeholder="Chọn năm..."
              />
            </div>
            <div className="flex-1 sm:w-36 sm:flex-initial">
              <CustomSelect
                value={filterMonth}
                onChange={val => setFilterMonth(val)}
                options={[
                  { value: "ALL", label: "Tất cả các tháng" },
                  ...Array.from({ length: 12 }, (_, i) => ({
                    value: (i + 1).toString(),
                    label: `Tháng ${i + 1}`
                  }))
                ]}
                placeholder="Chọn tháng..."
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRecurringModal(true)}
            className="bg-[#bae1ff] hover:bg-[#a6d3ff] text-black border-2 border-black font-black text-xs px-4 py-2.5 rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-1.5 cursor-pointer"
          >
            ⚙️ Cấu hình thu/chi cố định
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
          
          {filteredStats.months.length === 0 ? (
            <div className="py-12 text-center text-gray-400 font-bold italic">Chưa có đủ dữ liệu thống kê tháng</div>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div 
                style={{ minWidth: `${Math.max(450, filteredStats.months.length * 75)}px` }}
                className="h-64 flex items-end gap-6 pt-2 px-4"
              >
                {filteredStats.months.map((m: any) => {
                  // Limit max bar height to 55% to leave room for the tooltip at the top
                  const revHeight = Math.round((m.revenue / maxVal) * 55);
                  const expHeight = Math.round((m.expense / maxVal) * 55);
                  return (
                    <div key={m.key} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative">
                      {/* Tooltip on hover - positioned at the top of the container to prevent clipping */}
                      <div className="opacity-0 group-hover:opacity-100 bg-black text-white text-[10px] p-2 rounded-xl border-2 border-white absolute top-0 left-1/2 -translate-x-1/2 transition-opacity shadow-lg pointer-events-none z-20 w-40">
                        <p className="font-black border-b border-white/20 pb-0.5 mb-1 text-center text-[9px]">{m.label}</p>
                        <p className="text-[#a8e6cf]">✓ Thu: {m.revenue.toLocaleString("vi-VN")} đ</p>
                        <p className="text-[#ffaaa6]">✗ Chi: {m.expense.toLocaleString("vi-VN")} đ</p>
                        <p className={`font-black pt-0.5 border-t border-white/20 mt-1 text-[9px] ${m.profit >= 0 ? "text-[#ffd275]" : "text-rose-400"}`}>
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
            </div>
          )}
        </div>

        {/* Right: Expense category share (Span 2) */}
        <div className="lg:col-span-2 border-4 border-black bg-white rounded-3xl p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] space-y-4">
          <h3 className="text-lg font-black text-black border-b-2 border-black pb-2 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-rose-600" /> Cơ cấu phân bổ chi phí
          </h3>
          
          {filteredStats.expenseCategories.length === 0 ? (
            <div className="py-12 text-center text-gray-400 font-bold italic">Chưa ghi nhận chi phí nào</div>
          ) : (
            <div className="space-y-4 pr-1 max-h-64 overflow-y-auto">
              {filteredStats.expenseCategories.map((c: any, idx: number) => {
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
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-xl font-black text-black flex items-center gap-2 mr-2">
                💸 Nhật ký chi tiêu thực tế ({filteredExpenses.length})
              </h3>
              <button
                onClick={handleOpenAddExpense}
                className="bg-[#a8e6cf] hover:bg-[#8fd4ba] text-black border-3 border-black font-black text-xs px-4 py-2.5 rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Nhập chi tiêu mới
              </button>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="bg-[#bae1ff] hover:bg-[#a2d4fc] text-black border-3 border-black font-black text-xs px-4 py-2.5 rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
              >
                🏷️ Quản lý danh mục
              </button>
            </div>
            
            {/* Search box */}
            <div className="relative max-w-sm w-full">
              <input
                type="text"
                placeholder="Tìm theo nội dung, danh mục..."
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
                    <th className="py-3 px-4 font-black text-black uppercase tracking-wider text-xs">Danh mục</th>
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
                    const getBadgeClass = (catName: string) => {
                      if (catColors[catName]) return catColors[catName];
                      const classes = [
                        "bg-amber-100 text-amber-800 border-amber-300",
                        "bg-sky-100 text-sky-800 border-sky-300",
                        "bg-purple-100 text-purple-800 border-purple-300",
                        "bg-emerald-100 text-emerald-800 border-emerald-300",
                        "bg-[#ffaaa6]/20 text-[#d85c5c] border-[#ffaaa6]",
                        "bg-blue-100 text-blue-800 border-blue-300",
                        "bg-teal-100 text-teal-800 border-teal-300"
                      ];
                      let hash = 0;
                      for (let i = 0; i < catName.length; i++) {
                        hash = catName.charCodeAt(i) + ((hash << 5) - hash);
                      }
                      const index = Math.abs(hash) % classes.length;
                      return classes[index];
                    };
                    const badgeClass = getBadgeClass(exp.category || "Khác");

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
                            {exp.category || "Khác"}
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
              {selectedExpense ? "✏️ Sửa Giao Dịch" : "💸 Ghi Giao Dịch Mới"}
            </h3>
            <p className="text-gray-500 text-sm mb-6">Điền đầy đủ thông tin để ghi nhận khoản thu hoặc chi của trung tâm.</p>

            {expenseError && (
              <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl p-3 mb-4 font-bold text-sm">
                ⚠️ {expenseError}
              </div>
            )}

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">Loại giao dịch *</label>
                <div className="flex border-3 border-black rounded-xl overflow-hidden font-black text-xs bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  <button
                    type="button"
                    onClick={() => setExpenseForm({ ...expenseForm, type: "EXPENSE" })}
                    className={`flex-1 py-2 text-center transition-colors cursor-pointer ${
                      expenseForm.type === "EXPENSE" ? "bg-[#ffaaa6] text-black border-r-3 border-black" : "bg-white text-gray-500 border-r-3 border-black hover:bg-stone-50"
                    }`}
                  >
                    Chi tiêu thực tế ✗
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseForm({ ...expenseForm, type: "REVENUE" })}
                    className={`flex-1 py-2 text-center transition-colors cursor-pointer ${
                      expenseForm.type === "REVENUE" ? "bg-[#a8e6cf] text-black" : "bg-white text-gray-500 hover:bg-stone-50"
                    }`}
                  >
                    Thu nhập khác ✓
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">Tên giao dịch *</label>
                <input
                  type="text"
                  required
                  placeholder={expenseForm.type === "REVENUE" ? "Ví dụ: Tài trợ từ đối tác" : "Ví dụ: Tiền mạng tháng 7"}
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                  value={expenseForm.title}
                  onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">Danh mục *</label>
                  <CustomSelect
                    value={expenseForm.categoryId}
                    onChange={val => setExpenseForm({ ...expenseForm, categoryId: val })}
                    options={categories.map(c => ({ value: c.id, label: c.name }))}
                    placeholder="Chọn danh mục..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">Ngày giao dịch *</label>
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
                <label className="block text-xs font-black text-gray-800 mb-1">Số tiền (VNĐ) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 500.000"
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

      {/* MODAL: MANAGE EXPENSE CATEGORIES */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border-4 border-black rounded-[30px_10px_25px_10px/10px_25px_10px_30px] max-w-md w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8 animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowCategoryModal(false)}
              className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer z-10"
            >
              <X className="w-5 h-5 text-black" />
            </button>

            <h3 className="text-2xl font-black text-black mb-1 flex items-center gap-2">
              🏷️ Quản lý Danh mục Chi phí
            </h3>
            <p className="text-gray-500 text-sm mb-6">Thêm mới hoặc xóa các danh mục phân loại chi phí của trung tâm.</p>

            <form onSubmit={handleCreateCategory} className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">Tên danh mục mới *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Quảng cáo, Liên hoan..."
                    className="flex-1 border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={addingCategory}
                    className="bg-[#a8e6cf] hover:bg-[#8fd4ba] disabled:bg-gray-200 border-3 border-black rounded-xl px-4 py-2 font-black text-black text-xs shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    {addingCategory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Thêm"}
                  </button>
                </div>
              </div>
            </form>

            <div className="border-t-2 border-black pt-4">
              <label className="block text-xs font-black text-gray-800 mb-2">Danh sách hiện tại</label>
              {loadingCategories && categories.length === 0 ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              ) : categories.length === 0 ? (
                <p className="text-xs text-gray-400 font-bold italic text-center py-4">Chưa có danh mục nào.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {categories.map((c) => (
                    <div key={c.id} className="flex justify-between items-center border-2 border-black rounded-xl p-2.5 bg-gray-50 shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                      <span className="text-xs font-bold text-gray-900">{c.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(c.id, c.name)}
                        className="p-1.5 bg-rose-100 hover:bg-rose-200 border-2 border-black rounded-lg text-rose-700 transition-all shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                        title="Xóa danh mục"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

      {/* MODAL: MANAGE RECURRING FIXED TRANSACTIONS */}
      {showRecurringModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border-4 border-black rounded-[30px_10px_25px_10px/10px_25px_10px_30px] max-w-2xl w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8 animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowRecurringModal(false)}
              className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer z-10"
            >
              <X className="w-5 h-5 text-black" />
            </button>

            <h3 className="text-2xl font-black text-black mb-1 flex items-center gap-2">
              ⚙️ Cấu hình thu/chi cố định định kỳ
            </h3>
            <p className="text-gray-500 text-xs mb-6">
              Thiết lập các khoản thu/chi cố định phát sinh hàng tháng (ví dụ: tiền thuê nhà ngày 5, tiền mạng ngày 10).
              Hệ thống sẽ tự động ghi nhận giao dịch khi tới ngày đã cấu hình.
            </p>

            <div className="mb-4 flex justify-between items-center">
              <button
                type="button"
                onClick={handleOpenAddRecurring}
                className="bg-[#a8e6cf] hover:bg-[#8fd4ba] text-black border-2 border-black font-black text-xs px-3.5 py-2.5 rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Thêm cấu hình định kỳ
              </button>
            </div>

            <div className="border-t-2 border-black pt-4">
              {loadingRecurring && recurringTemplates.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : recurringTemplates.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
                  <p className="text-xs text-gray-400 font-bold italic">Chưa có cấu hình thu/chi cố định nào.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {recurringTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="border-2 border-black rounded-xl p-4 bg-gray-50 flex items-center justify-between shadow-[2px_2px_0px_rgba(0,0,0,1)] gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-gray-900">{tpl.title}</span>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 border rounded ${
                            tpl.type === "REVENUE" 
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-rose-100 text-rose-800 border-rose-300"
                          }`}>
                            {tpl.type === "REVENUE" ? "Thu nhập" : "Chi tiêu"}
                          </span>
                          <span className="text-[10px] bg-stone-100 border border-black rounded px-1.5 py-0.5 font-extrabold text-stone-600">
                            Ngày {tpl.dayOfMonth} hàng tháng
                          </span>
                          {!tpl.isActive && (
                            <span className="text-[9px] bg-gray-200 border border-gray-300 text-gray-400 font-black px-1.5 py-0.5 rounded uppercase">
                              Tạm dừng
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-rose-700">
                          {tpl.type === "REVENUE" ? "+" : "-"} {tpl.amount.toLocaleString("vi-VN")} đ
                          {tpl.category?.name && (
                            <span className="text-[10px] text-gray-400 font-black ml-2 uppercase">
                              📁 {tpl.category.name}
                            </span>
                          )}
                        </p>
                        {tpl.description && (
                          <p className="text-[10px] text-gray-400 font-bold">{tpl.description}</p>
                        )}
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditRecurring(tpl)}
                          className="p-2 bg-amber-100 hover:bg-amber-200 border-2 border-black rounded-lg text-black transition-all shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                          title="Sửa cấu hình"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecurring(tpl.id, tpl.title)}
                          className="p-2 bg-rose-100 hover:bg-rose-200 border-2 border-black rounded-lg text-rose-700 transition-all shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                          title="Xóa cấu hình"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT RECURRING TRANSACTION CONFIG */}
      {showAddEditRecurringModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] overflow-y-auto">
          <div className="bg-white border-4 border-black rounded-[35px_15px_30px_10px/10px_30px_15px_35px] max-w-md w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddEditRecurringModal(false)}
              className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer z-10"
            >
              <X className="w-5 h-5 text-black" />
            </button>

            <h3 className="text-2xl font-black text-black mb-1 flex items-center gap-2">
              {selectedRecurring ? "⚙️ Sửa Cấu Hình Định Kỳ" : "⚙️ Thêm Cấu Hình Định Kỳ"}
            </h3>
            <p className="text-gray-500 text-sm mb-6">Thiết lập các thông tin để tự động sinh giao dịch hàng tháng.</p>

            {recurringError && (
              <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl p-3 mb-4 font-bold text-sm">
                ⚠️ {recurringError}
              </div>
            )}

            <form onSubmit={handleSaveRecurring} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">Loại giao dịch *</label>
                <div className="flex border-3 border-black rounded-xl overflow-hidden font-black text-xs bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  <button
                    type="button"
                    onClick={() => setRecurringForm({ ...recurringForm, type: "EXPENSE" })}
                    className={`flex-1 py-2 text-center transition-colors cursor-pointer ${
                      recurringForm.type === "EXPENSE" ? "bg-[#ffaaa6] text-black border-r-3 border-black" : "bg-white text-gray-500 border-r-3 border-black hover:bg-stone-50"
                    }`}
                  >
                    Chi tiêu cố định ✗
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecurringForm({ ...recurringForm, type: "REVENUE" })}
                    className={`flex-1 py-2 text-center transition-colors cursor-pointer ${
                      recurringForm.type === "REVENUE" ? "bg-[#a8e6cf] text-black" : "bg-white text-gray-500 hover:bg-stone-50"
                    }`}
                  >
                    Doanh thu cố định ✓
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">Tên cấu hình *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tiền mạng internet, Tiền mặt bằng..."
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                  value={recurringForm.title}
                  onChange={e => setRecurringForm({ ...recurringForm, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">Danh mục *</label>
                  <CustomSelect
                    value={recurringForm.categoryId}
                    onChange={val => setRecurringForm({ ...recurringForm, categoryId: val })}
                    options={categories.map(c => ({ value: c.id, label: c.name }))}
                    placeholder="Chọn danh mục..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">Ngày tự động tạo (1-31) *</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs"
                    value={recurringForm.dayOfMonth}
                    onChange={e => setRecurringForm({ ...recurringForm, dayOfMonth: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">Số tiền (VNĐ) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 350.000"
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-sm"
                  value={recurringForm.amount ? Number(recurringForm.amount).toLocaleString("vi-VN") : ""}
                  onChange={e => {
                    const rawValue = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
                    setRecurringForm({ ...recurringForm, amount: rawValue });
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-800 mb-1">Mô tả chi tiết</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú chi tiết về khoản thu chi này..."
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none text-xs resize-none"
                  value={recurringForm.description}
                  onChange={e => setRecurringForm({ ...recurringForm, description: e.target.value })}
                />
              </div>

              <div className="py-1">
                <CustomCheckbox
                  id="recurring-active"
                  checked={recurringForm.isActive}
                  onChange={checked => setRecurringForm({ ...recurringForm, isActive: checked })}
                  label="Kích hoạt tự động tạo hàng tháng"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-black/15">
                <button
                  type="button"
                  onClick={() => setShowAddEditRecurringModal(false)}
                  className="bg-white hover:bg-gray-50 border-3 border-black rounded-xl px-5 py-3 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingRecurring}
                  className="bg-[#a8e6cf] hover:bg-[#8fd4ba] disabled:bg-gray-200 border-3 border-black rounded-xl px-5 py-3 font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer text-xs"
                >
                  {submittingRecurring ? (
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