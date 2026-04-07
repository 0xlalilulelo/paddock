"use client";

import Link from "next/link";
import { QueryProvider } from "@/components/query-provider";
import { TopNav } from "@/components/top-nav";
import { Sidebar } from "@/components/sidebar";

function AnalysisPage() {
  return (
    <div className="flex h-dvh overflow-hidden bg-[--color-surface-dim]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-8">
            {/* Decorative grid lines */}
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <div className="grid grid-cols-8 gap-4 w-64 h-32">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div key={i} className="border border-[--color-primary] rounded-none" />
                  ))}
                </div>
              </div>
              <div className="relative">
                <p
                  className="text-[10px] font-bold tracking-widest text-[--color-tertiary] uppercase mb-2"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  PADDOCK / ANALYSIS_MODE
                </p>
                <h1
                  className="text-5xl font-black italic text-[--color-on-surface] leading-none"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  ANALYSIS_MODE
                </h1>
              </div>
            </div>

            <p className="text-sm text-[--color-on-surface-variant] leading-relaxed mb-8" style={{ fontFamily: "var(--font-body)" }}>
              Advanced telemetry analysis and technical data visualization — coming in a future release. Data pipelines, comparative lap charts, constructor performance matrices, and tyre degradation models are all in development.
            </p>

            <div className="flex items-center justify-center gap-3">
              <Link
                href="/"
                className="px-6 py-2 rounded-[0.125rem] text-[11px] font-black tracking-widest uppercase text-[--color-on-primary-container] bg-[--color-primary-container] hover:opacity-90 transition-opacity"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                RETURN_TO_LIVE_FEED
              </Link>
              <Link
                href="/series"
                className="px-6 py-2 rounded-[0.125rem] text-[11px] font-bold tracking-widest uppercase text-[--color-primary] border border-[--color-outline-variant]/30 hover:border-[--color-primary]/40 transition-colors"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                CHOOSE SERIES
              </Link>
            </div>

            {/* Status chip */}
            <div className="mt-8 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[--color-secondary-container]" />
              <span
                className="text-[9px] font-bold tracking-widest text-[--color-on-surface-variant] opacity-50 uppercase"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                ANALYSIS_OFFLINE · V2 ROADMAP
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalysisPageWrapper() {
  return (
    <QueryProvider>
      <AnalysisPage />
    </QueryProvider>
  );
}
