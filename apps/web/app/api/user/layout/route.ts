import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserLayout, upsertUserLayout } from "@paddock/db";
import { z } from "zod";

export const runtime = "nodejs";

const seriesId = z.enum(["f1", "imsa", "wec", "nascar"]);

const paneConfigSchema = z.object({
  id: z.string(),
  type: z.enum(["series", "source", "live", "search", "trending"]),
  series: seriesId.optional(),
  sourceId: z.string().optional(),
  searchQuery: z.string().optional(),
  width: z.enum(["compact", "standard", "wide"]),
  sortOrder: z.enum(["latest", "top"]),
  isMuted: z.boolean(),
  index: z.number().int().min(0),
});

const layoutSchema = z.object({
  panes: z.array(paneConfigSchema).max(20),
  updatedAt: z.string(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const layout = await getUserLayout(userId);
  return NextResponse.json(layout);
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

  const result = layoutSchema.safeParse(raw);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid body", details: result.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await upsertUserLayout(userId, result.data);
  return NextResponse.json(updated);
}
