<?php

declare(strict_types=1);

namespace App\Domain\Booking\Models;

use App\Domain\Auth\Models\User;
use App\Domain\Booking\Enums\BookingStatus;
use App\Domain\Booking\Enums\PabiliCategory;
use App\Domain\Booking\Enums\PaymentMethod;
use App\Domain\Booking\Enums\ServiceType;
use App\Domain\Shared\Casts\GeoPointCast;
use App\Domain\Shared\ValueObjects\GeoPoint;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Store\Models\Store;
use Carbon\CarbonImmutable;
use Database\Factories\BookingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One delivery job. Pabili bookings carry a shopping list and a purchase
 * budget; Pasuyo bookings carry the recipient and a parcel description.
 * The fare columns are a snapshot of what the customer agreed to, so later
 * tariff changes never alter an existing booking.
 *
 * @property int $id
 * @property string $reference Short public code shown to people, e.g. "BK-7F3A2K9Q"
 * @property int $customer_id
 * @property int|null $rider_id
 * @property ServiceType $service_type
 * @property BookingStatus $status
 * @property PaymentMethod $payment_method
 * @property string $pickup_address
 * @property string|null $pickup_landmark
 * @property string|null $pickup_details
 * @property GeoPoint $pickup_location
 * @property string $dropoff_address
 * @property string|null $dropoff_landmark
 * @property string|null $dropoff_details
 * @property GeoPoint $dropoff_location
 * @property int $distance_meters
 * @property int $base_fare_centavos
 * @property int $distance_fare_centavos
 * @property int $service_fee_centavos
 * @property int $total_fare_centavos
 * @property int|null $commission_rate_bps Copied from the tariff at creation; null on bookings older than the wallet
 * @property string|null $notes
 * @property int|null $store_id Pabili from a store catalogue
 * @property PabiliCategory|null $pabili_category Pabili only
 * @property list<array{name: string, quantity: int, note: string|null, product_id?: int|null, unit_price_centavos?: int|null}>|null $items Pabili only
 * @property int|null $items_subtotal_centavos Sum of catalogue items, Pabili from a store only
 * @property int|null $purchase_budget_centavos Pabili only
 * @property string|null $recipient_name Pasuyo only
 * @property string|null $recipient_phone Pasuyo only
 * @property string|null $parcel_description Pasuyo only
 * @property int|null $search_radius_meters Set while `searching`; widened by WidenRiderSearchAction
 * @property CarbonImmutable|null $search_widened_at
 * @property string|null $idempotency_key
 * @property string|null $cancellation_reason
 * @property CarbonImmutable|null $cancelled_at
 * @property CarbonImmutable $created_at
 * @property CarbonImmutable $updated_at
 * @property-read User $customer
 * @property-read User|null $rider
 * @property-read Store|null $store
 * @property-read \Illuminate\Database\Eloquent\Collection<int, BookingStatusLog> $statusLogs
 */
#[Fillable([
    'customer_id', 'service_type', 'status', 'payment_method',
    'pickup_address', 'pickup_landmark', 'pickup_details', 'pickup_location',
    'dropoff_address', 'dropoff_landmark', 'dropoff_details', 'dropoff_location',
    'distance_meters', 'base_fare_centavos', 'distance_fare_centavos', 'service_fee_centavos', 'total_fare_centavos', 'commission_rate_bps',
    'notes', 'store_id', 'pabili_category', 'items', 'items_subtotal_centavos', 'purchase_budget_centavos',
    'recipient_name', 'recipient_phone', 'parcel_description',
    'idempotency_key',
])]
#[UseFactory(BookingFactory::class)]
final class Booking extends Model
{
    /** @use HasFactory<BookingFactory> */
    use HasFactory;

    private const int REFERENCE_LENGTH = 8;

    protected static function booted(): void
    {
        self::creating(function (self $booking): void {
            $booking->reference ??= self::generateReference();
        });
    }

    /** @return BelongsTo<User, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    /** @return BelongsTo<User, $this> */
    public function rider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rider_id');
    }

    /** @return BelongsTo<Store, $this> */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function itemsSubtotal(): ?Money
    {
        return $this->items_subtotal_centavos === null ? null : Money::fromCentavos($this->items_subtotal_centavos);
    }

    /** @return HasMany<BookingStatusLog, $this> */
    public function statusLogs(): HasMany
    {
        return $this->hasMany(BookingStatusLog::class)->orderBy('id');
    }

    /**
     * @param  Builder<Booking>  $query
     * @return Builder<Booking>
     */
    public function scopeForCustomer(Builder $query, User $customer): Builder
    {
        return $query->where('customer_id', $customer->id);
    }

    public function isOwnedBy(User $user): bool
    {
        return $this->customer_id === $user->id;
    }

    public function isAssignedTo(User $rider): bool
    {
        return $this->rider_id !== null && $this->rider_id === $rider->id;
    }

    public function totalFare(): Money
    {
        return Money::fromCentavos($this->total_fare_centavos);
    }

    public function purchaseBudget(): ?Money
    {
        return $this->purchase_budget_centavos === null ? null : Money::fromCentavos($this->purchase_budget_centavos);
    }

    /**
     * Unambiguous characters only (no 0/O, 1/I) so a reference can be read
     * out loud over the phone.
     */
    public static function generateReference(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

        do {
            $code = '';

            for ($i = 0; $i < self::REFERENCE_LENGTH; $i++) {
                $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }

            $reference = 'BK-'.$code;
        } while (self::query()->where('reference', $reference)->exists());

        return $reference;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'service_type' => ServiceType::class,
            'pabili_category' => PabiliCategory::class,
            'status' => BookingStatus::class,
            'payment_method' => PaymentMethod::class,
            'pickup_location' => GeoPointCast::class,
            'dropoff_location' => GeoPointCast::class,
            'distance_meters' => 'integer',
            'base_fare_centavos' => 'integer',
            'distance_fare_centavos' => 'integer',
            'service_fee_centavos' => 'integer',
            'total_fare_centavos' => 'integer',
            'commission_rate_bps' => 'integer',
            'purchase_budget_centavos' => 'integer',
            'items_subtotal_centavos' => 'integer',
            'search_radius_meters' => 'integer',
            'search_widened_at' => 'immutable_datetime',
            'items' => 'array',
            'cancelled_at' => 'immutable_datetime',
        ];
    }
}
