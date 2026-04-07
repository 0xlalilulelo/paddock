import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { getFeedArticles } from "@paddock/db";
import type { SeriesId, FeedPage, FeedItem } from "@paddock/api-types";

// Redis is optional — falls back to direct DB when env vars are absent (local dev)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export const runtime = "nodejs";

const VALID_SERIES: SeriesId[] = ["f1", "imsa", "wec", "nascar"];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const seriesParam = searchParams.get("series") ?? "f1";
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const type = searchParams.get("type") ?? "all";

  const series = seriesParam
    .split(",")
    .filter((s): s is SeriesId => VALID_SERIES.includes(s as SeriesId));

  if (!series.length) {
    return NextResponse.json({ error: "Invalid series" }, { status: 400 });
  }

  const cacheKey = `feed:${series.join(",")}:${type}:${cursor ?? "start"}:${limit}`;

  // Try cache first (skipped if Redis not configured)
  const cached = redis ? await redis.get<FeedPage>(cacheKey) : null;
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "public, max-age=30" },
    });
  }

  const { items: rows, nextCursor } = await getFeedArticles({
    series,
    cursor: cursor ?? undefined,
    limit,
  });

  const items: FeedItem[] = rows.map(({ article: a, source: s, clusterCount }) => ({
    type: "article",
    data: {
      id: a.id,
      title: a.title,
      summary: a.summary,
      source: { id: a.sourceId!, name: s?.name ?? "", domain: s?.domain ?? "", faviconUrl: s?.faviconUrl ?? null },
      series: a.series as SeriesId[],
      publishedAt: a.publishedAt?.toISOString() ?? new Date().toISOString(),
      imageUrl: a.imageUrl,
      isBreaking: a.isBreaking,
      clusterId: a.clusterId,
      clusterCount: clusterCount ?? 0,
      url: a.url,
    },
  }));

  const page: FeedPage = { items, nextCursor };

  // Cache for 30s (skipped if Redis not configured)
  if (redis) await redis.setex(cacheKey, 30, page);

  return NextResponse.json(page, {
    headers: { "Cache-Control": "public, max-age=30" },
  });
}
