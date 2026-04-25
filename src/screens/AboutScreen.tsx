import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function AboutScreen({ navigation }: { navigation?: any }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>About WordGames</Text>
        <Text style={styles.version}>Version 1.0</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Panagram (7 Letters)</Text>
          <Text style={styles.description}>
            Find all words containing 7 letters with one center letter. Words must be at least 4 letters long
            and include the center letter. Panagrams (words using all 7 letters) earn bonus points!
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target (9 Letters)</Text>
          <Text style={styles.description}>
            Find all words that can be spelled with 9 unique letters. One letter is designated as the center
            letter and must be included in every word.
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Play</Text>
          <Text style={styles.description}>
            Tap letters to build words. Press DELETE to remove the last letter, SHUFFLE to rearrange
            letters, and SUBMIT to enter your word. Found words are displayed at the bottom of the screen.
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scoring</Text>
          <Text style={styles.description}>
            In Panagram, 4-letter words earn 1 point, longer words earn their length in points, and panagrams
            earn bonus points. In Target, each valid word earns 1 point, with bonuses for 9-letter words.
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backup</Text>
          <Text style={styles.description}>
            Use the Export button to save your game history. The Import button allows you to restore from
            a previously exported backup file.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
});