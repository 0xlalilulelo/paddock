import { BaseScraper, type RawArticle, type ScraperConfig } from "./base-scraper";

const CONFIG: ScraperConfig = {
  sourceId: "radiolemans",
  baseUrl: "https://radiolemans.com",
  series: ["wec"],
  name: "Radio Le Mans",
  selectors: {
    articleLinks: "article h2 a, article h3 a, div.post h2 a",
    title: "h1.entry-title",
    bodyText: "div.entry-content",
    publishedAt: "time[datetime]",
    imageUrl: "img.wp-post-image, div.post-thumbnail img",
  },
};

export class RadioLeMansScraper extends BaseScraper {
  constructor() {
    super(CONFIG);
  }

  async getArticleUrls(): Promise<string[]> {
    const $ = await this.fetchCheerio("https://radiolemans.com/news/");
    const urls: string[] = [];
    $("article h2 a, article h3 a, div.post h2 a").each((_, el) => {
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
    const imageUrl =
      $("img.wp-post-image").first().attr("src") ??
      $("div.post-thumbnail img").first().attr("src") ??
      null;

    // Radio Le Mans covers both WEC and IMSA
    const seriesTags = this.detectSeries(title, url);

    return {
      url,
      title,
      bodyText: content.slice(0, 8000),
      publishedAt,
      imageUrl,
      sourceId: CONFIG.sourceId,
      series: seriesTags.length ? seriesTags : ["wec"],
    };
  }
}
