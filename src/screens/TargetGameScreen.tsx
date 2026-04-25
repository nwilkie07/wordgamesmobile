import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { Tile } from '../components/Tile';
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
  isTargetWord: boolean;
};

const ACHIEVEMENT_THRESHOLDS = [
  { name: 'Beginner', words: 0 },
  { name: 'Good Start', words: 5 },
  { name: 'Moving Up', words: 10 },
  { name: 'Good', words: 15 },
  { name: 'Solid', words: 20 },
  { name: 'Nice', words: 25 },
  { name: 'Great', words: 30 },
  { name: 'Amazing', words: 35 },
  { name: 'Genius', words: 40 },
];

function generateTargetPuzzle(allWords: { word: string; length: number }[]) {
  const nineLetterWords = allWords.filter((w) => w.length === 9);
  if (nineLetterWords.length === 0) return null;

  const uniqueSets: { letters: string; letterCounts: Record<string, number> }[] = [];
  const seen = new Set<string>();

  for (const w of nineLetterWords) {
    const unique = [...new Set(w.word.split(''))].sort().join('');
    if (unique.length !== 9 || seen.has(unique)) continue;
    seen.add(unique);

    const counts: Record<string, number> = {};
    for (const c of w.word.split('')) counts[c] = (counts[c] || 0) + 1;
    uniqueSets.push({ letters: unique, letterCounts: counts });
  }

  if (uniqueSets.length === 0) return null;

  const selected = uniqueSets[Math.floor(Math.random() * uniqueSets.length)];
  const lettersSet = new Set(selected.letters.split(''));
  const letters = selected.letters.split('');
  const centerLetter = letters[Math.floor(Math.random() * letters.length)];

  const validWords: ValidWord[] = [];
  let targetWord: string | null = null;

  for (const w of allWords) {
    if (w.length < 4) continue;
    const wordLetters = new Set(w.word.split(''));
    if ([...wordLetters].some((l) => !lettersSet.has(l))) continue;
    if (!w.word.includes(centerLetter)) continue;

    const wordCounts: Record<string, number> = {};
    for (const c of w.word.split('')) wordCounts[c] = (wordCounts[c] || 0) + 1;
    let canForm = true;
    for (const [c, cnt] of Object.entries(wordCounts)) {
      if (!selected.letterCounts[c] || selected.letterCounts[c] < cnt) {
        canForm = false;
        break;
      }
    }
    if (!canForm) continue;

    const isTargetWord = w.length === 9 && wordLetters.size === 9;
    if (isTargetWord) targetWord = w.word;
    validWords.push({ word: w.word, isTargetWord });
  }

  if (validWords.length < 20 || !targetWord) return null;

  return {
    letters: selected.letters,
    centerLetter,
    letterCounts: selected.letterCounts,
    validWords,
    targetWord,
  };
}

export default function TargetGameScreen({ route }: { route?: any, navigation?: any }) {
  const { navigate } = useAppNavigation();
  const gameIdFromRoute = route?.params?.gameId;

  const [puzzle, setPuzzle] = useState<{
    letters: string;
    centerLetter: string;
    letterCounts: Record<string, number>;
    validWords: ValidWord[];
    targetWord: string;
  } | null>(null);
  const [validWords, setValidWords] = useState<Map<string, ValidWord>>(new Map());
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [currentInput, setCurrentInput] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [definitionModalVisible, setDefinitionModalVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<string | null>(null);
  const [definitionLoading, setDefinitionLoading] = useState(false);

  const loadOrCreateGame = useCallback(async () => {
    await loadWords();
    const allWords = getWords();

    if (gameIdFromRoute) {
      const savedGame = gameDb.target.findById(gameIdFromRoute);

      if (savedGame) {
        const foundWordsParsed = JSON.parse(savedGame.foundWordsJson || '[]');
        setFoundWords(new Set(foundWordsParsed));

        const lettersSet = new Set(savedGame.letters.split(''));
        const letterCounts = JSON.parse(savedGame.letterCounts);
        const validWordsList: ValidWord[] = [];

        for (const w of allWords) {
          if (w.length < 4) continue;
          const wordLetters = new Set(w.word.split(''));
          if ([...wordLetters].some((l) => !lettersSet.has(l))) continue;
          if (!w.word.includes(savedGame.centerLetter)) continue;

          const wordCounts: Record<string, number> = {};
          for (const c of w.word.split(''))
            wordCounts[c] = (wordCounts[c] || 0) + 1;
          let canForm = true;
          for (const [c, cnt] of Object.entries(wordCounts)) {
            if (!letterCounts[c] || letterCounts[c] < cnt) {
              canForm = false;
              break;
            }
          }
          if (!canForm) continue;

          validWordsList.push({
            word: w.word,
            isTargetWord: w.length === 9 && wordLetters.size === 9,
          });
        }

        setPuzzle({
          letters: savedGame.letters,
          centerLetter: savedGame.centerLetter,
          letterCounts,
          validWords: validWordsList,
          targetWord: validWordsList.find((w) => w.isTargetWord)?.word || '',
        });
        const wordMap = new Map<string, ValidWord>();
        for (const w of validWordsList) wordMap.set(w.word.toLowerCase(), w);
        setValidWords(wordMap);
        setCurrentGameId(gameIdFromRoute);
        setLoading(false);
        return;
      }
    }

    const newPuzzle = generateTargetPuzzle(allWords);
    if (newPuzzle) {
      setPuzzle(newPuzzle);
      const wordMap = new Map<string, ValidWord>();
      for (const w of newPuzzle.validWords)
        wordMap.set(w.word.toLowerCase(), w);
      setValidWords(wordMap);

      const newGame = await gameDb.target.create({
        letters: newPuzzle.letters,
        centerLetter: newPuzzle.centerLetter,
        letterCounts: JSON.stringify(newPuzzle.letterCounts),
        foundWordsJson: '[]',
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
    async (words: Set<string>, completed = false) => {
      if (!currentGameId) return;
      await gameDb.target.update(currentGameId, {
        foundWordsJson: JSON.stringify([...words]),
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
    return [...withoutCenter.slice(0, 4), center, ...withoutCenter.slice(4, 8)];
  }, [puzzle]);

  const handleTileClick = (letter: string, index: number) => {
    setCurrentInput((prev) => prev + letter);
    setUsedIndices((prev) => new Set(prev).add(index));
    setMessage('');
  };

  const handleDelete = () => {
    setCurrentInput((prev) => prev.slice(0, -1));
    setUsedIndices((prev) => {
      const newUsed = new Set(prev);
      const lastIndex = [...prev].pop();
      if (lastIndex !== undefined) newUsed.delete(lastIndex);
      return newUsed;
    });
    setMessage('');
  };

  const handleShuffle = () => {
    if (!puzzle) return;
    const letters = displayLetters.filter((l) => l !== puzzle.centerLetter);
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    setPuzzle((prev) =>
      prev
        ? {
            ...prev,
            letters:
              letters.slice(0, 3).join('') +
              prev.centerLetter +
              letters.slice(3, 8).join(''),
          }
        : null,
    );
  };

  const getCurrentAchievement = () => {
    let achievement = ACHIEVEMENT_THRESHOLDS[0];
    for (const threshold of ACHIEVEMENT_THRESHOLDS) {
      if (foundWords.size >= threshold.words) achievement = threshold;
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
      const isTarget = wordData.isTargetWord;
      setMessage(
        isTarget
          ? 'TARGET WORD!'
          : `+1 word${word.length === 9 ? ' (9 letters!)' : ''}`,
      );
      const newFoundWords = new Set([...foundWords, word]);
      setFoundWords(newFoundWords);
      saveGame(newFoundWords, newFoundWords.size === validWords.size);
    }
    setCurrentInput('');
    setUsedIndices(new Set());
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

  const achievement = getCurrentAchievement();
  const achievementIndex = ACHIEVEMENT_THRESHOLDS.indexOf(achievement);

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
        <Text style={styles.title}>Find the Target Word</Text>
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
          message.includes('TARGET') ? styles.targetInput :
          message.includes('+') ? styles.successInput : null,
        ]}>
          {message || currentInput.toUpperCase()}
        </Text>
      </View>

      <View style={styles.tilesContainer}>
        <View style={styles.tilesRow}>
          {displayLetters.slice(0, 3).map((letter, i) => (
            <Tile
              key={i}
              letter={letter}
              index={i}
              onClick={() => handleTileClick(letter, i)}
              disabled={usedIndices.has(i)}
            />
          ))}
        </View>
        <View style={styles.tilesRow}>
          {displayLetters.slice(3, 6).map((letter, i) => (
            <Tile
              key={i + 3}
              letter={letter}
              index={i + 3}
              onClick={() => handleTileClick(letter, i + 3)}
              isCenter={i === 1}
              disabled={usedIndices.has(i + 3)}
            />
          ))}
        </View>
        <View style={styles.tilesRow}>
          {displayLetters.slice(6, 9).map((letter, i) => (
            <Tile
              key={i + 6}
              letter={letter}
              index={i + 6}
              onClick={() => handleTileClick(letter, i + 6)}
              disabled={usedIndices.has(i + 6)}
            />
          ))}
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShuffle}>
          <Text style={styles.actionButtonText}>SHUFFLE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
          <Text style={styles.actionButtonText}>DELETE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.submitButton]} onPress={handleSubmit}>
          <Text style={styles.actionButtonText}>SUBMIT</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
        <Text style={styles.actionButtonText}>HOME</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.hintButton} onPress={handleShowClue}>
        <Text style={styles.hintButtonText}>SHOW CLUE</Text>
      </TouchableOpacity>

      {foundWords.size > 0 && (
        <View style={styles.foundWordsContainer}>
          <Text style={styles.foundWordsTitle}>Found Words</Text>
          <View style={styles.foundWords}>
            {[...foundWords].sort((a, b) => a.localeCompare(b)).map((word) => (
              <TouchableOpacity
                key={word}
                style={styles.foundWordBadge}
                onPress={() => handleWordPress(word)}
              >
                <Text style={styles.foundWordText}>{word.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
    backgroundColor: '#FB923C',
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
  targetInput: {
    borderColor: '#FCD34D',
    backgroundColor: '#FEF9C3',
  },
  tilesContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  tilesRow: {
    flexDirection: 'row',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 16,
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
  gameIdText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 16,
  },
  foundWordsContainer: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  foundWordsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  foundWords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  foundWordBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  foundWordText: {
    fontSize: 12,
    color: '#374151',
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