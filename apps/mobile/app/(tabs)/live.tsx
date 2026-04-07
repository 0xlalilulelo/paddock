import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { SeriesId, LiveData } from "@paddock/api-types";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://paddock.app";

const SERIES_TABS: { id: SeriesId; label: string; color: string }[] = [
  { id: "f1", label: "F1", color: "#E10600" },
  { id: "imsa", label: "IMSA", color: "#00A651" },
  { id: "wec", label: "WEC", color: "#0072CE" },
  { id: "nascar", label: "NASCAR", color: "#FFB612" },
];

export default function LiveScreen() {
  const { series: seriesParam } = useLocalSearchParams<{ series?: string }>();
  const validParam = SERIES_TABS.find((s) => s.id === seriesParam)?.id;
  const [activeSeries, setActiveSeries] = useState<SeriesId>(validParam ?? "f1");

  useEffect(() => {
    if (validParam) setActiveSeries(validParam);
  }, [validParam]);

  const { data, isLoading } = useQuery<LiveData>({
    queryKey: ["live", activeSeries],
    queryFn: () => fetch(`${API_BASE}/api/live?series=${activeSeries}`).then((r) => r.json()),
    refetchInterval: 15_000,
  });

  const seriesMeta = SERIES_TABS.find((s) => s.id === activeSeries)!;

  return (
    <View className="flex-1 bg-background">
      {/* Series selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-none border-b border-border"
        contentContainerClassName="px-4 py-2 gap-2"
      >
        {SERIES_TABS.map((s) => {
          const active = activeSeries === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              onPress={() => setActiveSeries(s.id)}
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: active ? s.color : "#1a1a1a",
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: active ? "#0a0a0a" : s.color }}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#f5f5f5" />
        </View>
      ) : !data?.session ? (
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="w-12 h-12 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: seriesMeta.color + "22" }}
          >
            <Text style={{ color: seriesMeta.color, fontSize: 20 }}>◎</Text>
          </View>
          <Text className="text-text-primary font-semibold text-base text-center">
            No live session
          </Text>
          <Text className="text-text-muted text-sm mt-1 text-center">
            Check back when a {seriesMeta.label} session is running
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1">
          {/* Session header */}
          <View
            className="mx-4 mt-4 p-4 rounded-xl"
            style={{ backgroundColor: seriesMeta.color + "22", borderWidth: 1, borderColor: seriesMeta.color + "44" }}
          >
            <View className="flex-row items-center gap-2">
              <View className="w-2 h-2 rounded-full" style={{ backgroundColor: seriesMeta.color }} />
              <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: seriesMeta.color }}>
                Live
              </Text>
            </View>
            <Text className="text-text-primary font-bold text-lg mt-1">
              {data.session.sessionType}
            </Text>
          </View>

          {/* Leaderboard */}
          {data.positions.length > 0 && (
            <View className="mt-4">
              <Text className="text-text-secondary text-xs font-semibold uppercase tracking-wider px-4 mb-2">
                Leaderboard
              </Text>
              {data.positions.map((pos) => (
                <View
                  key={pos.position}
                  className="flex-row items-center px-4 py-3 border-b border-border"
                >
                  <Text className="text-text-muted w-6 text-sm font-mono">
                    {pos.position}
                  </Text>
                  <Text className="text-text-primary font-semibold flex-1 ml-3">
                    {pos.driverName}
                  </Text>
                  <Text className="text-text-muted text-sm font-mono">
                    {pos.gap ?? "—"}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
