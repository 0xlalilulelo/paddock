import { NextRequest, NextResponse } from "next/server";
import {
  MotorsportComScraper,
  TheRaceScraper,
  AutosportScraper,
  RaceFansScraper,
  ImsaScraper,
  FiawecScraper,
  NascarScraper,
  RadioLeMansScraper,
  hashUrl,
  isDuplicate,
  summarizeArticle,
  classifyBreaking,
  classifySeries,
  BaseScraper,
} from "@paddock/scrapers";
import { db } from "@paddock/db";
import { articles } from "@paddock/db";
import type { SeriesId } from "@paddock/api-types";

export const runtime = "nodejs";
export const maxDuration = 300;

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

/**
 * Direct scrape endpoint — bypasses Vercel Queues.
 * Scrapes sources directly and inserts articles into the database.
 * Protected by CRON_SECRET.
 *
 * Usage:
 *   GET /api/internal/scrape-direct                    — scrape all sources
 *   GET /api/internal/scrape-direct?source=the-race-f1 — scrape one source
 *   GET /api/internal/scrape-direct?limit=5            — limit articles per source
 */
export async function GET(req: NextRequest) {
  const secret =
    req.headers.get("x-vercel-cron-secret") ??
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const sourceFilter = searchParams.get("source");
  const limit = parseInt(searchParams.get("limit") ?? "10", 10);

  const sourceIds = sourceFilter
    ? [sourceFilter]
    : Object.keys(SCRAPER_MAP);

  const results: { sourceId: string; scraped: number; error?: string }[] = [];

  for (const sourceId of sourceIds) {
    const factory = SCRAPER_MAP[sourceId];
    if (!factory) {
      results.push({ sourceId, scraped: 0, error: "unknown source" });
      continue;
    }

    try {
      const scraper = factory();
      let scraped = 0;

      for await (const article of scraper.scrapeAll()) {
        if (scraped >= limit) break;

        const urlHash = hashUrl(article.url);
        const duplicate = await isDuplicate(urlHash);
        if (duplicate) continue;

        let series = article.series as SeriesId[];
        if (!series.length) {
          series = classifySeries(article.title, article.url, article.bodyText);
        }
        if (!series.length) {
          series = [sourceId.split("-").pop() as SeriesId] || ["f1"];
        }

        // Summarize (skip if no AI key — store raw body excerpt)
        let summary: string | null = null;
        try {
          summary = await summarizeArticle(article.title, article.bodyText);
        } catch {
          summary = article.bodyText.slice(0, 300);
        }

        // Breaking classification (skip if no AI key)
        let isBreaking = false;
        try {
          isBreaking = await classifyBreaking(article.title, summary ?? "");
        } catch {
          // default to false
        }

        await db
          .insert(articles)
          .values({
            url: article.url,
            urlHash,
            title: article.title,
            sourceId: article.sourceId,
            series,
            publishedAt: article.publishedAt ?? new Date(),
            summary,
            imageUrl: article.imageUrl,
            isBreaking,
          })
          .onConflictDoNothing();

        scraped++;
      }

      results.push({ sourceId, scraped });
    } catch (err) {
      results.push({
        sourceId,
        scraped: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const total = results.reduce((sum, r) => sum + r.scraped, 0);
  return NextResponse.json({ ok: true, total, results });
}
