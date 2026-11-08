import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/config/theme';
import { formatPhilippineMobile } from '@/features/auth';
import { formatMoney } from '@/shared/lib/format';
import { Card, Text } from '@/shared/ui';

import type { Booking, Contact } from '../types';

import { BookingStatusBadge } from './BookingStatusBadge';
import { FareSummary } from './FareSummary';

interface BookingDetailsProps {
  booking: Booking;
  /** `split` puts the fare and history beside the trip details (desktop). */
  layout?: 'stacked' | 'split';
}

export function BookingDetails({ booking, layout = 'stacked' }: BookingDetailsProps) {
  const isSplit = layout === 'split';

  return (
    <View style={styles.stack}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="title">{booking.service_label}</Text>
          <Text variant="caption">Reference {booking.reference}</Text>
        </View>
        <BookingStatusBadge booking={booking} />
      </View>

      <View style={isSplit ? styles.columns : styles.stack}>
        <View style={isSplit ? styles.mainColumn : styles.stack}>
          <Card>
            <Text variant="label">Trip</Text>
            <LocationRow
              icon={booking.service_type === 'pabili' ? 'storefront-outline' : 'location-outline'}
              title={booking.service_type === 'pabili' ? 'Where to buy' : 'Pickup'}
              location={booking.pickup}
            />
            <View style={styles.divider} />
            <LocationRow icon="flag-outline" title="Drop-off" location={booking.dropoff} />
          </Card>

          {booking.items !== null && (
            <Card>
              <Text variant="label">
                {booking.store !== null && booking.store !== undefined
                  ? `Order from ${booking.store.name}`
                  : 'Shopping list'}
              </Text>
              {booking.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.quantity}>
                    <Text style={styles.quantityText}>{item.quantity}×</Text>
                  </View>
                  <Text style={styles.itemText}>
                    {item.name}
                    {item.note !== null ? ` (${item.note})` : ''}
                  </Text>
                  {item.unit_price_centavos !== null && item.unit_price_centavos !== undefined && (
                    <Text variant="caption">
                      {formatMoney(item.unit_price_centavos * item.quantity)}
                    </Text>
                  )}
                </View>
              ))}
              {(booking.items_subtotal !== null && booking.items_subtotal !== undefined) ||
              booking.purchase_budget !== null ? (
                <View style={styles.itemFooter}>
                  {booking.items_subtotal !== null && booking.items_subtotal !== undefined && (
                    <Text variant="caption">Items subtotal {booking.items_subtotal.formatted}</Text>
                  )}
                  {booking.purchase_budget !== null && (
                    <Text variant="caption">
                      Purchase budget {booking.purchase_budget.formatted}
                    </Text>
                  )}
                </View>
              ) : null}
            </Card>
          )}

          <View style={isSplit ? styles.contactsRow : styles.stack}>
            {booking.customer !== undefined && (
              <ContactCard title="Customer" icon="person-outline" contact={booking.customer} />
            )}
            {booking.rider !== undefined && booking.rider !== null && (
              <ContactCard
                title={booking.customer !== undefined ? 'Rider' : 'Your rider'}
                icon="bicycle-outline"
                contact={booking.rider}
              />
            )}
          </View>

          {booking.notes !== null && (
            <Card>
              <Text variant="label">Notes for the rider</Text>
              <Text>{booking.notes}</Text>
            </Card>
          )}
        </View>

        <View style={isSplit ? styles.sideColumn : styles.stack}>
          <FareSummary fare={booking.fare} />

          {booking.status_logs !== undefined && booking.status_logs.length > 0 && (
            <Card>
              <Text variant="label">History</Text>
              {booking.status_logs.map((log, index) => (
                <View key={index} style={styles.logRow}>
                  <View style={styles.logDot} />
                  <View style={styles.logText}>
                    <Text style={styles.logStatus}>{log.to_status_label}</Text>
                    <Text variant="caption">
                      {new Date(log.created_at).toLocaleString()}
                      {log.reason !== null ? ` · ${log.reason}` : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </View>
      </View>
    </View>
  );
}

function LocationRow({
  icon,
  title,
  location,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  location: Booking['pickup'];
}) {
  return (
    <View style={styles.locationRow}>
      <View style={styles.locationIcon}>
        <Ionicons name={icon} size={16} color={colors.primaryPressed} />
      </View>
      <View style={styles.locationText}>
        <Text variant="caption">{title}</Text>
        <Text>{location.address}</Text>
        {location.landmark !== null && <Text variant="caption">Landmark: {location.landmark}</Text>}
        {location.details !== null && <Text variant="caption">{location.details}</Text>}
      </View>
    </View>
  );
}

function ContactCard({
  title,
  icon,
  contact,
}: {
  title: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  contact: Contact;
}) {
  return (
    <Card style={styles.contactCard}>
      <Text variant="label">{title}</Text>
      <View style={styles.locationRow}>
        <View style={styles.locationIcon}>
          <Ionicons name={icon} size={16} color={colors.primaryPressed} />
        </View>
        <View style={styles.locationText}>
          <Text>{contact.name ?? 'No name yet'}</Text>
          <Text variant="caption">{formatPhilippineMobile(contact.phone)}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  columns: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  mainColumn: { flex: 3, gap: spacing.md },
  sideColumn: { flex: 2, gap: spacing.md, minWidth: 320 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: { flex: 1, gap: spacing.xs },
  divider: { height: 1, backgroundColor: colors.border },
  locationRow: { flexDirection: 'row', gap: spacing.sm + 4, alignItems: 'flex-start' },
  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: { flex: 1, gap: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  quantity: {
    minWidth: 36,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  quantityText: { fontWeight: '600', fontSize: 13 },
  itemText: { flex: 1 },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  contactsRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  contactCard: { flex: 1, minWidth: 220 },
  logRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    backgroundColor: colors.primary,
  },
  logText: { flex: 1 },
  logStatus: { fontWeight: '600' },
});
