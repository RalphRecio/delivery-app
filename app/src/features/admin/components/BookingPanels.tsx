import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { adminColors, adminFontSize } from '@/config/adminTheme';
import { formatPhilippineMobile } from '@/features/auth';
import type { Booking, Contact } from '@/features/booking';
import { formatDistance, formatMoney } from '@/shared/lib/format';
import { Text } from '@/shared/ui';

import { Panel } from '../ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Pickup (or where to buy) and drop-off, with landmark and details. */
export function BookingTripPanel({ booking }: { booking: Booking }) {
  const isPabili = booking.service_type === 'pabili';

  return (
    <Panel
      title="Trip"
      subtitle={`${formatDistance(booking.fare.distance_meters)} · paid in cash on delivery`}
    >
      <IconRow icon={isPabili ? 'storefront-outline' : 'location-outline'}>
        <Text style={styles.rowLabel}>{isPabili ? 'Where to buy' : 'Pickup'}</Text>
        <LocationLines location={booking.pickup} />
      </IconRow>
      <View style={styles.divider} />
      <IconRow icon="flag-outline">
        <Text style={styles.rowLabel}>Drop-off</Text>
        <LocationLines location={booking.dropoff} />
      </IconRow>
      {booking.notes !== null && (
        <>
          <View style={styles.divider} />
          <IconRow icon="chatbox-ellipses-outline">
            <Text style={styles.rowLabel}>Notes for the rider</Text>
            <Text style={styles.value}>{booking.notes}</Text>
          </IconRow>
        </>
      )}
    </Panel>
  );
}

/** The shopping list or store order; nothing for Pasuyo bookings without items. */
export function BookingItemsPanel({ booking }: { booking: Booking }) {
  if (booking.items === null) {
    return null;
  }

  const title =
    booking.store !== null && booking.store !== undefined
      ? `Order from ${booking.store.name}`
      : 'Shopping list';
  const count = booking.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Panel title={title} subtitle={`${count} ${count === 1 ? 'item' : 'items'}`}>
      {booking.items.map((item, index) => (
        <View key={index} style={styles.itemRow}>
          <View style={styles.quantity}>
            <Text style={styles.quantityText}>{item.quantity}×</Text>
          </View>
          <Text style={[styles.value, styles.flex]}>
            {item.name}
            {item.note !== null ? ` (${item.note})` : ''}
          </Text>
          {item.unit_price_centavos !== null && item.unit_price_centavos !== undefined && (
            <Text style={styles.muted}>
              {formatMoney(item.unit_price_centavos * item.quantity)}
            </Text>
          )}
        </View>
      ))}
      {(booking.items_subtotal !== null && booking.items_subtotal !== undefined) ||
      booking.purchase_budget !== null ? (
        <View style={styles.itemFooter}>
          {booking.items_subtotal !== null && booking.items_subtotal !== undefined && (
            <SummaryRow label="Items subtotal" value={booking.items_subtotal.formatted} />
          )}
          {booking.purchase_budget !== null && (
            <SummaryRow label="Purchase budget" value={booking.purchase_budget.formatted} />
          )}
        </View>
      ) : null}
    </Panel>
  );
}

/** Customer and rider side by side. */
export function BookingPeoplePanel({ booking }: { booking: Booking }) {
  return (
    <Panel title="People">
      <View style={styles.people}>
        {booking.customer !== undefined && (
          <Person title="Customer" icon="person-outline" contact={booking.customer} />
        )}
        <Person
          title="Rider"
          icon="bicycle-outline"
          contact={booking.rider ?? null}
          emptyText="Not assigned yet"
        />
      </View>
    </Panel>
  );
}

export function BookingFarePanel({ booking }: { booking: Booking }) {
  const { fare } = booking;

  return (
    <Panel title="Fare" subtitle="Paid in cash to the rider on delivery">
      <SummaryRow
        label={`Base fare (${formatDistance(fare.distance_meters)})`}
        value={fare.base_fare.formatted}
      />
      <SummaryRow label="Distance" value={fare.distance_fare.formatted} />
      {fare.service_fee.centavos > 0 && (
        <SummaryRow label="Service fee" value={fare.service_fee.formatted} />
      )}
      <View style={styles.divider} />
      <SummaryRow label="Total" value={fare.total.formatted} isEmphasised />
    </Panel>
  );
}

export function BookingHistoryPanel({ booking }: { booking: Booking }) {
  const logs = booking.status_logs ?? [];

  if (logs.length === 0) {
    return null;
  }

  return (
    <Panel title="History" subtitle="Every status change, newest last">
      {logs.map((log, index) => (
        <View key={index} style={styles.logRow}>
          <View style={styles.logLine}>
            <View style={styles.logDot} />
            {index < logs.length - 1 && <View style={styles.logConnector} />}
          </View>
          <View style={styles.flex}>
            <Text style={styles.value}>{log.to_status_label}</Text>
            <Text style={styles.muted}>
              {new Date(log.created_at).toLocaleString()}
              {log.reason !== null ? ` · ${log.reason}` : ''}
            </Text>
          </View>
        </View>
      ))}
    </Panel>
  );
}

function IconRow({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <View style={styles.iconRow}>
      <View style={styles.iconTile}>
        <Ionicons name={icon} size={16} color={adminColors.textSecondary} />
      </View>
      <View style={[styles.flex, styles.iconRowText]}>{children}</View>
    </View>
  );
}

function LocationLines({ location }: { location: Booking['pickup'] }) {
  return (
    <>
      <Text style={styles.value}>{location.address}</Text>
      {location.landmark !== null && (
        <Text style={styles.muted}>Landmark: {location.landmark}</Text>
      )}
      {location.details !== null && <Text style={styles.muted}>{location.details}</Text>}
    </>
  );
}

function Person({
  title,
  icon,
  contact,
  emptyText,
}: {
  title: string;
  icon: IconName;
  contact: Contact | null;
  emptyText?: string;
}) {
  return (
    <View style={styles.person}>
      <IconRow icon={icon}>
        <Text style={styles.rowLabel}>{title}</Text>
        {contact === null ? (
          <Text style={styles.muted}>{emptyText}</Text>
        ) : (
          <>
            <Text style={styles.value}>{contact.name ?? 'No name yet'}</Text>
            <Text style={styles.muted}>{formatPhilippineMobile(contact.phone)}</Text>
          </>
        )}
      </IconRow>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  isEmphasised = false,
}: {
  label: string;
  value: string;
  isEmphasised?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={isEmphasised ? styles.total : styles.muted}>{label}</Text>
      <Text style={isEmphasised ? styles.total : styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  divider: { height: 1, backgroundColor: adminColors.border },
  iconRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconRowText: { gap: 2 },
  iconTile: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: adminColors.surfaceMuted,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: adminFontSize.sm, fontWeight: '500', color: adminColors.textMuted },
  value: { fontSize: adminFontSize.base, color: adminColors.text },
  muted: { fontSize: adminFontSize.sm, color: adminColors.textMuted },
  total: { fontSize: adminFontSize.lg, fontWeight: '600', color: adminColors.text },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quantity: {
    minWidth: 36,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: adminColors.surfaceMuted,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
  },
  quantityText: { fontSize: adminFontSize.sm, fontWeight: '600', color: adminColors.textSecondary },
  itemFooter: { gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: adminColors.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  people: { flexDirection: 'row', gap: 20, flexWrap: 'wrap' },
  person: { flex: 1, minWidth: 200 },
  logRow: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  logLine: { width: 10, alignItems: 'center' },
  logDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: adminColors.navActiveIcon,
  },
  logConnector: { flex: 1, width: 2, marginTop: 2, backgroundColor: adminColors.border },
});
