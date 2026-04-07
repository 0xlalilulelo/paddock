import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";
import { StoryCard } from "@/components/story-card";
import type { FeedItem } from "@paddock/api-types";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://paddock.app";

export default function SavedScreen() {
  const { isSignedIn, getToken } = useAuth();

  const { data, isLoading } = useQuery<FeedItem[]>({
    queryKey: ["saved"],
    queryFn: async () => {
      const token = await getToken();
      return fetch(`${API_BASE}/api/user/saved`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json());
    },
    enabled: isSignedIn === true,
  });

  if (!isSignedIn) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-text-primary font-semibold text-base text-center">
          Sign in to save stories
        </Text>
        <Text className="text-text-muted text-sm mt-1 text-center">
          Your reading list will sync across devices
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#f5f5f5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={data ?? []}
        keyExtractor={(item, i) =>
          item.type === "article" ? item.data.id : `${item.data.id}-${i}`
        }
        renderItem={({ item }) => <StoryCard item={item} />}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-text-muted text-sm">No saved stories</Text>
          </View>
        }
        ListHeaderComponent={
          <Text className="text-text-primary text-xl font-bold px-4 pt-4 pb-2">
            Saved
          </Text>
        }
      />
    </View>
  );
}
