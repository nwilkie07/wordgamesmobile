import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { loadCrosswordData, getRandomPuzzle, getPuzzleById, type CrosswordPuzzle, type CrosswordEntry } from '../lib/crossword';
import { gameDb, type CrosswordGame } from '../db/games';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  CrosswordGame: { gameId?: string };
  CrosswordHistory: undefined;
};

interface CellState {
  letter: string;
  number: number | null;
  userInput: string;
  revealed: boolean;
}

export default function CrosswordGameScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CrosswordGame'>>();
  const gameIdFromRoute = route.params?.gameId;

  const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null);
  const [grid, setGrid] = useState<(CellState | null)[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [currentDirection, setCurrentDirection] = useState<'across' | 'down'>('across');
  const [currentEntry, setCurrentEntry] = useState<CrosswordEntry | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [showClueModal, setShowClueModal] = useState(false);

  const initializeGame = useCallback(async () => {
    await loadCrosswordData();

    if (gameIdFromRoute) {
      const savedGame = gameDb.crossword.findById(gameIdFromRoute);
      if (savedGame) {
        const puzzle = await getPuzzleById(savedGame.puzzleId);
        if (puzzle) {
          setPuzzle(puzzle);
          setCurrentGameId(gameIdFromRoute);
          const savedEntries = JSON.parse(savedGame.entriesJson || '{}');

          const newGrid: (CellState | null)[][] = [];
          for (let r = 0; r < puzzle.size; r++) {
            const row: (CellState | null)[] = [];
            for (let c = 0; c < puzzle.size; c++) {
              const letter = puzzle.grid[r][c];
              if (letter === null) {
                row.push(null);
              } else {
                const number = getCellNumber(puzzle, r, c);
                const savedCell = savedEntries[`${r},${c}`];
                row.push({
                  letter,
                  number,
                  userInput: savedCell?.userInput || '',
                  revealed: savedCell?.revealed || false,
                });
              }
            }
            newGrid.push(row);
          }
          setGrid(newGrid);
          setLoading(false);
          return;
        }
      }
    }

    let newPuzzle = await getRandomPuzzle();

    if (!newPuzzle) {
      Alert.alert('Error', 'No puzzles available');
      return;
    }

    const entriesJson = '{}';
    const newGame = await gameDb.crossword.create({
      puzzleId: newPuzzle.id,
      entriesJson,
      completed: false,
    });

    setPuzzle(newPuzzle);
    setCurrentGameId(newGame.id);

    const newGrid: (CellState | null)[][] = [];
    for (let r = 0; r < newPuzzle.size; r++) {
      const row: (CellState | null)[] = [];
      for (let c = 0; c < newPuzzle.size; c++) {
        const letter = newPuzzle.grid[r][c];
        if (letter === null) {
          row.push(null);
        } else {
          const number = getCellNumber(newPuzzle, r, c);
          row.push({
            letter,
            number,
            userInput: '',
            revealed: false,
          });
        }
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    setLoading(false);
  }, [gameIdFromRoute]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const getCellNumber = (p: CrosswordPuzzle, row: number, col: number): number | null => {
    for (const entry of p.entries) {
      if (entry.row === row && entry.col === col) {
        return entry.number;
      }
    }
    return null;
  };

  const getEntryAtCell = (row: number, col: number): CrosswordEntry | null => {
    if (!puzzle) return null;
    for (const entry of puzzle.entries) {
      if (entry.row === row && entry.col === col) {
        return entry;
      }
      if (entry.direction === 'across') {
        for (let c = entry.col; c < entry.col + entry.answer.length; c++) {
          if (c === col && entry.row === row) return entry;
        }
      } else {
        for (let r = entry.row; r < entry.row + entry.answer.length; r++) {
          if (r === row && entry.col === col) return entry;
        }
      }
    }
    return null;
  };

  const getEntryInDirection = (row: number, col: number, dir: 'across' | 'down'): CrosswordEntry | null => {
    if (!puzzle) return null;
    for (const entry of puzzle.entries) {
      if (entry.direction !== dir) continue;
      if (dir === 'across') {
        if (entry.row === row && col >= entry.col && col < entry.col + entry.answer.length) {
          return entry;
        }
      } else {
        if (entry.col === col && row >= entry.row && row < entry.row + entry.answer.length) {
          return entry;
        }
      }
    }
    return null;
  };

  const handleCellPress = (row: number, col: number) => {
    if (!puzzle || grid[row][col] === null) return;

    const entry = getEntryInDirection(row, col, currentDirection);
    if (entry) {
      setCurrentEntry(entry);
      setSelectedCell({ row, col });
    } else {
      const otherDir = currentDirection === 'across' ? 'down' : 'across';
      const altEntry = getEntryInDirection(row, col, otherDir);
      if (altEntry) {
        setCurrentDirection(otherDir);
        setCurrentEntry(altEntry);
        setSelectedCell({ row, col });
      }
    }
  };

  const handleLetterInput = (letter: string) => {
    if (!selectedCell || gameOver) return;
    const { row, col } = selectedCell;
    const cell = grid[row][col];
    if (!cell) return;

    const newGrid = [...grid];
    newGrid[row][col] = { ...cell, userInput: letter.toUpperCase() };
    setGrid(newGrid);

    if (currentEntry) {
      let filled = true;
      if (currentEntry.direction === 'across') {
        for (let c = currentEntry.col; c < currentEntry.col + currentEntry.answer.length; c++) {
          if (!newGrid[currentEntry.row][c]?.userInput) {
            filled = false;
            break;
          }
        }
      } else {
        for (let r = currentEntry.row; r < currentEntry.row + currentEntry.answer.length; r++) {
          if (!newGrid[r][currentEntry.col]?.userInput) {
            filled = false;
            break;
          }
        }
      }
      if (filled) {
        checkEntryComplete(currentEntry);
      }
    }

    if (currentEntry) {
      let nextRow = row;
      let nextCol = col;
      const puzzleSize = puzzle?.size ?? 15;
      if (currentEntry.direction === 'across') {
        nextCol = col + 1;
        if (nextCol >= puzzleSize || grid[row][nextCol] === null) {
          nextCol = currentEntry.col;
          nextRow = row + 1;
        }
      } else {
        nextRow = row + 1;
        if (nextRow >= puzzleSize || grid[nextRow][col] === null) {
          nextRow = currentEntry.row;
          nextCol = col + 1;
        }
      }
      if (nextRow < puzzleSize && nextCol < puzzleSize && grid[nextRow][nextCol]) {
        setSelectedCell({ row: nextRow, col: nextCol });
      }
    }
  };

  const checkEntryComplete = async (entry: CrosswordEntry) => {
    if (!puzzle) return;
    let correct = true;
    if (entry.direction === 'across') {
      for (let i = 0; i < entry.answer.length; i++) {
        const cell = grid[entry.row][entry.col + i];
        if (!cell || cell.userInput !== entry.answer[i]) {
          correct = false;
          break;
        }
      }
    } else {
      for (let i = 0; i < entry.answer.length; i++) {
        const cell = grid[entry.row + i][entry.col];
        if (!cell || cell.userInput !== entry.answer[i]) {
          correct = false;
          break;
        }
      }
    }

    if (correct) {
      const allEntriesComplete = puzzle.entries.every(e => {
        if (e.direction === 'across') {
          for (let i = 0; i < e.answer.length; i++) {
            const cell = grid[e.row][e.col + i];
            if (!cell || cell.userInput !== e.answer[i]) return false;
          }
        } else {
          for (let i = 0; i < e.answer.length; i++) {
            const cell = grid[e.row + i][e.col];
            if (!cell || cell.userInput !== e.answer[i]) return false;
          }
        }
        return true;
      });

      if (allEntriesComplete) {
        setGameOver(true);
        if (currentGameId) {
          await gameDb.crossword.update(currentGameId, { completed: true });
        }
      }
    }
  };

  const handleBackspace = () => {
    if (!selectedCell || gameOver) return;
    const { row, col } = selectedCell;
    const cell = grid[row][col];
    if (!cell || !cell.userInput) {
      let prevRow = row;
      let prevCol = col;
      if (currentDirection === 'across') {
        prevCol = col - 1;
        if (prevCol < 0 || grid[row][prevCol] === null) {
          prevCol = currentEntry ? currentEntry.col + currentEntry.answer.length - 1 : col;
          prevRow = row - 1;
        }
      } else {
        prevRow = row - 1;
        if (prevRow < 0 || grid[prevRow][col] === null) {
          prevRow = currentEntry ? currentEntry.row + currentEntry.answer.length - 1 : row;
          prevCol = col;
        }
      }
      if (prevRow >= 0 && prevCol >= 0 && grid[prevRow][prevCol]) {
        const newGrid = [...grid];
        const prevCell = newGrid[prevRow][prevCol]!;
        newGrid[prevRow][prevCol] = { letter: prevCell.letter, number: prevCell.number, userInput: '', revealed: prevCell.revealed };
        setGrid(newGrid);
        setSelectedCell({ row: prevRow, col: prevCol });
      }
    } else {
      const newGrid = [...grid];
      newGrid[row][col] = { ...cell, userInput: '' };
      setGrid(newGrid);
    }
  };

  const toggleDirection = () => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const newDir = currentDirection === 'across' ? 'down' : 'across';
    const entry = getEntryInDirection(row, col, newDir);
    if (entry) {
      setCurrentDirection(newDir);
      setCurrentEntry(entry);
    }
  };

  const revealLetter = () => {
    if (!selectedCell || !currentEntry || gameOver) return;
    const { row, col } = selectedCell;
    const cell = grid[row][col];
    if (!cell) return;

    const letterIndex = currentEntry.direction === 'across'
      ? col - currentEntry.col
      : row - currentEntry.row;
    const correctLetter = currentEntry.answer[letterIndex];

    const newGrid = [...grid];
    newGrid[row][col] = { ...cell, userInput: correctLetter, revealed: true };
    setGrid(newGrid);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading puzzle...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Crossword</Text>
        {currentEntry && (
          <Text style={styles.clueText}>
            {currentEntry.number}{currentEntry.direction === 'across' ? 'A' : 'D'}: {currentEntry.clue}
          </Text>
        )}
      </View>

      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {grid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell, colIndex) => (
                <TouchableOpacity
                  key={colIndex}
                  style={[
                    styles.cell,
                    cell === null ? styles.blackCell : styles.whiteCell,
                    selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? styles.selectedCell : null,
                  ]}
                  onPress={() => handleCellPress(rowIndex, colIndex)}
                  disabled={cell === null}
                >
                  {cell && (
                    <>
                      {cell.number && (
                        <Text style={styles.cellNumber}>{cell.number}</Text>
                      )}
                      <Text style={[
                        styles.cellLetter,
                        cell.revealed ? styles.revealedLetter : null,
                        cell.userInput ? styles.filledLetter : null,
                      ]}>
                        {cell.userInput || ''}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.directionButton} onPress={toggleDirection}>
          <Text style={styles.directionButtonText}>
            {currentDirection === 'across' ? 'ACROSS' : 'DOWN'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.revealButton} onPress={revealLetter}>
          <Text style={styles.revealButtonText}>REVEAL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backspaceButton} onPress={handleBackspace}>
          <Text style={styles.backspaceButtonText}>DELETE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.keyboardContainer}>
        {['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'].map(letter => (
          <TouchableOpacity
            key={letter}
            style={styles.key}
            onPress={() => handleLetterInput(letter)}
            disabled={gameOver}
          >
            <Text style={styles.keyText}>{letter}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {gameOver && (
        <View style={styles.gameOverBanner}>
          <Text style={styles.gameOverText}>Puzzle Complete!</Text>
        </View>
      )}

      <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.homeButtonText}>HOME</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cluesButton}
        onPress={() => setShowClueModal(true)}
      >
        <Text style={styles.cluesButtonText}>ALL CLUES</Text>
      </TouchableOpacity>

      <Modal
        visible={showClueModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClueModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Clues</Text>
            <ScrollView style={styles.cluesList}>
              <Text style={styles.directionLabel}>ACROSS</Text>
              {puzzle?.entries.filter(e => e.direction === 'across').map(entry => (
                <Text key={`across-${entry.number}`} style={styles.clueItem}>
                  {entry.number}. {entry.clue}
                </Text>
              ))}
              <Text style={styles.directionLabel}>DOWN</Text>
              {puzzle?.entries.filter(e => e.direction === 'down').map(entry => (
                <Text key={`down-${entry.number}`} style={styles.clueItem}>
                  {entry.number}. {entry.clue}
                </Text>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowClueModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const CELL_SIZE = 22;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  clueText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  gridContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  grid: {
    borderWidth: 2,
    borderColor: '#333',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  blackCell: {
    backgroundColor: '#333',
  },
  whiteCell: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#ccc',
  },
  selectedCell: {
    backgroundColor: '#DBEAFE',
  },
  cellNumber: {
    position: 'absolute',
    top: 1,
    left: 2,
    fontSize: 7,
    color: '#333',
  },
  cellLetter: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  filledLetter: {
    color: '#1a1a1a',
  },
  revealedLetter: {
    color: '#DC2626',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  directionButton: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  directionButtonText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#2563EB',
  },
  revealButton: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  revealButtonText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#D97706',
  },
  backspaceButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backspaceButtonText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#DC2626',
  },
  keyboardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
    gap: 4,
  },
  key: {
    width: 30,
    height: 36,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  keyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  gameOverBanner: {
    backgroundColor: '#D1FAE5',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  gameOverText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  homeButton: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 16,
  },
  homeButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  cluesButton: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  cluesButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#7C3AED',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    margin: 24,
    maxWidth: '90%',
    width: 340,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  cluesList: {
    maxHeight: 400,
  },
  directionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  clueItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  modalCloseButton: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginTop: 16,
  },
  modalCloseButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});