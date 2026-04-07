/**
 * Nitter scraper — scrapes public Twitter/X content via Nitter instances.
 * Primary approach; falls back to playwright-x.ts when all instances fail.
 */

import * as cheerio from "cheerio";
import type { XAccountType, SeriesId } from "@paddock/api-types";

export interface RawSocialPost {
  platform: "x";
  authorHandle: string;
  authorDisplayName: string;
  authorType: XAccountType;
  content: string;
  url: string;
  series: SeriesId[];
  publishedAt: Date;
  isRetweet: boolean;
  mediaUrls: string[];
}

interface NitterPost {
  id: string;
  text: string;
  publishedAt: Date;
  isRetweet: boolean;
  mediaUrls: string[];
}

let instancePool: string[] = [];

function getInstances(): string[] {
  if (instancePool.length > 0) return instancePool;
  const raw = process.env.NITTER_INSTANCES ?? "";
  instancePool = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  // Defaults — should be overridden via Edge Config / env var
  if (instancePool.length === 0) {
    instancePool = [
      "https://nitter.privacydev.net",
      "https://nitter.poast.org",
      "https://nitter.1d4.us",
    ];
  }
  return instancePool;
}

/** Validate handle to prevent path traversal / SSRF via crafted handles */
function sanitizeHandle(handle: string): string | null {
  // Only allow alphanumeric + underscore, 1-15 chars (Twitter handle rules)
  const cleaned = handle.replace(/^@/, "");
  return /^[A-Za-z0-9_]{1,15}$/.test(cleaned) ? cleaned : null;
}

/** Validate instance URL to prevent SSRF to internal networks */
function isAllowedInstance(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Must be HTTPS
    if (parsed.protocol !== "https:") return false;
    // Block internal/private networks
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("172.") ||
      host.endsWith(".internal") ||
      host.endsWith(".local")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function fetchFromInstance(
  instance: string,
  handle: string
): Promise<string | null> {
  if (!isAllowedInstance(instance)) return null;
  const safeHandle = sanitizeHandle(handle);
  if (!safeHandle) return null;

  const url = `${instance}/${safeHandle}/rss`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/rss+xml, application/xml, text/xml" },
      signal: AbortSignal.timeout(10_000),
      redirect: "error", // Don't follow redirects to prevent SSRF
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

function parseRssFeed(xml: string, handle: string): NitterPost[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  const posts: NitterPost[] = [];

  $("item").each((_, el) => {
    const $el = $(el);
    const guid = $el.find("guid").text();
    const content = $el.find("description").text();
    const pubDate = $el.find("pubDate").text();
    const title = $el.find("title").text();

    // Skip retweets
    const isRetweet = title.startsWith("RT by");
    const plainText = content
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const mediaUrls: string[] = [];
    $el.find("enclosure").each((_, enc) => {
      const mediaUrl = $(enc).attr("url");
      if (mediaUrl) mediaUrls.push(mediaUrl);
    });

    const publishedAt = pubDate ? new Date(pubDate) : new Date();

    posts.push({
      id: guid,
      text: plainText,
      publishedAt,
      isRetweet,
      mediaUrls,
    });
  });

  return posts;
}

export async function scrapeXAccount(
  handle: string,
  authorType: XAccountType,
  series: SeriesId[]
): Promise<RawSocialPost[]> {
  const instances = getInstances();
  let xml: string | null = null;

  for (const instance of instances) {
    xml = await fetchFromInstance(instance, handle);
    if (xml) break;
  }

  if (!xml) {
    console.warn(`[nitter] All instances failed for @${handle}`);
    return [];
  }

  const posts = parseRssFeed(xml, handle);
  const originalPosts = posts.filter((p) => !p.isRetweet);

  return originalPosts.map((p) => ({
    platform: "x",
    authorHandle: handle,
    authorDisplayName: handle, // RSS doesn't include display names; enriched separately
    authorType,
    content: p.text,
    url: `https://x.com/${handle}/status/${p.id.split("/").pop()}`,
    series,
    publishedAt: p.publishedAt,
    isRetweet: false,
    mediaUrls: p.mediaUrls,
  }));
}
