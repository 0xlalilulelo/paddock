import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { getFeedArticles, getFeedSocialPosts } from "@paddock/db";
import type { SeriesId, FeedPage, FeedItem, XAccountType } from "@paddock/api-types";

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
  const typeParam = searchParams.get("type") ?? "all";
  const type = typeParam === "article" || typeParam === "social" ? typeParam : "all";

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

  const opts = { series, cursor: cursor ?? undefined, limit };

  let items: FeedItem[];
  let nextCursor: string | null;

  if (type === "article") {
    const result = await getFeedArticles(opts);
    items = mapArticleRows(result.items);
    nextCursor = result.nextCursor;
  } else if (type === "social") {
    const result = await getFeedSocialPosts(opts);
    items = mapSocialRows(result.items);
    nextCursor = result.nextCursor;
  } else {
    // type=all: fetch both in parallel, merge sorted by publishedAt desc
    const [articleResult, socialResult] = await Promise.all([
      getFeedArticles(opts),
      getFeedSocialPosts(opts),
    ]);

    const merged = [
      ...mapArticleRows(articleResult.items),
      ...mapSocialRows(socialResult.items),
    ].sort(
      (a, b) =>
        new Date(b.data.publishedAt).getTime() -
        new Date(a.data.publishedAt).getTime()
    );

    const hasMore = merged.length > limit;
    items = hasMore ? merged.slice(0, limit) : merged;
    nextCursor = hasMore ? (items.at(-1)?.data.publishedAt ?? null) : null;
  }

  const page: FeedPage = { items, nextCursor };

  // Cache for 30s (skipped if Redis not configured)
  if (redis) await redis.setex(cacheKey, 30, page);

  return NextResponse.json(page, {
    headers: { "Cache-Control": "public, max-age=30" },
  });
}

function mapArticleRows(
  rows: Awaited<ReturnType<typeof getFeedArticles>>["items"]
): FeedItem[] {
  return rows.map(({ article: a, source: s, clusterCount }) => ({
    type: "article" as const,
    data: {
      id: a.id,
      title: a.title,
      summary: a.summary,
      source: {
        id: a.sourceId!,
        name: s?.name ?? "",
        domain: s?.domain ?? "",
        faviconUrl: s?.faviconUrl ?? null,
      },
      series: a.series as SeriesId[],
      publishedAt: a.publishedAt?.toISOString() ?? new Date().toISOString(),
      imageUrl: a.imageUrl,
      isBreaking: a.isBreaking,
      clusterId: a.clusterId,
      clusterCount: clusterCount ?? 0,
      url: a.url,
    },
  }));
}

function mapSocialRows(
  rows: Awaited<ReturnType<typeof getFeedSocialPosts>>["items"]
): FeedItem[] {
  return rows.map((p) => ({
    type: "social" as const,
    data: {
      id: p.id,
      platform: "x" as const,
      authorHandle: p.authorHandle,
      authorDisplayName: p.authorDisplayName,
      authorType: p.authorType as XAccountType,
      content: p.content,
      url: p.url,
      series: p.series as SeriesId[],
      publishedAt: p.publishedAt.toISOString(),
      isBreaking: p.isBreaking,
      mediaUrls: p.mediaUrls,
    },
  }));
}
