import { StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { spacing } from '@/config/theme';
import { LowBalanceAlert, WALLET_BALANCE_ERROR } from '@/features/wallet';
import { Alert, Button, Text } from '@/shared/ui';

import { useAcceptJob } from '../hooks/useAcceptJob';
import { useProgressJob } from '../hooks/useProgressJob';
import { nextStep } from '../lib/nextStep';
import type { Job } from '../types';

interface JobActionsProps {
  job: Job;
  isMine: boolean;
}

/** Accept an open job, or move an assigned one to its next status. */
export function JobActions({ job, isMine }: JobActionsProps) {
  const accept = useAcceptJob();
  const progress = useProgressJob();
  const step = isMine ? nextStep(job.status) : null;
  const error = accept.error ?? progress.error;
  const lowBalanceMessage = accept.error?.fieldError(WALLET_BALANCE_ERROR);

  return (
    <View style={styles.stack}>
      {lowBalanceMessage !== undefined ? (
        <LowBalanceAlert
          message={lowBalanceMessage}
          onTopUp={() => router.push('/rider/wallet/topup')}
        />
      ) : (
        error !== null && <Alert tone="error" message={error.message} />
      )}
      {job.status === 'searching' && !isMine && (
        <Button
          label="Accept job"
          onPress={() => accept.mutate(job.id)}
          isLoading={accept.isPending}
        />
      )}
      {step !== null && (
        <Button
          label={step.label}
          onPress={() => progress.mutate({ id: job.id, status: step.status })}
          isLoading={progress.isPending}
        />
      )}
      {job.status === 'completed' && isMine && <Text variant="caption">Delivered. Nice work.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
});
