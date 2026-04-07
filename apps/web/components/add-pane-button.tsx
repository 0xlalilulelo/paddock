"use client";

import { useState, useRef, useEffect } from "react";
import type { SeriesId } from "@paddock/api-types";

const SERIES_LABELS: Record<SeriesId, string> = {
  f1:     "Formula 1",
  imsa:   "IMSA",
  wec:    "WEC",
  nascar: "NASCAR",
};

interface AddPaneButtonProps {
  availableSeries: SeriesId[];
  onAdd: (series: SeriesId) => void;
}

export function AddPaneButton({ availableSeries, onAdd }: AddPaneButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-start pt-2 px-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className={[
          "w-8 h-8 rounded-[0.125rem] flex items-center justify-center transition-all",
          "text-[--color-on-surface-variant] opacity-50 hover:opacity-100",
          "border border-dashed border-[--color-outline-variant]/30",
          "hover:bg-[--color-surface-container-low] hover:border-[--color-outline-variant]/60",
        ].join(" ")}
        title="Add series pane"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-12 left-0 z-50 rounded-[0.125rem] shadow-xl py-1 min-w-[160px] bg-[--color-surface-container] border border-[--color-outline-variant]/15">
          {availableSeries.map((s) => (
            <button
              key={s}
              onClick={() => {
                onAdd(s);
                setOpen(false);
              }}
              className={[
                "w-full text-left px-3 py-2 text-xs font-bold tracking-widest uppercase",
                "text-[--color-on-surface] hover:bg-[--color-surface-container-high] transition-colors",
              ].join(" ")}
              style={{ fontFamily: "var(--font-headline)" }}
            >
              {SERIES_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
