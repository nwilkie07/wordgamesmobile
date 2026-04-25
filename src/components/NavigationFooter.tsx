import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { House, History, Settings, Gamepad2 } from "lucide-react-native";
import { useAppNavigation, ScreenName } from "../context/NavigationContext";

interface NavigationFooterProps {
  lastGame?: { gameType: string; gameId: string } | null;
}

export const NavigationFooter = ({ lastGame }: NavigationFooterProps) => {
  const insets = useSafeAreaInsets();
  const { currentScreen, navigate } = useAppNavigation();

  const handleNavigate = (screen: ScreenName) => {
    navigate(screen);
  };

  const handlePlayGame = () => {
    if (!lastGame) return;
    const screenName = lastGame.gameType.charAt(0).toUpperCase() + lastGame.gameType.slice(1) + 'Game';
    navigate(screenName as ScreenName);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handleNavigate('Home')}
      >
        <House size={24} color={currentScreen === 'Home' ? '#2563EB' : '#374151'} />
        <Text style={[styles.navText, currentScreen === 'Home' && styles.navTextActive]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={handlePlayGame}
      >
        <Gamepad2 size={24} color="#374151" />
        <Text style={styles.navText}>Play</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handleNavigate('History')}
      >
        <History size={24} color={currentScreen === 'History' ? '#2563EB' : '#374151'} />
        <Text style={[styles.navText, currentScreen === 'History' && styles.navTextActive]}>History</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handleNavigate('Settings')}
      >
        <Settings size={24} color={currentScreen === 'Settings' ? '#2563EB' : '#374151'} />
        <Text style={[styles.navText, currentScreen === 'Settings' && styles.navTextActive]}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  navItem: {
    alignItems: "center",
    padding: 8,
  },
  navText: {
    fontSize: 11,
    marginTop: 4,
    color: "#6b7280",
  },
  navTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
});