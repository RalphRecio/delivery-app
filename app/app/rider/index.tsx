import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { features } from '@/config/features';
import { colors, fontSize, spacing } from '@/config/theme';
import {
  AvailabilitySwitch,
  JobCard,
  RiderHeader,
  useActiveJob,
  useAvailableJobs,
  useRiderProfile,
  useSetAvailability,
  type Job,
} from '@/features/rider';
import { LowBalanceAlert, useWallet } from '@/features/wallet';
import { Alert, Button, EmptyState, Text } from '@/shared/ui';

export default function RiderHomeScreen() {
  const profile = useRiderProfile();
  const setAvailability = useSetAvailability();
  const isOnline = profile.data?.is_online ?? false;
  const activeJob = useActiveJob({ isWatchingForDispatch: isOnline });
  const wallet = useWallet();

  const hasLocation = profile.data?.current_location !== null && profile.data !== undefined;
  const currentJob = activeJob.data ?? null;
  const hasActiveJob = currentJob !== null;
  const offers = useAvailableJobs(isOnline && hasLocation && activeJob.data === null);

  const openJob = (job: Job) =>
    router.push({ pathname: '/rider/jobs/[id]', params: { id: String(job.id) } });

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* Outside the list so the header stays put while the jobs scroll. */}
      <RiderHeader />
      <FlatList
        style={styles.listBackground}
        data={offers.data ?? []}
        keyExtractor={(job) => String(job.id)}
        renderItem={({ item }) => <JobCard job={item} onPress={openJob} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={offers.isRefetching || activeJob.isRefetching}
            onRefresh={() => {
              void offers.refetch();
              void activeJob.refetch();
              void wallet.refetch();
            }}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            {profile.isPending ? (
              <Text variant="caption">Loading your profile…</Text>
            ) : profile.isError ? (
              <>
                <Alert tone="error" message={profile.error.message} />
                <Button variant="secondary" label="Retry" onPress={() => void profile.refetch()} />
              </>
            ) : (
              <AvailabilitySwitch
                isOnline={profile.data.is_online}
                onChange={(next) => setAvailability.mutate(next)}
                isSaving={setAvailability.isPending}
              />
            )}

            {currentJob !== null && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your current job</Text>
                <JobCard job={currentJob} onPress={openJob} />
              </View>
            )}

            {features.riderWallet &&
              wallet.data !== undefined &&
              !wallet.data.can_accept_bookings && (
                <LowBalanceAlert
                  wallet={wallet.data}
                  onTopUp={() => router.push('/rider/wallet/topup')}
                />
              )}

            <Text style={styles.sectionTitle}>Jobs near you</Text>
          </View>
        }
        ListEmptyComponent={
          hasActiveJob ? (
            <EmptyState
              icon="checkmark-done-outline"
              title="Busy with a job"
              hint="Finish your current job to see new offers."
            />
          ) : !isOnline ? (
            <EmptyState
              icon="moon-outline"
              title="You are offline"
              hint="Go online to see jobs near you."
            />
          ) : !hasLocation ? (
            <EmptyState
              icon="location-outline"
              title="Share your location"
              hint="Jobs are matched to where you are."
              action={
                <Button
                  icon="locate"
                  label="Set location"
                  onPress={() => router.navigate('/rider/settings')}
                />
              }
            />
          ) : offers.isPending ? (
            <Text variant="caption">Looking for jobs…</Text>
          ) : offers.isError ? (
            <View style={styles.stack}>
              <Alert tone="error" message={offers.error.message} />
              <Button variant="secondary" label="Retry" onPress={() => void offers.refetch()} />
            </View>
          ) : (
            <EmptyState
              icon="search-outline"
              title="No jobs nearby yet"
              hint="This list refreshes on its own."
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  listBackground: { backgroundColor: colors.surface },
  list: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xl },
  header: { gap: spacing.md },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.primaryDeep,
    paddingTop: spacing.sm,
  },
  stack: { gap: spacing.sm },
});
