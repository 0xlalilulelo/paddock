import { BaseScraper, type RawArticle } from "./base-scraper";
import { parseRssFeed, rssItemToArticle } from "./rss-helpers";

export class ImsaScraper extends BaseScraper {
  constructor() {
    super({
      sourceId: "imsa",
      baseUrl: "https://www.imsa.com",
      series: ["imsa"],
      name: "IMSA",
      selectors: {
        articleLinks: "",
        title: "h1",
        bodyText: "div.article-body p, div.content-body p, article p",
        publishedAt: "time[datetime]",
        imageUrl: "img.hero-image, meta[property='og:image']",
      },
    });
  }

  async getArticleUrls(): Promise<string[]> {
    return [];
  }

  async *scrapeAll(): AsyncGenerator<RawArticle> {
    // IMSA.com is JS-rendered, so use Motorsport.com's IMSA RSS feed
    const xml = await this.fetchHtml("https://www.motorsport.com/rss/imsa/news/");
    if (!xml) return;

    const items = parseRssFeed(xml);
    for (const item of items.slice(0, 20)) {
      const article = rssItemToArticle(
        item,
        this.config.sourceId,
        (t, b) => this.detectSeries(t, b),
      );
      // Override series since all items are IMSA
      article.series = ["imsa"];
      yield article;
    }
  }
}
