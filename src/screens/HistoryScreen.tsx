import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ScrollView } from 'react-native';
import { gameDb, type PanagramGame, type TargetGame, type LadderleGame, type CryptoquoteGame, type WordleGame, type CrosswordGame } from '../db/games';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatDate, confirmDelete } from '../lib/utils';

type GameType = 'all' | 'panagram' | 'target' | 'ladderle' | 'cryptoquote' | 'wordle' | 'crossword';

type RootStackParamList = {
  Home: undefined;
  History: undefined;
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
};

interface UnifiedGameItem {
  id: string;
  gameType: GameType;
  date: string;
  completed: boolean;
  data: PanagramGame | TargetGame | LadderleGame | CryptoquoteGame | WordleGame | CrosswordGame;
}

const GAME_FILTERS: { key: GameType; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: '#374151' },
  { key: 'panagram', label: 'Panagram', color: '#2563EB' },
  { key: 'target', label: 'Target', color: '#EA580C' },
  { key: 'ladderle', label: 'Ladderle', color: '#10B981' },
  { key: 'cryptoquote', label: 'Cryptoquote', color: '#7C3AED' },
  { key: 'wordle', label: 'Wordle', color: '#374151' },
  { key: 'crossword', label: 'Crossword', color: '#059669' },
];

export default function HistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedFilter, setSelectedFilter] = useState<GameType>('all');
  const [games, setGames] = useState<UnifiedGameItem[]>([]);

  const loadGames = useCallback(() => {
    const allGames: UnifiedGameItem[] = [];

    if (selectedFilter === 'all' || selectedFilter === 'panagram') {
      const panagramGames = gameDb.panagram.findAll();
      for (const game of panagramGames) {
        allGames.push({
          id: game.id,
          gameType: 'panagram',
          date: game.updatedAt,
          completed: game.completed,
          data: game,
        });
      }
    }

    if (selectedFilter === 'all' || selectedFilter === 'target') {
      const targetGames = gameDb.target.findAll();
      for (const game of targetGames) {
        allGames.push({
          id: game.id,
          gameType: 'target',
          date: game.updatedAt,
          completed: game.completed,
          data: game,
        });
      }
    }

    if (selectedFilter === 'all' || selectedFilter === 'ladderle') {
      const ladderleGames = gameDb.ladderle.findAll();
      for (const game of ladderleGames) {
        allGames.push({
          id: game.id,
          gameType: 'ladderle',
          date: game.updatedAt,
          completed: game.completed,
          data: game,
        });
      }
    }

    if (selectedFilter === 'all' || selectedFilter === 'cryptoquote') {
      const cryptoquoteGames = gameDb.cryptoquote.findAll();
      for (const game of cryptoquoteGames) {
        allGames.push({
          id: game.id,
          gameType: 'cryptoquote',
          date: game.updatedAt,
          completed: game.completed,
          data: game,
        });
      }
    }

    if (selectedFilter === 'all' || selectedFilter === 'wordle') {
      const wordleGames = gameDb.wordle.findAll();
      for (const game of wordleGames) {
        allGames.push({
          id: game.id,
          gameType: 'wordle',
          date: game.updatedAt,
          completed: game.completed,
          data: game,
        });
      }
    }

    if (selectedFilter === 'all' || selectedFilter === 'crossword') {
      const crosswordGames = gameDb.crossword.findAll();
      for (const game of crosswordGames) {
        allGames.push({
          id: game.id,
          gameType: 'crossword',
          date: game.updatedAt,
          completed: game.completed,
          data: game,
        });
      }
    }

    allGames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setGames(allGames);
  }, [selectedFilter]);

  useFocusEffect(
    useCallback(() => {
      loadGames();
    }, [loadGames])
  );

  const handlePlayGame = (item: UnifiedGameItem) => {
    switch (item.gameType) {
      case 'panagram':
        navigation.navigate('PanagramGame', { gameId: item.id });
        break;
      case 'target':
        navigation.navigate('TargetGame', { gameId: item.id });
        break;
      case 'ladderle':
        navigation.navigate('LadderleGame', { gameId: item.id });
        break;
      case 'cryptoquote':
        navigation.navigate('CryptoquoteGame', { gameId: item.id });
        break;
      case 'wordle':
        navigation.navigate('WordleGame', { gameId: item.id });
        break;
      case 'crossword':
        navigation.navigate('CrosswordGame', { gameId: item.id });
        break;
    }
  };

  const handleDeleteGame = async (e: any, item: UnifiedGameItem) => {
    e.stopPropagation();
    await confirmDelete(async () => {
      switch (item.gameType) {
        case 'panagram':
          await gameDb.panagram.remove(item.id);
          break;
        case 'target':
          await gameDb.target.remove(item.id);
          break;
        case 'ladderle':
          await gameDb.ladderle.remove(item.id);
          break;
        case 'cryptoquote':
          await gameDb.cryptoquote.remove(item.id);
          break;
        case 'wordle':
          await gameDb.wordle.remove(item.id);
          break;
        case 'crossword':
          await gameDb.crossword.remove(item.id);
          break;
      }
      loadGames();
    });
  };

  const getGameTitle = (item: UnifiedGameItem): string => {
    switch (item.gameType) {
      case 'panagram':
        return `Panagram: ${(item.data as PanagramGame).letters.toUpperCase()} + ${(item.data as PanagramGame).centerLetter.toUpperCase()}`;
      case 'target':
        return `Target: ${(item.data as TargetGame).letters.toUpperCase()}`;
      case 'ladderle':
        return `Ladderle: ${(item.data as LadderleGame).targetWord.toUpperCase()}`;
      case 'cryptoquote':
        return `Cryptoquote: ${((item.data as CryptoquoteGame).encryptedQuote.slice(0, 30))}...`;
      case 'wordle':
        return `Wordle: ${(item.data as WordleGame).targetWord.toUpperCase()}`;
      case 'crossword':
        return `Crossword: #${(item.data as CrosswordGame).puzzleId.replace('puzzle_', '')}`;
      default:
        return 'Unknown Game';
    }
  };

  const getGameIcon = (gameType: GameType): string => {
    switch (gameType) {
      case 'panagram': return '7L';
      case 'target': return 'T';
      case 'ladderle': return 'LD';
      case 'cryptoquote': return 'CQ';
      case 'wordle': return 'W';
      case 'crossword': return 'XW';
      default: return '?';
    }
  };

  const renderItem = ({ item }: { item: UnifiedGameItem }) => {
    const filterConfig = GAME_FILTERS.find(f => f.key === item.gameType);

    return (
      <TouchableOpacity
        style={styles.gameCard}
        onPress={() => handlePlayGame(item)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.gameTypeBadge, { backgroundColor: filterConfig?.color + '20', borderColor: filterConfig?.color }]}>
            <Text style={[styles.gameTypeText, { color: filterConfig?.color }]}>
              {getGameIcon(item.gameType)}
            </Text>
          </View>
          {item.completed && (
            <Text style={styles.completedBadge}>Done</Text>
          )}
        </View>

        <View style={styles.gameInfo}>
          <Text style={styles.gameTitle} numberOfLines={1}>{getGameTitle(item)}</Text>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
        </View>

        <View style={styles.gameDetails}>
          {item.gameType === 'panagram' && (
            <Text style={styles.detailText}>Score: {(item.data as PanagramGame).score} pts</Text>
          )}
          {item.gameType === 'wordle' && (
            <Text style={styles.detailText}>{(item.data as WordleGame).won ? 'Won' : 'Lost'}</Text>
          )}
          {item.gameType === 'ladderle' && (
            <Text style={styles.detailText}>{(item.data as LadderleGame).won ? 'Won' : 'Lost'}</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => handleDeleteGame(e, item)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Game History</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backButtonText}>Home</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {GAME_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && { backgroundColor: filter.color },
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === filter.key && { color: '#fff' },
            ]}>{filter.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {games.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No games played yet.</Text>
        </View>
      ) : (
        <FlatList
          data={games}
          keyExtractor={(item) => `${item.gameType}-${item.id}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  filterContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    maxHeight: 56,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  filterButtonText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#374151',
  },
  listContent: {
    padding: 16,
  },
  gameCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  gameTypeText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  completedBadge: {
    backgroundColor: '#16A34A',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gameInfo: {
    marginBottom: 4,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  gameDetails: {
    marginTop: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
});