import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { spacing } from '@/config/theme';
import { openCheckout, TopupStatusView, useTopup } from '@/features/wallet';
import { Alert, Button, Screen, Text } from '@/shared/ui';

/**
 * Where the rider lands after the payment page (PayMongo's return URL) or
 * right after opening it on a phone. It only ever reads the status from the
 * server; arriving here credits nothing.
 */
export default function TopupReturnScreen() {
  const params = useLocalSearchParams<{ topup_request_id?: string }>();
  const id = Number(params.topup_request_id);

  if (!Number.isInteger(id) || id <= 0) {
    return <Redirect href="/rider/wallet" />;
  }

  return <TopupResult id={id} />;
}

function TopupResult({ id }: { id: number }) {
  const topup = useTopup(id);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="title">Top-up</Text>
        {topup.isPending ? (
          <Text variant="caption">Checking your payment…</Text>
        ) : topup.isError ? (
          <>
            <Alert tone="error" message={topup.error.message} />
            <Button variant="secondary" label="Retry" onPress={() => void topup.refetch()} />
          </>
        ) : (
          <>
            <TopupStatusView topup={topup.data} />
            {topup.data.status === 'pending' && topup.data.checkout_url !== null && (
              <Button
                variant="secondary"
                label="Open the payment page again"
                onPress={() => void openCheckout(topup.data.checkout_url ?? '')}
              />
            )}
            {(topup.data.status === 'failed' || topup.data.status === 'expired') && (
              <Button label="Try again" onPress={() => router.replace('/rider/wallet/topup')} />
            )}
          </>
        )}
        <Button
          variant="ghost"
          label="Back to wallet"
          onPress={() => router.replace('/rider/wallet')}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
});
