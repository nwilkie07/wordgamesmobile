import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { House, History, Settings } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

interface NavItemProps {
  label: string;
  onPress?: () => void;
}

const NavItem = ({ label, onPress }: NavItemProps) => {
  const getIcon = () => {
    switch (label) {
      case "Home":
        return <House size={24} color="#374151" />;
      case "History":
        return <History size={24} color="#374151" />;
      case "Settings":
        return <Settings size={24} color="#374151" />;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.navItem}>
      {getIcon()}
      <Text style={styles.navText}>{label}</Text>
    </TouchableOpacity>
  );
};

export const NavigationFooter = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      <NavItem label="Home" onPress={() => navigation.navigate("Home")} />
      <NavItem label="History" onPress={() => navigation.navigate("History")} />
      <NavItem label="Settings" onPress={() => navigation.navigate("Settings")} />
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
});