import { NextRequest, NextResponse } from "next/server";
import { verifyQueueSignature } from "@/lib/verify-queue-signature";
import { Redis } from "@upstash/redis";
import { db } from "@paddock/db";
import { sessions, events } from "@paddock/db";
import { eq, and, lte, gte, desc } from "drizzle-orm";
import { F1LiveScraper, ImsaLiveScraper, FiawecLiveScraper, NascarLiveScraper } from "@paddock/scrapers";
import { enqueue } from "@/lib/queues";
import type { SeriesId, LiveData } from "@paddock/api-types";

export const runtime = "nodejs";
export const maxDuration = 30;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/** Vercel Queues consumer for scrape-live topic. */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-vercel-signature");
  const rawBody = await req.text();
  if (!verifyQueueSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = JSON.parse(rawBody) as { series: SeriesId };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { series } = parsed;

  let liveData: Awaited<ReturnType<typeof fetchLiveData>>;
  try {
    liveData = await fetchLiveData(series);
  } catch (err) {
    console.error(JSON.stringify({
      tag: "LIVE_SCRAPER_FAILURE",
      series,
      error: err instanceof Error ? err.message : String(err),
      ts: new Date().toISOString(),
    }));
    return NextResponse.json({ ok: true, series, session: null });
  }

  // Cache in Redis for /api/live endpoint
  await redis.setex(`live:${series}`, 15, liveData);

  if (!liveData.session) {
    return NextResponse.json({ ok: true, session: null });
  }

  // Mark the matching session as live.
  // Scrapers return external IDs (e.g. OpenF1 session_key), not DB UUIDs,
  // so we look up by series + date window instead of by exact ID.
  const now = new Date();
  const lookbackMs = 12 * 60 * 60 * 1000; // 24-hour endurance races still in window
  const [dbSession] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .innerJoin(events, eq(sessions.eventId, events.id))
    .where(
      and(
        eq(events.series, series),
        lte(sessions.startsAt, now),
        gte(sessions.startsAt, new Date(now.getTime() - lookbackMs))
      )
    )
    .orderBy(desc(sessions.startsAt))
    .limit(1);

  if (dbSession) {
    await db
      .update(sessions)
      .set({ status: "live" })
      .where(eq(sessions.id, dbSession.id))
      .catch(() => null);
  }

  // Dispatch push notifications for race start
  if (liveData.session.sessionType === "race") {
    await notifyRaceStart(series, liveData.session.eventName);
  }

  return NextResponse.json({ ok: true, series, positions: liveData.positions.length });
}

async function fetchLiveData(series: SeriesId): Promise<LiveData> {
  let raw: { session: LiveData["session"]; positions: LiveData["positions"] };
  switch (series) {
    case "f1":
      raw = await new F1LiveScraper().fetchLiveData();
      break;
    case "imsa":
      raw = await new ImsaLiveScraper().fetchLiveData();
      break;
    case "wec":
      raw = await new FiawecLiveScraper().fetchLiveData();
      break;
    case "nascar":
      raw = await new NascarLiveScraper().fetchLiveData();
      break;
    default:
      return { session: null, positions: [], socialFeed: [] };
  }
  // socialFeed is merged in by /api/live at read time; store empty array here
  return { ...raw, socialFeed: [] };
}

async function notifyRaceStart(series: SeriesId, eventName: string) {
  // Find users with push tokens enabled for this series (paginated to avoid OOM)
  const BATCH_SIZE = 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const users = await db.query.userPreferences.findMany({
      limit: BATCH_SIZE,
      offset,
    });

    if (users.length < BATCH_SIZE) {
      hasMore = false;
    }
    offset += BATCH_SIZE;

    const jobs = users
      .filter((u) => {
        const prefs = u.notificationPrefs as Record<string, unknown> | null;
        const seriesPrefs = prefs?.[series] as Record<string, unknown> | undefined;
        return u.pushToken && seriesPrefs?.raceStart;
      })
      .map((u) =>
        enqueue({
          topic: "send-push",
          payload: {
            userId: u.userId,
            notification: {
              title: `${series.toUpperCase()} Race Starting`,
              body: eventName,
              data: { series, type: "race_start" },
            },
          },
        })
      );

    await Promise.allSettled(jobs);
  }
}
