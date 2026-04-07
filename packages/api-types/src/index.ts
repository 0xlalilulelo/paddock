// ─── Series ───────────────────────────────────────────────────────────────────

export type SeriesId = "f1" | "imsa" | "wec" | "nascar";

export interface SeriesConfig {
  id: SeriesId;
  name: string;
  shortName: string;
  /** Tailwind CSS color class used for the series badge */
  colorClass: string;
  /** Hex accent color */
  accentColor: string;
}

// ─── Content Sources ──────────────────────────────────────────────────────────

export interface Source {
  id: string;
  name: string;
  domain: string;
  faviconUrl: string | null;
  tier: 1 | 2;
  series: SeriesId[];
}

export type XAccountType =
  | "official_series"
  | "official_team"
  | "journalist"
  | "driver";

export interface XAccount {
  handle: string;
  displayName: string;
  accountType: XAccountType;
  series: SeriesId[];
  isActive: boolean;
}

// ─── Articles ─────────────────────────────────────────────────────────────────

export interface ArticleSummary {
  id: string;
  url: string;
  title: string;
  summary: string | null;
  source: Pick<Source, "id" | "name" | "domain" | "faviconUrl">;
  series: SeriesId[];
  publishedAt: string; // ISO 8601
  imageUrl: string | null;
  isBreaking: boolean;
  clusterId: string | null;
  /** Total number of articles in the same story cluster */
  clusterCount: number;
}

// ─── Social Posts ─────────────────────────────────────────────────────────────

export interface SocialPost {
  id: string;
  platform: "x";
  authorHandle: string;
  authorDisplayName: string;
  authorType: XAccountType;
  content: string;
  url: string;
  series: SeriesId[];
  publishedAt: string; // ISO 8601
  isBreaking: boolean;
  mediaUrls: string[];
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

export type FeedItem =
  | { type: "article"; data: ArticleSummary }
  | { type: "social"; data: SocialPost };

export interface FeedPage {
  items: FeedItem[];
  /** ISO timestamp cursor for the next page; null when no more pages */
  nextCursor: string | null;
}

export type FeedSortOrder = "latest" | "top";
export type FeedContentType = "all" | "article" | "social";

export interface FeedQuery {
  series: SeriesId[];
  cursor?: string;
  limit?: number;
  type?: FeedContentType;
  sort?: FeedSortOrder;
}

// ─── SSE Stream Events ────────────────────────────────────────────────────────

export type StreamEvent =
  | { type: "article"; item: ArticleSummary }
  | { type: "social"; item: SocialPost }
  | { type: "breaking"; item: ArticleSummary | SocialPost };

// ─── Live Racing ──────────────────────────────────────────────────────────────

export type SessionType =
  | "practice"
  | "qualifying"
  | "race"
  | "sprint"
  | "sprint_qualifying";
export type SessionStatus = "scheduled" | "live" | "completed";

export interface LiveSession {
  id: string;
  series: SeriesId;
  eventName: string;
  circuitName: string;
  sessionType: SessionType;
  status: SessionStatus;
  startsAt: string; // ISO 8601
  endsAt: string | null; // ISO 8601
  /** Seconds remaining in session; null if not live or unknown */
  timeRemaining: number | null;
  lapsCompleted: number | null;
  totalLaps: number | null;
}

export interface LivePosition {
  position: number;
  driverName: string;
  driverCode: string | null;
  carNumber: string;
  teamName: string;
  /** Gap to leader as a formatted string, e.g. "+4.2s" or "+1 LAP" */
  gap: string;
  lastLapTime: string | null;
  /** Tyre compound abbreviation: S, M, H, I, W */
  tyre: string | null;
  pitStops: number;
  classCategory: string | null; // e.g. "GTP", "GTD Pro", "Hypercar"
}

export interface LiveData {
  session: LiveSession | null;
  positions: LivePosition[];
  /** Last 20 social posts from official + journalist accounts for this series */
  socialFeed: SocialPost[];
}

// ─── Race Calendar ────────────────────────────────────────────────────────────

export interface RaceEvent {
  id: string;
  series: SeriesId;
  eventName: string;
  circuitName: string;
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2
  timezone: string; // IANA timezone
  season: number;
  sessions: SessionSchedule[];
}

export interface SessionSchedule {
  id: string;
  type: SessionType;
  startsAt: string; // ISO 8601
  estimatedDuration: number; // minutes
  status: SessionStatus;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserPreferences {
  seriesOrder: SeriesId[];
  notificationPrefs: NotificationPrefs;
  theme: "dark" | "light" | "system";
  pushToken: string | null;
}

export interface NotificationPrefs {
  [series: string]: SeriesNotificationPrefs;
}

export interface SeriesNotificationPrefs {
  breakingNews: boolean;
  raceStart: boolean;
  qualifyingResults: boolean;
  raceResults: boolean;
  /** Minutes before session start to send race start notification */
  raceStartLeadMinutes: 30 | 60;
}

// ─── Desktop Pane Layout ──────────────────────────────────────────────────────

export type PaneType =
  | "series"
  | "source"
  | "live"
  | "search"
  | "trending";
export type PaneWidth = "compact" | "standard" | "wide";

export interface PaneConfig {
  id: string;
  type: PaneType;
  series?: SeriesId;
  sourceId?: string;
  searchQuery?: string;
  width: PaneWidth;
  sortOrder: FeedSortOrder;
  isMuted: boolean;
  /** Position in the pane container (0-indexed) */
  index: number;
}

export interface UserLayout {
  panes: PaneConfig[];
  updatedAt: string; // ISO 8601
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchResult {
  type: "article" | "social";
  item: ArticleSummary | SocialPost;
  /** Relevance score from full-text search */
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  total: number;
}
