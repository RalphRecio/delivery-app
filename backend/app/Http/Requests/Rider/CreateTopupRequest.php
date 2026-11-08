<?php

declare(strict_types=1);

namespace App\Http\Requests\Rider;

use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Wallet\Data\WalletSettings;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

final class CreateTopupRequest extends FormRequest
{
    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        $settings = app(WalletSettings::class);

        return [
            // Pesos as a decimal string ("500" or "500.50"); never a float.
            'amount' => [
                'required',
                'regex:/^\d{1,6}(\.\d{1,2})?$/',
                function (string $attribute, mixed $value, Closure $fail) use ($settings): void {
                    $amount = Money::fromPesos((string) $value);

                    if ($amount->isLessThan($settings->topupMin) || $amount->isGreaterThan($settings->topupMax)) {
                        $fail("Top up between {$settings->topupMin->format()} and {$settings->topupMax->format()}.");
                    }
                },
            ],
            // Where the gateway sends the rider back. Only ever used to land on
            // the status screen, which asks the server; it can never credit.
            'return_url' => ['required', 'string', 'max:500', 'url:http,https,deliveryapp,exp'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['amount.regex' => 'Enter an amount in pesos, e.g. 500 or 500.50.'];
    }

    public function amount(): Money
    {
        return Money::fromPesos((string) $this->validated('amount'));
    }

    public function returnUrl(): string
    {
        return (string) $this->validated('return_url');
    }
}
