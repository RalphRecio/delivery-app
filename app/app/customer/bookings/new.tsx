import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { features } from '@/config/features';
import { spacing } from '@/config/theme';
import {
  BookingForm,
  offeringParams,
  resolveOffering,
  SERVICE_OFFERINGS,
  type ServiceOffering,
} from '@/features/booking';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { ActionCard, Button, Screen, Text } from '@/shared/ui';
import { BackBar } from '@/shared/ui/BackBar';
import { useCartStore } from '@/stores/cartStore';

export default function NewBookingScreen() {
  const params = useLocalSearchParams<{ serviceType?: string; category?: string; mode?: string }>();
  const { isDesktop } = useBreakpoint();
  const cartStore = useCartStore((state) => state.store);
  const offering = resolveOffering(params.serviceType, params.category);
  // Without the catalogue every Pabili is typed by hand; with it, only when the customer asks.
  const isManualPabili = !features.storeCatalogue || params.mode === 'manual';

  if (offering === null) {
    return <Redirect href="/customer" />;
  }

  const title = `Book ${offering.title}`;
  const blurb =
    offering.serviceType === 'pabili'
      ? `${offering.blurb} A rider buys it and brings it to you.`
      : offering.blurb;
  const onBooked = (booking: { id: number }) =>
    router.replace({ pathname: '/customer/bookings/[id]', params: { id: String(booking.id) } });
  const switchTo = (next: ServiceOffering) =>
    next.serviceType === 'pabili' && features.storeCatalogue
      ? router.push({ pathname: '/customer/stores', params: offeringParams(next) })
      : router.setParams(offeringParams(next));
  // Pabili can be booked from a store's menu or as a typed list; offer the other way here.
  const isStoreOrder = !isManualPabili && cartStore !== null;
  const storeChoice =
    offering.serviceType === 'pabili' && features.storeCatalogue && !isStoreOrder ? (
      <ActionCard
        icon="storefront-outline"
        title="Prefer a specific store?"
        description="Choose a store and add items from its menu instead of typing a list."
        actionLabel="Choose a store"
        onPress={() =>
          router.push({ pathname: '/customer/stores', params: offeringParams(offering) })
        }
      />
    ) : null;
  const form = (layout: 'stacked' | 'split') => (
    <BookingForm
      key={offering.key}
      serviceType={offering.serviceType}
      pabiliCategory={offering.pabiliCategory ?? undefined}
      onBooked={onBooked}
      layout={layout}
      isManualPabili={isManualPabili}
      onChangeStore={() =>
        router.push({ pathname: '/customer/stores', params: offeringParams(offering) })
      }
    />
  );

  if (isDesktop) {
    return (
      <View style={styles.desktop}>
        <View style={styles.desktopHeader}>
          <View style={styles.desktopTitle}>
            <Text variant="title">{title}</Text>
            <Text variant="caption">{blurb}</Text>
          </View>
          <View style={styles.switcher}>
            {SERVICE_OFFERINGS.map((option) => (
              <Button
                key={option.key}
                variant={option.key === offering.key ? 'primary' : 'secondary'}
                label={option.title}
                onPress={() => switchTo(option)}
              />
            ))}
          </View>
        </View>
        {storeChoice}
        {form('split')}
      </View>
    );
  }

  return (
    <Screen>
      <BackBar fallbackHref="/customer" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="title">{title}</Text>
        <Text variant="caption">{blurb}</Text>
        {storeChoice}
        {form('stacked')}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  desktop: { gap: spacing.lg },
  desktopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  desktopTitle: { gap: spacing.xs, flex: 1 },
  switcher: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'flex-end' },
});
