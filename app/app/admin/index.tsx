import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { spacing } from '@/config/theme';
import { AdminButton, PageHeader, StatTile, useDashboard } from '@/features/admin';
import { CurrentUserCard } from '@/features/auth';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { Alert, Button, Screen, Text } from '@/shared/ui';

/** Icon tile colours, one hue per figure (Tailwind 600 steps). */
const ACCENT = {
  amber: '#D97706',
  blue: '#2563EB',
  green: '#16A34A',
  red: '#DC2626',
  indigo: '#4F46E5',
  teal: '#0D9488',
  slate: '#475569',
  purple: '#9333EA',
} as const;

export default function AdminHomeScreen() {
  const dashboard = useDashboard();
  const { isDesktop } = useBreakpoint();

  const tiles =
    dashboard.data === undefined ? null : (
      <>
        <StatTile
          label="Finding a rider"
          icon="search-outline"
          accent={ACCENT.amber}
          value={dashboard.data.bookings_searching}
          hint="Waiting for a rider"
        />
        <StatTile
          label="In progress"
          icon="bicycle-outline"
          accent={ACCENT.blue}
          value={dashboard.data.bookings_in_progress}
          hint="Accepted or on the way"
        />
        <StatTile
          label="Delivered today"
          icon="checkmark-circle-outline"
          accent={ACCENT.green}
          value={dashboard.data.bookings_today.completed ?? 0}
        />
        <StatTile
          label="Cancelled today"
          icon="close-circle-outline"
          accent={ACCENT.red}
          value={dashboard.data.bookings_today.cancelled ?? 0}
        />
        <StatTile
          label="Revenue today"
          icon="cash-outline"
          accent={ACCENT.indigo}
          value={dashboard.data.revenue_today.formatted}
          hint="Completed fares"
        />
        <StatTile
          label="Riders online"
          icon="people-outline"
          accent={ACCENT.teal}
          value={`${dashboard.data.riders_online} / ${dashboard.data.riders_total}`}
          hint="Rider app open right now"
        />
        <StatTile
          label="Customers"
          icon="person-outline"
          accent={ACCENT.slate}
          value={dashboard.data.customers_total}
        />
        <StatTile
          label="Booked today"
          icon="receipt-outline"
          accent={ACCENT.purple}
          value={Object.values(dashboard.data.bookings_today).reduce((sum, n) => sum + n, 0)}
        />
      </>
    );

  const body = dashboard.isPending ? (
    <Text variant="caption">Loading…</Text>
  ) : dashboard.isError ? (
    <>
      <Alert tone="error" message={dashboard.error.message} />
      <Button variant="secondary" label="Retry" onPress={() => void dashboard.refetch()} />
    </>
  ) : (
    <>
      <View style={isDesktop ? styles.gridDesktop : styles.gridMobile}>{tiles}</View>
      {!isDesktop && <Text variant="caption">Refreshes every 30 seconds.</Text>}
    </>
  );

  if (isDesktop) {
    return (
      <View style={styles.desktop}>
        <PageHeader
          title="Dashboard"
          subtitle="Bookings, riders and revenue today. Refreshes every 30 seconds."
          actions={
            <AdminButton
              variant="outline"
              icon="refresh-outline"
              label="Refresh"
              onPress={() => void dashboard.refetch()}
              isLoading={dashboard.isRefetching}
            />
          }
        />
        {body}
      </View>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="title">Admin</Text>
        <CurrentUserCard />
        <View style={styles.nav}>
          <View style={styles.navItem}>
            <Button label="Bookings" onPress={() => router.push('/admin/bookings')} />
          </View>
          <View style={styles.navItem}>
            <Button label="Riders & users" onPress={() => router.push('/admin/users')} />
          </View>
          <View style={styles.navItem}>
            <Button label="Stores" onPress={() => router.push('/admin/stores')} />
          </View>
          <View style={styles.navItem}>
            <Button label="Tariffs" onPress={() => router.push('/admin/tariffs')} />
          </View>
        </View>
        <Text style={styles.sectionTitle}>Today</Text>
        {body}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  desktop: { gap: 20 },
  nav: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  navItem: { flexGrow: 1, minWidth: 120 },
  sectionTitle: { fontWeight: '700' },
  gridMobile: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  // Four tiles per row on a wide screen; they wrap to two or three on narrower desktops.
  gridDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
});
