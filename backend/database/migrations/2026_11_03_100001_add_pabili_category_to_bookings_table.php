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
        Schema::table('bookings', function (Blueprint $table): void {
            // Pabili only: grocery, food or pet_food (PabiliCategory). Null for Pasuyo.
            $table->string('pabili_category', 20)->nullable()->after('store_id');
        });

        // Bookings made before categories existed were all everyday shopping.
        DB::table('bookings')->where('service_type', 'pabili')->whereNull('pabili_category')->update(['pabili_category' => 'grocery']);
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropColumn('pabili_category');
        });
    }
};
