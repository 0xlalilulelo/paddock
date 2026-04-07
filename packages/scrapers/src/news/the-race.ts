import { BaseScraper, type RawArticle, type ScraperConfig } from "./base-scraper";
import type { SeriesId } from "@paddock/api-types";

const SERIES_FEEDS: Record<SeriesId, string> = {
  f1: "https://the-race.com/formula-1/",
  imsa: "https://the-race.com/imsa/",
  wec: "https://the-race.com/le-mans-wec/",
  nascar: "https://the-race.com/nascar/",
};

const CONFIG: ScraperConfig = {
  sourceId: "the-race",
  name: "The Race",
  baseUrl: "https://the-race.com",
  series: [],
  selectors: {
    articleLinks: "article.post a[href], div.article-card a[href]",
    title: "h1.entry-title, h1.article-title",
    bodyText: "div.entry-content, div.article-body",
    publishedAt: "time[datetime]",
    imageUrl: "img.wp-post-image, figure.article-hero img",
  },
};

export class TheRaceScraper extends BaseScraper {
  constructor(series: SeriesId) {
    super({ ...CONFIG, series: [series] });
    this.feedUrl = SERIES_FEEDS[series];
  }

  private feedUrl: string;

  async getArticleUrls(): Promise<string[]> {
    const $ = await this.fetchCheerio(this.feedUrl);
    const urls: string[] = [];
    $("article.post a[href], div.article-card a[href], h2 a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (href?.includes("the-race.com") && !urls.includes(href)) {
        urls.push(href);
      }
    });
    return urls.slice(0, 20);
  }

  async scrapeArticle(url: string): Promise<RawArticle | null> {
    const $ = await this.fetchCheerio(url);

    const title = $(CONFIG.selectors.title!).first().text().trim();
    if (!title) return null;

    const content = $(CONFIG.selectors.bodyText!).text().trim();
    const datetimeAttr = $("time[datetime]").first().attr("datetime");
    const publishedAt = datetimeAttr ? new Date(datetimeAttr) : new Date();
    const imageUrl =
      $("img.wp-post-image").first().attr("src") ??
      $("figure img").first().attr("src") ??
      null;

    return {
      url,
      title,
      bodyText: content.slice(0, 8000),
      publishedAt,
      imageUrl: imageUrl ?? null,
      sourceId: CONFIG.sourceId,
      series: this.detectSeries(title, url),
    };
  }
}
