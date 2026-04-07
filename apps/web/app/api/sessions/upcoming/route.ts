import { NextRequest, NextResponse } from "next/server";
import { getUpcomingSessions } from "@paddock/db";
import type { SeriesId } from "@paddock/api-types";

export const runtime = "nodejs";

const VALID_SERIES: SeriesId[] = ["f1", "imsa", "wec", "nascar"];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const seriesParam = searchParams.get("series");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 50);

  const series = seriesParam
    ? seriesParam.split(",").filter((s): s is SeriesId => VALID_SERIES.includes(s as SeriesId))
    : VALID_SERIES;

  const rows = await getUpcomingSessions(series, limit);

  const result = rows.map(({ session, event }) => ({
    id: session.id,
    type: session.type,
    startsAt: session.startsAt?.toISOString() ?? null,
    endsAt: session.endsAt?.toISOString() ?? null,
    estimatedDurationMinutes: session.estimatedDurationMinutes,
    eventName: event.eventName,
    circuitName: event.circuitName,
    country: event.country,
    series: event.series as SeriesId,
  }));

  return NextResponse.json(result);
}
