import { BaseScraper, type RawArticle, type ScraperConfig } from "./base-scraper";

const CONFIG: ScraperConfig = {
  sourceId: "imsa",
  baseUrl: "https://www.imsa.com",
  series: ["imsa"],
  name: "IMSA",
  selectors: {
    articleLinks: "article a[href], div.news-card a[href]",
    title: "h1.page-title, h1.article-title",
    bodyText: "div.article-body, div.content-body",
    publishedAt: "time[datetime], span.date",
    imageUrl: "img.hero-image, div.article-hero img",
  },
};

export class ImsaScraper extends BaseScraper {
  constructor() {
    super(CONFIG);
  }

  async getArticleUrls(): Promise<string[]> {
    const $ = await this.fetchCheerio("https://www.imsa.com/news/");
    const urls: string[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const full = href.startsWith("http") ? href : `https://www.imsa.com${href}`;
      if (href.includes("/news/") && href.length > 6 && !urls.includes(full)) {
        urls.push(full);
      }
    });
    return urls.slice(0, 20);
  }

  async scrapeArticle(url: string): Promise<RawArticle | null> {
    const $ = await this.fetchCheerio(url);

    const title =
      $("h1.page-title, h1.article-title").first().text().trim() ||
      $("h1").first().text().trim();
    if (!title) return null;

    const content =
      $("div.article-body, div.content-body, div.rich-text").text().trim();
    const datetimeAttr = $("time[datetime]").first().attr("datetime");
    const publishedAt = datetimeAttr ? new Date(datetimeAttr) : new Date();
    const imageUrl =
      $("img.hero-image, div.article-hero img").first().attr("src") ??
      $("meta[property='og:image']").attr("content") ??
      null;

    return {
      url,
      title,
      bodyText: content.slice(0, 8000),
      publishedAt,
      imageUrl,
      sourceId: CONFIG.sourceId,
      series: ["imsa"],
    };
  }
}
