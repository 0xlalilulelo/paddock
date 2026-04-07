/**
 * F1 live timing via OpenF1 API (openf1.org) — free, no auth required.
 */

import { BaseLiveScraper, type LiveData } from "./base-live";
import type { LivePosition } from "@paddock/api-types";

interface OpenF1Session {
  session_key: number;
  session_name: string;
  session_type: string;
  status: string;
  date_start: string;
  date_end: string;
  circuit_short_name: string;
  meeting_name: string;
}

interface OpenF1Position {
  driver_number: number;
  position: number;
  broadcast_name: string;
  team_name: string;
  tla: string; // 3-letter abbreviation
}

interface OpenF1Interval {
  driver_number: number;
  gap_to_leader: number | null;
  interval: number | null;
}

export class F1LiveScraper extends BaseLiveScraper {
  readonly series = "f1" as const;
  private readonly baseUrl = "https://api.openf1.org/v1";

  async fetchLiveData(): Promise<LiveData> {
    // Get the most recent session
    const sessions = await this.fetchJson<OpenF1Session[]>(
      `${this.baseUrl}/sessions?session_key=latest`
    );
    const session = sessions?.[0];

    if (!session || session.status !== "Started") {
      return { session: null, positions: [] };
    }

    const [positions, intervals] = await Promise.all([
      this.fetchJson<OpenF1Position[]>(
        `${this.baseUrl}/drivers?session_key=latest`
      ),
      this.fetchJson<OpenF1Interval[]>(
        `${this.baseUrl}/intervals?session_key=latest&interval<5`
      ),
    ]);

    const intervalMap = new Map(
      (intervals ?? []).map((i) => [i.driver_number, i])
    );

    const livePositions: LivePosition[] = (positions ?? [])
      .sort((a, b) => a.position - b.position)
      .map((p): LivePosition => {
        const interval = intervalMap.get(p.driver_number);
        const gap =
          p.position === 1
            ? "LEADER"
            : interval?.gap_to_leader != null
              ? `+${interval.gap_to_leader.toFixed(3)}s`
              : "—";

        return {
          position: p.position,
          driverName: p.broadcast_name,
          driverCode: p.tla,
          carNumber: String(p.driver_number),
          teamName: p.team_name,
          gap,
          lastLapTime: null,
          tyre: null,
          pitStops: 0,
          classCategory: null,
        };
      });

    return {
      session: {
        id: String(session.session_key),
        series: "f1",
        eventName: session.meeting_name,
        circuitName: session.circuit_short_name,
        sessionType: this.mapSessionType(session.session_type),
        status: "live",
        startsAt: session.date_start,
        endsAt: session.date_end ?? null,
        timeRemaining: null,
        lapsCompleted: null,
        totalLaps: null,
      },
      positions: livePositions,
    };
  }

  private mapSessionType(type: string): LivePosition["classCategory"] extends infer T ? any : never {
    const map: Record<string, string> = {
      Qualifying: "qualifying",
      Race: "race",
      Practice: "practice",
      Sprint: "sprint",
      "Sprint Qualifying": "sprint_qualifying",
    };
    return map[type] ?? "practice";
  }
}
