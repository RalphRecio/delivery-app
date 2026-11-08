import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { spacing } from '@/config/theme';
import {
  AdminButton,
  BookingsTable,
  Panel,
  SearchField,
  UnderlineTabs,
  useAdminBookings,
} from '@/features/admin';
import { BookingListItem, type Booking, type BookingStatus } from '@/features/booking';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { Alert, Button, type ChipOption, FilterChips, Input, Screen, Text } from '@/shared/ui';

const STATUS_OPTIONS: ChipOption<BookingStatus>[] = [
  { value: undefined, label: 'All' },
  { value: 'searching', label: 'Finding a rider' },
  { value: 'accepted', label: 'Rider assigned' },
  { value: 'picking_up', label: 'Heading to pickup' },
  { value: 'in_transit', label: 'On the way' },
  { value: 'completed', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminBookingsScreen() {
  const { isDesktop } = useBreakpoint();
  const [status, setStatus] = useState<BookingStatus>();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(isDesktop ? 10 : 25);
  const debouncedSearch = useDebouncedValue(search.trim());
  const bookings = useAdminBookings({
    status,
    search: debouncedSearch === '' ? undefined : debouncedSearch,
    page,
    per_page: perPage,
  });
  const rows = bookings.data?.data ?? [];

  const open = (booking: Booking) =>
    router.push({ pathname: '/admin/bookings/[id]', params: { id: String(booking.id) } });

  const changeStatus = (value: BookingStatus | undefined) => {
    setStatus(value);
    setPage(1);
  };

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  if (isDesktop) {
    return (
      <View style={styles.desktop}>
        <UnderlineTabs tabs={STATUS_OPTIONS} selected={status} onSelect={changeStatus} />
        {bookings.isError && <Alert tone="error" message={bookings.error.message} />}
        <Panel isFlush>
          <View style={styles.toolbar}>
            <View style={styles.search}>
              <SearchField
                label="Search by reference"
                placeholder="Search by reference, e.g. BK-"
                value={search}
                onChangeText={changeSearch}
                autoCapitalize="characters"
              />
            </View>
            <AdminButton
              variant="outline"
              icon="refresh-outline"
              label="Refresh"
              onPress={() => void bookings.refetch()}
              isLoading={bookings.isRefetching}
            />
          </View>
          <BookingsTable
            rows={rows}
            meta={bookings.data?.meta}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(value) => {
              setPerPage(value);
              setPage(1);
            }}
            onOpen={open}
            isLoading={bookings.isPending}
          />
        </Panel>
      </View>
    );
  }

  const filters = (
    <>
      <FilterChips options={STATUS_OPTIONS} selected={status} onSelect={changeStatus} />
      <Input
        label="Search by reference"
        value={search}
        onChangeText={changeSearch}
        placeholder="BK-"
        autoCapitalize="characters"
      />
    </>
  );

  return (
    <Screen>
      <FlatList
        data={rows}
        keyExtractor={(booking) => String(booking.id)}
        renderItem={({ item }) => <BookingListItem booking={item} onPress={open} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={bookings.isRefetching}
            onRefresh={() => void bookings.refetch()}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Button variant="secondary" label="Back" onPress={() => router.back()} />
            <Text variant="title">All bookings</Text>
            {filters}
          </View>
        }
        ListEmptyComponent={
          bookings.isPending ? (
            <Text variant="caption">Loading…</Text>
          ) : bookings.isError ? (
            <View style={styles.stack}>
              <Alert tone="error" message={bookings.error.message} />
              <Button variant="secondary" label="Retry" onPress={() => void bookings.refetch()} />
            </View>
          ) : (
            <Text variant="caption">No bookings match.</Text>
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  header: { gap: spacing.md, paddingBottom: spacing.sm },
  stack: { gap: spacing.sm },
  desktop: { gap: 16 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
  },
  search: { width: 360 },
});
