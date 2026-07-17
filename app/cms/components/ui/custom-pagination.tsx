import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const CustomPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: CustomPaginationProps) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const siblingCount = 1;
    
    // Always include first page
    pages.push(1);
    
    const start = Math.max(2, currentPage - siblingCount);
    const end = Math.min(totalPages - 1, currentPage + siblingCount);
    
    if (start > 2) {
      pages.push("...");
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (end < totalPages - 1) {
      pages.push("...");
    }
    
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className={cn("flex items-center justify-center gap-2 mt-6 flex-wrap", className)}>
      {/* Prev Button */}
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="flex items-center justify-center p-2 border-2 border-black rounded-xl bg-white font-black text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none active:translate-x-0 active:translate-y-0 disabled:opacity-40 disabled:shadow-none disabled:pointer-events-none disabled:translate-x-0 disabled:translate-y-0 transition-all cursor-pointer h-9 w-9"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Pages Button */}
      {pages.map((p, idx) => {
        if (p === "...") {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="px-2 py-1 text-sm font-extrabold text-gray-400 select-none"
            >
              ...
            </span>
          );
        }

        const isCurrent = p === currentPage;
        return (
          <button
            key={`page-${p}`}
            type="button"
            onClick={() => onPageChange(p as number)}
            className={cn(
              "min-w-[36px] h-9 px-2 text-xs font-black border-2 border-black rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none active:translate-x-0 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center",
              isCurrent 
                ? "bg-[#ffd275] text-black" 
                : "bg-white text-gray-800 hover:bg-[#fff9ed]"
            )}
          >
            {p}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex items-center justify-center p-2 border-2 border-black rounded-xl bg-white font-black text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none active:translate-x-0 active:translate-y-0 disabled:opacity-40 disabled:shadow-none disabled:pointer-events-none disabled:translate-x-0 disabled:translate-y-0 transition-all cursor-pointer h-9 w-9"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
