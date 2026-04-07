import type { LivePosition, LiveSession, SeriesId } from "@paddock/api-types";

export interface LiveData {
  session: Omit<LiveSession, "socialFeed"> | null;
  positions: LivePosition[];
}

export abstract class BaseLiveScraper {
  abstract readonly series: SeriesId;

  /** Returns live timing data, or null if no session is active */
  abstract fetchLiveData(): Promise<LiveData>;

  /** Returns true if a session is currently active */
  async isSessionActive(): Promise<boolean> {
    const data = await this.fetchLiveData();
    return data.session !== null;
  }

  protected async fetchJson<T>(url: string): Promise<T | null> {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return null;
      return res.json() as Promise<T>;
    } catch {
      return null;
    }
  }
}
