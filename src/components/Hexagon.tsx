import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';

interface Props {
  letter: string;
  onClick?: () => void;
  index: number;
  isCenter?: boolean;
}

export const Hexagon = (props: Props) => {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      onPress={props.onClick}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={0.8}
    >
      <View style={styles.container}>
        <View
          style={[
            styles.hexagon,
            { backgroundColor: props.isCenter ? '#F9CA1C' : '#E4EAF3' },
            !pressed && styles.shadow,
          ]}
        >
          <Text style={styles.letter}>{props.letter.toUpperCase()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 4,
  },
  hexagon: {
    width: 80,
    height: 92,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '0deg' }],
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  letter: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
});