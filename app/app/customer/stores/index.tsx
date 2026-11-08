import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { features } from '@/config/features';
import { spacing } from '@/config/theme';
import { offeringParams, resolveOffering, type ServiceOffering } from '@/features/booking';
import { useCurrentPosition, type LatLng } from '@/features/map';
import { StoreCard, useStores, type Store } from '@/features/store';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import {
  ActionCard,
  Alert,
  Button,
  EmptyState,
  Input,
  Screen,
  ScreenHeader,
  Text,
} from '@/shared/ui';
import { BackBar } from '@/shared/ui/BackBar';

export default function StoresScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const offering = resolveOffering('pabili', params.category);

  // The catalogue is paused (ADR 0013); the URL still exists, so send people to the typed list.
  if (!features.storeCatalogue) {
    return (
      <Redirect href={{ pathname: '/customer/bookings/new', params: { serviceType: 'pabili' } }} />
    );
  }

  if (offering === null) {
    return <Redirect href="/customer" />;
  }

  return <StoreCatalogue offering={offering} />;
}

/** Stores that sell what this Pabili is for; each opens its menu of available items. */
function StoreCatalogue({ offering }: { offering: ServiceOffering }) {
  const { isDesktop } = useBreakpoint();
  const position = useCurrentPosition();
  const [near, setNear] = useState<LatLng | null>(null);
  const [search, setSearch] = useState('');
  const term = useDebouncedValue(search.trim());
  const stores = useStores({
    near,
    search: term,
    pabiliCategory: offering.pabiliCategory ?? undefined,
  });

  const open = (store: Store) =>
    router.push({
      pathname: '/customer/stores/[id]',
      params: { id: String(store.id), ...offeringParams(offering) },
    });

  const locate = async () => {
    const point = await position.locate();

    if (point !== null) {
      setNear(point);
    }
  };

  const bookWithoutStore = () =>
    router.push({
      pathname: '/customer/bookings/new',
      params: { ...offeringParams(offering), mode: 'manual' },
    });

  const header = (
    <View style={styles.header}>
      <ScreenHeader title={`Book ${offering.title}`} subtitle={offering.blurb} />
      <ActionCard
        icon="create-outline"
        title="Book without a store"
        description="Type your list and budget. The rider buys from a store near you."
        actionLabel="Type my list"
        onPress={bookWithoutStore}
      />
      <Text style={styles.sectionTitle}>Or choose a store</Text>
      <Text variant="caption">Add items from its menu; the rider buys them there.</Text>
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Input
            label="Search stores"
            hideLabel
            icon="search-outline"
            placeholder="Search stores"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <Button
          variant={near === null ? 'primary' : 'secondary'}
          icon="navigate-outline"
          label={near === null ? 'Near me' : 'Nearest'}
          onPress={() => void locate()}
          isLoading={position.isLocating}
          disabled={near !== null}
        />
      </View>
      {position.error !== undefined && <Alert tone="error" message={position.error} />}
    </View>
  );

  const empty = stores.isPending ? (
    <Text variant="caption">Loading stores…</Text>
  ) : stores.isError ? (
    <View style={styles.stack}>
      <Alert tone="error" message={stores.error.message} />
      <Button variant="secondary" label="Retry" onPress={() => void stores.refetch()} />
    </View>
  ) : (
    <EmptyState
      icon="storefront-outline"
      title={term === '' ? 'No stores listed yet' : 'No stores found'}
      hint={
        term === ''
          ? 'Use "Type my list" above and the rider buys from a store near you.'
          : 'Try another name, or type your list instead.'
      }
    />
  );

  if (isDesktop) {
    return (
      <View style={styles.stack}>
        {header}
        <View style={styles.grid}>
          {(stores.data ?? []).map((store) => (
            <View key={store.id} style={styles.gridItem}>
              <StoreCard store={store} onPress={open} />
            </View>
          ))}
        </View>
        {(stores.data ?? []).length === 0 && empty}
      </View>
    );
  }

  return (
    <Screen>
      <BackBar fallbackHref="/customer" />
      <FlatList
        data={stores.data ?? []}
        keyExtractor={(store) => String(store.id)}
        renderItem={({ item }) => <StoreCard store={item} onPress={open} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  header: { gap: spacing.sm, paddingBottom: spacing.sm },
  sectionTitle: { fontWeight: '800', fontSize: 18, paddingTop: spacing.sm },
  searchRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  search: { flex: 1 },
  stack: { gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridItem: { flexBasis: '31%', flexGrow: 1, minWidth: 280 },
});
