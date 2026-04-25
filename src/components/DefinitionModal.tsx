import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

interface DefinitionModalProps {
  visible: boolean;
  word: string | null;
  definition: string | null;
  loading: boolean;
  onClose: () => void;
  color?: string;
}

export default function DefinitionModal({
  visible,
  word,
  definition,
  loading,
  onClose,
  color = '#2563EB',
}: DefinitionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={[styles.title, { color }]}>{word?.toUpperCase()}</Text>
          {loading && <Text style={styles.definition}>Loading...</Text>}
          {definition && <Text style={styles.definition}>{definition}</Text>}
          {!loading && !definition && (
            <Text style={styles.definition}>No definition found</Text>
          )}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    margin: 24,
    maxWidth: '80%',
    width: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  definition: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  closeButton: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});