import { BaseScraper, type RawArticle, type ScraperConfig } from "./base-scraper";
import type { SeriesId } from "@paddock/api-types";

// Autosport uses section paths per series
const SERIES_FEEDS: Record<SeriesId, string> = {
  f1: "https://www.autosport.com/f1/",
  imsa: "https://www.autosport.com/imsa/",
  wec: "https://www.autosport.com/wec/",
  nascar: "https://www.autosport.com/nascar/",
};

const CONFIG: ScraperConfig = {
  sourceId: "autosport",
  name: "Autosport",
  baseUrl: "https://www.autosport.com",
  series: [],
  selectors: {
    articleLinks: "article a[href], div[data-testid='article-card'] a[href]",
    title: "h1[data-testid='article-title'], h1.article-header__title",
    bodyText: "div[data-testid='article-body'], div.article-content",
    publishedAt: "time[datetime], span[data-testid='article-date']",
    imageUrl: "img[data-testid='hero-image'], picture img",
  },
};

export class AutosportScraper extends BaseScraper {
  constructor(series: SeriesId) {
    super({ ...CONFIG, series: [series] });
    this.feedUrl = SERIES_FEEDS[series];
  }

  private feedUrl: string;

  async getArticleUrls(): Promise<string[]> {
    const $ = await this.fetchCheerio(this.feedUrl);
    const urls: string[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const full = href.startsWith("http") ? href : `https://www.autosport.com${href}`;
      if (
        href.match(/\/news\/\d+\//) &&
        !urls.includes(full)
      ) {
        urls.push(full);
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
      $("picture img").first().attr("src") ??
      $("img[data-testid='hero-image']").first().attr("src") ??
      null;

    return {
      url,
      title,
      bodyText: content.slice(0, 8000),
      publishedAt,
      imageUrl,
      sourceId: CONFIG.sourceId,
      series: this.detectSeries(title, url),
    };
  }
}
