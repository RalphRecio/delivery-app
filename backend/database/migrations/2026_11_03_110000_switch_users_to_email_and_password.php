<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Sign-in moves from phone + OTP to email + password (ADR 0015). Names are
 * split into first and last so registration can ask for them separately.
 * Rows that predate this get a placeholder email and an unguessable password;
 * the seeder refreshes the local accounts, anyone else re-registers.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('first_name', 60)->nullable()->after('id');
            $table->string('last_name', 60)->nullable()->after('first_name');
            $table->string('email')->nullable()->after('last_name');
            $table->string('password')->nullable()->after('email');
        });

        foreach (DB::table('users')->select(['id', 'name'])->cursor() as $user) {
            [$firstName, $lastName] = array_pad(explode(' ', trim((string) $user->name), 2), 2, '');

            DB::table('users')->where('id', $user->id)->update([
                'first_name' => $firstName === '' ? 'User' : $firstName,
                'last_name' => $lastName === '' ? (string) $user->id : $lastName,
                'email' => "user-{$user->id}@placeholder.invalid",
                'password' => Hash::make(Str::random(40)),
            ]);
        }

        Schema::table('users', function (Blueprint $table): void {
            $table->string('first_name', 60)->nullable(false)->change();
            $table->string('last_name', 60)->nullable(false)->change();
            $table->string('email')->nullable(false)->change();
            $table->string('password')->nullable(false)->change();
            $table->unique('email');
            $table->dropColumn(['name', 'phone_verified_at']);
        });

        Schema::dropIfExists('otp_codes');
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('name')->nullable()->after('id');
            $table->timestamp('phone_verified_at')->nullable()->after('phone');
        });

        DB::statement("UPDATE users SET name = trim(first_name || ' ' || last_name)");

        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique(['email']);
            $table->dropColumn(['first_name', 'last_name', 'email', 'password']);
        });
    }
};
