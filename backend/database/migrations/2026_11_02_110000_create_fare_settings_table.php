<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fare_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('service_type', 20)->unique();
            // All money columns are integer centavos (ADR 0005).
            $table->unsignedBigInteger('base_fare_centavos');
            $table->unsignedInteger('included_distance_meters');
            $table->unsignedBigInteger('per_km_centavos');
            $table->unsignedBigInteger('service_fee_centavos')->default(0);
            $table->unsignedBigInteger('minimum_fare_centavos');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fare_settings');
    }
};
