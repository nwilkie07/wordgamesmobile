import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { loadGamesFromStorage } from './src/db/games';

export default function App() {
  useEffect(() => {
    loadGamesFromStorage();
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </>
  );
}