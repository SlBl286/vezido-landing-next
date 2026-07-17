import { useState, useRef, useEffect, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface CustomDateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  placeholder?: string;
  className?: string;
}

export const CustomDateRangePicker = ({
  value,
  onChange,
  placeholder = "Chọn khoảng thời gian...",
  className,
}: CustomDateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Local temporary selection state to avoid firing events on half-selected range
  const [tempStart, setTempStart] = useState<Date | null>(value.start);
  const [tempEnd, setTempEnd] = useState<Date | null>(value.end);

  // Base month date displayed in left panel
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    return value.start ? new Date(value.start.getFullYear(), value.start.getMonth(), 1) : new Date();
  });

  // Sync with value changes when popup opens
  useEffect(() => {
    if (isOpen) {
      setTempStart(value.start);
      setTempEnd(value.end);
      if (value.start) {
        setCurrentMonthDate(new Date(value.start.getFullYear(), value.start.getMonth(), 1));
      }
    }
  }, [isOpen, value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const nextMonthDate = useMemo(() => {
    return new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1);
  }, [currentMonthDate]);

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };

  const isSameDay = (d1: Date | null, d2: Date | null) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };

  const isBetween = (d: Date, start: Date | null, end: Date | null) => {
    if (!start || !end) return false;
    const time = d.getTime();
    const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    return time > startTime && time < endTime;
  };

  const handleDayClick = (dayDate: Date) => {
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dayDate);
      setTempEnd(null);
    } else {
      // tempStart exists, tempEnd is null
      if (dayDate < tempStart) {
        setTempStart(dayDate);
      } else {
        setTempEnd(dayDate);
      }
    }
  };

  const handleApply = () => {
    onChange({ start: tempStart, end: tempEnd });
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStart(null);
    setTempEnd(null);
    onChange({ start: null, end: null });
    setIsOpen(false);
  };

  const formatDate = (d: Date | null) => {
    if (!d) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getDaysInMonthArray = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Monday start index: 0=Mon, 1=Tue, ..., 6=Sun
    const offset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const result = [];
    // Padding days
    for (let i = 0; i < offset; i++) {
      result.push(null);
    }
    // Month days
    for (let d = 1; d <= daysInMonth; d++) {
      result.push(new Date(year, month, d));
    }
    return result;
  };

  const renderCalendar = (monthDate: Date) => {
    const monthLabel = monthDate.toLocaleString("vi-VN", { month: "long", year: "numeric" });
    const capitalizedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
    const days = getDaysInMonthArray(monthDate);
    const weekdayHeaders = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

    return (
      <div className="flex-1 min-w-[260px]">
        <div className="text-center font-black text-sm text-black mb-3 border-b-2 border-black pb-1.5">
          {capitalizedMonthLabel}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black text-gray-500 mb-1">
          {weekdayHeaders.map((h, i) => (
            <div key={i}>{h}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="h-8" />;

            const isStart = isSameDay(day, tempStart);
            const isEnd = isSameDay(day, tempEnd);
            const inRange = isBetween(day, tempStart, tempEnd);
            const isCurrent = isToday(day);

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleDayClick(day)}
                className={cn(
                  "h-8 w-8 text-xs font-black rounded-lg border border-transparent transition-all cursor-pointer flex items-center justify-center relative",
                  isCurrent && "border-black border-dashed",
                  inRange && "bg-[#e3f2fd] text-blue-900",
                  isStart && "bg-[#ffd275] text-black border-2 border-black shadow-[1px_1px_0px_rgba(0,0,0,1)]",
                  isEnd && "bg-[#a8e6cf] text-black border-2 border-black shadow-[1px_1px_0px_rgba(0,0,0,1)]",
                  !isStart && !isEnd && !inRange && "hover:bg-stone-100 hover:border-black text-gray-800"
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const displayString = useMemo(() => {
    if (value.start && value.end) {
      return `${formatDate(value.start)} - ${formatDate(value.end)}`;
    }
    if (value.start) {
      return `Từ ${formatDate(value.start)}`;
    }
    return placeholder;
  }, [value, placeholder]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border-3 border-black rounded-xl p-2.5 bg-white font-bold text-gray-950 text-left shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer text-sm"
      >
        <span className="truncate flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-black shrink-0" />
          {displayString}
        </span>
        {value.start && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-0.5 hover:bg-stone-100 rounded-full border border-transparent hover:border-black transition-all"
          >
            <X className="w-3.5 h-3.5 text-black" />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-[#fefaf0] border-3 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col p-4 w-[290px] md:w-[600px] left-0 md:left-auto right-0 animate-in fade-in slide-in-from-top-1 duration-100">
          {/* Calendar navigation */}
          <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 border-2 border-black rounded-lg bg-white shadow-[1px_1px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none active:translate-x-0 active:translate-y-0 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-black" />
            </button>
            <span className="font-extrabold text-xs text-gray-700">Chọn ngày bắt đầu & kết thúc</span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 border-2 border-black rounded-lg bg-white shadow-[1px_1px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none active:translate-x-0 active:translate-y-0 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-black" />
            </button>
          </div>

          {/* Calendars body (Responsive: 1 col on mobile, 2 cols on desktop) */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Month */}
            {renderCalendar(currentMonthDate)}
            {/* Right Month (Hidden on mobile) */}
            <div className="hidden md:block flex-1">{renderCalendar(nextMonthDate)}</div>
          </div>

          {/* Actions footer */}
          <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t-2 border-black">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-xs font-black border-2 border-black rounded-xl bg-white hover:bg-stone-50 cursor-pointer active:translate-y-[0.5px]"
            >
              Hủy / Xóa
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 text-xs font-black border-2 border-black rounded-xl bg-[#a8e6cf] hover:bg-[#96d8c0] shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none active:translate-x-0 active:translate-y-0 cursor-pointer"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
