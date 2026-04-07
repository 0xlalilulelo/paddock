"use client";

import { useFeedStore } from "@/lib/store";

export function BreakingNewsBanner() {
  const breakingItems = useFeedStore((s) => s.breakingItems);
  const clearBreaking = useFeedStore((s) => s.clearBreaking);

  if (breakingItems.length === 0) return null;

  const latest = breakingItems[0];
  const title =
    latest.type === "article"
      ? latest.data.title
      : latest.data.content.slice(0, 100);

  return (
    <div className="relative group flex items-center gap-3 px-4 py-2 bg-[--color-primary-container] text-[--color-on-primary-container] shrink-0 overflow-hidden">
      {/* Shimmer sweep on hover */}
      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent
          -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
      />

      {/* BREAKING pill */}
      <span
        className="inline-flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-[0.125rem]
          bg-[--color-secondary-container] text-[--color-on-secondary-container]
          text-[10px] font-bold tracking-widest uppercase animate-pulse"
        style={{ fontFamily: "var(--font-headline)" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[--color-on-secondary-container]" />
        BREAKING
      </span>

      {/* Headline */}
      <p
        className="flex-1 text-sm font-bold tracking-tight truncate"
        style={{ fontFamily: "var(--font-headline)" }}
      >
        {title}
      </p>

      {/* Dismiss */}
      <button
        onClick={clearBreaking}
        className="text-[--color-on-primary-container] opacity-70 hover:opacity-100 transition-opacity text-[10px] font-bold tracking-widest uppercase shrink-0"
        style={{ fontFamily: "var(--font-headline)" }}
      >
        DISMISS
      </button>
    </div>
  );
}
