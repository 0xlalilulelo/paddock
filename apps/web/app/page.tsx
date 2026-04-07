"use client";

import dynamic from "next/dynamic";
import { Sidebar } from "@/components/sidebar";
import { BreakingNewsBanner } from "@/components/breaking-news-banner";
import { SearchOverlay } from "@/components/search-overlay";
import { TopNav } from "@/components/top-nav";
import { QueryProvider } from "@/components/query-provider";
import { useKeyboardShortcuts } from "@/lib/use-keyboard-shortcuts";

// dnd-kit generates incrementing aria-describedby IDs that differ between
// server and client renders → hydration mismatch. Skip SSR entirely.
const PaneContainer = dynamic(
  () => import("@/components/pane-container").then((m) => m.PaneContainer),
  { ssr: false }
);

function Dashboard() {
  useKeyboardShortcuts();
  return (
    <div className="flex h-dvh overflow-hidden bg-[--color-surface-dim]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav />
        <BreakingNewsBanner />
        <PaneContainer />
      </div>
      <SearchOverlay />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <QueryProvider>
      <Dashboard />
    </QueryProvider>
  );
}
