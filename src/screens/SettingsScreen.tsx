import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import { gameDb } from '../db/games';
import * as Clipboard from 'expo-clipboard';

const BACKUP_FOLDER = FileSystem.documentDirectory + 'backups/';
const GOOGLE_DRIVE_FOLDER_ID_KEY = 'google_drive_folder_id';

function getBackupData() {
  return {
    panagramGames: gameDb.panagram.findAll(),
    targetGames: gameDb.target.findAll(),
    ladderleGames: gameDb.ladderle.findAll(),
    cryptoquoteGames: gameDb.cryptoquote.findAll(),
    wordguessGames: gameDb.wordguess.findAll(),
    crosswordGames: gameDb.crossword.findAll(),
    exportedAt: new Date().toISOString(),
    version: "2.1",
  };
}

async function ensureBackupFolder() {
  const dirInfo = await FileSystem.getInfoAsync(BACKUP_FOLDER);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(BACKUP_FOLDER, { intermediates: true });
  }
}

export default function SettingsScreen({ navigation }: { navigation?: any }) {
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importText, setImportText] = useState("");
  const [googleDriveFolderId, setGoogleDriveFolderId] = useState("");
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);

  useEffect(() => {
    loadLastBackupDate();
  }, []);

  const loadLastBackupDate = async () => {
    try {
      const backupInfo = await FileSystem.getInfoAsync(BACKUP_FOLDER + 'latest.json');
      if (backupInfo.exists) {
        const content = await FileSystem.readAsStringAsync(BACKUP_FOLDER + 'latest.json');
        const data = JSON.parse(content);
        setLastBackupDate(data.exportedAt);
      }
    } catch (e) {
      // No backup exists yet
    }
  };

  const handleExportLocal = async () => {
    try {
      const data = getBackupData();
      const jsonString = JSON.stringify(data, null, 2);
      await Clipboard.setStringAsync(jsonString);
      Alert.alert(
        "Export",
        `Copied ${data.panagramGames.length + data.targetGames.length + data.ladderleGames.length + data.cryptoquoteGames.length + data.wordguessGames.length} games to clipboard`,
      );
    } catch (e) {
      Alert.alert("Error", "Failed to export");
    }
  };

  const handleSaveToDevice = async () => {
    try {
      setIsBackingUp(true);
      await ensureBackupFolder();

      const data = getBackupData();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `wordgames-backup-${timestamp}.json`;
      const filepath = BACKUP_FOLDER + filename;

      await FileSystem.writeAsStringAsync(filepath, JSON.stringify(data, null, 2));
      await FileSystem.writeAsStringAsync(BACKUP_FOLDER + 'latest.json', JSON.stringify(data, null, 2));

      setLastBackupDate(data.exportedAt);

      Alert.alert(
        "Backup Saved",
        `Backup saved to app storage. Filename: ${filename}\n\nTo sync with Google Drive, open your Google Drive app and upload this file manually.`,
      );
    } catch (e) {
      Alert.alert("Error", "Failed to save backup");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleImportLocal = () => {
    setImportText("");
    setImportModalVisible(true);
  };

  const handleRestoreFromDevice = async () => {
    try {
      await ensureBackupFolder();
      const latestPath = BACKUP_FOLDER + 'latest.json';
      const info = await FileSystem.getInfoAsync(latestPath);

      if (!info.exists) {
        Alert.alert("No Backup", "No backup found on device. Save a backup first or import from clipboard.");
        return;
      }

      const content = await FileSystem.readAsStringAsync(latestPath);
      await processImportData(JSON.parse(content));

      Alert.alert("Restore Complete", "Successfully restored from device backup.");
    } catch (e) {
      Alert.alert("Error", "Failed to restore from device");
    }
  };

  const processImportData = async (data: any) => {
    if (!data.panagramGames || !data.targetGames) {
      throw new Error("Invalid backup file format");
    }

    let panagramCount = 0;
    let targetCount = 0;
    let ladderleCount = 0;
    let cryptoquoteCount = 0;
    let wordguessCount = 0;
    let crosswordCount = 0;

    for (const game of data.panagramGames) {
      if (game.id && game.letters && game.centerLetter) {
        await gameDb.panagram.create({
          letters: game.letters,
          centerLetter: game.centerLetter,
          foundWordsJson: game.foundWordsJson || "[]",
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
          letterCounts: game.letterCounts || "{}",
          foundWordsJson: game.foundWordsJson || "[]",
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
            attemptsJson: game.attemptsJson || "[]",
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
            decryptedQuote: game.decryptedQuote || "",
            author: game.author || "",
            cipherMapJson: game.cipherMapJson || "{}",
            decryptedMapJson: game.decryptedMapJson || "{}",
            completed: game.completed || false,
          });
          cryptoquoteCount++;
        }
      }
    }
    if (data.wordguessGames) {
      for (const game of data.wordguessGames) {
        if (game.id && game.targetWord) {
          await gameDb.wordguess.create({
            targetWord: game.targetWord,
            guessesJson: game.guessesJson || "[]",
            completed: game.completed || false,
            won: game.won || false,
          });
          wordguessCount++;
        }
      }
    }
    if (data.crosswordGames) {
      for (const game of data.crosswordGames) {
        if (game.id && game.puzzleId) {
          await gameDb.crossword.create({
            puzzleId: game.puzzleId,
            entriesJson: game.entriesJson || "[]",
            completed: game.completed || false,
          });
          crosswordCount++;
        }
      }
    }

    Alert.alert(
      "Import",
      `Imported ${panagramCount} panagram, ${targetCount} target, ${ladderleCount} ladderle, ${cryptoquoteCount} cryptoquote, ${wordguessCount} wordguess, ${crosswordCount} crossword games`,
    );
  };

  const processImport = async () => {
    try {
      const data = JSON.parse(importText);
      await processImportData(data);
      setImportModalVisible(false);
      setImportText("");
    } catch (e) {
      Alert.alert(
        "Error",
        "Failed to parse backup data. Make sure you paste the complete export text.",
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backup & Sync</Text>

          <View style={styles.backupSection}>
            <Text style={styles.label}>Local Backup</Text>
            <Text style={styles.description}>
              Copy your game data to clipboard or save to device for manual sync.
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.backupButton}
                onPress={handleExportLocal}
              >
                <Text style={styles.backupButtonText}>Copy to Clipboard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backupButton}
                onPress={handleImportLocal}
              >
                <Text style={styles.backupButtonText}>Import from Clipboard</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.backupSection}>
            <Text style={styles.label}>Device Storage</Text>
            <Text style={styles.description}>
              Save backup to device or restore from a previous save.
            </Text>
            {lastBackupDate && (
              <Text style={styles.lastBackupText}>
                Last backup: {formatDate(lastBackupDate)}
              </Text>
            )}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.backupButton, styles.primaryButton]}
                onPress={handleSaveToDevice}
                disabled={isBackingUp}
              >
                {isBackingUp ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.backupButtonTextWhite}>Save to Device</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backupButton}
                onPress={handleRestoreFromDevice}
              >
                <Text style={styles.backupButtonText}>Restore from Device</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.backupSection}>
            <Text style={styles.label}>Google Drive Sync</Text>
            <Text style={styles.description}>
              To sync with Google Drive, save the backup to your device, then open Google Drive in a browser or app and upload the backup file. To restore, download the backup from Google Drive and use "Restore from Device".
            </Text>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => Alert.alert(
                "Google Drive Sync Instructions",
                "1. Tap 'Save to Device' to create a backup\n\n2. Open Google Drive on your phone or computer\n\n3. Find the backup file in the WordGames app folder (or tap 'Restore from Device' if the file is in your Downloads)\n\n4. To restore: download the backup file from Google Drive, then use 'Restore from Device' in this app"
              )}
            >
              <Text style={styles.infoButtonText}>How to use with Google Drive</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  backupSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  lastBackupText: {
    fontSize: 12,
    color: '#16A34A',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  backupButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
  },
  backupButtonText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#374151',
  },
  backupButtonTextWhite: {
    fontWeight: '600',
    fontSize: 14,
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  infoButton: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
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