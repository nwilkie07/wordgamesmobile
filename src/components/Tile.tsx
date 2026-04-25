import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';

interface Props {
  letter: string;
  onClick?: () => void;
  index: number;
  isCenter?: boolean;
  disabled?: boolean;
}

export const Tile = (props: Props) => {
  return (
    <TouchableOpacity
      onPress={props.disabled ? undefined : props.onClick}
      disabled={props.disabled}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.tile,
          props.isCenter && styles.center,
          props.disabled && styles.disabled,
        ]}
      >
        <Text style={styles.letter}>{props.letter.toUpperCase()}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tile: {
    width: 60,
    height: 60,
    backgroundColor: '#E4EAF3',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  center: {
    backgroundColor: '#F9CA1C',
  },
  disabled: {
    backgroundColor: '#D3D3D3',
    opacity: 0.5,
  },
  letter: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
});