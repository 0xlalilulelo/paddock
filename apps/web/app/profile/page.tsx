"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QueryProvider } from "@/components/query-provider";
import { TopNav } from "@/components/top-nav";
import { Sidebar } from "@/components/sidebar";
import { useLayoutStore } from "@/lib/store";
import type { SeriesId } from "@paddock/api-types";

const SERIES_META: Record<SeriesId, { name: string; color: string; gradient: string }> = {
  f1:     { name: "FORMULA 1",  color: "#e10600", gradient: "from-[#e10600]/40 to-[#131313]" },
  imsa:   { name: "IMSA WSCC",  color: "#00a651", gradient: "from-[#00a651]/40 to-[#131313]" },
  wec:    { name: "FIA WEC",    color: "#0072ce", gradient: "from-[#0072ce]/40 to-[#131313]" },
  nascar: { name: "NASCAR CUP", color: "#ffb612", gradient: "from-[#ffb612]/40 to-[#131313]" },
};

const CERTIFICATES = ["AERODYNAMICS_L1", "ENGINEERING_V8", "STRATEGY_ELITE"];

interface NotifPrefs {
  breakingNews: boolean;
  sessionStart: boolean;
  telemetryOverlay: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  breakingNews: true,
  sessionStart: true,
  telemetryOverlay: false,
};

function ProfilePage() {
  const { user, isSignedIn } = useUser();
  const { panes } = useLayoutStore();
  const queryClient = useQueryClient();

  const { data: savedPrefs = DEFAULT_PREFS } = useQuery<NotifPrefs>({
    queryKey: ["profile-prefs"],
    queryFn: async () => {
      const res = await fetch("/api/user/preferences");
      const data = await res.json();
      return data.notificationPrefs ?? DEFAULT_PREFS;
    },
    enabled: !!isSignedIn,
  });

  const [prefs, setPrefs] = useState<NotifPrefs>(savedPrefs);

  const { mutate: savePrefs, isPending: isSaving } = useMutation({
    mutationFn: () =>
      fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationPrefs: prefs }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile-prefs"] }),
  });

  const followedSeries = (panes.map((p) => p.series) as SeriesId[]).filter(
    (s) => s in SERIES_META
  );

  if (!isSignedIn) {
    return (
      <div className="flex h-dvh overflow-hidden bg-[--color-surface-dim]">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopNav />
          <div className="flex-1 flex items-center justify-center">
            <p
              className="text-xl font-black italic text-[--color-on-surface-variant]"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              SIGN IN TO VIEW PROFILE
            </p>
          </div>
        </div>
      </div>
    );
  }

  const displayName = user?.username ?? user?.fullName ?? "PADDOCK_USER";
  const avatarUrl = user?.imageUrl;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-dvh overflow-hidden bg-[--color-surface-dim]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav />

        <div className="flex flex-1 overflow-hidden">
          {/* ── Left: Profile hero (4/12) ── */}
          <div className="flex-[4] flex flex-col overflow-y-auto bg-[--color-surface-container-low] p-5 gap-4">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-[--color-surface-container-highest] flex items-center justify-center ring-2 ring-[--color-primary-container]/30">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span
                    className="text-3xl font-black text-[--color-primary]"
                    style={{ fontFamily: "var(--font-headline)" }}
                  >
                    {initials}
                  </span>
                )}
              </div>

              <div className="text-center">
                <h1
                  className="text-lg font-black text-[--color-on-surface] tracking-wide"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  {displayName.toUpperCase()}
                </h1>
                <span
                  className="inline-block mt-1 px-2 py-0.5 rounded-[0.125rem] text-[9px] font-black tracking-widest uppercase bg-[--color-secondary-container] text-[--color-on-secondary-container]"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  S-TIER COMPETITOR
                </span>
              </div>
            </div>

            {/* Stats bento */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "TIME ON TRACK", value: "142.5h" },
                { label: "DATA CONSUMED", value: "1.2 GB"  },
                { label: "GLOBAL RANKING", value: "#412"   },
                { label: "SESSIONS",       value: "38"     },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-3 rounded-[0.125rem] bg-[--color-surface-container-highest]"
                >
                  <p
                    className="text-[8px] font-bold tracking-widest text-[--color-on-surface-variant] opacity-60 uppercase"
                    style={{ fontFamily: "var(--font-headline)" }}
                  >
                    {stat.label}
                  </p>
                  <p
                    className="text-lg font-black text-[--color-on-surface] font-mono mt-0.5"
                    style={{ fontFamily: "var(--font-headline)" }}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Certificates */}
            <div>
              <p
                className="text-[9px] font-bold tracking-widest text-[--color-on-surface-variant] opacity-60 uppercase mb-2"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                UNLOCKED CERTIFICATES
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CERTIFICATES.map((cert) => (
                  <span
                    key={cert}
                    className="px-2 py-0.5 rounded-[0.125rem] text-[9px] font-bold tracking-widest text-[--color-tertiary] bg-[--color-surface-container-highest]"
                    style={{ fontFamily: "var(--font-headline)" }}
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Center: Subscription & preferences (5/12) ── */}
          <div className="flex-[5] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <h2
                className="text-lg font-black italic text-[--color-on-surface] mb-4"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                Subscription & Telemetry Settings
              </h2>

              {/* Toggle prefs */}
              <div className="space-y-3 mb-6">
                {([
                  { key: "breakingNews",    label: "Breaking News Alerts",      description: "Instant push for race results and driver transfers." },
                  { key: "sessionStart",    label: "Session Start Warnings",     description: "15 minute countdown for all followed series."        },
                  { key: "telemetryOverlay",label: "Real-time Telemetry Overlay",description: "Default off. Set to car live-stream (WEC only).",   },
                ] as const).map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center gap-3 p-3 rounded-[0.125rem] bg-[--color-surface-container-highest]"
                  >
                    <div className="flex-1">
                      <p className="text-[12px] font-bold text-[--color-on-surface]" style={{ fontFamily: "var(--font-headline)" }}>
                        {item.label}
                      </p>
                      <p className="text-[10px] text-[--color-on-surface-variant] mt-0.5" style={{ fontFamily: "var(--font-body)" }}>
                        {item.description}
                      </p>
                    </div>
                    <button
                      onClick={() => setPrefs((p) => ({ ...p, [item.key]: !p[item.key] }))}
                      className={[
                        "w-10 h-5 rounded-full relative transition-all shrink-0",
                        prefs[item.key] ? "bg-[--color-primary-container]" : "bg-[--color-surface-container]",
                      ].join(" ")}
                      role="switch"
                      aria-checked={prefs[item.key]}
                    >
                      <span
                        className={[
                          "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                          prefs[item.key] ? "translate-x-5" : "translate-x-0.5",
                        ].join(" ")}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {/* Data architecture */}
              <h3
                className="text-sm font-black italic text-[--color-on-surface] mb-3"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                Data Architecture
              </h3>

              <div className="p-3 rounded-[0.125rem] bg-[--color-surface-container-highest] mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="text-[10px] font-bold text-[--color-tertiary]"
                      style={{ fontFamily: "var(--font-headline)" }}
                    >
                      TELML STORAGE STATUS
                    </span>
                  </span>
                  <span
                    className="text-[10px] font-bold text-[--color-secondary-container]"
                    style={{ fontFamily: "var(--font-headline)" }}
                  >
                    CLOUD SYNC ACTIVE
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[--color-surface-container] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[--color-primary-container]"
                    style={{ width: "75%" }}
                  />
                </div>
                <p className="text-[9px] text-[--color-on-surface-variant] opacity-60 mt-1 font-mono">
                  75% CAPACITY · PKD_CAPACITY
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="shrink-0 px-6 py-4 flex gap-3 bg-[--color-surface-container-low]/50">
              <button
                onClick={() => savePrefs()}
                disabled={isSaving}
                className="px-6 py-2 rounded-[0.125rem] text-[11px] font-black tracking-widest uppercase text-[--color-on-primary-container] transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{
                  fontFamily: "var(--font-headline)",
                  background: "linear-gradient(90deg, var(--color-primary-container), var(--color-primary))",
                }}
              >
                {isSaving ? "SAVING…" : "COMMIT_CHANGES"}
              </button>
              <button
                onClick={() => setPrefs(savedPrefs)}
                className="px-4 py-2 rounded-[0.125rem] text-[11px] font-bold tracking-widest uppercase text-[--color-on-surface-variant] hover:text-[--color-on-surface] transition-colors"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                RESET
              </button>
            </div>
          </div>

          {/* ── Right: Followed series (3/12) ── */}
          <div className="flex-[3] flex flex-col overflow-y-auto bg-[--color-surface-container-low]">
            <div className="px-4 py-4">
              <p
                className="text-[9px] font-black tracking-widest text-[--color-on-surface-variant] opacity-60 uppercase mb-3"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                FOLLOWED SERIES
              </p>

              <div className="space-y-2">
                {followedSeries.length === 0 ? (
                  <p className="text-[10px] text-[--color-on-surface-variant] opacity-40" style={{ fontFamily: "var(--font-body)" }}>
                    No series followed. Add a pane from the dashboard.
                  </p>
                ) : (
                  followedSeries.map((s) => {
                    const meta = SERIES_META[s];
                    return (
                      <div
                        key={s}
                        className={`relative h-16 rounded-[0.125rem] overflow-hidden bg-gradient-to-r ${meta.gradient} flex items-end p-2`}
                      >
                        <span
                          className="text-[11px] font-black text-white tracking-widest uppercase"
                          style={{ fontFamily: "var(--font-headline)" }}
                        >
                          {meta.name}
                        </span>
                      </div>
                    );
                  })
                )}

                {/* Expand grid button */}
                <button className="w-full h-10 rounded-[0.125rem] border border-dashed border-[--color-outline-variant]/30 flex items-center justify-center text-[10px] font-bold text-[--color-on-surface-variant] opacity-50 hover:opacity-100 transition-opacity">
                  <span style={{ fontFamily: "var(--font-headline)" }}>+ FOLLOW MORE</span>
                </button>
              </div>

              {/* Cache memory */}
              <div className="mt-6">
                <p
                  className="text-[9px] font-bold tracking-widest text-[--color-on-surface-variant] opacity-60 uppercase mb-2"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  CACHE MEMORY
                </p>
                <div className="space-y-1.5">
                  {[
                    { label: "REPLAY_SPA_2026",         sub: "Accessed 2h ago" },
                    { label: "TYRE_TELEMETRY_DATA",     sub: "Accessed 5h ago" },
                  ].map((entry) => (
                    <div key={entry.label} className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-[--color-on-surface-variant] truncate" style={{ fontFamily: "var(--font-headline)" }}>
                        {entry.label}
                      </span>
                      <span className="text-[8px] text-[--color-on-surface-variant] opacity-50 shrink-0 ml-2" style={{ fontFamily: "var(--font-body)" }}>
                        {entry.sub}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePageWrapper() {
  return (
    <QueryProvider>
      <ProfilePage />
    </QueryProvider>
  );
}
