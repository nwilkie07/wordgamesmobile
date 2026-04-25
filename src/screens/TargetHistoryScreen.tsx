import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { gameDb, type TargetGame } from '../db/games';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatDate, confirmDelete } from '../lib/utils';

type RootStackParamList = {
  Home: undefined;
  TargetGame: { gameId?: string };
};

export default function TargetHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [games, setGames] = useState<TargetGame[]>([]);

  useEffect(() => {
    setGames(gameDb.target.findAll());
  }, []);

  const handlePlayGame = (gameId: string) => {
    navigation.navigate('TargetGame', { gameId });
  };

  const handleDeleteGame = async (e: any, gameId: string) => {
    e.stopPropagation();
    await confirmDelete(async () => {
      await gameDb.target.remove(gameId);
      setGames(gameDb.target.findAll());
    });
  };

  if (games.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No games played yet.</Text>
        <TouchableOpacity
          style={styles.newGameButton}
          onPress={() => navigation.navigate('TargetGame', {})}
        >
          <Text style={styles.newGameButtonText}>Play a New Game</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Target Game History</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={games}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const foundWords = JSON.parse(item.foundWordsJson || '[]');
          const letterCounts = JSON.parse(item.letterCounts);
          const uniqueLetters = Object.keys(letterCounts).length;

          return (
            <TouchableOpacity
              style={styles.gameCard}
              onPress={() => handlePlayGame(item.id)}
            >
              <View style={styles.gameInfo}>
                <View style={styles.lettersRow}>
                  <Text style={styles.letters}>{item.letters.toUpperCase()}</Text>
                  <View style={styles.centerBadge}>
                    <Text style={styles.centerBadgeText}>{item.centerLetter.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.dateText}>{formatDate(item.updatedAt)}</Text>
                <Text style={styles.letterInfo}>{uniqueLetters} unique letters</Text>
              </View>
              <View style={styles.wordCountContainer}>
                <Text style={styles.wordCountText}>{foundWords.length}</Text>
                <Text style={styles.wordCountLabel}>words found</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => handleDeleteGame(e, item.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
              {item.completed && (
                <Text style={styles.completedText}>Completed!</Text>
              )}
            </TouchableOpacity>
          );
        }}
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
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  newGameButtonText: {
    fontWeight: 'bold',
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
  lettersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  letters: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  centerBadge: {
    backgroundColor: '#FCD34D',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  centerBadgeText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  letterInfo: {
    fontSize: 12,
    color: '#666',
  },
  wordCountContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    alignItems: 'flex-end',
  },
  wordCountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  wordCountLabel: {
    fontSize: 12,
    color: '#666',
  },
  completedText: {
    color: '#16A34A',
    fontWeight: 'bold',
    marginTop: 8,
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  deleteButtonText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#DC2626',
  },
});