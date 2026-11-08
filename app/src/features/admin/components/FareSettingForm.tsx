import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/config/theme';
import { Alert, Input } from '@/shared/ui';

import { useUpdateFareSetting } from '../hooks/useAdminQueries';
import { fareSettingFormSchema } from '../schemas/adminSchemas';
import type { FareSetting } from '../types';
import { AdminButton, Panel } from '../ui';

interface FareSettingFormProps {
  setting: FareSetting;
}

/** One tariff. Money is typed in pesos and sent as decimal strings; the server stores centavos. */
export function FareSettingForm({ setting }: FareSettingFormProps) {
  const update = useUpdateFareSetting();
  const [values, setValues] = useState({
    base_fare: toPesos(setting.base_fare.centavos),
    included_distance_meters: String(setting.included_distance_meters),
    per_km: toPesos(setting.per_km.centavos),
    service_fee: toPesos(setting.service_fee.centavos),
    minimum_fare: toPesos(setting.minimum_fare.centavos),
    commission_rate: String(setting.commission_rate_bps / 100),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const edit = (field: keyof typeof values) => (text: string) => {
    setValues((current) => ({ ...current, [field]: text }));
    setErrors({});
    update.reset();
  };

  const save = () => {
    const parsed = fareSettingFormSchema.safeParse(values);

    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
        ),
      );

      return;
    }

    update.mutate({ serviceType: setting.service_type, input: parsed.data });
  };

  const title = setting.service_type === 'pabili' ? 'Pabili' : 'Pasuyo';

  return (
    <Panel
      testID={`tariff-${setting.service_type}`}
      title={`${title} tariff`}
      subtitle={`Last changed ${new Date(setting.updated_at).toLocaleString()}`}
    >
      <View style={styles.row}>
        <View style={styles.half}>
          <Input
            size="compact"
            label={`${title} base fare (₱)`}
            keyboardType="decimal-pad"
            value={values.base_fare}
            onChangeText={edit('base_fare')}
            error={errors.base_fare}
          />
        </View>
        <View style={styles.half}>
          <Input
            size="compact"
            label={`${title} included metres`}
            keyboardType="number-pad"
            value={values.included_distance_meters}
            onChangeText={edit('included_distance_meters')}
            error={errors.included_distance_meters}
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.half}>
          <Input
            size="compact"
            label={`${title} per extra km (₱)`}
            keyboardType="decimal-pad"
            value={values.per_km}
            onChangeText={edit('per_km')}
            error={errors.per_km}
          />
        </View>
        <View style={styles.half}>
          <Input
            size="compact"
            label={`${title} service fee (₱)`}
            keyboardType="decimal-pad"
            value={values.service_fee}
            onChangeText={edit('service_fee')}
            error={errors.service_fee}
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.half}>
          <Input
            size="compact"
            label={`${title} minimum fare (₱)`}
            keyboardType="decimal-pad"
            value={values.minimum_fare}
            onChangeText={edit('minimum_fare')}
            error={errors.minimum_fare}
          />
        </View>
        <View style={styles.half}>
          <Input
            size="compact"
            label={`${title} commission (%)`}
            keyboardType="decimal-pad"
            value={values.commission_rate}
            onChangeText={edit('commission_rate')}
            error={errors.commission_rate}
            hint="Taken from the rider's wallet on each completed cash booking."
          />
        </View>
      </View>
      {update.isError && <Alert tone="error" message={update.error.message} />}
      {update.isSuccess && (
        <Alert message="Saved. New bookings use this tariff and commission; existing bookings keep theirs." />
      )}
      <AdminButton
        size="lg"
        label={`Save ${title} tariff`}
        onPress={save}
        isLoading={update.isPending}
      />
    </Panel>
  );
}

function toPesos(centavos: number): string {
  return (centavos / 100).toFixed(2).replace(/\.00$/, '');
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
});
