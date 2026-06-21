"use client";

import { useEffect, useState } from "react";
import { cmsApi } from "@/lib/api-client";
import { AuthSession } from "@/lib/types/api";
import { createPortal } from "react-dom";
import { 
  Search, Copy, Plus, Edit, Trash2, Check, Loader2, X, HelpCircle, Info, MessagesSquare, ChevronDown
} from "lucide-react";
import { CustomSelect } from "@/app/cms/components/ui/custom-select";
import { NotificationModal } from "@/app/cms/components/modals/NotificationModal";
import { ManageCategoriesModal } from "@/app/cms/components/modals/ManageCategoriesModal";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

const getCategoryStyle = (category: string) => {
  switch (category) {
    case "Chung":
      return "bg-blue-50 text-blue-800 border-blue-300";
    case "Học phí":
      return "bg-emerald-50 text-emerald-800 border-emerald-300";
    case "Lịch học":
      return "bg-amber-50 text-amber-800 border-amber-300";
    case "Đăng ký":
      return "bg-purple-50 text-purple-800 border-purple-300";
    default:
      return "bg-pink-50 text-pink-800 border-pink-300";
  }
};

export default function FaqsPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  
  // Dynamic categories state
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([
    { id: "default-1", name: "Chung" },
    { id: "default-2", name: "Học phí" },
    { id: "default-3", name: "Lịch học" },
    { id: "default-4", name: "Đăng ký" },
    { id: "default-5", name: "Khác" }
  ]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  // Copy Feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);

  // Expanded FAQ state for accordion
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Form states
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [formCategory, setFormCategory] = useState("Chung");
  const [submitting, setSubmitting] = useState(false);

  // Notification State
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info" | "confirm";
    onCloseCallback?: () => void;
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
    onCloseCallback?: () => void,
    onConfirm?: () => void
  ) => {
    setNotification({
      isOpen: true,
      title,
      message,
      type,
      onCloseCallback,
      onConfirm
    });
  };

  // Collapse open FAQ when search or category changes
  useEffect(() => {
    setExpandedFaqId(null);
  }, [searchQuery, selectedCategory]);

  // Load User Session, FAQs, and Categories
  useEffect(() => {
    async function init() {
      try {
        const sessionData = await cmsApi.auth.getSession();
        setSession(sessionData);
        await Promise.all([fetchFaqs(), fetchCategories()]);
      } catch (err) {
        console.error("Failed to load session:", err);
      } finally {
        setLoadingSession(false);
      }
    }
    init();
  }, []);

  const fetchFaqs = async () => {
    setLoadingFaqs(true);
    try {
      const data = await cmsApi.faqs.list();
      setFaqs(data.faqs || []);
    } catch (err: any) {
      console.error("Failed to load FAQs:", err);
      showNotification("Lỗi tải danh sách", err.message || "Không thể tải danh sách câu hỏi thường gặp.", "error");
    } finally {
      setLoadingFaqs(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const data = await cmsApi.faqs.listCategories();
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Failed to load FAQ categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleCopy = async (id: string, text: string) => {
    let copySuccess = false;
    
    // Try modern navigator.clipboard first
    if (navigator.clipboard && typeof window !== "undefined" && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        copySuccess = true;
      } catch (err) {
        console.warn("navigator.clipboard failed, trying fallback:", err);
      }
    }
    
    // Fallback: create temporary textarea
    if (!copySuccess) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        copySuccess = document.execCommand("copy");
        document.body.removeChild(textArea);
      } catch (err) {
        console.error("Fallback copy failed:", err);
      }
    }

    if (copySuccess) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      showNotification("Lỗi sao chép", "Không thể tự động sao chép câu trả lời mẫu.", "error");
    }
  };

  // Admin CRUD operations
  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formAnswer.trim()) {
      showNotification("Thiếu thông tin", "Vui lòng nhập đầy đủ câu hỏi và câu trả lời.", "info");
      return;
    }

    setSubmitting(true);
    try {
      await cmsApi.faqs.create({
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        category: formCategory
      });
      showNotification("Thành công", "Đã thêm câu hỏi và câu trả lời mẫu mới thành công.", "success");
      setIsAddOpen(false);
      setFormQuestion("");
      setFormAnswer("");
      setFormCategory("Chung");
      fetchFaqs();
    } catch (err: any) {
      console.error("Failed to create FAQ:", err);
      showNotification("Lỗi thêm mới", err.message || "Không thể tạo câu hỏi thường gặp.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (faq: FAQ) => {
    setSelectedFaq(faq);
    setFormQuestion(faq.question);
    setFormAnswer(faq.answer);
    setFormCategory(faq.category);
    setIsEditOpen(true);
  };

  const handleEditFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaq) return;
    if (!formQuestion.trim() || !formAnswer.trim()) {
      showNotification("Thiếu thông tin", "Vui lòng nhập đầy đủ câu hỏi và câu trả lời.", "info");
      return;
    }

    setSubmitting(true);
    try {
      await cmsApi.faqs.update(selectedFaq.id, {
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        category: formCategory
      });
      showNotification("Thành công", "Đã cập nhật câu hỏi và câu trả lời mẫu thành công.", "success");
      setIsEditOpen(false);
      setSelectedFaq(null);
      setFormQuestion("");
      setFormAnswer("");
      setFormCategory("Chung");
      fetchFaqs();
    } catch (err: any) {
      console.error("Failed to update FAQ:", err);
      showNotification("Lỗi cập nhật", err.message || "Không thể cập nhật câu hỏi thường gặp.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (faq: FAQ) => {
    showNotification(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa câu hỏi: "${faq.question}"? Hành động này không thể hoàn tác.`,
      "confirm",
      undefined,
      async () => {
        try {
          await cmsApi.faqs.delete(faq.id);
          showNotification("Thành công", "Đã xóa câu hỏi khỏi cơ sở dữ liệu.", "success");
          fetchFaqs();
        } catch (err: any) {
          console.error("Failed to delete FAQ:", err);
          showNotification("Lỗi xóa", err.message || "Không thể xóa câu hỏi này.", "error");
        }
      }
    );
  };

  if (loadingSession) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        <p className="mt-4 font-bold text-gray-600">Đang tải cấu hình...</p>
      </div>
    );
  }

  const user = session?.user;
  if (!user) return null;
  const isAdmin = user.role === "ADMIN";

  // Filter FAQs based on search and category
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "Tất cả" || faq.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-4 border-black bg-white rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            💬 Hỏi đáp & Trả lời nhanh
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Danh sách các câu hỏi thường gặp và câu trả lời mẫu hỗ trợ giáo viên gửi tin nhắn nhanh cho học viên và phụ huynh
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap gap-2 shrink-0 self-start sm:self-center">
            <button
              onClick={() => setIsManageCategoriesOpen(true)}
              className="flex items-center gap-1.5 px-4 py-3 border-3 border-black bg-[#bae1ff] hover:bg-[#a2d4fc] rounded-2xl text-sm font-black transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              📁 Quản lý danh mục
            </button>
            <button
              onClick={() => {
                setFormQuestion("");
                setFormAnswer("");
                setFormCategory("Chung");
                setIsAddOpen(true);
              }}
              className="flex items-center gap-1.5 px-5 py-3 border-3 border-black bg-[#baffc9] hover:bg-[#a3e9b3] rounded-2xl text-sm font-black transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-black" />
              Thêm câu hỏi mới
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo câu hỏi, câu trả lời hoặc danh mục..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border-3 border-black rounded-2xl font-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white shadow-[3px_3px_0px_rgba(0,0,0,0.15)]"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setSelectedCategory("Tất cả")}
            className={`px-4 py-2 border-2 border-black rounded-xl text-xs font-black transition-all cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 ${
              selectedCategory === "Tất cả" ? "bg-amber-300 text-black" : "bg-white hover:bg-gray-50 text-gray-600"
            }`}
          >
            📚 Tất cả ({faqs.length})
          </button>
          {categories.map((cat) => {
            const count = faqs.filter(f => f.category === cat.name).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 border-2 border-black rounded-xl text-xs font-black transition-all cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 ${
                  selectedCategory === cat.name ? "bg-amber-300 text-black" : "bg-white hover:bg-gray-50 text-gray-600"
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQs Main Grid */}
      {loadingFaqs ? (
        <div className="py-20 flex flex-col items-center justify-center border-4 border-dashed border-gray-200 rounded-3xl bg-white">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
          <p className="mt-4 font-bold text-gray-500">Đang tải danh sách câu hỏi...</p>
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="py-16 text-center border-4 border-dashed border-black/10 bg-white rounded-3xl p-6">
          <MessagesSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-black text-lg">Không tìm thấy câu hỏi nào phù hợp</p>
          <p className="text-gray-400 text-sm mt-1">Vui lòng thử tìm kiếm với từ khóa khác hoặc lọc danh mục khác.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {filteredFaqs.map((faq) => {
            const isCopied = copiedId === faq.id;
            return (
              <div 
                key={faq.id}
                className={`border-4 border-black bg-white rounded-[30px_10px_25px_10px/10px_25px_10px_30px] p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group transition-all ${
                  expandedFaqId === faq.id ? "h-auto" : "h-[250px] sm:h-[230px]"
                }`}
              >
                <div className="space-y-3 overflow-hidden flex flex-col justify-start">
                  {/* FAQ Top Actions Row */}
                  <div className="flex justify-between items-center shrink-0">
                    <span className={`text-[10px] border-2 border-black px-2 py-0.5 rounded-lg font-black uppercase tracking-wider whitespace-nowrap ${getCategoryStyle(faq.category)}`}>
                      {faq.category}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      {/* Copy button */}
                      <button
                        onClick={() => handleCopy(faq.id, faq.answer)}
                        className={`flex items-center gap-1 px-3 py-1.5 border-2 border-black rounded-lg text-[10px] font-black transition-all shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
                          isCopied ? "bg-emerald-200 text-emerald-800" : "bg-sky-150 hover:bg-sky-200 text-gray-700 bg-sky-50"
                        }`}
                        title="Sao chép câu trả lời mẫu"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Đã copy
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy mẫu
                          </>
                        )}
                      </button>

                      {/* Admin actions */}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(faq)}
                            className="p-1.5 border-2 border-black bg-amber-100 hover:bg-amber-200 rounded-lg text-gray-700 hover:text-black transition-all shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                            title="Chỉnh sửa hỏi đáp"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(faq)}
                            className="p-1.5 border-2 border-black bg-rose-100 hover:bg-rose-200 rounded-lg text-rose-700 hover:text-rose-900 transition-all shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                            title="Xóa câu hỏi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* FAQ Question */}
                  <div 
                    onClick={() => setExpandedFaqId(expandedFaqId === faq.id ? null : faq.id)}
                    className="flex items-start justify-between gap-2 cursor-pointer select-none py-1 group/q text-left shrink-0"
                  >
                    <h4 className="text-sm font-black text-black leading-snug flex-1 group-hover/q:text-amber-500 transition-colors">
                      ❓ {faq.question}
                    </h4>
                    <ChevronDown 
                      className={`w-5 h-5 text-black shrink-0 transition-transform duration-200 ${
                        expandedFaqId === faq.id ? "rotate-180" : ""
                      }`} 
                    />
                  </div>

                  {/* FAQ Answer container (Copyable by clicking inside) */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(faq.id, faq.answer);
                    }}
                    className={`bg-gray-50 border-2 border-black p-3.5 rounded-2xl text-gray-700 text-xs font-semibold whitespace-pre-wrap select-all cursor-pointer hover:bg-amber-50/20 active:bg-amber-50/40 transition-all relative group/box ${
                      expandedFaqId === faq.id ? "" : "line-clamp-3"
                    }`}
                    title="Click để sao chép nhanh câu trả lời này"
                  >
                    {faq.answer}
                    {expandedFaqId === faq.id && (
                      <div className="absolute right-3 bottom-3 opacity-0 group-hover/box:opacity-60 transition-opacity flex items-center gap-1 text-[9px] text-gray-500 font-black uppercase">
                        <Copy className="w-3 h-3" /> Click để copy nhanh
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[9px] text-gray-400 font-bold italic pt-1 text-right mt-2 shrink-0">
                  Cập nhật: {new Date(faq.updatedAt).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "numeric" })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD NEW FAQ */}
      {isAddOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[99999] overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border-4 border-black rounded-[30px_10px_25px_10px/10px_25px_10px_30px] max-w-lg w-full p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] bg-emerald-100 border-2 border-black rounded px-2 py-0.5 font-black text-emerald-800 uppercase tracking-wider">
                Thêm Hỏi Đáp Mới
              </span>
              <h4 className="text-xl font-black text-black mt-2 leading-tight">
                Tạo Câu Hỏi & Mẫu Trả Lời Mới
              </h4>
            </div>

            <hr className="my-3 border-t-2 border-black/10 border-dashed" />

            <form onSubmit={handleAddFaq} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-black flex items-center gap-1">
                  ❓ Câu hỏi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lớp học có giới hạn độ tuổi không?"
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  className="w-full border-3 border-black rounded-xl p-2.5 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-black flex items-center gap-1">
                  📁 Danh mục
                </label>
                <CustomSelect
                  value={formCategory}
                  onChange={(val) => setFormCategory(val)}
                  options={categories.map(cat => ({ value: cat.name, label: cat.name }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-black flex items-center gap-1">
                  📝 Câu trả lời mẫu <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Nhập câu trả lời mẫu có thể copy nhanh tại đây..."
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  className="w-full border-3 border-black rounded-xl p-2.5 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                />
              </div>

              <div className="pt-2 border-t-2 border-black/10 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border-2 border-black bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 border-2 border-black bg-[#baffc9] hover:bg-[#a3e9b3] rounded-lg text-xs font-black transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: EDIT FAQ */}
      {isEditOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[99999] overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border-4 border-black rounded-[30px_10px_25px_10px/10px_25px_10px_30px] max-w-lg w-full p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => {
                setIsEditOpen(false);
                setSelectedFaq(null);
              }}
              className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] bg-amber-100 border-2 border-black rounded px-2 py-0.5 font-black text-amber-800 uppercase tracking-wider">
                Chỉnh sửa Hỏi Đáp
              </span>
              <h4 className="text-xl font-black text-black mt-2 leading-tight">
                Cập Nhật Thông Tin Hỏi Đáp
              </h4>
            </div>

            <hr className="my-3 border-t-2 border-black/10 border-dashed" />

            <form onSubmit={handleEditFaq} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-black flex items-center gap-1">
                  ❓ Câu hỏi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập câu hỏi..."
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  className="w-full border-3 border-black rounded-xl p-2.5 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-black flex items-center gap-1">
                  📁 Danh mục
                </label>
                <CustomSelect
                  value={formCategory}
                  onChange={(val) => setFormCategory(val)}
                  options={categories.map(cat => ({ value: cat.name, label: cat.name }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-black flex items-center gap-1">
                  📝 Câu trả lời mẫu <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Nhập câu trả lời mẫu..."
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  className="w-full border-3 border-black rounded-xl p-2.5 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                />
              </div>

              <div className="pt-2 border-t-2 border-black/10 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setSelectedFaq(null);
                  }}
                  className="px-4 py-2 border-2 border-black bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 border-2 border-black bg-amber-300 hover:bg-amber-400 rounded-lg text-xs font-black transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* CUSTOM NOTIFICATION MODAL */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => {
          setNotification(prev => ({ ...prev, isOpen: false }));
          if (notification.onCloseCallback) notification.onCloseCallback();
        }}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onConfirm={notification.onConfirm}
      />

      {/* MODAL: MANAGE CATEGORIES */}
      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        onCategoriesChange={fetchCategories}
      />

    </div>
  );
}
