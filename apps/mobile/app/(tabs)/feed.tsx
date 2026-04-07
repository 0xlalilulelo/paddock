import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { StoryCard } from "@/components/story-card";
import { BreakingBanner } from "@/components/breaking-banner";
import type { FeedItem, FeedPage, SeriesId } from "@paddock/api-types";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://paddock.app";

const SERIES_FILTERS: { id: SeriesId | "all"; label: string; color: string }[] = [
  { id: "all", label: "All", color: "#f5f5f5" },
  { id: "f1", label: "F1", color: "#E10600" },
  { id: "imsa", label: "IMSA", color: "#00A651" },
  { id: "wec", label: "WEC", color: "#0072CE" },
  { id: "nascar", label: "NASCAR", color: "#FFB612" },
];

export default function FeedScreen() {
  const [activeFilter, setActiveFilter] = useState<SeriesId | "all">("all");

  const series = activeFilter === "all" ? "f1,imsa,wec,nascar" : activeFilter;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
    isLoading,
  } = useInfiniteQuery<FeedPage>({
    queryKey: ["feed-mobile", series],
    queryFn: ({ pageParam }) =>
      fetch(
        `${API_BASE}/api/feed?series=${series}&limit=30${pageParam ? `&cursor=${pageParam}` : ""}`
      ).then((r) => r.json()),
    getNextPageParam: (last) => last.nextCursor,
    initialPageParam: undefined,
  });

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  const keyExtractor = useCallback(
    (item: FeedItem, i: number) =>
      item.type === "article" ? item.data.id : `${item.data.id}-${i}`,
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => <StoryCard item={item} />,
    []
  );

  return (
    <View className="flex-1 bg-background">
      <BreakingBanner />

      {/* Series filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-none"
        contentContainerClassName="px-4 py-2 gap-2"
      >
        {SERIES_FILTERS.map((f) => {
          const active = activeFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => setActiveFilter(f.id)}
              activeOpacity={0.7}
              className="px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: active ? f.color : "transparent",
                borderWidth: 1.5,
                borderColor: f.color,
                opacity: active ? 1 : 0.6,
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: active ? "#0a0a0a" : f.color }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#f5f5f5" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#f5f5f5"
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator color="#525252" size="small" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-text-muted text-sm">No stories yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
