"use client";

import Link from "next/link";
import { QueryProvider } from "@/components/query-provider";
import { TopNav } from "@/components/top-nav";
import { Sidebar } from "@/components/sidebar";

const SERIES = [
  {
    id: "f1",
    name: "FORMULA 1",
    color: "#e10600",
    description: "The pinnacle of motorsport. 24 races. 20 drivers. One world championship.",
    nextSession: "BAHRAIN GP — QUALIFYING",
    nextDate: "MAR 30, 2026 · 15:00 UTC",
    imageGradient: "from-[#e10600]/30 to-transparent",
    locked: false,
  },
  {
    id: "wec",
    name: "FIA WEC",
    color: "#0072ce",
    description: "Endurance racing across Le Mans, Spa, and the world's most demanding circuits.",
    nextSession: "6H SPA — RACE",
    nextDate: "APR 27, 2026 · 13:30 UTC",
    imageGradient: "from-[#0072ce]/30 to-transparent",
    locked: false,
  },
  {
    id: "nascar",
    name: "NASCAR CUP",
    color: "#ffb612",
    description: "500 miles. Stock car warfare. America's most-watched motorsport series.",
    nextSession: "TALLADEGA — RACE",
    nextDate: "APR 28, 2026 · 19:00 UTC",
    imageGradient: "from-[#ffb612]/30 to-transparent",
    locked: false,
  },
  {
    id: "imsa",
    name: "IMSA WSCC",
    color: "#00a651",
    description: "North American sportscar racing at its finest — from Daytona to Petit Le Mans.",
    nextSession: "ACURA GRAND PRIX — GTD PRO",
    nextDate: "MAY 04, 2026 · 14:05 UTC",
    imageGradient: "from-[#00a651]/30 to-transparent",
    locked: false,
  },
  {
    id: "indycar",
    name: "INDYCAR",
    color: "#c0c0c0",
    description: "Open-wheel racing on ovals, road courses, and street circuits across North America.",
    nextSession: "INDY 500 — PRACTICE",
    nextDate: "MAY 17, 2026 · 14:00 UTC",
    imageGradient: "from-white/10 to-transparent",
    locked: true,
  },
  {
    id: "motogp",
    name: "MOTOGP",
    color: "#c0c0c0",
    description: "Two-wheel racing at the absolute limit — 300km/h on the most iconic circuits.",
    nextSession: "COMING SOON",
    nextDate: "—",
    imageGradient: "from-white/10 to-transparent",
    locked: true,
  },
];

function SeriesPage() {
  return (
    <div className="flex h-dvh overflow-hidden bg-[--color-surface-dim]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto px-8 py-8">
          {/* Hero */}
          <div className="mb-10">
            <h1
              className="text-5xl font-black italic text-[--color-on-surface] leading-none mb-2"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              CHOOSE YOUR MISSION.
            </h1>
            <p className="text-sm text-[--color-on-surface-variant]" style={{ fontFamily: "var(--font-body)" }}>
              Select a series to add it to your feed. Multiple series can run simultaneously.
            </p>
          </div>

          {/* Series grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {SERIES.map((s) => (
              <SeriesCard key={s.id} series={s} />
            ))}

            {/* Request series card */}
            <div className="bg-[--color-surface-container] rounded-[0.125rem] border border-dashed border-[--color-outline-variant]/30 p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[--color-outline-variant]/60 transition-colors">
              <span className="text-2xl text-[--color-on-surface-variant] opacity-40">+</span>
              <span
                className="text-[11px] font-bold tracking-widest text-[--color-on-surface-variant] opacity-60 uppercase"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                REQUEST SERIES
              </span>
            </div>
          </div>

          {/* Status bar */}
          <div
            className="flex items-center gap-4 px-4 py-2 bg-[--color-surface-container-low] rounded-[0.125rem] text-[10px] font-bold tracking-widest text-[--color-on-surface-variant] uppercase"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[--color-tertiary] animate-pulse" />
              ALL_STREAMS_NOMINAL
            </span>
            <span className="opacity-50">·</span>
            <span className="opacity-60">4 ACTIVE SERIES</span>
            <span className="opacity-50">·</span>
            <span className="opacity-60">LATENCY &lt;12MS</span>
          </div>
        </main>
      </div>
    </div>
  );
}

function SeriesCard({ series }: { series: typeof SERIES[0] }) {
  return (
    <div
      className={[
        "relative bg-[--color-surface-container] rounded-[0.125rem] overflow-hidden",
        "flex flex-col p-5 gap-3 transition-all duration-200",
        series.locked
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:bg-[--color-surface-container-high]",
      ].join(" ")}
    >
      {/* Gradient accent top-right */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${series.imageGradient} pointer-events-none`}
      />

      {/* Series badge */}
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded-[0.125rem]"
          style={{
            fontFamily: "var(--font-headline)",
            backgroundColor: `${series.color}20`,
            color: series.color,
          }}
        >
          {series.name}
        </span>
        {series.locked && (
          <span
            className="text-[9px] font-bold tracking-widest text-[--color-on-surface-variant] opacity-50 uppercase"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            COMING SOON
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-[--color-on-surface-variant] leading-relaxed flex-1" style={{ fontFamily: "var(--font-body)" }}>
        {series.description}
      </p>

      {/* Next session */}
      <div className="flex flex-col gap-0.5">
        <span
          className="text-[9px] font-bold tracking-widest text-[--color-on-surface-variant] opacity-60 uppercase"
          style={{ fontFamily: "var(--font-headline)" }}
        >
          NEXT SESSION
        </span>
        <span
          className="text-[11px] font-bold text-[--color-on-surface]"
          style={{ fontFamily: "var(--font-headline)", color: series.locked ? undefined : series.color }}
        >
          {series.nextSession}
        </span>
        <span className="text-[10px] text-[--color-on-surface-variant] opacity-60" style={{ fontFamily: "var(--font-body)" }}>
          {series.nextDate}
        </span>
      </div>

      {/* CTA */}
      {!series.locked && (
        <Link
          href="/"
          className="flex items-center justify-center py-1.5 rounded-[0.125rem] text-[10px] font-black tracking-widest uppercase transition-all hover:opacity-90"
          style={{
            fontFamily: "var(--font-headline)",
            backgroundColor: series.color,
            color: "#fff",
          }}
        >
          FOLLOW SERIES
        </Link>
      )}
    </div>
  );
}

export default function SeriesPageWrapper() {
  return (
    <QueryProvider>
      <SeriesPage />
    </QueryProvider>
  );
}
