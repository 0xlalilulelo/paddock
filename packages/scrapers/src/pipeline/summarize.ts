import { generateText } from "ai";

/**
 * Generate a 2-3 sentence AI summary of an article.
 * Uses Claude Haiku via AI Gateway for low cost (~$0.001/article).
 */
export async function summarizeArticle(
  title: string,
  bodyText: string
): Promise<string | null> {
  // Truncate body to ~2000 chars to keep token cost low
  const truncatedBody = bodyText.slice(0, 2000);

  try {
    const { text } = await generateText({
      model: "google/gemini-2.5-flash",
      system:
        "You are a motorsports journalist assistant. Write concise, accurate summaries of racing news articles. Use active voice and present tense. Be objective. Never add information not in the source.",
      prompt: `Summarize the following motorsports article in exactly 2-3 sentences. Focus on the most newsworthy facts (who, what, when, where, result or significance). Do not start with "The article" or "This article".

Title: ${title}

Content: ${truncatedBody}`,
      maxOutputTokens: 150,
      temperature: 0.2,
    });

    return text.trim() || null;
  } catch (err) {
    console.error("[summarize] AI summary failed:", err);
    return null;
  }
}
