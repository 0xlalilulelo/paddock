import { NextRequest, NextResponse } from "next/server";
import { verifyQueueSignature } from "@/lib/verify-queue-signature";
import {
  hashUrl,
  isDuplicate,
  summarizeArticle,
  classifyBreaking,
  generateEmbedding,
  findOrCreateCluster,
} from "@paddock/scrapers";
import { db } from "@paddock/db";
import { articles } from "@paddock/db";
import { Redis } from "@upstash/redis";
import type { SeriesId, XAccountType } from "@paddock/api-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface ProcessArticlePayload {
  type: "process-article";
  rawArticle: {
    url: string;
    title: string;
    content: string;
    publishedAt: string;
    imageUrl: string | null;
    sourceId: string;
    series: SeriesId[];
  };
}

export async function POST(req: NextRequest) {
  // Verify Vercel Queues signature
  const signature = req.headers.get("x-vercel-signature");
  const rawBody = await req.text();
  if (!verifyQueueSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = JSON.parse(rawBody) as ProcessArticlePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const payload = parsed;

  if (payload.type === "process-article") {
    await processArticle(payload.rawArticle);
  }

  return NextResponse.json({ ok: true });
}

async function processArticle(raw: ProcessArticlePayload["rawArticle"]) {
  const urlHash = hashUrl(raw.url);

  // 1. Dedup
  const duplicate = await isDuplicate(urlHash);
  if (duplicate) return;

  // 2. Summarize
  const summary = await summarizeArticle(raw.title, raw.content);

  // 3. Breaking classification
  const isBreaking = await classifyBreaking(raw.title, summary);

  // 4. Embedding
  const embedding = await generateEmbedding(raw.title, summary);

  // 5. Insert (clusterId assigned after, needs articleId for self-exclusion)
  const [inserted] = await db
    .insert(articles)
    .values({
      url: raw.url,
      urlHash,
      title: raw.title,
      sourceId: raw.sourceId,
      series: raw.series,
      publishedAt: new Date(raw.publishedAt),
      summary,
      imageUrl: raw.imageUrl,
      isBreaking,
      clusterId: null,
      embedding: embedding as number[] | null,
    })
    .returning({ id: articles.id });

  if (!inserted) return;

  // 6. Cluster (requires articleId to exclude self from similarity search)
  const clusterId = embedding
    ? await findOrCreateCluster(inserted.id, embedding, raw.series)
    : null;

  if (clusterId) {
    const { eq } = await import("drizzle-orm");
    await db.update(articles).set({ clusterId }).where(eq(articles.id, inserted.id));
  }

  // 7. Publish to Redis feed channels
  const feedItem = {
    type: isBreaking ? "breaking" : "article",
    item: {
      type: "article",
      data: {
        id: inserted.id,
        title: raw.title,
        summary,
        source: { id: raw.sourceId, name: "", faviconUrl: null },
        series: raw.series,
        publishedAt: raw.publishedAt,
        imageUrl: raw.imageUrl,
        isBreaking,
        clusterId,
        clusterCount: null,
        url: raw.url,
      },
    },
  };

  for (const s of raw.series) {
    await redis.lpush(`feed-recent:${s}`, feedItem);
    await redis.ltrim(`feed-recent:${s}`, 0, 49); // keep last 50
  }
}
