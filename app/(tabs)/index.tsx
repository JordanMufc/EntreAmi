import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/src/context/auth-context';

const features = [
  {
    title: 'Événements',
    description: 'Créer et suivre',
    icon: 'calendar.badge.plus',
    accent: '#0a7ea4',
    background: '#e8f6fa',
    route: '/(tabs)/events',
  },
  {
    title: 'Mes amis',
    description: 'Carnet d’invités',
    icon: 'person.badge.plus',
    accent: '#8a3ffc',
    background: '#f2edff',
    route: '/(tabs)/friends',
  },
  {
    title: 'Invitations',
    description: 'Participants',
    icon: 'person.2.fill',
    accent: '#6f52ed',
    background: '#f0edff',
    route: '/(tabs)/invitations',
  },
  {
    title: 'Dépenses',
    description: 'Frais partagés',
    icon: 'creditcard.fill',
    accent: '#147d64',
    background: '#e8f6f1',
    route: '/(tabs)/expenses',
  },
  {
    title: 'Soldes',
    description: 'Remboursements',
    icon: 'arrow.left.arrow.right',
    accent: '#b65f12',
    background: '#fff3e6',
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
          Accédez rapidement aux outils pour organiser vos événements.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fonctionnalités</Text>
        <View style={styles.featureGrid}>
          {features.map((feature) => (
            <Pressable
              key={feature.title}
              onPress={() => router.push(feature.route)}
              style={({ pressed }) => [
                styles.featureTile,
                { backgroundColor: feature.background },
                pressed && styles.pressed,
              ]}>
              <View style={[styles.iconFrame, { backgroundColor: feature.accent }]}>
                <IconSymbol name={feature.icon} size={28} color="#fff" />
              </View>
              <View style={styles.featureTextGroup}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureText}>{feature.description}</Text>
              </View>
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
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#25313b',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureTile: {
    aspectRatio: 1,
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 148,
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  iconFrame: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  featureTextGroup: {
    gap: 4,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#123047',
  },
  featureText: {
    fontSize: 14,
    lineHeight: 19,
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
