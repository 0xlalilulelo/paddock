/**
 * Vector embedding for story clustering.
 * Uses AI Gateway with text-embedding-004 (768 dims).
 */

import { embed } from "ai";

export async function generateEmbedding(
  title: string,
  summary: string | null
): Promise<number[] | null> {
  const text = summary ? `${title}. ${summary}` : title;

  try {
    const { embedding } = await embed({
      model: "google/text-embedding-004" as Parameters<typeof embed>[0]["model"],
      value: text,
    });
    return embedding;
  } catch (err) {
    console.error("[embed] Embedding generation failed:", err);
    return null;
  }
}
