// ─── Base ─────────────────────────────────────────────────────────────────────
export { BaseScraper } from "./news/base-scraper";
export type { RawArticle, ScraperConfig } from "./news/base-scraper";

// ─── News scrapers ────────────────────────────────────────────────────────────
export { MotorsportComScraper } from "./news/motorsport-com";
export { TheRaceScraper } from "./news/the-race";
export { AutosportScraper } from "./news/autosport";
export { RaceFansScraper } from "./news/racefans";
export { ImsaScraper } from "./news/imsa";
export { FiawecScraper } from "./news/fiawec";
export { NascarScraper } from "./news/nascar";
export { RadioLeMansScraper } from "./news/radio-lemans";

// ─── Social scrapers ──────────────────────────────────────────────────────────
export { scrapeXAccount } from "./social/nitter";
export type { RawSocialPost } from "./social/nitter";
export { scrapeXAccountDirect } from "./social/playwright-x";

// ─── Live scrapers ────────────────────────────────────────────────────────────
export { BaseLiveScraper } from "./live/base-live";
export type { LiveData as ScraperLiveData } from "./live/base-live";
export { F1LiveScraper } from "./live/f1-live";
export { ImsaLiveScraper } from "./live/imsa-live";
export { FiawecLiveScraper } from "./live/fiawec-live";
export { NascarLiveScraper } from "./live/nascar-live";

// ─── Pipeline ─────────────────────────────────────────────────────────────────
export { hashUrl, isDuplicate } from "./pipeline/dedup";
export { summarizeArticle } from "./pipeline/summarize";
export { classifyBreaking } from "./pipeline/breaking";
export { generateEmbedding } from "./pipeline/embed";
export { findOrCreateCluster } from "./pipeline/cluster";
export { classifySeries, classifySeriesAI } from "./pipeline/classify";
