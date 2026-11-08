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
        Schema::create('rider_profiles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->boolean('is_online')->default(false)->index();
            $table->geography('current_location', 'point', 4326)->nullable();
            $table->timestamp('location_updated_at')->nullable();
            $table->timestamps();
        });

        DB::statement('CREATE INDEX rider_profiles_current_location_gist ON rider_profiles USING GIST (current_location)');
    }

    public function down(): void
    {
        Schema::dropIfExists('rider_profiles');
    }
};
