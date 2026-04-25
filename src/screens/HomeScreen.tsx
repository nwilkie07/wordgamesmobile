import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppNavigation } from "../context/NavigationContext";
import {
  Grid3X3,
  Hexagon,
  Quote,
  Target,
  WavesLadder,
  Waypoints,
  WholeWord,
} from "lucide-react-native";

type ScreenName =
  | "Home"
  | "History"
  | "PanagramGame"
  | "PanagramHistory"
  | "TargetGame"
  | "TargetHistory"
  | "LadderleGame"
  | "LadderleHistory"
  | "CryptoquoteGame"
  | "CryptoquoteHistory"
  | "WordGuessGame"
  | "WordGuessHistory"
  | "CrosswordGame"
  | "CrosswordHistory"
  | "Settings"
  | "Profile"
  | "About";

export default function HomeScreen() {
  const { navigate } = useAppNavigation();

  const handleNavigation = (screen: ScreenName) => {
    navigate(screen);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.gameButtonContainer}>
          <TouchableOpacity
            style={[styles.gameButton, styles.panagram]}
            onPress={() => handleNavigation("PanagramGame")}
          >
            <Hexagon style={styles.icon} height={40} width={40} />
            <Text style={styles.gameButtonText}>7 Letters</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gameButton, styles.target]}
            onPress={() => handleNavigation("TargetGame")}
          >
            <Target style={styles.icon} height={40} width={40} />
            <Text style={styles.gameButtonText}>Target</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gameButton, styles.ladderle]}
            onPress={() => handleNavigation("LadderleGame")}
          >
            <Waypoints style={styles.icon} height={40} width={40} />
            <Text style={styles.gameButtonText}>Ladderle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gameButton, styles.cryptoquote]}
            onPress={() => handleNavigation("CryptoquoteGame")}
          >
            <Quote style={styles.icon} height={40} width={40} />
            <Text style={styles.gameButtonText}>Cryptoquote</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gameButton, styles.wordguess]}
            onPress={() => handleNavigation("WordGuessGame")}
          >
            <WholeWord style={styles.icon} height={40} width={40} />
            <Text style={styles.gameButtonText}>WordGuess</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gameButton, styles.crossword]}
            onPress={() => handleNavigation("CrosswordGame")}
          >
            <Grid3X3 style={styles.icon} height={40} width={40} />
            <Text style={styles.gameButtonText}>Crossword</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.settingsLink}
          onPress={() => handleNavigation("About")}
        >
          <Text style={styles.settingsLinkText}>About WordGames</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    marginHorizontal: 8,
    marginTop: 8,
    gap: 8,
  },
  historyButton: {
    flex: 1,
    backgroundColor: "#EBF5FF",
    borderWidth: 1,
    borderColor: "#B8D4E8",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  historyButtonText: {
    color: "#2563EB",
    fontWeight: "bold",
    fontSize: 16,
  },
  targetHistoryButton: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
  },
  targetHistoryText: {
    color: "#EA580C",
  },
  ladderleHistoryButton: {
    backgroundColor: "#D1FAE5",
    borderColor: "#A7F3D0",
  },
  ladderleHistoryText: {
    color: "#10B981",
  },
  cryptoquoteHistoryButton: {
    backgroundColor: "#EDE9FE",
    borderColor: "#DDD6FE",
  },
  cryptoquoteHistoryText: {
    color: "#7C3AED",
  },
  wordguessHistoryButton: {
    backgroundColor: "#E5E7EB",
    borderColor: "#D1D5DB",
  },
  wordguessHistoryText: {
    color: "#374151",
  },
  crosswordHistoryButton: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  crosswordHistoryText: {
    color: "#059669",
  },
  gameButtonContainer: {
    display: "flex",
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "center",
    alignSelf: "center",
    width: "100%",
    padding: 16,
    marginHorizontal: 8,
    marginTop: 16,
  },
  icon: {
    alignSelf: "center",
  },
  crossword: {
    backgroundColor: "#4392F1",
  },
  target: {
    backgroundColor: "#FEC9F1",
  },
  panagram: {
    backgroundColor: "#F7C548",
  },
  wordguess: {
    backgroundColor: "#EDE6E3",
  },
  cryptoquote: {
    backgroundColor: "#35CE8D",
  },
  ladderle: {
    backgroundColor: "#D30C7B",
  },
  gameButton: {
    display: "flex",
    justifyContent: "center",
    alignSelf: "center",
    width: "40%",
    margin: 16,
    backgroundColor: "#ddd",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
  },
  gameButtonText: {
    fontSize: 18,
    paddingTop: 12,
    alignSelf: "center",
    fontWeight: "bold",
  },
  settingsLink: {
    marginTop: 24,
    paddingVertical: 16,
    alignItems: "center",
  },
  settingsLinkText: {
    color: "#2563EB",
    fontSize: 14,
  },
});
