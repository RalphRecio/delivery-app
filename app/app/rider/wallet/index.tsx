import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { spacing } from '@/config/theme';
import { BalanceCard, TransactionRow, useWallet, useWalletTransactions } from '@/features/wallet';
import { Alert, Button, Screen, ScreenHeader, Text } from '@/shared/ui';

const RECENT_COUNT = 10;

export default function WalletScreen() {
  const wallet = useWallet();
  const recent = useWalletTransactions({}, RECENT_COUNT);
  const transactions = recent.data?.pages[0]?.data ?? [];
  const goTopUp = () => router.push('/rider/wallet/topup');

  const refresh = () => {
    void wallet.refetch();
    void recent.refetch();
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={wallet.isRefetching || recent.isRefetching}
            onRefresh={refresh}
          />
        }
      >
        <ScreenHeader title="Wallet" subtitle="Your balance, top-ups and commission." />

        {wallet.isPending ? (
          <Text variant="caption">Loading your balance…</Text>
        ) : wallet.isError ? (
          <View style={styles.stack}>
            <Alert tone="error" message={wallet.error.message} />
            <Button variant="secondary" label="Retry" onPress={() => void wallet.refetch()} />
          </View>
        ) : (
          <BalanceCard wallet={wallet.data} onTopUp={goTopUp} />
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          <Button
            variant="ghost"
            label="See all"
            onPress={() => router.push('/rider/wallet/history')}
          />
        </View>

        {recent.isPending ? (
          <Text variant="caption">Loading transactions…</Text>
        ) : recent.isError ? (
          <View style={styles.stack}>
            <Alert tone="error" message={recent.error.message} />
            <Button variant="secondary" label="Retry" onPress={() => void recent.refetch()} />
          </View>
        ) : transactions.length === 0 ? (
          <Text variant="caption">No transactions yet. Top up to start accepting jobs.</Text>
        ) : (
          transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  stack: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontWeight: '700' },
});
