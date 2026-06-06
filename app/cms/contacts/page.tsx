"use client";

import { useEffect, useState } from "react";
import {
  Phone, Mail, MessageSquare, CheckCircle2, Clock, XCircle,
  RefreshCw, Trash2, ChevronDown, User
} from "lucide-react";

interface Submission {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  status: string;
  note: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  NEW:       { label: "Mới",         color: "bg-amber-100 text-amber-800 border-amber-400",   icon: <Clock className="w-3 h-3" /> },
  CONTACTED: { label: "Đã liên hệ", color: "bg-sky-100 text-sky-800 border-sky-400",          icon: <CheckCircle2 className="w-3 h-3" /> },
  CLOSED:    { label: "Đã đóng",    color: "bg-gray-100 text-gray-600 border-gray-400",        icon: <XCircle className="w-3 h-3" /> },
};

export default function ContactsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const fetchData = async (status = statusFilter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contact?status=${status}`);
      const data = await res.json();
      setSubmissions(data.submissions || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/contact?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchData();
  };

  const saveNote = async (id: string) => {
    await fetch(`/api/contact?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: notes[id] || "" }),
    });
    fetchData();
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm("Xoá liên hệ này?")) return;
    setDeletingId(id);
    await fetch(`/api/contact?id=${id}`, { method: "DELETE" });
    fetchData();
    setDeletingId(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-amber-500" />
            Quản lý liên hệ
          </h1>
          <p className="text-sm font-semibold text-gray-500 mt-0.5">
            {total} tin nhắn từ phụ huynh gửi qua website
          </p>
        </div>
        <button
          onClick={() => fetchData()}
          className="flex items-center gap-2 border-2 border-black bg-white px-4 py-2 rounded-xl text-sm font-bold shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:bg-gray-50 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["ALL", "NEW", "CONTACTED", "CLOSED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-xl border-2 border-black text-xs font-black shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all cursor-pointer ${
              statusFilter === s
                ? "bg-black text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {s === "ALL" ? "Tất cả" : STATUS_LABELS[s].label}
          </button>
        ))}
      </div>

      {/* Cards List */}
      {loading ? (
        <div className="py-20 flex items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
          <span className="font-bold text-gray-500">Đang tải dữ liệu...</span>
        </div>
      ) : submissions.length === 0 ? (
        <div className="py-16 text-center border-3 border-dashed border-gray-300 rounded-2xl">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="font-black text-gray-400">Chưa có liên hệ nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const statusInfo = STATUS_LABELS[sub.status] || STATUS_LABELS["NEW"];
            const isExpanded = expandedId === sub.id;
            return (
              <div
                key={sub.id}
                className={`border-3 border-black bg-white rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)] overflow-hidden transition-all ${
                  sub.status === "NEW" ? "border-amber-400" : ""
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-4 p-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-amber-100 border-2 border-black rounded-xl flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-amber-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-gray-900 text-sm">{sub.name}</h3>
                        <span className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-full text-[10px] font-black ${statusInfo.color}`}>
                          {statusInfo.icon}{statusInfo.label}
                        </span>
                        {sub.status === "NEW" && (
                          <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">MỚI</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs font-semibold text-gray-500">
                        <a href={`tel:${sub.phone}`} className="flex items-center gap-1 text-sky-600 hover:underline">
                          <Phone className="w-3 h-3" />{sub.phone}
                        </a>
                        {sub.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />{sub.email}
                          </span>
                        )}
                        <span>{new Date(sub.createdAt).toLocaleString("vi-VN")}</span>
                      </div>
                      <p className="text-xs text-gray-600 font-semibold mt-1.5 line-clamp-2">
                        💬 {sub.message}
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                      className="p-2 border-2 border-black rounded-lg bg-white hover:bg-gray-50 shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                    <button
                      onClick={() => deleteSubmission(sub.id)}
                      disabled={deletingId === sub.id}
                      className="p-2 border-2 border-red-400 rounded-lg bg-white hover:bg-red-50 shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Expanded Panel */}
                {isExpanded && (
                  <div className="border-t-2 border-black/10 bg-gray-50 p-4 space-y-4">
                    {/* Full message */}
                    <div>
                      <p className="text-xs font-black text-gray-600 uppercase mb-1">Nội dung đầy đủ:</p>
                      <p className="text-sm font-semibold text-gray-700 leading-relaxed bg-white border-2 border-black rounded-xl p-3">
                        {sub.message}
                      </p>
                    </div>

                    {/* Status change */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-xs font-black text-gray-600 uppercase">Cập nhật trạng thái:</p>
                      {["NEW", "CONTACTED", "CLOSED"].map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(sub.id, s)}
                          className={`px-3 py-1.5 rounded-lg border-2 border-black text-[11px] font-black shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all cursor-pointer ${
                            sub.status === s ? "bg-black text-white" : "bg-white hover:bg-gray-100"
                          }`}
                        >
                          {STATUS_LABELS[s].label}
                        </button>
                      ))}
                    </div>

                    {/* Admin note */}
                    <div className="space-y-2">
                      <p className="text-xs font-black text-gray-600 uppercase">Ghi chú nội bộ:</p>
                      <textarea
                        rows={2}
                        defaultValue={sub.note || ""}
                        onChange={(e) => setNotes(prev => ({ ...prev, [sub.id]: e.target.value }))}
                        placeholder="Thêm ghi chú về liên hệ này..."
                        className="w-full border-2 border-black rounded-xl p-3 text-xs font-semibold resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      />
                      <button
                        onClick={() => saveNote(sub.id)}
                        className="px-4 py-1.5 bg-amber-300 hover:bg-amber-400 border-2 border-black rounded-lg text-xs font-black shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                      >
                        💾 Lưu ghi chú
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
