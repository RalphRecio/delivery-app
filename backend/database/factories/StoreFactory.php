<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Shared\ValueObjects\GeoPoint;
use App\Domain\Store\Enums\StoreCategory;
use App\Domain\Store\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Store>
 */
final class StoreFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company().' Mart',
            'category' => StoreCategory::Grocery,
            'address' => 'SM City Cebu, North Reclamation Area',
            'landmark' => 'Ground floor, near the supermarket entrance',
            'location' => new GeoPoint(10.3119, 123.918),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => ['is_active' => false]);
    }

    public function at(float $latitude, float $longitude): static
    {
        return $this->state(fn (): array => ['location' => new GeoPoint($latitude, $longitude)]);
    }
}
