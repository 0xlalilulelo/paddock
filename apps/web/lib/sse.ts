/**
 * SSE client — connects to /api/stream per series, dispatches new items to
 * the Zustand feed store. Reconnects automatically on disconnect.
 */

import { useFeedStore } from "./store";
import type { FeedItem, SeriesId } from "@paddock/api-types";

const connections = new Map<SeriesId, EventSource>();

export function connectSeries(series: SeriesId): () => void {
  if (connections.has(series)) return () => disconnectSeries(series);

  const url = `/api/stream?series=${series}`;
  const es = new EventSource(url);

  es.onmessage = (e) => {
    try {
      const payload = JSON.parse(e.data) as {
        type: "article" | "social" | "breaking";
        item: FeedItem;
      };
      if (payload.type === "breaking") {
        useFeedStore.getState().setBreaking([payload.item]);
      }
      useFeedStore.getState().prependItems(series, [payload.item]);
    } catch {
      // ignore malformed events
    }
  };

  es.onerror = () => {
    es.close();
    connections.delete(series);
    // Reconnect after 5s
    setTimeout(() => connectSeries(series), 5_000);
  };

  connections.set(series, es);

  return () => disconnectSeries(series);
}

export function disconnectSeries(series: SeriesId): void {
  const es = connections.get(series);
  if (es) {
    es.close();
    connections.delete(series);
  }
}
