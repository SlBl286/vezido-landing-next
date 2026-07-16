"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Search, Calendar, User, CheckCircle2, AlertCircle, RefreshCw, X, Layers, Eye, BookOpen, Heart, Landmark, Award, Palette
} from "lucide-react";
import { createPortal } from "react-dom";
import { getImageUrl } from "@/lib/utils";

interface StudentClassInfo {
  id: string;
  name: string;
  schedule: string;
  room: string;
  teacherName: string;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
}

interface StudentInfo {
  studentCode: string;
  studentName: string;
  studentAge: number;
  parentName: string;
  parentPhone: string;
  classes: StudentClassInfo[];
  attendance: AttendanceStats;
}

interface Artwork {
  id: string;
  studentCode: string;
  imageUrl: string;
  title: string | null;
  comment: string | null;
  teacherName: string | null;
  className: string | null;
  date: string;
}

function maskPhone(phone: string) {
  if (!phone) return "";
  const cleanPhone = phone.trim();
  if (cleanPhone.length <= 5) return cleanPhone;
  const firstTwo = cleanPhone.slice(0, 2);
  const lastThree = cleanPhone.slice(-3);
  const mask = "*".repeat(cleanPhone.length - 5);
  return `${firstTwo}${mask}${lastThree}`;
}

function PortfolioContent() {
  const searchParams = useSearchParams();
  const studentCodeParam = searchParams.get("studentCode");

  const [studentCode, setStudentCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  
  // Data states
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [publicArtworks, setPublicArtworks] = useState<any[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [activeZoomUrl, setActiveZoomUrl] = useState<string | null>(null);

  // Load public artworks on mount
  useEffect(() => {
    async function fetchPublicArtworks() {
      try {
        const res = await fetch("/api/cms/artworks?public=true");
        if (res.ok) {
          const data = await res.json();
          setPublicArtworks(data.artworks || []);
        }
      } catch (err) {
        console.error("Failed to fetch public artworks:", err);
      } finally {
        setLoadingPublic(false);
      }
    }
    fetchPublicArtworks();
  }, []);

  // Set mounted on client load & auto trigger search if studentCode is in URL search parameters
  useEffect(() => {
    setMounted(true);
    if (studentCodeParam) {
      const code = studentCodeParam.trim().toUpperCase();
      setStudentCode(code);
      performSearch(code);
    }
  }, [studentCodeParam]);

  const performSearch = async (queryCode: string) => {
    const cleanCode = queryCode.trim().toUpperCase();
    if (!cleanCode) {
      setError("Vui lòng nhập mã học viên");
      return;
    }

    setStudentCode(cleanCode);
    setLoading(true);
    setError("");
    setStudent(null);
    setArtworks([]);

    try {
      const res = await fetch(`/api/cms/artworks?studentCode=${encodeURIComponent(cleanCode)}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Mã học sinh không tồn tại trên hệ thống. Vui lòng kiểm tra lại hoặc liên hệ với trung tâm.");
        }
        throw new Error("Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.");
      }

      const data = await res.json();
      setStudent(data.student);
      setArtworks(data.artworks || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Không thể tìm kiếm thông tin học viên.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(studentCode);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-[#fefaf0]">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Title Header */}
        <header className="text-center max-w-2xl mx-auto space-y-4 md:space-y-5 py-6 md:py-10">
          <span className="inline-block text-xs md:text-sm bg-purple-100 border-2 border-black rounded-lg px-3 py-1.5 font-black text-purple-800 shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase tracking-wider mb-1 md:mb-2">
            Cổng thông tin phụ huynh
          </span>
          <h1 className="text-2xl md:text-5xl font-black text-gray-900 leading-tight px-1">
            Theo Dõi Học Tập & Triển Lãm Tranh
          </h1>
          <p className="text-gray-500 font-semibold text-xs md:text-sm px-2">
            Nhập mã số học viên của bé để xem thông tin lớp học, tình hình chuyên cần và thưởng thức bộ sưu tập tranh vẽ cùng nhận xét từ giáo viên.
          </p>
        </header>

        {/* Search Form Card */}
        <div className="max-w-md mx-auto border-4 border-black bg-white rounded-3xl p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-gray-800 uppercase tracking-wide">
                Mã Số Học Viên (Ví dụ: HS-1234)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Nhập mã học viên của con..."
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  className="w-full border-3 border-black rounded-xl pl-4 pr-12 py-3.5 text-base font-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-amber-300 hover:bg-amber-400 border-2 border-black rounded-lg transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50 z-10"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-rose-50 border-2 border-rose-400 text-rose-700 rounded-xl p-3 text-xs font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>

        {/* Dynamic Content Display */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center">
            <RefreshCw className="w-12 h-12 animate-spin text-amber-500" />
            <p className="mt-4 font-bold text-gray-600">Đang tìm kiếm thông tin học viên...</p>
          </div>
        )}

        {student && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
            
            {/* Left Column: Student Details & Stats */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Profile Card */}
              <div className="border-4 border-black bg-white rounded-3xl p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)] space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#ffd3b6]/35 rounded-full blur-2xl -z-10" />
                <span className="text-[9px] bg-sky-100 border-2 border-black rounded px-2 py-0.5 font-black text-sky-800 uppercase tracking-wider">
                  Học viên tích cực
                </span>
                <h2 className="text-2xl font-black text-gray-900 leading-tight">
                  {student.studentName}
                </h2>
                <div className="space-y-1.5 text-xs text-gray-600 font-semibold">
                  <p>👶 Tuổi: <span className="font-bold text-gray-900">{student.studentAge} tuổi</span></p>
                  <p>🔑 Mã số: <span className="font-black text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">{student.studentCode}</span></p>
                  <p>👩‍👦 Phụ huynh: <span className="font-bold text-gray-900">{student.parentName}</span></p>
                  <p>📞 Điện thoại: <span className="font-bold text-gray-900">{maskPhone(student.parentPhone)}</span></p>
                </div>
              </div>

              {/* Enrolled Courses Card */}
              <div className="border-4 border-black bg-white rounded-3xl p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)] space-y-4">
                <h3 className="text-base font-black text-gray-900 border-b-2 border-black pb-2 flex items-center gap-1.5">
                  <BookOpen className="w-5 h-5 text-sky-500" /> Khóa học đang tham gia
                </h3>
                <div className="space-y-3">
                  {student.classes.map((c) => (
                    <div 
                      key={c.id}
                      className="border-2 border-black bg-[#fafafa] rounded-xl p-3 space-y-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                    >
                      <h4 className="font-black text-xs text-gray-900">{c.name}</h4>
                      <div className="text-[10px] text-gray-500 font-semibold space-y-0.5">
                        <p>📅 Lịch: {c.schedule}</p>
                        <p>🏫 Phòng: {c.room}</p>
                        <p>👩‍🏫 Thầy cô: {c.teacherName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attendance Analytics */}
              <div className="border-4 border-black bg-white rounded-3xl p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)] space-y-4">
                <h3 className="text-base font-black text-gray-900 border-b-2 border-black pb-2 flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-amber-500" /> Thống kê chuyên cần
                </h3>
                
                {student.attendance.total === 0 ? (
                  <p className="text-xs text-gray-400 font-bold italic text-center py-4">Chưa có dữ liệu điểm danh.</p>
                ) : (
                  <div className="space-y-3 text-xs font-bold">
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Tổng số buổi học:</span>
                      <span className="text-gray-900 font-black">{student.attendance.total} buổi</span>
                    </div>

                    {/* Progress bars */}
                    <div className="space-y-2.5 pt-1.5">
                      {/* Present */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-emerald-600 font-black">✔️ Đi học đầy đủ</span>
                          <span>{student.attendance.present} buổi ({Math.round((student.attendance.present / student.attendance.total) * 100)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 border border-black rounded-full h-3.5 overflow-hidden">
                          <div 
                            className="bg-[#baffc9] border-r-2 border-black h-full transition-all"
                            style={{ width: `${(student.attendance.present / student.attendance.total) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Late */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-amber-600 font-black">⏰ Đi muộn</span>
                          <span>{student.attendance.late} buổi ({Math.round((student.attendance.late / student.attendance.total) * 100)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 border border-black rounded-full h-3.5 overflow-hidden">
                          <div 
                            className="bg-[#ffd275] border-r-2 border-black h-full transition-all"
                            style={{ width: `${(student.attendance.late / student.attendance.total) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Absent */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-rose-600 font-black">❌ Nghỉ học</span>
                          <span>{student.attendance.absent} buổi ({Math.round((student.attendance.absent / student.attendance.total) * 100)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 border border-black rounded-full h-3.5 overflow-hidden">
                          <div 
                            className="bg-[#ff8b94] border-r-2 border-black h-full transition-all"
                            style={{ width: `${(student.attendance.absent / student.attendance.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Polaroid Artwork Gallery */}
            <div className="lg:col-span-2 space-y-6">
              <div className="border-4 border-black bg-white rounded-3xl p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                <h3 className="text-lg font-black text-gray-900 border-b-2 border-black pb-3 mb-6 flex items-center gap-1.5">
                  <Landmark className="w-5 h-5 text-purple-500" /> Góc Triển Lãm Tác Phẩm Của Con ({artworks.length})
                </h3>

                {artworks.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-200 bg-gray-50 rounded-2xl">
                    <Palette className="w-10 h-10 text-gray-300 mx-auto mb-2.5" />
                    <p className="font-black text-gray-500 text-sm">Chưa có tác phẩm nào được cập nhật</p>
                    <p className="text-gray-400 text-xs mt-1">Thầy cô của bé sẽ sớm tải lên các tác phẩm tranh vẽ tại đây nhé!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {artworks.map((art) => (
                      <div 
                        key={art.id}
                        className="border-3 border-black bg-white rounded-lg p-3.5 shadow-[5px_5px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[7px_7px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between group"
                      >
                        <div className="space-y-3">
                          {/* Artwork Frame */}
                          <div className="border-2 border-black rounded overflow-hidden relative aspect-video bg-gray-100 flex items-center justify-center cursor-pointer">
                            <img 
                              src={getImageUrl(art.imageUrl)} 
                              alt={art.title || "Drawing"}
                              className="w-full h-full object-cover"
                            />
                            {/* Click to zoom indicator overlay */}
                            <div 
                              onClick={() => setActiveZoomUrl(getImageUrl(art.imageUrl))}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center animate-fade-in duration-200"
                            >
                              <div className="bg-white border-2 border-black rounded-full p-2 text-black shadow-md">
                                <Eye className="w-4 h-4" />
                              </div>
                            </div>
                          </div>

                          {/* Info */}
                          <div>
                            <div className="flex justify-between items-center">
                              <h4 className="font-black text-gray-900 text-sm">{art.title}</h4>
                            </div>
                            <div className="flex gap-3 text-[10px] text-gray-400 font-bold mt-1">
                              <span>📅 Ngày vẽ: {new Date(art.date).toLocaleDateString("vi-VN")}</span>
                              <span>🏫 Lớp: {art.className}</span>
                            </div>
                          </div>

                          {/* Teacher feedback text */}
                          {art.comment && (
                            <div className="border border-black/10 rounded-xl p-3 bg-amber-50/20 text-xs font-semibold text-gray-600 italic leading-relaxed relative">
                              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 absolute -top-1.5 -right-1.5" />
                              &ldquo;{art.comment}&rdquo;
                            </div>
                          )}
                        </div>

                        {/* Teacher signature */}
                        <div className="text-[10px] font-bold text-gray-400 text-right mt-3.5 pt-2 border-t border-black/10">
                          Người nhận xét: <span className="text-gray-600 font-extrabold">{art.teacherName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Public Art Exhibition Gallery */}
        {!student && !loading && (
          <div className="border-4 border-black bg-white rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] space-y-6">
            <div className="text-center space-y-3.5 md:space-y-4 max-w-lg mx-auto">
              <span className="inline-block text-[10px] bg-purple-100 border-2 border-black rounded-lg px-2.5 py-1 font-black text-purple-800 uppercase tracking-wider mb-1">
                🖼️ Triển lãm tranh vẽ sáng tạo
              </span>
              <h2 className="text-xl md:text-3xl font-black text-gray-900 leading-tight">
                Không Gian Sáng Tạo "Vẽ Zì Đó"
              </h2>
              <p className="text-gray-500 font-semibold text-xs md:text-sm px-2">
                Những tác phẩm sáng tạo đầy sắc màu của các học viên Vẽ Zì Đó.
              </p>
            </div>

            {loadingPublic ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
                <p className="text-xs font-bold text-gray-400">Đang tải triển lãm tranh...</p>
              </div>
            ) : publicArtworks.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 bg-gray-50 rounded-2xl">
                <Palette className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="font-bold text-gray-500 text-xs">Phòng triển lãm hiện đang được chuẩn bị</p>
                <p className="text-gray-400 text-[10px] mt-0.5">Các tác phẩm mới được công khai sẽ sớm xuất hiện tại đây!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
                {publicArtworks.map((art) => (
                  <div
                    key={art.id}
                    className="border-3 border-black bg-white rounded-2xl p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      {/* Artwork image container */}
                      <div className="border-2 border-black rounded-xl overflow-hidden relative aspect-video bg-gray-50 flex items-center justify-center cursor-pointer">
                        <img
                          src={getImageUrl(art.imageUrl)}
                          alt={art.title || "Drawing"}
                          className="w-full h-full object-cover"
                        />
                        {/* Zoom overlay */}
                        <div
                          onClick={() => setActiveZoomUrl(getImageUrl(art.imageUrl))}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <div className="bg-white border-2 border-black rounded-full p-1.5 text-black shadow-md">
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>

                      {/* Details info */}
                      <div className="space-y-1.5 text-left">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-black text-gray-900 text-sm line-clamp-1">
                            {art.title || "Tác phẩm chưa đặt tên"}
                          </h4>
                        </div>
                        <div className="text-[10px] font-semibold text-gray-500 space-y-0.5">
                          <p>🎨 Tác giả: <span className="font-black text-rose-500">{art.studentName}</span></p>
                          <p>🏫 Lớp học: <span className="font-extrabold text-gray-700">{art.className || "Lớp vẽ"}</span></p>
                          <p>📅 Ngày vẽ: {new Date(art.date).toLocaleDateString("vi-VN")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* LIGHTBOX PORTAL OVERLAY */}
      {mounted && activeZoomUrl && createPortal(
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
              className="absolute top-0 right-0 md:-top-10 md:-right-10 bg-white border-2 border-black text-black rounded-full p-2 hover:bg-gray-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>,
        document.body
      )}

    </main>
  );
}

export default function PublicPortfolioPage() {
  return (
    <Suspense fallback={
      <div className="py-20 flex flex-col items-center justify-center">
        <RefreshCw className="w-12 h-12 animate-spin text-amber-500" />
        <p className="mt-4 font-bold text-gray-600">Đang tải trang kết quả...</p>
      </div>
    }>
      <PortfolioContent />
    </Suspense>
  );
}
