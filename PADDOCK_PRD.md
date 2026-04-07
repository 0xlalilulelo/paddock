# Paddock — Product Requirements Document
**Version:** 1.0
**Date:** 2026-03-28
**Status:** Draft — Pending Engineering Review

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [User Personas](#4-user-personas)
5. [Platform Overview](#5-platform-overview)
6. [Desktop Feature Spec](#6-desktop-feature-spec)
7. [Mobile Feature Spec](#7-mobile-feature-spec)
8. [Content & Data](#8-content--data)
9. [Story Card Design](#9-story-card-design)
10. [Live Race Mode](#10-live-race-mode)
11. [Technical Architecture](#11-technical-architecture)
12. [Non-Functional Requirements](#12-non-functional-requirements)
13. [Out of Scope (v1)](#13-out-of-scope-v1)
14. [Risks & Mitigations](#14-risks--mitigations)
15. [Roadmap](#15-roadmap)

---

## 1. Executive Summary

**Paddock** is a motorsports news aggregator that gives fans a single, always-current window into every series they follow. On desktop it presents a TweetDeck-style multi-pane dashboard — one column per series running in parallel. On mobile it delivers the same awareness through a category-first native app with a unified feed, series deep-dives, and live race mode.

Content is scraped unofficially from every major motorsports news site and from Twitter/X. Each story is AI-summarized to 2–3 sentences so users get the gist without clicking through. Stories covering the same event are clustered into a single card showing the best source, with all other outlets visible on demand.

**v1 Series:** F1, IMSA, WEC/FIAWEC, NASCAR
**Platforms:** Next.js web (desktop) + React Native/Expo (iOS & Android)
**Language:** English only

---

## 2. Problem Statement

Motorsports fans follow multiple series simultaneously. Today's workflow is fragmented:

- **Too many tabs:** Motorsport.com, The Race, Autosport, RaceFans, Twitter/X — each checked manually on its own schedule.
- **Duplicate noise:** Five outlets publish the same qualifying result. The feed is clogged before the race even starts.
- **Context poverty:** A headline alone ("Bamber leads after strategy call") is meaningless without the race name, gap to second, and series context.
- **Zero live integration:** News sites aren't real-time. Twitter/X is real-time but unstructured and noisy.
- **Mobile is an afterthought:** No existing aggregator has a mobile UX designed for motorsport's rhythm (pre-event build-up → qualifying → race → post-race debrief).

Paddock solves all five.

---

## 3. Goals & Success Metrics

### Product Goals
- **G1:** Become the single tab / single app motorsport fans open first on race weekends.
- **G2:** Surface the most important story in any series within 90 seconds of it being published.
- **G3:** Give users enough context to understand a story without clicking through at least 60% of the time.
- **G4:** Deliver a live race experience competitive with the official timing apps for situational awareness.

### v1 Launch Metrics (90-day targets)
| Metric | Target |
|---|---|
| Daily Active Users | 2,000 |
| Avg. session length (desktop) | 8 min |
| Avg. session length (mobile) | 5 min |
| Feed freshness (P95 article age at ingest) | < 120 seconds |
| Crash-free sessions (mobile) | > 99.5% |
| Push notification opt-in rate | > 35% |
| Story cluster accuracy (same-event grouping) | > 90% |

---

## 4. User Personas

### Persona A — The Multi-Series Fan ("Alex")
- Follows F1 primarily, IMSA and WEC casually.
- Opens Paddock on a laptop during race weekends with 3 panes open side-by-side.
- Wants to glance between series without context-switching between apps.
- Uses Live Race Mode during IMSA endurance events to track positions while working.

### Persona B — The Commuter Fan ("Jordan")
- NASCAR primary, F1 secondary.
- Checks Paddock on the subway each morning for 5 minutes.
- Wants a quick brief: what happened overnight, what's coming this weekend.
- Opts in to NASCAR and F1 breaking news push notifications.

### Persona C — The Journalist / Enthusiast ("Casey")
- Follows all 4 series professionally or as a serious hobby.
- Heavy desktop user. Creates custom panes: one per series plus a dedicated "Twitter" pane filtered to specific journalist accounts.
- Values source attribution — needs to know if a story is from an official press release or a rumor from a paddock reporter.
- Keyboard shortcut user.

---

## 5. Platform Overview

| Attribute | Desktop (Web) | Mobile (Native) |
|---|---|---|
| Framework | Next.js 16 (App Router) | React Native / Expo |
| Target | Chrome, Firefox, Safari (modern) | iOS 16+, Android 10+ |
| Layout paradigm | Multi-pane (TweetDeck style) | Tab bar + single-pane feeds |
| Auth | Optional (Google, Apple, email via Clerk) | Same |
| Theme | Dark mode default, light mode optional | Dark default, respects system |
| Offline | Service worker caches last-seen feed | AsyncStorage caches last-seen feed |
| App distribution | Vercel (web) | App Store + Google Play |

---

## 6. Desktop Feature Spec

### 6.1 Layout

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR (64px / 240px expanded)  │  PANE CONTAINER (horizontal scroll)        │
│                                  │                                             │
│  [P] Paddock logo                │  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  ──────────────                  │  │ F1 PANE  │ │IMSA PANE │ │ WEC PANE │   │
│  [F1]  Formula 1                 │  │          │ │          │ │          │   │
│  [IM]  IMSA                      │  │ cards... │ │ cards... │ │ cards... │   │
│  [WE]  WEC                       │  │          │ │          │ │          │   │
│  [NA]  NASCAR                    │  │          │ │          │ │          │   │
│  ──────────────                  │  │          │ │          │ │          │   │
│  [+]  Add Pane                   │  └──────────┘ └──────────┘ └──────────┘   │
│  [🔍] Search                     │                                  [+]       │
│  ──────────────                  │                                             │
│  [🔔] Alerts                     │                                             │
│  [👤] Profile                    │                                             │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Sidebar
- **Collapsed (64px):** Series icon pills only. Hover reveals series name tooltip.
- **Expanded (240px):** Icon + series name + unread badge.
- **Click a series:** Opens a new pane for that series (or scrolls to existing one).
- **[+] Add Pane:** Modal to add any pane type (see §6.4).
- **[🔍] Search:** Opens a floating global search overlay (Cmd/Ctrl+K).
- **[🔔] Alerts:** Notification drawer — breaking news history.
- **[👤] Profile:** Sign in / account settings drawer.
- **Resize handle:** Drag sidebar edge to expand/collapse.

### 6.3 Pane Container
- Panes are laid out horizontally with independent vertical scroll per pane.
- Drag a pane header to reorder.
- Drag the pane's right edge to resize (snap to: compact 320px / standard 400px / wide 480px).
- Add new panes via [+] button at the far right.
- Default layout for new users: F1, IMSA, WEC, NASCAR (one pane each).
- Signed-in users: layout persisted to backend, restored on any device.

### 6.4 Pane Types

| Type | Description |
|---|---|
| **Series** | All articles + social posts for one series. Default pane type. |
| **Source** | All content from a single outlet (e.g., "The Race only"). |
| **Live** | Live race ticker + social stream. Activates when a session is running; idles with countdown when not. |
| **Search** | Results for a keyword, hashtag, or driver name. |
| **Trending** | Top stories ranked by cluster size (most outlets covering it) across all series. |

### 6.5 Pane Header & Controls
```
┌──────────────────────────────────────────────┐
│  🏎 F1   ↕ Latest  ▼   [🔇 Mute] [⚙] [✕]   │
└──────────────────────────────────────────────┘
```
- **Series badge:** Colored pill with series icon + name.
- **Sort:** Latest (chronological) or Top (cluster size / engagement).
- **Mute:** Temporarily silence this pane (collapses to slim bar, stops scrolling).
- **Settings (⚙):** Filter by source, keyword mute list, card density (compact / standard).
- **Close (✕):** Remove pane.

### 6.6 Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + K` | Global search |
| `J / K` | Next / previous story within focused pane |
| `S` | Save focused story |
| `O` | Open focused story in new tab |
| `N` | Add new pane |
| `←  →` | Focus previous / next pane |
| `R` | Refresh focused pane |
| `Esc` | Close overlay / modal |

### 6.7 Global Search
- Full-text search across all scraped articles (last 30 days) and social posts (last 7 days).
- Filter by: series, source, date range, content type (article / social).
- Results open in a temporary Search pane.

### 6.8 Breaking News Banner
- Pinned red banner at top of browser when a breaking news story is detected.
- Shows series badge, headline, and dismiss (X).
- Clicking navigates to the story's pane and highlights the card.

---

## 7. Mobile Feature Spec

### 7.1 Navigation Structure

Bottom tab bar with 5 tabs:

```
┌────────────────────────────────────────┐
│                                        │
│           [Content Area]               │
│                                        │
├────────┬────────┬───────┬──────┬───────┤
│  Feed  │Discover│  Live │Saved │  You  │
│  (🏠)  │  (🔭)  │  (📡) │  (🔖)│  (👤) │
└────────┴────────┴───────┴──────┴───────┘
```

### 7.2 Tab 1: Feed (Primary Tab)

**Header:**
```
┌─────────────────────────────────────────┐
│  Paddock                    [🔍]  [🔔]  │
├─────────────────────────────────────────┤
│  ALL  •  🔴F1  •  🟢IMSA  •  🔵WEC  •  │
│  ⚫NASCAR                               │
└─────────────────────────────────────────┘
```
- Series filter chips are horizontally scrollable, sticky at top.
- **ALL** shows unified chronological feed of all followed series.
- Tapping a chip instantly filters to that series (local filter, no network round-trip).
- Active chip has filled background; inactive chips are outlined.

**Feed Behavior:**
- Infinite scroll, chronological (newest at top).
- Pull-to-refresh.
- New story indicator: "↑ 4 new stories" tap-to-scroll-to-top toast.
- Breaking news: full-width red banner card pinned at top of feed, above filter chips. Dismissible.

**Story Card (Standard):**
```
┌─────────────────────────────────────────┐
│  🔴 F1  •  The Race  •  12m ago         │
│                                         │
│  Verstappen takes pole in Bahrain GP    │
│  qualifying with record lap time        │
│                                         │
│  Max Verstappen secured pole position  │
│  with a 1:29.179, breaking the circuit │
│  record. Leclerc starts P2, 0.3s...   │
│                                         │
│  + 8 other sources        [Read →]      │
└─────────────────────────────────────────┘
```

**Card Gestures:**
- **Tap:** Opens article in in-app browser (SFSafariViewController / Chrome Custom Tabs).
- **Swipe right:** Save to reading list (green checkmark animation).
- **Swipe left:** Hide + "Less like this" (undo toast).
- **Long press:** Action sheet — Save, Share, Open in browser, Hide, Report.
- **Tap "+ N other sources":** Expands cluster to show all sources inline.

### 7.3 Tab 2: Discover

**Layout:** 2×2 grid of series cards (for 4 v1 series).

```
┌────────────────┐  ┌────────────────┐
│  🔴  F1        │  │  🟢  IMSA      │
│  47 stories    │  │  12 stories    │
│  today         │  │  today         │
│  Next: Bahrain │  │  Next: Sebring │
│  in 3d 4h      │  │  in 12d        │
└────────────────┘  └────────────────┘
┌────────────────┐  ┌────────────────┐
│  🔵  WEC       │  │  ⚫  NASCAR    │
│  8 stories     │  │  21 stories    │
│  today         │  │  today         │
│  Next: Spa     │  │  Next: Bristol │
│  in 18d        │  │  in 5d         │
└────────────────┘  └────────────────┘
```

**Series Detail View (tap any series card):**
- Series-branded header (color + logo).
- **Next event card:** Track name, date, session schedule, countdown timer.
- **Top sources:** List of outlets with story count today.
- **Key accounts:** Curated list of official accounts + top journalists for that series.
- Full series feed below (same card format as Feed tab).

### 7.4 Tab 3: Live

**When No Session Running:**
```
No sessions live right now.

Upcoming
──────────────────────────────────────
🔴 F1  •  Bahrain GP — Practice 1
   Fri Mar 29  •  in 2d 14h 30m

🟢 IMSA  •  Sebring 12H — Race
   Sat Mar 30  •  in 3d 6h 00m
──────────────────────────────────────
```

**When Session is Live:**
```
● LIVE  🟢 IMSA  •  Sebring 12H  •  3h 42m remaining
═══════════════════════════════════════════════════════

POSITIONS          [TOP 5 ▼]  [ALL CLASSES ▼]
────────────────────────────────────────────
 P1  #10  Acura ARX-06        GrandSport     +0.0s
 P2  #79  Porsche 963         GrandSport     +4.2s
 P3  #25  BMW M Hybrid V8     GrandSport     +9.8s
 P4  #02  Cadillac V-Series   GrandSport    +23.1s
 P5  #60  Acura ARX-06        GrandSport    +31.4s

LIVE FEED
────────────────────────────────────────────
● @IMSA (2m): Full Course Yellow deployed, incident at Turn 17
● @Porsche_MT (3m): P2 and the gap is closing 👊
● The Race (5m): Bamber leads after strategic pit call...
● @WayneT_Racing (7m): Lap times dropping in the heat...
```

- **Positions panel:** Scraped from series timing pages. Refreshes every 15 seconds.
- **Live Feed:** Reverse-chronological stream of social posts from official accounts + curated journalists, interleaved with scraped news articles.
- **Class filter:** For IMSA/WEC, filter by class (GTP, GTD Pro, GTD / Hypercar, LMGT3).
- **Lap/time toggle:** Show laps remaining or time remaining.
- Pull-to-refresh for positions.

**Live Badge:** When any session is live, the Live tab icon shows a pulsing red dot. The Feed tab also shows a sticky "● LIVE — IMSA Sebring 12H" banner below the filter chips.

### 7.5 Tab 4: Saved

- **Reading List:** Saved articles (swipe-right or long-press save).
- **History:** Last 50 opened articles.
- Swipe left on any saved item to remove.
- Filter by series.

### 7.6 Tab 5: You

- **Sign In / Account:** Email, Google, or Apple sign-in via Clerk.
- **Notifications:** Per-series toggles:
  - Breaking News
  - Race Start (configurable lead time: 30 min / 1 hour / off)
  - Qualifying Results
  - Race Results
- **Series Order:** Drag to reorder series in the Feed filter chips.
- **Theme:** Dark / Light / System.
- **About, Privacy, Feedback.**

### 7.7 Push Notifications

| Event | Trigger | Example |
|---|---|---|
| Breaking News | AI classifies story as breaking | "🔴 F1: Verstappen excluded from Bahrain qualifying" |
| Race Start | 30 min before race session start | "🟢 IMSA Sebring 12H starts in 30 minutes" |
| Qualifying Results | After session ends | "🔴 F1: Bahrain Qualifying — Verstappen on pole" |
| Race Results | After race session ends | "⚫ NASCAR: Larson wins at Bristol" |

- All notification types are configurable per-series in You → Notifications.
- Default: Breaking News on for all followed series; all others off.
- Notifications are not sent 11pm–7am local time by default (configurable).

---

## 8. Content & Data

### 8.1 News Sources (v1)

**Tier 1 — High priority, scraped every 60 seconds:**
| Source | URL | Series covered |
|---|---|---|
| Motorsport.com | motorsport.com | All |
| The Race | the-race.com | F1, IMSA, NASCAR, WEC |
| Autosport | autosport.com | F1, WEC |
| RaceFans | racefans.net | F1 |
| Racer | racer.com | IMSA, NASCAR, IndyCar |
| NASCAR.com | nascar.com | NASCAR |
| IMSA.com | imsa.com | IMSA |
| FIA-WEC.com | fiawec.com | WEC |
| Motorsport Week | motorsportweek.com | All |

**Tier 2 — Scraped every 3 minutes:**
| Source | Series |
|---|---|
| PlanetF1.com | F1 |
| F1i.com | F1 |
| Crash.net | F1, WEC |
| Speedcafe.com | F1, NASCAR |
| Grandprix.com | F1 |

### 8.2 Twitter/X Sources

Scraped via Nitter public instances (primary) with Playwright direct scraping as fallback.

**Official Series/Org Accounts:**
- @F1, @FIAFormulaE (for cross-promotion awareness)
- @IMSA, @FIAWEC, @NASCAR
- @fia (official decisions)

**Official Team Accounts (per series):**
- F1: All 10 team official accounts
- IMSA/WEC: Top 10 manufacturer/team accounts
- NASCAR: Top 10 team accounts

**Curated Journalist Accounts:**
- F1: ~20 verified paddock reporters (The Race, Autosport, Sky F1, etc.)
- IMSA/WEC: ~10 endurance racing journalists
- NASCAR: ~10 reporters

**Filtering:** Retweets excluded. Only original posts and quote tweets included. Posts older than 48 hours excluded from live feeds (stored but not surfaced).

### 8.3 Scraping Architecture

```
Scraper Workers (Node.js / Playwright)
     │
     ├── Tier 1 sources: cron every 60s
     ├── Tier 2 sources: cron every 3m
     ├── Twitter/X via Nitter: every 60s
     └── Live sessions: every 15s
     │
     ▼
Raw Article Queue (Vercel Queues)
     │
     ▼
Processing Pipeline
     ├── 1. Deduplication check (URL + content hash)
     ├── 2. Series classification (rule-based + AI assist)
     ├── 3. AI summary generation (Claude Haiku)
     ├── 4. Breaking news classification (Claude Haiku)
     ├── 5. Story clustering (embedding similarity, cosine > 0.85)
     └── 6. Write to Neon Postgres + bust Upstash Redis cache
     │
     ▼
SSE Event Bus → Connected clients receive updates in <5s
```

### 8.4 Story Clustering

- New articles are embedded (text-embedding-3-small via AI Gateway).
- Embedding compared against all articles in same series from last 6 hours.
- If cosine similarity > 0.85 with existing cluster centroid: added to cluster.
- Cluster representative: article from highest-authority source (ranked list).
- Cluster size shown on card as "+ N other sources."
- Clusters expire after 48 hours and individual articles surface independently.

### 8.5 Breaking News Classification

An article is flagged as **breaking** if any of these apply:
- Published within the last 15 minutes AND cluster size ≥ 3 (rapid multi-outlet pickup).
- Claude Haiku classifies headline as breaking based on signal words (exclusion, crash, withdrawal, fired, signed, disqualified, penalty, arrest, death).
- Source is an official series account and post contains "BREAKING" or "OFFICIAL."

Breaking news triggers immediate SSE push to all connected clients. Desktop shows pinned banner. Mobile sends push notification (if user opted in for that series).

---

## 9. Story Card Design

### 9.1 Card Anatomy (both platforms)

```
┌──────────────────────────────────────────────────────────┐
│  [series badge]  [source name]  [source favicon]  [time] │
│                                                          │
│  [hero image — optional, scraped OG image]               │
│                                                          │
│  [headline — 2 lines max, semibold]                      │
│                                                          │
│  [AI summary — 3 lines, regular weight, muted color]     │
│                                                          │
│  [+ N other sources]              [Read full article →]  │
└──────────────────────────────────────────────────────────┘
```

### 9.2 Series Color Tokens

| Series | Accent Color | Badge |
|---|---|---|
| F1 | `#E10600` (F1 red) | 🔴 F1 |
| IMSA | `#00A651` (IMSA green) | 🟢 IMSA |
| WEC | `#0072CE` (WEC blue) | 🔵 WEC |
| NASCAR | `#FFB612` (NASCAR yellow) | 🏁 NASCAR |

### 9.3 Card Density (Desktop)

| Mode | Image | Summary | Height |
|---|---|---|---|
| Compact | No | 2 lines | ~90px |
| Standard | Optional | 3 lines | ~140px |
| Expanded | Yes | 3 lines + read count | ~220px |

Per-pane setting, defaults to Standard.

### 9.4 Social Post Cards

Twitter/X posts render differently from articles:

```
┌──────────────────────────────────────────────────────────┐
│  [series badge]  @handle  [verified ✓]  [X icon]  [time] │
│                                                          │
│  [full tweet text — no AI summary for social posts]      │
│                                                          │
│  [embedded image if present]                             │
│                                                          │
│  [View on X →]                                           │
└──────────────────────────────────────────────────────────┘
```

- No AI summary — tweet text is shown verbatim (it's already short).
- Account type badge: "Official Team," "Official Series," or "Journalist."

---

## 10. Live Race Mode

### 10.1 Data Sources for Live Data

Live race data is scraped from:
- **Official timing pages** (e.g., fiawec.com/live, imsa.com/live, f1.com/live).
- **Official series Twitter/X accounts** (lap-by-lap updates, incidents).
- **Curated journalist accounts** (race commentary).
- **RSS feeds** where available.

Scrape interval: **15 seconds** during active sessions. Detected active session = any series timing page returning live data OR scheduled session start time ± 1 hour.

### 10.2 Data Displayed

| Data Point | Source | Update Rate |
|---|---|---|
| Position leaderboard | Timing scrape | 15s |
| Gap to leader | Timing scrape | 15s |
| Laps / time remaining | Timing scrape | 15s |
| Current lap (if shown) | Timing scrape | 15s |
| Safety car / FCY | Timing scrape + Twitter | Immediate |
| Pit stops | Timing scrape | 15s |
| Retirements | Timing scrape + Twitter | 15s |
| Live social feed | Twitter/X scrape | 60s |
| Live articles | News scrape | 60s |

### 10.3 Live Mode Activation

- **Automatic:** When a known session start time ±30 minutes is reached, Live tab shows active indicator.
- **Desktop:** A "Live" pane type appears in the sidebar. Adding it shows the live ticker for the active series.
- **Mobile:** Live tab icon pulsates. Banner appears in Feed tab above filter chips.

### 10.4 Session Schedule

Paddock maintains a race calendar for all 4 v1 series populated manually at season start and scraped from official sites weekly. Each entry includes:
- Series, event name, circuit name
- Session type (Practice, Qualifying, Race, Sprint)
- Start and estimated end UTC time
- Time zone of circuit

---

## 11. Technical Architecture

### 11.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                    │
│  ┌──────────────────────┐     ┌──────────────────────────────────────┐  │
│  │  Desktop (Next.js)   │     │  Mobile (React Native / Expo)        │  │
│  │  Vercel CDN          │     │  iOS App Store / Google Play         │  │
│  └──────────┬───────────┘     └──────────────────┬───────────────────┘  │
└─────────────┼────────────────────────────────────┼─────────────────────┘
              │  HTTPS / SSE                        │  HTTPS / Push (APNs/FCM)
┌─────────────▼────────────────────────────────────▼─────────────────────┐
│                           API LAYER (Next.js Route Handlers)            │
│  /api/feed        — paginated article feed per series                   │
│  /api/live        — current live session data                           │
│  /api/search      — full-text search                                    │
│  /api/stream      — SSE endpoint for real-time updates                  │
│  /api/user/*      — preferences, saved articles, layout                 │
│  /api/notify      — push notification dispatch                          │
└───────────┬───────────────────┬────────────────────────────────────────┘
            │                   │
     ┌──────▼──────┐    ┌───────▼──────┐
     │ Neon        │    │ Upstash      │
     │ Postgres    │    │ Redis        │
     │             │    │              │
     │ articles    │    │ feed cache   │
     │ clusters    │    │ session data │
     │ users       │    │ SSE pub/sub  │
     │ calendars   │    │ rate limits  │
     └─────────────┘    └──────────────┘
            ▲
┌───────────┴────────────────────────────────────────────────────────────┐
│                       SCRAPER PIPELINE                                 │
│                                                                        │
│  Vercel Cron (every 60s) → Scraper Workers (Playwright + Cheerio)     │
│       → Vercel Queues → Processing Pipeline                           │
│            ├── Dedup (content hash)                                   │
│            ├── Series classification                                  │
│            ├── AI Summary (Claude Haiku via AI Gateway)               │
│            ├── Breaking news classification (Claude Haiku)            │
│            ├── Embedding + story clustering                           │
│            └── Write DB → Bust Redis cache → Publish SSE event        │
└────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Key Technology Choices

| Component | Choice | Reason |
|---|---|---|
| Web framework | Next.js 16 (App Router) | Vercel-native, SSR, streaming, route handlers |
| Mobile | React Native / Expo (SDK 52+) | Native push notifications, App Store distribution |
| Database | Neon Postgres | Serverless, branching, Vercel Marketplace |
| Cache | Upstash Redis | SSE pub/sub, feed caching, rate limiting |
| Queue | Vercel Queues | Durable scraper job processing |
| Auth | Clerk (Vercel Marketplace) | Social login, Expo support, auto-provisioned |
| AI | Claude Haiku via AI Gateway | Low cost per summary (~$0.001), fast |
| Embeddings | text-embedding-3-small via AI Gateway | Story clustering |
| Scraping | Playwright + Cheerio + Nitter | JS-heavy sites + static sites + Twitter/X |
| Push notifications | Expo Push API → APNs + FCM | Single API for iOS and Android |
| Hosting | Vercel | Co-located with Next.js, global CDN |
| Design system | shadcn/ui + Tailwind (desktop) | Dark mode, composable, accessible |
| Mobile UI | NativeWind + custom components | Tailwind syntax in React Native |

### 11.3 Database Schema (Abbreviated)

```sql
-- Core content
articles (id, url, url_hash, title, source_id, series[], published_at, scraped_at,
          summary, image_url, is_breaking, cluster_id, embedding vector(1536))

clusters (id, representative_article_id, series, article_count, created_at, expires_at)

social_posts (id, platform, author_handle, author_type, content, url, series[],
              published_at, scraped_at, is_breaking)

sources (id, name, domain, favicon_url, tier, series[])

-- Calendar
events (id, series, event_name, circuit, country, timezone)
sessions (id, event_id, type, starts_at, ends_at, status)

live_updates (id, session_id, type, content, timestamp)

-- Users
users (id, email, auth_provider, created_at)
user_preferences (user_id, series_order[], notification_prefs jsonb)
user_layouts (user_id, layout jsonb)  -- pane config for desktop
saved_articles (user_id, article_id, saved_at)
```

### 11.4 Real-time Architecture (SSE)

- Clients connect to `/api/stream?series=f1,imsa` on page load.
- Redis pub/sub channel per series (`feed:f1`, `feed:imsa`, etc.).
- When scraper writes a new article, it publishes to the relevant Redis channel.
- SSE handler broadcasts to all subscribed clients within 1–3 seconds.
- Mobile app polls `/api/feed` every 60 seconds (background) and uses Expo Push for breaking news (foreground and background).

---

## 12. Non-Functional Requirements

### 12.1 Performance

| Requirement | Target |
|---|---|
| Desktop initial page load (LCP) | < 1.5s on 4G |
| Mobile app cold start | < 2s |
| Feed API response time (P95) | < 200ms (Redis cache hit) |
| SSE new article delivery latency | < 5s from publish |
| Live session data staleness (P95) | < 20s |

### 12.2 Reliability

- API uptime: 99.9% monthly.
- Scraper failure tolerance: if a source fails, skip and retry next cycle; alert if failing for > 10 minutes.
- Nitter instance failover: maintain a list of 5+ known public instances; rotate on failure.
- Circuit breaker: if a domain returns 429 or 403 for > 5 consecutive requests, back off exponentially (max 30 min).

### 12.3 Scalability

- Feed API responses cached in Redis with 30-second TTL per series.
- SSE connections handled by Vercel Fluid Compute (concurrent request sharing).
- Scraper workers scale horizontally via Vercel Queue consumer groups.
- Neon connection pooling via PgBouncer.

### 12.4 Legal & Compliance

- **No paywalled content scraped:** If a source returns a paywall/login page, log and skip. Never cache or redistribute full article text.
- **AI summaries only:** Full article text is processed in-memory for summarization and immediately discarded. Only the summary is stored.
- **robots.txt respected by default:** Overridden only for sources where scraping is explicitly accepted in ToS or there is no restriction. Flag all sources requiring manual review before v1 launch.
- **Twitter/X:** Via Nitter, which aggregates public data. No private DMs or protected accounts accessed.
- **GDPR/CCPA:** User data (email, preferences) stored in EU Neon region. Privacy policy and cookie banner required before launch.
- **DMCA:** Copyright notice and takedown process in place before launch.

### 12.5 Accessibility

- Desktop: WCAG 2.1 AA. Keyboard navigable. Screen reader labels on all interactive elements.
- Mobile: iOS VoiceOver and Android TalkBack support. Minimum 44pt touch targets.

---

## 13. Out of Scope (v1)

- WRC, IndyCar, MotoGP, Formula E, F2, F3, DTM (v1.5 roadmap — see §15).
- User-generated content or community features (comments, forums).
- In-app article reader (open in-browser instead).
- Fantasy motorsports integration.
- Video content scraping.
- Multi-language support (English only at v1).
- Driver / team profile pages.
- Historical results database.
- Advertiser-facing features.
- Desktop native app (Electron).
- Apple Watch / WearOS companion.
- Live timing data beyond positions (tire compounds, sector times, telemetry).

---

## 14. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Source blocks scraper IP | High | Medium | Rotate user agents, residential proxy pool, respectful rate limits, per-domain delays |
| Nitter instances go offline | Medium | Medium | Maintain 5+ instance list, automatic failover, direct scraping fallback via Playwright |
| Twitter/X changes DOM structure | High | Low | Modular scraper adapters, automated DOM-change alerts, 24h SLA to fix |
| AI summarization quality drops | Low | Medium | Human review queue for low-confidence summaries, fallback to scraped lede |
| Race calendar data stale / wrong | Medium | Medium | Automated weekly sync from official sites + manual admin override UI |
| App Store rejection (iOS) | Low | High | Pre-submission review against App Store guidelines, especially around scraping disclosure |
| Legal takedown from a news source | Low | High | Immediate compliance protocol (remove source within 24h), no full-text storage |
| Live timing source structure changes | Medium | Medium | Same modular adapter pattern as news scrapers, monitoring alerts |

---

## 15. Roadmap

### v1.0 — Core (target: 12 weeks)
- Desktop multi-pane feed (F1, IMSA, WEC, NASCAR)
- Mobile app (Feed, Discover, Saved, You tabs)
- AI summaries + story clustering
- Optional sign-in + layout persistence
- Breaking news detection + push notifications

### v1.5 — Live & Expand (target: +8 weeks post v1.0)
- Live Race Mode (desktop + mobile)
- Add series: WRC, IndyCar, MotoGP
- Custom pane types: Source, Search, Trending

### v2.0 — Personalization (target: +12 weeks post v1.5)
- Formula E series
- Algorithmic "For You" feed surface
- Driver & team follow (filter by entity, not just series)
- Reading history and "catch-up" mode
- In-app article reader with Reader Mode
- Desktop PWA / Electron wrapper

### v3.0 — Community (future)
- Comments / reactions on stories (signed-in users)
- Weekly digest email
- Embedded live timing widget (per-series partnership integrations)
- API for third-party integrations

---

---

## Appendix A — Curated Sources & Accounts by Series

> This appendix defines the initial seed list for scrapers and curated social feeds at v1 launch. All accounts verified active as of March 2026.

---

### A.1 Formula 1

#### News Sources

| Source | URL | Tier | Notes |
|---|---|---|---|
| Formula1.com | formula1.com | 1 | Official. Press releases, race reports, standings |
| Motorsport.com | motorsport.com/f1 | 1 | Highest volume; international correspondent team |
| The Race | the-race.com | 1 | Independent; strong analysis and breaking news |
| Autosport | autosport.com/f1 | 1 | Veteran outlet; in-depth technical coverage |
| RaceFans | racefans.net | 1 | Independent; known for verbatim stewards decisions |
| Sky Sports F1 | skysports.com/f1 | 1 | UK broadcast partner; paddock reporting |
| PlanetF1 | planetf1.com | 2 | High volume; broad news aggregation |
| GPFans | gpfans.com | 2 | Breaking headlines; strong social reach |
| Crash.net | crash.net/f1 | 2 | Solid F1 coverage; also covers WEC |
| RacingNews365 | racingnews365.com | 2 | Results, standings, analysis |
| BBC Sport F1 | bbc.com/sport/formula1 | 2 | High-authority; Andrew Benson reporting |
| ESPN F1 | espn.com/f1 | 2 | US broadcast partner |
| GPToday | gptoday.com | 2 | 24/7 news cycle; fast on breaking |
| Motorsport Week | motorsportweek.com | 2 | Race weekend coverage and features |

#### Official X Accounts
- `@F1` — Official Formula 1
- `@fia` — FIA (stewards decisions, official announcements)
- `@SkySportsF1` — Sky Sports F1

#### Team X Accounts
| Team | Handle |
|---|---|
| Red Bull Racing | `@redbullracing` |
| Scuderia Ferrari | `@ScuderiaFerrari` |
| Mercedes-AMG F1 | `@MercedesAMGF1` |
| McLaren F1 | `@McLarenF1` |
| Aston Martin F1 | `@AstonMartinF1` |
| Alpine F1 | `@AlpineF1Team` |
| Williams Racing | `@WilliamsF1` |
| Haas F1 | `@HaasF1Team` |
| Visa Cash App RB | `@visacashapprb` |
| Stake F1 / Sauber | `@stakef1team_ks` |
| Cadillac F1 (2026) | `@Cadillac_F1` |

#### Journalist X Accounts
| Name | Handle | Affiliation |
|---|---|---|
| Andrew Benson | `@andrewbensonf1` | BBC Sport F1 Correspondent |
| Ted Kravitz | `@tedkravitz` | Sky Sports F1 Pit Lane |
| David Croft | `@CroftyF1` | Sky Sports F1 Lead Commentator |
| Martin Brundle | `@MBrundleF1` | Sky Sports F1 Analyst / Grid Walk |
| Chris Medland | `@ChrisMedlandF1` | Freelance / RACER |
| Tom Clarkson | `@TomClarksonF1` | F1 Nation / Beyond The Grid host |
| The Race | `@TheRaceMedia` | The Race official account |
| Autosport | `@autosport` | Autosport official account |
| RaceFans | `@racefansdotnet` | RaceFans official account |
| GPFans | `@gpfans_com` | GPFans official account |

#### Top Driver X Accounts (top 6)
`@Max33Verstappen`, `@LewisHamilton`, `@Charles_Leclerc`, `@LandoNorris`, `@CarlosSainz55`, `@GeorgeRussell63`

---

### A.2 IMSA WeatherTech SportsCar Championship

#### News Sources

| Source | URL | Tier | Notes |
|---|---|---|---|
| IMSA.com | imsa.com | 1 | Official. Results, standings, press releases |
| Sportscar365 | sportscar365.com | 1 | Most comprehensive independent IMSA voice |
| Radio Le Mans | radiolemans.co | 1 | Authoritative; written articles + live audio |
| Motorsport.com | motorsport.com/imsa | 1 | International correspondent team |
| RACER | racer.com | 1 | Premier US racing publication |
| The Race (Endurance) | the-race.com/endurance | 1 | Independent endurance coverage |
| DailySportsCar | dailysportscar.com | 2 | Daily endurance racing news |
| Only Endurance | onlyendurance.com | 2 | IMSA/WEC specialist; fast-growing |
| Autosport | autosport.com/imsa | 2 | International coverage |
| Motorsport Week | motorsportweek.com | 2 | Race weekend articles and analysis |

#### Official X Accounts
- `@IMSA` — Official IMSA
- `@IMSARadio` — IMSA Radio (live updates, commentary)
- `@Rolex24Hours` — Rolex 24 at Daytona (flagship event)

#### Team / Manufacturer X Accounts
| Team | Handle | Class |
|---|---|---|
| Porsche Penske Motorsport | `@PorscheRaces` | GTP |
| Acura / Meyer Shank Racing | `@meyershankrac` | GTP |
| Cadillac Racing | `@CadillacVSeries` | GTP |
| Corvette Racing | `@CorvetteRacing` | GTD Pro |
| BMW M Motorsport | `@BMWMotorsport` | GTP |
| Wayne Taylor Racing | `@WayneT_Racing` | GTP |

#### Journalist X Accounts
| Name | Handle | Affiliation |
|---|---|---|
| John Dagys | `@johndagys` | Founder / Editor, Sportscar365 |
| Jeremy Shaw | `@JeremyShawRacer` | IMSA Radio / Radio Le Mans |
| Graham Goodwin | `@dsceditor` | Editor, DailySportsCar |
| Radio Le Mans | `@radiolemans` | Radio Le Mans official |
| RACER | `@RacerDotCom` | RACER official account |
| Only Endurance | `@onlyendurance` | Only Endurance official |

#### Top Driver X Accounts (top 6)
`@TomasBirgi`, `@FelipeNasr`, `@NickTandy`, `@coltonherta`, `@mattrjones`, `@AJAllmendinger`

---

### A.3 FIA World Endurance Championship (WEC / FIAWEC)

#### News Sources

| Source | URL | Tier | Notes |
|---|---|---|---|
| FIAWEC.com | fiawec.com | 1 | Official. Championship news, entry lists, standings |
| 24h-lemans.com | 24h-lemans.com | 1 | Official Le Mans site; marquee event coverage |
| Radio Le Mans | radiolemans.co | 1 | Most authoritative English WEC voice |
| Sportscar365 | sportscar365.com | 1 | Leading independent WEC outlet |
| Motorsport.com | motorsport.com/wec | 1 | International correspondents |
| The Race (Endurance) | the-race.com/endurance | 1 | Strong WEC analysis |
| DailySportsCar | dailysportscar.com | 2 | WEC and Le Mans 24 Hours focus |
| Only Endurance | onlyendurance.com | 2 | WEC/IMSA specialist |
| Autosport | autosport.com/wec | 2 | Gary Watkins WEC coverage |
| Crash.net | crash.net/wec | 2 | WEC and GT racing |
| Motorsport Week | motorsportweek.com | 2 | Race weekend features |

#### Official X Accounts
- `@FIAWEC` — Official FIA WEC
- `@24hoursoflemans` — Official Le Mans 24 Hours (English)
- `@ACO_Racing` — Automobile Club de l'Ouest (Le Mans organizer)

#### Manufacturer / Team X Accounts
| Team | Handle | Class |
|---|---|---|
| Toyota Gazoo Racing | `@TGR_WEC` | Hypercar |
| Ferrari AF Corse | `@AFCorse` | Hypercar |
| Porsche Penske Motorsport | `@PorscheRaces` | Hypercar |
| Alpine Racing | `@AlpineRacing` | Hypercar |
| Peugeot Sport | `@peugeotsport` | Hypercar |
| BMW M Motorsport | `@BMWMotorsport` | Hypercar (2026) |
| Aston Martin Racing | `@AMR_Official` | Hypercar / LMGT3 |
| Genesis Magma Racing | `@MagmaRacing` | Hypercar (2026 debut) |
| Corvette Racing | `@CorvetteRacing` | LMGT3 |

#### Journalist X Accounts
| Name | Handle | Affiliation |
|---|---|---|
| John Dagys | `@johndagys` | Sportscar365 (covers both WEC + IMSA) |
| Jeremy Shaw | `@JeremyShawRacer` | Radio Le Mans (covers both) |
| Graham Goodwin | `@dsceditor` | DailySportsCar (covers both) |
| Radio Le Mans | `@radiolemans` | Radio Le Mans official |
| Gary Watkins | `@GaryWatkins_AR` | Autosport WEC Editor |
| Only Endurance | `@onlyendurance` | Only Endurance official |

#### Top Driver X Accounts (top 6)
`@NickTandy`, `@KamiuiKobayashi`, `@antoniofuoco_`, `@Brendon_Hartley`, `@JoseLopezRacing`, `@mikenewman96`

---

### A.4 NASCAR Cup Series

#### News Sources

| Source | URL | Tier | Notes |
|---|---|---|---|
| NASCAR.com | nascar.com | 1 | Official. Results, standings, schedules, news |
| Motorsport.com | motorsport.com/nascar-cup | 1 | International correspondents |
| The Race (NASCAR) | the-race.com | 1 | Independent coverage |
| Fox Sports NASCAR | foxsports.com/nascar | 1 | Broadcast partner; Bob Pockrass reporting |
| ESPN NASCAR | espn.com/racing/nascar | 1 | US broadcast partner |
| Jayski | jayski.com | 1 | Veteran aggregator; paint schemes, team news |
| Racer | racer.com | 2 | Broad US racing coverage |
| Frontstretch | frontstretch.com | 2 | Independent; strong fan community |
| Motorsport Week | motorsportweek.com | 2 | Race weekend articles |
| Beyond the Flag | beyondtheflag.com | 2 | FanSided NASCAR outlet |
| NBC Sports NASCAR | nbcsports.com/nascar | 2 | Broadcast partner coverage |

#### Official X Accounts
- `@NASCAR` — Official NASCAR
- `@NASCAR_Xfinity` — NASCAR Xfinity Series
- `@NASCARonFOX` — FOX Sports NASCAR
- `@NASCARonNBC` — NBC Sports NASCAR

#### Team X Accounts
| Team | Handle |
|---|---|
| Hendrick Motorsports | `@TeamHendrick` |
| Joe Gibbs Racing | `@JoeGibbsRacing` |
| Team Penske | `@Team_Penske` |
| Trackhouse Racing | `@TeamTrackhouse` |
| 23XI Racing | `@23XIRacing` |
| Richard Childress Racing | `@RCRracing` |
| Kaulig Racing | `@KauligRacing` |
| Front Row Motorsports | `@FRMRacing` |

#### Journalist X Accounts
| Name | Handle | Affiliation |
|---|---|---|
| Bob Pockrass | `@bobpockrass` | Fox Sports NASCAR Reporter |
| Jeff Gluck | `@jeff_gluck` | The Athletic NASCAR |
| Jayski | `@jayski` | Jayski / NASCAR.com |
| NASCAR on FOX | `@NASCARONFOX` | FOX broadcast account |
| Frontstretch | `@frontstretch` | Frontstretch.com |

#### Top Driver X Accounts (top 8)
`@KyleLarsonRacr`, `@dennyhamlin`, `@ChaseElliott`, `@TylerReddick`, `@BubbaWallace`, `@ryanblaneyracing`, `@williambryon`, `@DaleJr`

---

### A.5 Cross-Series Accounts (shown across all panes)

These accounts cover multiple series and appear in any relevant series feed:

| Account | Handle | Coverage |
|---|---|---|
| Motorsport.com | `@Motorsport` | All series |
| The Race | `@TheRaceMedia` | F1, IMSA, WEC, NASCAR |
| Motorsport Week | `@MotorsportWeek` | All series |
| Autosport | `@autosport` | F1, WEC, IMSA |
| RACER | `@RacerDotCom` | IMSA, NASCAR, IndyCar |
| Sportscar365 / John Dagys | `@johndagys` | IMSA, WEC |
| Radio Le Mans | `@radiolemans` | IMSA, WEC |

---

*Document owner: Product*
*Last updated: 2026-03-28*
