import { useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, View } from 'react-native';

import { spacing } from '@/config/theme';
import {
  groupByDay,
  TransactionRow,
  useWalletTransactions,
  type WalletTransactionType,
} from '@/features/wallet';
import { Alert, Button, FilterChips, Screen, Text, type ChipOption } from '@/shared/ui';
import { BackBar } from '@/shared/ui/BackBar';

const FILTERS: ChipOption<WalletTransactionType>[] = [
  { value: undefined, label: 'All' },
  { value: 'topup', label: 'Top-ups' },
  { value: 'commission', label: 'Commissions' },
  { value: 'refund', label: 'Refunds' },
  { value: 'adjustment', label: 'Adjustments' },
];

export default function WalletHistoryScreen() {
  const [type, setType] = useState<WalletTransactionType | undefined>();
  const history = useWalletTransactions(type === undefined ? {} : { type });
  const transactions = history.data?.pages.flatMap((page) => page.data) ?? [];
  const sections = groupByDay(transactions, new Date());

  return (
    <Screen>
      <BackBar fallbackHref="/rider/wallet" label="Wallet" />
      <SectionList
        sections={sections}
        keyExtractor={(transaction) => String(transaction.id)}
        renderItem={({ item }) => <TransactionRow transaction={item} />}
        renderSectionHeader={({ section }) => <Text style={styles.day}>{section.title}</Text>}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        onEndReached={() => {
          if (history.hasNextPage && !history.isFetchingNextPage) {
            void history.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={history.isRefetching}
            onRefresh={() => void history.refetch()}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="title">Transactions</Text>
            <FilterChips options={FILTERS} selected={type} onSelect={setType} />
          </View>
        }
        ListEmptyComponent={
          history.isPending ? (
            <Text variant="caption">Loading transactions…</Text>
          ) : history.isError ? (
            <View style={styles.stack}>
              <Alert tone="error" message={history.error.message} />
              <Button variant="secondary" label="Retry" onPress={() => void history.refetch()} />
            </View>
          ) : (
            <Text variant="caption">Nothing here yet.</Text>
          )
        }
        ListFooterComponent={
          history.isFetchingNextPage ? <Text variant="caption">Loading more…</Text> : undefined
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  header: { gap: spacing.md, paddingBottom: spacing.sm },
  day: { fontWeight: '700', paddingTop: spacing.md },
  stack: { gap: spacing.sm },
});
