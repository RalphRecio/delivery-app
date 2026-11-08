<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Commission as basis points (1000 = 10%). The tariff holds the current rate;
 * each booking copies it at creation so later changes never touch past jobs.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fare_settings', function (Blueprint $table): void {
            $table->unsignedInteger('commission_rate_bps')->default(1000)->after('minimum_fare_centavos');
        });

        Schema::table('bookings', function (Blueprint $table): void {
            // Null on bookings made before the wallet existed: no commission is charged on those.
            $table->unsignedInteger('commission_rate_bps')->nullable()->after('total_fare_centavos');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropColumn('commission_rate_bps');
        });

        Schema::table('fare_settings', function (Blueprint $table): void {
            $table->dropColumn('commission_rate_bps');
        });
    }
};
