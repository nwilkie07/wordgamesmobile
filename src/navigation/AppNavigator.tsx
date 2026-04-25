import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationProvider, useAppNavigation, ScreenName } from '../context/NavigationContext';
import { NavigationFooter } from '../components/NavigationFooter';

import HomeScreen from '../screens/HomeScreen';
import PanagramGameScreen from '../screens/PanagramGameScreen';
import TargetGameScreen from '../screens/TargetGameScreen';
import LadderleGameScreen from '../screens/LadderleGameScreen';
import CryptoquoteGameScreen from '../screens/CryptoquoteGameScreen';
import WordGuessGameScreen from '../screens/WordGuessGameScreen';
import CrosswordGameScreen from '../screens/CrosswordGameScreen';
import HistoryScreen from '../screens/HistoryScreen';
import PanagramHistoryScreen from '../screens/PanagramHistoryScreen';
import TargetHistoryScreen from '../screens/TargetHistoryScreen';
import LadderleHistoryScreen from '../screens/LadderleHistoryScreen';
import CryptoquoteHistoryScreen from '../screens/CryptoquoteHistoryScreen';
import WordGuessHistoryScreen from '../screens/WordGuessHistoryScreen';
import CrosswordHistoryScreen from '../screens/CrosswordHistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AboutScreen from '../screens/AboutScreen';

const screenComponents: Record<ScreenName, React.ComponentType<{navigation: any, route: any}>> = {
  Home: HomeScreen,
  PanagramGame: PanagramGameScreen,
  TargetGame: TargetGameScreen,
  LadderleGame: LadderleGameScreen,
  CryptoquoteGame: CryptoquoteGameScreen,
  WordGuessGame: WordGuessGameScreen,
  CrosswordGame: CrosswordGameScreen,
  History: HistoryScreen,
  PanagramHistory: PanagramHistoryScreen,
  TargetHistory: TargetHistoryScreen,
  LadderleHistory: LadderleHistoryScreen,
  CryptoquoteHistory: CryptoquoteHistoryScreen,
  WordGuessHistory: WordGuessHistoryScreen,
  CrosswordHistory: CrosswordHistoryScreen,
  Settings: SettingsScreen,
  Profile: ProfileScreen,
  About: AboutScreen,
};

function AppContent() {
  const { currentScreen, navigate, lastGame } = useAppNavigation();
  const [currentParams, setCurrentParams] = useState<Record<string, any>>({});

  const navigation = {
    navigate: (screen: string, params?: any) => {
      setCurrentParams(params || {});
      navigate(screen as ScreenName, params);
    },
  };

  const route = { params: currentParams };
  const CurrentScreen = screenComponents[currentScreen] || HomeScreen;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <CurrentScreen navigation={navigation} route={route} />
      </View>
      <NavigationFooter lastGame={lastGame} />
    </View>
  );
}

export default function AppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});