import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { features } from '@/config/features';
import { offeringParams, resolveOffering, type ServiceOffering } from '@/features/booking';
import { spacing } from '@/config/theme';
import { CartBar, ProductRow, useStore, type Store } from '@/features/store';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { ActionCard, Alert, Badge, Button, Card, Screen, Text } from '@/shared/ui';
import { BackBar } from '@/shared/ui/BackBar';
import { selectCartCount, selectCartSubtotalCentavos, useCartStore } from '@/stores/cartStore';

export default function StoreScreen() {
  const params = useLocalSearchParams<{ id?: string; category?: string }>();
  const id = Number(params.id);
  const offering = resolveOffering('pabili', params.category);

  // The catalogue is paused (ADR 0013); the URL still exists, so send people to the typed list.
  if (!features.storeCatalogue) {
    return (
      <Redirect href={{ pathname: '/customer/bookings/new', params: { serviceType: 'pabili' } }} />
    );
  }

  if (offering === null || !Number.isInteger(id) || id <= 0) {
    return <Redirect href="/customer" />;
  }

  return <StoreMenu id={id} offering={offering} />;
}

/**
 * A store's menu of available items; adding one starts (or adds to) the order.
 * A store without a menu yet still takes orders: the customer types the list.
 */
function StoreMenu({ id, offering }: { id: number; offering: ServiceOffering }) {
  const storesHref = { pathname: '/customer/stores', params: offeringParams(offering) } as const;
  const { isDesktop } = useBreakpoint();
  const store = useStore(id);
  const cart = useCartStore();
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotalCentavos);
  const isThisStore = cart.store?.id === id;

  const quantityOf = (productId: number) =>
    isThisStore ? (cart.lines[productId]?.quantity ?? 0) : 0;

  const change = (data: Store, productId: number, quantity: number) => {
    const product = data.products?.find((p) => p.id === productId);

    if (product === undefined) {
      return;
    }

    cart.startOrder({
      id: data.id,
      name: data.name,
      address: data.address,
      location: data.location,
    });
    cart.setQuantity(
      { id: product.id, name: product.name, priceCentavos: product.price.centavos },
      quantity,
    );
  };

  const continueToBooking = () =>
    router.push({ pathname: '/customer/bookings/new', params: offeringParams(offering) });

  // Starts an order at this store with no menu lines; the booking form then
  // asks for a typed list, and the store is still the pickup.
  const typeOrder = (data: Store) => {
    cart.startOrder({
      id: data.id,
      name: data.name,
      address: data.address,
      location: data.location,
    });
    continueToBooking();
  };
  const hasMenu = (store.data?.products ?? []).length > 0;

  const body = store.isPending ? (
    <Text variant="caption">Loading the menu…</Text>
  ) : store.isError ? (
    <>
      <Alert tone="error" message={store.error.message} />
      <Button variant="secondary" label="Retry" onPress={() => void store.refetch()} />
    </>
  ) : (
    <>
      <View style={styles.storeHeader}>
        <Text variant="title">{store.data.name}</Text>
        <Badge label={store.data.category_label} tone="neutral" />
      </View>
      <Text variant="caption">{store.data.address}</Text>
      {store.data.landmark !== null && (
        <Text variant="caption">Landmark: {store.data.landmark}</Text>
      )}
      {hasMenu ? (
        <>
          <Text style={styles.cartTitle}>Available items</Text>
          <Card>
            {(store.data.products ?? []).map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                quantity={quantityOf(product.id)}
                onChange={(quantity) => change(store.data, product.id, quantity)}
              />
            ))}
          </Card>
        </>
      ) : (
        <ActionCard
          icon="create-outline"
          title="Type your order"
          description={`${store.data.name} has no menu in the app yet. List what you want and the rider buys it here.`}
          actionLabel="Type my order"
          onPress={() => typeOrder(store.data)}
        />
      )}
    </>
  );

  const bar = isThisStore ? (
    <CartBar count={count} subtotalCentavos={subtotal} onPress={continueToBooking} />
  ) : null;

  if (isDesktop) {
    return (
      <View style={styles.desktop}>
        <View style={styles.desktopMenu}>
          <Button variant="ghost" label="← All stores" onPress={() => router.push(storesHref)} />
          {body}
        </View>
        <View style={styles.desktopCart}>
          <Card>
            <Text style={styles.cartTitle}>Your order</Text>
            {count === 0 || !isThisStore ? (
              <Text variant="caption">
                {hasMenu
                  ? 'Tap + on a product to start your order.'
                  : 'Type what you want; the rider buys it at this store.'}
              </Text>
            ) : (
              <>
                <Text variant="caption">
                  {count === 1 ? '1 item' : `${count} items`} from {store.data?.name}
                </Text>
                {bar}
              </>
            )}
          </Card>
        </View>
      </View>
    );
  }

  return (
    <Screen>
      <BackBar fallbackHref={storesHref} label="All stores" />
      <ScrollView contentContainerStyle={styles.content}>{body}</ScrollView>
      {bar !== null && <View style={styles.barWrap}>{bar}</View>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.sm, paddingBottom: 96 },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  barWrap: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.lg },
  desktop: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  desktopMenu: { flex: 2, gap: spacing.sm },
  desktopCart: { flex: 1, gap: spacing.sm },
  cartTitle: { fontWeight: '700' },
});
