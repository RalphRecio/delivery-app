<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/** Every rider has a wallet; new riders get one when their account is created. */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
            INSERT INTO wallets (user_id, created_at, updated_at)
            SELECT id, NOW(), NOW() FROM users
            WHERE role = 'rider' AND id NOT IN (SELECT user_id FROM wallets)
            SQL);
    }

    public function down(): void
    {
        // Wallets are removed with their table in the previous migration's down().
    }
};
