import { BaseScraper, type RawArticle } from "./base-scraper";
import { parseRssFeed, rssItemToArticle } from "./rss-helpers";
import type { SeriesId } from "@paddock/api-types";

const RSS_FEEDS: Record<SeriesId, string> = {
  f1: "https://www.motorsport.com/rss/f1/news/",
  imsa: "https://www.motorsport.com/rss/imsa/news/",
  wec: "https://www.motorsport.com/rss/wec/news/",
  nascar: "https://www.motorsport.com/rss/nascar-cup/news/",
};

export class MotorsportComScraper extends BaseScraper {
  private readonly seriesId: SeriesId;

  constructor(series: SeriesId) {
    super({
      sourceId: `motorsport-com-${series}`,
      name: "Motorsport.com",
      baseUrl: "https://www.motorsport.com",
      series: [series],
      selectors: {
        articleLinks: "",
        title: "h1",
        bodyText: ".ms-article__content p, article p",
        publishedAt: "time[datetime]",
        imageUrl: "picture img, .ms-article__image img",
      },
      requestDelayMs: 1500,
    });
    this.seriesId = series;
  }

  async getArticleUrls(): Promise<string[]> {
    // Not used — we override scrapeAll to use RSS directly
    return [];
  }

  async *scrapeAll(): AsyncGenerator<RawArticle> {
    const feedUrl = RSS_FEEDS[this.seriesId];
    if (!feedUrl) return;

    const xml = await this.fetchHtml(feedUrl);
    if (!xml) return;

    const items = parseRssFeed(xml);
    for (const item of items.slice(0, 20)) {
      const article = rssItemToArticle(
        item,
        this.config.sourceId,
        (t, b) => this.detectSeries(t, b),
      );
      // If RSS description is short, try to fetch full article
      if (article.bodyText.length < 200) {
        const full = await this.scrapeArticle(article.url);
        if (full) {
          full.publishedAt = article.publishedAt ?? full.publishedAt;
          full.imageUrl = full.imageUrl ?? article.imageUrl;
          yield full;
          continue;
        }
      }
      yield article;
    }
  }
}
