import { NextRequest, NextResponse } from "next/server";
import { verifyQueueSignature } from "@/lib/verify-queue-signature";
import {
  MotorsportComScraper,
  TheRaceScraper,
  AutosportScraper,
  RaceFansScraper,
  ImsaScraper,
  FiawecScraper,
  NascarScraper,
  RadioLeMansScraper,
  classifySeries,
  classifySeriesAI,
  BaseScraper,
} from "@paddock/scrapers";
import { enqueue } from "@/lib/queues";
import type { SeriesId } from "@paddock/api-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SCRAPER_MAP: Record<string, () => BaseScraper> = {
  "motorsport-com-f1": () => new MotorsportComScraper("f1"),
  "motorsport-com-imsa": () => new MotorsportComScraper("imsa"),
  "motorsport-com-wec": () => new MotorsportComScraper("wec"),
  "motorsport-com-nascar": () => new MotorsportComScraper("nascar"),
  "the-race-f1": () => new TheRaceScraper("f1"),
  "the-race-imsa": () => new TheRaceScraper("imsa"),
  "the-race-wec": () => new TheRaceScraper("wec"),
  "the-race-nascar": () => new TheRaceScraper("nascar"),
  "autosport-f1": () => new AutosportScraper("f1"),
  "autosport-imsa": () => new AutosportScraper("imsa"),
  "autosport-wec": () => new AutosportScraper("wec"),
  "autosport-nascar": () => new AutosportScraper("nascar"),
  "racefans": () => new RaceFansScraper(),
  "imsa": () => new ImsaScraper(),
  "fiawec": () => new FiawecScraper(),
  "nascar": () => new NascarScraper(),
  "radiolemans": () => new RadioLeMansScraper(),
};

/** Vercel Queues consumer for scrape-source topic. */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-vercel-signature");
  const rawBody = await req.text();
  if (!verifyQueueSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = JSON.parse(rawBody) as {
      sourceId: string;
      feedUrl: string;
      series: string[];
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { sourceId, feedUrl, series } = parsed;

  const factory = SCRAPER_MAP[sourceId];
  if (!factory) {
    console.warn(`[source-consumer] Unknown sourceId: ${sourceId}`);
    return NextResponse.json({ ok: true, skipped: "unknown source" });
  }

  const scraper = factory();
  let scraped = 0;

  try {
    for await (const article of scraper.scrapeAll()) {
      // Ensure series is tagged — fall back to AI if rule-based returns nothing
      let taggedSeries = article.series as SeriesId[];
      if (!taggedSeries.length) {
        taggedSeries = classifySeries(article.title, article.url, article.bodyText);
      }
      if (!taggedSeries.length) {
        taggedSeries = await classifySeriesAI(article.title, article.bodyText);
      }

      await enqueue({
        topic: "process-article",
        payload: {
          type: "process-article",
          rawArticle: {
            url: article.url,
            title: article.title,
            content: article.bodyText,
            publishedAt: (article.publishedAt ?? new Date()).toISOString(),
            imageUrl: article.imageUrl,
            sourceId: article.sourceId,
            series: taggedSeries,
          },
        },
      });

      scraped++;
    }
  } catch (err) {
    console.error(JSON.stringify({
      tag: "SCRAPER_FAILURE",
      sourceId,
      error: err instanceof Error ? err.message : String(err),
      ts: new Date().toISOString(),
    }));
    return NextResponse.json({ ok: true, sourceId, scraped: 0, error: "scraper_failed" });
  }

  return NextResponse.json({ ok: true, sourceId, scraped });
}
