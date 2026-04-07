import { BaseScraper, type RawArticle } from "./base-scraper";
import { parseRssFeed, rssItemToArticle } from "./rss-helpers";
import type { SeriesId } from "@paddock/api-types";

/**
 * Autosport (Motorsport Network) — uses RSS feed.
 * Single feed at /rss/feed/all, filter by series keywords.
 */
const SERIES_KEYWORDS: Record<SeriesId, RegExp> = {
  f1: /\bf1\b|formula.?1|grand prix|hamilton|verstappen|leclerc|norris|mclaren|ferrari|red bull|mercedes/i,
  imsa: /\bimsa\b|weathertech|daytona|sebring|petit le mans|prototype/i,
  wec: /\bwec\b|world endurance|le mans|hypercar/i,
  nascar: /\bnascar\b|cup series|xfinity|truck series|daytona 500|talladega/i,
};

export class AutosportScraper extends BaseScraper {
  private readonly seriesId: SeriesId;

  constructor(series: SeriesId) {
    super({
      sourceId: `autosport-${series}`,
      name: "Autosport",
      baseUrl: "https://www.autosport.com",
      series: [series],
      selectors: {
        articleLinks: "",
        title: "h1",
        bodyText: "div.article-content p, article p",
        publishedAt: "time[datetime]",
        imageUrl: "picture img, img.hero-image",
      },
    });
    this.seriesId = series;
  }

  async getArticleUrls(): Promise<string[]> {
    return [];
  }

  async *scrapeAll(): AsyncGenerator<RawArticle> {
    const xml = await this.fetchHtml("https://www.autosport.com/rss/feed/all");
    if (!xml) return;

    const items = parseRssFeed(xml);
    const pattern = SERIES_KEYWORDS[this.seriesId];

    for (const item of items) {
      const text = `${item.title} ${item.description}`;
      if (!pattern.test(text)) continue;

      const article = rssItemToArticle(
        item,
        this.config.sourceId,
        (t, b) => this.detectSeries(t, b),
      );

      if (article.bodyText.length < 200) {
        const full = await this.scrapeArticle(article.url);
        if (full) {
          full.publishedAt = article.publishedAt ?? full.publishedAt;
          full.imageUrl = full.imageUrl ?? article.imageUrl;
          yield full;
          continue;
        }
      }
      yield article;
    }
  }
}
