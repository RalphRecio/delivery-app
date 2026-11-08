import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { features } from '@/config/features';
import { colors, fontSize, spacing } from '@/config/theme';
import {
  offeringParams,
  SERVICE_OFFERINGS,
  type Booking,
  type ServiceOffering,
} from '@/features/booking';
import { GreetingCard, HomeHeader, RiderStatusCard, ServiceCard } from '@/features/customer';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { Text } from '@/shared/ui';

export default function CustomerHomeScreen() {
  const { isDesktop } = useBreakpoint();

  const openBooking = (booking: Booking) =>
    router.push({ pathname: '/customer/bookings/[id]', params: { id: String(booking.id) } });
  // With the catalogue on, Pabili starts at the store list (like Grab);
  // otherwise every offering goes straight to the form.
  const book = (offering: ServiceOffering) =>
    offering.serviceType === 'pabili' && features.storeCatalogue
      ? router.push({ pathname: '/customer/stores', params: offeringParams(offering) })
      : router.push({ pathname: '/customer/bookings/new', params: offeringParams(offering) });
  // No notification inbox yet; booking updates live on the Bookings tab.
  const openUpdates = () => router.navigate('/customer/bookings');

  const services = (
    <View style={styles.services}>
      <Text style={styles.sectionTitle}>Services</Text>
      <View style={isDesktop ? styles.desktopGrid : styles.list}>
        {SERVICE_OFFERINGS.map((offering) => (
          <View key={offering.key} style={isDesktop ? styles.desktopCell : undefined}>
            <ServiceCard offering={offering} onPress={book} />
          </View>
        ))}
      </View>
    </View>
  );

  if (isDesktop) {
    return (
      <View style={styles.page}>
        <HomeHeader onBellPress={openUpdates} />
        <View style={styles.bannerTail} />
        <View style={[styles.sheet, styles.desktopSheet]}>
          <View style={styles.desktopColumn}>
            <GreetingCard onBook={book} />
            <RiderStatusCard onOpenBooking={openBooking} />
          </View>
          <View style={styles.desktopServices}>{services}</View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* Outside the scroll view so the banner stays put while the page scrolls. */}
      <HomeHeader onBellPress={openUpdates} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* The greeting card rides up over this green strip, as in the Grab home. */}
        <View style={styles.bannerTail} />
        <View style={styles.sheet}>
          <GreetingCard onBook={book} />
          <RiderStatusCard onOpenBooking={openBooking} />
          {services}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingBottom: spacing.xl, backgroundColor: colors.surface },
  page: {},
  /** The banner's lower edge, laid under the sheet so the greeting card overlaps it. */
  bannerTail: { height: spacing.xl + spacing.lg, backgroundColor: colors.primary },
  sheet: {
    marginTop: -(spacing.xl + spacing.sm),
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  desktopSheet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  desktopColumn: { flex: 1, gap: spacing.lg },
  desktopServices: { flex: 1.2, marginTop: spacing.xl + spacing.sm },
  services: { gap: spacing.sm },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.primaryDeep,
    paddingBottom: spacing.xs,
  },
  list: { gap: spacing.sm },
  desktopGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  desktopCell: { flexBasis: '46%', flexGrow: 1, minWidth: 260 },
});
