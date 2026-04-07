/**
 * Series tagging — two-pass approach:
 *   1. Fast rule-based: keyword + domain matching (covers ~90% of cases)
 *   2. AI assist fallback for ambiguous articles (calls Claude Haiku)
 */

import { generateText } from "ai";
import type { SeriesId } from "@paddock/api-types";

// ─── Rule-based keyword sets ──────────────────────────────────────────────────

const SERIES_KEYWORDS: Record<SeriesId, RegExp> = {
  f1: /\b(formula[ -]?1|formula one|\bf1\b|grand prix|gp\b|fia f1|f1 world championship|mclaren|ferrari|red bull racing|mercedes amg f1|aston martin f1|alpine f1|haas f1|rb f1|williams racing|kick sauber|verstappen|hamilton|norris|leclerc|russell|alonso|sainz|perez|tsunoda|stroll|hulkenberg|gasly|ocon|bottas|zhou|magnussen|albon|sargeant|colapinto|bearman)\b/i,
  imsa: /\b(imsa|weathertech|daytona 24|rolex 24|sebring 12|petit le mans|mid-ohio|watkins glen|laguna seca|vir|road america|gtp|gtdpro|gtd pro|lmp3 imsa|cadillac racing|acura motorsports|bmw m team|porsche penske|mustang sampling|action express|jdc-miller|pfaff)\b/i,
  wec: /\b(wec\b|world endurance|le mans 24|24 hours of le mans|6 hours|spa wec|fuji wec|bahrain wec|interlagos wec|portimao wec|imola wec|hypercar|lmgt3|lmh|lmdh|toyota gazoo|ferrari af corse|peugeot totalenergies|cadillac wec|porsche lm|bmw wec|alpine endurance|jota|united autosports|heart of racing|proton competition|iron lynx)\b/i,
  nascar: /\b(nascar|cup series|xfinity series|craftsman truck|daytona 500|talladega|bristol|martinsville|charlotte motor|dover|pocono|michigan speedway|sonoma|watkins glen nascar|chicago street race|hendrick motorsports|joe gibbs|team penske nascar|rck|23xi|legacy motor|trackhouse|richard childress|wood brothers|front row|stewart-haas|bubba wallace|denny hamlin|kyle busch|joey logano|chase elliott|william byron|ryan blaney|martin truex|tyler reddick|christopher bell)\b/i,
};

const DOMAIN_SERIES: Record<string, SeriesId[]> = {
  "formula1.com": ["f1"],
  "f1.com": ["f1"],
  "racefans.net": ["f1"],
  "imsa.com": ["imsa"],
  "fiawec.com": ["wec"],
  "radiolemans.com": ["wec", "imsa"],
  "nascar.com": ["nascar"],
  "motorsport.com": [], // multi-series — use keyword matching
  "autosport.com": [],
  "the-race.com": [],
};

// ─── Public API ───────────────────────────────────────────────────────────────

export function classifySeries(
  title: string,
  url: string,
  content?: string
): SeriesId[] {
  // 1. Domain hint
  const domain = extractDomain(url);
  const domainSeries = DOMAIN_SERIES[domain];
  if (domainSeries !== undefined && domainSeries.length > 0) {
    return domainSeries;
  }

  // 2. Keyword matching on title + first 500 chars of content
  const text = [title, content?.slice(0, 500) ?? ""].join(" ");
  const matched: SeriesId[] = [];
  for (const [series, regex] of Object.entries(SERIES_KEYWORDS) as [SeriesId, RegExp][]) {
    if (regex.test(text)) matched.push(series);
  }
  if (matched.length > 0) return matched;

  // 3. Inconclusive — caller should invoke classifySeriesAI for uncertain cases
  return [];
}

export async function classifySeriesAI(
  title: string,
  content: string
): Promise<SeriesId[]> {
  const prompt = `You are a motorsports editor. Classify which racing series the following article belongs to.

Series options: f1, imsa, wec, nascar

Rules:
- Return ONLY a comma-separated list of series IDs from the options above
- Return multiple series if the article covers more than one
- If genuinely unclear, return "f1" as default
- Do not explain, just return the list

Article title: ${title}
Article excerpt: ${content.slice(0, 400)}`;

  try {
    const { text } = await generateText({
      model: "google/gemini-2.5-flash",
      prompt,
      maxOutputTokens: 20,
    });

    return text
      .toLowerCase()
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is SeriesId =>
        ["f1", "imsa", "wec", "nascar"].includes(s)
      );
  } catch {
    return ["f1"];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
