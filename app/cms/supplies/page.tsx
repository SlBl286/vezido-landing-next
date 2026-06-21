"use client";

import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, Search, AlertTriangle, TrendingUp, DollarSign, History, Box, List, ArrowDownCircle, ArrowUpCircle, ShoppingCart } from "lucide-react";
import { AddSupplyModal } from "@/app/cms/components/modals/AddSupplyModal";
import { ImportSupplyModal } from "@/app/cms/components/modals/ImportSupplyModal";
import { ExportSupplyModal } from "@/app/cms/components/modals/ExportSupplyModal";
import { NotificationModal } from "@/app/cms/components/modals/NotificationModal";
import { ManageSupplyCategoriesModal } from "@/app/cms/components/modals/ManageSupplyCategoriesModal";
import { CustomSelect } from "@/app/cms/components/ui/custom-select";

export default function SuppliesPage() {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"inventory" | "history" | "stats">("inventory");

  // Supplies & Transactions Data
  const [supplies, setSupplies] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modals visibility
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportItemId, setExportItemId] = useState<string | undefined>(undefined);

  // Categories state
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);

  // Editing state
  const [editItem, setEditItem] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", categoryId: "", unit: "Cái", minQuantity: "5", purchaseLink: "" });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // File Preview Modal State
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);

  // Notification State
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
    type: "info"
  });

  const showNotification = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "confirm",
    onConfirm?: () => void
  ) => {
    setNotification({ isOpen: true, title, message, type, onConfirm });
  };

  // Get Session
  useEffect(() => {
    async function getSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        }
      } catch (err) {
        console.error("Failed to load session:", err);
      } finally {
        setLoadingSession(false);
      }
    }
    getSession();
  }, []);

  const role = session?.user?.role || "USER";
  const isAdmin = role === "ADMIN";

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/cms/supplies/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // Fetch Supplies
  const fetchSupplies = async () => {
    try {
      const url = new URL("/api/cms/supplies", window.location.origin);
      if (search) url.searchParams.set("search", search);
      if (categoryFilter) url.searchParams.set("categoryId", categoryFilter);
      if (lowStockFilter) url.searchParams.set("lowStock", "true");

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setSupplies(data.supplies || []);
      }
    } catch (err) {
      console.error("Error fetching supplies:", err);
    }
  };

  // Fetch Transactions
  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/cms/supplies/transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  // Fetch Stats (Admin only)
  const fetchStats = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch("/api/cms/supplies/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Combined data fetcher
  const loadAllData = async () => {
    setLoadingData(true);
    await fetchCategories();
    await fetchSupplies();
    await fetchTransactions();
    if (isAdmin) {
      await fetchStats();
    }
    setLoadingData(false);
  };

  // Load data on filter changes
  useEffect(() => {
    if (!loadingSession && session) {
      fetchSupplies();
    }
  }, [search, categoryFilter, lowStockFilter, loadingSession, session]);

  // Load all on start
  useEffect(() => {
    if (!loadingSession && session) {
      loadAllData();
    }
  }, [loadingSession, session]);

  // Delete Supply Item
  const handleDeleteItem = (id: string, name: string) => {
    showNotification(
      "Xác nhận xóa vật phẩm",
      `Bạn có chắc chắn muốn xóa "${name}" ra khỏi kho hàng? Giao dịch liên quan cũng sẽ bị xóa.`,
      "confirm",
      async () => {
        try {
          const res = await fetch(`/api/cms/supplies?id=${id}`, { method: "DELETE" });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Có lỗi xảy ra khi xóa");
          }
          showNotification("Thành công", "Đã xóa vật phẩm thành công", "success");
          loadAllData();
        } catch (err: any) {
          showNotification("Lỗi", err.message || "Không thể xóa vật phẩm", "error");
        }
      }
    );
  };

  // Edit Supply Item
  const handleStartEdit = (item: any) => {
    setEditItem(item);
    setEditForm({
      name: item.name,
      categoryId: item.categoryId || "",
      unit: item.unit,
      minQuantity: String(item.minQuantity),
      purchaseLink: item.purchaseLink || ""
    });
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setSubmittingEdit(true);

    try {
      const res = await fetch(`/api/cms/supplies?id=${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          categoryId: editForm.categoryId,
          unit: editForm.unit.trim(),
          minQuantity: Number(editForm.minQuantity),
          purchaseLink: editForm.purchaseLink.trim() || undefined
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Cập nhật thất bại");
      }

      showNotification("Thành công", "Đã cập nhật thông tin vật phẩm", "success");
      setEditItem(null);
      loadAllData();
    } catch (err: any) {
      showNotification("Lỗi cập nhật", err.message || "Không thể cập nhật", "error");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Render Status Badge
  const renderStatus = (qty: number, min: number, unit: string) => {
    if (qty === 0) {
      return (
        <span className="bg-[#ffaaa6] border-2 border-black text-black font-extrabold text-xs px-2.5 py-1 rounded-xl shadow-[1px_1px_0px_rgba(0,0,0,1)]">
          ❌ Hết hàng (0)
        </span>
      );
    }
    if (qty <= min) {
      return (
        <span className="bg-[#ffd275] border-2 border-black text-black font-extrabold text-xs px-2.5 py-1 rounded-xl shadow-[1px_1px_0px_rgba(0,0,0,1)]">
          ⚠️ Sắp hết ({qty} {unit})
        </span>
      );
    }
    return (
      <span className="bg-[#a8e6cf] border-2 border-black text-black font-extrabold text-xs px-2.5 py-1 rounded-xl shadow-[1px_1px_0px_rgba(0,0,0,1)]">
        ✅ Đủ dùng ({qty} {unit})
      </span>
    );
  };

  if (!loadingSession && (!session || role === "ASSISTANT")) {
    return (
      <div className="border-4 border-black bg-white rounded-3xl p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto my-12">
        <span className="text-6xl mb-4 block">🚫</span>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h1>
        <p className="text-gray-600">Trang này không khả dụng đối với vai trò của bạn.</p>
      </div>
    );
  }

  if (loadingSession || (loadingData && supplies.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
          <p className="font-extrabold text-black">Đang tải dữ liệu kho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Action Headers */}
      <div className="bg-[#ffd275] border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-black tracking-tight flex items-center gap-2.5">
            📦 QUẢN LÝ KHO HÀNG HÓA
          </h2>
          <p className="text-gray-800 font-bold text-sm mt-1">
            Quản lý dụng cụ vẽ, văn phòng phẩm, xuất nhập kho và theo dõi chi phí.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
          {isAdmin && (
            <button
              onClick={() => setShowManageCategoriesModal(true)}
              className="bg-[#bae1ff] hover:bg-[#97cbf2] text-black border-3 border-black font-black text-sm px-4 py-2.5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer"
            >
              <List className="w-4 h-4" />
              <span>Quản lý danh mục</span>
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white hover:bg-stone-50 text-black border-3 border-black font-black text-sm px-4 py-2.5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Đăng ký mới</span>
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-[#a8e6cf] hover:bg-[#8fd4ba] text-black border-3 border-black font-black text-sm px-4 py-2.5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>Nhập kho</span>
            </button>
          )}
          <button
            onClick={() => {
              setExportItemId(undefined);
              setShowExportModal(true);
            }}
            className="bg-[#ffaaa6] hover:bg-[#ff8b94] text-black border-3 border-black font-black text-sm px-4 py-2.5 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Xuất dùng</span>
          </button>
        </div>
      </div>

      {/* Tabs Selector Navigation */}
      <div className="flex border-b-4 border-black gap-2">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-5 py-3 font-black text-sm border-t-4 border-x-4 border-black rounded-t-2xl shadow-[0_4px_0_0_#fff] relative z-10 transition-all cursor-pointer ${
            activeTab === "inventory"
              ? "bg-white text-black translate-y-[4px] border-b-0"
              : "bg-stone-100 text-gray-500 hover:bg-stone-50 border-b-4 border-black"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Box className="w-4 h-4" />
            Kho họa cụ & Đồ dùng
          </span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-5 py-3 font-black text-sm border-t-4 border-x-4 border-black rounded-t-2xl shadow-[0_4px_0_0_#fff] relative z-10 transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-white text-black translate-y-[4px] border-b-0"
              : "bg-stone-100 text-gray-500 hover:bg-stone-50 border-b-4 border-black"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <History className="w-4 h-4" />
            Lịch sử Nhập / Xuất
          </span>
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-5 py-3 font-black text-sm border-t-4 border-x-4 border-black rounded-t-2xl shadow-[0_4px_0_0_#fff] relative z-10 transition-all cursor-pointer ${
              activeTab === "stats"
                ? "bg-white text-black translate-y-[4px] border-b-0"
                : "bg-stone-100 text-gray-500 hover:bg-stone-50 border-b-4 border-black"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              Thống kê Chi phí
            </span>
          </button>
        )}
      </div>

      {/* Tab 1: Inventory Management */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white border-4 border-black rounded-3xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm tên họa cụ..."
                className="w-full border-3 border-black rounded-xl py-2 pl-11 pr-4 font-bold text-black focus:outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="w-full md:w-56">
              <CustomSelect
                value={categoryFilter}
                onChange={(val) => setCategoryFilter(val)}
                options={[
                  { value: "", label: "📁 Tất cả phân loại" },
                  ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                ]}
                placeholder="📁 Tất cả phân loại"
              />
            </div>

            {/* Low stock checker */}
            <button
              onClick={() => setLowStockFilter(!lowStockFilter)}
              className={`border-3 border-black rounded-xl p-2 font-bold flex items-center justify-center gap-1.5 w-full md:w-auto transition-all cursor-pointer ${
                lowStockFilter
                  ? "bg-[#ffaaa6] text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]"
                  : "bg-white text-gray-700"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Cảnh báo sắp hết</span>
            </button>
          </div>

          {/* Supplies List Table */}
          <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-100 border-b-4 border-black">
                    <th className="p-4 font-black text-black text-sm uppercase">Tên vật phẩm</th>
                    <th className="p-4 font-black text-black text-sm uppercase">Phân loại</th>
                    <th className="p-4 font-black text-black text-sm uppercase">Tồn kho hiện tại</th>
                    <th className="p-4 font-black text-black text-sm uppercase">Đơn vị</th>
                    <th className="p-4 font-black text-black text-sm uppercase">Ngưỡng tối thiểu</th>
                    <th className="p-4 font-black text-black text-sm uppercase">Tình trạng</th>
                    <th className="p-4 font-black text-black text-sm text-right uppercase">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black">
                  {supplies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center font-bold text-gray-400 italic">
                        Không tìm thấy họa cụ nào trùng khớp.
                      </td>
                    </tr>
                  ) : (
                    supplies.map((item) => (
                      <tr key={item.id} className="hover:bg-amber-50/10 transition-colors">
                        <td className="p-4 font-bold text-black">{item.name}</td>
                        <td className="p-4">
                          <span className="bg-[#dcd6f7] border-2 border-black text-black font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-md whitespace-nowrap">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-4 font-black text-lg text-black">{item.quantity}</td>
                        <td className="p-4 font-bold text-stone-500">{item.unit}</td>
                        <td className="p-4 font-bold text-stone-600">{item.minQuantity}</td>
                        <td className="p-4">
                          {renderStatus(item.quantity, item.minQuantity, item.unit)}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.purchaseLink && (
                              <a
                                href={item.purchaseLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-[#bae1ff] hover:bg-[#8eceff] border-2 border-black rounded-lg p-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer text-xs font-black text-black flex items-center gap-1"
                                title="Link mua hàng"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                <span className="hidden sm:inline">Mua hàng</span>
                              </a>
                            )}
                            <button
                              onClick={() => {
                                setExportItemId(item.id);
                                setShowExportModal(true);
                              }}
                              className="bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-lg p-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer text-xs font-black text-black flex items-center gap-1"
                              title="Báo hết / Xuất dùng"
                            >
                              <ArrowUpCircle className="w-4 h-4" />
                              <span className="hidden sm:inline">Trừ kho</span>
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="bg-[#ffffba] hover:bg-[#ffea75] border-2 border-black rounded-lg p-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                                title="Sửa"
                              >
                                <Edit2 className="w-4 h-4 text-black" />
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteItem(item.id, item.name)}
                                className="bg-rose-100 hover:bg-rose-200 border-2 border-black rounded-lg p-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4 text-rose-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Transaction Logs */}
      {activeTab === "history" && (
        <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-100 border-b-4 border-black">
                  <th className="p-4 font-black text-black text-sm uppercase">Thời gian</th>
                  <th className="p-4 font-black text-black text-sm uppercase">Vật phẩm</th>
                  <th className="p-4 font-black text-black text-sm uppercase">Loại giao dịch</th>
                  <th className="p-4 font-black text-black text-sm uppercase">Số lượng</th>
                  <th className="p-4 font-black text-black text-sm uppercase">Đơn giá</th>
                  <th className="p-4 font-black text-black text-sm uppercase">Tổng tiền</th>
                  <th className="p-4 font-black text-black text-sm uppercase">Ghi chú / Mục đích</th>
                  <th className="p-4 font-black text-black text-sm uppercase">Hóa đơn</th>
                  <th className="p-4 font-black text-black text-sm uppercase">Người thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center font-bold text-gray-400 italic">
                      Chưa ghi nhận lịch sử nhập xuất nào.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-amber-50/10 transition-colors">
                      <td className="p-4 font-medium text-black">
                        {new Date(tx.date).toLocaleString("vi-VN")}
                      </td>
                      <td className="p-4 font-bold text-black">{tx.item?.name || "Vật phẩm đã xóa"}</td>
                      <td className="p-4">
                        {tx.type === "IMPORT" ? (
                          <span className="bg-[#a8e6cf] border-2 border-black text-black font-extrabold text-[10px] px-2 py-0.5 rounded shadow-[1px_1px_0px_rgba(0,0,0,1)] whitespace-nowrap">
                            📥 NHẬP KHO
                          </span>
                        ) : (
                          <span className="bg-[#ffaaa6] border-2 border-black text-black font-extrabold text-[10px] px-2 py-0.5 rounded shadow-[1px_1px_0px_rgba(0,0,0,1)] whitespace-nowrap">
                            📤 XUẤT DÙNG
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-black text-black">
                        {tx.type === "IMPORT" ? `+${tx.quantity}` : `-${tx.quantity}`} {tx.item?.unit}
                      </td>
                      <td className="p-4 font-bold text-stone-600">
                        {tx.pricePerUnit ? `${tx.pricePerUnit.toLocaleString("vi-VN")} đ` : "-"}
                      </td>
                      <td className="p-4 font-black text-stone-800">
                        {tx.totalCost ? `${tx.totalCost.toLocaleString("vi-VN")} đ` : "-"}
                      </td>
                      <td className="p-4 text-xs font-semibold text-stone-500 max-w-[200px] truncate" title={tx.purpose}>
                        {tx.purpose || "-"}
                      </td>
                      <td className="p-4">
                        {tx.invoices && tx.invoices.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {tx.invoices.map((url: string, index: number) => {
                              const isPdf = url.toLowerCase().endsWith(".pdf");
                              return (
                                <button
                                  key={index}
                                  onClick={() => setPreviewFile({ url, name: `${isPdf ? "📄 Hóa đơn PDF" : "🖼️ Hóa đơn Ảnh"} ${index + 1}` })}
                                  className="bg-[#bae1ff] hover:bg-[#a2d4fc] border-2 border-black rounded px-1.5 py-0.5 text-[10px] font-black text-black shadow-[1px_1px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer inline-flex items-center gap-0.5"
                                  title={`Xem hóa đơn ${index + 1}`}
                                >
                                  {isPdf ? "📄 PDF" : "🖼️ Ảnh"} {index + 1}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-stone-400 font-bold text-xs">-</span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-stone-700">{tx.performedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Cost Statistics (Admin only) */}
      {activeTab === "stats" && isAdmin && stats && (
        <div className="space-y-6">
          {/* Stats overview cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-[#bae1ff] border-4 border-black rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Tổng mặt hàng</p>
                <h4 className="text-3xl font-black text-black mt-1">{stats.summary.totalItems}</h4>
              </div>
              <Box className="w-8 h-8 text-black opacity-30" />
            </div>

            <div className="bg-[#ffd275] border-4 border-black rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Họa cụ sắp hết</p>
                <h4 className="text-3xl font-black text-black mt-1">{stats.summary.lowStockCount}</h4>
              </div>
              <AlertTriangle className="w-8 h-8 text-black opacity-30" />
            </div>

            <div className="bg-[#ffaaa6] border-4 border-black rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Mặt hàng hết kho</p>
                <h4 className="text-3xl font-black text-black mt-1">{stats.summary.outOfStockCount}</h4>
              </div>
              <Trash2 className="w-8 h-8 text-rose-500 opacity-30" />
            </div>

            <div className="bg-[#a8e6cf] border-4 border-black rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Tổng chi phí đã mua</p>
                <h4 className="text-2xl font-black text-black mt-1.5">
                  {stats.summary.totalExpenditure.toLocaleString("vi-VN")} đ
                </h4>
              </div>
              <DollarSign className="w-8 h-8 text-black opacity-30" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Cost Breakdown */}
            <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-lg font-black text-black mb-4 flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Chi phí mua họa cụ theo tháng
              </h3>
              <div className="space-y-3">
                {stats.monthlyData.length === 0 ? (
                  <p className="text-sm font-bold text-gray-400 italic text-center py-4">Chưa có số liệu chi phí.</p>
                ) : (
                  stats.monthlyData.map((m: any) => (
                    <div key={m.month} className="flex items-center justify-between border-2 border-black rounded-xl p-3 bg-gray-50">
                      <span className="font-extrabold text-sm text-black">Tháng {m.month}</span>
                      <span className="font-black text-black">{m.cost.toLocaleString("vi-VN")} đ</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top items spending */}
            <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-lg font-black text-black mb-4 flex items-center gap-1.5">
                <List className="w-5 h-5 text-amber-500" />
                Top 5 họa cụ mua nhiều nhất
              </h3>
              <div className="space-y-3">
                {stats.topItemsData.length === 0 ? (
                  <p className="text-sm font-bold text-gray-400 italic text-center py-4">Chưa có số liệu chi phí.</p>
                ) : (
                  stats.topItemsData.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between border-2 border-black rounded-xl p-3 bg-gray-50">
                      <div className="font-extrabold text-sm text-black flex items-center gap-2">
                        <span className="w-5 h-5 bg-[#ffd275] border-2 border-black rounded-full flex items-center justify-center font-black text-xs">
                          {idx + 1}
                        </span>
                        <span>{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-black block">{item.cost.toLocaleString("vi-VN")} đ</span>
                        <span className="text-[10px] text-gray-400 font-bold">Số lượng: {item.quantity}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Editing Modal (Admin only) */}
      {editItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border-4 border-black rounded-[35px_15px_30px_10px/10px_30px_15px_35px] max-w-md w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
            <button
              onClick={() => setEditItem(null)}
              className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <X className="w-5 h-5 text-black" />
            </button>

            <h3 className="text-2xl font-black text-black mb-1">
              ✏️ Sửa Vật phẩm Kho
            </h3>
            <p className="text-gray-500 text-sm mb-6">Cập nhật thông tin họa cụ hoặc ngưỡng cảnh báo trong kho.</p>

            <form onSubmit={handleUpdateItem} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Tên vật phẩm *</label>
                <input
                  type="text"
                  required
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Link mua hàng (Tùy chọn)</label>
                <input
                  type="url"
                  placeholder="Ví dụ: https://shopee.vn/..."
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none"
                  value={editForm.purchaseLink}
                  onChange={(e) => setEditForm({ ...editForm, purchaseLink: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Phân loại *</label>
                  <CustomSelect
                    value={editForm.categoryId}
                    onChange={(val) => setEditForm({ ...editForm, categoryId: val })}
                    options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                    placeholder="Chọn danh mục..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Đơn vị tính *</label>
                  <input
                    type="text"
                    required
                    className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none"
                    value={editForm.unit}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Ngưỡng báo hết *</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full border-3 border-black rounded-xl p-2.5 bg-gray-50 font-bold text-black focus:outline-none"
                  value={editForm.minQuantity}
                  onChange={(e) => setEditForm({ ...editForm, minQuantity: e.target.value })}
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="bg-white hover:bg-gray-50 border-3 border-black rounded-xl px-5 py-3 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="bg-[#ffd275] hover:bg-[#ffc342] disabled:bg-gray-200 border-3 border-black rounded-xl px-5 py-3 font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer"
                >
                  {submittingEdit ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals Elements */}
      <AddSupplyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadAllData}
      />

      <ImportSupplyModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        supplies={supplies}
        onSuccess={loadAllData}
      />

      <ExportSupplyModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        supplies={supplies}
        onSuccess={loadAllData}
        initialItemId={exportItemId}
      />

      <ManageSupplyCategoriesModal
        isOpen={showManageCategoriesModal}
        onClose={() => setShowManageCategoriesModal(false)}
        onSuccess={loadAllData}
      />

      <NotificationModal
        isOpen={notification.isOpen}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={() => {
          if (notification.type !== "confirm") {
            setNotification(prev => ({ ...prev, isOpen: false }));
          } else if (notification.onConfirm) {
            // Cancel behavior for confirm modal is just closing it
            setNotification(prev => ({ ...prev, isOpen: false }));
          }
        }}
        onConfirm={() => {
          if (notification.onConfirm) {
            notification.onConfirm();
          }
          setNotification(prev => ({ ...prev, isOpen: false }));
        }}
      />

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border-4 border-black rounded-[35px_15px_30px_10px/10px_30px_15px_35px] max-w-3xl w-full p-6 md:p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative my-8 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer z-10"
            >
              <X className="w-5 h-5 text-black" />
            </button>

            <h3 className="text-2xl font-black text-black mb-1 flex items-center gap-2 pr-8">
              {previewFile.name}
            </h3>
            <p className="text-gray-500 text-sm mb-6">Xem chi tiết hóa đơn nhập kho trực tiếp trên trình duyệt.</p>

            <div className="border-3 border-black rounded-2xl bg-gray-50 overflow-hidden flex items-center justify-center min-h-[300px] max-h-[600px] relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              {previewFile.url.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewFile.url}
                  className="w-full h-[550px] border-none"
                  title={previewFile.name}
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-w-full max-h-[550px] object-contain"
                />
              )}
            </div>

            <div className="pt-6 flex items-center justify-end gap-3">
              <a
                href={previewFile.url}
                download
                className="bg-[#bae1ff] hover:bg-[#97cbf2] border-3 border-black rounded-xl px-5 py-3 font-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-center text-sm"
              >
                Tải về tệp gốc
              </a>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="bg-white hover:bg-gray-50 border-3 border-black rounded-xl px-5 py-3 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple X icon replacement to prevent compilation imports conflict
function X(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
