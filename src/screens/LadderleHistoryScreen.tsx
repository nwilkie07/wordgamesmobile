import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { gameDb, type LadderleGame } from '../db/games';
import { useAppNavigation, ScreenName } from '../context/NavigationContext';
import { formatDate, confirmDelete } from '../lib/utils';

type RootStackParamList = {
  Home: undefined;
  LadderleGame: { gameId?: string };
};

export default function LadderleHistoryScreen({ navigation }: { navigation?: any }) {
  const { navigate } = useAppNavigation();
  const [games, setGames] = useState<LadderleGame[]>([]);

  useEffect(() => {
    setGames(gameDb.ladderle.findAll());
  }, []);

  const handlePlayGame = (gameId: string) => {
    navigate('LadderleGame' as ScreenName, { gameId });
  };

  const handleDeleteGame = async (e: any, gameId: string) => {
    e.stopPropagation();
    await confirmDelete(async () => {
      await gameDb.ladderle.remove(gameId);
      setGames(gameDb.ladderle.findAll());
    });
  };

  if (games.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No games played yet.</Text>
        <TouchableOpacity
          style={styles.newGameButton}
          onPress={() => navigate('LadderleGame' as ScreenName, {})}
        >
          <Text style={styles.newGameButtonText}>Play a New Game</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ladderle History</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigate('Home' as ScreenName)}>
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={games}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const attempts = JSON.parse(item.attemptsJson || '[]');
          return (
            <TouchableOpacity
              style={styles.gameCard}
              onPress={() => handlePlayGame(item.id)}
            >
              <View style={styles.gameInfo}>
                <View style={styles.targetRow}>
                  <Text style={styles.targetLabel}>Target:</Text>
                  <Text style={styles.targetWord}>{item.targetWord.toUpperCase()}</Text>
                </View>
                <Text style={styles.dateText}>{formatDate(item.updatedAt)}</Text>
              </View>
              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>{attempts.length} tries</Text>
                {item.won && <Text style={styles.wonText}>Won!</Text>}
                {item.completed && !item.won && <Text style={styles.lostText}>Lost</Text>}
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => handleDeleteGame(e, item.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
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
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  newGameButtonText: {
    fontWeight: 'bold',
    color: '#10B981',
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
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  targetLabel: {
    fontSize: 14,
    color: '#666',
  },
  targetWord: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  wonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  lostText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
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