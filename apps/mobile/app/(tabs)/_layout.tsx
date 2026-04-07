import { Tabs } from "expo-router";
import { Platform } from "react-native";

const TAB_BAR_STYLE = {
  backgroundColor: "#111111",
  borderTopColor: "#2a2a2a",
  height: Platform.OS === "ios" ? 88 : 60,
};

const TAB_BAR_LABEL_STYLE = {
  fontFamily: "System",
  fontSize: 10,
  marginBottom: Platform.OS === "ios" ? 0 : 6,
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarLabelStyle: TAB_BAR_LABEL_STYLE,
        tabBarActiveTintColor: "#f5f5f5",
        tabBarInactiveTintColor: "#525252",
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{ title: "Feed", tabBarIcon: ({ color }) => <FeedIcon color={color} /> }}
      />
      <Tabs.Screen
        name="discover"
        options={{ title: "Discover", tabBarIcon: ({ color }) => <DiscoverIcon color={color} /> }}
      />
      <Tabs.Screen
        name="live"
        options={{ title: "Live", tabBarIcon: ({ color }) => <LiveIcon color={color} /> }}
      />
      <Tabs.Screen
        name="saved"
        options={{ title: "Saved", tabBarIcon: ({ color }) => <SavedIcon color={color} /> }}
      />
      <Tabs.Screen
        name="you"
        options={{ title: "You", tabBarIcon: ({ color }) => <YouIcon color={color} /> }}
      />
    </Tabs>
  );
}

import Svg, { Path, Circle, Rect } from "react-native-svg";

function FeedIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Rect x={2} y={4} width={18} height={2.5} rx={1.25} fill={color} />
      <Rect x={2} y={9.75} width={18} height={2.5} rx={1.25} fill={color} />
      <Rect x={2} y={15.5} width={12} height={2.5} rx={1.25} fill={color} />
    </Svg>
  );
}

function DiscoverIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={11} r={8.5} stroke={color} strokeWidth={1.5} />
      <Path d="M11 6v5l3 3" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function LiveIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={11} r={3} fill={color} />
      <Path d="M5.5 16.5A7.5 7.5 0 0 1 5.5 5.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M16.5 5.5a7.5 7.5 0 0 1 0 11" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function SavedIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M5 3h12a1 1 0 0 1 1 1v15l-7-4-7 4V4a1 1 0 0 1 1-1z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}

function YouIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={8} r={3.5} stroke={color} strokeWidth={1.5} />
      <Path d="M4 19c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
