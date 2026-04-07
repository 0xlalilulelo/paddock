import { BaseScraper, type RawArticle } from "./base-scraper";
import { parseRssFeed, rssItemToArticle } from "./rss-helpers";
import type { SeriesId } from "@paddock/api-types";

/**
 * The Race uses Ghost CMS with a single RSS feed at /feed/.
 * We filter items by series keywords since there's no per-category feed.
 */
const SERIES_KEYWORDS: Record<SeriesId, RegExp> = {
  f1: /\bf1\b|formula.?1|grand prix|hamilton|verstappen|leclerc|norris|mclaren|ferrari|red bull|mercedes/i,
  imsa: /\bimsa\b|weathertech|daytona|sebring|petit le mans|prototype/i,
  wec: /\bwec\b|world endurance|le mans|hypercar|porsche 963|toyota gr010/i,
  nascar: /\bnascar\b|cup series|xfinity|truck series|daytona 500|talladega/i,
};

export class TheRaceScraper extends BaseScraper {
  private readonly seriesId: SeriesId;

  constructor(series: SeriesId) {
    super({
      sourceId: `the-race-${series}`,
      name: "The Race",
      baseUrl: "https://the-race.com",
      series: [series],
      selectors: {
        articleLinks: "",
        title: "h1.gh-article-title, h1.article-title, h1",
        bodyText: "section.gh-content p, div.article-body p, article p",
        publishedAt: "time[datetime]",
        imageUrl: "img.gh-article-image, figure img",
      },
    });
    this.seriesId = series;
  }

  async getArticleUrls(): Promise<string[]> {
    return [];
  }

  async *scrapeAll(): AsyncGenerator<RawArticle> {
    const xml = await this.fetchHtml("https://the-race.com/feed/");
    if (!xml) return;

    const items = parseRssFeed(xml);
    const pattern = SERIES_KEYWORDS[this.seriesId];

    for (const item of items) {
      // Filter by series
      const text = `${item.title} ${item.description}`;
      if (!pattern.test(text)) continue;

      const article = rssItemToArticle(
        item,
        this.config.sourceId,
        (t, b) => this.detectSeries(t, b),
      );

      // Try full article scrape for richer content
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
