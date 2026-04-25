import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert } from 'react-native';
import { Hexagon } from '../components/Hexagon';
import { WordDistributionTable } from '../components/WordDistributionTable';
import { TwoLetterPrefixTable } from '../components/TwoLetterPrefixTable';
import { loadWords, getWords } from '../db/seed';
import { gameDb } from '../db/games';
import { useAppNavigation, ScreenName } from '../context/NavigationContext';
import { getDefinition } from '../lib/definitions';
import { loadClues, getClues } from '../lib/clues';

type RootStackParamList = {
  Home: undefined;
  PanagramGame: { gameId?: string };
  TargetGame: { gameId?: string };
};

type ValidWord = {
  word: string;
  isPangram: boolean;
  points: number;
};

const ACHIEVEMENT_THRESHOLDS = [
  { name: 'Beginner', points: 0 },
  { name: 'Good Start', points: 50 },
  { name: 'Moving Up', points: 100 },
  { name: 'Good', points: 150 },
  { name: 'Solid', points: 200 },
  { name: 'Nice', points: 250 },
  { name: 'Great', points: 300 },
  { name: 'Amazing', points: 350 },
  { name: 'Genius', points: 400 },
];

function generatePuzzle(allWords: { word: string; length: number }[]) {
  const sevenLetterWords = allWords.filter((w) => w.length === 7);
  if (sevenLetterWords.length === 0) return null;

  const uniqueSets = [
    ...new Set(
      sevenLetterWords.map((w) =>
        [...new Set(w.word.split(''))].sort().join(''),
      ),
    ),
  ].filter((s) => s.length === 7);
  if (uniqueSets.length === 0) return null;

  const randomSet = uniqueSets[Math.floor(Math.random() * uniqueSets.length)];
  const lettersSet = new Set(randomSet.split(''));
  const letters = randomSet.split('');
  const centerLetter = letters[Math.floor(Math.random() * letters.length)];

  const validWords: ValidWord[] = [];
  for (const w of allWords) {
    if (w.length < 4) continue;
    const wordLetters = new Set(w.word.split(''));
    if ([...wordLetters].some((l) => !lettersSet.has(l))) continue;
    if (!w.word.includes(centerLetter)) continue;

    const isPangram = wordLetters.size === 7;
    const points = w.length === 4 ? 1 : w.length + (isPangram ? 7 : 0);
    validWords.push({ word: w.word, isPangram, points });
  }

  if (validWords.length < 15) return null;

  return { letters: randomSet, centerLetter, validWords };
}

export default function PanagramGameScreen({ route }: { route?: any, navigation?: any }) {
  const { navigate } = useAppNavigation();
  const gameIdFromRoute = route?.params?.gameId;

  const [puzzle, setPuzzle] = useState<{
    letters: string;
    centerLetter: string;
    validWords: ValidWord[];
  } | null>(null);
  const [validWords, setValidWords] = useState<Map<string, ValidWord>>(new Map());
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [currentInput, setCurrentInput] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [definitionModalVisible, setDefinitionModalVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<string | null>(null);
  const [definitionLoading, setDefinitionLoading] = useState(false);

  const loadOrCreateGame = useCallback(async () => {
    await loadWords();
    const allWords = getWords();

    if (gameIdFromRoute) {
      const savedGame = gameDb.panagram.findById(gameIdFromRoute);

      if (savedGame) {
        const foundWordsParsed = JSON.parse(savedGame.foundWordsJson || '[]');
        setFoundWords(new Set(foundWordsParsed));

        const lettersSet = new Set(savedGame.letters.split(''));
        const validWordsList: ValidWord[] = [];
        for (const w of allWords) {
          if (w.length < 4) continue;
          const wordLetters = new Set(w.word.split(''));
          if ([...wordLetters].some((l) => !lettersSet.has(l))) continue;
          if (!w.word.includes(savedGame.centerLetter)) continue;

          const isPangram = wordLetters.size === 7;
          const points = w.length === 4 ? 1 : w.length + (isPangram ? 7 : 0);
          validWordsList.push({ word: w.word, isPangram, points });
        }

        setPuzzle({
          letters: savedGame.letters,
          centerLetter: savedGame.centerLetter,
          validWords: validWordsList,
        });
        const wordMap = new Map<string, ValidWord>();
        for (const w of validWordsList) wordMap.set(w.word.toLowerCase(), w);
        setValidWords(wordMap);
        setCurrentGameId(gameIdFromRoute);
        setLoading(false);
        return;
      }
    }

    const newPuzzle = generatePuzzle(allWords);
    if (newPuzzle) {
      setPuzzle(newPuzzle);
      const wordMap = new Map<string, ValidWord>();
      for (const w of newPuzzle.validWords)
        wordMap.set(w.word.toLowerCase(), w);
      setValidWords(wordMap);

      const newGame = await gameDb.panagram.create({
        letters: newPuzzle.letters,
        centerLetter: newPuzzle.centerLetter,
        foundWordsJson: '[]',
        score: 0,
        completed: false,
      });

      setCurrentGameId(newGame.id);
    }

    setLoading(false);
  }, [gameIdFromRoute]);

  useEffect(() => {
    loadOrCreateGame();
  }, [loadOrCreateGame]);

  const saveGame = useCallback(
    async (words: Set<string>, score: number, completed = false) => {
      if (!currentGameId) return;
      await gameDb.panagram.update(currentGameId, {
        foundWordsJson: JSON.stringify([...words]),
        score,
        completed,
      });
    },
    [currentGameId],
  );

  const displayLetters = useMemo(() => {
    if (!puzzle) return [];
    const letters = puzzle.letters.split('');
    const center = puzzle.centerLetter;
    const withoutCenter = letters.filter((l) => l !== center);
    return [...withoutCenter.slice(0, 3), center, ...withoutCenter.slice(3)];
  }, [puzzle]);

  const handleTileClick = (letter: string) => {
    setCurrentInput((prev) => prev + letter);
    setMessage('');
  };

  const handleDelete = () => {
    setCurrentInput((prev) => prev.slice(0, -1));
    setMessage('');
  };

  const handleShuffle = () => {
    if (!puzzle) return;
    const letters = puzzle.letters.split('').filter((l) => l !== puzzle.centerLetter);
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    setPuzzle((prev) =>
      prev ? { ...prev, letters: letters.join('') + prev.centerLetter } : null,
    );
  };

  const calculateScore = useCallback(() => {
    let score = 0;
    for (const word of foundWords) {
      const wordData = validWords.get(word);
      if (wordData) score += wordData.points;
    }
    return score;
  }, [foundWords, validWords]);

  const getCurrentAchievement = () => {
    const score = calculateScore();
    let achievement = ACHIEVEMENT_THRESHOLDS[0];
    for (const threshold of ACHIEVEMENT_THRESHOLDS) {
      if (score >= threshold.points) achievement = threshold;
    }
    return achievement;
  };

  const handleSubmit = () => {
    const word = currentInput.toLowerCase().trim();
    if (word.length < 4) setMessage('Too short');
    else if (!word.includes(puzzle?.centerLetter.toLowerCase() || ''))
      setMessage('Missing center letter');
    else if (!validWords.has(word)) setMessage('Not in word list');
    else if (foundWords.has(word)) setMessage('Already found');
    else {
      const wordData = validWords.get(word);
      if (!wordData) return;
      setMessage(
        `+${wordData.points} point${wordData.points > 1 ? 's' : ''}${
          wordData.isPangram ? ' PANGRAM!' : ''
        }`,
      );
      const newFoundWords = new Set([...foundWords, word]);
      setFoundWords(newFoundWords);
      saveGame(newFoundWords, calculateScore() + wordData.points);
    }
    setCurrentInput('');
  };

  const handleBackToHome = () => {
    navigate('Home' as ScreenName);
  };

  const handleWordPress = async (word: string) => {
    setSelectedWord(word);
    setDefinition(null);
    setDefinitionModalVisible(true);
    setDefinitionLoading(true);
    try {
      const def = await getDefinition(word);
      setDefinition(def);
    } catch {
      setDefinition(null);
    }
    setDefinitionLoading(false);
  };

  const score = calculateScore();
  const achievement = getCurrentAchievement();
  const achievementIndex = ACHIEVEMENT_THRESHOLDS.indexOf(achievement);

  const maxScore = useMemo(() => {
    let total = 0;
    for (const w of validWords.values()) total += w.points;
    return total;
  }, [validWords]);

  const handleShowClue = async () => {
    await loadClues();
    const unfoundWords = Array.from(validWords.keys()).filter(
      (w) => !foundWords.has(w),
    );
    if (unfoundWords.length === 0) {
      setMessage('No unfound words!');
      return;
    }
    const word = unfoundWords[Math.floor(Math.random() * unfoundWords.length)];
    const clues = getClues(word);
    if (clues && clues.length > 0) {
      const clue = clues[Math.floor(Math.random() * clues.length)];
      setMessage(`${word.slice(0, 2).toUpperCase()}: ${clue} (${word.length} Letters)`);
    } else {
      setMessage('No clue found, try again!');
    }
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  if (!puzzle)
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No puzzle available</Text>
      </View>
    );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.wordCount}>
          {foundWords.size}/{validWords.size} words
        </Text>
        <Text style={styles.score}>Score: {score}</Text>
        <Text style={styles.maxScore}>Max: {maxScore}</Text>
      </View>

      <View style={styles.achievementContainer}>
        <View style={styles.achievementBar}>
          {ACHIEVEMENT_THRESHOLDS.map((threshold, i) => (
            <View
              key={threshold.name}
              style={[
                styles.achievementSegment,
                i <= achievementIndex ? styles.achievementActive : null,
              ]}
            />
          ))}
        </View>
        <Text style={styles.achievementName}>{achievement.name}</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={[
          styles.inputText,
          message.includes('+') ? styles.successInput : null,
        ]}>
          {message || currentInput.toUpperCase()}
        </Text>
      </View>

      <View style={styles.hexagonContainer}>
        <View style={styles.hexagonRow}>
          <Hexagon letter={displayLetters[0]} index={0} onClick={() => handleTileClick(displayLetters[0])} />
          <Hexagon letter={displayLetters[1]} index={1} onClick={() => handleTileClick(displayLetters[1])} />
        </View>
        <View style={styles.hexagonRow}>
          <Hexagon letter={displayLetters[2]} index={2} onClick={() => handleTileClick(displayLetters[2])} />
          <Hexagon letter={displayLetters[3]} index={3} isCenter onClick={() => handleTileClick(displayLetters[3])} />
          <Hexagon letter={displayLetters[4]} index={4} onClick={() => handleTileClick(displayLetters[4])} />
        </View>
        <View style={styles.hexagonRow}>
          <Hexagon letter={displayLetters[5]} index={5} onClick={() => handleTileClick(displayLetters[5])} />
          <Hexagon letter={displayLetters[6]} index={6} onClick={() => handleTileClick(displayLetters[6])} />
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShuffle}>
          <Text style={styles.actionButtonText}>SHUFFLE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
          <Text style={styles.actionButtonText}>DEL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.submitButton]} onPress={handleSubmit}>
          <Text style={styles.actionButtonText}>SUBMIT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.homeButton]} onPress={handleBackToHome}>
          <Text style={styles.actionButtonText}>HOME</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.hintButton} onPress={handleShowClue}>
        <Text style={styles.hintButtonText}>SHOW CLUE</Text>
      </TouchableOpacity>

      <View style={styles.foundWordsContainer}>
        <View style={styles.foundWords}>
          {[...foundWords].sort((a, b) => a.localeCompare(b)).map((word) => {
            const wordData = validWords.get(word);
            return (
              <TouchableOpacity
                key={word}
                onPress={() => handleWordPress(word)}
                style={[
                  styles.foundWordBadge,
                  wordData?.isPangram ? styles.pangramBadge : null,
                ]}
              >
                <Text style={[
                  styles.foundWordText,
                  wordData?.isPangram ? styles.pangramText : null,
                ]}>
                  {word.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Modal
        visible={definitionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDefinitionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedWord?.toUpperCase()}</Text>
            {definitionLoading && <Text style={styles.modalDefinition}>Loading...</Text>}
            {definition && <Text style={styles.modalDefinition}>{definition}</Text>}
            {!definitionLoading && !definition && (
              <Text style={styles.modalDefinition}>No definition found</Text>
            )}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setDefinitionModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {currentGameId && (
        <Text style={styles.gameIdText}>Game ID: {currentGameId.slice(0, 8)}...</Text>
      )}

      {puzzle && validWords.size > 0 && (
        <WordDistributionTable
          letters={puzzle.letters}
          centerLetter={puzzle.centerLetter}
          validWords={Array.from(validWords.values())}
        />
      )}

      {puzzle && validWords.size > 0 && (
        <TwoLetterPrefixTable validWords={Array.from(validWords.values())} />
      )}
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
  wordCount: {
    fontSize: 14,
    color: '#666',
  },
  score: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  maxScore: {
    fontSize: 14,
    color: '#666',
  },
  achievementContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 16,
  },
  achievementBar: {
    flexDirection: 'row',
    gap: 4,
  },
  achievementSegment: {
    width: 30,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  achievementActive: {
    backgroundColor: '#FCD34D',
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  inputContainer: {
    minHeight: 48,
    minWidth: 192,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  inputText: {
    fontSize: 18,
    fontWeight: '500',
  },
  successInput: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  hexagonContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  hexagonRow: {
    flexDirection: 'row',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    flexWrap: 'wrap',
  },
  actionButton: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitButton: {
    backgroundColor: '#FFEDD5',
  },
  homeButton: {
    backgroundColor: '#E5E7EB',
  },
  hintButton: {
    backgroundColor: '#9333EA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
  },
  hintButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  actionButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  foundWordsContainer: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  foundWords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  foundWordBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  pangramBadge: {
    backgroundColor: '#FCD34D',
  },
  foundWordText: {
    fontSize: 12,
    color: '#374151',
  },
  pangramText: {
    fontWeight: 'bold',
    color: '#000',
  },
  gameIdText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 16,
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
    maxWidth: '80%',
    width: 300,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2563EB',
  },
  modalDefinition: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalCloseButton: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});