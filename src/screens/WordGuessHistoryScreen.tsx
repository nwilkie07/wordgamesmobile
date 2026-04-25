import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { gameDb, type WordGuessGame } from '../db/games';
import { useAppNavigation, ScreenName } from '../context/NavigationContext';
import { formatDate, confirmDelete, type LetterState, getCellStyle } from '../lib/utils';

interface GuessRow {
  letters: string;
  states: LetterState[];
}

export default function WordGuessHistoryScreen({ navigation }: { navigation?: any }) {
  const { navigate } = useAppNavigation();
  const [games, setGames] = useState<WordGuessGame[]>([]);

  useEffect(() => {
    setGames(gameDb.wordguess.findAll());
  }, []);

  const handlePlayGame = (gameId: string) => {
    navigate('WordGuessGame', { gameId });
  };

  const handleDeleteGame = async (e: any, gameId: string) => {
    e.stopPropagation();
    await confirmDelete(async () => {
      await gameDb.wordguess.remove(gameId);
      setGames(gameDb.wordguess.findAll());
    });
  };

  if (games.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No games played yet.</Text>
        <TouchableOpacity
          style={styles.newGameButton}
          onPress={() => navigate('WordGuessGame', {})}
        >
          <Text style={styles.newGameButtonText}>Play a New Game</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>WordGuess History</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigate('Home')}>
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={games}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const guesses: GuessRow[] = JSON.parse(item.guessesJson || '[]');
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

              <View style={styles.boardPreview}>
                {guesses.slice(0, 6).map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.previewRow}>
                    {row.letters.split('').map((letter, colIndex) => (
                      <View
                        key={colIndex}
                        style={[styles.previewCell, getCellStyle(row.states[colIndex])]}
                      >
                        <Text style={styles.previewCellText}>{letter}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>

              <View style={styles.statsRow}>
                {item.won ? (
                  <Text style={styles.wonText}>Won in {guesses.length} tries</Text>
                ) : (
                  <Text style={styles.lostText}>Lost</Text>
                )}
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
    color: '#16A34A',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  boardPreview: {
    marginTop: 8,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 2,
  },
  previewCell: {
    width: 20,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  previewCellText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyCell: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
    borderWidth: 1,
  },
  correctCell: {
    backgroundColor: '#16A34A',
  },
  presentCell: {
    backgroundColor: '#CA8A04',
  },
  absentCell: {
    backgroundColor: '#6B7280',
  },
  statsRow: {
    marginTop: 8,
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