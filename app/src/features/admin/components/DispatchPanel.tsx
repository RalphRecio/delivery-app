import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { adminColors, adminFontSize } from '@/config/adminTheme';
import { Alert, Text } from '@/shared/ui';

import { useAssignRider, useRiderCandidates } from '../hooks/useAdminQueries';
import { AdminButton, Panel } from '../ui';

import { RiderCandidateRow } from './RiderCandidateRow';

interface DispatchPanelProps {
  bookingId: number;
}

/**
 * The admin as dispatcher: every active rider for a waiting booking,
 * available and on duty first, then nearest, with an Assign button on those
 * who can take it. Offline riders can be assigned too (after a phone call);
 * they find the job when they open the rider app. Riders can still accept
 * the job themselves meanwhile; whoever is first gets it.
 */
export function DispatchPanel({ bookingId }: DispatchPanelProps) {
  const candidates = useRiderCandidates(bookingId, true);
  const assign = useAssignRider();
  const [confirmingRiderId, setConfirmingRiderId] = useState<number | null>(null);

  const press = (riderId: number) => {
    if (confirmingRiderId !== riderId) {
      setConfirmingRiderId(riderId);

      return;
    }

    assign.mutate({ bookingId, riderId }, { onSettled: () => setConfirmingRiderId(null) });
  };

  const body = candidates.isPending ? (
    <Text style={styles.muted}>Loading riders…</Text>
  ) : candidates.isError ? (
    <>
      <Alert tone="error" message={candidates.error.message} />
      <AdminButton variant="outline" label="Retry" onPress={() => void candidates.refetch()} />
    </>
  ) : candidates.data.length === 0 ? (
    <Text style={styles.muted}>
      There are no active rider accounts yet. Add one under Riders &amp; users.
    </Text>
  ) : (
    <View style={styles.list}>
      {candidates.data.map((candidate) => (
        <RiderCandidateRow
          key={candidate.rider.id}
          candidate={candidate}
          isConfirming={confirmingRiderId === candidate.rider.id}
          isAssigning={assign.isPending && assign.variables.riderId === candidate.rider.id}
          isDisabled={assign.isPending}
          onAssign={() => press(candidate.rider.id)}
        />
      ))}
    </View>
  );

  const onDutyCount = candidates.data?.filter((candidate) => candidate.is_on_duty).length ?? 0;

  return (
    <Panel
      title="Assign a rider"
      subtitle="The job starts as soon as you assign it. Offline riders see it when they next open the app, so call them first."
      actions={
        candidates.data !== undefined && candidates.data.length > 0 ? (
          <Text style={styles.muted}>
            {onDutyCount} of {candidates.data.length} on duty
          </Text>
        ) : undefined
      }
    >
      {assign.isError && <Alert tone="error" message={assign.error.message} />}
      {body}
    </Panel>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  muted: { fontSize: adminFontSize.sm, color: adminColors.textMuted },
});
