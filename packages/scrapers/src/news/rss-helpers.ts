import * as cheerio from "cheerio";
import type { RawArticle } from "./base-scraper";

export interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string | null;
  imageUrl: string | null;
}

/**
 * Parse an RSS/Atom feed and return structured items.
 * Works with RSS 2.0 and Atom feeds.
 */
export function parseRssFeed(xml: string): RssItem[] {
  const $ = cheerio.load(xml, { xml: true });
  const items: RssItem[] = [];

  // RSS 2.0
  $("item").each((_, el) => {
    const $item = $(el);
    const title = $item.find("title").first().text().trim();
    const link = $item.find("link").first().text().trim();
    if (!title || !link) return;

    const description = $item.find("description").first().text().trim();
    const pubDate = $item.find("pubDate").first().text().trim() || null;

    // Image: try media:content, media:thumbnail, enclosure, or extract from description
    let imageUrl =
      $item.find("media\\:content, content").attr("url") ??
      $item.find("media\\:thumbnail, thumbnail").attr("url") ??
      $item.find("enclosure[type^='image']").attr("url") ??
      null;

    if (!imageUrl && description) {
      const descHtml = cheerio.load(description);
      imageUrl = descHtml("img").first().attr("src") ?? null;
    }

    items.push({ title, link, description, pubDate, imageUrl });
  });

  // Atom fallback (if no RSS items found)
  if (items.length === 0) {
    $("entry").each((_, el) => {
      const $entry = $(el);
      const title = $entry.find("title").first().text().trim();
      const link =
        $entry.find("link[rel='alternate']").attr("href") ??
        $entry.find("link").attr("href") ??
        "";
      if (!title || !link) return;

      const description =
        $entry.find("summary").first().text().trim() ||
        $entry.find("content").first().text().trim();
      const pubDate =
        $entry.find("published").first().text().trim() ||
        $entry.find("updated").first().text().trim() ||
        null;

      items.push({ title, link, description, pubDate, imageUrl: null });
    });
  }

  return items;
}

/**
 * Convert an RSS item to a RawArticle.
 */
export function rssItemToArticle(
  item: RssItem,
  sourceId: string,
  detectSeries: (title: string, body: string) => import("@paddock/api-types").SeriesId[],
): RawArticle {
  // Strip HTML tags from description for body text
  const bodyText = item.description
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);

  const pubDate = item.pubDate ? new Date(item.pubDate) : null;

  return {
    url: item.link,
    title: item.title,
    bodyText,
    publishedAt: pubDate && !isNaN(pubDate.getTime()) ? pubDate : null,
    imageUrl: item.imageUrl,
    series: detectSeries(item.title, bodyText),
    sourceId,
  };
}
