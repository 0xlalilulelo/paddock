import { BaseLiveScraper, type LiveData } from "./base-live";
import type { LivePosition, LiveSession } from "@paddock/api-types";

/**
 * IMSA live timing scraper.
 * Primary: scrapes imsa.com/live JSON timing API endpoints.
 * Falls back to parsing the live timing page HTML.
 */
export class ImsaLiveScraper extends BaseLiveScraper {
  readonly series = "imsa" as const;

  private readonly API_BASE = "https://api.imsa.com/v1";
  private readonly TIMING_PAGE = "https://www.imsa.com/live/";

  async fetchLiveData(): Promise<LiveData> {
    return this.fetchLive();
  }

  async fetchLive(): Promise<LiveData> {
    try {
      return await this.fetchFromApi();
    } catch {
      return await this.fetchFromPage();
    }
  }

  private async fetchFromApi(): Promise<LiveData> {
    const [sessionRes, positionsRes] = await Promise.all([
      fetch(`${this.API_BASE}/live/session`, {
        headers: { "User-Agent": "Paddock/1.0 (+https://paddock.app)" },
        signal: AbortSignal.timeout(8_000),
      }),
      fetch(`${this.API_BASE}/live/timing`, {
        headers: { "User-Agent": "Paddock/1.0 (+https://paddock.app)" },
        signal: AbortSignal.timeout(8_000),
      }),
    ]);

    if (!sessionRes.ok) throw new Error(`IMSA API session ${sessionRes.status}`);

    const session = (await sessionRes.json()) as Record<string, unknown>;
    const timing = positionsRes.ok
      ? ((await positionsRes.json()) as Record<string, unknown>[])
      : [];

    if (!session || !session.sessionName) {
      return { session: null, positions: [] };
    }

    const liveSession: LiveSession = {
      id: String(session.sessionId ?? "imsa-live"),
      series: "imsa",
      eventName: String(session.eventName ?? "IMSA Event"),
      circuitName: String(session.trackName ?? ""),
      sessionType: mapSessionType(String(session.sessionType ?? "race")),
      status: "live",
      startsAt: new Date().toISOString(),
      endsAt: null,
      timeRemaining: session.timeRemaining ? Number(session.timeRemaining) : null,
      lapsCompleted: session.lapsComplete ? Number(session.lapsComplete) : null,
      totalLaps: session.totalLaps ? Number(session.totalLaps) : null,
    };

    const positions: LivePosition[] = (Array.isArray(timing) ? timing : []).map(
      (entry) => ({
        position: Number(entry.position ?? 0),
        driverName: String(entry.drivers ?? entry.driverName ?? ""),
        driverCode: null,
        carNumber: String(entry.carNumber ?? ""),
        teamName: String(entry.teamName ?? ""),
        gap: String(entry.gap ?? "+0.0s"),
        lastLapTime: String(entry.lastLapTime ?? ""),
        tyre: null,
        pitStops: Number(entry.pitStops ?? 0),
        classCategory: String(entry.class ?? "GTP"),
      })
    );

    return { session: liveSession, positions };
  }

  private async fetchFromPage(): Promise<LiveData> {
    // Playwright-based fallback is not yet implemented.
    // Throwing here makes the failure visible in logs rather than silently
    // returning empty data that looks identical to "no session active".
    throw new Error(
      `IMSA API unavailable and Playwright fallback is not implemented (${this.TIMING_PAGE})`
    );
  }
}

function mapSessionType(raw: string): LiveSession["sessionType"] {
  const lower = raw.toLowerCase();
  if (lower.includes("qual")) return "qualifying";
  if (lower.includes("practice") || lower.includes("warm")) return "practice";
  if (lower.includes("sprint")) return "sprint";
  return "race";
}
