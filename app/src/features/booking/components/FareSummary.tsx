import { StyleSheet, View } from 'react-native';

import { colors, fontSize, spacing } from '@/config/theme';
import { formatDistance } from '@/shared/lib/format';
import { Card, Text } from '@/shared/ui';

import type { FareBreakdown } from '../types';

interface FareSummaryProps {
  fare: FareBreakdown;
}

/** The server's breakdown, shown before confirming and again on the booking. */
export function FareSummary({ fare }: FareSummaryProps) {
  return (
    <Card>
      <Row
        label={`Base fare (${formatDistance(fare.distance_meters)})`}
        value={fare.base_fare.formatted}
      />
      <Row label="Distance" value={fare.distance_fare.formatted} />
      {fare.service_fee.centavos > 0 && (
        <Row label="Service fee" value={fare.service_fee.formatted} />
      )}
      <View style={styles.divider} />
      <Row label="Total" value={fare.total.formatted} emphasis />
      <Text variant="caption">Paid in cash to the rider on delivery.</Text>
    </Card>
  );
}

function Row({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={emphasis ? styles.emphasis : undefined}>{label}</Text>
      <Text style={emphasis ? styles.emphasis : undefined}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  divider: { height: 1, backgroundColor: colors.border },
  emphasis: { fontWeight: '700', fontSize: fontSize.lg },
});
