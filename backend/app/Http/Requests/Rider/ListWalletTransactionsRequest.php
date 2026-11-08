<?php

declare(strict_types=1);

namespace App\Http\Requests\Rider;

use App\Domain\Wallet\Enums\WalletTransactionType;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ListWalletTransactionsRequest extends FormRequest
{
    private const int DEFAULT_PER_PAGE = 25;

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'type' => ['sometimes', Rule::enum(WalletTransactionType::class)],
            'from' => ['sometimes', 'date_format:Y-m-d'],
            'to' => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:from'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:5', 'max:100'],
        ];
    }

    public function type(): ?WalletTransactionType
    {
        return $this->filled('type') ? WalletTransactionType::from($this->string('type')->toString()) : null;
    }

    /** Start of the day, Philippine time. */
    public function from(): ?CarbonImmutable
    {
        return $this->filled('from') ? CarbonImmutable::parse($this->string('from')->toString(), 'Asia/Manila')->startOfDay() : null;
    }

    /** End of the day, Philippine time, so "to" includes the whole day. */
    public function to(): ?CarbonImmutable
    {
        return $this->filled('to') ? CarbonImmutable::parse($this->string('to')->toString(), 'Asia/Manila')->endOfDay() : null;
    }

    public function perPage(): int
    {
        return $this->has('per_page') ? $this->integer('per_page') : self::DEFAULT_PER_PAGE;
    }
}
