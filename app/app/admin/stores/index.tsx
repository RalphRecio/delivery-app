import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/config/theme';
import {
  AdminButton,
  AdminModal,
  Panel,
  SearchField,
  StoreForm,
  StoresTable,
  useAdminStores,
  useCreateStore,
  type AdminStore,
} from '@/features/admin';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { Alert, Badge, Button, Input, Screen, Text } from '@/shared/ui';
import { BackBar } from '@/shared/ui/BackBar';

export default function AdminStoresScreen() {
  const { isDesktop } = useBreakpoint();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(isDesktop ? 10 : 25);
  const [isAddingStore, setIsAddingStore] = useState(false);
  const create = useCreateStore();
  const term = useDebouncedValue(search.trim());
  const stores = useAdminStores({
    search: term === '' ? undefined : term,
    page,
    per_page: perPage,
  });
  const rows = stores.data?.data ?? [];

  const open = (store: AdminStore) =>
    router.push({ pathname: '/admin/stores/[id]', params: { id: String(store.id) } });
  // Desktop adds in a dialog like riders; phones get the full-page form.
  const addStore = () => (isDesktop ? setIsAddingStore(true) : router.push('/admin/stores/new'));

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  if (isDesktop) {
    return (
      <View style={styles.desktop}>
        {stores.isError && <Alert tone="error" message={stores.error.message} />}
        <Panel isFlush>
          <View style={styles.toolbar}>
            <View style={styles.search}>
              <SearchField
                label="Search stores"
                placeholder="Search stores, e.g. Jollibee"
                value={search}
                onChangeText={changeSearch}
              />
            </View>
            <AdminButton icon="add" label="New store" onPress={addStore} />
          </View>
          <StoresTable
            rows={rows}
            meta={stores.data?.meta}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(value) => {
              setPerPage(value);
              setPage(1);
            }}
            onOpen={open}
            isLoading={stores.isPending}
          />
        </Panel>
        <AdminModal
          isOpen={isAddingStore}
          title="Add a store"
          subtitle="Add the store first, then its items. Customers see it once it is open for orders."
          width={760}
          onClose={() => setIsAddingStore(false)}
        >
          {/* Re-mount on each open so a half-typed form from last time is cleared. */}
          {isAddingStore && (
            <StoreForm
              submitLabel="Add store"
              isSubmitting={create.isPending}
              error={create.error}
              // Next step is the menu, so go straight to the new store's page.
              onSubmit={(input) =>
                create.mutate(input, {
                  onSuccess: (store) => {
                    setIsAddingStore(false);
                    open(store);
                  },
                })
              }
            />
          )}
        </AdminModal>
      </View>
    );
  }

  return (
    <Screen>
      <BackBar fallbackHref="/admin" label="Admin" />
      <FlatList
        data={rows}
        keyExtractor={(store) => String(store.id)}
        renderItem={({ item }) => <StoreRow store={item} onPress={open} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.stack}>
            <Text variant="title">Stores</Text>
            <Input
              label="Search stores"
              placeholder="e.g. Jollibee"
              value={search}
              onChangeText={changeSearch}
            />
            <Button label="Add a store" onPress={addStore} />
          </View>
        }
        ListEmptyComponent={
          stores.isPending ? (
            <Text variant="caption">Loading stores…</Text>
          ) : stores.isError ? (
            <View style={styles.stack}>
              <Alert tone="error" message={stores.error.message} />
              <Button variant="secondary" label="Retry" onPress={() => void stores.refetch()} />
            </View>
          ) : (
            <Text variant="caption">No stores yet. Add the first one.</Text>
          )
        }
      />
    </Screen>
  );
}

function StoreRow({ store, onPress }: { store: AdminStore; onPress: (store: AdminStore) => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Store ${store.name}`}
      onPress={() => onPress(store)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowHeader}>
        <Text style={styles.rowTitle}>{store.name}</Text>
        {store.is_active ? <Badge label="Open" tone="success" /> : <Badge label="Hidden" />}
      </View>
      <Text variant="caption" numberOfLines={1}>
        {store.category_label} · {store.address}
      </Text>
      <Text variant="caption">
        {store.available_products_count ?? 0} of {store.products_count ?? 0} items available
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  stack: { gap: spacing.md },
  desktop: { gap: 16 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
  },
  search: { width: 360 },
  row: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  pressed: { backgroundColor: colors.surface },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  rowTitle: { fontWeight: '600', flex: 1 },
});
