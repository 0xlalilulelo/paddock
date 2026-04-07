import { createHash } from "crypto";
import { db } from "@paddock/db";
import { articles } from "@paddock/db/schema";
import { eq } from "drizzle-orm";

/** Returns MD5 hash of a normalized URL */
export function hashUrl(url: string): string {
  const normalized = url
    .trim()
    .toLowerCase()
    .replace(/\/$/, "")
    .replace(/[?&]utm_[^&]*/g, "") // strip UTM params
    .replace(/[?&]ref=[^&]*/g, "");
  return createHash("md5").update(normalized).digest("hex");
}

/** Returns true if this URL has already been scraped.
 *  Accepts either a raw URL (will be hashed) or a pre-computed hash. */
export async function isDuplicate(urlOrHash: string): Promise<boolean> {
  // If it looks like a 32-char hex MD5, treat as pre-computed hash
  const hash = /^[a-f0-9]{32}$/.test(urlOrHash) ? urlOrHash : hashUrl(urlOrHash);
  const [existing] = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.urlHash, hash))
    .limit(1);
  return !!existing;
}
