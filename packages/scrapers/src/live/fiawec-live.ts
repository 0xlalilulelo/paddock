import { BaseLiveScraper, type LiveData } from "./base-live";
import type { LivePosition, LiveSession } from "@paddock/api-types";

/**
 * FIA WEC live timing scraper.
 * Primary: Alkamelsystems / WEC timing JSON API.
 * The WEC uses Alkamelsystems timing under the hood — endpoint discovered via network inspection.
 */
export class FiawecLiveScraper extends BaseLiveScraper {
  readonly series = "wec" as const;

  // Alkamelsystems WEC timing API base (public, no auth required during events)
  private readonly TIMING_BASE = "https://timing.fiawec.com";

  async fetchLiveData(): Promise<LiveData> {
    return this.fetchLive();
  }

  async fetchLive(): Promise<LiveData> {
    try {
      return await this.fetchFromTimingApi();
    } catch {
      return { session: null, positions: [] };
    }
  }

  private async fetchFromTimingApi(): Promise<LiveData> {
    const sessionRes = await fetch(`${this.TIMING_BASE}/api/live/session`, {
      headers: { "User-Agent": "Paddock/1.0 (+https://paddock.app)" },
      signal: AbortSignal.timeout(8_000),
    });

    if (!sessionRes.ok) {
      return { session: null, positions: [] };
    }

    const data = (await sessionRes.json()) as {
      session?: Record<string, unknown>;
      entries?: Record<string, unknown>[];
    };

    if (!data.session) {
      return { session: null, positions: [] };
    }

    const s = data.session;
    const liveSession: LiveSession = {
      id: String(s.id ?? "wec-live"),
      series: "wec",
      eventName: String(s.eventName ?? s.raceName ?? "WEC Event"),
      circuitName: String(s.circuitName ?? s.circuit ?? ""),
      sessionType: mapSessionType(String(s.sessionType ?? "race")),
      status: "live",
      startsAt: String(s.startTime ?? new Date().toISOString()),
      endsAt: s.endTime ? String(s.endTime) : null,
      timeRemaining: s.remainingTime ? Number(s.remainingTime) : null,
      lapsCompleted: s.lapsElapsed ? Number(s.lapsElapsed) : null,
      totalLaps: s.totalLaps ? Number(s.totalLaps) : null,
    };

    const positions: LivePosition[] = (data.entries ?? []).map((entry) => ({
      position: Number(entry.position ?? 0),
      driverName: [entry.driver1, entry.driver2, entry.driver3]
        .filter(Boolean)
        .join(" / "),
      driverCode: null,
      carNumber: String(entry.carNumber ?? entry.number ?? ""),
      teamName: String(entry.team ?? entry.teamName ?? ""),
      gap: String(entry.gap ?? entry.gapToLeader ?? "+0.0s"),
      lastLapTime: String(entry.lastLap ?? entry.lastLapTime ?? ""),
      tyre: null,
      pitStops: Number(entry.pits ?? entry.pitStops ?? 0),
      classCategory: String(entry.class ?? "Hypercar"),
    }));

    return { session: liveSession, positions };
  }
}

function mapSessionType(raw: string): LiveSession["sessionType"] {
  const lower = raw.toLowerCase();
  if (lower.includes("qual")) return "qualifying";
  if (lower.includes("practice") || lower.includes("warm")) return "practice";
  if (lower.includes("sprint")) return "sprint";
  return "race";
}
