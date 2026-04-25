import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getLastActiveGame } from '../db/games';

export type ScreenName =
  | 'Home'
  | 'History'
  | 'PanagramGame'
  | 'PanagramHistory'
  | 'TargetGame'
  | 'TargetHistory'
  | 'LadderleGame'
  | 'LadderleHistory'
  | 'CryptoquoteGame'
  | 'CryptoquoteHistory'
  | 'WordGuessGame'
  | 'WordGuessHistory'
  | 'CrosswordGame'
  | 'CrosswordHistory'
  | 'Settings'
  | 'Profile'
  | 'About';

interface NavigationContextType {
  currentScreen: ScreenName;
  navigate: (screen: ScreenName, params?: Record<string, any>) => void;
  goBack: () => void;
  lastGame: { gameType: string; gameId: string } | null;
  refreshLastGame: () => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Home');
  const [lastGame, setLastGame] = useState<{ gameType: string; gameId: string } | null>(null);

  const refreshLastGame = useCallback(async () => {
    const game = await getLastActiveGame();
    setLastGame(game);
  }, []);

  useEffect(() => {
    refreshLastGame();
  }, [refreshLastGame]);

  const navigate = useCallback((screen: ScreenName, params?: Record<string, any>) => {
    setCurrentScreen(screen);
  }, []);

  const goBack = useCallback(() => {
    setCurrentScreen('Home');
  }, []);

  return (
    <NavigationContext.Provider value={{ currentScreen, navigate, goBack, lastGame, refreshLastGame }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useAppNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useAppNavigation must be used within NavigationProvider');
  }
  return context;
}

export function useNavigation() {
  const { navigate } = useAppNavigation();
  return {
    navigate: (screen: string, params?: Record<string, any>) => {
      navigate(screen as ScreenName, params);
    },
  };
}

export function useRoute() {
  return {
    params: {},
  };
}