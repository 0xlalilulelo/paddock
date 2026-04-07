import { View, Text, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { SeriesId } from "@paddock/api-types";

interface UpcomingSession {
  id: string;
  type: string;
  startsAt: string | null;
  eventName: string;
  circuitName: string;
  country: string;
  series: string;
}

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://paddock.app";
const { width } = Dimensions.get("window");
const CARD_SIZE = (width - 48) / 2;

const SERIES: { id: SeriesId; label: string; color: string; description: string }[] = [
  { id: "f1", label: "Formula 1", color: "#E10600", description: "World Championship" },
  { id: "imsa", label: "IMSA", color: "#00A651", description: "WeatherTech SportsCar" },
  { id: "wec", label: "WEC", color: "#0072CE", description: "FIA World Endurance" },
  { id: "nascar", label: "NASCAR", color: "#FFB612", description: "Cup Series" },
];

export default function DiscoverScreen() {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4">
      <Text className="text-text-primary text-xl font-bold mb-4">Series</Text>

      {/* 2×2 grid */}
      <View className="flex-row flex-wrap gap-3">
        {SERIES.map((s) => (
          <SeriesCard key={s.id} series={s} />
        ))}
      </View>
    </ScrollView>
  );
}

function SeriesCard({
  series,
}: {
  series: { id: SeriesId; label: string; color: string; description: string };
}) {
  const { data: nextSession } = useQuery<UpcomingSession | null>({
    queryKey: ["next-session", series.id],
    queryFn: () =>
      fetch(`${API_BASE}/api/sessions/upcoming?series=${series.id}&limit=1`)
        .then((r) => r.json())
        .then((data: UpcomingSession[]) => data[0] ?? null),
    staleTime: 60_000 * 30,
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={{ width: CARD_SIZE, height: CARD_SIZE }}
      className="rounded-xl overflow-hidden"
    >
      <View
        className="flex-1 p-4 justify-between"
        style={{ backgroundColor: series.color + "22", borderWidth: 1, borderColor: series.color + "44", borderRadius: 12 }}
      >
        <View>
          <View
            className="w-10 h-10 rounded-lg items-center justify-center mb-3"
            style={{ backgroundColor: series.color }}
          >
            <Text className="text-white font-black text-xs">
              {series.label.slice(0, 3).toUpperCase()}
            </Text>
          </View>
          <Text className="text-text-primary font-bold text-base leading-tight">
            {series.label}
          </Text>
          <Text className="text-text-muted text-xs mt-0.5">{series.description}</Text>
        </View>

        {nextSession ? (
          <View>
            <Text className="text-text-muted text-[10px] uppercase tracking-wider">
              Next
            </Text>
            <Text className="text-text-secondary text-xs mt-0.5 font-medium" numberOfLines={1}>
              {nextSession.eventName}
            </Text>
            <Text className="text-text-muted text-[10px] mt-0.5" numberOfLines={1}>
              {nextSession.circuitName}
            </Text>
            {nextSession.startsAt && (
              <Text className="text-text-muted text-[10px] mt-0.5">
                {new Date(nextSession.startsAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            )}
          </View>
        ) : (
          <Text className="text-text-muted text-[10px]">No upcoming session</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
