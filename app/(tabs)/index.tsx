import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/src/context/auth-context';

const features = [
  {
    title: 'Événements',
    description: 'Créer un événement, ajouter un lieu et suivre les détails importants.',
    route: '/(tabs)/events',
  },
  {
    title: 'Invitations',
    description: 'Inviter des participants et suivre les réponses en attente.',
    route: '/(tabs)/invitations',
  },
  {
    title: 'Dépenses',
    description: 'Ajouter les frais payés par chacun et les associer aux participants.',
    route: '/(tabs)/expenses',
  },
  {
    title: 'Soldes',
    description: 'Voir les montants dus et les remboursements à effectuer.',
    route: '/(tabs)/balances',
  },
] as const;

export default function HomeScreen() {
  const { logout, user } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bonjour {user?.username}</Text>
        <Text style={styles.subtitle}>
          Retrouvez les outils pour organiser vos événements et partager les dépenses.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fonctionnalités</Text>
        <View style={styles.featureList}>
          {features.map((feature) => (
            <Pressable
              key={feature.title}
              onPress={() => router.push(feature.route)}
              style={({ pressed }) => [styles.featureCard, pressed && styles.pressed]}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureText}>{feature.description}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable onPress={logout} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
    padding: 24,
    paddingTop: 72,
    paddingBottom: 32,
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#25313b',
  },
  featureList: {
    gap: 12,
  },
  featureCard: {
    gap: 6,
    minHeight: 100,
    justifyContent: 'center',
    padding: 18,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#123047',
  },
  featureText: {
    fontSize: 16,
    lineHeight: 22,
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
