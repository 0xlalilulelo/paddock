"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { QueryProvider } from "@/components/query-provider";
import { TopNav } from "@/components/top-nav";
import { Sidebar } from "@/components/sidebar";
import type { SeriesId } from "@paddock/api-types";

const ALL_SERIES: { id: SeriesId; label: string; color: string }[] = [
  { id: "f1",     label: "Formula 1", color: "#e10600" },
  { id: "wec",    label: "WEC",       color: "#0072ce" },
  { id: "imsa",   label: "IMSA",      color: "#00a651" },
  { id: "nascar", label: "NASCAR",    color: "#ffb612" },
];

const YEARS = ["2026", "2025", "2024", "2023", "Archive"];

const TRENDING = [
  { tag: "#CostCapAudit",   count: "42K" },
  { tag: "#LasVegasGP",     count: "38K" },
  { tag: "#AndrettiEntry",  count: "12K" },
];

interface SearchResult {
  type: "article" | "social";
  item: {
    id: string;
    title?: string;
    content?: string;
    summary?: string;
    source?: { name: string };
    series: string[];
    publishedAt: string;
    url: string;
    isBreaking?: boolean;
    imageUrl?: string;
  };
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [selectedSeries, setSelectedSeries] = useState<Set<SeriesId>>(new Set());
  const [selectedYear, setSelectedYear] = useState("2026");
  const [activeTab, setActiveTab] = useState<"ALL_RESULTS" | "TECHNICAL_ONLY" | "VISUAL_LOGS">("ALL_RESULTS");

  const { data: results, isLoading } = useQuery<SearchResult[]>({
    queryKey: ["search", query, Array.from(selectedSeries), selectedYear],
    queryFn: async () => {
      const params = new URLSearchParams({ q: query, limit: "20" });
      if (selectedSeries.size > 0) {
        params.set("series", Array.from(selectedSeries).join(","));
      }
      const res = await fetch(`/api/search?${params}`);
      return res.json();
    },
    enabled: query.length >= 2,
    staleTime: 15_000,
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.replace(`/search?q=${encodeURIComponent(query)}`);
  }

  function toggleSeries(id: SeriesId) {
    setSelectedSeries((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-[--color-surface-dim]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav />

        <div className="flex flex-1 overflow-hidden">
          {/* ── Left filter panel (20%) ── */}
          <div className="w-[20%] shrink-0 flex flex-col bg-[--color-surface-container-low] overflow-y-auto">
            <div className="px-4 py-4">
              <p
                className="text-[10px] font-black tracking-widest text-[--color-on-surface] uppercase mb-4"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                REFINE_TELEMETRY
              </p>

              {/* Series */}
              <div className="mb-5">
                <p
                  className="text-[9px] font-bold tracking-widest text-[--color-on-surface-variant] opacity-60 uppercase mb-2"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  SERIES_SELECT
                </p>
                <div className="space-y-1.5">
                  {ALL_SERIES.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSeries.has(s.id)}
                        onChange={() => toggleSeries(s.id)}
                        className="sr-only"
                      />
                      <span
                        className={[
                          "w-3.5 h-3.5 rounded-[0.125rem] border flex items-center justify-center transition-all",
                          selectedSeries.has(s.id)
                            ? "border-current"
                            : "border-[--color-outline-variant]/40 group-hover:border-[--color-outline-variant]/80",
                        ].join(" ")}
                        style={selectedSeries.has(s.id) ? { backgroundColor: s.color, borderColor: s.color } : {}}
                      >
                        {selectedSeries.has(s.id) && (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1 4l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span
                        className="text-[11px] font-bold tracking-wider text-[--color-on-surface]"
                        style={{ fontFamily: "var(--font-headline)", color: s.color }}
                      >
                        {s.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Year */}
              <div className="mb-5">
                <p
                  className="text-[9px] font-bold tracking-widest text-[--color-on-surface-variant] opacity-60 uppercase mb-2"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  CHRONOLOGY_YEAR
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {YEARS.map((y) => (
                    <button
                      key={y}
                      onClick={() => setSelectedYear(y)}
                      className={[
                        "px-2 py-0.5 rounded-[0.125rem] text-[10px] font-bold tracking-widest uppercase transition-all",
                        selectedYear === y
                          ? "bg-[--color-primary-container] text-[--color-on-primary-container]"
                          : "text-[--color-on-surface-variant] bg-[--color-surface-container] hover:bg-[--color-surface-container-high]",
                      ].join(" ")}
                      style={{ fontFamily: "var(--font-headline)" }}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Center results (55%) ── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search bar + tabs */}
            <div className="px-5 py-4 shrink-0 bg-[--color-surface-dim]">
              <form onSubmit={handleSearch} className="mb-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-[0.125rem] bg-[--color-surface-container-lowest]">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-[--color-on-surface-variant] shrink-0">
                    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search telemetry, news, drivers…"
                    className="flex-1 bg-transparent text-sm text-[--color-on-surface] placeholder:text-[--color-on-surface-variant] outline-none"
                    style={{ fontFamily: "var(--font-body)" }}
                    autoFocus
                  />
                </div>
              </form>

              {/* Stream label + result tabs */}
              <div className="flex items-center justify-between">
                <h2
                  className="text-lg font-black italic text-[--color-on-surface]"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  Active_Stream
                </h2>
                <div className="flex gap-1">
                  {(["ALL_RESULTS", "TECHNICAL_ONLY", "VISUAL_LOGS"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={[
                        "px-3 py-1 rounded-[0.125rem] text-[10px] font-bold tracking-widest uppercase transition-all",
                        activeTab === tab
                          ? "text-[--color-primary] border-b border-[--color-primary-container]"
                          : "text-[--color-on-surface-variant] opacity-60 hover:opacity-100",
                      ].join(" ")}
                      style={{ fontFamily: "var(--font-headline)" }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {query.length < 2 ? (
                <EmptyState label="TYPE TO SEARCH TELEMETRY" />
              ) : isLoading ? (
                <SearchSkeletons />
              ) : !results?.length ? (
                <EmptyState label={`NO_RESULTS FOR "${query.toUpperCase()}"`} />
              ) : (
                results.map((r, i) => <SearchResultCard key={i} result={r} />)
              )}
            </div>
          </div>

          {/* ── Right trending panel (25%) ── */}
          <div className="w-[25%] shrink-0 flex flex-col bg-[--color-surface-container-low] overflow-y-auto">
            <div className="px-4 py-4">
              <p
                className="text-[10px] font-black tracking-widest text-[--color-on-surface] uppercase mb-4"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                GLOBAL_HOTSPOTS
              </p>

              {/* Trending */}
              <div className="mb-5">
                <p
                  className="text-[9px] font-bold tracking-widest text-[--color-on-surface-variant] opacity-60 uppercase mb-2"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  TRENDING_METADATA
                </p>
                <div className="space-y-2">
                  {TRENDING.map((t) => (
                    <div key={t.tag} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[11px] font-bold text-[--color-primary] truncate"
                          style={{ fontFamily: "var(--font-headline)" }}
                        >
                          {t.tag}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-[--color-on-surface-variant] shrink-0">
                        {t.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity log */}
              <div>
                <p
                  className="text-[9px] font-bold tracking-widest text-[--color-on-surface-variant] opacity-60 uppercase mb-2"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  ACTIVITY_LOG
                </p>
                <div className="space-y-2">
                  {[
                    { icon: "✓", label: "DRS_ZONE_UPDATE", sub: "Monaco Sector 2 · 2 minutes", color: "#4cd6ff" },
                    { icon: "⚠", label: "WEATHER_FRONT",   sub: "Precipitation Chance 45%",    color: "#fdd000" },
                    { icon: "⊕", label: "LOG_UPLOAD",       sub: "McLaren Sector 71 Uploaded",  color: "#ffb4a8" },
                  ].map((entry) => (
                    <div key={entry.label} className="flex items-start gap-2">
                      <span
                        className="text-[10px] font-bold shrink-0 mt-0.5"
                        style={{ color: entry.color }}
                      >
                        {entry.icon}
                      </span>
                      <div>
                        <p
                          className="text-[10px] font-bold text-[--color-on-surface]"
                          style={{ fontFamily: "var(--font-headline)" }}
                        >
                          {entry.label}
                        </p>
                        <p className="text-[9px] text-[--color-on-surface-variant] opacity-60" style={{ fontFamily: "var(--font-body)" }}>
                          {entry.sub}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchResultCard({ result }: { result: SearchResult }) {
  const item = result.item;
  const title = item.title ?? item.content?.slice(0, 80) ?? "Untitled";
  const summary = item.summary ?? item.content?.slice(0, 120);
  const seriesColor = item.series[0] === "f1" ? "#e10600" : item.series[0] === "wec" ? "#0072ce" : item.series[0] === "imsa" ? "#00a651" : "#ffb612";

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 p-3 rounded-[0.125rem] bg-[--color-surface-container-highest] hover:bg-[--color-surface-bright] transition-all group"
    >
      {/* Thumbnail placeholder */}
      <div className="w-24 h-16 shrink-0 rounded-[0.125rem] bg-[--color-surface-container] overflow-hidden">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[--color-on-surface-variant] opacity-20 text-xs">IMG</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[9px] font-bold tracking-widest uppercase"
            style={{ fontFamily: "var(--font-headline)", color: "#4cd6ff" }}
          >
            {result.type === "article" ? "NEWS" : "SOCIAL"}
          </span>
          {item.series.slice(0, 1).map((s) => (
            <span
              key={s}
              className="text-[9px] font-bold tracking-widest uppercase"
              style={{ fontFamily: "var(--font-headline)", color: seriesColor }}
            >
              #{s.toUpperCase()}
            </span>
          ))}
          {item.isBreaking && (
            <span
              className="text-[9px] font-bold tracking-widest uppercase text-[--color-primary-container]"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              BREAKING
            </span>
          )}
          <time className="ml-auto text-[9px] text-[--color-on-surface-variant] font-mono shrink-0">
            {new Date(item.publishedAt).toLocaleDateString()}
          </time>
        </div>

        <h3
          className="text-[13px] font-bold leading-snug line-clamp-1 text-[--color-on-surface] group-hover:text-[--color-primary] transition-colors"
          style={{ fontFamily: "var(--font-headline)" }}
        >
          {title}
        </h3>

        {summary && (
          <p className="text-[11px] text-[--color-on-surface-variant] line-clamp-2 leading-relaxed mt-0.5" style={{ fontFamily: "var(--font-body)" }}>
            {summary}
          </p>
        )}

        {item.source && (
          <span className="text-[9px] font-bold text-[--color-on-surface-variant] opacity-60 tracking-widest uppercase mt-1 block" style={{ fontFamily: "var(--font-headline)" }}>
            {item.source.name}
          </span>
        )}
      </div>
    </a>
  );
}

function SearchSkeletons() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-3 p-3 rounded-[0.125rem] bg-[--color-surface-container-highest] animate-pulse">
          <div className="w-24 h-16 shrink-0 rounded-[0.125rem] bg-[--color-surface-container-high]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-[--color-surface-container-high] rounded-[0.125rem] w-1/4" />
            <div className="h-4 bg-[--color-surface-container-high] rounded-[0.125rem] w-3/4" />
            <div className="h-3 bg-[--color-surface-container-high] rounded-[0.125rem] w-full" />
          </div>
        </div>
      ))}
    </>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-32">
      <span
        className="text-[10px] font-bold tracking-widest text-[--color-on-surface-variant] opacity-40 uppercase"
        style={{ fontFamily: "var(--font-headline)" }}
      >
        {label}
      </span>
    </div>
  );
}

export default function SearchPage() {
  return (
    <QueryProvider>
      <Suspense>
        <SearchPageInner />
      </Suspense>
    </QueryProvider>
  );
}
