import { View, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // `id` is the encoded article URL
  const url = id ? decodeURIComponent(id) : null;

  if (!url) return null;

  return (
    <View className="flex-1 bg-background">
      <WebView
        source={{ uri: url }}
        startInLoadingState
        renderLoading={() => (
          <View className="absolute inset-0 items-center justify-center bg-background">
            <ActivityIndicator color="#f5f5f5" />
          </View>
        )}
        style={{ backgroundColor: "#0a0a0a" }}
      />
    </View>
  );
}
