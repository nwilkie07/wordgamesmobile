import { Alert } from 'react-native';

export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  } catch {
    return dateStr;
  }
}

export async function confirmDelete(
  onConfirm: () => Promise<void>,
  gameName = 'this game'
): Promise<void> {
  Alert.alert(
    'Delete Game',
    `Are you sure you want to delete ${gameName}?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await onConfirm();
        },
      },
    ]
  );
}

export type LetterState = 'correct' | 'present' | 'absent' | 'empty';

export function getCellStyle(state: LetterState) {
  switch (state) {
    case 'correct':
      return { backgroundColor: '#16A34A', borderColor: '#16A34A' };
    case 'present':
      return { backgroundColor: '#CA8A04', borderColor: '#CA8A04' };
    case 'absent':
      return { backgroundColor: '#6B7280', borderColor: '#6B7280' };
    default:
      return { backgroundColor: '#fff', borderColor: '#D1D5DB' };
  }
}

export function getLetterStateColor(state: LetterState): string {
  switch (state) {
    case 'correct':
      return '#16A34A';
    case 'present':
      return '#CA8A04';
    case 'absent':
      return '#6B7280';
    default:
      return '#374151';
  }
}