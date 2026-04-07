import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { FeedItem } from "@paddock/api-types";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://paddock.app";

export function BreakingBanner() {
  const [dismissed, setDismissed] = useState<string | null>(null);

  const { data } = useQuery<{ items: FeedItem[] }>({
    queryKey: ["breaking"],
    queryFn: () =>
      fetch(`${API_BASE}/api/feed?series=f1,imsa,wec,nascar&limit=5`).then((r) => r.json()),
    refetchInterval: 30_000,
    select: (d) => ({
      items: d.items.filter(
        (i) =>
          (i.type === "article" && i.data.isBreaking) ||
          (i.type === "social" && i.data.isBreaking)
      ),
    }),
  });

  const breaking = data?.items[0];
  if (!breaking) return null;

  const id = breaking.type === "article" ? breaking.data.id : breaking.data.id;
  if (id === dismissed) return null;

  const title =
    breaking.type === "article"
      ? breaking.data.title
      : breaking.data.content.slice(0, 100);

  return (
    <View className="flex-row items-center gap-2 px-4 py-2.5 bg-red-950 border-b border-red-900">
      <View className="w-1.5 h-1.5 rounded-full bg-red-400" />
      <Text className="text-red-400 text-[10px] font-bold uppercase tracking-widest shrink-0">
        Breaking
      </Text>
      <Text className="text-red-100 text-xs flex-1" numberOfLines={1}>
        {title}
      </Text>
      <TouchableOpacity onPress={() => setDismissed(id)}>
        <Text className="text-red-400 text-xs">✕</Text>
      </TouchableOpacity>
    </View>
  );
}
