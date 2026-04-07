import { NextRequest, NextResponse } from "next/server";
import { db } from "@paddock/db";
import { sources, xAccounts } from "@paddock/db";
import { eq, inArray } from "drizzle-orm";
import { enqueue, enqueueBatch } from "@/lib/queues";
import type { SeriesId } from "@paddock/api-types";

export const runtime = "nodejs";

const VALID_SERIES: SeriesId[] = ["f1", "imsa", "wec", "nascar"];

export async function GET(req: NextRequest) {
  const secret =
    req.headers.get("x-vercel-cron-secret") ??
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const tier = searchParams.get("tier");
  const type = searchParams.get("type");

  try {
    let jobCount = 0;

    const all = searchParams.get("all") === "true";

    if (all) {
      // Hobby plan: single daily cron runs everything
      const [t1, t2, social, live] = await Promise.all([
        triggerNewsScrapes(1),
        triggerNewsScrapes(2),
        triggerSocialScrapes(),
        triggerLiveScrapes(),
      ]);
      jobCount = t1 + t2 + social + live;
    } else if (type === "social") {
      jobCount = await triggerSocialScrapes();
    } else if (type === "live") {
      jobCount = await triggerLiveScrapes();
    } else if (tier === "1" || tier === "2") {
      jobCount = await triggerNewsScrapes(Number(tier) as 1 | 2);
    } else {
      return NextResponse.json({ error: "Missing tier, type, or all param" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, jobCount });
  } catch (err) {
    console.error("[scrape-trigger]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function triggerNewsScrapes(tier: 1 | 2): Promise<number> {
  const allSources = await db
    .select()
    .from(sources)
    .where(eq(sources.tier, tier));

  await enqueueBatch(
    allSources.map((source) => ({
      topic: "scrape-source" as const,
      payload: {
        sourceId: source.id,
        feedUrl: source.domain,
        series: source.series as string[],
      },
    }))
  );

  return allSources.length;
}

async function triggerSocialScrapes(): Promise<number> {
  const accounts = await db
    .select()
    .from(xAccounts)
    .where(eq(xAccounts.isActive, true));

  await enqueueBatch(
    accounts.map((acct) => ({
      topic: "scrape-social" as const,
      payload: { handle: acct.handle, platform: "x" as const },
    }))
  );

  return accounts.length;
}

async function triggerLiveScrapes(): Promise<number> {
  await enqueueBatch(
    VALID_SERIES.map((series) => ({
      topic: "scrape-live" as const,
      payload: { series },
    }))
  );

  return VALID_SERIES.length;
}
