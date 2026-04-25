import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface TwoLetterPrefixTableProps {
  validWords: Array<{ word: string; points?: number }>;
}

export function TwoLetterPrefixTable({
  validWords,
}: TwoLetterPrefixTableProps) {
  const distribution = useMemo(() => {
    const prefixCounts: Record<string, number> = {};

    for (const { word } of validWords) {
      if (word.length >= 2) {
        const prefix = word.substring(0, 2);
        prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
      }
    }

    const sortedPrefixes = Object.keys(prefixCounts).sort();

    return { prefixCounts, sortedPrefixes, totalWords: validWords.length };
  }, [validWords]);

  const { prefixCounts, sortedPrefixes, totalWords } = distribution;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Two-Letter Prefixes ({totalWords} words)
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.prefixContainer}>
          {sortedPrefixes.map((prefix) => (
            <View key={prefix} style={styles.prefixItem}>
              <Text style={styles.prefixText}>{prefix.toUpperCase()}</Text>
              <Text style={styles.countText}>({prefixCounts[prefix]})</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  prefixContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prefixItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  prefixText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  countText: {
    color: '#666',
    marginLeft: 4,
    fontSize: 12,
  },
});