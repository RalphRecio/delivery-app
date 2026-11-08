<?php

declare(strict_types=1);

namespace App\Domain\Booking\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Data\BookingItemData;
use App\Domain\Booking\Data\CreateBookingData;
use App\Domain\Booking\Data\CreatePabiliBookingData;
use App\Domain\Booking\Data\LocationData;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Events\BookingCreated;
use App\Domain\Booking\Exceptions\PurchaseBudgetTooLowException;
use App\Domain\Booking\Models\Booking;
use App\Domain\Booking\Services\FareSettingsRepository;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Store\Exceptions\ProductNotAvailableException;
use App\Domain\Store\Exceptions\StoreNotAvailableException;
use App\Domain\Store\Models\Store;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

/**
 * Creates a booking with a server-computed fare. Any price the client sent
 * is ignored; the quote is recalculated here from the same inputs. For a
 * Pabili order from a store, the store supplies the pickup and the product
 * names and prices are snapshotted from the catalogue, never from the client.
 */
final readonly class CreateBookingAction
{
    public function __construct(
        private QuoteFareAction $quoteFare,
        private FareSettingsRepository $fareSettings,
    ) {}

    public function handle(User $customer, CreateBookingData $data): Booking
    {
        $existing = $this->findByIdempotencyKey($customer, $data->idempotencyKey);

        if ($existing !== null) {
            Log::info('Booking creation replayed', ['booking_id' => $existing->id, 'user_id' => $customer->id]);

            return $existing;
        }

        $order = $data instanceof CreatePabiliBookingData ? $this->resolveOrder($data) : null;
        $pickup = $this->resolvePickup($data, $order);
        $quote = $this->quoteFare->handle($data->serviceType(), $pickup->point, $data->dropoff->point);
        // Saved on the booking so a later rate change never touches this job.
        $commissionRateBps = $this->fareSettings->forServiceType($data->serviceType())->commissionRateBps;

        $booking = DB::transaction(function () use ($customer, $data, $quote, $pickup, $order, $commissionRateBps): Booking {
            $booking = Booking::query()->create([
                'customer_id' => $customer->id,
                'service_type' => $data->serviceType(),
                'status' => BookingStatus::Pending,
                'payment_method' => $data->paymentMethod,
                'pickup_address' => $pickup->address,
                'pickup_landmark' => $pickup->landmark,
                'pickup_details' => $pickup->details,
                'pickup_location' => $pickup->point,
                'dropoff_address' => $data->dropoff->address,
                'dropoff_landmark' => $data->dropoff->landmark,
                'dropoff_details' => $data->dropoff->details,
                'dropoff_location' => $data->dropoff->point,
                'distance_meters' => $quote->fare->distanceMeters,
                'base_fare_centavos' => $quote->fare->baseFare->centavos,
                'distance_fare_centavos' => $quote->fare->distanceFare->centavos,
                'service_fee_centavos' => $quote->fare->serviceFee->centavos,
                'total_fare_centavos' => $quote->fare->total->centavos,
                'commission_rate_bps' => $commissionRateBps,
                'notes' => $data->notes,
                'idempotency_key' => $data->idempotencyKey,
                ...$data->serviceAttributes(),
                ...($order?->attributes() ?? []),
            ]);

            $booking->statusLogs()->create([
                'from_status' => null,
                'to_status' => BookingStatus::Pending,
                'actor_id' => $customer->id,
            ]);

            DB::afterCommit(fn () => BookingCreated::dispatch($booking));

            return $booking;
        });

        Log::info('Booking created', [
            'booking_id' => $booking->id,
            'user_id' => $customer->id,
            'service_type' => $booking->service_type->value,
            'total_fare_centavos' => $booking->total_fare_centavos,
        ]);

        // The model still holds the EWKT strings it was created with; reload
        // so the geography columns come back through the cast as GeoPoints.
        return $booking->refresh();
    }

    /**
     * A store supplies the pickup; otherwise the customer's own; otherwise,
     * for Pabili only, the rider chooses a store near the drop-off.
     */
    private function resolvePickup(CreateBookingData $data, ?ResolvedOrder $order): LocationData
    {
        if ($order !== null) {
            return $order->pickup;
        }

        if ($data->pickup !== null) {
            return $data->pickup;
        }

        if ($data instanceof CreatePabiliBookingData) {
            return LocationData::riderChoiceNear($data->dropoff);
        }

        throw new InvalidArgumentException('A Pasuyo booking needs a pickup location.');
    }

    /**
     * Looks the store and its products up, prices the catalogue items, and
     * checks the customer's budget covers them. Custom items (no product id)
     * pass through unpriced.
     */
    private function resolveOrder(CreatePabiliBookingData $data): ?ResolvedOrder
    {
        if ($data->storeId === null) {
            return null;
        }

        $store = Store::query()->active()->with('products')->find($data->storeId);

        if ($store === null) {
            throw new StoreNotAvailableException;
        }

        $products = $store->products->where('is_available', true)->keyBy('id');
        $subtotal = Money::zero();
        $items = [];

        foreach ($data->items as $item) {
            if ($item->productId === null) {
                $items[] = $item;

                continue;
            }

            $product = $products->get($item->productId);

            if ($product === null) {
                throw new ProductNotAvailableException($item->productId);
            }

            $items[] = $item->withPrice($product->name, $product->price_centavos);
            $subtotal = $subtotal->add($product->price()->multiply($item->quantity));
        }

        if ($data->purchaseBudget->isLessThan($subtotal)) {
            throw new PurchaseBudgetTooLowException($subtotal);
        }

        return new ResolvedOrder(
            pickup: new LocationData(address: $store->address, point: $store->location, landmark: $store->landmark, details: $store->name),
            items: $items,
            subtotal: $subtotal,
        );
    }

    private function findByIdempotencyKey(User $customer, ?string $key): ?Booking
    {
        if ($key === null) {
            return null;
        }

        return Booking::query()->forCustomer($customer)->where('idempotency_key', $key)->first();
    }
}

/** @internal what resolveOrder() adds to a store order */
final readonly class ResolvedOrder
{
    /**
     * @param  list<BookingItemData>  $items
     */
    public function __construct(
        public LocationData $pickup,
        public array $items,
        public Money $subtotal,
    ) {}

    /** @return array<string, mixed> */
    public function attributes(): array
    {
        return [
            'items' => array_map(static fn (BookingItemData $item) => $item->toArray(), $this->items),
            'items_subtotal_centavos' => $this->subtotal->centavos,
        ];
    }
}
