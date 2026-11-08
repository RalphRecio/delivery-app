import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { spacing } from '@/config/theme';
import { AdminButton, FareSettingForm, PageHeader, useFareSettings } from '@/features/admin';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { Alert, Button, Screen, Text } from '@/shared/ui';

const FORMULA =
  'Fare = max(base + per-km × distance beyond the included metres + service fee, minimum).';

export default function TariffsScreen() {
  const settings = useFareSettings();
  const { isDesktop } = useBreakpoint();

  const forms = settings.isPending ? (
    <Text variant="caption">Loading…</Text>
  ) : settings.isError ? (
    <>
      <Alert tone="error" message={settings.error.message} />
      {isDesktop ? (
        <AdminButton variant="outline" label="Retry" onPress={() => void settings.refetch()} />
      ) : (
        <Button variant="secondary" label="Retry" onPress={() => void settings.refetch()} />
      )}
    </>
  ) : (
    <View style={isDesktop ? styles.columns : styles.stack}>
      {settings.data.map((setting) => (
        <View key={setting.service_type} style={isDesktop ? styles.column : undefined}>
          <FareSettingForm setting={setting} />
        </View>
      ))}
    </View>
  );

  if (isDesktop) {
    return (
      <View style={styles.desktop}>
        <PageHeader title="Tariffs" subtitle={FORMULA} />
        {forms}
      </View>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Button variant="secondary" label="Back" onPress={() => router.back()} />
        <Text variant="title">Tariffs</Text>
        <Text variant="caption">{FORMULA}</Text>
        {forms}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  stack: { gap: spacing.md },
  desktop: { gap: 20 },
  columns: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  column: { flex: 1, maxWidth: 640 },
});
