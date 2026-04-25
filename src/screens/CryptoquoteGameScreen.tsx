import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useAppNavigation, ScreenName } from '../context/NavigationContext';
import { gameDb, type CryptoquoteGame } from '../db/games';
import { initQuotesDatabase, getRandomQuote } from '../db/quotes';

type RootStackParamList = {
  Home: undefined;
  CryptoquoteGame: { gameId?: string };
  CryptoquoteHistory: undefined;
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface CipherMap {
  [key: string]: string;
}

interface DecryptedMap {
  [key: string]: string;
}

export default function CryptoquoteGameScreen({ route }: { route?: any, navigation?: any }) {
  const { navigate } = useAppNavigation();
  const gameIdFromRoute = route?.params?.gameId;

  const [quote, setQuote] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [cipherMap, setCipherMap] = useState<CipherMap>({});
  const [decryptedMap, setDecryptedMap] = useState<DecryptedMap>({});
  const [selectedCipher, setSelectedCipher] = useState<string | null>(null);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthor, setShowAuthor] = useState(false);

  const getAllLetters = useCallback((q: string): string[] => {
    const letters = new Set<string>();
    for (const char of q.toUpperCase()) {
      if (char >= 'A' && char <= 'Z') {
        letters.add(char);
      }
    }
    return Array.from(letters);
  }, []);

  const createCipher = useCallback((plainQuote: string): { cipher: string; author: string; cipherMap: CipherMap } => {
    const letters = getAllLetters(plainQuote);
    const shuffled = [...letters].sort(() => Math.random() - 0.5);
    const map: CipherMap = {};
    letters.forEach((letter, index) => {
      map[letter] = shuffled[index];
    });

    let cipher = '';
    for (const char of plainQuote.toUpperCase()) {
      if (char >= 'A' && char <= 'Z') {
        cipher += map[char];
      } else {
        cipher += char;
      }
    }

    return { cipher, author: '', cipherMap: map };
  }, [getAllLetters]);

  const initializeGame = useCallback(async () => {
    try {
      await initQuotesDatabase();
      const quoteData = await getRandomQuote();
      if (!quoteData) {
        Alert.alert('Error', 'No quotes available');
        navigate('Home' as ScreenName);
        return;
      }

      const { quote: randomQuote, author: quoteAuthor } = quoteData;

      if (gameIdFromRoute) {
        const savedGame = gameDb.cryptoquote.findById(gameIdFromRoute);
        if (savedGame) {
          setQuote(savedGame.encryptedQuote);
          setAuthor(savedGame.author || '');
          setCipherMap(JSON.parse(savedGame.cipherMapJson || '{}'));
          setDecryptedMap(JSON.parse(savedGame.decryptedMapJson || '{}'));
          setCurrentGameId(gameIdFromRoute);
          setShowAuthor(savedGame.completed || false);
          setLoading(false);
          return;
        }
      }

      const { cipher, cipherMap: newCipherMap } = createCipher(randomQuote);

      setQuote(cipher);
      setAuthor(quoteAuthor);
      setCipherMap(newCipherMap);
      setDecryptedMap({});

      const newGame = await gameDb.cryptoquote.create({
        encryptedQuote: cipher,
        decryptedQuote: randomQuote,
        author: quoteAuthor,
        cipherMapJson: JSON.stringify(newCipherMap),
        decryptedMapJson: '{}',
        completed: false,
      });
      setCurrentGameId(newGame.id);
    } catch (e) {
      console.error('Failed to initialize game:', e);
      Alert.alert('Error', 'Failed to load game');
    }
    setLoading(false);
  }, [gameIdFromRoute, createCipher]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const handleKeyPress = (cipherLetter: string, decryptedLetter: string) => {
    if (!selectedCipher) return;

    const newDecryptedMap = { ...decryptedMap };
    const oldDecrypted = newDecryptedMap[selectedCipher];

    if (oldDecrypted) {
      delete newDecryptedMap[selectedCipher];
    }

    for (const [key, value] of Object.entries(newDecryptedMap)) {
      if (value === decryptedLetter) {
        delete newDecryptedMap[key];
      }
    }

    newDecryptedMap[selectedCipher] = decryptedLetter;
    setDecryptedMap(newDecryptedMap);
    setSelectedCipher(null);

    if (currentGameId) {
      gameDb.cryptoquote.update(currentGameId, {
        decryptedMapJson: JSON.stringify(newDecryptedMap),
      });
    }
  };

  const handleClearLetter = (cipherLetter: string) => {
    const newDecryptedMap = { ...decryptedMap };
    delete newDecryptedMap[cipherLetter];
    setDecryptedMap(newDecryptedMap);

    if (currentGameId) {
      gameDb.cryptoquote.update(currentGameId, {
        decryptedMapJson: JSON.stringify(newDecryptedMap),
      });
    }
  };

  const getDecryptedChar = (cipherChar: string): string => {
    if (cipherChar < 'A' || cipherChar > 'Z') return cipherChar;
    return decryptedMap[cipherChar] || '_';
  };

  const getDisplayQuote = (): string => {
    return quote.split('').map(char => {
      if (char >= 'A' && char <= 'Z') {
        return getDecryptedChar(char);
      }
      return char;
    }).join('');
  };

  const isQuoteSolved = useMemo(() => {
    for (const char of quote.toUpperCase()) {
      if (char >= 'A' && char <= 'Z') {
        if (!decryptedMap[char]) return false;
      }
    }
    return true;
  }, [quote, decryptedMap]);

  const handleShowAnswer = async () => {
    setShowAuthor(true);
    if (currentGameId) {
      await gameDb.cryptoquote.update(currentGameId, {
        completed: true,
      });
    }
  };

  const handleNewQuote = async () => {
    const quoteData = await getRandomQuote();
    if (!quoteData) return;
    const { quote: newPlainQuote, author: newAuthor } = quoteData;
    const { cipher, cipherMap: newCipherMap } = createCipher(newPlainQuote);

    setQuote(cipher);
    setAuthor(newAuthor);
    setCipherMap(newCipherMap);
    setDecryptedMap({});
    setSelectedCipher(null);
    setShowAuthor(false);

    const newGame = await gameDb.cryptoquote.create({
      encryptedQuote: cipher,
      decryptedQuote: newPlainQuote,
      author: newAuthor,
      cipherMapJson: JSON.stringify(newCipherMap),
      decryptedMapJson: '{}',
      completed: false,
    });
    setCurrentGameId(newGame.id);
  };

  const handleBackToHome = () => {
    navigate('Home' as ScreenName);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const usedLetters = new Set(Object.values(decryptedMap).filter(v => v !== ''));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cryptoquote</Text>
        <Text style={styles.subtitle}>Decode the quote by substituting letters</Text>
      </View>

      <View style={styles.quoteContainer}>
        {quote.split('\n').map((line, lineIndex) => (
          <Text key={lineIndex} style={styles.quoteText}>
            {line.split('').map((char, charIndex) => {
              if (char >= 'A' && char <= 'Z') {
                const decrypted = getDecryptedChar(char);
                const isRevealed = decryptedMap[char] !== undefined;
                return (
                  <Text
                    key={charIndex}
                    style={[
                      styles.letterChar,
                      isRevealed ? styles.revealedChar : null,
                    ]}
                  >
                    {decrypted}
                  </Text>
                );
              }
              return <Text key={charIndex} style={styles.letterChar}>{char}</Text>;
            })}
          </Text>
        ))}
      </View>

      {author && showAuthor && (
        <Text style={styles.authorText}>- {author}</Text>
      )}

      {isQuoteSolved && !showAuthor && (
        <TouchableOpacity style={styles.showAuthorButton} onPress={handleShowAnswer}>
          <Text style={styles.showAuthorButtonText}>SHOW AUTHOR</Text>
        </TouchableOpacity>
      )}

      <View style={styles.solvingArea}>
        <Text style={styles.solvingTitle}>Solve the cipher:</Text>
        <View style={styles.cipherOptions}>
          {Object.keys(cipherMap).sort().map(cipherLetter => (
            <TouchableOpacity
              key={cipherLetter}
              style={[
                styles.cipherLetter,
                selectedCipher === cipherLetter ? styles.selectedCipher : null,
              ]}
              onPress={() => setSelectedCipher(cipherLetter)}
            >
              <Text style={styles.cipherLetterText}>{cipherLetter}</Text>
              {decryptedMap[cipherLetter] && (
                <Text style={styles.decryptedLetterText}>{decryptedMap[cipherLetter]}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedCipher && (
        <View style={styles.keyboardArea}>
          <Text style={styles.keyboardTitle}>Select letter for {selectedCipher}:</Text>
          <View style={styles.keyboard}>
            {ALPHABET.split('').map(letter => (
              <TouchableOpacity
                key={letter}
                style={[
                  styles.keyLetter,
                  usedLetters.has(letter) ? styles.usedKey : null,
                ]}
                onPress={() => handleKeyPress(selectedCipher, letter)}
                disabled={usedLetters.has(letter)}
              >
                <Text style={[
                  styles.keyLetterText,
                  usedLetters.has(letter) ? styles.usedKeyText : null,
                ]}>
                  {letter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => handleClearLetter(selectedCipher)}
          >
            <Text style={styles.clearButtonText}>CLEAR</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
          <Text style={styles.homeButtonText}>HOME</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.newQuoteButton} onPress={handleNewQuote}>
          <Text style={styles.newQuoteButtonText}>NEW QUOTE</Text>
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
  quoteContainer: {
    marginTop: 24,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  quoteText: {
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  letterChar: {
    fontFamily: 'monospace',
  },
  revealedChar: {
    color: '#16A34A',
    fontWeight: 'bold',
  },
  authorText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
    color: '#666',
  },
  showAuthorButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 16,
  },
  showAuthorButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#fff',
  },
  solvingArea: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  solvingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cipherOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  cipherLetter: {
    width: 44,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  selectedCipher: {
    backgroundColor: '#DBEAFE',
  },
  cipherLetterText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  decryptedLetterText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: 'bold',
    marginTop: 2,
  },
  keyboardArea: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  keyboardTitle: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  keyboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
  },
  keyLetter: {
    width: 32,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  usedKey: {
    backgroundColor: '#E5E7EB',
  },
  keyLetterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  usedKeyText: {
    color: '#9CA3AF',
  },
  clearButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 12,
  },
  clearButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#DC2626',
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
  newQuoteButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newQuoteButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#fff',
  },
});