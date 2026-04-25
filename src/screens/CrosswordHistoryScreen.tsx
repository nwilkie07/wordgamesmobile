import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { gameDb, type CrosswordGame } from '../db/games';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatDate, confirmDelete } from '../lib/utils';

type RootStackParamList = {
  Home: undefined;
  CrosswordGame: { gameId?: string };
};

export default function CrosswordHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [games, setGames] = useState<CrosswordGame[]>([]);

  useEffect(() => {
    setGames(gameDb.crossword.findAll());
  }, []);

  const handlePlayGame = (gameId: string) => {
    navigation.navigate('CrosswordGame', { gameId });
  };

  const handleDeleteGame = async (e: any, gameId: string) => {
    e.stopPropagation();
    await confirmDelete(async () => {
      await gameDb.crossword.remove(gameId);
      setGames(gameDb.crossword.findAll());
    });
  };

  if (games.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No games played yet.</Text>
        <TouchableOpacity
          style={styles.newGameButton}
          onPress={() => navigation.navigate('CrosswordGame', {})}
        >
          <Text style={styles.newGameButtonText}>Play a New Game</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Crossword History</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={games}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.gameCard}
            onPress={() => handlePlayGame(item.id)}
          >
            <View style={styles.gameInfo}>
              <Text style={styles.puzzleIdText}>Puzzle #{item.puzzleId.replace('puzzle_', '').replace('_', '')}</Text>
              <Text style={styles.dateText}>{formatDate(item.updatedAt)}</Text>
            </View>
            {item.completed && (
              <Text style={styles.completedBadge}>Solved</Text>
            )}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => handleDeleteGame(e, item.id)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
  newGameButton: {
    marginTop: 16,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  newGameButtonText: {
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  gameCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  gameInfo: {
    marginBottom: 8,
  },
  puzzleIdText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  completedBadge: {
    backgroundColor: '#16A34A',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#DC2626',
  },
});