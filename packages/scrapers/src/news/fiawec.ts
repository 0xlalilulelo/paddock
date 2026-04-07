import { BaseScraper, type RawArticle, type ScraperConfig } from "./base-scraper";

const CONFIG: ScraperConfig = {
  sourceId: "fiawec",
  baseUrl: "https://www.fiawec.com",
  series: ["wec"],
  name: "FIA WEC",
  selectors: {
    articleLinks: "article a[href], div.article-item a[href]",
    title: "h1.article-title, h1",
    bodyText: "div.article-content, div.body-text",
    publishedAt: "time[datetime], span.article-date",
    imageUrl: "img.article-image, div.article-header img",
  },
};

export class FiawecScraper extends BaseScraper {
  constructor() {
    super(CONFIG);
  }

  async getArticleUrls(): Promise<string[]> {
    const $ = await this.fetchCheerio("https://www.fiawec.com/en/news.html");
    const urls: string[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      if (!href) return;
      const full = href.startsWith("http")
        ? href
        : `https://www.fiawec.com${href}`;
      if (
        (href.includes("/news/") || href.includes("/article/")) &&
        !urls.includes(full)
      ) {
        urls.push(full);
      }
    });
    return urls.slice(0, 20);
  }

  async scrapeArticle(url: string): Promise<RawArticle | null> {
    const $ = await this.fetchCheerio(url);

    const title =
      $(CONFIG.selectors.title!).first().text().trim() ||
      ($("meta[property='og:title']").attr("content") ?? "");
    if (!title) return null;

    const content = $(CONFIG.selectors.bodyText!).text().trim();
    const datetimeAttr = $("time[datetime]").first().attr("datetime");
    const publishedAt = datetimeAttr ? new Date(datetimeAttr) : new Date();
    const imageUrl =
      $("img.article-image").first().attr("src") ??
      $("meta[property='og:image']").attr("content") ??
      null;

    return {
      url,
      title,
      bodyText: content.slice(0, 8000),
      publishedAt,
      imageUrl,
      sourceId: CONFIG.sourceId,
      series: ["wec"],
    };
  }
}
