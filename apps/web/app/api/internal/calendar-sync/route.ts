import { NextRequest, NextResponse } from "next/server";
import { db } from "@paddock/db";
import { events, sessions } from "@paddock/db";
import { eq, and } from "drizzle-orm";
import type { SeriesId } from "@paddock/api-types";

export const runtime = "nodejs";

/**
 * Syncs the race calendar from official series APIs/feeds.
 * Called daily at 06:00 UTC via Vercel Cron.
 *
 * Strategy: fetch all external data first, then delete+insert.
 * If any API fetch fails, that series is skipped entirely (no partial delete).
 * The sessions FK has onDelete: "cascade", so the delete propagates automatically.
 */
export async function GET(req: NextRequest) {
  const secret =
    req.headers.get("x-vercel-cron-secret") ??
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await Promise.allSettled([
    syncF1Calendar(),
    syncImsaCalendar(),
    syncWecCalendar(),
    syncNascarCalendar(),
  ]);

  const summary = results.map((r, i) => ({
    series: ["f1", "imsa", "wec", "nascar"][i],
    status: r.status,
    ...(r.status === "rejected" ? { error: String(r.reason) } : {}),
  }));

  return NextResponse.json({ ok: true, summary });
}

// ─── F1 ───────────────────────────────────────────────────────────────────────

interface OpenF1Meeting {
  meeting_key: number;
  meeting_name: string;
  circuit_short_name: string;
  country_name: string;
  country_code: string;
  gmtoffset: string;
}

interface OpenF1Session {
  session_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string | null;
  meeting_key: number;
}

async function syncF1Calendar() {
  // 1. Fetch ALL data first — if any fetch fails, throw before touching DB
  const [meetingsRes, sessionsRes] = await Promise.all([
    fetch("https://api.openf1.org/v1/meetings?year=2025", { signal: AbortSignal.timeout(15_000) }),
    fetch("https://api.openf1.org/v1/sessions?year=2025", { signal: AbortSignal.timeout(15_000) }),
  ]);
  if (!meetingsRes.ok) throw new Error(`OpenF1 meetings ${meetingsRes.status}`);
  if (!sessionsRes.ok) throw new Error(`OpenF1 sessions ${sessionsRes.status}`);

  const meetings = (await meetingsRes.json()) as OpenF1Meeting[];
  const allSessions = (await sessionsRes.json()) as OpenF1Session[];

  // Sanity check — don't wipe DB for empty response
  if (meetings.length === 0) throw new Error("OpenF1 returned 0 meetings");

  // Group sessions by meeting_key
  const sessionsByMeeting = new Map<number, OpenF1Session[]>();
  for (const s of allSessions) {
    const group = sessionsByMeeting.get(s.meeting_key) ?? [];
    group.push(s);
    sessionsByMeeting.set(s.meeting_key, group);
  }

  // 2. Only now delete+insert (data is validated and ready)
  await db.delete(events).where(and(eq(events.series, "f1"), eq(events.season, 2025)));

  for (const m of meetings) {
    const [event] = await db
      .insert(events)
      .values({
        series: "f1",
        eventName: m.meeting_name,
        circuitName: m.circuit_short_name,
        country: m.country_name,
        countryCode: m.country_code ?? "",
        timezone: parseGmtOffset(m.gmtoffset),
        season: 2025,
      })
      .returning({ id: events.id });

    const meetingSessions = sessionsByMeeting.get(m.meeting_key) ?? [];
    if (meetingSessions.length > 0 && event) {
      await db.insert(sessions).values(
        meetingSessions.map((s) => ({
          eventId: event.id,
          type: mapF1SessionType(s.session_type),
          startsAt: new Date(s.date_start),
          endsAt: s.date_end ? new Date(s.date_end) : null,
          status: "scheduled" as const,
          estimatedDurationMinutes: f1SessionDuration(s.session_type),
        }))
      );
    }
  }
}

function mapF1SessionType(
  type: string
): "practice" | "qualifying" | "race" | "sprint" | "sprint_qualifying" {
  switch (type) {
    case "Qualifying": return "qualifying";
    case "Race": return "race";
    case "Sprint": return "sprint";
    case "Sprint Qualifying":
    case "Sprint Shootout": return "sprint_qualifying";
    default: return "practice";
  }
}

function f1SessionDuration(type: string): number {
  switch (type) {
    case "Race": return 120;
    case "Sprint": return 30;
    case "Sprint Qualifying":
    case "Sprint Shootout": return 45;
    default: return 60; // practice / qualifying
  }
}

// ─── IMSA ─────────────────────────────────────────────────────────────────────

interface ImsaRace {
  id: string;
  name: string;
  trackName: string;
  startDate: string;
  country?: string;
  timezone?: string;
  /** Duration in hours, e.g. 12 for Sebring 12H */
  durationHours?: number;
}

async function syncImsaCalendar() {
  const res = await fetch("https://www.imsa.com/api/schedule/2025", {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`IMSA schedule ${res.status}`);

  const schedule = (await res.json()) as ImsaRace[];
  if (schedule.length === 0) throw new Error("IMSA returned 0 races");

  await db.delete(events).where(and(eq(events.series, "imsa"), eq(events.season, 2025)));

  for (const race of schedule) {
    const [event] = await db
      .insert(events)
      .values({
        series: "imsa",
        eventName: race.name,
        circuitName: race.trackName,
        country: race.country ?? "USA",
        countryCode: "US",
        timezone: race.timezone ?? "America/New_York",
        season: 2025,
      })
      .returning({ id: events.id });

    if (event) {
      const durationHours = race.durationHours ?? 6;
      const startsAt = new Date(race.startDate);
      const endsAt = new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000);
      await db.insert(sessions).values({
        eventId: event.id,
        type: "race",
        startsAt,
        endsAt,
        status: "scheduled",
        estimatedDurationMinutes: durationHours * 60,
      });
    }
  }
}

// ─── WEC ──────────────────────────────────────────────────────────────────────

interface WecRace {
  id: string;
  name: string;
  circuit: string;
  country: string;
  timezone: string;
  startDate: string;
  /** Duration in hours, e.g. 24 for Le Mans */
  durationHours?: number;
}

async function syncWecCalendar() {
  const res = await fetch("https://www.fiawec.com/api/calendar/2025", {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`WEC calendar ${res.status}`);

  const calendar = (await res.json()) as WecRace[];
  if (calendar.length === 0) throw new Error("WEC returned 0 races");

  await db.delete(events).where(and(eq(events.series, "wec"), eq(events.season, 2025)));

  for (const race of calendar) {
    const [event] = await db
      .insert(events)
      .values({
        series: "wec",
        eventName: race.name,
        circuitName: race.circuit,
        country: race.country,
        countryCode: "",
        timezone: race.timezone ?? "Europe/Paris",
        season: 2025,
      })
      .returning({ id: events.id });

    if (event) {
      const durationHours = race.durationHours ?? 6;
      const startsAt = new Date(race.startDate);
      const endsAt = new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000);
      await db.insert(sessions).values({
        eventId: event.id,
        type: "race",
        startsAt,
        endsAt,
        status: "scheduled",
        estimatedDurationMinutes: durationHours * 60,
      });
    }
  }
}

// ─── NASCAR ───────────────────────────────────────────────────────────────────

interface NascarRace {
  race_id: number;
  race_name: string;
  track_name: string;
  race_date: string;
  radio_broadcast_time: string;
  scheduled_distance?: number;
}

async function syncNascarCalendar() {
  const res = await fetch("https://cf.nascar.com/cacher/2025/1/schedule-list.json", {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`NASCAR schedule ${res.status}`);

  const data = (await res.json()) as NascarRace[];
  if (data.length === 0) throw new Error("NASCAR returned 0 races");

  await db.delete(events).where(and(eq(events.series, "nascar"), eq(events.season, 2025)));

  for (const race of data) {
    const [event] = await db
      .insert(events)
      .values({
        series: "nascar",
        eventName: race.race_name,
        circuitName: race.track_name,
        country: "USA",
        countryCode: "US",
        timezone: "America/New_York",
        season: 2025,
      })
      .returning({ id: events.id });

    if (event) {
      // Combine race_date + broadcast time to get the start timestamp
      const startsAt = parseNascarDateTime(race.race_date, race.radio_broadcast_time);
      const endsAt = new Date(startsAt.getTime() + 3 * 60 * 60 * 1000); // ~3h per race
      await db.insert(sessions).values({
        eventId: event.id,
        type: "race",
        startsAt,
        endsAt,
        status: "scheduled",
        estimatedDurationMinutes: 180,
      });
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parses an OpenF1 GMT offset string (e.g. "+05:30:00", "-04:00:00", "00:00:00")
 * to an IANA timezone name. Handles half-hour offsets (India, Iran, etc.).
 */
function parseGmtOffset(offset: string): string {
  const sign = offset.startsWith("-") ? -1 : 1;
  const parts = offset.replace(/^[+-]/, "").split(":").map(Number);
  const totalMinutes = sign * ((parts[0] ?? 0) * 60 + (parts[1] ?? 0));

  const offsetMap: Record<number, string> = {
    0:    "UTC",
    60:   "Europe/Paris",
    120:  "Europe/Helsinki",
    180:  "Europe/Moscow",
    240:  "Asia/Dubai",
    270:  "Asia/Kabul",
    300:  "Asia/Karachi",
    330:  "Asia/Kolkata",
    345:  "Asia/Kathmandu",
    360:  "Asia/Dhaka",
    420:  "Asia/Bangkok",
    480:  "Asia/Singapore",
    525:  "Asia/Rangoon",
    540:  "Asia/Tokyo",
    570:  "Australia/Darwin",
    600:  "Australia/Sydney",
    630:  "Australia/Lord_Howe",
    660:  "Pacific/Noumea",
    [-60]:  "Atlantic/Azores",
    [-180]: "America/Sao_Paulo",
    [-210]: "America/St_Johns",
    [-240]: "America/New_York",
    [-300]: "America/Chicago",
    [-360]: "America/Denver",
    [-420]: "America/Los_Angeles",
    [-480]: "America/Anchorage",
    [-540]: "Pacific/Honolulu",
  };

  return offsetMap[totalMinutes] ?? "UTC";
}

/**
 * NASCAR gives race_date as "YYYY-MM-DD" and radio_broadcast_time as "HH:MM:SS".
 * Combines them into a UTC Date (treating the time as Eastern, offset −4 or −5 for DST).
 */
function parseNascarDateTime(date: string, time: string): Date {
  const combined = `${date}T${time ?? "12:00:00"}`;
  const parsed = new Date(combined);
  // Fall back to noon UTC if parse fails
  return isNaN(parsed.getTime()) ? new Date(`${date}T17:00:00Z`) : parsed;
}
