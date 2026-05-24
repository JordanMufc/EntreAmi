import { FlatList, StyleSheet, Text, View } from 'react-native';

import { useEvents } from '@/src/context/events-context';

export default function BalancesScreen() {
  const { balances, expenses } = useEvents();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Soldes</Text>
        <Text style={styles.subtitle}>
          Les remboursements sont calculés automatiquement depuis les dépenses enregistrées.
        </Text>
      </View>

      <FlatList
        contentContainerStyle={balances.length === 0 ? styles.emptyList : styles.list}
        data={balances}
        keyExtractor={(balance) => balance.id}
        ListEmptyComponent={
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {expenses.length === 0 ? 'Aucune dépense à calculer' : 'Tout est équilibré'}
            </Text>
            <Text style={styles.cardText}>
              {expenses.length === 0
                ? 'Ajoutez une dépense avec ses participants pour générer les soldes.'
                : 'Les participants n’ont aucun remboursement restant à effectuer.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.balanceCard}>
            <Text style={styles.eventTitle}>{item.eventTitle}</Text>
            <View style={styles.balanceRow}>
              <View style={styles.people}>
                <Text style={styles.person}>{item.from}</Text>
                <Text style={styles.direction}>rembourse</Text>
                <Text style={styles.person}>{item.to}</Text>
              </View>
              <Text style={styles.amount}>{item.amount.toFixed(2)} €</Text>
            </View>
          </View>
        )}
      />
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
  list: {
    gap: 12,
    paddingBottom: 32,
  },
  emptyList: {
    flexGrow: 1,
  },
  card: {
    gap: 8,
    padding: 18,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  balanceCard: {
    gap: 12,
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
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a7ea4',
  },
  balanceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  people: {
    flex: 1,
    gap: 3,
  },
  person: {
    fontSize: 18,
    fontWeight: '700',
    color: '#25313b',
  },
  direction: {
    fontSize: 14,
    color: '#52616f',
  },
  amount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#147d64',
  },
});
