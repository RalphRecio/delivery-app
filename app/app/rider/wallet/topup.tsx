import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { spacing } from '@/config/theme';
import {
  openCheckout,
  topupAmountSchema,
  topupReturnUrl,
  TopupAmountPicker,
  useCreateTopup,
  useWallet,
} from '@/features/wallet';
import { Alert, Button, Screen, Text } from '@/shared/ui';
import { BackBar } from '@/shared/ui/BackBar';

/** Pick an amount, pay with GCash or Maya on PayMongo's page, then watch the result. */
export default function TopupScreen() {
  const wallet = useWallet();
  const create = useCreateTopup();
  const [amount, setAmount] = useState('500');
  const [error, setError] = useState<string>();
  const limits = wallet.data?.topup_limits;

  const submit = () => {
    const parsed = topupAmountSchema.safeParse(amount);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);

      return;
    }

    const centavos = Math.round(Number(parsed.data) * 100);

    if (
      limits !== undefined &&
      (centavos < limits.min.centavos || centavos > limits.max.centavos)
    ) {
      setError(`Top up between ${limits.min.formatted} and ${limits.max.formatted}.`);

      return;
    }

    create.mutate(
      { amount: parsed.data, returnUrl: topupReturnUrl() },
      {
        onSuccess: async (topup) => {
          if (topup.checkout_url === null) {
            return;
          }

          const outcome = await openCheckout(topup.checkout_url);

          // On phones the browser opens on top; show the status screen underneath so
          // it is waiting (and polling) when the rider comes back. On web the page
          // itself navigates to checkout and PayMongo brings the rider back.
          if (outcome === 'opened-elsewhere') {
            router.replace({
              pathname: '/rider/wallet/topup-return',
              params: { topup_request_id: String(topup.id) },
            });
          }
        },
      },
    );
  };

  return (
    <Screen>
      <BackBar fallbackHref="/rider/wallet" label="Wallet" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="title">Top up</Text>
        <Text variant="caption">
          Pay with GCash or Maya. Your balance updates as soon as the payment is confirmed.
        </Text>
        <TopupAmountPicker
          value={amount}
          onChange={(value) => {
            setAmount(value);
            setError(undefined);
            create.reset();
          }}
          error={error ?? create.error?.fieldError('amount')}
          hint={
            limits === undefined
              ? 'Minimum ₱100, maximum ₱5,000 per top-up.'
              : `Minimum ${limits.min.formatted}, maximum ${limits.max.formatted} per top-up.`
          }
          isDisabled={create.isPending}
        />
        {create.isError && create.error.fieldError('amount') === undefined && (
          <Alert tone="error" message={create.error.message} />
        )}
        <Button label="Continue to payment" onPress={submit} isLoading={create.isPending} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
});
