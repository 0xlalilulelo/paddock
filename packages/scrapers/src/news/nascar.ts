import { BaseScraper, type RawArticle } from "./base-scraper";
import { parseRssFeed, rssItemToArticle } from "./rss-helpers";

/**
 * NASCAR.com — JS-rendered site, RSS feed blocked (403).
 * Uses motorsport.com/rss/nascar-cup/news/ as primary source.
 */
export class NascarScraper extends BaseScraper {
  constructor() {
    super({
      sourceId: "nascar",
      baseUrl: "https://www.nascar.com",
      series: ["nascar"],
      name: "NASCAR",
      selectors: {
        articleLinks: "",
        title: "h1",
        bodyText: "div.article-body p, article p",
        publishedAt: "time[datetime]",
        imageUrl: "meta[property='og:image']",
      },
    });
  }

  async getArticleUrls(): Promise<string[]> {
    return [];
  }

  async *scrapeAll(): AsyncGenerator<RawArticle> {
    const xml = await this.fetchHtml("https://www.motorsport.com/rss/nascar-cup/news/");
    if (!xml) return;

    const items = parseRssFeed(xml);
    for (const item of items.slice(0, 20)) {
      const article = rssItemToArticle(
        item,
        this.config.sourceId,
        (t, b) => this.detectSeries(t, b),
      );
      article.series = ["nascar"];
      yield article;
    }
  }
}
