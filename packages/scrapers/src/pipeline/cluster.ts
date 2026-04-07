import { db } from "@paddock/db";
import { articles, clusters } from "@paddock/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import type { SeriesId } from "@paddock/api-types";

const SIMILARITY_THRESHOLD = 0.85;
const CLUSTER_WINDOW_HOURS = 6;
const CLUSTER_TTL_HOURS = 48;

/**
 * Find or create a story cluster for a new article.
 * Uses pgvector cosine similarity against recent articles in the same series.
 *
 * Returns the cluster ID to assign to the article.
 */
export async function findOrCreateCluster(
  articleId: string,
  embedding: number[],
  series: SeriesId[]
): Promise<string | null> {
  if (!embedding || embedding.length === 0) return null;
  if (!embedding.every(n => typeof n === 'number' && Number.isFinite(n))) return null;

  const windowStart = new Date(
    Date.now() - CLUSTER_WINDOW_HOURS * 60 * 60 * 1000
  );
  const embeddingStr = `[${embedding.join(",")}]`;

  // Find the most similar recent article with a cluster
  const result = await db.execute(sql`
    SELECT
      a.cluster_id,
      1 - (a.embedding <=> ${embeddingStr}::vector) as similarity
    FROM articles a
    WHERE
      a.cluster_id IS NOT NULL
      AND a.scraped_at >= ${windowStart}
      AND a.series && ${sql`ARRAY[${sql.join(series.map((s) => sql`${s}`), sql`, `)}]::text[]`}
      AND a.embedding IS NOT NULL
    ORDER BY a.embedding <=> ${embeddingStr}::vector
    LIMIT 1
  `);
  const similar = (result as unknown as { rows: Record<string, unknown>[] }).rows?.[0];

  if (
    similar &&
    typeof similar.similarity === "number" &&
    similar.similarity >= SIMILARITY_THRESHOLD &&
    similar.cluster_id
  ) {
    // Add to existing cluster
    await db
      .update(clusters)
      .set({ articleCount: sql`article_count + 1` })
      .where(eq(clusters.id, similar.cluster_id as string));
    return similar.cluster_id as string;
  }

  // Create a new cluster with this article as the representative
  const expiresAt = new Date(Date.now() + CLUSTER_TTL_HOURS * 60 * 60 * 1000);
  const [newCluster] = await db
    .insert(clusters)
    .values({
      representativeArticleId: articleId,
      series: series[0] ?? "f1",
      articleCount: 1,
      expiresAt,
    })
    .returning();

  return newCluster?.id ?? null;
}
