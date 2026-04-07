import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getSavedArticles,
  saveArticle,
  unsaveArticle,
} from "@paddock/db";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const saved = await getSavedArticles(userId);
  return NextResponse.json(saved);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { articleId } = (await req.json()) as { articleId: string };
  if (!articleId) return NextResponse.json({ error: "Missing articleId" }, { status: 400 });

  await saveArticle(userId, articleId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { articleId } = (await req.json()) as { articleId: string };
  if (!articleId) return NextResponse.json({ error: "Missing articleId" }, { status: 400 });

  await unsaveArticle(userId, articleId);
  return NextResponse.json({ ok: true });
}
