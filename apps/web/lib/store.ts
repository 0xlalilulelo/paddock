import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FeedItem, SeriesId } from "@paddock/api-types";

const MAX_FEED_ITEMS = 200;

// Feed store — ephemeral, not persisted
interface FeedState {
  feeds: Record<string, FeedItem[]>; // key: series id
  breakingItems: FeedItem[];
  prependItems: (series: SeriesId, items: FeedItem[]) => void;
  setBreaking: (items: FeedItem[]) => void;
  clearBreaking: () => void;
}

export const useFeedStore = create<FeedState>()((set) => ({
  feeds: {},
  breakingItems: [],
  prependItems: (series, items) =>
    set((state) => {
      const existing = state.feeds[series] ?? [];
      // Deduplicate by item ID — guards against React StrictMode double-firing
      // effects and against SSE items that duplicate the initial page fetch.
      const existingIds = new Set(existing.map((i) => i.data.id));
      const newItems = items.filter((i) => !existingIds.has(i.data.id));
      const merged = [...newItems, ...existing].slice(0, MAX_FEED_ITEMS);
      return { feeds: { ...state.feeds, [series]: merged } };
    }),
  setBreaking: (items) => set({ breakingItems: items }),
  clearBreaking: () => set({ breakingItems: [] }),
}));

// Local pane config — simpler than api-types PaneConfig, used for client-side layout only
export interface LocalPaneConfig {
  id: string;
  series: SeriesId;
  /** Width in pixels */
  width: number;
  sortOrder: number;
}

// Layout store — persisted to localStorage
export interface PaneState {
  panes: LocalPaneConfig[];
  addPane: (series: SeriesId) => void;
  removePane: (id: string) => void;
  reorderPanes: (panes: LocalPaneConfig[]) => void;
  updatePane: (id: string, patch: Partial<LocalPaneConfig>) => void;
}

const DEFAULT_PANES: LocalPaneConfig[] = [
  { id: "pane-f1", series: "f1", width: 320, sortOrder: 0 },
  { id: "pane-imsa", series: "imsa", width: 320, sortOrder: 1 },
];

export const useLayoutStore = create<PaneState>()(
  persist(
    (set) => ({
      panes: DEFAULT_PANES,
      addPane: (series) =>
        set((state) => {
          if (state.panes.some((p) => p.series === series)) return state;
          const newPane: LocalPaneConfig = {
            id: `pane-${series}-${Date.now()}`,
            series,
            width: 320,
            sortOrder: state.panes.length,
          };
          return { panes: [...state.panes, newPane] };
        }),
      removePane: (id) =>
        set((state) => ({
          panes: state.panes
            .filter((p) => p.id !== id)
            .map((p, i) => ({ ...p, sortOrder: i })),
        })),
      reorderPanes: (panes) => set({ panes }),
      updatePane: (id, patch) =>
        set((state) => ({
          panes: state.panes.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
    }),
    { name: "paddock-layout" }
  )
);

// UI store — ephemeral
interface UIState {
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  searchOpen: false,
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),
}));
