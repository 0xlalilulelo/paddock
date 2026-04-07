import { BaseScraper, type RawArticle } from "./base-scraper";
import { parseRssFeed, rssItemToArticle } from "./rss-helpers";

/**
 * Radio Le Mans — site appears unreachable at radiolemans.com.
 * Falls back to sportscar365.com RSS (covers WEC/IMSA/sportscar news).
 */
export class RadioLeMansScraper extends BaseScraper {
  constructor() {
    super({
      sourceId: "radiolemans",
      baseUrl: "https://sportscar365.com",
      series: ["wec"],
      name: "Radio Le Mans",
      selectors: {
        articleLinks: "",
        title: "h1.entry-title, h1",
        bodyText: "div.entry-content p, article p",
        publishedAt: "time[datetime]",
        imageUrl: "img.wp-post-image",
      },
    });
  }

  async getArticleUrls(): Promise<string[]> {
    return [];
  }

  async *scrapeAll(): AsyncGenerator<RawArticle> {
    const xml = await this.fetchHtml("https://sportscar365.com/feed/");
    if (!xml) return;

    const items = parseRssFeed(xml);
    for (const item of items.slice(0, 20)) {
      const article = rssItemToArticle(
        item,
        this.config.sourceId,
        (t, b) => this.detectSeries(t, b),
      );
      // Default to WEC if no series detected
      if (!article.series.length) {
        article.series = ["wec"];
      }
      yield article;
    }
  }
}
