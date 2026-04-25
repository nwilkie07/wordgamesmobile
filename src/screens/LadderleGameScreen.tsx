import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { loadWords, getWords } from '../db/seed';
import { gameDb } from '../db/games';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  LadderleGame: { gameId?: string };
  LadderleHistory: undefined;
};

const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;

export default function LadderleGameScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'LadderleGame'>>();
  const gameIdFromRoute = route.params?.gameId;

  const [targetWord, setTargetWord] = useState<string>('');
  const [attempts, setAttempts] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [message, setMessage] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [validWords, setValidWords] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);

  const initializeGame = useCallback(async () => {
    await loadWords();
    const allWords = getWords();
    const fiveLetterWords = allWords.filter((w) => w.length === WORD_LENGTH);
    const validSet = new Set<string>(fiveLetterWords.map((w) => w.word.toLowerCase()));
    setValidWords(validSet);

    if (gameIdFromRoute) {
      const savedGame = gameDb.ladderle.findById(gameIdFromRoute);
      if (savedGame) {
        setTargetWord(savedGame.targetWord);
        setAttempts(JSON.parse(savedGame.attemptsJson || '[]'));
        setGameOver(savedGame.completed);
        setWon(savedGame.won);
        setCurrentGameId(gameIdFromRoute);
        if (savedGame.completed) {
          setMessage(savedGame.won ? '🎉 Brilliant!' : `The word was ${savedGame.targetWord.toUpperCase()}`);
        }
        setLoading(false);
        return;
      }
    }

    const randomIndex = Math.floor(Math.random() * fiveLetterWords.length);
    const target = fiveLetterWords[randomIndex].word.toLowerCase();
    setTargetWord(target);

    const newGame = await gameDb.ladderle.create({
      targetWord: target,
      attemptsJson: '[]',
      completed: false,
      won: false,
    });
    setCurrentGameId(newGame.id);
    setLoading(false);
  }, [gameIdFromRoute]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const getSharedLetters = (word1: string, word2: string): boolean[] => {
    return word1.split('').map((letter, i) => letter === word2[i]);
  };

  const validateAttempt = (newWord: string, prevWord: string | null): { valid: boolean; message: string } => {
    if (newWord.length !== WORD_LENGTH) {
      return { valid: false, message: `Word must be ${WORD_LENGTH} letters` };
    }
    if (!validWords.has(newWord.toLowerCase())) {
      return { valid: false, message: 'Not a valid word' };
    }
    if (prevWord) {
      let diffCount = 0;
      let hasSharedLetter = false;
      for (let i = 0; i < WORD_LENGTH; i++) {
        if (newWord[i] !== prevWord[i]) {
          diffCount++;
        } else {
          hasSharedLetter = true;
        }
      }
      if (diffCount === 0) {
        return { valid: false, message: 'Same word, change a letter' };
      }
      if (diffCount !== 1) {
        return { valid: false, message: 'Change exactly one letter' };
      }
      if (!hasSharedLetter) {
        return { valid: false, message: 'Must share a letter with previous word' };
      }
    }
    return { valid: true, message: '' };
  };

  const handleSubmit = async () => {
    const word = currentInput.toLowerCase().trim();
    const prevWord = attempts.length > 0 ? attempts[attempts.length - 1] : null;
    const validation = validateAttempt(word, prevWord);

    if (!validation.valid) {
      setMessage(validation.message);
      return;
    }

    const newAttempts = [...attempts, word];
    setAttempts(newAttempts);
    setCurrentInput('');

    let wonGame = false;
    let completed = false;
    let msg = '';

    if (word === targetWord) {
      wonGame = true;
      completed = true;
      msg = '🎉 Brilliant!';
    } else if (newAttempts.length >= MAX_ATTEMPTS) {
      completed = true;
      msg = `The word was ${targetWord.toUpperCase()}`;
    }

    setWon(wonGame);
    setGameOver(completed);
    setMessage(msg);

    if (currentGameId) {
      await gameDb.ladderle.update(currentGameId, {
        attemptsJson: JSON.stringify(newAttempts),
        completed,
        won: wonGame,
      });
    }
  };

  const handleNewPuzzle = async () => {
    await loadWords();
    const allWords = getWords();
    const fiveLetterWords = allWords.filter((w) => w.length === WORD_LENGTH);
    const randomIndex = Math.floor(Math.random() * fiveLetterWords.length);
    const target = fiveLetterWords[randomIndex].word.toLowerCase();

    setTargetWord(target);
    setAttempts([]);
    setCurrentInput('');
    setMessage('');
    setGameOver(false);
    setWon(false);

    const newGame = await gameDb.ladderle.create({
      targetWord: target,
      attemptsJson: '[]',
      completed: false,
      won: false,
    });
    setCurrentGameId(newGame.id);
  };

  const handleBackToHome = () => {
    navigation.navigate('Home');
  };

  const handleDelete = () => {
    setCurrentInput((prev) => prev.slice(0, -1));
    setMessage('');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Word Ladderle</Text>
        <Text style={styles.subtitle}>Change one letter at a time. Share a letter in the same spot.</Text>
        <Text style={styles.attempts}>{attempts.length}/{MAX_ATTEMPTS} attempts</Text>
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

      <View style={styles.targetHint}>
        <Text style={styles.targetHintText}>Target: {targetWord[0].toUpperCase()}{'_'.repeat(WORD_LENGTH - 1)}</Text>
        <Text style={styles.targetHintSubtext}>Find the path to this word</Text>
      </View>

      <View style={styles.ladderContainer}>
        {attempts.map((word, index) => {
          const sharedPositions = index > 0 ? getSharedLetters(word, attempts[index - 1]) : null;
          return (
            <View key={index} style={styles.attemptRow}>
              <Text style={styles.attemptIndex}>{index + 1}</Text>
              <View style={styles.letterRow}>
                {word.split('').map((letter, letterIndex) => {
                  const isTarget = targetWord[letterIndex] === letter;
                  const isShared = sharedPositions ? sharedPositions[letterIndex] : false;
                  return (
                    <View
                      key={letterIndex}
                      style={[
                        styles.letterBox,
                        isTarget ? styles.correctLetter :
                        isShared ? styles.sharedLetter : styles.wrongLetter
                      ]}
                    >
                      <Text style={[
                        styles.letterText,
                        (isTarget || isShared) ? styles.correctLetterText : null
                      ]}>
                        {letter.toUpperCase()}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        {!gameOver && (
          <View style={styles.attemptRow}>
            <Text style={styles.attemptIndex}>{attempts.length + 1}</Text>
            <View style={styles.letterRow}>
              {currentInput.split('').map((letter, index) => (
                <View key={index} style={[styles.letterBox, styles.currentLetter]}>
                  <Text style={styles.letterText}>{letter.toUpperCase()}</Text>
                </View>
              ))}
              {[...Array(WORD_LENGTH - currentInput.length)].map((_, index) => (
                <View key={`empty-${index}`} style={[styles.letterBox, styles.emptyLetter]}>
                  <Text style={styles.letterText}>_</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Type your word:</Text>
        <TextInput
          style={styles.textInput}
          value={currentInput}
          onChangeText={setCurrentInput}
          placeholder={`${WORD_LENGTH} letter word...`}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={WORD_LENGTH}
          editable={!gameOver}
        />
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDelete}
          disabled={gameOver}
        >
          <Text style={styles.actionButtonText}>DELETE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.submitButton]}
          onPress={handleSubmit}
          disabled={gameOver || currentInput.length !== WORD_LENGTH}
        >
          <Text style={styles.actionButtonText}>SUBMIT</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
        <Text style={styles.homeButtonText}>HOME</Text>
      </TouchableOpacity>

      {!gameOver && (
        <TouchableOpacity style={styles.newGameButton} onPress={handleNewPuzzle}>
          <Text style={styles.newGameButtonText}>NEW PUZZLE</Text>
        </TouchableOpacity>
      )}

      <View style={styles.rulesContainer}>
        <Text style={styles.rulesTitle}>Rules</Text>
        <Text style={styles.rulesText}>
          1. Each step changes exactly one letter{'\n'}
          2. The new word must be valid{'\n'}
          3. Must share a letter in the same position{'\n'}
          4. Use {MAX_ATTEMPTS} attempts to reach the target
        </Text>
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
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  attempts: {
    fontSize: 16,
    color: '#2563EB',
    marginTop: 8,
    fontWeight: '600',
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
  targetHint: {
    alignItems: 'center',
    marginTop: 16,
  },
  targetHintText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  targetHintSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  ladderContainer: {
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  attemptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attemptIndex: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
    width: 20,
  },
  letterRow: {
    flexDirection: 'row',
    gap: 4,
  },
  letterBox: {
    width: 40,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 2,
  },
  currentLetter: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  emptyLetter: {
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  correctLetter: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  sharedLetter: {
    backgroundColor: '#FCD34D',
    borderColor: '#FCD34D',
  },
  wrongLetter: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  letterText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  correctLetterText: {
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
    width: 200,
    letterSpacing: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButton: {
    backgroundColor: '#FFEDD5',
  },
  actionButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
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
  newGameButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 16,
  },
  newGameButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#fff',
  },
  rulesContainer: {
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rulesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});