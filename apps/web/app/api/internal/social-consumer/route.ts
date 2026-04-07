import { NextRequest, NextResponse } from "next/server";
import { verifyQueueSignature } from "@/lib/verify-queue-signature";
import { Redis } from "@upstash/redis";
import { db } from "@paddock/db";
import { socialPosts, xAccounts } from "@paddock/db";
import { scrapeXAccount, scrapeXAccountDirect } from "@paddock/scrapers";
import { classifySeries } from "@paddock/scrapers";
import { hashUrl } from "@paddock/scrapers";
import { enqueue } from "@/lib/queues";
import { eq } from "drizzle-orm";
import type { SeriesId, XAccountType } from "@paddock/api-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/** Vercel Queues consumer for scrape-social topic. */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-vercel-signature");
  const rawBody = await req.text();
  if (!verifyQueueSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = JSON.parse(rawBody) as {
      handle: string;
      platform: "x";
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { handle, platform } = parsed;

  // Look up account metadata for authorType and series
  const [account] = await db
    .select()
    .from(xAccounts)
    .where(eq(xAccounts.handle, handle))
    .limit(1);
  const authorType: XAccountType = (account?.accountType as XAccountType) ?? "journalist";
  const accountSeries: SeriesId[] = (account?.series as SeriesId[]) ?? ["f1"];

  // Try Nitter first, fall back to Playwright direct
  let posts = await scrapeXAccount(handle, authorType, accountSeries).catch(() => []);
  if (!posts.length) {
    posts = await scrapeXAccountDirect(handle, authorType, accountSeries).catch(() => []);
  }

  let inserted = 0;

  for (const post of posts) {
    const urlHash = hashUrl(post.url);

    // Dedup check
    const existing = await redis.get(`social-dedup:${urlHash}`);
    if (existing) continue;

    const series = classifySeries(post.content, post.url);

    try {
      const [row] = await db
        .insert(socialPosts)
        .values({
          platform: "x",
          authorHandle: handle,
          authorDisplayName: account?.displayName ?? handle,
          authorType: authorType,
          content: post.content,
          url: post.url,
          series: series.length ? series : (["f1"] as SeriesId[]),
          publishedAt: post.publishedAt,
          isBreaking: false,
          mediaUrls: post.mediaUrls ?? [],
        })
        .onConflictDoNothing()
        .returning({ id: socialPosts.id });

      if (!row) continue;

      inserted++;

      // Mark dedup (24h TTL)
      await redis.setex(`social-dedup:${urlHash}`, 86_400, "1");

      // Publish to feed channels
      const feedItem = {
        type: "social",
        item: {
          type: "social",
          data: {
            id: row.id,
            platform: "x" as const,
            authorHandle: handle,
            authorDisplayName: handle,
            authorType: post.authorType ?? "journalist",
            content: post.content,
            series: series.length ? series : ["f1"],
            publishedAt: post.publishedAt.toISOString(),
            isBreaking: false,
            mediaUrls: post.mediaUrls ?? [],
            url: post.url,
          },
        },
      };

      for (const s of series) {
        await redis.lpush(`feed-recent:${s}`, feedItem);
        await redis.ltrim(`feed-recent:${s}`, 0, 49);
      }
    } catch {
      // duplicate or constraint violation — skip
    }
  }

  return NextResponse.json({ ok: true, handle, inserted });
}
