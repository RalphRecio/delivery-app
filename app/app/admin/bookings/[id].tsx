import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { adminColors, adminFontSize } from '@/config/adminTheme';
import { spacing } from '@/config/theme';
import {
  AdminButton,
  BookingFarePanel,
  BookingHistoryPanel,
  BookingItemsPanel,
  BookingPeoplePanel,
  BookingTripPanel,
  bookingStatusTone,
  DispatchPanel,
  PageHeader,
  Panel,
  StatusPill,
  supportCancelFormSchema,
  useAdminBooking,
  useSupportCancel,
} from '@/features/admin';
import { BookingDetails } from '@/features/booking';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { Alert, Button, Input, Screen, Text } from '@/shared/ui';

export default function AdminBookingDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return <Redirect href="/admin/bookings" />;
  }

  return <AdminBookingDetail id={id} />;
}

function AdminBookingDetail({ id }: { id: number }) {
  const booking = useAdminBooking(id);
  const cancel = useSupportCancel();
  const { isDesktop } = useBreakpoint();
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string>();

  const submitCancel = () => {
    const parsed = supportCancelFormSchema.safeParse({ reason });

    if (!parsed.success) {
      setReasonError(parsed.error.issues[0]?.message);

      return;
    }

    setReasonError(undefined);
    cancel.mutate({ id, reason: parsed.data.reason });
  };

  const cancelPanel =
    booking.data !== undefined && booking.data.status !== 'cancelled' ? (
      <Panel
        title="Support cancellation"
        subtitle={
          booking.data.status === 'completed'
            ? "Delivered already. Cancelling (e.g. a dispute) refunds the commission to the rider's wallet."
            : 'Allowed at any stage. The reason is kept in the booking history.'
        }
      >
        <Input
          size="compact"
          label="Reason"
          placeholder="e.g. Rider had an accident"
          value={reason}
          onChangeText={(text) => {
            setReason(text);
            setReasonError(undefined);
          }}
          error={reasonError}
        />
        {cancel.isError && <Alert tone="error" message={cancel.error.message} />}
        <View style={styles.panelActions}>
          <AdminButton
            variant="danger"
            label="Cancel this booking"
            onPress={submitCancel}
            isLoading={cancel.isPending}
          />
        </View>
      </Panel>
    ) : null;

  const loadingOrError = booking.isPending ? (
    <Text style={styles.muted}>Loading…</Text>
  ) : booking.isError ? (
    <>
      <Alert tone="error" message={booking.error.message} />
      <AdminButton variant="outline" label="Retry" onPress={() => void booking.refetch()} />
    </>
  ) : null;

  if (isDesktop) {
    return (
      <View style={styles.desktop}>
        <PageHeader
          back={{ href: '/admin/bookings', label: 'All bookings' }}
          title={booking.data?.reference ?? 'Booking'}
          subtitle={
            booking.data === undefined
              ? undefined
              : `${booking.data.service_label} · Booked ${new Date(booking.data.created_at).toLocaleString()}`
          }
          badge={
            booking.data === undefined ? undefined : (
              <StatusPill
                label={booking.data.status_label}
                tone={bookingStatusTone(booking.data.status)}
              />
            )
          }
        />
        {loadingOrError}
        {booking.data !== undefined && (
          <View style={styles.columns}>
            <View style={styles.mainColumn}>
              <BookingTripPanel booking={booking.data} />
              <BookingItemsPanel booking={booking.data} />
              <BookingPeoplePanel booking={booking.data} />
            </View>
            <View style={styles.sideColumn}>
              {/* Waiting bookings come first: finding a rider is the dispatcher's job here. */}
              {booking.data.status === 'searching' && <DispatchPanel bookingId={id} />}
              <BookingFarePanel booking={booking.data} />
              <BookingHistoryPanel booking={booking.data} />
              {cancelPanel}
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Button
          variant="secondary"
          label="Back to bookings"
          onPress={() => router.replace('/admin/bookings')}
        />
        {loadingOrError}
        {booking.data !== undefined && (
          <>
            {booking.data.status === 'searching' && <DispatchPanel bookingId={id} />}
            <BookingDetails booking={booking.data} />
            {cancelPanel}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  desktop: { gap: 20 },
  columns: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  mainColumn: { flex: 3, gap: 16, minWidth: 0 },
  sideColumn: { flex: 2, gap: 16, minWidth: 340 },
  panelActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  muted: { fontSize: adminFontSize.sm, color: adminColors.textMuted },
});
