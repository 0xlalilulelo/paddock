/**
 * Vercel Queues client helpers.
 * Wraps the fetch-based Vercel Queues REST API.
 *
 * Topics defined in the Vercel dashboard:
 *   scrape-source      — { sourceId, url }
 *   process-article    — { rawArticle }
 *   scrape-social      — { handle, platform }
 *   scrape-live        — { series }
 *   send-push          — { userId, notification }
 */

const QUEUES_BASE = process.env.VERCEL_QUEUES_BASE_URL ?? "";
const QUEUES_TOKEN = process.env.VERCEL_QUEUES_TOKEN ?? "";

export interface ScrapeSourcePayload {
  sourceId: string;
  feedUrl: string;
  series: string[];
}

export interface ProcessArticlePayload {
  type: "process-article";
  rawArticle: {
    url: string;
    title: string;
    content: string;
    publishedAt: string;
    imageUrl: string | null;
    sourceId: string;
    series: string[];
  };
}

export interface ScrapeSocialPayload {
  handle: string;
  platform: "x";
}

export interface ScrapeLivePayload {
  series: string;
}

export interface SendPushPayload {
  userId: string;
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  };
}

type QueuePayload =
  | { topic: "scrape-source"; payload: ScrapeSourcePayload }
  | { topic: "process-article"; payload: ProcessArticlePayload }
  | { topic: "scrape-social"; payload: ScrapeSocialPayload }
  | { topic: "scrape-live"; payload: ScrapeLivePayload }
  | { topic: "send-push"; payload: SendPushPayload };

export async function enqueue(job: QueuePayload): Promise<void> {
  if (!QUEUES_BASE || !QUEUES_TOKEN) {
    // Local dev — log and skip
    console.log(`[queues] Would enqueue ${job.topic}:`, job.payload);
    return;
  }

  const res = await fetch(`${QUEUES_BASE}/topics/${job.topic}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${QUEUES_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload: job.payload }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`[queues] Failed to enqueue ${job.topic}: ${res.status} ${text}`);
  }
}

export async function enqueueBatch(jobs: QueuePayload[]): Promise<void> {
  await Promise.all(jobs.map(enqueue));
}
