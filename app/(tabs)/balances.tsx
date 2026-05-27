import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BackToHomeButton } from '@/components/back-to-home-button';
import { useEvents } from '@/src/presentation/events/events-context';
import { BalanceLine } from '@/src/domain/events/entities';

export default function BalancesScreen() {
  const { balances, expenses, markBalanceAsRepaid, repayments } = useEvents();
  const [confirmingBalanceId, setConfirmingBalanceId] = useState<string | null>(null);
  const [savingBalanceId, setSavingBalanceId] = useState<string | null>(null);

  const askRepaymentStatus = (balance: BalanceLine) => {
    setConfirmingBalanceId(balance.id);
  };

  const confirmRepayment = async (balance: BalanceLine) => {
    setSavingBalanceId(balance.id);

    try {
      await markBalanceAsRepaid(balance);
    } catch (error) {
      Alert.alert(
        'Remboursement impossible',
        error instanceof Error ? error.message : 'Une erreur est survenue.',
      );
    } finally {
      setSavingBalanceId(null);
      setConfirmingBalanceId(null);
    }
  };

  return (
    <View style={styles.container}>
      <BackToHomeButton />

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
            <Pressable
              disabled={savingBalanceId === item.id || confirmingBalanceId === item.id}
              onPress={() => askRepaymentStatus(item)}
              style={({ pressed }) => [
                styles.repaidButton,
                pressed && styles.pressedButton,
                (savingBalanceId === item.id || confirmingBalanceId === item.id) &&
                  styles.disabledButton,
              ]}>
              <Text style={styles.repaidButtonText}>
                {savingBalanceId === item.id
                  ? 'Validation...'
                  : 'Le remboursement a-t-il été effectué ?'}
              </Text>
            </Pressable>
            {confirmingBalanceId === item.id ? (
              <View style={styles.confirmationBox}>
                <Text style={styles.confirmationText}>
                  {item.from} a-t-il remboursé {item.to} ?
                </Text>
                <View style={styles.confirmationActions}>
                  <Pressable
                    disabled={savingBalanceId === item.id}
                    onPress={() => {
                      void confirmRepayment(item);
                    }}
                    style={({ pressed }) => [
                      styles.confirmButton,
                      styles.confirmYesButton,
                      pressed && styles.pressedButton,
                      savingBalanceId === item.id && styles.disabledButton,
                    ]}>
                    <Text style={styles.confirmYesText}>Oui</Text>
                  </Pressable>
                  <Pressable
                    disabled={savingBalanceId === item.id}
                    onPress={() => setConfirmingBalanceId(null)}
                    style={({ pressed }) => [
                      styles.confirmButton,
                      styles.confirmNoButton,
                      pressed && styles.pressedButton,
                    ]}>
                    <Text style={styles.confirmNoText}>Non</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        )}
        ListFooterComponent={
          repayments.length === 0 ? null : (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Historique des remboursements</Text>
              {repayments.map((repayment) => (
                <View key={repayment.id} style={styles.historyCard}>
                  <Text style={styles.eventTitle}>{repayment.eventTitle}</Text>
                  <Text style={styles.cardText}>
                    {repayment.from} a remboursé {repayment.to}
                  </Text>
                  <View style={styles.historyMetaRow}>
                    <Text style={styles.historyAmount}>{repayment.amount.toFixed(2)} €</Text>
                    <Text style={styles.historyDate}>
                      {new Date(repayment.createdAt).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )
        }
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
  repaidButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0a7ea4',
  },
  pressedButton: {
    opacity: 0.85,
  },
  disabledButton: {
    opacity: 0.55,
  },
  repaidButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  confirmationBox: {
    gap: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f7fb',
  },
  confirmationText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#25313b',
  },
  confirmationActions: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  confirmYesButton: {
    backgroundColor: '#147d64',
  },
  confirmNoButton: {
    borderWidth: 1,
    borderColor: '#ccd6df',
    backgroundColor: '#fff',
  },
  confirmYesText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  confirmNoText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#25313b',
  },
  historySection: {
    gap: 12,
    marginTop: 24,
    paddingBottom: 32,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#123047',
  },
  historyCard: {
    gap: 8,
    padding: 18,
    borderRadius: 8,
    backgroundColor: '#eef8f5',
  },
  historyMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#147d64',
  },
  historyDate: {
    fontSize: 14,
    color: '#52616f',
  },
});
