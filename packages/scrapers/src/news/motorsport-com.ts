import * as cheerio from "cheerio";
import { BaseScraper } from "./base-scraper";
import type { SeriesId } from "@paddock/api-types";

const SERIES_PATHS: Record<SeriesId, string> = {
  f1: "https://www.motorsport.com/f1/news/",
  imsa: "https://www.motorsport.com/imsa/news/",
  wec: "https://www.motorsport.com/wec/news/",
  nascar: "https://www.motorsport.com/nascar-cup/news/",
};

export class MotorsportComScraper extends BaseScraper {
  constructor(private readonly series: SeriesId) {
    super({
      sourceId: "motorsport-com",
      name: "Motorsport.com",
      baseUrl: "https://www.motorsport.com",
      series: [series],
      selectors: {
        articleLinks: "a.ms-item__title, a[data-article-id]",
        title: "h1.ms-article__title, h1.ms-header__title",
        bodyText: ".ms-article__content p",
        publishedAt: "time[datetime]",
        imageUrl: ".ms-article__image img",
      },
      requestDelayMs: 1500,
    });
  }

  async getArticleUrls(): Promise<string[]> {
    const feedUrl = SERIES_PATHS[this.series];
    const html = await this.fetchHtml(feedUrl);
    if (!html) return [];

    const $ = cheerio.load(html);
    const urls: string[] = [];

    $("a.ms-item__title").each((_, el) => {
      const href = $(el).attr("href");
      if (href) urls.push(this.resolveUrl(href));
    });

    return urls.slice(0, 20);
  }
}
