import { db } from "../client";
import { articles, clusters, sources, savedArticles } from "../schema";
import {
  eq,
  desc,
  lt,
  and,
  inArray,
  sql,
  arrayContains,
} from "drizzle-orm";
import type { SeriesId, FeedContentType, FeedSortOrder } from "@paddock/api-types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export interface GetFeedOptions {
  series: SeriesId[];
  cursor?: string; // ISO timestamp
  limit?: number;
  type?: FeedContentType;
  sort?: FeedSortOrder;
}

export async function getFeedArticles(opts: GetFeedOptions) {
  const limit = Math.min(opts.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const cursorDate = opts.cursor ? new Date(opts.cursor) : undefined;

  const conditions = [
    // Filter by series — article.series array overlaps with requested series
    sql`${articles.series} && ${sql`ARRAY[${sql.join(opts.series.map((s) => sql`${s}`), sql`, `)}]::text[]`}`,
  ];

  if (cursorDate) {
    conditions.push(lt(articles.publishedAt, cursorDate));
  }

  const rows = await db
    .select({
      article: articles,
      source: sources,
      clusterCount:
        sql<number>`COALESCE((SELECT article_count FROM clusters WHERE id = ${articles.clusterId}), 1)`.as(
          "cluster_count"
        ),
    })
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .where(and(...conditions))
    .orderBy(desc(articles.publishedAt))
    .limit(limit + 1); // fetch one extra to determine if there's a next page

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    items,
    nextCursor: hasMore
      ? (items.at(-1)?.article.publishedAt?.toISOString() ?? null)
      : null,
  };
}

export async function getArticleByUrlHash(urlHash: string) {
  const [row] = await db
    .select()
    .from(articles)
    .where(eq(articles.urlHash, urlHash))
    .limit(1);
  return row ?? null;
}

export async function getBreakingArticles(series: SeriesId[], limit = 5) {
  return db
    .select({ article: articles, source: sources })
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .where(
      and(
        eq(articles.isBreaking, true),
        sql`${articles.series} && ${sql`ARRAY[${sql.join(series.map((s) => sql`${s}`), sql`, `)}]::text[]`}`
      )
    )
    .orderBy(desc(articles.scrapedAt))
    .limit(limit);
}

export async function getClusterArticles(clusterId: string) {
  return db
    .select({ article: articles, source: sources })
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .where(eq(articles.clusterId, clusterId))
    .orderBy(desc(articles.publishedAt));
}
