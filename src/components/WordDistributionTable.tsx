import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface WordDistributionTableProps {
  letters: string;
  centerLetter: string;
  validWords: Array<{ word: string; points?: number }>;
}

export function WordDistributionTable({
  letters,
  centerLetter,
  validWords,
}: WordDistributionTableProps) {
  const distribution = useMemo(() => {
    const letterSet = new Set(letters.split(''));
    const allLengths = [4, 5, 6, 7, 8, 9];
    const wordLengths = allLengths.filter((len) =>
      validWords.some((w) => w.word.length === len),
    );

    const data: Record<string, Record<number, number>> = {};
    for (const letter of letters.split('')) {
      data[letter] = {};
      for (const len of wordLengths) {
        data[letter][len] = 0;
      }
    }

    const columnTotals: Record<number, number> = {};
    for (const len of wordLengths) {
      columnTotals[len] = 0;
    }

    for (const { word } of validWords) {
      const firstLetter = word[0];
      if (
        letterSet.has(firstLetter) &&
        data[firstLetter] &&
        data[firstLetter][word.length] !== undefined
      ) {
        data[firstLetter][word.length]++;
        columnTotals[word.length]++;
      }
    }

    const rowTotals: Record<string, number> = {};
    for (const letter of letters.split('')) {
      rowTotals[letter] = Object.values(data[letter]).reduce((a, b) => a + b, 0);
    }

    const grandTotal = validWords.length;

    return { data, wordLengths, columnTotals, rowTotals, grandTotal };
  }, [letters, validWords]);

  const { data, wordLengths, columnTotals, rowTotals, grandTotal } = distribution;

  const sortedLetters = letters.split('').sort();

  return (
    <ScrollView horizontal style={styles.container}>
      <View>
        <Text style={styles.description}>
          Count of words starting with each letter, grouped by word length
        </Text>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={styles.headerCell}></Text>
            {wordLengths.map((len) => (
              <Text key={len} style={styles.headerCell}>{len}</Text>
            ))}
            <Text style={styles.headerCell}>&#x2211;</Text>
          </View>
          {sortedLetters.map((letter) => (
            <View key={letter} style={styles.row}>
              <Text
                style={[
                  styles.rowHeader,
                  letter === centerLetter && styles.highlightCell,
                ]}
              >
                {letter.toUpperCase()}
              </Text>
              {wordLengths.map((len) => (
                <Text key={len} style={styles.cell}>
                  {data[letter]?.[len] > 0 ? data[letter][len] : '-'}
                </Text>
              ))}
              <Text style={styles.totalCell}>{rowTotals[letter] ?? 0}</Text>
            </View>
          ))}
          <View style={styles.footerRow}>
            <Text style={styles.footerCell}>&#x2211;</Text>
            {wordLengths.map((len) => (
              <Text key={len} style={styles.footerCell}>
                {columnTotals[len] ?? 0}
              </Text>
            ))}
            <Text style={styles.footerCell}>{grandTotal}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  headerCell: {
    width: 50,
    padding: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  row: {
    flexDirection: 'row',
  },
  rowHeader: {
    width: 50,
    padding: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  highlightCell: {
    backgroundColor: '#fffde7',
  },
  cell: {
    width: 50,
    padding: 8,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  totalCell: {
    width: 50,
    padding: 8,
    textAlign: 'center',
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  footerRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  footerCell: {
    width: 50,
    padding: 8,
    textAlign: 'center',
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#ddd',
  },
});