"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignInButton, useAuth } from "@clerk/nextjs";
import { useLayoutStore, useUIStore } from "@/lib/store";
import type { SeriesId } from "@paddock/api-types";

const SERIES: { id: SeriesId; label: string; color: string; abbr: string }[] = [
  { id: "f1",     label: "Formula 1", color: "#e10600", abbr: "F1"     },
  { id: "imsa",   label: "IMSA",      color: "#00a651", abbr: "IMSA"   },
  { id: "wec",    label: "WEC",       color: "#0072ce", abbr: "WEC"    },
  { id: "nascar", label: "NASCAR",    color: "#ffb612", abbr: "NAS"    },
];

export function Sidebar() {
  const { isSignedIn } = useAuth();
  const { panes, addPane, removePane } = useLayoutStore();
  const { openSearch } = useUIStore();
  const pathname = usePathname();

  const activeSeries = new Set(panes.map((p) => p.series));

  return (
    <aside className="flex flex-col items-center gap-2 w-14 h-dvh bg-[--color-surface-dim] py-3 shrink-0">
      {/* Logo mark — "P" in racing red */}
      <Link href="/" className="w-8 h-8 flex items-center justify-center mb-2 shrink-0">
        <span
          className="text-[#e10600] text-xl font-black italic leading-none tracking-tighter select-none"
          style={{ fontFamily: "var(--font-headline)" }}
        >
          P
        </span>
      </Link>

      {/* Series rail — control which panes are open */}
      <div className="flex flex-col gap-1 flex-1">
        {SERIES.map((s) => {
          const active = activeSeries.has(s.id);
          return (
            <button
              key={s.id}
              title={active ? `Remove ${s.label} pane` : `Add ${s.label} pane`}
              onClick={() =>
                active ? removePane(`pane-${s.id}`) : addPane(s.id)
              }
              className={[
                "relative w-9 h-9 rounded-[0.125rem] overflow-hidden",
                "flex items-center justify-center transition-all duration-150",
                active
                  ? "bg-[--color-surface-container-highest]"
                  : "opacity-35 hover:opacity-70 hover:bg-[--color-surface-container-low]",
              ].join(" ")}
              style={{ color: active ? s.color : "var(--color-on-surface-variant)" }}
            >
              {/* 2px left accent bar — only when active, matches breaking-card treatment */}
              {active && (
                <span
                  className="absolute left-0 top-0 bottom-0 w-[2px]"
                  style={{ backgroundColor: s.color }}
                />
              )}
              <span
                className="text-[10px] font-black tracking-widest leading-none"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                {s.abbr}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom utility icons */}
      <div className="flex flex-col items-center gap-1.5 mt-auto">
        {/* Search */}
        <button
          title="Search (⌘K)"
          onClick={openSearch}
          className={iconCls(pathname === "/search")}
        >
          <SearchIcon />
        </button>

        {/* Settings */}
        <Link
          href="/settings"
          title="Settings"
          className={iconCls(pathname === "/settings")}
        >
          <SettingsIcon />
        </Link>

        {/* Auth / Profile */}
        <div className="mt-1">
          {isSignedIn ? (
            <UserButton appearance={{ baseTheme: undefined }} />
          ) : (
            <SignInButton mode="modal">
              <button title="Sign in" className={iconCls(false)}>
                <PersonIcon />
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </aside>
  );
}

function iconCls(active: boolean) {
  return [
    "w-9 h-9 rounded-[0.125rem] flex items-center justify-center transition-all",
    active
      ? "bg-[--color-surface-container-highest] text-[--color-primary]"
      : "text-[--color-on-surface-variant] opacity-60 hover:opacity-100 hover:bg-[--color-surface-container-low]",
  ].join(" ");
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M2.929 2.929l1.06 1.06M12.01 12.01l1.06 1.06M13.07 2.929l-1.06 1.06M3.99 12.01l-1.06 1.06"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 13c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
