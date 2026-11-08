<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table): void {
            $table->id();
            $table->string('reference', 16)->unique();
            $table->foreignId('customer_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('rider_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('service_type', 20);
            $table->string('status', 20);
            $table->string('payment_method', 20);

            // Address comes from the map pin (reverse geocoded, editable). Landmark and
            // details are what the customer adds so the rider can actually find the door.
            $table->string('pickup_address');
            $table->string('pickup_landmark', 120)->nullable();
            $table->string('pickup_details', 255)->nullable();
            $table->geography('pickup_location', 'point', 4326);
            $table->string('dropoff_address');
            $table->string('dropoff_landmark', 120)->nullable();
            $table->string('dropoff_details', 255)->nullable();
            $table->geography('dropoff_location', 'point', 4326);

            // Snapshot of the quote the customer accepted; integer centavos.
            $table->unsignedInteger('distance_meters');
            $table->unsignedBigInteger('base_fare_centavos');
            $table->unsignedBigInteger('distance_fare_centavos');
            $table->unsignedBigInteger('service_fee_centavos');
            $table->unsignedBigInteger('total_fare_centavos');

            $table->text('notes')->nullable();

            // Pabili. store_id is set when ordering from a catalogue; items then carry
            // product_id and the unit price snapshotted at booking time.
            $table->foreignId('store_id')->nullable()->constrained('stores')->nullOnDelete();
            $table->jsonb('items')->nullable();
            $table->unsignedBigInteger('items_subtotal_centavos')->nullable();
            $table->unsignedBigInteger('purchase_budget_centavos')->nullable();

            // Pasuyo
            $table->string('recipient_name', 120)->nullable();
            $table->string('recipient_phone', 20)->nullable();
            $table->string('parcel_description', 300)->nullable();

            // Rider search (set when the booking becomes `searching`, widened on a schedule).
            $table->unsignedInteger('search_radius_meters')->nullable();
            $table->timestamp('search_widened_at')->nullable();

            $table->string('idempotency_key', 64)->nullable();
            $table->string('cancellation_reason', 300)->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['customer_id', 'id']);
            $table->index(['status', 'service_type']);
            $table->unique(['customer_id', 'idempotency_key']);
        });

        // Rider matching searches "bookings near me"; GIST is the index type geography needs.
        DB::statement('CREATE INDEX bookings_pickup_location_gist ON bookings USING GIST (pickup_location)');
        DB::statement('CREATE INDEX bookings_dropoff_location_gist ON bookings USING GIST (dropoff_location)');
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
