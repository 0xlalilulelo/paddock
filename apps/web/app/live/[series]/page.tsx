"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryProvider } from "@/components/query-provider";
import { TopNav } from "@/components/top-nav";
import { Sidebar } from "@/components/sidebar";
import type { LiveSession, LivePosition } from "@paddock/api-types";

const SERIES_META: Record<string, { name: string; color: string }> = {
  f1:     { name: "FORMULA 1",  color: "#e10600" },
  imsa:   { name: "IMSA WSCC",  color: "#00a651" },
  wec:    { name: "FIA WEC",    color: "#0072ce" },
  nascar: { name: "NASCAR CUP", color: "#ffb612" },
};

interface LiveApiResponse {
  session: LiveSession | null;
  positions: LivePosition[];
  socialFeed: Array<{
    id: string;
    authorHandle: string;
    authorDisplayName: string;
    content: string;
    publishedAt: string;
    isBreaking: boolean;
  }>;
}

interface PageProps {
  params: Promise<{ series: string }>;
}

function LiveRacePage({ series }: { series: string }) {
  const meta = SERIES_META[series] ?? { name: series.toUpperCase(), color: "#ffb4a8" };

  const { data, isLoading } = useQuery<LiveApiResponse>({
    queryKey: ["live", series],
    queryFn: () => fetch(`/api/live?series=${series}`).then((r) => r.json()),
    refetchInterval: 15_000,
  });

  const session = data?.session ?? null;
  const positions = data?.positions ?? [];
  const socialFeed = data?.socialFeed ?? [];

  return (
    <div className="flex h-dvh overflow-hidden bg-[--color-surface-dim]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav />

        {/* 3-column live layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* ── Left: Social Monitor (28%) ── */}
          <div className="w-[28%] shrink-0 flex flex-col bg-[--color-surface-container-low] overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-2 bg-[--color-surface-container-low]/95 backdrop-blur sticky top-0">
              <span
                className="text-[10px] font-black tracking-widest text-[--color-on-surface] uppercase"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                SOCIAL_MONITOR
              </span>
              <span
                className="ml-auto text-[9px] font-bold tracking-widest text-[--color-tertiary] uppercase"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                LIVE
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {socialFeed.length === 0 ? (
                <EmptyState label="No social feed data" />
              ) : (
                socialFeed.map((post) => (
                  <div
                    key={post.id}
                    className="p-3 rounded-[0.125rem] bg-[--color-surface-container-highest]"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className="text-[11px] font-bold text-[--color-on-surface]"
                        style={{ fontFamily: "var(--font-headline)" }}
                      >
                        {post.authorDisplayName}
                      </span>
                      <span className="text-[10px] text-[--color-on-surface-variant] font-mono">
                        @{post.authorHandle}
                      </span>
                      {post.isBreaking && (
                        <span
                          className="text-[9px] font-bold text-[--color-primary-container] uppercase tracking-widest"
                          style={{ fontFamily: "var(--font-headline)" }}
                        >
                          BREAKING
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[--color-on-surface-variant] leading-relaxed">
                      {post.content}
                    </p>
                    <time className="text-[10px] text-[--color-on-surface-variant] opacity-50 font-mono block mt-1">
                      {new Date(post.publishedAt).toLocaleTimeString()}
                    </time>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Center: Race Feed ── */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[--color-surface-dim]">
            {/* Session hero */}
            <div
              className="px-6 py-5 shrink-0 border-b"
              style={{ borderColor: `${meta.color}20` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: session ? "#22c55e" : "#6b7280" }}
                />
                <span
                  className="text-[10px] font-bold tracking-widest uppercase"
                  style={{
                    fontFamily: "var(--font-headline)",
                    color: session ? "#22c55e" : "var(--color-on-surface-variant)",
                  }}
                >
                  {session ? "LIVE SESSION" : "NO ACTIVE SESSION"}
                </span>
              </div>

              <h1
                className="text-2xl font-black italic leading-none mb-1"
                style={{ fontFamily: "var(--font-headline)", color: meta.color }}
              >
                {meta.name}
              </h1>

              {session && (
                <p className="text-sm text-[--color-on-surface-variant]" style={{ fontFamily: "var(--font-body)" }}>
                  {session.sessionType?.toUpperCase()} ·{" "}
                  {session.timeRemaining ? `${session.timeRemaining} remaining` : "In progress"}
                </p>
              )}

              {!session && (
                <p className="text-sm text-[--color-on-surface-variant]" style={{ fontFamily: "var(--font-body)" }}>
                  No race weekend in progress. Check back when a session goes live.
                </p>
              )}
            </div>

            {/* Event timeline */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {isLoading ? (
                <EmptyState label="CONNECTING_TO_TELEMETRY…" />
              ) : (
                <div className="space-y-3">
                  <p
                    className="text-[10px] font-bold tracking-widest text-[--color-on-surface-variant] uppercase mb-4"
                    style={{ fontFamily: "var(--font-headline)" }}
                  >
                    RACE_EVENTS
                  </p>
                  <EmptyState label={session ? "AWAITING_RACE_EVENTS" : "SESSION_NOT_ACTIVE"} />
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Live Positions (22%) ── */}
          <div className="w-[22%] shrink-0 flex flex-col bg-[--color-surface-container-low] overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-2 bg-[--color-surface-container-low]/95 backdrop-blur sticky top-0">
              <span
                className="text-[10px] font-black tracking-widest text-[--color-on-surface] uppercase"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                LIVE_POSITIONS
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2">
              {positions.length === 0 ? (
                <EmptyState label="No position data" />
              ) : (
                <div className="space-y-1">
                  {positions.map((pos) => (
                    <div
                      key={pos.position}
                      className="flex items-center gap-2 px-3 py-2 rounded-[0.125rem] bg-[--color-surface-container-highest] hover:bg-[--color-surface-container-high] transition-colors"
                    >
                      <span
                        className="w-5 text-[11px] font-black tabular-nums text-right text-[--color-on-surface-variant]"
                        style={{ fontFamily: "var(--font-headline)" }}
                      >
                        {pos.position}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[11px] font-bold text-[--color-on-surface] truncate"
                          style={{ fontFamily: "var(--font-headline)" }}
                        >
                          {pos.driverName}
                        </p>
                        <p className="text-[9px] text-[--color-on-surface-variant] truncate" style={{ fontFamily: "var(--font-body)" }}>
                          {pos.teamName}
                        </p>
                      </div>
                      {pos.gap && (
                        <span className="text-[10px] text-[--color-tertiary] font-mono shrink-0">
                          {pos.gap}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-24">
      <span
        className="text-[10px] font-bold tracking-widest text-[--color-on-surface-variant] opacity-40 uppercase"
        style={{ fontFamily: "var(--font-headline)" }}
      >
        {label}
      </span>
    </div>
  );
}

export default function LiveRacePageWrapper({ params }: PageProps) {
  const { series } = use(params);
  return (
    <QueryProvider>
      <LiveRacePage series={series} />
    </QueryProvider>
  );
}
