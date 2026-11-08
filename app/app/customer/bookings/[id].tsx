import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { spacing } from '@/config/theme';
import {
  BookingDetails,
  RiderTrackingCard,
  useBooking,
  useCancelBooking,
} from '@/features/booking';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { Alert, Button, Card, Screen, Text } from '@/shared/ui';
import { BackBar } from '@/shared/ui/BackBar';

export default function BookingDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return <Redirect href="/customer/bookings" />;
  }

  return <BookingDetail id={id} />;
}

function BookingDetail({ id }: { id: number }) {
  const booking = useBooking(id);
  const cancel = useCancelBooking();
  const { isDesktop } = useBreakpoint();

  const content = booking.isPending ? (
    <Text variant="caption">Loading booking…</Text>
  ) : booking.isError ? (
    <>
      <Alert tone="error" message={booking.error.message} />
      <Button variant="secondary" label="Retry" onPress={() => void booking.refetch()} />
    </>
  ) : (
    <>
      <RiderTrackingCard booking={booking.data} />
      <BookingDetails booking={booking.data} layout={isDesktop ? 'split' : 'stacked'} />
    </>
  );

  const actions = booking.data !== undefined && (
    <>
      {cancel.isError && <Alert tone="error" message={cancel.error.message} />}
      {booking.data.can_cancel && (
        <Button
          variant="secondary"
          label="Cancel booking"
          onPress={() => cancel.mutate({ id, reason: null })}
          isLoading={cancel.isPending}
        />
      )}
    </>
  );

  if (isDesktop) {
    return (
      <View style={styles.desktop}>
        <View>
          <Button
            variant="ghost"
            label="← Back to bookings"
            onPress={() => router.push('/customer/bookings')}
          />
        </View>
        {content}
        {booking.data?.can_cancel === true && (
          <Card style={styles.desktopActions}>
            <Text style={styles.sectionTitle}>Need to change plans?</Text>
            <Text variant="caption">You can cancel until a rider is on the way.</Text>
            {actions}
          </Card>
        )}
      </View>
    );
  }

  return (
    <Screen>
      <BackBar fallbackHref="/customer/bookings" label="Bookings" />
      <ScrollView contentContainerStyle={styles.content}>
        {content}
        {actions}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  desktop: { gap: spacing.lg },
  desktopActions: { maxWidth: 420, gap: spacing.sm },
  sectionTitle: { fontWeight: '700' },
});
