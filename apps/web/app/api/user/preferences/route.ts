import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserPreferences, upsertUserPreferences } from "@paddock/db";
import { z } from "zod";
import type { UserPreferences } from "@paddock/api-types";

export const runtime = "nodejs";

const seriesId = z.enum(["f1", "imsa", "wec", "nascar"]);

const seriesNotifPrefs = z.object({
  breakingNews: z.boolean(),
  raceStart: z.boolean(),
  qualifyingResults: z.boolean(),
  raceResults: z.boolean(),
  raceStartLeadMinutes: z.union([z.literal(30), z.literal(60)]),
}).partial();

const preferencesSchema = z.object({
  seriesOrder: z.array(seriesId),
  notificationPrefs: z.record(seriesId, seriesNotifPrefs),
  theme: z.enum(["dark", "light", "system"]),
  pushToken: z.string().regex(/^ExponentPushToken\[.+\]$/, "Invalid Expo push token format").nullable(),
}).partial();

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefs = await getUserPreferences(userId);
  return NextResponse.json(prefs);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  const result = preferencesSchema.safeParse(raw);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid body", details: result.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await upsertUserPreferences(userId, result.data as Partial<UserPreferences>);
  return NextResponse.json(updated);
}
