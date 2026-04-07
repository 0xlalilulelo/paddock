/**
 * Playwright-based X.com fallback scraper.
 * Used when all Nitter instances fail for a given handle.
 * Requires PROXY_SERVER env var for residential proxy rotation.
 */

import type { XAccountType, SeriesId } from "@paddock/api-types";
import type { RawSocialPost } from "./nitter";

const PROXY_SERVER = process.env.PLAYWRIGHT_PROXY_SERVER;
const PROXY_USERNAME = process.env.PLAYWRIGHT_PROXY_USERNAME;
const PROXY_PASSWORD = process.env.PLAYWRIGHT_PROXY_PASSWORD;

// Rate limit: max 1 request per handle per 5 minutes
const lastScrapeTime = new Map<string, number>();
const RATE_LIMIT_MS = 5 * 60 * 1000;

export async function scrapeXAccountDirect(
  handle: string,
  authorType: XAccountType,
  series: SeriesId[]
): Promise<RawSocialPost[]> {
  const now = Date.now();
  const last = lastScrapeTime.get(handle) ?? 0;
  if (now - last < RATE_LIMIT_MS) {
    console.log(`[playwright-x] Rate limited for @${handle}, skipping`);
    return [];
  }
  lastScrapeTime.set(handle, now);

  if (!PROXY_SERVER) {
    console.warn("[playwright-x] No proxy configured — skipping direct scrape");
    return [];
  }

  // Dynamic import so Playwright isn't loaded if Nitter is working
  const { chromium } = await import("playwright");

  const browser = await chromium.launch({
    headless: true,
    proxy: {
      server: PROXY_SERVER,
      username: PROXY_USERNAME,
      password: PROXY_PASSWORD,
    },
  });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      locale: "en-US",
    });

    const page = await context.newPage();
    await page.goto(`https://x.com/${handle}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    // Wait for tweet content to load
    await page
      .waitForSelector('[data-testid="tweet"]', { timeout: 10_000 })
      .catch(() => null);

    const tweets = await page.evaluate(() => {
      const tweetEls = document.querySelectorAll('[data-testid="tweet"]');
      return Array.from(tweetEls)
        .slice(0, 10)
        .map((el: Element) => {
          const textEl = el.querySelector('[data-testid="tweetText"]');
          const timeEl = el.querySelector("time");
          const linkEl = el.querySelector('a[href*="/status/"]');
          const imgEls = el.querySelectorAll('[data-testid="tweetPhoto"] img');

          return {
            text: textEl?.textContent?.trim() ?? "",
            publishedAt: timeEl?.getAttribute("datetime") ?? new Date().toISOString(),
            url: linkEl
              ? `https://x.com${linkEl.getAttribute("href")}`
              : "",
            mediaUrls: Array.from(imgEls)
              .map((img: Element) => (img as unknown as { src: string }).src)
              .filter(Boolean),
          };
        })
        .filter((t: { text: string; url: string }) => t.text && t.url);
    });

    return tweets.map((t): RawSocialPost => ({
      platform: "x" as const,
      authorHandle: handle,
      authorDisplayName: handle,
      authorType,
      content: t.text,
      url: t.url,
      series,
      publishedAt: new Date(t.publishedAt),
      isRetweet: false,
      mediaUrls: t.mediaUrls,
    }));
  } finally {
    await browser.close();
  }
}
