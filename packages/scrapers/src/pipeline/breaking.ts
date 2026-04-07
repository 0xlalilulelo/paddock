import { generateText } from "ai";

const BREAKING_KEYWORDS =
  /\b(breaking|exclusive|confirmed|fired|resigned|retired|disqualified|banned|excluded|crashed|dead|dies|arrested|signed|contract|penalty|appeal|verdict)\b/i;

/**
 * Classify whether an article should be flagged as breaking news.
 * Uses a fast rule-based check first; falls back to AI for edge cases.
 */
export async function classifyBreaking(
  title: string,
  summary: string | null
): Promise<boolean> {
  // Fast path: keyword match on headline
  if (BREAKING_KEYWORDS.test(title)) {
    return true;
  }

  // AI classification for edge cases
  try {
    const { text } = await generateText({
      model: "google/gemini-2.5-flash",
      system:
        "You are a motorsports news editor. Classify whether a headline represents breaking news that fans would want an immediate push notification for.",
      prompt: `Is this motorsports headline "breaking news" that warrants an immediate push notification? Answer only YES or NO.

Headline: "${title}"
${summary ? `Summary: "${summary}"` : ""}

Breaking news examples: driver confirmed for new team, driver retirement, race disqualification, serious accident, sudden rule change, team closure.
Not breaking: race preview, technical analysis, historical feature, opinion piece, routine practice results.`,
      maxOutputTokens: 5,
      temperature: 0,
    });

    return text.trim().toUpperCase().startsWith("YES");
  } catch {
    return false;
  }
}
