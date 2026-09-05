import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

export interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  align?: "left" | "right";
  id?: string;
  name?: string;
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

export const DatePicker: React.FC<DatePickerProps> = ({
  value = "",
  onChange,
  placeholder = "Select date",
  min,
  max,
  disabled = false,
  required = false,
  className = "",
  style,
  inputStyle,
  align = "left",
  id,
  name,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const POPOVER_WIDTH = 300;

  const parseDateStr = (str: string) => {
    if (!str) return null;
    const parts = str.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10), m = parseInt(parts[1], 10) - 1, d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m, d);
    }
    return null;
  };

  const today = new Date();
  const formatISO = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const todayISO = formatISO(today.getFullYear(), today.getMonth(), today.getDate());

  const initDate = parseDateStr(value) || today;
  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState(value || "");
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  useEffect(() => {
    setSelectedDateStr(value || "");
    if (value) {
      const d = parseDateStr(value);
      if (d) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
    }
  }, [value]);

  const updatePopoverPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const POPOVER_HEIGHT = 390;
    let left = align === "right" ? rect.right - POPOVER_WIDTH : rect.left;
    if (left + POPOVER_WIDTH > window.innerWidth - 12) left = window.innerWidth - POPOVER_WIDTH - 12;
    if (left < 8) left = 8;
    let top = rect.bottom + 8;
    if (top + POPOVER_HEIGHT > window.innerHeight - 12) { top = rect.top - POPOVER_HEIGHT - 8; if (top < 8) top = 8; }
    setPopoverStyle({ position: "fixed", top: `${top}px`, left: `${left}px`, zIndex: 99999, width: `${POPOVER_WIDTH}px` });
  }, [align]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) updatePopoverPosition();
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(t) && popoverRef.current && !popoverRef.current.contains(t)) {
        setIsOpen(false); setIsMonthPickerOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setIsOpen(false); setIsMonthPickerOpen(false); } };
    const onReposition = () => { if (isOpen) updatePopoverPosition(); };
    if (isOpen) {
      document.addEventListener("mousedown", onClickOutside);
      document.addEventListener("keydown", onKey);
      window.addEventListener("scroll", onReposition, true);
      window.addEventListener("resize", onReposition);
    }
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [isOpen, updatePopoverPosition]);

  const formatDateDisplay = (dateStr: string) => {
    const d = parseDateStr(dateStr);
    if (!d) return dateStr;
    return `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const isDayDisabled = (iso: string) => (min && iso < min) || (max && iso > max) ? true : false;

  const getCalendarDays = () => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();
    const days: { dayNum: number; month: number; year: number; isCurrentMonth: boolean; isoString: string }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      const dm = daysInPrev - i, pm = viewMonth === 0 ? 11 : viewMonth - 1, py = viewMonth === 0 ? viewYear - 1 : viewYear;
      days.push({ dayNum: dm, month: pm, year: py, isCurrentMonth: false, isoString: formatISO(py, pm, dm) });
    }
    for (let i = 1; i <= daysInMonth; i++) days.push({ dayNum: i, month: viewMonth, year: viewYear, isCurrentMonth: true, isoString: formatISO(viewYear, viewMonth, i) });
    const total = days.length <= 35 ? 35 : 42;
    for (let i = 1; i <= total - days.length; i++) {
      const nm = viewMonth === 11 ? 0 : viewMonth + 1, ny = viewMonth === 11 ? viewYear + 1 : viewYear;
      days.push({ dayNum: i, month: nm, year: ny, isCurrentMonth: false, isoString: formatISO(ny, nm, i) });
    }
    return days;
  };

  const handleSelectDay = (day: { isoString: string; month: number; year: number }) => {
    if (isDayDisabled(day.isoString)) return;
    setSelectedDateStr(day.isoString);
    if (day.month !== viewMonth || day.year !== viewYear) { setViewMonth(day.month); setViewYear(day.year); }
  };

  const handleConfirm = () => { if (selectedDateStr) onChange?.(selectedDateStr); setIsOpen(false); };
  const handleClear = () => { setSelectedDateStr(""); onChange?.(""); setIsOpen(false); };
  const handleJumpToToday = () => {
    if (!isDayDisabled(todayISO)) {
      setSelectedDateStr(todayISO); setViewYear(today.getFullYear()); setViewMonth(today.getMonth());
      onChange?.(todayISO); setIsOpen(false);
    }
  };

  const calendarDays = getCalendarDays();

  const btnBase: React.CSSProperties = { background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "7px", width: "28px", height: "28px", color: "var(--text)", padding: 0 };

  const popoverContent = isOpen ? (
    <div
      ref={popoverRef}
      style={{
        ...popoverStyle,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "14px 16px",
        boxShadow: "0 24px 50px -12px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.06)",
        animation: "modalFadeIn 0.18s cubic-bezier(0.16,1,0.3,1) forwards",
        userSelect: "none",
        boxSizing: "border-box",
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <button type="button" style={btnBase}
          onClick={(e) => { e.stopPropagation(); if (viewMonth === 0) { setViewMonth(11); setViewYear((p) => p - 1); } else setViewMonth((p) => p - 1); }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        ><ChevronLeft size={16} /></button>

        <div onClick={(e) => { e.stopPropagation(); setIsMonthPickerOpen((p) => !p); }}
          style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", padding: "3px 8px", borderRadius: "6px" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <ChevronDown size={13} style={{ color: "var(--text-faint)" }} />
        </div>

        <button type="button" style={btnBase}
          onClick={(e) => { e.stopPropagation(); if (viewMonth === 11) { setViewMonth(0); setViewYear((p) => p + 1); } else setViewMonth((p) => p + 1); }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        ><ChevronRight size={16} /></button>
      </div>

      {isMonthPickerOpen ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button type="button" onClick={() => setViewYear((p) => p - 1)} className="subtab-btn" style={{ padding: "3px 8px", fontSize: "12px" }}>◀ {viewYear - 1}</button>
            <b style={{ fontSize: "14px", color: "var(--text)" }}>{viewYear}</b>
            <button type="button" onClick={() => setViewYear((p) => p + 1)} className="subtab-btn" style={{ padding: "3px 8px", fontSize: "12px" }}>{viewYear + 1} ▶</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "5px" }}>
            {MONTH_NAMES.map((mName, idx) => (
              <button key={mName} type="button" onClick={() => { setViewMonth(idx); setIsMonthPickerOpen(false); }}
                style={{ padding: "6px 0", borderRadius: "7px", border: viewMonth === idx ? "1px solid #6366f1" : "1px solid var(--border-soft)", background: viewMonth === idx ? "rgba(99,102,241,0.15)" : "var(--surface-2)", color: viewMonth === idx ? "#6366f1" : "var(--text)", fontSize: "11.5px", fontWeight: viewMonth === idx ? 700 : 500, cursor: "pointer" }}>
                {mName.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Weekday headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", marginBottom: "6px" }}>
            {DAY_NAMES.map((d) => (
              <span key={d} style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-faint)", letterSpacing: "0.3px" }}>{d}</span>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: "4px", columnGap: "1px", placeItems: "center" }}>
            {calendarDays.map((d, i) => {
              const isSel = selectedDateStr === d.isoString;
              const isToday = todayISO === d.isoString;
              const isOff = isDayDisabled(d.isoString);
              return (
                <div key={i} onClick={() => !isOff && handleSelectDay(d)}
                  style={{ width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12.5px", cursor: isOff ? "not-allowed" : "pointer", opacity: isOff ? 0.3 : d.isCurrentMonth ? 1 : 0.38, fontWeight: isSel ? 700 : d.isCurrentMonth ? 500 : 400, color: isSel ? "#fff" : isToday ? "#6366f1" : "var(--text)", background: isSel ? "#4f46e5" : "transparent", boxShadow: isSel ? "0 3px 10px rgba(79,70,229,0.4)" : "none", border: !isSel && isToday ? "1.5px solid #6366f1" : "none", transition: "all 0.13s ease" }}
                  onMouseEnter={(e) => { if (!isSel && !isOff) e.currentTarget.style.background = "rgba(99,102,241,0.12)"; }}
                  onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                >{d.dayNum}</div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--border-soft)" }}>
            <button type="button" onClick={handleJumpToToday}
              style={{ background: "transparent", border: "none", color: "#6366f1", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: "3px 6px", borderRadius: "5px" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            ><CalendarIcon size={13} /><span>Today</span></button>
            <div style={{ display: "flex", gap: "7px", alignItems: "center" }}>
              <button type="button" onClick={handleClear}
                style={{ background: "transparent", border: "none", color: "var(--text-dim)", fontSize: "12.5px", fontWeight: 500, cursor: "pointer", padding: "4px 9px", borderRadius: "5px" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-dim)")}
              >Clear</button>
              <button type="button" onClick={handleConfirm}
                style={{ background: "#4f46e5", color: "#fff", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer", padding: "5px 14px", borderRadius: "7px", boxShadow: "0 2px 8px rgba(79,70,229,0.35)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#4338ca"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#4f46e5"; e.currentTarget.style.transform = "translateY(0)"; }}
              >Select</button>
            </div>
          </div>
        </>
      )}
    </div>
  ) : null;

  return (
    <div className={`custom-datepicker-root ${className}`} style={{ position: "relative", display: "inline-block", width: "100%", ...style }}>
      <input type="hidden" id={id} name={name} value={value} required={required} />
      <div
        ref={triggerRef}
        onClick={handleToggle}
        className="custom-datepicker-trigger"
        style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "8px 12px", background: "var(--surface-2)", border: isOpen ? "1.5px solid #6366f1" : "1px solid var(--border)", borderRadius: "9px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, boxShadow: isOpen ? "0 0 0 3px rgba(99,102,241,0.15)" : "none", transition: "all 0.2s ease", userSelect: "none", boxSizing: "border-box", ...inputStyle }}
      >
        <CalendarIcon size={16} style={{ color: isOpen || value ? "#6366f1" : "var(--text-faint)", flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: "13px", color: value ? "var(--text)" : "var(--text-faint)", fontWeight: value ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value ? formatDateDisplay(value) : placeholder}
        </span>
      </div>
      {typeof document !== "undefined" && createPortal(popoverContent, document.body)}
    </div>
  );
};
