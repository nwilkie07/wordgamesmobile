import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { loadWords, getWords } from '../db/seed';
import { gameDb, setLastActiveGame } from '../db/games';
import { useAppNavigation, ScreenName } from '../context/NavigationContext';

type LetterState = 'correct' | 'present' | 'absent' | 'empty';

const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;

interface GuessRow {
  letters: string;
  states: LetterState[];
}

export default function WordGuessGameScreen({ route }: { route?: { params?: { gameId?: string } } }) {
  const { navigate } = useAppNavigation();
  const gameIdFromRoute = route?.params?.gameId;

  const [targetWord, setTargetWord] = useState<string>('');
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [won, setWon] = useState<boolean>(false);
  const [validWords, setValidWords] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [keyboardLayout] = useState<string[][]>([
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
  ]);

  const letterStates = useCallback((letter: string): LetterState => {
    if (!targetWord) return 'empty';
    for (const row of guesses) {
      for (let i = 0; i < row.letters.length; i++) {
        if (row.letters[i].toUpperCase() === letter.toUpperCase()) {
          return row.states[i];
        }
      }
    }
    return 'empty';
  }, [targetWord, guesses]);

  const initializeGame = useCallback(async () => {
    try {
      await loadWords();
      const allWords = getWords();
      console.log('Total words loaded:', allWords.length);
      const fiveLetterWords = allWords.filter((w: { word: string; length: number }) => w.length === WORD_LENGTH);
      console.log('Five letter words:', fiveLetterWords.length);
      const validSet = new Set<string>(fiveLetterWords.map((w: { word: string; length: number }) => w.word.toLowerCase()));
      console.log('Sample valid words:', [...validSet].slice(0, 10));
      setValidWords(validSet);

      const randomIndex = Math.floor(Math.random() * fiveLetterWords.length);
      const target = fiveLetterWords[randomIndex].word.toLowerCase();
      setTargetWord(target);
      setGuesses([]);
      setCurrentGuess('');
      setMessage('');
      setGameOver(false);
      setWon(false);

      if (gameIdFromRoute) {
        const savedGame = gameDb.wordguess.findById(gameIdFromRoute);
        if (savedGame) {
          const guessesParsed = JSON.parse(savedGame.guessesJson || '[]');
          setGuesses(guessesParsed);
          setGameOver(savedGame.completed);
          setWon(savedGame.won);
          setCurrentGameId(savedGame.id);
          setLoading(false);
          return;
        }
      }

      const newGame = await gameDb.wordguess.create({
        targetWord: target,
        guessesJson: '[]',
        completed: false,
        won: false,
      });
      setCurrentGameId(newGame.id);
      setLoading(false);
    } catch (e) {
      console.error('Failed to initialize game:', e);
      setMessage('Failed to load game');
      setLoading(false);
    }
  }, [gameIdFromRoute]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    if (currentGameId) {
      setLastActiveGame('wordguess', currentGameId);
    }
  }, [currentGameId]);

  const evaluateGuess = (guess: string, target: string): LetterState[] => {
    const states: LetterState[] = Array(WORD_LENGTH).fill('absent');
    const targetLetters = target.split('');
    const guessLetters = guess.toUpperCase().split('');
    const usedIndices = new Set<number>();

    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessLetters[i] === targetLetters[i]) {
        states[i] = 'correct';
        usedIndices.add(i);
      }
    }

    for (let i = 0; i < WORD_LENGTH; i++) {
      if (states[i] === 'correct') continue;
      for (let j = 0; j < WORD_LENGTH; j++) {
        if (usedIndices.has(j)) continue;
        if (guessLetters[i] === targetLetters[j]) {
          states[i] = 'present';
          usedIndices.add(j);
          break;
        }
      }
    }

    return states;
  };

  const handleSubmit = async () => {
    const guess = currentGuess.toLowerCase().trim();
    console.log('Submitting guess:', guess, 'targetWord:', targetWord);

    if (guess.length !== WORD_LENGTH) {
      setMessage(`Word must be ${WORD_LENGTH} letters`);
      return;
    }

    if (!validWords.has(guess)) {
      console.log('Invalid word, validWords size:', validWords.size);
      setMessage('Not a valid word');
      return;
    }

    const states = evaluateGuess(guess, targetWord);
    console.log('Evaluated states:', states);
    const newRow: GuessRow = { letters: guess.toUpperCase(), states };
    const newGuesses = [...guesses, newRow];
    console.log('New guesses:', newGuesses);
    setGuesses(newGuesses);
    setCurrentGuess('');

    if (guess === targetWord) {
      setWon(true);
      setGameOver(true);
      setMessage('🎉 Brilliant!');
      if (currentGameId) {
        await gameDb.wordguess.update(currentGameId, {
          guessesJson: JSON.stringify(newGuesses),
          completed: true,
          won: true,
        });
      }
    } else if (newGuesses.length >= MAX_ATTEMPTS) {
      setGameOver(true);
      setMessage(`The word was ${targetWord.toUpperCase()}`);
      if (currentGameId) {
        await gameDb.wordguess.update(currentGameId, {
          guessesJson: JSON.stringify(newGuesses),
          completed: true,
          won: false,
        });
      }
    } else {
      setMessage('');
    }
  };

  const handleKeyPress = (key: string) => {
    if (gameOver) return;

    if (key === 'ENTER') {
      handleSubmit();
    } else if (key === '⌫') {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (currentGuess.length < WORD_LENGTH) {
      setCurrentGuess((prev) => prev + key.toUpperCase());
    }
  };

  const handleNewGame = () => {
    initializeGame();
  };

  const handleBackToHome = () => {
    navigate('Home');
  };

  const getCellStyle = (state: LetterState) => {
    switch (state) {
      case 'correct':
        return styles.correctCell;
      case 'present':
        return styles.presentCell;
      case 'absent':
        return styles.absentCell;
      default:
        return styles.emptyCell;
    }
  };

  const getKeyStyle = (letter: string): LetterState => {
    return letterStates(letter);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>WordGuess</Text>
        <Text style={styles.subtitle}>Guess the word in {MAX_ATTEMPTS} tries</Text>
      </View>

      <View style={styles.messageContainer}>
        <Text style={[
          styles.messageText,
          message.includes('🎉') ? styles.successMessage :
          message.includes('The word') ? styles.failMessage : null
        ]}>
          {message}
        </Text>
      </View>

      <View style={styles.boardContainer}>
        {[...Array(MAX_ATTEMPTS)].map((_, rowIndex) => {
          const guessRow = rowIndex < guesses.length ? guesses[rowIndex] : null;
          const isCurrentRow = rowIndex === guesses.length && !gameOver;

          return (
            <View key={rowIndex} style={styles.row}>
              {[...Array(WORD_LENGTH)].map((_, colIndex) => {
                let letter = '';
                let state: LetterState = 'empty';

                if (guessRow) {
                  letter = guessRow.letters[colIndex] || '';
                  const cellState = guessRow.states ? guessRow.states[colIndex] : null;
                  state = cellState || 'empty';
                } else if (isCurrentRow && colIndex < currentGuess.length) {
                  letter = currentGuess[colIndex].toUpperCase();
                  state = 'empty';
                }

                const bgColor = state === 'correct' ? '#16A34A' : state === 'present' ? '#CA8A04' : state === 'absent' ? '#6B7280' : '#fff';
                const textColor = state !== 'empty' ? '#fff' : '#374151';
                const borderColor = state === 'empty' ? '#D1D5DB' : bgColor;

                return (
                  <View
                    key={colIndex}
                    style={{ backgroundColor: bgColor, borderColor, width: 52, height: 56, justifyContent: 'center', alignItems: 'center', borderRadius: 4, borderWidth: 2 }}
                  >
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: textColor }}>
                      {letter}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Current guess:</Text>
        <TextInput
          style={styles.textInput}
          value={currentGuess}
          onChangeText={setCurrentGuess}
          placeholder={`${WORD_LENGTH} letter word...`}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={WORD_LENGTH}
          editable={!gameOver}
        />
        <TouchableOpacity
          style={[styles.submitButton, currentGuess.length !== WORD_LENGTH && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={gameOver || currentGuess.length !== WORD_LENGTH}
        >
          <Text style={styles.submitButtonText}>SUBMIT</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.keyboardContainer}>
        {keyboardLayout.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keyboardRow}>
            {row.map((key) => {
              const state = getKeyStyle(key);
              const isSpecial = key === 'ENTER' || key === '⌫';
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.key,
                    isSpecial ? styles.specialKey : null,
                    state === 'correct' ? styles.correctKey :
                    state === 'present' ? styles.presentKey :
                    state === 'absent' ? styles.absentKey : null,
                  ]}
                  onPress={() => handleKeyPress(key)}
                  disabled={gameOver}
                >
                  <Text style={[styles.keyText, state !== 'empty' && styles.revealedKeyText]}>
                    {key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
          <Text style={styles.homeButtonText}>HOME</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.newGameButton} onPress={handleNewGame}>
          <Text style={styles.newGameButtonText}>NEW GAME</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  messageContainer: {
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '500',
  },
  successMessage: {
    color: '#16A34A',
  },
  failMessage: {
    color: '#DC2626',
  },
  boardContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  cell: {
    width: 52,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 2,
  },
  emptyCell: {
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  correctCell: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  presentCell: {
    backgroundColor: '#CA8A04',
    borderColor: '#CA8A04',
  },
  absentCell: {
    backgroundColor: '#6B7280',
    borderColor: '#6B7280',
  },
  cellText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
  },
  revealedCellText: {
    color: '#fff',
  },
  inputContainer: {
    marginTop: 24,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: 'center',
    width: 180,
    letterSpacing: 4,
  },
  submitButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#fff',
  },
  keyboardContainer: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
  },
  key: {
    minWidth: 32,
    height: 48,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D1D5DB',
    borderRadius: 4,
    marginHorizontal: 2,
  },
  specialKey: {
    minWidth: 56,
  },
  correctKey: {
    backgroundColor: '#16A34A',
  },
  presentKey: {
    backgroundColor: '#CA8A04',
  },
  absentKey: {
    backgroundColor: '#6B7280',
  },
  keyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  revealedKeyText: {
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  homeButton: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  homeButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  newGameButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newGameButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#fff',
  },
});