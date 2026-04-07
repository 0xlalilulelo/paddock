import { NextRequest, NextResponse } from "next/server";
import { db } from "@paddock/db";
import { articles, socialPosts } from "@paddock/db";
import { ilike, or, desc, sql } from "drizzle-orm";
import { generateEmbedding } from "@paddock/scrapers";
import type { SearchResult, SeriesId } from "@paddock/api-types";

export const runtime = "nodejs";

const VALID_SERIES: SeriesId[] = ["f1", "imsa", "wec", "nascar"];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const seriesParam = searchParams.get("series");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const series = seriesParam
    ? seriesParam.split(",").filter((s): s is SeriesId => VALID_SERIES.includes(s as SeriesId))
    : null;

  const pattern = `%${q}%`;

  // Attempt semantic search on articles via pgvector, fall back to ILIKE
  const [rawEmbedding, postRows] = await Promise.all([
    generateEmbedding(q, null),
    db
      .select()
      .from(socialPosts)
      .where(ilike(socialPosts.content, pattern))
      .orderBy(desc(socialPosts.publishedAt))
      .limit(limit),
  ]);

  // Validate embedding contains only finite numbers
  const queryEmbedding =
    rawEmbedding && rawEmbedding.every((n) => typeof n === "number" && Number.isFinite(n))
      ? rawEmbedding
      : null;

  type ArticleRow = typeof articles.$inferSelect & { similarity?: number };
  let articleRows: ArticleRow[];

  if (queryEmbedding) {
    const vectorStr = `[${queryEmbedding.join(",")}]`;
    const seriesFilter = series && series.length > 0
      ? sql` AND series && ARRAY[${sql.join(series.map((s) => sql`${s}`), sql`, `)}]::text[]`
      : sql``;
    articleRows = await db.execute<ArticleRow>(sql`
      SELECT *, 1 - (embedding <=> ${vectorStr}::vector) AS similarity
      FROM articles
      WHERE embedding IS NOT NULL${seriesFilter}
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${limit}
    `).then((r) => r.rows);
  } else {
    const conditions = [or(ilike(articles.title, pattern), ilike(articles.summary ?? sql`''`, pattern))];
    if (series && series.length > 0) {
      conditions.push(sql`${articles.series} && ARRAY[${sql.join(series.map((s) => sql`${s}`), sql`, `)}]::text[]`);
    }
    articleRows = await db
      .select()
      .from(articles)
      .where(sql.join(conditions, sql` AND `))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);
  }

  const results: SearchResult[] = [
    ...articleRows.map(
      (a): SearchResult => ({
        type: "article",
        score: typeof a.similarity === "number" ? a.similarity : 1,
        item: {
          id: a.id,
          title: a.title,
          summary: a.summary,
          source: { id: a.sourceId!, name: "", domain: "", faviconUrl: null },
          series: a.series as SeriesId[],
          publishedAt: a.publishedAt?.toISOString() ?? new Date().toISOString(),
          imageUrl: a.imageUrl,
          isBreaking: a.isBreaking,
          clusterId: a.clusterId,
          clusterCount: 0,
          url: a.url,
        },
      })
    ),
    ...postRows.map(
      (p): SearchResult => ({
        type: "social",
        score: 1,
        item: {
          id: p.id,
          platform: "x" as const,
          authorHandle: p.authorHandle,
          authorDisplayName: p.authorHandle,
          authorType: p.authorType as "official_series" | "official_team" | "journalist" | "driver",
          content: p.content,
          series: p.series as SeriesId[],
          publishedAt: p.publishedAt?.toISOString() ?? new Date().toISOString(),
          isBreaking: p.isBreaking,
          mediaUrls: p.mediaUrls as string[],
          url: p.url,
        },
      })
    ),
  ]
    .filter((r) => !series || r.item.series.some((s) => series.includes(s)))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return NextResponse.json(results);
}
