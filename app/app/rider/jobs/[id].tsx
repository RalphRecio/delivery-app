import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { spacing } from '@/config/theme';
import { useCurrentUser } from '@/features/auth';
import { BookingDetails } from '@/features/booking';
import { JobActions, useJob } from '@/features/rider';
import { Alert, Button, Screen, Text } from '@/shared/ui';

export default function JobDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return <Redirect href="/rider" />;
  }

  return <JobDetail id={id} />;
}

function JobDetail({ id }: { id: number }) {
  const job = useJob(id);
  const me = useCurrentUser();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Button variant="secondary" label="Back to jobs" onPress={() => router.replace('/rider')} />

        {job.isPending ? (
          <Text variant="caption">Loading job…</Text>
        ) : job.isError ? (
          <>
            <Alert tone="error" message={job.error.message} />
            <Button variant="secondary" label="Retry" onPress={() => void job.refetch()} />
          </>
        ) : (
          <>
            <BookingDetails booking={job.data} />
            <JobActions
              job={job.data}
              isMine={job.data.rider?.id === me.data?.id || isAssignedToMe(job.data.status)}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

/**
 * The rider endpoint only returns assigned jobs to their own rider, so any
 * job past `searching` that we can see is ours.
 */
function isAssignedToMe(status: string): boolean {
  return status !== 'pending' && status !== 'searching';
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
});
