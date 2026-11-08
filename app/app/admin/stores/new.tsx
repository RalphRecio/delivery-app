import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { spacing } from '@/config/theme';
import { PageHeader, Panel, StoreForm, useCreateStore } from '@/features/admin';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { Screen, Text } from '@/shared/ui';
import { BackBar } from '@/shared/ui/BackBar';

export default function AddStoreScreen() {
  const { isDesktop } = useBreakpoint();
  const create = useCreateStore();

  const form = (
    <StoreForm
      submitLabel="Add store"
      isSubmitting={create.isPending}
      error={create.error}
      // Next step is the menu, so go straight to the new store's page.
      onSubmit={(input) =>
        create.mutate(input, {
          onSuccess: (store) =>
            router.replace({ pathname: '/admin/stores/[id]', params: { id: String(store.id) } }),
        })
      }
    />
  );

  if (isDesktop) {
    return (
      <View style={styles.desktop}>
        <PageHeader
          back={{ href: '/admin/stores', label: 'Stores' }}
          title="Add a store"
          subtitle="Add the store first, then its items. Customers see it once it is open for orders."
        />
        <Panel title="Store details">{form}</Panel>
      </View>
    );
  }

  return (
    <Screen>
      <BackBar fallbackHref="/admin/stores" label="Stores" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="title">Add a store</Text>
        <Text variant="caption">
          Add the store first, then its items. Customers see it once it is open for orders.
        </Text>
        {form}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  desktop: { gap: 20, maxWidth: 760 },
});
