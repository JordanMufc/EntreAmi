import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/src/context/auth-context';

export default function HomeScreen() {
  const { logout, user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bonjour {user?.username}</Text>
        <Text style={styles.subtitle}>Vous êtes connecté à EntreAmi.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prochaine étape</Text>
        <Text style={styles.text}>
          Cet espace accueillera la liste des événements, les invitations et les dépenses
          partagées.
        </Text>
      </View>

      <Pressable onPress={logout} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 24,
    padding: 24,
    paddingTop: 72,
    backgroundColor: '#f5f7fb',
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#123047',
  },
  subtitle: {
    fontSize: 16,
    color: '#52616f',
  },
  section: {
    gap: 8,
    padding: 18,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#25313b',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#52616f',
  },
  button: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#c93535',
  },
  pressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
