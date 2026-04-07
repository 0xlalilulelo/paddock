import { BaseScraper, type RawArticle, type ScraperConfig } from "./base-scraper";

// RaceFans is primarily F1-focused
const CONFIG: ScraperConfig = {
  sourceId: "racefans",
  baseUrl: "https://www.racefans.net",
  series: ["f1"],
  name: "RaceFans",
  selectors: {
    articleLinks: "article.post h2 a, article.post h1 a",
    title: "h1.entry-title",
    bodyText: "div.entry-content",
    publishedAt: "time[datetime]",
    imageUrl: "img.wp-post-image",
  },
};

export class RaceFansScraper extends BaseScraper {
  constructor() {
    super(CONFIG);
  }

  async getArticleUrls(): Promise<string[]> {
    const $ = await this.fetchCheerio("https://www.racefans.net");
    const urls: string[] = [];
    $("article h2 a, article h1 a").each((_, el) => {
      const href = $(el).attr("href");
      if (href && !urls.includes(href)) {
        urls.push(href);
      }
    });
    return urls.slice(0, 20);
  }

  async scrapeArticle(url: string): Promise<RawArticle | null> {
    const $ = await this.fetchCheerio(url);

    const title = $("h1.entry-title").first().text().trim();
    if (!title) return null;

    const content = $("div.entry-content").text().trim();
    const datetimeAttr = $("time[datetime]").first().attr("datetime");
    const publishedAt = datetimeAttr ? new Date(datetimeAttr) : new Date();
    const imageUrl = $("img.wp-post-image").first().attr("src") ?? null;

    return {
      url,
      title,
      bodyText: content.slice(0, 8000),
      publishedAt,
      imageUrl,
      sourceId: CONFIG.sourceId,
      series: ["f1"],
    };
  }
}
