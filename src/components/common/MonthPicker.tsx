import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react";

const MONTH_NAMES_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_NAMES_FULL  = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export interface MonthPickerProps {
  /** "All" or "YYYY-MM" */
  value: string;
  onChange: (val: string) => void;
  /** List of YYYY-MM strings to show (will auto-compute if omitted) */
  availableMonths?: string[];
  placeholder?: string;
  align?: "left" | "right";
  style?: React.CSSProperties;
}

function formatLabel(val: string): string {
  if (!val || val === "All") return "";
  const [y, m] = val.split("-");
  const mi = parseInt(m, 10) - 1;
  if (isNaN(mi) || mi < 0 || mi > 11) return val;
  return `${MONTH_NAMES_FULL[mi]} ${y}`;
}

export const MonthPicker: React.FC<MonthPickerProps> = ({
  value,
  onChange,
  availableMonths = [],
  placeholder = "All Months",
  align = "left",
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [navYear, setNavYear] = useState<number>(() => {
    if (value && value !== "All") return parseInt(value.split("-")[0], 10);
    return new Date().getFullYear();
  });
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const availableSet = new Set(availableMonths);
  const POPOVER_W = 260;

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    let left = align === "right" ? rect.right - POPOVER_W : rect.left;
    if (left + POPOVER_W > window.innerWidth - 12) left = window.innerWidth - POPOVER_W - 12;
    if (left < 8) left = 8;
    let top = rect.bottom + 6;
    if (top + 300 > window.innerHeight - 12) { top = rect.top - 300 - 6; if (top < 8) top = 8; }
    setPopoverStyle({ position: "fixed", top: `${top}px`, left: `${left}px`, zIndex: 99999, width: `${POPOVER_W}px` });
  }, [align]);

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
      if (value && value !== "All") setNavYear(parseInt(value.split("-")[0], 10));
    }
    setIsOpen((p) => !p);
  };

  useEffect(() => {
    const onOut = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(t) && popoverRef.current && !popoverRef.current.contains(t)) {
        setIsOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    const onRepo = () => { if (isOpen) updatePosition(); };
    if (isOpen) {
      document.addEventListener("mousedown", onOut);
      document.addEventListener("keydown", onKey);
      window.addEventListener("scroll", onRepo, true);
      window.addEventListener("resize", onRepo);
    }
    return () => {
      document.removeEventListener("mousedown", onOut);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onRepo, true);
      window.removeEventListener("resize", onRepo);
    };
  }, [isOpen, updatePosition]);

  const handleSelect = (iso: string) => {
    onChange(iso);
    setIsOpen(false);
  };

  const hasValue = value && value !== "All";

  const popover = isOpen ? (
    <div
      ref={popoverRef}
      style={{
        ...popoverStyle,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        padding: "14px",
        boxShadow: "0 20px 44px -8px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.06)",
        boxSizing: "border-box",
        animation: "modalFadeIn 0.16s cubic-bezier(0.16,1,0.3,1) forwards",
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Year Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <button type="button" onClick={() => setNavYear((y) => y - 1)}
          style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "7px", padding: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        ><ChevronLeft size={15} /></button>

        <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text)" }}>{navYear}</span>

        <button type="button" onClick={() => setNavYear((y) => y + 1)}
          style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "7px", padding: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        ><ChevronRight size={15} /></button>
      </div>

      {/* Month Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
        {MONTH_NAMES_SHORT.map((m, idx) => {
          const iso = `${navYear}-${String(idx + 1).padStart(2, "0")}`;
          const isSelected = value === iso;
          const isAvailable = availableSet.size === 0 || availableSet.has(iso);
          return (
            <button key={m} type="button"
              onClick={() => handleSelect(iso)}
              disabled={!isAvailable}
              style={{
                padding: "8px 4px",
                borderRadius: "8px",
                border: isSelected ? "1.5px solid #6366f1" : "1px solid transparent",
                background: isSelected ? "#4f46e5" : isAvailable ? "var(--surface-2)" : "transparent",
                color: isSelected ? "#fff" : isAvailable ? "var(--text)" : "var(--text-faint)",
                fontSize: "12px",
                fontWeight: isSelected ? 700 : 500,
                cursor: isAvailable ? "pointer" : "default",
                opacity: isAvailable ? 1 : 0.35,
                transition: "all 0.13s ease",
                boxShadow: isSelected ? "0 3px 8px rgba(79,70,229,0.4)" : "none",
              }}
              onMouseEnter={(e) => { if (isAvailable && !isSelected) e.currentTarget.style.background = "rgba(99,102,241,0.12)"; }}
              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = isAvailable ? "var(--surface-2)" : "transparent"; }}
            >{m}</button>
          );
        })}
      </div>

      {/* Footer — Clear */}
      {hasValue && (
        <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--border-soft)", display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={() => handleSelect("All")}
            style={{ background: "transparent", border: "none", color: "var(--text-dim)", fontSize: "12px", fontWeight: 500, cursor: "pointer", padding: "3px 8px", borderRadius: "5px", display: "flex", alignItems: "center", gap: "4px" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-dim)")}
          ><X size={12} /> Clear</button>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div style={{ position: "relative", display: "inline-block", ...style }}>
      <div
        ref={triggerRef}
        onClick={handleToggle}
        style={{
          display: "flex", alignItems: "center", gap: "7px",
          padding: "5px 10px 5px 9px",
          background: "var(--surface-2)",
          border: isOpen ? "1.5px solid #6366f1" : hasValue ? "1.5px solid rgba(99,102,241,0.45)" : "1px solid var(--border)",
          borderRadius: "9px",
          cursor: "pointer",
          boxShadow: isOpen ? "0 0 0 3px rgba(99,102,241,0.15)" : "none",
          transition: "all 0.18s ease",
          userSelect: "none",
          minWidth: "120px",
          whiteSpace: "nowrap",
        }}
      >
        <CalendarDays size={13} style={{ color: hasValue || isOpen ? "#6366f1" : "var(--text-faint)", flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: "12px", color: hasValue ? "var(--text)" : "var(--text-faint)", fontWeight: hasValue ? 600 : 400 }}>
          {hasValue ? formatLabel(value) : placeholder}
        </span>
        <ChevronDown size={12} style={{ color: "var(--text-faint)", transition: "transform 0.18s ease", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }} />
      </div>
      {typeof document !== "undefined" && createPortal(popover, document.body)}
    </div>
  );
};
