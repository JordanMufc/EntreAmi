import { StyleSheet, Text, View } from 'react-native';

export default function BalancesScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Soldes</Text>
        <Text style={styles.subtitle}>
          Consultez les montants payés, les parts dues et les remboursements à effectuer.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Aucun solde à afficher</Text>
        <Text style={styles.cardText}>
          Les calculs apparaîtront dès que des dépenses seront ajoutées à un événement.
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
