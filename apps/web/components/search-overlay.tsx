"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/lib/store";

export function SearchOverlay() {
  const { searchOpen, closeSearch } = useUIStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        useUIStore.getState().toggleSearch();
      }
      if (e.key === "Escape") {
        closeSearch();
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeSearch]);

  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    closeSearch();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  if (!searchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && closeSearch()}
    >
      <div className="w-full max-w-2xl bg-[--color-surface-container] border border-[--color-outline-variant]/15 rounded-[0.125rem] shadow-2xl overflow-hidden">
        {/* Input */}
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-3 px-4 py-3 bg-[--color-surface-container-low]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-[--color-on-surface-variant] shrink-0"
            >
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Telemetry Search…"
              className="flex-1 bg-transparent text-sm text-[--color-on-surface] placeholder:text-[--color-on-surface-variant] outline-none"
              style={{ fontFamily: "var(--font-body)" }}
            />
            <kbd
              className="text-[10px] text-[--color-on-surface-variant] bg-[--color-surface-container-highest] rounded-[0.125rem] px-1.5 py-0.5 border border-[--color-outline-variant]/20"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              ESC
            </kbd>
          </div>
        </form>

        {/* Quick actions */}
        <div className="px-4 py-3">
          <p
            className="text-[10px] text-[--color-on-surface-variant] tracking-widest uppercase mb-2"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            {query.length === 0 ? "Press Enter to search" : `Search for "${query}"`}
          </p>
          <button
            onClick={() => {
              if (query.trim()) {
                closeSearch();
                router.push(`/search?q=${encodeURIComponent(query.trim())}`);
              } else {
                closeSearch();
                router.push("/search");
              }
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-[0.125rem] bg-[--color-surface-container-high] hover:bg-[--color-surface-bright] transition-colors text-left"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[--color-tertiary] shrink-0">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span
              className="text-xs text-[--color-on-surface] font-bold tracking-wide"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              OPEN FULL SEARCH
            </span>
            <span className="ml-auto text-[10px] text-[--color-on-surface-variant]">→ /search</span>
          </button>
        </div>
      </div>
    </div>
  );
}
