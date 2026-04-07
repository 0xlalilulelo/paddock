"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QueryProvider } from "@/components/query-provider";
import { TopNav } from "@/components/top-nav";
import { Sidebar } from "@/components/sidebar";

const SETTINGS_NAV = [
  { id: "notifications", label: "Notification Prefs", active: true },
  { id: "account",       label: "Account Profile",    active: false },
  { id: "security",      label: "Security & Access",  active: false },
  { id: "retention",     label: "Data Retention",     active: false },
  { id: "subscription",  label: "Subscription",       active: false },
] as const;

interface NotifPrefs {
  breakingNews: boolean;
  raceStart: boolean;
  sectorTimes: boolean;
  apiErrorLogs: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  breakingNews: true,
  raceStart: true,
  sectorTimes: false,
  apiErrorLogs: true,
};

function SettingsPage() {
  const { isSignedIn, getToken } = useAuth();
  const [activeNav, setActiveNav] = useState<string>("notifications");
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();

  const { data: prefs = DEFAULT_PREFS } = useQuery<NotifPrefs>({
    queryKey: ["user-prefs-notif"],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch("/api/user/preferences", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return (data.notificationPrefs?.global as NotifPrefs) ?? DEFAULT_PREFS;
    },
    enabled: !!isSignedIn,
  });

  const [localPrefs, setLocalPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    setLocalPrefs(prefs);
  }, [prefs]);

  const { mutate: savePrefs, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationPrefs: { global: localPrefs } }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-prefs-notif"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  function togglePref(key: keyof NotifPrefs) {
    setLocalPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-[--color-surface-dim]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav />

        <div className="flex flex-1 overflow-hidden">
          {/* ── Left: Settings nav (25%) ── */}
          <div className="w-[25%] shrink-0 flex flex-col bg-[--color-surface-container-low]">
            <div className="px-4 py-4">
              <p
                className="text-[10px] font-black tracking-widest text-[--color-on-surface] uppercase mb-4"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                SYSTEM_CONFIG
              </p>

              <div className="space-y-0.5">
                {SETTINGS_NAV.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    className={[
                      "w-full text-left px-3 py-2.5 rounded-[0.125rem] text-[11px] font-bold tracking-wide transition-all",
                      activeNav === item.id
                        ? "border-l-2 border-[--color-primary-container] bg-[--color-surface-container] text-[--color-on-surface]"
                        : "text-[--color-on-surface-variant] opacity-70 hover:opacity-100 hover:bg-[--color-surface-container]",
                    ].join(" ")}
                    style={{ fontFamily: "var(--font-headline)" }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subscription tier badge */}
            <div className="mt-auto px-4 py-4">
              <span
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[0.125rem] text-[9px] font-black tracking-widest uppercase bg-[--color-secondary-container] text-[--color-on-secondary-container]"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                ENGINEER_PRO_SUBSCRIPTION
              </span>
            </div>
          </div>

          {/* ── Center: Notification preferences (45%) ── */}
          <div className="flex-[45%] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <h1
                className="text-2xl font-black italic text-[--color-on-surface] mb-1"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                NOTIFICATION_PREFERENCES
              </h1>
              <p className="text-sm text-[--color-on-surface-variant] mb-6" style={{ fontFamily: "var(--font-body)" }}>
                Configure granular alert thresholds for live telemetry feeds and editorial updates.
              </p>

              {/* Race Events & Live Alerts */}
              <NotifGroup
                label="RACE EVENTS & LIVE ALERTS"
                dotColor="var(--color-primary)"
                items={[
                  {
                    key: "breakingNews",
                    label: "Breaking News",
                    description: "Immediate alerts on driver changes and technical data.",
                    enabled: localPrefs.breakingNews,
                    disabled: false,
                  },
                  {
                    key: "raceStart",
                    label: "Race Starts",
                    description: "5 minute and 1 minute warnings before formation laps.",
                    enabled: localPrefs.raceStart,
                    disabled: false,
                  },
                  {
                    key: "sectorTimes",
                    label: "Sector Times",
                    description: "Push notifications for purple sectors during qualifying sessions.",
                    enabled: localPrefs.sectorTimes,
                    disabled: true,
                  },
                ]}
                onToggle={(key) => togglePref(key as keyof NotifPrefs)}
              />

              {/* Technical Monitoring */}
              <NotifGroup
                label="TECHNICAL MONITORING"
                dotColor="var(--color-tertiary)"
                items={[
                  {
                    key: "apiErrorLogs",
                    label: "API Error Logs",
                    description: "Push alerts for telemetry data packet loss (>3%).",
                    enabled: localPrefs.apiErrorLogs,
                    disabled: false,
                  },
                ]}
                onToggle={(key) => togglePref(key as keyof NotifPrefs)}
              />
            </div>

            {/* Save button */}
            <div className="shrink-0 px-6 py-4 flex items-center gap-3 bg-[--color-surface-container-low]/50">
              <button
                onClick={() => savePrefs()}
                disabled={isSaving}
                className="px-6 py-2 rounded-[0.125rem] text-[11px] font-black tracking-widest uppercase text-[--color-on-primary-container] transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{
                  fontFamily: "var(--font-headline)",
                  background: "linear-gradient(90deg, var(--color-primary-container), var(--color-primary))",
                }}
              >
                {isSaving ? "SAVING…" : "SAVE_SYSTEM_CHANGES"}
              </button>
              <button
                onClick={() => setLocalPrefs(prefs)}
                className="px-4 py-2 rounded-[0.125rem] text-[11px] font-bold tracking-widest uppercase text-[--color-on-surface-variant] hover:text-[--color-on-surface] transition-colors"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                RESET
              </button>
              {saved && (
                <span
                  className="text-[11px] font-black tracking-widest uppercase text-[--color-tertiary]"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  SAVED
                </span>
              )}
            </div>
          </div>

          {/* ── Right: API + System health (30%) ── */}
          <div className="w-[30%] shrink-0 flex flex-col bg-[--color-surface-container-low] overflow-y-auto">
            <div className="px-4 py-6 space-y-6">
              {/* API Key */}
              <div>
                <p
                  className="text-[9px] font-black tracking-widest text-[--color-on-surface-variant] opacity-60 uppercase mb-3"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  TELEMETRY_API_ACCESS
                </p>
                <div className="p-3 rounded-[0.125rem] bg-[--color-surface-container]">
                  <p
                    className="text-[10px] font-bold text-[--color-on-surface-variant] opacity-50 uppercase tracking-widest mb-1"
                    style={{ fontFamily: "var(--font-headline)" }}
                  >
                    ACTIVE SINCE 01.04.2026
                  </p>
                  <p className="text-sm font-mono text-[--color-on-surface] mb-3">
                    AX-992-XXXX-PRO-01
                  </p>
                  <p className="text-[9px] text-[--color-on-surface-variant] opacity-60 mb-3" style={{ fontFamily: "var(--font-body)" }}>
                    Rate limit: 50,000 calls/hr
                  </p>
                  <button
                    className="w-full py-1.5 rounded-[0.125rem] text-[10px] font-bold tracking-widest uppercase text-[--color-primary] border border-[--color-outline-variant]/30 hover:border-[--color-primary]/30 transition-colors"
                    style={{ fontFamily: "var(--font-headline)" }}
                  >
                    REGENERATE KEY
                  </button>
                </div>
              </div>

              {/* System health */}
              <div>
                <p
                  className="text-[9px] font-black tracking-widest text-[--color-on-surface-variant] opacity-60 uppercase mb-3"
                  style={{ fontFamily: "var(--font-headline)" }}
                >
                  SYSTEM_HEALTH
                </p>
                <div className="space-y-2">
                  <HealthCard label="Data Stream 01"    status="99.8% UPTIME" statusColor="var(--color-tertiary)"            badge="OK. UPTIME"   badgeColor="secondary" />
                  <HealthCard label="Cloud Render Node" status="12MS LATENCY" statusColor="var(--color-secondary-container)"  badge="LATENCY LOW"  badgeColor="tertiary"  />
                  <HealthCard label="Legacy Archive"     status="OFFLINE"      statusColor="var(--color-on-surface-variant)"  badge="OFFLINE"      badgeColor="muted"     opacity />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface NotifItem {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  disabled: boolean;
}

function NotifGroup({
  label,
  dotColor,
  items,
  onToggle,
}: {
  label: string;
  dotColor: string;
  items: NotifItem[];
  onToggle: (key: string) => void;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
        <span
          className="text-[9px] font-black tracking-widest uppercase text-[--color-on-surface-variant] opacity-60"
          style={{ fontFamily: "var(--font-headline)" }}
        >
          {label}
        </span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.key}
            className={[
              "flex items-center gap-3 p-3 rounded-[0.125rem] bg-[--color-surface-container-highest]",
              item.disabled ? "opacity-40" : "",
            ].join(" ")}
          >
            <div className="flex-1 min-w-0">
              <p
                className="text-[12px] font-bold text-[--color-on-surface]"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                {item.label}
              </p>
              <p className="text-[10px] text-[--color-on-surface-variant] leading-relaxed mt-0.5" style={{ fontFamily: "var(--font-body)" }}>
                {item.description}
              </p>
            </div>

            {/* Toggle */}
            <button
              onClick={() => !item.disabled && onToggle(item.key)}
              disabled={item.disabled}
              className={[
                "w-10 h-5 rounded-full relative transition-all shrink-0",
                item.enabled ? "bg-[--color-primary-container]" : "bg-[--color-surface-container]",
                item.disabled ? "cursor-not-allowed" : "cursor-pointer",
              ].join(" ")}
              aria-checked={item.enabled}
              role="switch"
            >
              <span
                className={[
                  "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                  item.enabled ? "translate-x-5" : "translate-x-0.5",
                ].join(" ")}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function HealthCard({
  label,
  status,
  statusColor,
  badge,
  badgeColor,
  opacity,
}: {
  label: string;
  status: string;
  statusColor: string;
  badge: string;
  badgeColor: string;
  opacity?: boolean;
}) {
  const badgeStyle =
    badgeColor === "secondary"
      ? { backgroundColor: "var(--color-secondary-container)", color: "var(--color-on-secondary-container)" }
      : badgeColor === "tertiary"
      ? { backgroundColor: "rgba(76,214,255,0.15)", color: "var(--color-tertiary)" }
      : { backgroundColor: "var(--color-surface-container-highest)", color: "var(--color-on-surface-variant)" };

  return (
    <div className={`p-3 rounded-[0.125rem] bg-[--color-surface-container] ${opacity ? "opacity-40" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[--color-on-surface]" style={{ fontFamily: "var(--font-headline)" }}>
          {label}
        </span>
        <span
          className="text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-[0.125rem]"
          style={{ fontFamily: "var(--font-headline)", ...badgeStyle }}
        >
          {badge}
        </span>
      </div>
      <p className="text-[10px] font-mono mt-0.5" style={{ color: statusColor }}>
        {status}
      </p>
    </div>
  );
}

export default function SettingsPageWrapper() {
  return (
    <QueryProvider>
      <SettingsPage />
    </QueryProvider>
  );
}
