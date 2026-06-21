"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Ticket, TrendingUp, DollarSign, Calendar, RefreshCcw, Printer, RefreshCw, Undo, Search, X } from "lucide-react";
import { cmsApi } from "@/lib/api-client";
import { NotificationModal } from "@/app/cms/components/modals/NotificationModal";

export default function CMSInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalRevenue: 0,
    totalInvoices: 0,
    courses: [],
    months: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [session, setSession] = useState<any>(null);

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
      setStats(data.stats || { totalRevenue: 0, totalInvoices: 0, courses: [], months: [] });
    } catch (err: any) {
      showNotification("Lỗi tải hóa đơn", err.message || "Không thể tải báo cáo doanh thu.", "error");
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
          <p className="font-extrabold text-black">Đang tải báo cáo doanh thu...</p>
        </div>
      </div>
    );
  }

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const term = searchQuery.toLowerCase();
    return (
      inv.studentName.toLowerCase().includes(term) ||
      (inv.studentCode && inv.studentCode.toLowerCase().includes(term)) ||
      (inv.parentPhone && inv.parentPhone.includes(term)) ||
      (inv.className && inv.className.toLowerCase().includes(term))
    );
  });

  // Find max monthly revenue for bar chart scaling
  const maxMonthlyRevenue = stats.months.reduce((max: number, m: any) => Math.max(max, m.revenue), 0) || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Neobrutalism Header */}
      <div className="bg-[#ffd275] border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-black tracking-tight flex items-center gap-2.5">
            🧾 HÓA ĐƠN & THỐNG KÊ DOANH THU
          </h2>
          <p className="text-gray-800 font-bold text-sm mt-1">
            Theo dõi danh sách các hóa đơn đóng tiền, xem thống kê dòng tiền và doanh thu học phí theo tháng/khóa học.
          </p>
        </div>
        <button
          onClick={fetchInvoicesData}
          className="bg-white hover:bg-stone-50 text-black border-3 border-black font-black text-sm px-5 py-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Stats Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Total revenue box */}
        <div className="border-4 border-black bg-white rounded-[30px_10px_25px_10px/10px_25px_10px_30px] p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] flex items-center gap-4">
          <div className="w-14 h-14 bg-[#baffc9] border-3 border-black rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,1)]">
            <DollarSign className="w-7 h-7 text-emerald-800" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Tổng Doanh Thu Đã Thu</span>
            <span className="text-2xl font-black text-black block">{stats.totalRevenue.toLocaleString("vi-VN")} VNĐ</span>
          </div>
        </div>

        {/* Invoices Count box */}
        <div className="border-4 border-black bg-white rounded-[10px_25px_10px_30px/30px_10px_25px_10px] p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] flex items-center gap-4">
          <div className="w-14 h-14 bg-[#bae1ff] border-3 border-black rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,1)]">
            <TrendingUp className="w-7 h-7 text-sky-800" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Tổng Số Hóa Đơn Đã Đóng</span>
            <span className="text-2xl font-black text-black block">{stats.totalInvoices} hóa đơn</span>
          </div>
        </div>

      </div>

      {/* Charts & breakdown segment */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left: Monthly revenue bar chart (Span 3) */}
        <div className="lg:col-span-3 border-4 border-black bg-white rounded-3xl p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] space-y-4">
          <h3 className="text-lg font-black text-black border-b-2 border-black pb-2 flex items-center gap-2">
            📅 Doanh thu theo tháng
          </h3>
          
          {stats.months.length === 0 ? (
            <div className="py-12 text-center text-gray-400 font-bold italic">Chưa có đủ dữ liệu thống kê tháng</div>
          ) : (
            <div className="h-64 flex items-end gap-6 pt-6 px-4">
              {stats.months.map((m: any) => {
                const heightPercentage = Math.round((m.revenue / maxMonthlyRevenue) * 100);
                return (
                  <div key={m.key} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 bg-black text-white text-[10px] px-2 py-1 rounded font-black border border-white absolute mb-28 transition-opacity shadow-md pointer-events-none">
                      {m.revenue.toLocaleString("vi-VN")} đ
                    </div>
                    {/* The Bar */}
                    <div
                      style={{ height: `${Math.max(10, heightPercentage)}%` }}
                      className="w-full bg-[#ffd275] border-3 border-black rounded-t-lg shadow-[3px_3px_0px_rgba(0,0,0,1)] group-hover:translate-y-[-2px] group-hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] transition-all"
                    />
                    {/* Label */}
                    <span className="text-[10px] font-black text-gray-500 whitespace-nowrap">{m.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Course share breakdown (Span 2) */}
        <div className="lg:col-span-2 border-4 border-black bg-white rounded-3xl p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] space-y-4">
          <h3 className="text-lg font-black text-black border-b-2 border-black pb-2 flex items-center gap-2">
            🎨 Phân bổ doanh thu theo khóa học
          </h3>
          
          {stats.courses.length === 0 ? (
            <div className="py-12 text-center text-gray-400 font-bold italic">Chưa có dữ liệu khóa học</div>
          ) : (
            <div className="space-y-4 pr-1 max-h-64 overflow-y-auto">
              {stats.courses.map((c: any, idx: number) => {
                const sharePercentage = stats.totalRevenue > 0 ? Math.round((c.revenue / stats.totalRevenue) * 100) : 0;
                const colors = ["bg-[#bae1ff]", "bg-[#a8e6cf]", "bg-[#ffd275]", "bg-[#ffc6ff]"];
                const color = colors[idx % colors.length];

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-black text-gray-800">
                      <span className="truncate max-w-[200px]">{c.title}</span>
                      <span>{c.revenue.toLocaleString("vi-VN")} đ ({sharePercentage}%)</span>
                    </div>
                    <div className="w-full h-4 border-2 border-black rounded-lg bg-gray-50 overflow-hidden shadow-[1px_1px_0px_rgba(0,0,0,0.1)]">
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

      {/* Invoice List Panel */}
      <div className="border-4 border-black bg-white rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-black text-black flex items-center gap-2">
            🧾 Nhật ký hóa đơn thanh toán ({filteredInvoices.length})
          </h3>
          
          {/* Search box */}
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              placeholder="Tìm theo tên học sinh, lớp, số điện thoại..."
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
                    <td className="py-4 px-4 font-black text-emerald-800 text-sm">
                      {invoice.amountPaid ? `${invoice.amountPaid.toLocaleString("vi-VN")} đ` : "0 đ"}
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

      {/* NOTIFICATION MODAL */}
      <NotificationModal
        isOpen={notification.isOpen}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        onConfirm={notification.onConfirm}
      />
    </div>
  );
}
