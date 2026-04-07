import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { getLiveSession } from "@paddock/db";
import { F1LiveScraper, ImsaLiveScraper, FiawecLiveScraper, NascarLiveScraper } from "@paddock/scrapers";
import type { SeriesId, LiveData } from "@paddock/api-types";

export const runtime = "nodejs";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const VALID_SERIES: SeriesId[] = ["f1", "imsa", "wec", "nascar"];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const series = searchParams.get("series") as SeriesId | null;

  if (!series || !VALID_SERIES.includes(series)) {
    return NextResponse.json({ error: "Invalid series" }, { status: 400 });
  }

  const cacheKey = `live:${series}`;
  const cached = await redis.get<LiveData>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "public, max-age=15" },
    });
  }

  const session = await getLiveSession(series);
  if (!session) {
    return NextResponse.json(
      { session: null, positions: [], socialFeed: [] },
      { headers: { "Cache-Control": "public, max-age=15" } }
    );
  }

  let liveData: LiveData = { session: null, positions: [], socialFeed: [] };

  const scraperMap = {
    f1: () => new F1LiveScraper().fetchLiveData(),
    imsa: () => new ImsaLiveScraper().fetchLiveData(),
    wec: () => new FiawecLiveScraper().fetchLiveData(),
    nascar: () => new NascarLiveScraper().fetchLiveData(),
  } satisfies Record<SeriesId, () => Promise<{ session: LiveData["session"]; positions: LiveData["positions"] }>>;

  const scrape = scraperMap[series];
  if (scrape) {
    const raw = await scrape();
    liveData = { ...raw, socialFeed: [] };
  }

  await redis.setex(cacheKey, 15, liveData);

  return NextResponse.json(liveData, {
    headers: { "Cache-Control": "public, max-age=15" },
  });
}
