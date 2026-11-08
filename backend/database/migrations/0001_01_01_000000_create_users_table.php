<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            // Null until the user completes their profile after first sign-in.
            $table->string('name')->nullable();
            // E.164 ("+639171234567"), normalised by PhoneNumber before it gets here.
            $table->string('phone', 20)->unique();
            $table->timestamp('phone_verified_at')->nullable();
            // customer | rider | admin, see Domain\Auth\Enums\UserRole.
            $table->string('role', 20)->index();
            // Set by an admin; a deactivated user cannot sign in or use existing tokens.
            $table->timestamp('deactivated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
