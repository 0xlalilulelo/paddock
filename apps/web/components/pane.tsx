"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery } from "@tanstack/react-query";
import { useFeedStore, useLayoutStore } from "@/lib/store";
import { connectSeries } from "@/lib/sse";
import { StoryCard } from "./story-card";
import { type LocalPaneConfig } from "@/lib/store";
import type { FeedPage, FeedItem, SeriesId } from "@paddock/api-types";

// Stable empty array — MUST be outside component to avoid new reference every render
const EMPTY_FEED: FeedItem[] = [];

const SERIES_META: Record<SeriesId, { label: string; color: string }> = {
  f1: { label: "Formula 1", color: "#e10600" },
  imsa: { label: "IMSA", color: "#00a651" },
  wec: { label: "WEC", color: "#0072ce" },
  nascar: { label: "NASCAR", color: "#ffb612" },
};

/** Format series id as telemetry-style stream label: F1_TELEMETRY_STREAM */
function streamLabel(series: SeriesId): string {
  return `${series.toUpperCase()}_TELEMETRY_STREAM`;
}

interface PaneProps {
  pane: LocalPaneConfig;
}

export function Pane({ pane }: PaneProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: pane.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    width: pane.width,
    minWidth: pane.width,
  };

  const meta = SERIES_META[pane.series];
  const { removePane } = useLayoutStore();
  const feedItems = useFeedStore((s) => s.feeds[pane.series] ?? EMPTY_FEED);
  const scrollRef = useRef<HTMLDivElement>(null);
  // NOTE: TanStack Virtual was removed — estimateSize: 120 doesn't match variable card heights
  // (hero cards ~350px, text cards ~200px, compact items ~65px) and caused absolute-positioned
  // cards to overlap. A simple mapped list handles 40–200 items without virtualization overhead.

  // Connect SSE on mount
  useEffect(() => {
    const disconnect = connectSeries(pane.series);
    return disconnect;
  }, [pane.series]);

  // Initial page fetch
  const { data, isLoading } = useQuery<FeedPage>({
    queryKey: ["feed", pane.series],
    queryFn: () =>
      fetch(`/api/feed?series=${pane.series}&limit=40`).then((r) => r.json()),
  });

  // Merge server data into store on first load
  useEffect(() => {
    if (data?.items?.length) {
      useFeedStore.getState().prependItems(pane.series, data.items);
    }
  }, [data, pane.series]);

  const handleClose = useCallback(() => removePane(pane.id), [pane.id, removePane]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col h-full bg-[--color-surface-container-low] shrink-0"
    >
      {/* Header — sticky, no border-b (bg shift creates separation) */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 shrink-0 sticky top-0 z-10 bg-[--color-surface-container-low]/95 backdrop-blur cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        {/* Series color dot */}
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: meta.color }}
        />

        {/* Telemetry-style stream label */}
        <span
          className="text-xs font-bold tracking-widest uppercase flex-1 truncate text-[--color-on-surface]"
          style={{ fontFamily: "var(--font-headline)" }}
        >
          {streamLabel(pane.series)}
        </span>

        {/* Close */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleClose}
          className="text-[--color-on-surface-variant] hover:text-[--color-on-surface] transition-colors p-0.5 rounded-[0.125rem] opacity-60 hover:opacity-100"
          title={`Close ${meta.label}`}
        >
          <CloseIcon />
        </button>
      </div>

      {/* Feed body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 pb-8">
        {isLoading && feedItems.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <span
              className="text-[11px] tracking-widest text-[--color-on-surface-variant] uppercase"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              Connecting…
            </span>
          </div>
        ) : feedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-1">
            <span
              className="text-[11px] tracking-widest text-[--color-on-surface-variant] uppercase"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              No telemetry
            </span>
            <span className="text-[10px] text-[--color-on-surface-variant] opacity-50">
              Waiting for feed data
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-3">
            {feedItems.map((item) => (
              <StoryCard key={item.data.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
