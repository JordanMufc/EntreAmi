import { StyleSheet, Text, View } from 'react-native';

export default function InvitationsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Invitations</Text>
        <Text style={styles.subtitle}>
          Suivez les participants invités et leurs réponses aux événements.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Aucune invitation en attente</Text>
        <Text style={styles.cardText}>
          Les invitations pourront être acceptées ou refusées depuis cet onglet.
        </Text>
      </View>
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
    lineHeight: 22,
    color: '#52616f',
  },
  card: {
    gap: 8,
    padding: 18,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#25313b',
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#52616f',
  },
});
