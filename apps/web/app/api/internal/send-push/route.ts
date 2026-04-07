import { NextRequest, NextResponse } from "next/server";
import { verifyQueueSignature } from "@/lib/verify-queue-signature";
import { db } from "@paddock/db";
import { userPreferences } from "@paddock/db";

export const runtime = "nodejs";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default" | null;
  badge?: number;
}

/** Called by Vercel Queues consumer for send-push topic. */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-vercel-signature");
  const rawBody = await req.text();
  if (!verifyQueueSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = JSON.parse(rawBody) as {
      userId: string;
      notification: { title: string; body: string; data?: Record<string, string> };
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { userId, notification } = parsed;

  // Fetch push token from preferences
  const prefs = await db.query.userPreferences.findFirst({
    where: (t, { eq }) => eq(t.userId, userId),
  });

  const pushToken = prefs?.pushToken as string | undefined;

  if (!pushToken) {
    return NextResponse.json({ ok: true, skipped: "no push token" });
  }

  const message: PushMessage = {
    to: pushToken,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    sound: "default",
  };

  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[send-push] Expo API error:", res.status, text);
    return NextResponse.json({ error: "Push failed" }, { status: 502 });
  }

  const result = await res.json();
  return NextResponse.json({ ok: true, result });
}
