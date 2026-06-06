  "use client";

import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertTriangle, Info, HelpCircle } from "lucide-react";
import { createPortal } from "react-dom";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: "success" | "error" | "info" | "confirm";
  onConfirm?: () => void;
}

export function NotificationModal({
  isOpen,
  onClose,
  title,
  message,
  type,
  onConfirm
}: NotificationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen) return null;
  if (!mounted) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-12 h-12 text-emerald-500 shrink-0" />;
      case "error":
        return <AlertTriangle className="w-12 h-12 text-rose-500 shrink-0" />;
      case "confirm":
        return <HelpCircle className="w-12 h-12 text-amber-500 shrink-0" />;
      default:
        return <Info className="w-12 h-12 text-sky-500 shrink-0" />;
    }
  };

  const getHeaderBg = () => {
    switch (type) {
      case "success":
        return "bg-emerald-50";
      case "error":
        return "bg-rose-50";
      case "confirm":
        return "bg-amber-50";
      default:
        return "bg-sky-50";
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[99999] overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border-4 border-black rounded-[25px_10px_20px_10px/10px_20px_10px_25px] max-w-sm w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header decoration */}
        <div className={`p-6 border-b-3 border-black flex items-center justify-center ${getHeaderBg()}`}>
          {getIcon()}
        </div>

        {/* Content */}
        <div className="p-5 text-center">
          <h4 className="text-lg font-black text-black mb-2">{title}</h4>
          <p className="text-gray-600 text-sm font-semibold">{message}</p>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t-3 border-black bg-gray-50 flex gap-2 justify-end">
          {type === "confirm" ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 rounded-lg text-xs font-bold transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onConfirm) onConfirm();
                  onClose();
                }}
                className="px-4 py-2 border-2 border-black bg-amber-300 hover:bg-amber-400 rounded-lg text-xs font-black transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                Xác nhận
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border-2 border-black bg-sky-200 hover:bg-sky-300 rounded-lg text-xs font-black transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
