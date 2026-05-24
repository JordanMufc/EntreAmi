import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';

export function BackToHomeButton() {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.replace('/(tabs)')}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <IconSymbol name="chevron.left" size={20} color="#0a7ea4" />
      <Text style={styles.text}>Retour</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccd6df',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0a7ea4',
  },
});
