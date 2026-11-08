import { Redirect, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { spacing } from '@/config/theme';
import {
  AdminButton,
  PageHeader,
  Panel,
  StatusPill,
  StoreForm,
  StoreItemsEditor,
  useAdminStore,
  useUpdateStore,
} from '@/features/admin';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { Alert, Button, Screen, Text } from '@/shared/ui';
import { BackBar } from '@/shared/ui/BackBar';

export default function AdminStoreScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return <Redirect href="/admin/stores" />;
  }

  return <StoreDetail id={id} />;
}

/** Edit the store on one side, manage its menu on the other. */
function StoreDetail({ id }: { id: number }) {
  const { isDesktop } = useBreakpoint();
  const store = useAdminStore(id);
  const update = useUpdateStore(id);

  if (store.isPending || store.isError) {
    const state = store.isPending ? (
      <Text variant="caption">Loading store…</Text>
    ) : (
      <>
        <Alert tone="error" message={store.error.message} />
        {isDesktop ? (
          <AdminButton variant="outline" label="Retry" onPress={() => void store.refetch()} />
        ) : (
          <Button variant="secondary" label="Retry" onPress={() => void store.refetch()} />
        )}
      </>
    );

    return isDesktop ? (
      <View style={styles.desktop}>
        <PageHeader back={{ href: '/admin/stores', label: 'Stores' }} title="Store" />
        {state}
      </View>
    ) : (
      <Screen>
        <BackBar fallbackHref="/admin/stores" label="Stores" />
        {state}
      </Screen>
    );
  }

  const form = (
    <StoreForm
      // Re-mount after a save so the form shows exactly what the server stored.
      key={store.data.id}
      store={store.data}
      submitLabel="Save changes"
      isSubmitting={update.isPending}
      error={update.error}
      savedMessage={update.isSuccess ? 'Saved.' : undefined}
      onSubmit={(input) => update.mutate(input)}
    />
  );
  const items = <StoreItemsEditor storeId={id} products={store.data.products ?? []} />;

  if (isDesktop) {
    return (
      <View style={styles.desktop}>
        <PageHeader
          back={{ href: '/admin/stores', label: 'Stores' }}
          title={store.data.name}
          subtitle={`${store.data.category_label} · ${store.data.address}`}
          badge={
            store.data.is_active ? (
              <StatusPill label="Open" tone="green" />
            ) : (
              <StatusPill label="Hidden" tone="gray" />
            )
          }
        />
        <View style={styles.columns}>
          <View style={styles.column}>
            <Panel title="Store details">{form}</Panel>
          </View>
          <View style={styles.column}>
            <Panel
              title="Items"
              subtitle="Sold-out items stay listed here; customers do not see them."
            >
              {items}
            </Panel>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Screen>
      <BackBar fallbackHref="/admin/stores" label="Stores" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="title">{store.data.name}</Text>
        <Panel title="Items">{items}</Panel>
        <Panel title="Store details">{form}</Panel>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  desktop: { gap: 20 },
  columns: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  column: { flex: 1, minWidth: 0 },
});
