import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Profile: undefined;
};

interface Props {
  label?: string;
}

const Button = (props: Props) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const getOnPress = () => {
    switch (props.label) {
      case 'Games':
        navigation.navigate('Home');
        break;
      case 'Settings':
        navigation.navigate('Settings');
        break;
      case 'Profile':
        navigation.navigate('Profile');
        break;
    }
  };

  return (
    <TouchableOpacity
      onPress={getOnPress}
      style={styles.button}
    >
      <Text style={styles.buttonText}>{props.label}</Text>
    </TouchableOpacity>
  );
};

export const NavigationHeader = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Word Games</Text>
      <View style={styles.buttonContainer}>
        <Button label={'Games'} />
        <Button label={'Settings'} />
        <Button label={'Profile'} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#87CEEB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 8,
    marginTop: 8,
    borderWidth: 4,
    borderColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    padding: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});