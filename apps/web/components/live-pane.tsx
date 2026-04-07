"use client";

import { useQuery } from "@tanstack/react-query";
import type { LiveData, SeriesId } from "@paddock/api-types";

const SERIES_META: Record<SeriesId, { label: string; color: string }> = {
  f1: { label: "Formula 1", color: "#E10600" },
  imsa: { label: "IMSA", color: "#00A651" },
  wec: { label: "WEC", color: "#0072CE" },
  nascar: { label: "NASCAR", color: "#FFB612" },
};

interface LivePaneProps {
  series: SeriesId;
  onClose: () => void;
}

export function LivePane({ series, onClose }: LivePaneProps) {
  const meta = SERIES_META[series];

  const { data, isLoading } = useQuery<LiveData>({
    queryKey: ["live", series],
    queryFn: () => fetch(`/api/live?series=${series}`).then((r) => r.json()),
    refetchInterval: 15_000,
  });

  return (
    <div className="flex flex-col h-full bg-[--color-surface] w-80 shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[--color-border] shrink-0">
        <span className="relative flex h-2 w-2">
          {data?.session ? (
            <>
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: meta.color }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: meta.color }}
              />
            </>
          ) : (
            <span className="inline-flex rounded-full h-2 w-2 bg-[--color-text-muted]" />
          )}
        </span>
        <span className="text-sm font-semibold text-[--color-text-primary] flex-1">
          {meta.label} Live
        </span>
        <button
          onClick={onClose}
          className="text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors p-0.5 rounded"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-[--color-text-muted] text-sm">
            Loading…
          </div>
        ) : !data?.session ? (
          <NoSessionState series={series} meta={meta} />
        ) : (
          <LiveContent data={data} meta={meta} />
        )}
      </div>
    </div>
  );
}

function NoSessionState({
  series,
  meta,
}: {
  series: SeriesId;
  meta: { label: string; color: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
        style={{ backgroundColor: meta.color + "22" }}
      >
        <span className="text-lg" style={{ color: meta.color }}>◎</span>
      </div>
      <p className="text-sm font-medium text-[--color-text-secondary]">No live session</p>
      <p className="text-xs text-[--color-text-muted] mt-1">
        {meta.label} is between sessions
      </p>
    </div>
  );
}

function LiveContent({
  data,
  meta,
}: {
  data: LiveData;
  meta: { label: string; color: string };
}) {
  const { session, positions, socialFeed } = data;
  if (!session) return null;

  return (
    <div>
      {/* Session badge */}
      <div
        className="mx-3 mt-3 mb-2 px-3 py-2 rounded-lg text-xs"
        style={{
          backgroundColor: meta.color + "18",
          border: `1px solid ${meta.color}33`,
        }}
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-bold uppercase tracking-wider" style={{ color: meta.color }}>
            Live
          </span>
          <span className="text-[--color-text-muted]">·</span>
          <span className="text-[--color-text-secondary] capitalize">{session.sessionType}</span>
        </div>
        <p className="text-[--color-text-primary] font-medium truncate">{session.eventName}</p>
        {session.timeRemaining !== null && (
          <p className="text-[--color-text-muted] mt-0.5">
            {formatTime(session.timeRemaining)} remaining
          </p>
        )}
      </div>

      {/* Leaderboard */}
      {positions.length > 0 && (
        <div>
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[--color-text-muted]">
            Leaderboard
          </div>
          {positions.map((pos) => (
            <div
              key={pos.position}
              className="flex items-center gap-2 px-3 py-1.5 border-b border-[--color-border-subtle] hover:bg-[--color-surface-raised] transition-colors"
            >
              <span className="w-5 text-right text-xs font-mono text-[--color-text-muted] shrink-0">
                {pos.position}
              </span>
              {pos.carNumber && (
                <span
                  className="text-[10px] font-bold px-1 rounded shrink-0"
                  style={{ backgroundColor: meta.color + "22", color: meta.color }}
                >
                  {pos.carNumber}
                </span>
              )}
              <span className="text-xs font-medium text-[--color-text-primary] flex-1 truncate">
                {pos.driverName}
              </span>
              {pos.classCategory && (
                <span className="text-[10px] text-[--color-text-muted] shrink-0">
                  {pos.classCategory}
                </span>
              )}
              <span className="text-[11px] font-mono text-[--color-text-muted] shrink-0 w-14 text-right">
                {pos.gap}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Live social feed */}
      {socialFeed.length > 0 && (
        <div className="mt-2">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[--color-text-muted]">
            Live updates
          </div>
          {socialFeed.slice(0, 10).map((post) => (
            <a
              key={post.id}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 border-b border-[--color-border-subtle] hover:bg-[--color-surface-raised] transition-colors"
            >
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-semibold text-[--color-text-primary]">
                  @{post.authorHandle}
                </span>
                <span className="text-[10px] text-[--color-text-muted]">
                  {formatAgo(post.publishedAt)}
                </span>
              </div>
              <p className="text-[11px] text-[--color-text-secondary] mt-0.5 leading-relaxed line-clamp-3">
                {post.content}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
