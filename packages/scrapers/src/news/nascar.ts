import { BaseScraper, type RawArticle, type ScraperConfig } from "./base-scraper";

const CONFIG: ScraperConfig = {
  sourceId: "nascar",
  baseUrl: "https://www.nascar.com",
  series: ["nascar"],
  name: "NASCAR",
  selectors: {
    articleLinks: "article a[href], div[data-type='article'] a[href]",
    title: "h1.article-title, h1[data-testid='headline']",
    bodyText: "div.article-body, div[data-testid='article-body']",
    publishedAt: "time[datetime]",
    imageUrl: "img[data-testid='hero'], picture img",
  },
};

export class NascarScraper extends BaseScraper {
  constructor() {
    super(CONFIG);
  }

  async getArticleUrls(): Promise<string[]> {
    const $ = await this.fetchCheerio("https://www.nascar.com/news/");
    const urls: string[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const full = href.startsWith("http") ? href : `https://www.nascar.com${href}`;
      if (
        (href.includes("/news/") || href.includes("/articles/")) &&
        href.length > 8 &&
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
      $("picture img").first().attr("src") ??
      $("meta[property='og:image']").attr("content") ??
      null;

    return {
      url,
      title,
      bodyText: content.slice(0, 8000),
      publishedAt,
      imageUrl,
      sourceId: CONFIG.sourceId,
      series: ["nascar"],
    };
  }
}
