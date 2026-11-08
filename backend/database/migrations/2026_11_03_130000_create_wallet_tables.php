<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Rider wallet (ADR 0016). The balance is never stored: it is the sum of
 * wallet_transactions, an append-only ledger. All amounts are integer
 * centavos; ledger amounts are signed (credits positive, debits negative).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table): void {
            $table->id();
            // One wallet per rider. Kept as its own row so balance changes
            // can lock it (SELECT ... FOR UPDATE) without locking the user.
            $table->foreignId('user_id')->unique()->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('topup_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('wallet_id')->constrained()->restrictOnDelete();
            $table->unsignedBigInteger('amount_centavos');
            // pending | paid | failed | expired, see TopupStatus.
            $table->string('status', 20)->index();
            $table->string('gateway', 20);
            $table->string('checkout_session_id')->nullable()->unique();
            $table->string('payment_intent_id')->nullable()->index();
            // The gateway's payment reference; unique so one payment can never be credited twice.
            $table->string('gateway_payment_id')->nullable()->unique();
            $table->text('checkout_url')->nullable();
            $table->string('failure_reason')->nullable();
            $table->timestamp('expires_at');
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'expires_at']);
        });

        Schema::create('wallet_transactions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('wallet_id')->constrained()->restrictOnDelete();
            // topup | commission | refund | adjustment, see WalletTransactionType.
            $table->string('type', 20);
            $table->bigInteger('amount_centavos');
            $table->foreignId('booking_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('topup_request_id')->nullable()->unique()->constrained()->restrictOnDelete();
            // Required for adjustments and refunds; the "why" for whoever reads the ledger later.
            $table->string('reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->restrictOnDelete();
            // Append-only: there is no updated_at because rows never change.
            $table->timestamp('created_at')->useCurrent();

            // At most one commission and one refund per booking (NULL booking_ids do not collide).
            $table->unique(['booking_id', 'type']);
            $table->index(['wallet_id', 'created_at']);
        });

        // The database itself refuses edits and deletes, so a bug or a stray
        // query cannot rewrite money history. Corrections are new rows.
        // OR REPLACE: migrate:fresh drops tables but not functions.
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION wallet_transactions_append_only() RETURNS trigger AS $$
            BEGIN
                RAISE EXCEPTION 'wallet_transactions is append-only; add an adjustment or refund instead';
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER wallet_transactions_no_update_or_delete
                BEFORE UPDATE OR DELETE ON wallet_transactions
                FOR EACH ROW EXECUTE FUNCTION wallet_transactions_append_only();
            SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS wallet_transactions_no_update_or_delete ON wallet_transactions');
        DB::unprepared('DROP FUNCTION IF EXISTS wallet_transactions_append_only()');
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('topup_requests');
        Schema::dropIfExists('wallets');
    }
};
