"use client";

import Link from "next/link";
import { QueryProvider } from "@/components/query-provider";
import { TopNav } from "@/components/top-nav";
import { Sidebar } from "@/components/sidebar";

const DIRECTORY = [
  { id: "f1",   label: "FORMULA_1",  size: "24.1 GB" },
  { id: "wec",  label: "WEC_PRO",    size: "12.2 GB" },
  { id: "imsa", label: "IMSA_GTP",   size: "11.6 GB" },
];

const TABLE_HEADERS = ["TYPE", "RESOURCE_NAME", "VERSION", "HASH_CRC", "SIZE"];

function ArchivePage() {
  return (
    <div className="flex h-dvh overflow-hidden bg-[--color-surface-dim]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav />

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Directory tree */}
          <div className="w-[18%] shrink-0 bg-[--color-surface-container-low] overflow-y-auto px-4 py-4">
            <p
              className="text-[9px] font-black tracking-widest text-[--color-on-surface-variant] opacity-60 uppercase mb-3"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              DIRECTORY_ROOT
            </p>
            <div className="space-y-1.5">
              {DIRECTORY.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between px-2 py-1.5 rounded-[0.125rem] bg-[--color-surface-container]"
                >
                  <span
                    className="text-[10px] font-bold text-[--color-on-surface]"
                    style={{ fontFamily: "var(--font-headline)" }}
                  >
                    {d.label}
                  </span>
                  <span className="text-[9px] text-[--color-on-surface-variant] opacity-50 font-mono">{d.size}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Center: File table */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-3 shrink-0 bg-[--color-surface-container-low]">
              <p
                className="text-[10px] font-black tracking-widest text-[--color-on-surface] uppercase"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                FORMULA_1 / 2026 / ARCHIVE
              </p>
            </div>

            {/* Table headers */}
            <div className="flex items-center px-5 py-2 bg-[--color-surface-container-lowest] shrink-0">
              {TABLE_HEADERS.map((h) => (
                <div
                  key={h}
                  className="flex-1 text-[9px] font-black tracking-widest text-[--color-on-surface-variant] opacity-50 uppercase"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Coming soon state */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="text-center">
                <p
                  className="text-2xl font-black italic text-[--color-on-surface] mb-2"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  ARCHIVE_COMING_SOON
                </p>
                <p className="text-sm text-[--color-on-surface-variant] mb-6" style={{ fontFamily: "var(--font-body)" }}>
                  Telemetry file management and historical data archive is planned for V2.
                </p>
                <Link
                  href="/"
                  className="px-6 py-2 rounded-[0.125rem] text-[11px] font-black tracking-widest uppercase text-[--color-on-primary-container] bg-[--color-primary-container] hover:opacity-90 transition-opacity"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  RETURN_TO_LIVE_FEED
                </Link>
              </div>
            </div>

            {/* Status bar */}
            <div
              className="shrink-0 flex items-center gap-3 px-5 py-2 bg-[--color-surface-container-lowest] text-[9px] font-bold tracking-widest uppercase text-[--color-on-surface-variant] opacity-50"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              <span>ARCHIVE_OFFLINE</span>
              <span>·</span>
              <span>COMING IN V2</span>
            </div>
          </div>

          {/* Right: Preview placeholder */}
          <div className="w-[30%] shrink-0 bg-[--color-surface-container-low] flex flex-col items-center justify-center gap-3 border-l border-[--color-outline-variant]/10">
            <p
              className="text-[10px] font-bold tracking-widest text-[--color-on-surface-variant] opacity-30 uppercase"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              PREVIEW_NOT_AVAILABLE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ArchivePageWrapper() {
  return (
    <QueryProvider>
      <ArchivePage />
    </QueryProvider>
  );
}
