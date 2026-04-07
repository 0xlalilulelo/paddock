"use client";

import { useEffect } from "react";
import { useUIStore, useLayoutStore } from "./store";
import type { SeriesId } from "@paddock/api-types";

const SERIES_KEYS: Record<string, SeriesId> = {
  "1": "f1",
  "2": "imsa",
  "3": "wec",
  "4": "nascar",
};

export function useKeyboardShortcuts() {
  const { openSearch, toggleSearch } = useUIStore();
  const { addPane, removePane, panes } = useLayoutStore();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isEditing = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable;

      // ⌘K / Ctrl+K — search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleSearch();
        return;
      }

      if (isEditing) return;

      // / — focus search
      if (e.key === "/") {
        e.preventDefault();
        openSearch();
        return;
      }

      // ⌘1–4 / Ctrl+1–4 — toggle series pane
      if ((e.metaKey || e.ctrlKey) && SERIES_KEYS[e.key]) {
        e.preventDefault();
        const series = SERIES_KEYS[e.key];
        const existing = panes.find((p) => p.series === series);
        if (existing) {
          removePane(existing.id);
        } else {
          addPane(series);
        }
        return;
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openSearch, toggleSearch, addPane, removePane, panes]);
}
