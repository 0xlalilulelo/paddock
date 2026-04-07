import * as cheerio from "cheerio";
import type { SeriesId } from "@paddock/api-types";

export interface RawArticle {
  url: string;
  title: string;
  /** Raw extracted text content — used for AI summary; NOT stored */
  bodyText: string;
  publishedAt: Date | null;
  imageUrl: string | null;
  series: SeriesId[];
  sourceId: string;
}

export interface ScraperConfig {
  sourceId: string;
  name: string;
  baseUrl: string;
  series: SeriesId[];
  /** Selectors for extracting articles from a listing page */
  selectors: {
    articleLinks: string;
    title: string;
    bodyText: string;
    publishedAt: string;
    imageUrl?: string;
  };
  /** Override to return a list of URLs to scrape */
  feedUrl?: string;
  /** Time between requests to this source (milliseconds) */
  requestDelayMs?: number;
}

export abstract class BaseScraper {
  constructor(protected config: ScraperConfig) {}

  /** Return list of article URLs from the source's index / feed page */
  abstract getArticleUrls(): Promise<string[]>;

  /** Scrape a single article URL and return raw content */
  async scrapeArticle(url: string): Promise<RawArticle | null> {
    try {
      const html = await this.fetchHtml(url);
      if (!html) return null;

      const $ = cheerio.load(html);
      const s = this.config.selectors;

      const title = $(s.title).first().text().trim();
      if (!title) return null;

      const bodyText = $(s.bodyText)
        .map((_, el) => $(el).text().trim())
        .get()
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      const publishedAtRaw = $(s.publishedAt).first().attr("datetime") ??
        $(s.publishedAt).first().text().trim() ??
        null;
      const publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : null;

      const imageUrl = s.imageUrl
        ? $(s.imageUrl).first().attr("src") ??
          $(s.imageUrl).first().attr("data-src") ??
          null
        : null;

      return {
        url,
        title,
        bodyText,
        publishedAt: publishedAt && !isNaN(publishedAt.getTime()) ? publishedAt : null,
        imageUrl: imageUrl ? this.resolveUrl(imageUrl) : null,
        series: this.detectSeries(title, bodyText),
        sourceId: this.config.sourceId,
      };
    } catch {
      return null;
    }
  }

  /** Fetch a URL and return a loaded Cheerio instance (empty document on failure) */
  protected async fetchCheerio(url: string): Promise<ReturnType<typeof cheerio.load>> {
    const html = await this.fetchHtml(url);
    return cheerio.load(html ?? "");
  }

  protected async fetchHtml(url: string): Promise<string | null> {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) return null;
      return res.text();
    } catch {
      return null;
    }
  }

  protected resolveUrl(path: string): string {
    if (path.startsWith("http")) return path;
    return new URL(path, this.config.baseUrl).href;
  }

  /** Override for source-specific series detection */
  protected detectSeries(title: string, body: string): SeriesId[] {
    const text = `${title} ${body}`.toLowerCase();
    const detected: SeriesId[] = [];

    if (/\bformula[ -]?1\b|\bf1\b|grand prix|monaco|bahrain|silverstone/.test(text)) {
      detected.push("f1");
    }
    if (/\bimsa\b|weathertech|daytona 24|sebring 12|petit le mans/.test(text)) {
      detected.push("imsa");
    }
    if (/\bwec\b|world endurance|\ble mans\b|hypercar|fiawec/.test(text)) {
      detected.push("wec");
    }
    if (/\bnascar\b|cup series|daytona 500|talladega|bristol/.test(text)) {
      detected.push("nascar");
    }

    // Fall back to source's default series if none detected
    return detected.length > 0 ? detected : this.config.series;
  }

  /** Scrape the full source: get URLs, scrape each with delay */
  async *scrapeAll(): AsyncGenerator<RawArticle> {
    const urls = await this.getArticleUrls();
    const delay = this.config.requestDelayMs ?? 1000;

    for (const url of urls) {
      const article = await this.scrapeArticle(url);
      if (article) yield article;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
