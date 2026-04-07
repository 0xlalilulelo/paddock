import { BaseScraper, type RawArticle } from "./base-scraper";
import { parseRssFeed, rssItemToArticle } from "./rss-helpers";

/**
 * FIA WEC — JS-rendered site, no RSS feed.
 * Uses motorsport.com/rss/wec/news/ as primary source.
 */
export class FiawecScraper extends BaseScraper {
  constructor() {
    super({
      sourceId: "fiawec",
      baseUrl: "https://www.fiawec.com",
      series: ["wec"],
      name: "FIA WEC",
      selectors: {
        articleLinks: "",
        title: "h1",
        bodyText: "div.article-content p, article p",
        publishedAt: "time[datetime]",
        imageUrl: "meta[property='og:image']",
      },
    });
  }

  async getArticleUrls(): Promise<string[]> {
    return [];
  }

  async *scrapeAll(): AsyncGenerator<RawArticle> {
    const xml = await this.fetchHtml("https://www.motorsport.com/rss/wec/news/");
    if (!xml) return;

    const items = parseRssFeed(xml);
    for (const item of items.slice(0, 20)) {
      const article = rssItemToArticle(
        item,
        this.config.sourceId,
        (t, b) => this.detectSeries(t, b),
      );
      article.series = ["wec"];
      yield article;
    }
  }
}
