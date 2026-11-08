<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/** The pickup-and-deliver service was renamed from Pasabay to Pasuyo (ADR 0014). */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('bookings')->where('service_type', 'pasabay')->update(['service_type' => 'pasuyo']);
        DB::table('fare_settings')->where('service_type', 'pasabay')->update(['service_type' => 'pasuyo']);
    }

    public function down(): void
    {
        DB::table('bookings')->where('service_type', 'pasuyo')->update(['service_type' => 'pasabay']);
        DB::table('fare_settings')->where('service_type', 'pasuyo')->update(['service_type' => 'pasabay']);
    }
};
