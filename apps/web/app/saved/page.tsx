"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { QueryProvider } from "@/components/query-provider";
import { TopNav } from "@/components/top-nav";
import { Sidebar } from "@/components/sidebar";
import type { SeriesId } from "@paddock/api-types";

interface SavedArticle {
  articleId: string;
  savedAt: string;
  article: {
    id: string;
    title: string;
    summary: string | null;
    url: string;
    imageUrl: string | null;
    publishedAt: string;
    isBreaking: boolean;
    series: string[];
    source: { name: string };
  };
}

interface UpcomingSession {
  id: string;
  type: string;
  startsAt: string | null;
  eventName: string;
  circuitName: string;
  country: string;
  series: SeriesId;
}

const SERIES_YOUTUBE: Record<SeriesId, string> = {
  f1: "https://www.youtube.com/@F1",
  imsa: "https://www.youtube.com/@IMSARacing",
  wec: "https://www.youtube.com/@fiawec",
  nascar: "https://www.youtube.com/@NASCAR",
};

const SERIES_COLOR: Record<SeriesId, string> = {
  f1: "#E10600",
  imsa: "#00A651",
  wec: "#0072CE",
  nascar: "#FFB612",
};

// Static track data modules (V1 — no real data yet)
const TRACK_DATA = [
  {
    circuit: "SEBRING TURN 17",
    type: "TURN_ANALYSIS",
    entrySpeed: "142.5",
    exitSpeed: "121.3",
    series: "IMSA",
    color: "#00a651",
  },
  {
    circuit: "MONZA CURVA GRANDE",
    type: "BRAKING_ZONE",
    entrySpeed: "298.1",
    exitSpeed: "224.7",
    series: "F1",
    color: "#e10600",
  },
];

function SavedPage() {
  const { isSignedIn } = useAuth();

  const { data: savedItems = [], isLoading } = useQuery<SavedArticle[]>({
    queryKey: ["saved"],
    queryFn: () => fetch("/api/user/saved").then((r) => r.json()),
    enabled: !!isSignedIn,
  });

  const { data: upcomingSessions = [] } = useQuery<UpcomingSession[]>({
    queryKey: ["sessions", "upcoming"],
    queryFn: () => fetch("/api/sessions/upcoming?limit=6").then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  if (!isSignedIn) {
    return (
      <div className="flex h-dvh overflow-hidden bg-[--color-surface-dim]">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopNav />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <p
                className="text-2xl font-black italic text-[--color-on-surface]"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                SIGN IN TO ACCESS SAVED CONTENT
              </p>
              <p className="text-sm text-[--color-on-surface-variant]" style={{ fontFamily: "var(--font-body)" }}>
                Save articles from the feed and access them here.
              </p>
              <SignInButton mode="modal">
                <button
                  className="px-6 py-2 rounded-[0.125rem] text-sm font-bold tracking-widest uppercase text-[--color-on-primary-container] bg-[--color-primary-container] hover:opacity-90 transition-opacity"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  SIGN IN
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-[--color-surface-dim]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav />

        <div className="flex flex-1 overflow-hidden">
          {/* ── Left: Technical Reports (5/12) ── */}
          <div className="flex-[5] flex flex-col overflow-hidden border-r border-[--color-outline-variant]/10">
            <div className="px-4 py-3 shrink-0 bg-[--color-surface-container-low]">
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-black tracking-widest text-[--color-on-surface] uppercase"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  TECHNICAL REPORTS
                </span>
                <span
                  className="text-[10px] font-bold text-[--color-on-surface-variant] opacity-60"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  {isLoading ? "—" : savedItems.length} SAVED
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {isLoading ? (
                <SavedSkeletons count={3} />
              ) : savedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <span
                    className="text-[10px] font-bold tracking-widest text-[--color-on-surface-variant] opacity-40 uppercase"
                    style={{ fontFamily: "var(--font-headline)" }}
                  >
                    NO SAVED REPORTS
                  </span>
                  <span className="text-[11px] text-[--color-on-surface-variant] opacity-40" style={{ fontFamily: "var(--font-body)" }}>
                    Save articles from the feed to see them here
                  </span>
                </div>
              ) : (
                savedItems.map(({ article, savedAt }) => (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-3 p-3 rounded-[0.125rem] bg-[--color-surface-container-highest] hover:bg-[--color-surface-bright] transition-all group cursor-pointer"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-14 shrink-0 rounded-[0.125rem] overflow-hidden bg-[--color-surface-container] grayscale group-hover:grayscale-0 transition-all">
                      {article.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={article.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-[--color-surface-container-high]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Series badges */}
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {article.series.slice(0, 1).map((s) => (
                          <span
                            key={s}
                            className="text-[9px] font-bold tracking-widest uppercase text-[--color-tertiary]"
                            style={{ fontFamily: "var(--font-headline)" }}
                          >
                            #{s.toUpperCase()}
                          </span>
                        ))}
                        <span className="text-[9px] text-[--color-on-surface-variant] opacity-50 font-mono">
                          SAVED {formatRelative(savedAt)}
                        </span>
                      </div>

                      <h3
                        className="text-[12px] font-bold leading-snug line-clamp-2 text-[--color-on-surface] group-hover:text-[--color-primary] transition-colors"
                        style={{ fontFamily: "var(--font-headline)" }}
                      >
                        {article.title}
                      </h3>

                      {article.summary && (
                        <p className="text-[10px] text-[--color-on-surface-variant] line-clamp-2 leading-relaxed mt-0.5" style={{ fontFamily: "var(--font-body)" }}>
                          {article.summary}
                        </p>
                      )}

                      <span className="text-[9px] font-bold text-[--color-on-surface-variant] opacity-50 tracking-widest uppercase mt-1 block" style={{ fontFamily: "var(--font-headline)" }}>
                        {article.source.name}
                      </span>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>

          {/* ── Center: Video Replays (4/12) ── */}
          <div className="flex-[4] flex flex-col overflow-hidden border-r border-[--color-outline-variant]/10">
            <div className="px-4 py-3 shrink-0 bg-[--color-surface-container-low]">
              <span
                className="text-[10px] font-black tracking-widest text-[--color-on-surface] uppercase"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                VIDEO REPLAYS
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {upcomingSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <span
                    className="text-[10px] font-bold tracking-widest text-[--color-on-surface-variant] opacity-40 uppercase"
                    style={{ fontFamily: "var(--font-headline)" }}
                  >
                    NO UPCOMING SESSIONS
                  </span>
                </div>
              ) : (
                upcomingSessions.map((session) => {
                  const color = SERIES_COLOR[session.series] ?? "#f5f5f5";
                  const ytUrl = SERIES_YOUTUBE[session.series];
                  const sessionLabel = `${session.type.toUpperCase().replace("_", " ")}: ${session.eventName}`;
                  const startsAt = session.startsAt ? new Date(session.startsAt) : null;
                  const dateStr = startsAt
                    ? startsAt.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                    : "TBD";

                  return (
                    <a
                      key={session.id}
                      href={ytUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative flex flex-col rounded-[0.125rem] overflow-hidden bg-[--color-surface-container] group cursor-pointer hover:bg-[--color-surface-container-high] transition-all"
                      style={{ borderLeft: `2px solid ${color}` }}
                    >
                      <div className="p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="text-[9px] font-bold tracking-widest uppercase"
                            style={{ fontFamily: "var(--font-headline)", color }}
                          >
                            {session.series.toUpperCase()}
                          </span>
                          <span className="text-[9px] text-[--color-on-surface-variant] opacity-50 font-mono">
                            {dateStr}
                          </span>
                        </div>
                        <p
                          className="text-[11px] font-bold text-[--color-on-surface] group-hover:text-[--color-primary] transition-colors leading-snug"
                          style={{ fontFamily: "var(--font-headline)" }}
                        >
                          {sessionLabel}
                        </p>
                        <p className="text-[10px] text-[--color-on-surface-variant] opacity-60 mt-0.5" style={{ fontFamily: "var(--font-body)" }}>
                          {session.circuitName} · {session.country}
                        </p>
                      </div>
                      <div className="px-3 pb-2 flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                          <path d="M4 2l8 5-8 5V2z" fill="currentColor" style={{ color }} />
                        </svg>
                        <span className="text-[9px] font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-headline)", color }}>
                          WATCH ON YOUTUBE
                        </span>
                      </div>
                    </a>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right: Track Data (3/12) ── */}
          <div className="flex-[3] flex flex-col overflow-hidden">
            <div className="px-4 py-3 shrink-0 bg-[--color-surface-container-low]">
              <span
                className="text-[10px] font-black tracking-widest text-[--color-on-surface] uppercase"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                TRACK DATA
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {TRACK_DATA.map((t) => (
                <div
                  key={t.circuit}
                  className="p-3 rounded-[0.125rem] bg-[--color-surface-container-highest]"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <span
                      className="text-[9px] font-bold tracking-widest uppercase"
                      style={{ fontFamily: "var(--font-headline)", color: t.color }}
                    >
                      {t.series}
                    </span>
                    <span
                      className="text-[9px] font-bold tracking-widest text-[--color-on-surface-variant] opacity-60 uppercase"
                      style={{ fontFamily: "var(--font-headline)" }}
                    >
                      {t.type}
                    </span>
                  </div>
                  <p
                    className="text-[11px] font-black text-[--color-on-surface] uppercase tracking-wide mb-2"
                    style={{ fontFamily: "var(--font-headline)" }}
                  >
                    {t.circuit}
                  </p>
                  <div className="flex gap-3">
                    <div>
                      <p
                        className="text-[9px] tracking-widest text-[--color-on-surface-variant] opacity-50 uppercase"
                        style={{ fontFamily: "var(--font-headline)" }}
                      >
                        ENTRY
                      </p>
                      <p className="text-sm font-bold text-[--color-tertiary] font-mono">{t.entrySpeed}</p>
                    </div>
                    <div>
                      <p
                        className="text-[9px] tracking-widest text-[--color-on-surface-variant] opacity-50 uppercase"
                        style={{ fontFamily: "var(--font-headline)" }}
                      >
                        EXIT
                      </p>
                      <p className="text-sm font-bold text-[--color-tertiary] font-mono">{t.exitSpeed}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cloud sync badge */}
        <div className="shrink-0 flex justify-end px-4 py-2">
          <span
            className="glass-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-[0.125rem] text-[9px] font-bold tracking-widest text-[--color-tertiary] uppercase border border-[--color-outline-variant]/10"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[--color-tertiary]" />
            CLOUD_SYNC STATUS: UP_TO_DATE
          </span>
        </div>
      </div>
    </div>
  );
}

function SavedSkeletons({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 p-3 rounded-[0.125rem] bg-[--color-surface-container-highest] animate-pulse">
          <div className="w-20 h-14 shrink-0 rounded-[0.125rem] bg-[--color-surface-container-high]" />
          <div className="flex-1 space-y-2">
            <div className="h-2 bg-[--color-surface-container-high] rounded-[0.125rem] w-1/4" />
            <div className="h-3 bg-[--color-surface-container-high] rounded-[0.125rem] w-3/4" />
            <div className="h-2 bg-[--color-surface-container-high] rounded-[0.125rem] w-full" />
          </div>
        </div>
      ))}
    </>
  );
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffDays = Math.floor((now - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "TODAY";
  if (diffDays === 1) return "1D AGO";
  if (diffDays < 7) return `${diffDays}D AGO`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}W AGO`;
}

export default function SavedPageWrapper() {
  return (
    <QueryProvider>
      <SavedPage />
    </QueryProvider>
  );
}
