import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import type { FeedItem, ArticleSummary, SocialPost, SeriesId } from "@paddock/api-types";

const SERIES_COLOR: Record<SeriesId, string> = {
  f1: "#E10600",
  imsa: "#00A651",
  wec: "#0072CE",
  nascar: "#FFB612",
};

export function StoryCard({ item }: { item: FeedItem }) {
  if (item.type === "article") return <ArticleCard article={item.data} />;
  return <SocialCard post={item.data} />;
}

function ArticleCard({ article }: { article: ArticleSummary }) {
  const router = useRouter();
  const primarySeries = article.series[0] as SeriesId | undefined;
  const color = primarySeries ? SERIES_COLOR[primarySeries] : "#f5f5f5";

  function open() {
    router.push(`/article/${encodeURIComponent(article.url)}`);
  }

  return (
    <TouchableOpacity
      onPress={open}
      activeOpacity={0.7}
      className="px-4 py-3 border-b border-border"
    >
      {article.isBreaking && (
        <View className="flex-row items-center gap-1.5 mb-1.5">
          <View className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <Text className="text-red-400 text-[10px] font-bold uppercase tracking-widest">
            Breaking
          </Text>
        </View>
      )}

      <View className="flex-row gap-2.5">
        <View className="flex-1">
          {/* Series + source */}
          <View className="flex-row items-center gap-1.5 mb-1">
            {article.series.slice(0, 2).map((s) => (
              <Text
                key={s}
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: SERIES_COLOR[s as SeriesId] ?? color }}
              >
                {s.toUpperCase()}
              </Text>
            ))}
            <Text className="text-text-muted text-[10px]">· {article.source.name}</Text>
          </View>

          {/* Headline */}
          <Text className="text-text-primary text-[13px] font-medium leading-snug" numberOfLines={2}>
            {article.title}
          </Text>

          {/* Summary */}
          {article.summary && (
            <Text className="text-text-secondary text-[12px] mt-1 leading-relaxed" numberOfLines={2}>
              {article.summary}
            </Text>
          )}

          {/* Time */}
          <Text className="text-text-muted text-[11px] mt-1.5">
            {formatTime(article.publishedAt)}
          </Text>
        </View>

        {/* Thumbnail */}
        {article.imageUrl && (
          <Image
            source={{ uri: article.imageUrl }}
            className="w-16 h-16 rounded-lg"
            resizeMode="cover"
          />
        )}
      </View>

      {article.clusterCount && article.clusterCount > 1 && (
        <Text className="text-text-muted text-[10px] mt-1.5">
          +{article.clusterCount - 1} related {article.clusterCount - 1 === 1 ? "story" : "stories"}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function SocialCard({ post }: { post: SocialPost }) {
  const primarySeries = post.series[0] as SeriesId | undefined;
  const color = primarySeries ? SERIES_COLOR[primarySeries] : "#f5f5f5";

  return (
    <View className="px-4 py-3 border-b border-border">
      {post.isBreaking && (
        <View className="flex-row items-center gap-1.5 mb-1.5">
          <View className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <Text className="text-red-400 text-[10px] font-bold uppercase tracking-widest">
            Breaking
          </Text>
        </View>
      )}

      <View className="flex-row gap-2.5">
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <Text className="text-white text-xs font-bold">
            {post.authorDisplayName?.charAt(0).toUpperCase() ?? "?"}
          </Text>
        </View>

        <View className="flex-1">
          <View className="flex-row flex-wrap items-baseline gap-1">
            <Text className="text-text-primary text-[12px] font-semibold">
              {post.authorDisplayName}
            </Text>
            <Text className="text-text-muted text-[11px]">@{post.authorHandle}</Text>
            <Text className="text-text-muted text-[11px]">·</Text>
            <Text className="text-text-muted text-[11px]">{formatTime(post.publishedAt)}</Text>
          </View>

          <Text className="text-text-secondary text-[12px] mt-0.5 leading-relaxed" numberOfLines={4}>
            {post.content}
          </Text>

          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <Image
              source={{ uri: post.mediaUrls[0] }}
              className="w-full h-32 rounded-lg mt-2"
              resizeMode="cover"
            />
          )}
        </View>
      </View>
    </View>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
