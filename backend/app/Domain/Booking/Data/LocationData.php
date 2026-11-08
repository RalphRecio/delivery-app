<?php

declare(strict_types=1);

namespace App\Domain\Booking\Data;

use App\Domain\Shared\ValueObjects\GeoPoint;

/**
 * A place the rider must go to. The address names the building or street;
 * the landmark ("beside 7-Eleven") and details ("3rd floor, unit 3B, ring
 * the bell") are what gets the rider to the right door.
 */
final readonly class LocationData
{
    public function __construct(
        public string $address,
        public GeoPoint $point,
        public ?string $landmark = null,
        public ?string $details = null,
    ) {}

    public const string RIDER_CHOICE_ADDRESS = "Rider's choice: any store near the drop-off";

    /**
     * A Pabili with no store chosen. The rider shops wherever is convenient
     * near the drop-off, so the pickup point is the drop-off point: riders
     * are matched near the customer and no distance is charged.
     */
    public static function riderChoiceNear(self $dropoff): self
    {
        return new self(address: self::RIDER_CHOICE_ADDRESS, point: $dropoff->point);
    }
}
