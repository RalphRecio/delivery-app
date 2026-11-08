import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { spacing } from '@/config/theme';
import { BookingListItem, TERMINAL_STATUSES, useBookings, type Booking } from '@/features/booking';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import {
  Alert,
  Button,
  type ChipOption,
  EmptyState,
  FilterChips,
  Input,
  Screen,
  ScreenHeader,
  Text,
} from '@/shared/ui';

type Filter = 'active' | 'completed' | 'cancelled';

const FILTERS: ChipOption<Filter>[] = [
  { value: undefined, label: 'All' },
  { value: 'active', label: 'In progress' },
  { value: 'completed', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

function matchesFilter(booking: Booking, filter: Filter | undefined): boolean {
  switch (filter) {
    case 'active':
      return !TERMINAL_STATUSES.includes(booking.status);
    case 'completed':
      return booking.status === 'completed';
    case 'cancelled':
      return booking.status === 'cancelled';
    default:
      return true;
  }
}

export default function BookingsScreen() {
  const bookings = useBookings();
  const { isDesktop } = useBreakpoint();
  const [filter, setFilter] = useState<Filter>();
  const [search, setSearch] = useState('');
  const all = bookings.data ?? [];
  const term = search.trim().toLowerCase();
  const shown = all.filter(
    (b) =>
      matchesFilter(b, filter) &&
      (term === '' ||
        b.reference.toLowerCase().includes(term) ||
        b.dropoff.address.toLowerCase().includes(term)),
  );

  const open = (booking: Booking) =>
    router.push({ pathname: '/customer/bookings/[id]', params: { id: String(booking.id) } });

  const header = (
    <View style={styles.header}>
      <ScreenHeader
        title="Bookings"
        subtitle={
          bookings.data === undefined
            ? undefined
            : `${all.length} ${all.length === 1 ? 'booking' : 'bookings'}`
        }
      />
      <Input
        label="Search bookings"
        hideLabel
        icon="search-outline"
        placeholder="Search reference or drop-off…"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="characters"
      />
      <FilterChips options={FILTERS} selected={filter} onSelect={setFilter} wrap={isDesktop} />
    </View>
  );

  const empty = bookings.isPending ? (
    <Text variant="caption">Loading your bookings…</Text>
  ) : bookings.isError ? (
    <View style={styles.stack}>
      <Alert tone="error" message={bookings.error.message} />
      <Button variant="secondary" label="Retry" onPress={() => void bookings.refetch()} />
    </View>
  ) : all.length === 0 ? (
    <EmptyState
      icon="receipt-outline"
      title="No bookings yet"
      hint="Your Pabili and Pasuyo bookings will show up here."
      action={<Button label="Book a Pasuyo" onPress={() => router.navigate('/customer')} />}
    />
  ) : (
    <EmptyState
      icon="search-outline"
      title="No bookings found"
      hint="Try another search or filter."
    />
  );

  if (isDesktop) {
    return (
      <View style={styles.stack}>
        {header}
        {shown.length === 0 ? (
          empty
        ) : (
          <View style={styles.grid}>
            {shown.map((b) => (
              <View key={b.id} style={styles.gridItem}>
                <BookingListItem booking={b} onPress={open} />
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  return (
    <Screen>
      <FlatList
        data={shown}
        keyExtractor={(booking) => String(booking.id)}
        renderItem={({ item }) => <BookingListItem booking={item} onPress={open} />}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={bookings.isRefetching}
            onRefresh={() => void bookings.refetch()}
          />
        }
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  header: { gap: spacing.sm, paddingBottom: spacing.sm },
  stack: { gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridItem: { flexBasis: '31%', flexGrow: 1, minWidth: 300 },
});
