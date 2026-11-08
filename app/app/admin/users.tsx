import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { spacing } from '@/config/theme';
import {
  AdminButton,
  AdminModal,
  CreateRiderForm,
  Panel,
  SearchField,
  UnderlineTabs,
  UserRow,
  UsersTable,
  useAdminRiders,
  useAdminUsers,
} from '@/features/admin';
import { useCurrentUser } from '@/features/auth';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { Alert, Button, FilterChips, Input, Screen, Text } from '@/shared/ui';

type Tab = 'riders' | 'customers' | 'admins';

const TABS = [
  { value: 'riders' as const, label: 'Riders' },
  { value: 'customers' as const, label: 'Customers' },
  { value: 'admins' as const, label: 'Admins' },
];

export default function UsersScreen() {
  const me = useCurrentUser();
  const { isDesktop } = useBreakpoint();
  const [tab, setTab] = useState<Tab>('riders');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(isDesktop ? 10 : 25);
  const [isAddingRider, setIsAddingRider] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim());
  const term = debouncedSearch === '' ? undefined : debouncedSearch;

  const riders = useAdminRiders({
    search: tab === 'riders' ? term : undefined,
    page,
    per_page: perPage,
  });
  const users = useAdminUsers({
    role: tab === 'customers' ? 'customer' : 'admin',
    search: term,
    page,
    per_page: perPage,
  });
  const query = tab === 'riders' ? riders : users;
  const rows = tab === 'riders' ? (riders.data?.data ?? []) : (users.data?.data ?? []);

  const changeTab = (value: Tab | undefined) => {
    setTab(value ?? 'riders');
    setPage(1);
  };

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  if (isDesktop) {
    return (
      <View style={styles.desktop}>
        <UnderlineTabs tabs={TABS} selected={tab} onSelect={changeTab} />
        {query.isError && <Alert tone="error" message={query.error.message} />}
        <Panel isFlush>
          <View style={styles.toolbar}>
            <View style={styles.search}>
              <SearchField
                label="Search by name or number"
                placeholder="Search by name or number"
                value={search}
                onChangeText={changeSearch}
              />
            </View>
            {tab === 'riders' && (
              <AdminButton icon="add" label="New rider" onPress={() => setIsAddingRider(true)} />
            )}
          </View>
          <UsersTable
            rows={rows}
            meta={query.data?.meta}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(value) => {
              setPerPage(value);
              setPage(1);
            }}
            selfId={me.data?.id}
            isLoading={query.isPending}
          />
        </Panel>
        <AdminModal
          isOpen={isAddingRider}
          title="Add a rider"
          subtitle="Give the rider this email and password; they can change it later."
          onClose={() => setIsAddingRider(false)}
        >
          {/* Re-mount on each open so a half-typed form from last time is cleared. */}
          {isAddingRider && (
            <CreateRiderForm layout="plain" onCreated={() => setIsAddingRider(false)} />
          )}
        </AdminModal>
      </View>
    );
  }

  const filters = (
    <>
      <FilterChips options={TABS} selected={tab} onSelect={changeTab} />
      <Input
        label="Search by name or number"
        value={search}
        onChangeText={changeSearch}
        placeholder="e.g. Rico or 0917"
      />
    </>
  );

  return (
    <Screen>
      <FlatList
        data={rows}
        keyExtractor={(user) => String(user.id)}
        renderItem={({ item }) => <UserRow user={item} isSelf={item.id === me.data?.id} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Button variant="secondary" label="Back" onPress={() => router.back()} />
            <Text variant="title">Riders & users</Text>
            {tab === 'riders' && <CreateRiderForm />}
            {filters}
          </View>
        }
        ListEmptyComponent={
          query.isPending ? (
            <Text variant="caption">Loading…</Text>
          ) : query.isError ? (
            <View style={styles.stack}>
              <Alert tone="error" message={query.error.message} />
              <Button variant="secondary" label="Retry" onPress={() => void query.refetch()} />
            </View>
          ) : (
            <Text variant="caption">Nobody matches.</Text>
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
  search: { width: 320 },
});
