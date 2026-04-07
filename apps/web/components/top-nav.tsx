"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useUIStore } from "@/lib/store";

const NAV_TABS = [
  { label: "LIVE_FEED",  href: "/"         },
  { label: "SAVED",      href: "/saved"    },
  { label: "SEARCH",     href: "/search"   },
  { label: "ARCHIVE",    href: "/archive"  },
  { label: "ANALYSIS",   href: "/analysis" },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { openSearch } = useUIStore();
  const [searchVal, setSearchVal] = useState("");

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal("");
    } else {
      router.push("/search");
    }
  }

  function handleSearchFocus() {
    // On the dashboard, Cmd+K modal is preferred; on other pages go direct
    if (pathname === "/") {
      openSearch();
    }
  }

  return (
    <header
      className="h-14 shrink-0 flex items-center gap-4 px-4 sticky top-0 z-40"
      style={{
        backgroundColor: "color-mix(in srgb, var(--color-surface-dim) 90%, transparent)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid color-mix(in srgb, #5e3f3a 15%, transparent)",
      }}
    >
      {/* Brand */}
      <Link
        href="/"
        className="text-[#e10600] text-xl font-black italic tracking-tighter leading-none shrink-0 select-none"
        style={{ fontFamily: "var(--font-headline)" }}
      >
        PADDOCK
      </Link>

      {/* Nav tabs */}
      <nav className="flex items-center gap-1 flex-1">
        {NAV_TABS.map(({ label, href }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={[
                "px-3 h-14 flex items-center text-[11px] font-bold tracking-widest transition-all relative",
                active
                  ? "text-[--color-primary]"
                  : "text-[--color-on-surface-variant] opacity-70 hover:opacity-100 hover:text-[--color-on-surface]",
              ].join(" ")}
              style={{ fontFamily: "var(--font-headline)" }}
            >
              {label}
              {/* Active underline */}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[--color-primary-container]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Search input */}
      <form onSubmit={handleSearchSubmit} className="shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-[0.125rem] bg-[--color-surface-container-lowest] w-48 hover:bg-[--color-surface-container-low] transition-colors">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-[--color-on-surface-variant] shrink-0">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onFocus={handleSearchFocus}
            placeholder="Telemetry Search..."
            className="flex-1 bg-transparent text-[11px] text-[--color-on-surface] placeholder:text-[--color-on-surface-variant] outline-none w-full"
            style={{ fontFamily: "var(--font-body)" }}
          />
        </div>
      </form>

      {/* Right icons */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Notifications */}
        <button
          className="w-8 h-8 flex items-center justify-center rounded-[0.125rem] text-[--color-on-surface-variant] opacity-60 hover:opacity-100 hover:bg-[--color-surface-container-low] transition-all"
          title="Notifications"
        >
          <BellIcon />
        </button>

        {/* Breaking / bolt */}
        <button
          className="w-8 h-8 flex items-center justify-center rounded-[0.125rem] text-[--color-on-surface-variant] opacity-60 hover:opacity-100 hover:bg-[--color-surface-container-low] transition-all"
          title="Breaking news"
        >
          <BoltIcon />
        </button>

        {/* Profile link */}
        <Link
          href="/profile"
          className="w-8 h-8 flex items-center justify-center rounded-[0.125rem] text-[--color-on-surface-variant] opacity-60 hover:opacity-100 hover:bg-[--color-surface-container-low] transition-all"
          title="Profile"
        >
          <PersonIcon />
        </Link>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 2a4 4 0 00-4 4v2l-1.5 2.5h11L12 8V6a4 4 0 00-4-4zM6.5 13a1.5 1.5 0 003 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path
        d="M9 2L4 9h4l-1 5 5-7H8l1-5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 13c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
