import { db } from "../client";
import { socialPosts } from "../schema";
import { desc, lt, and, sql } from "drizzle-orm";
import type { SeriesId } from "@paddock/api-types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export interface GetFeedSocialOptions {
  series: SeriesId[];
  cursor?: string; // ISO timestamp
  limit?: number;
}

export async function getFeedSocialPosts(opts: GetFeedSocialOptions) {
  const limit = Math.min(opts.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const cursorDate = opts.cursor ? new Date(opts.cursor) : undefined;

  const conditions = [
    sql`${socialPosts.series} && ${sql`ARRAY[${sql.join(opts.series.map((s) => sql`${s}`), sql`, `)}]::text[]`}`,
  ];

  if (cursorDate) {
    conditions.push(lt(socialPosts.publishedAt, cursorDate));
  }

  const rows = await db
    .select()
    .from(socialPosts)
    .where(and(...conditions))
    .orderBy(desc(socialPosts.publishedAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    items,
    nextCursor: hasMore ? (items.at(-1)?.publishedAt?.toISOString() ?? null) : null,
  };
}
