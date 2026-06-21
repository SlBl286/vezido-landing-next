"use client";

import React, { useState, useMemo } from "react";
import { 
  Baby, Calendar, PaintBucket, Star, Award, 
  CheckCircle2, BookOpen, Search, ArrowRight 
} from "lucide-react";
import Link from "next/link";

interface PricingClientProps {
  courses: any[];
  categories: any[];
}

export default function PricingClient({ courses, categories }: PricingClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("ALL");
  
  // Track active tab for each course card: "objectives" | "curriculum" | "benefits"
  const [courseTabs, setCourseTabs] = useState<Record<string, "objectives" | "curriculum" | "benefits">>({});

  // Get active tab for a course
  const getCourseTab = (courseId: string) => {
    return courseTabs[courseId] || "objectives";
  };

  // Set active tab for a course
  const setCourseTab = (courseId: string, tab: "objectives" | "curriculum" | "benefits") => {
    setCourseTabs(prev => ({
      ...prev,
      [courseId]: tab
    }));
  };

  // Neobrutalism style generator based on index
  const getCourseStyle = (idx: number) => {
    const styles = [
      { color: "bg-[#bae1ff]", textColor: "text-sky-900", icon: Baby, border: "border-sky-500" },
      { color: "bg-[#baffc9]", textColor: "text-emerald-900", icon: Star, border: "border-emerald-500" },
      { color: "bg-[#ffaaa6]", textColor: "text-rose-900", icon: Award, border: "border-rose-500" },
      { color: "bg-[#ffffba]", textColor: "text-amber-900", icon: PaintBucket, border: "border-amber-500" }
    ];
    return styles[idx % styles.length];
  };

  // Filter courses based on category selector and search input
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesSearch = 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.audience && c.audience.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.level && c.level.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = 
        selectedCategoryId === "ALL" || 
        c.classCategoryId === selectedCategoryId;

      return matchesSearch && matchesCategory;
    });
  }, [courses, searchTerm, selectedCategoryId]);

  // Group filtered courses by category name
  const groupedCourses = useMemo(() => {
    const map: Record<string, any[]> = {};
    filteredCourses.forEach(c => {
      const catName = c.classCategory?.name || "Chưa phân loại";
      if (!map[catName]) {
        map[catName] = [];
      }
      map[catName].push(c);
    });
    return map;
  }, [filteredCourses]);

  return (
    <div className="space-y-10">
      
      {/* SEARCH AND CATEGORY FILTER ROW */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white border-4 border-black rounded-3xl p-4 md:p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
        
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setSelectedCategoryId("ALL")}
            className={`border-2 border-black rounded-xl px-4 py-2 text-xs font-black shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all ${
              selectedCategoryId === "ALL" ? "bg-[#ffd275] text-black" : "bg-white hover:bg-stone-50"
            }`}
          >
            🌟 Tất cả lớp học
          </button>
          
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`border-2 border-black rounded-xl px-4 py-2 text-xs font-black shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer transition-all ${
                selectedCategoryId === cat.id ? "bg-[#a8e6cf] text-black" : "bg-white hover:bg-stone-50"
              }`}
            >
              🏷️ {cat.name}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Tìm lớp học, chất liệu vẽ..."
            className="w-full border-3 border-black rounded-xl pl-10 pr-4 py-2 bg-gray-50 font-bold text-xs focus:outline-none focus:bg-white transition-colors"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        </div>

      </div>

      {/* DYNAMIC LISTINGS */}
      {Object.keys(groupedCourses).length === 0 ? (
        <div className="border-4 border-dashed border-black/10 bg-white rounded-3xl p-16 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-black text-lg">Không tìm thấy khóa học nào phù hợp</p>
          <p className="text-gray-400 text-sm mt-1">Vui lòng nhập từ khóa tìm kiếm hoặc chọn phân loại khác.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedCourses).map(([categoryName, catCourses], catIdx) => (
            <div key={categoryName} className="space-y-6">
              
              {/* Category Section Header */}
              <div className="text-left space-y-1 border-l-4 border-black pl-4">
                <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
                  {catIdx % 2 === 0 ? "🌱" : "🎨"} {categoryName}
                </h2>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Tổng số: {catCourses.length} khóa học
                </p>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {catCourses.map((course, idx) => {
                  const style = getCourseStyle(idx + catIdx * 2);
                  const Icon = style.icon;
                  const currentTab = getCourseTab(course.id);

                  return (
                    <div 
                      key={course.id}
                      className={`border-4 border-black bg-white rounded-3xl p-5 md:p-6 flex flex-col justify-between relative shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200 min-h-[460px]`}
                    >
                      <div className="space-y-4">
                        
                        {/* Card Header (Category & Level badges) */}
                        <div className="flex justify-between items-start">
                          <div className="flex flex-wrap gap-1.5">
                            <span className={`inline-block text-[9px] ${style.color} ${style.textColor} border-2 border-black px-2 py-0.5 rounded font-black uppercase tracking-wide`}>
                              {course.title}
                            </span>
                            {course.level && (
                              <span className="inline-block text-[9px] bg-[#ffd275] border-2 border-black px-2 py-0.5 rounded font-black uppercase tracking-wide text-amber-950">
                                ⚡ {course.level}
                              </span>
                            )}
                          </div>
                          <Icon className="w-5 h-5 text-gray-400 shrink-0" />
                        </div>

                        {/* General Quick Info */}
                        <div className="space-y-1 text-xs font-semibold text-gray-600 bg-gray-50 border-2 border-black/10 rounded-xl p-3">
                          <p><strong className="font-extrabold text-black">🎯 Đối tượng:</strong> {course.audience}</p>
                          <p><strong className="font-extrabold text-black">⏱️ Thời lượng:</strong> {course.duration ? (String(course.duration).includes("buổi") ? course.duration : `${course.duration} buổi`) : ""}</p>
                          <p>
                            <strong className="font-extrabold text-black">💰 Học phí:</strong>{" "}
                            <span className="font-black text-gray-900 text-sm">
                              {course.fee?.toLocaleString("vi-VN")} đ
                            </span>
                            <span className="text-[10px] text-gray-400">/{course.feeUnit}</span>
                            {course.feeNote && <span className="text-[10px] text-gray-500 italic font-extrabold ml-1">({course.feeNote})</span>}
                          </p>
                        </div>

                        {/* COMPACT INTERNAL TABS SYSTEM */}
                        <div className="border-2 border-black rounded-xl overflow-hidden bg-white">
                          
                          {/* Inner Tabs Head */}
                          <div className="grid grid-cols-3 border-b-2 border-black bg-stone-50 text-[10px] font-black text-center text-gray-700">
                            <button
                              type="button"
                              onClick={() => setCourseTab(course.id, "objectives")}
                              className={`py-2 border-r-2 border-black transition-colors cursor-pointer ${
                                currentTab === "objectives" ? "bg-[#bae1ff] text-black" : "hover:bg-gray-100"
                              }`}
                            >
                              🎯 Mục tiêu
                            </button>
                            <button
                              type="button"
                              onClick={() => setCourseTab(course.id, "curriculum")}
                              className={`py-2 border-r-2 border-black transition-colors cursor-pointer ${
                                currentTab === "curriculum" ? "bg-[#baffc9] text-black" : "hover:bg-gray-100"
                              }`}
                            >
                              📋 Lộ trình
                            </button>
                            <button
                              type="button"
                              onClick={() => setCourseTab(course.id, "benefits")}
                              className={`py-2 transition-colors cursor-pointer ${
                                currentTab === "benefits" ? "bg-[#ffb3ba] text-black" : "hover:bg-gray-100"
                              }`}
                            >
                              🎁 Ưu đãi
                            </button>
                          </div>

                          {/* Inner Tabs Content Area */}
                          <div className="p-3.5 max-h-36 overflow-y-auto text-xs font-semibold text-gray-600 leading-relaxed bg-white">
                            
                            {/* Tab 1: Objectives */}
                            {currentTab === "objectives" && (
                              <div className="space-y-1.5 animate-in fade-in duration-100">
                                {course.objectives && course.objectives.length > 0 ? (
                                  <ul className="space-y-1">
                                    {course.objectives.map((obj: string, i: number) => (
                                      <li key={i} className="flex items-start gap-1.5 text-left">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>{obj}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-gray-400 italic">Chưa có thông tin mục tiêu.</p>
                                )}
                              </div>
                            )}

                            {/* Tab 2: Curriculum / Content */}
                            {currentTab === "curriculum" && (
                              <div className="space-y-2 animate-in fade-in duration-100">
                                {course.content && course.content.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {course.content.map((lesson: string, i: number) => (
                                      <div key={i} className="flex items-start gap-2 bg-gray-50 border border-black/10 rounded-lg p-2 text-[11px] font-semibold text-gray-700">
                                        <span className="bg-[#ffd275] border border-black rounded px-1 text-[8px] font-black text-black shrink-0 mt-0.5">
                                          Bài {i + 1}
                                        </span>
                                        <span>{lesson}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-400 italic">Chưa có thông tin lộ trình.</p>
                                )}
                              </div>
                            )}

                            {/* Tab 3: Benefits */}
                            {currentTab === "benefits" && (
                              <div className="space-y-1.5 animate-in fade-in duration-100 text-purple-950">
                                {course.benefits && course.benefits.length > 0 ? (
                                  <ul className="space-y-1">
                                    {course.benefits.map((ben: string, i: number) => (
                                      <li key={i} className="flex items-center gap-1.5 font-bold">
                                        <span>✨</span>
                                        <span>{ben}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-gray-400 italic">Được tặng họa cụ miễn phí 100% tại lớp vẽ!</p>
                                )}
                              </div>
                            )}

                          </div>
                        </div>

                      </div>

                      {/* Card Action Button */}
                      <div className="pt-4 border-t border-black/10 mt-4">
                        <Link 
                          href={`/enroll?course=${encodeURIComponent(course.title)}`}
                          className={`block w-full py-3 text-center font-black rounded-xl border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:bg-[#ffc342] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none bg-[#ffd275] text-black text-xs transition-all`}
                        >
                          Đăng Ký Học Thử Miễn Phí
                        </Link>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
