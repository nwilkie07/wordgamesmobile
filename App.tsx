import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import PanagramGameScreen from './src/screens/PanagramGameScreen';
import TargetGameScreen from './src/screens/TargetGameScreen';
import PanagramHistoryScreen from './src/screens/PanagramHistoryScreen';
import TargetHistoryScreen from './src/screens/TargetHistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AboutScreen from './src/screens/AboutScreen';
import LadderleGameScreen from './src/screens/LadderleGameScreen';
import LadderleHistoryScreen from './src/screens/LadderleHistoryScreen';
import CryptoquoteGameScreen from './src/screens/CryptoquoteGameScreen';
import CryptoquoteHistoryScreen from './src/screens/CryptoquoteHistoryScreen';
import WordleGameScreen from './src/screens/WordleGameScreen';
import WordleHistoryScreen from './src/screens/WordleHistoryScreen';
import CrosswordGameScreen from './src/screens/CrosswordGameScreen';
import CrosswordHistoryScreen from './src/screens/CrosswordHistoryScreen';
import { loadGamesFromStorage } from './src/db/games';

export type RootStackParamList = {
  Home: undefined;
  PanagramGame: { gameId?: string };
  TargetGame: { gameId?: string };
  LadderleGame: { gameId?: string };
  LadderleHistory: undefined;
  CryptoquoteGame: { gameId?: string };
  CryptoquoteHistory: undefined;
  WordleGame: { gameId?: string };
  WordleHistory: undefined;
  CrosswordGame: { gameId?: string };
  CrosswordHistory: undefined;
  PanagramHistory: undefined;
  TargetHistory: undefined;
  Settings: undefined;
  Profile: undefined;
  About: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    loadGamesFromStorage();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PanagramGame" component={PanagramGameScreen} options={{ title: '7 Letters' }} />
        <Stack.Screen name="TargetGame" component={TargetGameScreen} options={{ title: 'Target' }} />
        <Stack.Screen name="LadderleGame" component={LadderleGameScreen} options={{ title: 'Ladderle' }} />
        <Stack.Screen name="LadderleHistory" component={LadderleHistoryScreen} options={{ title: 'Ladderle History' }} />
        <Stack.Screen name="CryptoquoteGame" component={CryptoquoteGameScreen} options={{ title: 'Cryptoquote' }} />
        <Stack.Screen name="CryptoquoteHistory" component={CryptoquoteHistoryScreen} options={{ title: 'Cryptoquote History' }} />
        <Stack.Screen name="WordleGame" component={WordleGameScreen} options={{ title: 'Wordle' }} />
        <Stack.Screen name="WordleHistory" component={WordleHistoryScreen} options={{ title: 'Wordle History' }} />
        <Stack.Screen name="CrosswordGame" component={CrosswordGameScreen} options={{ title: 'Crossword' }} />
        <Stack.Screen name="CrosswordHistory" component={CrosswordHistoryScreen} options={{ title: 'Crossword History' }} />
        <Stack.Screen name="PanagramHistory" component={PanagramHistoryScreen} options={{ title: 'Panagram History' }} />
        <Stack.Screen name="TargetHistory" component={TargetHistoryScreen} options={{ title: 'Target History' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
        <Stack.Screen name="About" component={AboutScreen} options={{ title: 'About' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}