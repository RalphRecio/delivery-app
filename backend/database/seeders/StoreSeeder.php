<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Shared\ValueObjects\GeoPoint;
use App\Domain\Store\Enums\StoreCategory;
use App\Domain\Store\Models\Store;
use Illuminate\Database\Seeder;

/**
 * A handful of Cebu stores with menus, so Pabili can be tried without an
 * admin catalogue screen. Re-seeding does not duplicate them.
 */
final class StoreSeeder extends Seeder
{
    public function run(): void
    {
        $stores = [
            [
                'name' => 'SM Supermarket Cebu',
                'category' => StoreCategory::Grocery,
                'address' => 'SM City Cebu, North Reclamation Area, Cebu City',
                'landmark' => 'Ground floor, near the north wing entrance',
                'location' => new GeoPoint(10.3119, 123.918),
                'products' => [
                    ['Bottled water 1L', 'Wilkins', 2500],
                    ['Eggs, 1 dozen', 'Medium, Bounty Fresh', 11500],
                    ['Rice 5kg', 'Sinandomeng', 32000],
                    ['Instant noodles 6-pack', 'Lucky Me! beef', 7800],
                    ['Milk 1L', 'Alaska fresh milk', 9800],
                    ['Bread, loaf', 'Gardenia classic', 8500],
                    ['Dish soap 500ml', 'Joy lemon', 7200],
                    ['Bananas, 1kg', 'Lakatan', 9000],
                ],
            ],
            [
                'name' => 'Mercury Drug Ayala',
                'category' => StoreCategory::Pharmacy,
                'address' => 'Ayala Center Cebu, Cebu Business Park, Cebu City',
                'landmark' => 'Level 1, beside the Terraces entrance',
                'location' => new GeoPoint(10.3181, 123.905),
                'products' => [
                    ['Paracetamol 500mg, 10 tablets', 'Biogesic', 6500],
                    ['Vitamin C 500mg, 30 tablets', 'Cecon', 24000],
                    ['Alcohol 70% 500ml', 'Green Cross', 8900],
                    ['Face masks, 50 pcs', 'Surgical, 3-ply', 15000],
                    ['Band-aid, 20 strips', 'Mediplast', 4500],
                    ['Oral rehydration salts, 5 sachets', 'Hydrite', 9000],
                ],
            ],
            [
                'name' => 'Jollibee Lahug',
                'category' => StoreCategory::Restaurant,
                'address' => 'Salinas Drive, Lahug, Cebu City',
                'landmark' => 'Corner of Salinas Drive and Gorordo Avenue',
                'location' => new GeoPoint(10.3306, 123.9013),
                'products' => [
                    ['Chickenjoy 1pc with rice', 'Regular, with gravy', 10900],
                    ['Yumburger', 'Classic', 5000],
                    ['Jolly Spaghetti', 'Regular', 6500],
                    ['Peach mango pie', '', 4500],
                    ['Jolly Fries, regular', '', 5500],
                    ['Pineapple juice, regular', '', 4000],
                ],
            ],
            [
                'name' => '7-Eleven IT Park',
                'category' => StoreCategory::Convenience,
                'address' => 'Jose Maria del Mar Street, Cebu IT Park, Cebu City',
                'landmark' => 'Ground floor of Skyrise 4',
                'location' => new GeoPoint(10.3302, 123.9057),
                'products' => [
                    ['Coffee, 12oz', 'City Blends brewed', 4500],
                    ['Siopao asado', '', 4000],
                    ['Bottled water 500ml', 'Nature\'s Spring', 1500],
                    ['Chips, 60g', 'Piattos cheese', 3500],
                    ['Sandwich, ham and cheese', '', 6500],
                    ['Energy drink 250ml', 'Cobra', 3000],
                ],
            ],
            [
                'name' => 'Abaca Baking Company',
                'category' => StoreCategory::Bakery,
                'address' => 'Crossroads, Banilad, Cebu City',
                'landmark' => 'Crossroads mall, street level',
                'location' => new GeoPoint(10.3345, 123.9122),
                'products' => [
                    ['Sourdough loaf', '', 28000],
                    ['Croissant', 'Butter', 12000],
                    ['Cinnamon roll', '', 13500],
                    ['Chocolate chip cookie', '', 8500],
                    ['Iced latte, 16oz', '', 18000],
                ],
            ],
        ];

        foreach ($stores as $definition) {
            $products = $definition['products'];
            unset($definition['products']);

            $store = Store::query()->firstOrCreate(['name' => $definition['name']], $definition);

            if ($store->products()->exists()) {
                continue;
            }

            foreach ($products as $index => [$name, $description, $price]) {
                $store->products()->create([
                    'name' => $name,
                    'description' => $description === '' ? null : $description,
                    'price_centavos' => $price,
                    'sort_order' => $index,
                ]);
            }
        }
    }
}
