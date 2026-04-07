import { useState } from "react";
import { View, Text, ScrollView, Switch, TouchableOpacity, Alert } from "react-native";
import { useAuth, useUser, SignedIn, SignedOut, useClerk } from "@clerk/expo";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SeriesId, UserPreferences } from "@paddock/api-types";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://paddock.app";

const SERIES: { id: SeriesId; label: string; color: string }[] = [
  { id: "f1", label: "Formula 1", color: "#E10600" },
  { id: "imsa", label: "IMSA", color: "#00A651" },
  { id: "wec", label: "WEC", color: "#0072CE" },
  { id: "nascar", label: "NASCAR", color: "#FFB612" },
];

export default function YouScreen() {
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const { redirectToSignIn } = useClerk();
  const queryClient = useQueryClient();

  const { data: prefs } = useQuery<UserPreferences>({
    queryKey: ["prefs"],
    queryFn: async () => {
      const token = await getToken();
      return fetch(`${API_BASE}/api/user/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json());
    },
  });

  const prefsMutation = useMutation({
    mutationFn: async (patch: Partial<UserPreferences>) => {
      const token = await getToken();
      return fetch(`${API_BASE}/api/user/preferences`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      }).then((r) => r.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prefs"] }),
  });

  const pushEnabled = !!prefs?.pushToken;

  async function ensurePushToken(): Promise<string | null> {
    if (prefs?.pushToken) return prefs.pushToken;
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Notifications disabled", "Enable them in Settings.");
      return null;
    }
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    prefsMutation.mutate({ pushToken: token });
    return token;
  }

  async function toggleSeriesRaceStart(seriesId: SeriesId, enabled: boolean) {
    const hasToken = await ensurePushToken();
    if (!hasToken && enabled) return;
    const current = prefs?.notificationPrefs ?? {};
    prefsMutation.mutate({
      notificationPrefs: {
        ...current,
        [seriesId]: {
          ...(current[seriesId] ?? { breakingNews: false, qualifyingResults: false, raceResults: false }),
          raceStart: enabled,
        },
      },
    });
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="pb-10">
      <Text className="text-text-primary text-xl font-bold px-4 pt-4 pb-3">You</Text>

      <SignedIn>
        {/* Profile */}
        <View className="mx-4 mb-4 p-4 bg-surface rounded-xl border border-border">
          <Text className="text-text-primary font-semibold">
            {user?.primaryEmailAddress?.emailAddress ?? "Signed in"}
          </Text>
          <TouchableOpacity
            onPress={() => signOut()}
            className="mt-3"
          >
            <Text className="text-red-400 text-sm">Sign out</Text>
          </TouchableOpacity>
        </View>
      </SignedIn>

      <SignedOut>
        <View className="mx-4 mb-4 p-4 bg-surface rounded-xl border border-border">
          <Text className="text-text-secondary text-sm mb-3">
            Sign in to sync preferences and save stories across devices.
          </Text>
          <TouchableOpacity
            onPress={() => redirectToSignIn()}
            className="bg-text-primary rounded-lg py-2.5 items-center"
          >
            <Text className="text-background font-semibold text-sm">Sign in</Text>
          </TouchableOpacity>
        </View>
      </SignedOut>

      {/* Notifications */}
      <View className="mx-4 mb-4 p-4 bg-surface rounded-xl border border-border">
        <Text className="text-text-primary font-semibold mb-1">Race start alerts</Text>
        <Text className="text-text-muted text-xs mb-3">
          {pushEnabled ? "Notifications enabled" : "Tap a toggle to enable push notifications"}
        </Text>
        {SERIES.map((s) => {
          const raceStart = !!(prefs?.notificationPrefs?.[s.id]?.raceStart);
          return (
            <View key={s.id} className="flex-row items-center justify-between py-2">
              <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <Text className="text-text-secondary text-sm">{s.label} race start</Text>
              </View>
              <Switch
                value={raceStart}
                onValueChange={(val) => toggleSeriesRaceStart(s.id, val)}
                trackColor={{ false: "#2a2a2a", true: s.color }}
                thumbColor="#f5f5f5"
              />
            </View>
          );
        })}
      </View>

      {/* App info */}
      <View className="mx-4 p-4 bg-surface rounded-xl border border-border">
        <Text className="text-text-primary font-semibold mb-2">About</Text>
        <Text className="text-text-muted text-sm">Paddock v1.0</Text>
      </View>
    </ScrollView>
  );
}
