/**
 * NASCAR live timing via NASCAR's public CDN live feed.
 * Endpoint: https://cf.nascar.com/live/feeds/live-feed.json
 * No authentication required.
 *
 * flag_state values: 1=green 2=yellow 3=red 4=white(last lap) 5=checkered 8=caution 9=not started
 * run_type values:   1=practice 2=qualifying 3=race
 */

import { BaseLiveScraper, type LiveData } from "./base-live";
import type { LivePosition } from "@paddock/api-types";

interface NascarDriver {
  driver_id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  /** 4-letter abbreviation, e.g. "LARS" */
  abbr_name: string;
}

interface NascarVehicle {
  vehicle_number: string;
  running_position: number;
  /** Seconds behind leader; 0.000 for the leader */
  delta: number;
  last_lap_time: number;
  last_lap_speed: number;
  pit_stops: number;
  status: number;
  is_on_track: boolean;
  driver: NascarDriver;
  team_name: string;
  manufacturer: string;
  sponsor_name?: string;
}

interface NascarLiveFeed {
  /** "NASCAR Cup Series - Daytona 500" */
  run_name: string;
  run_type: number;
  flag_state: number;
  laps_in_race: number;
  lap_number: number;
  track_name: string;
  track_id: number;
  race_id: number;
  series_id: number;
  vehicles: NascarVehicle[];
}

export class NascarLiveScraper extends BaseLiveScraper {
  readonly series = "nascar" as const;
  private readonly feedUrl = "https://cf.nascar.com/live/feeds/live-feed.json";

  async fetchLiveData(): Promise<LiveData> {
    const feed = await this.fetchJson<NascarLiveFeed>(this.feedUrl);

    // flag_state 9 = pre-event / not started; empty vehicles = nothing to show
    if (!feed || !feed.vehicles?.length || feed.flag_state === 9) {
      return { session: null, positions: [] };
    }

    const positions: LivePosition[] = feed.vehicles
      .filter((v) => v.running_position > 0)
      .sort((a, b) => a.running_position - b.running_position)
      .map((v): LivePosition => ({
        position: v.running_position,
        driverName: v.driver?.full_name ?? `#${v.vehicle_number}`,
        driverCode: (v.driver?.abbr_name ?? v.vehicle_number).toUpperCase(),
        carNumber: v.vehicle_number,
        teamName: v.team_name ?? "",
        gap:
          v.running_position === 1
            ? "LEADER"
            : v.delta > 0
              ? `+${v.delta.toFixed(3)}s`
              : "—",
        lastLapTime:
          v.last_lap_time > 0 ? formatLapTime(v.last_lap_time) : null,
        tyre: null, // NASCAR doesn't expose tyre compound data
        pitStops: v.pit_stops ?? 0,
        classCategory: null,
      }));

    return {
      session: {
        id: String(feed.race_id),
        series: "nascar",
        eventName: stripSeriesPrefix(feed.run_name),
        circuitName: feed.track_name,
        sessionType: mapRunType(feed.run_type),
        status: "live",
        startsAt: new Date().toISOString(),
        endsAt: null,
        timeRemaining: null,
        lapsCompleted: feed.lap_number ?? null,
        totalLaps: feed.laps_in_race ?? null,
      },
      positions,
    };
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function mapRunType(
  runType: number
): "practice" | "qualifying" | "race" | "sprint" | "sprint_qualifying" {
  if (runType === 2) return "qualifying";
  if (runType === 3) return "race";
  return "practice";
}

/** "NASCAR Cup Series - Daytona 500" → "Daytona 500" */
function stripSeriesPrefix(name: string): string {
  return name.replace(/^NASCAR[^-]+-\s*/i, "").trim() || name;
}

/**
 * Convert decimal seconds to a display string.
 * < 60s → "38.234"   ≥ 60s → "1:18.234"
 */
function formatLapTime(seconds: number): string {
  if (seconds <= 0) return "—";
  if (seconds < 60) return seconds.toFixed(3);
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(3).padStart(6, "0");
  return `${m}:${s}`;
}
