import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import type { SeriesId } from "@paddock/api-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_SERIES: SeriesId[] = ["f1", "imsa", "wec", "nascar"];
const PING_INTERVAL_MS = 30_000;
const MAX_SEEN_IDS = 500; // Cap dedup set to prevent memory leak on long connections

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const seriesParam = searchParams.get("series") ?? "f1";
  const series = seriesParam
    .split(",")
    .filter((s): s is SeriesId => VALID_SERIES.includes(s as SeriesId));

  if (!series.length) {
    return new Response("Invalid series", { status: 400 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });

      // Per-connection dedup: track seen item IDs per series
      const seenIds = new Map<string, Set<string>>(
        series.map((s) => [s, new Set<string>()])
      );

      // Seed seen IDs from current items so we don't flood on connect
      try {
        for (const s of series) {
          const items = await redis.lrange(`feed-recent:${s}`, 0, 9);
          const seen = seenIds.get(s)!;
          for (const raw of items) {
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
            if (parsed?.data?.id) seen.add(String(parsed.data.id));
          }
        }
      } catch { /* continue without seeding */ }

      // Ping heartbeat
      const pingTimer = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          closed = true;
        }
      }, PING_INTERVAL_MS);

      // Poll recent items — emit only items not yet seen by this connection
      const pollInterval = setInterval(async () => {
        if (closed) return;
        try {
          for (const s of series) {
            const items = await redis.lrange(`feed-recent:${s}`, 0, 9);
            const seen = seenIds.get(s)!;
            for (const raw of items) {
              const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
              const id = String(parsed?.data?.id ?? "");
              if (!id || seen.has(id)) continue;
              seen.add(id);
              // Evict oldest entries when set grows too large
              if (seen.size > MAX_SEEN_IDS) {
                const first = seen.values().next().value;
                if (first !== undefined) seen.delete(first);
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`));
            }
          }
        } catch {
          // continue
        }
      }, 5_000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(pingTimer);
        clearInterval(pollInterval);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
