import { db } from "../client";
import { sessions, events } from "../schema";
import { eq, gte, lte, and, asc, desc, inArray } from "drizzle-orm";
import type { SeriesId } from "@paddock/api-types";

export async function getLiveSession(series: SeriesId) {
  const now = new Date();
  // A session is "live" if it started within the last 12 hours and is not completed
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

  const [row] = await db
    .select({ session: sessions, event: events })
    .from(sessions)
    .innerJoin(events, eq(sessions.eventId, events.id))
    .where(
      and(
        eq(events.series, series),
        eq(sessions.status, "live")
      )
    )
    .orderBy(desc(sessions.startsAt))
    .limit(1);

  return row ?? null;
}

export async function getUpcomingSessions(series: SeriesId[], limit = 10) {
  const now = new Date();
  return db
    .select({ session: sessions, event: events })
    .from(sessions)
    .innerJoin(events, eq(sessions.eventId, events.id))
    .where(
      and(
        gte(sessions.startsAt, now),
        eq(sessions.status, "scheduled"),
        ...(series.length > 0 ? [inArray(events.series, series)] : [])
      )
    )
    .orderBy(asc(sessions.startsAt))
    .limit(limit);
}

export async function markSessionLive(sessionId: string) {
  return db
    .update(sessions)
    .set({ status: "live" })
    .where(eq(sessions.id, sessionId));
}

export async function markSessionCompleted(sessionId: string) {
  return db
    .update(sessions)
    .set({ status: "completed" })
    .where(eq(sessions.id, sessionId));
}
