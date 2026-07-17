"use client";

import { useEffect, useState, useMemo } from "react";
import { CustomPagination } from "../components/ui/custom-pagination";
import { cmsApi } from "@/lib/api-client";
import { AuthSession } from "@/lib/types/api";
import { createPortal } from "react-dom";
import { 
  Plus, Edit, Trash2, Check, Loader2, X, Info, Image, Palette, Calendar, User, Search, Eye
} from "lucide-react";
import { CustomSelect } from "@/app/cms/components/ui/custom-select";
import { CustomCheckbox } from "@/app/cms/components/ui/custom-checkbox";
import { NotificationModal } from "@/app/cms/components/modals/NotificationModal";
import { getImageUrl } from "@/lib/utils";

interface Artwork {
  id: string;
  studentCode: string;
  imageUrl: string;
  title: string | null;
  comment: string | null;
  teacherName: string | null;
  className: string | null;
  isPublic: boolean;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export default function CMSArtworksPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  
  // Student selection
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  // Gallery
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loadingArtworks, setLoadingArtworks] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("Tất cả");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedClassFilter]);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formComment, setFormComment] = useState("");
  const [formIsPublic, setFormIsPublic] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Edit states
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editComment, setEditComment] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Lightbox
  const [activeZoomUrl, setActiveZoomUrl] = useState<string | null>(null);

  // Filter artworks
  const uniqueClassNames = Array.from(new Set(artworks.map(a => a.className).filter(Boolean)));

  const filteredArtworks = artworks.filter(art => {
    const matchesSearch = 
      (art.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
      (art.comment?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      art.studentCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClass = selectedClassFilter === "Tất cả" || art.className === selectedClassFilter;

    return matchesSearch && matchesClass;
  });

  const itemsPerPage = 12; // Grid view fits nicely with 12 items (3 columns)
  const totalPages = Math.ceil(filteredArtworks.length / itemsPerPage);
  const paginatedArtworks = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredArtworks.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredArtworks, currentPage]);

  // Notification Modal State
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

  // Load classes and session
  useEffect(() => {
    async function loadData() {
      try {
        const sessionData = await cmsApi.auth.getSession();
        setSession(sessionData);

        let fetchedClasses: any[] = [];
        if (sessionData.user?.role === "ADMIN") {
          const data = await cmsApi.classes.list();
          fetchedClasses = data.classes || [];
        } else {
          const data = await cmsApi.classes.listForTeacher();
          fetchedClasses = data.classes || [];
        }
        setClasses(fetchedClasses);
      } catch (err) {
        console.error("Failed to load initial data:", err);
      } finally {
        setLoadingSession(false);
      }
    }
    loadData();
  }, []);

  // Fetch artworks
  const fetchArtworks = async () => {
    setLoadingArtworks(true);
    try {
      const data = await cmsApi.artworks.list();
      setArtworks(data.artworks || []);
    } catch (err) {
      console.error("Failed to load artworks:", err);
    } finally {
      setLoadingArtworks(false);
    }
  };

  useEffect(() => {
    if (!loadingSession && session) {
      fetchArtworks();
    }
  }, [loadingSession, session]);

  // Load students when selectedClassId changes
  useEffect(() => {
    if (selectedClassId) {
      const loadStudents = async () => {
        setLoadingStudents(true);
        try {
          const data = await cmsApi.students.list(selectedClassId);
          setStudents(data.students || []);
          setSelectedStudentId("");
        } catch (err) {
          console.error("Failed to load students for class:", err);
        } finally {
          setLoadingStudents(false);
        }
      };
      loadStudents();
    } else {
      setStudents([]);
      setSelectedStudentId("");
    }
  }, [selectedClassId]);

  // Image parsing
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotification("Định dạng không hợp lệ", "Vui lòng chọn một tệp hình ảnh (PNG, JPG, WebP).", "info");
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Artwork
  const handleUploadArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedStudentId || !imagePreview) {
      showNotification("Thiếu thông tin", "Vui lòng chọn lớp học, học sinh và tải ảnh lên.", "info");
      return;
    }

    const studentObj = students.find(s => s.id === selectedStudentId);
    const classObj = classes.find(c => c.id === selectedClassId);
    
    if (!studentObj || !studentObj.studentCode) {
      showNotification("Lỗi học sinh", "Học sinh được chọn chưa có mã học viên. Vui lòng kiểm tra lại.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await cmsApi.artworks.create({
        studentCode: studentObj.studentCode,
        imageUrl: imagePreview,
        title: formTitle.trim() || `Tranh của bé ${studentObj.studentName}`,
        comment: formComment.trim() || "Bé vẽ tranh rất đẹp và chăm chỉ!",
        className: classObj?.name || "Lớp vẽ",
        teacherName: session?.user?.name || "Giáo viên",
        isPublic: formIsPublic
      });

      showNotification("Thành công", "Đã lưu tác phẩm của con và nhận xét thành công.", "success");
      setFormTitle("");
      setFormComment("");
      setFormIsPublic(false);
      setImageFile(null);
      setImagePreview("");
      setSelectedStudentId("");
      fetchArtworks();
    } catch (err: any) {
      console.error("Failed to upload artwork:", err);
      showNotification("Lỗi tải lên", err.message || "Không thể upload tác phẩm vẽ.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Artwork
  const handleDeleteArtwork = (id: string, title: string) => {
    showNotification(
      "Xác nhận xóa tranh",
      `Bạn có chắc chắn muốn xóa bức tranh "${title}"? Hành động này sẽ xóa tranh vĩnh viễn khỏi cổng theo dõi của phụ huynh.`,
      "confirm",
      undefined,
      async () => {
        try {
          await cmsApi.artworks.delete(id);
          showNotification("Thành công", "Đã xóa tác phẩm vẽ khỏi hệ thống.", "success");
          fetchArtworks();
        } catch (err: any) {
          console.error("Failed to delete artwork:", err);
          showNotification("Lỗi xóa tranh", err.message || "Không thể xóa tranh vẽ này.", "error");
        }
      }
    );
  };

  // Open Edit Dialog
  const handleOpenEdit = (art: Artwork) => {
    setEditingArtwork(art);
    setEditTitle(art.title || "");
    setEditComment(art.comment || "");
    setEditIsPublic(art.isPublic || false);
    setIsEditOpen(true);
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArtwork) return;

    setEditSubmitting(true);
    try {
      await cmsApi.artworks.update(editingArtwork.id, {
        title: editTitle.trim(),
        comment: editComment.trim(),
        isPublic: editIsPublic
      });
      showNotification("Thành công", "Đã cập nhật tiêu đề và nhận xét thành công.", "success");
      setIsEditOpen(false);
      setEditingArtwork(null);
      fetchArtworks();
    } catch (err: any) {
      console.error("Failed to update artwork:", err);
      showNotification("Lỗi cập nhật", err.message || "Không thể cập nhật thông tin tranh.", "error");
    } finally {
      setEditSubmitting(false);
    }
  };

  if (loadingSession) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        <p className="mt-4 font-bold text-gray-600">Đang tải cấu hình triển lãm...</p>
      </div>
    );
  }

  const user = session?.user;
  if (!user || user.role === "ASSISTANT") {
    return (
      <div className="border-4 border-black bg-white rounded-3xl p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto my-12">
        <span className="text-6xl mb-4 block">🚫</span>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h1>
        <p className="text-gray-600">Trang này không khả dụng đối với vai trò của bạn.</p>
      </div>
    );
  }



  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-4 border-black bg-white rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            🎨 Triển Lãm & Nhận Xét Tranh Vẽ
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Lưu giữ những tác phẩm tranh của học viên, viết nhận xét của thầy cô và cấp mã cho phụ huynh cùng xem trực tuyến
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Left Panel: Upload Form */}
        <div className="border-4 border-black bg-[#fff9ed] rounded-3xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 h-fit">
          <h3 className="text-base font-black text-black border-b-2 border-black pb-2 flex items-center gap-1.5">
            <Palette className="w-5 h-5 text-amber-500" /> Tải lên tác phẩm mới
          </h3>

          <form onSubmit={handleUploadArtwork} className="space-y-4">
            
            {/* Class selection */}
            <div className="space-y-1">
              <label className="block text-xs font-black text-gray-800">Lớp học *</label>
              <CustomSelect
                value={selectedClassId}
                onChange={(val) => setSelectedClassId(val)}
                placeholder="-- Chọn lớp học --"
                options={classes.map((c) => ({ value: c.id, label: c.name }))}
              />
            </div>

            {/* Student selection */}
            <div className="space-y-1">
              <label className="block text-xs font-black text-gray-800">Học sinh *</label>
              <CustomSelect
                value={selectedStudentId}
                onChange={(val) => setSelectedStudentId(val)}
                placeholder={loadingStudents ? "Đang tải học sinh..." : "-- Chọn học sinh --"}
                options={students.map((s) => ({ value: s.id, label: `${s.studentName} (${s.studentCode || "Chưa có mã"})` }))}
                className={!selectedClassId || loadingStudents ? "opacity-50 pointer-events-none" : ""}
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-1">
              <label className="block text-xs font-black text-gray-800">Ảnh tranh vẽ *</label>
              <div className="border-3 border-dashed border-black rounded-2xl p-4 bg-white text-center relative hover:bg-gray-50/50 cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[140px]">
                {imagePreview ? (
                  <div className="relative w-full h-[150px] rounded-xl overflow-hidden border-2 border-black">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                      }}
                      className="absolute top-1.5 right-1.5 bg-rose-400 border border-black hover:bg-rose-500 text-black rounded-full p-1 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Image className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-[11px] font-bold text-gray-500">Chọn file ảnh (.png, .jpg, .webp)</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="block text-xs font-black text-gray-800">Tên tranh</label>
              <input
                type="text"
                placeholder="Ví dụ: Hoàng hôn trên biển"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full border-3 border-black rounded-xl p-2.5 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Comment */}
            <div className="space-y-1">
              <label className="block text-xs font-black text-gray-800">Nhận xét của thầy cô</label>
              <textarea
                rows={4}
                placeholder="Bé phối màu sắc rất rực rỡ, đường nét gọn gàng tự tin..."
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                className="w-full border-3 border-black rounded-xl p-2.5 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
            </div>

            {/* Public checkbox */}
            <div className="py-1">
              <CustomCheckbox
                checked={formIsPublic}
                onChange={(checked) => setFormIsPublic(checked)}
                label="Công khai tranh vẽ trên Triển lãm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 border-3 border-black bg-[#baffc9] hover:bg-[#a3e9b3] rounded-xl text-xs font-black transition-all shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu tác phẩm...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Lưu & Đăng Triển Lãm
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Panel: Artwork List & Search */}
        <div className="border-4 border-black bg-white rounded-3xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] xl:col-span-2 space-y-4">
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b-2 border-black/10 pb-4">
            <h3 className="text-base font-black text-black flex items-center gap-1.5">
              🖼️ Thư viện tranh vẽ ({filteredArtworks.length})
            </h3>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Mã học viên, nhận xét..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-2 py-1.5 border-2 border-black rounded-xl text-xs font-bold bg-white w-[180px] focus:outline-none"
                />
              </div>

              <CustomSelect
                value={selectedClassFilter}
                onChange={(val) => setSelectedClassFilter(val)}
                className="w-48 text-xs shrink-0"
                options={[
                  { value: "Tất cả", label: "Lớp: Tất cả" },
                  ...uniqueClassNames.map(cn => ({ value: cn!, label: cn! }))
                ]}
              />
            </div>
          </div>

          {/* Grid Layout of Polaroid style artwork cards */}
          {loadingArtworks ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
              <p className="mt-2 text-xs font-bold text-gray-500">Đang tải thư viện tranh...</p>
            </div>
          ) : filteredArtworks.length === 0 ? (
            <p className="text-sm text-gray-400 font-bold italic py-10 text-center">Chưa có tranh vẽ nào được đăng tải.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {paginatedArtworks.map((art) => (
                <div 
                  key={art.id}
                  className="border-3 border-black bg-white rounded-lg p-3.5 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Drawing Image container */}
                    <div className="border-2 border-black rounded-md overflow-hidden relative group/img aspect-video bg-gray-50 flex items-center justify-center">
                      <img 
                        src={getImageUrl(art.imageUrl)} 
                        alt={art.title || "Drawing"}
                        className="w-full h-full object-cover rounded-xl border border-black/10"
                      />
                      {/* Zoom action layer */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setActiveZoomUrl(getImageUrl(art.imageUrl))}
                          className="p-2 bg-white border border-black rounded-full hover:bg-gray-100 transition-all text-black shadow-md cursor-pointer"
                          title="Phóng to ảnh"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata details */}
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-black text-gray-900 text-sm line-clamp-1">{art.title}</h4>
                        <div className="flex gap-1 items-center shrink-0">
                          {art.isPublic && (
                            <span className="bg-emerald-100 border border-emerald-300 rounded px-1.5 py-0.5 text-[9px] font-black text-emerald-700 whitespace-nowrap">
                              Công khai
                            </span>
                          )}
                          <span className="bg-purple-100 border border-purple-300 rounded px-1.5 py-0.5 text-[9px] font-black text-purple-700 whitespace-nowrap">
                            {art.studentCode}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-2 text-[10px] text-gray-500 font-semibold mt-1">
                        <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3 text-sky-500" /> {new Date(art.date).toLocaleDateString("vi-VN")}</span>
                        <span className="flex items-center gap-0.5"><User className="w-3 h-3 text-emerald-500" /> {art.className}</span>
                      </div>
                    </div>

                    {/* Feedback comment block */}
                    {art.comment && (
                      <div className="border border-black/10 rounded-lg p-2.5 bg-gray-50/50 text-xs font-semibold text-gray-600 italic leading-relaxed">
                        &ldquo;{art.comment}&rdquo;
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-3.5 border-t border-black/10 text-[10px] font-bold text-gray-400">
                    <span>Thầy cô: {art.teacherName}</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(art)}
                        className="p-1 border-2 border-black bg-amber-100 hover:bg-amber-200 rounded text-gray-700 transition-all cursor-pointer"
                        title="Chỉnh sửa nhận xét"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteArtwork(art.id, art.title || "Tác phẩm")}
                        className="p-1 border-2 border-black bg-rose-100 hover:bg-rose-200 rounded text-rose-700 transition-all cursor-pointer"
                        title="Xóa tranh"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
            </>
          )}
        </div>
      </div>

      {/* MODAL: EDIT ARTWORK DIALOG */}
      {isEditOpen && editingArtwork && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[99999] overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border-4 border-black rounded-[30px_10px_25px_10px/10px_25px_10px_30px] max-w-md w-full p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => {
                setIsEditOpen(false);
                setEditingArtwork(null);
              }}
              className="absolute top-4 right-4 bg-[#ffaaa6] hover:bg-[#ff8b94] border-2 border-black rounded-full p-1 transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] bg-amber-100 border-2 border-black rounded px-2 py-0.5 font-black text-amber-800 uppercase tracking-wider">
                Chỉnh sửa Nhận Xét
              </span>
              <h4 className="text-xl font-black text-black mt-2 leading-tight">
                Cập Nhật Thông Tin Tác Phẩm
              </h4>
            </div>

            <hr className="my-3 border-t-2 border-black/10 border-dashed" />

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-black">Tiêu đề tranh vẽ</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tiêu đề..."
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border-3 border-black rounded-xl p-2.5 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-black">Nhận xét của giáo viên</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Nhập nhận xét..."
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full border-3 border-black rounded-xl p-2.5 text-xs font-bold bg-white focus:outline-none"
                />
              </div>

              {/* Public checkbox */}
              <div className="py-1">
                <CustomCheckbox
                  checked={editIsPublic}
                  onChange={(checked) => setEditIsPublic(checked)}
                  label="Công khai tranh vẽ trên Triển lãm"
                />
              </div>

              <div className="pt-2 border-t-2 border-black/10 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingArtwork(null);
                  }}
                  className="px-4 py-2 border-2 border-black bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 border-2 border-black bg-amber-300 hover:bg-amber-400 rounded-lg text-xs font-black transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  {editSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* LIGHTBOX POPUP */}
      {activeZoomUrl && createPortal(
        <div 
          onClick={() => setActiveZoomUrl(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[999999] cursor-zoom-out animate-in fade-in duration-200"
        >
          <div className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <img 
              src={getImageUrl(activeZoomUrl)} 
              alt="Zoomed Drawing" 
              className="max-w-full max-h-full object-contain border-4 border-white rounded shadow-2xl animate-in zoom-in-95 duration-200"
            />
            <button 
              onClick={() => setActiveZoomUrl(null)}
              className="absolute top-0 right-0 md:-top-10 md:-right-10 bg-white border-2 border-black text-black rounded-full p-2 hover:bg-gray-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
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

    </div>
  );
}
