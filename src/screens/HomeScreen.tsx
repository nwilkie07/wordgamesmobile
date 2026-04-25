import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, Modal } from 'react-native';
import { NavigationHeader } from '../components/NavigationHeader';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { gameDb } from '../db/games';
import * as Clipboard from 'expo-clipboard';

type HomeStackParamList = {
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
  Settings: undefined;
  Profile: undefined;
  About: undefined;
};

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [status, setStatus] = useState('');
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importText, setImportText] = useState('');

  const handleExportLocal = async () => {
    try {
      const panagram = gameDb.panagram.findAll();
      const target = gameDb.target.findAll();
      const ladderle = gameDb.ladderle.findAll();
      const cryptoquote = gameDb.cryptoquote.findAll();
      const wordle = gameDb.wordle.findAll();
      const data = {
        panagramGames: panagram,
        targetGames: target,
        ladderleGames: ladderle,
        cryptoquoteGames: cryptoquote,
        wordleGames: wordle,
        exportedAt: new Date().toISOString(),
        version: '2.0',
      };
      const jsonString = JSON.stringify(data, null, 2);
      await Clipboard.setStringAsync(jsonString);
      Alert.alert('Export', `Exported ${panagram.length} panagram, ${target.length} target, ${ladderle.length} ladderle, ${cryptoquote.length} cryptoquote, ${wordle.length} wordle games`);
    } catch (e) {
      Alert.alert('Error', 'Failed to export');
    }
  };

  const handleImportLocal = () => {
    setImportText('');
    setImportModalVisible(true);
  };

  const processImport = async () => {
    try {
      const data = JSON.parse(importText);
      if (!data.panagramGames || !data.targetGames) {
        Alert.alert('Error', 'Invalid backup file format');
        return;
      }
      let panagramCount = 0;
      let targetCount = 0;
      let ladderleCount = 0;
      let cryptoquoteCount = 0;
      let wordleCount = 0;
      for (const game of data.panagramGames) {
        if (game.id && game.letters && game.centerLetter) {
          await gameDb.panagram.create({
            letters: game.letters,
            centerLetter: game.centerLetter,
            foundWordsJson: game.foundWordsJson || '[]',
            score: game.score || 0,
            completed: game.completed || false,
          });
          panagramCount++;
        }
      }
      for (const game of data.targetGames) {
        if (game.id && game.letters && game.centerLetter) {
          await gameDb.target.create({
            letters: game.letters,
            centerLetter: game.centerLetter,
            letterCounts: game.letterCounts || '{}',
            foundWordsJson: game.foundWordsJson || '[]',
            completed: game.completed || false,
          });
          targetCount++;
        }
      }
      if (data.ladderleGames) {
        for (const game of data.ladderleGames) {
          if (game.id && game.targetWord) {
            await gameDb.ladderle.create({
              targetWord: game.targetWord,
              attemptsJson: game.attemptsJson || '[]',
              completed: game.completed || false,
              won: game.won || false,
            });
            ladderleCount++;
          }
        }
      }
      if (data.cryptoquoteGames) {
        for (const game of data.cryptoquoteGames) {
          if (game.id && game.encryptedQuote) {
            await gameDb.cryptoquote.create({
              encryptedQuote: game.encryptedQuote,
              decryptedQuote: game.decryptedQuote || '',
              author: game.author || '',
              cipherMapJson: game.cipherMapJson || '{}',
              decryptedMapJson: game.decryptedMapJson || '{}',
              completed: game.completed || false,
            });
            cryptoquoteCount++;
          }
        }
      }
      if (data.wordleGames) {
        for (const game of data.wordleGames) {
          if (game.id && game.targetWord) {
            await gameDb.wordle.create({
              targetWord: game.targetWord,
              guessesJson: game.guessesJson || '[]',
              completed: game.completed || false,
              won: game.won || false,
            });
            wordleCount++;
          }
        }
      }
      Alert.alert('Import', `Imported ${panagramCount} panagram, ${targetCount} target, ${ladderleCount} ladderle, ${cryptoquoteCount} cryptoquote, ${wordleCount} wordle games`);
      setImportModalVisible(false);
      setImportText('');
    } catch (e) {
      Alert.alert('Error', 'Failed to parse backup data. Make sure you paste the complete export text.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <NavigationHeader />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.historyButtonText}>All History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.historyButton, styles.targetHistoryButton]}
          onPress={() => navigation.navigate('PanagramHistory')}
        >
          <Text style={[styles.historyButtonText, styles.targetHistoryText]}>Panagram History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.historyButton, styles.ladderleHistoryButton]}
          onPress={() => navigation.navigate('LadderleHistory')}
        >
          <Text style={[styles.historyButtonText, styles.ladderleHistoryText]}>Ladderle History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.historyButton, styles.cryptoquoteHistoryButton]}
          onPress={() => navigation.navigate('CryptoquoteHistory')}
        >
          <Text style={[styles.historyButtonText, styles.cryptoquoteHistoryText]}>Cryptoquote History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.historyButton, styles.wordleHistoryButton]}
          onPress={() => navigation.navigate('WordleHistory')}
        >
          <Text style={[styles.historyButtonText, styles.wordleHistoryText]}>Wordle History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.historyButton, styles.crosswordHistoryButton]}
          onPress={() => navigation.navigate('CrosswordHistory')}
        >
          <Text style={[styles.historyButtonText, styles.crosswordHistoryText]}>Crossword History</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.backupContainer}>
        <Text style={styles.sectionTitle}>Backup & Sync</Text>

        <View style={styles.backupSection}>
          <Text style={styles.label}>Local Backup</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.backupButton} onPress={handleExportLocal}>
              <Text style={styles.backupButtonText}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backupButton} onPress={handleImportLocal}>
              <Text style={styles.backupButtonText}>Import</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.aboutLink}
          onPress={() => navigation.navigate('About')}
        >
          <Text style={styles.aboutLinkText}>About WordGames</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gameButtonContainer}>
        <TouchableOpacity
          style={styles.gameButton}
          onPress={() => navigation.navigate('PanagramGame', {})}
        >
          <Text style={styles.gameButtonText}>7 Letters</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.gameButton, styles.targetButton]}
          onPress={() => navigation.navigate('TargetGame', {})}
        >
          <Text style={styles.gameButtonText}>Target</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.gameButton, styles.ladderleButton]}
          onPress={() => navigation.navigate('LadderleGame')}
        >
          <Text style={styles.gameButtonText}>Ladderle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.gameButton, styles.cryptoquoteButton]}
          onPress={() => navigation.navigate('CryptoquoteGame')}
        >
          <Text style={styles.gameButtonText}>Cryptoquote</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.gameButton, styles.wordleButton]}
          onPress={() => navigation.navigate('WordleGame')}
        >
          <Text style={styles.gameButtonText}>Wordle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.gameButton, styles.crosswordButton]}
          onPress={() => navigation.navigate('CrosswordGame')}
        >
          <Text style={styles.gameButtonText}>Crossword</Text>
        </TouchableOpacity>
      </View>

      {status ? (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      <Modal
        visible={importModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Import Backup</Text>
            <Text style={styles.modalDescription}>
              Paste the exported backup text below:
            </Text>
            <TextInput
              style={styles.importInput}
              multiline
              numberOfLines={8}
              value={importText}
              onChangeText={setImportText}
              placeholder="Paste backup JSON here..."
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setImportModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalImportButton}
                onPress={processImport}
              >
                <Text style={styles.modalImportButtonText}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginHorizontal: 8,
    marginTop: 8,
    gap: 8,
  },
  historyButton: {
    flex: 1,
    backgroundColor: '#EBF5FF',
    borderWidth: 1,
    borderColor: '#B8D4E8',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  historyButtonText: {
    color: '#2563EB',
    fontWeight: 'bold',
    fontSize: 16,
  },
  targetHistoryButton: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  targetHistoryText: {
    color: '#EA580C',
  },
  ladderleHistoryButton: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  ladderleHistoryText: {
    color: '#10B981',
  },
  cryptoquoteHistoryButton: {
    backgroundColor: '#EDE9FE',
    borderColor: '#DDD6FE',
  },
  cryptoquoteHistoryText: {
    color: '#7C3AED',
  },
  wordleHistoryButton: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
  },
  wordleHistoryText: {
    color: '#374151',
  },
  crosswordHistoryButton: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  crosswordHistoryText: {
    color: '#059669',
  },
  backupContainer: {
    margin: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  backupSection: {
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  backupButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backupButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  aboutLink: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  aboutLinkText: {
    color: '#2563EB',
    fontSize: 14,
    textAlign: 'center',
  },
  gameButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  gameButton: {
    backgroundColor: '#ddd',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
  },
  targetButton: {
    backgroundColor: '#FFA500',
  },
  ladderleButton: {
    backgroundColor: '#10B981',
  },
  cryptoquoteButton: {
    backgroundColor: '#7C3AED',
  },
  wordleButton: {
    backgroundColor: '#374151',
  },
  crosswordButton: {
    backgroundColor: '#059669',
  },
  gameButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBox: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  statusText: {
    color: '#2563EB',
    fontSize: 14,
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  importInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    height: 150,
    textAlignVertical: 'top',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalCancelButton: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCancelButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalImportButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalImportButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#fff',
  },
});