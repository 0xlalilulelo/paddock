"use client";

import { useState } from "react";
import type { FeedItem, ArticleSummary, SocialPost, SeriesId } from "@paddock/api-types";

const SERIES_COLOR: Record<SeriesId, string> = {
  f1: "#e10600",
  imsa: "#00a651",
  wec: "#0072ce",
  nascar: "#ffb612",
};

interface StoryCardProps {
  item: FeedItem;
}

export function StoryCard({ item }: StoryCardProps) {
  if (item.type === "article") {
    return <ArticleCard article={item.data} />;
  }
  return <SocialCard post={item.data} />;
}

function ArticleCard({ article }: { article: ArticleSummary }) {
  const primarySeries = article.series[0] as SeriesId | undefined;
  const seriesColor = primarySeries ? SERIES_COLOR[primarySeries] : "#ffb4a8";
  const [imgError, setImgError] = useState(false);
  const hasImage = Boolean(article.imageUrl) && !imgError;

  // ── Compact "data stream" variant ─────────────────────────────────────
  // Used when there's no AI summary — renders as a slim border-b row
  if (!article.summary) {
    return (
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block py-3 border-b border-[--color-outline-variant]/10 cursor-pointer"
      >
        {/* Category label in cyan (#4cd6ff) — matches mockup "BOP_UPDATE" style */}
        <div className="text-[9px] font-bold text-[--color-tertiary] mb-1 uppercase tracking-tighter">
          {article.isBreaking ? "BREAKING" : (article.series[0]?.toUpperCase() ?? "NEWS")}
        </div>
        <h4
          className="text-xs font-bold leading-tight mb-1 text-[--color-on-surface] group-hover:text-[--color-primary] transition-colors"
          style={{ fontFamily: "var(--font-headline)" }}
        >
          {article.title}
        </h4>
        <div className="text-[9px] text-[--color-on-surface-variant] uppercase tracking-widest">
          SOURCE: {article.source.name.toUpperCase()}
        </div>
      </a>
    );
  }

  // ── Hero card (has image) ─────────────────────────────────────────────
  // Image is a natural block at the TOP of the card — wrapper has overflow-hidden,
  // no negative margins needed. Content section sits below in its own p-4 div.
  if (hasImage) {
    return (
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className={[
          "group block rounded-[0.125rem] overflow-hidden cursor-pointer transition-all",
          "bg-[--color-surface-container-highest] hover:bg-[--color-surface-bright]",
          article.isBreaking ? "border-l-2 border-[--color-primary-container]" : "",
        ].join(" ")}
      >
        {/* Hero image — fills full card width naturally */}
        <div className="h-32 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.imageUrl!}
            alt=""
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
            onError={() => setImgError(true)}
          />
          {/* Gradient fades image into the card background below */}
          <div className="absolute inset-0 bg-gradient-to-t from-[--color-surface-container-highest] to-transparent" />
          {/* Source name pinned bottom-left over image */}
          <span className="absolute bottom-2 left-4 text-[9px] font-black italic px-2 py-0.5 bg-[--color-primary] text-black leading-none">
            {article.source.name.replace(/\s+/g, "_").toUpperCase()}
          </span>
        </div>

        {/* Content below the image */}
        <div className="p-4">
          <CardMeta article={article} seriesColor={seriesColor} />
          <h3
            className="font-bold text-lg leading-tight mb-2 group-hover:text-[--color-primary] transition-colors text-[--color-on-surface]"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            {article.title}
          </h3>
          <p className="text-xs text-[--color-on-surface-variant] line-clamp-3 mb-4 leading-relaxed">
            {article.summary}
          </p>
          <SourceRow article={article} />
        </div>
      </a>
    );
  }

  // ── Standard text card (no image) ────────────────────────────────────
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        "group block p-4 rounded-[0.125rem] cursor-pointer transition-all",
        "bg-[--color-surface-container-highest] hover:bg-[--color-surface-bright]",
        article.isBreaking ? "border-l-2 border-[--color-primary-container]" : "",
      ].join(" ")}
    >
      <CardMeta article={article} seriesColor={seriesColor} />
      <h3
        className="font-bold text-base leading-tight mb-2 group-hover:text-[--color-primary] transition-colors text-[--color-on-surface]"
        style={{ fontFamily: "var(--font-headline)" }}
      >
        {article.title}
      </h3>
      <p className="text-xs text-[--color-on-surface-variant] line-clamp-3 mb-4 leading-relaxed">
        {article.summary}
      </p>
      <SourceRow article={article} />
    </a>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────

function CardMeta({
  article,
  seriesColor,
}: {
  article: ArticleSummary;
  seriesColor: string;
}) {
  return (
    <div className="flex justify-between items-start mb-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {article.isBreaking && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[--color-primary-container]">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#e10600" }} />
            BREAKING
          </span>
        )}
        {article.series.slice(0, 2).map((s) => (
          <span
            key={s}
            className="text-[10px] font-bold tracking-widest uppercase"
            style={{ color: SERIES_COLOR[s as SeriesId] ?? seriesColor }}
          >
            #{s.toUpperCase()}
          </span>
        ))}
      </div>
      <time className="text-[10px] text-[--color-on-surface-variant] font-mono shrink-0 ml-2">
        {formatTime(article.publishedAt)}
      </time>
    </div>
  );
}

function SourceRow({ article }: { article: ArticleSummary }) {
  return (
    <div className="flex items-center gap-2">
      {(article.source as { faviconUrl?: string }).faviconUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={(article.source as { faviconUrl?: string }).faviconUrl}
          alt=""
          className="w-4 h-4 rounded-full opacity-70"
        />
      )}
      <span className="text-[10px] font-bold text-[--color-on-surface-variant] tracking-widest uppercase">
        {article.source.name}
      </span>
      {article.clusterCount && article.clusterCount > 1 && (
        <span className="text-[10px] text-[--color-on-surface-variant] opacity-60">
          +{article.clusterCount - 1} related
        </span>
      )}
    </div>
  );
}

// ── SocialCard ───────────────────────────────────────────────────────────

function SocialCard({ post }: { post: SocialPost }) {
  const primarySeries = post.series[0] as SeriesId | undefined;
  const seriesColor = primarySeries ? SERIES_COLOR[primarySeries] : "#ffb4a8";
  const [mediaError, setMediaError] = useState(false);

  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        "group block p-4 rounded-[0.125rem] cursor-pointer transition-all",
        "bg-[--color-surface-container-highest] hover:bg-[--color-surface-bright]",
        post.isBreaking ? "border-l-2 border-[--color-primary-container]" : "",
      ].join(" ")}
    >
      {post.isBreaking && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[--color-primary-container] mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#e10600" }} />
          BREAKING
        </span>
      )}

      <div className="flex items-start gap-2">
        {/* Avatar circle with series color */}
        <div
          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
          style={{ backgroundColor: seriesColor }}
        >
          {post.authorDisplayName?.charAt(0).toUpperCase() ?? "?"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span
              className="text-[12px] font-bold text-[--color-on-surface]"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              {post.authorDisplayName}
            </span>
            <span className="text-[10px] text-[--color-on-surface-variant] font-mono">
              @{post.authorHandle}
            </span>
            <span className="text-[10px] text-[--color-on-surface-variant]">·</span>
            <time className="text-[10px] text-[--color-on-surface-variant] font-mono">
              {formatTime(post.publishedAt)}
            </time>
          </div>

          <p className="mt-0.5 text-[12px] text-[--color-on-surface-variant] leading-relaxed whitespace-pre-wrap break-words line-clamp-4">
            {post.content}
          </p>

          {post.mediaUrls && post.mediaUrls.length > 0 && !mediaError && (
            <div className="relative mt-1.5 rounded-[0.125rem] overflow-hidden bg-[--color-surface-container] h-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.mediaUrls[0]}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setMediaError(true)}
              />
            </div>
          )}
        </div>
      </div>
    </a>
  );
}

// ── Utilities ────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
