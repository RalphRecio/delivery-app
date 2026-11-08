<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rider_profiles', function (Blueprint $table): void {
            // Bumped by the rider app's heartbeat while it is open and online;
            // a rider not seen recently is not counted as on duty.
            $table->timestamp('last_seen_at')->nullable()->after('location_updated_at')->index();
        });
    }

    public function down(): void
    {
        Schema::table('rider_profiles', function (Blueprint $table): void {
            $table->dropColumn('last_seen_at');
        });
    }
};
