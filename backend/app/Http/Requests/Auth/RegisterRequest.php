<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Domain\Auth\Data\RegisterAccountData;
use App\Domain\Auth\Enums\UserRole;
use App\Domain\Shared\ValueObjects\PhoneNumber;
use App\Rules\PhilippineMobileNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

final class RegisterRequest extends FormRequest
{
    private const string DEFAULT_DEVICE_NAME = 'unknown';

    /** The only account types anyone may pick for themselves. */
    private const array ACCOUNT_TYPES = ['customer', 'rider'];

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'account_type' => ['sometimes', 'string', Rule::in(self::ACCOUNT_TYPES)],
            'first_name' => ['required', 'string', 'max:60'],
            'last_name' => ['required', 'string', 'max:60'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', Password::min(8)],
            'phone' => ['required', 'string', 'max:20', new PhilippineMobileNumber],
            'device_name' => ['sometimes', 'string', 'max:60'],
        ];
    }

    public function toData(): RegisterAccountData
    {
        return new RegisterAccountData(
            role: UserRole::from($this->string('account_type', UserRole::Customer->value)->toString()),
            firstName: trim($this->string('first_name')->toString()),
            lastName: trim($this->string('last_name')->toString()),
            email: mb_strtolower(trim($this->string('email')->toString())),
            password: $this->string('password')->toString(),
            phone: PhoneNumber::fromString($this->string('phone')->toString()),
            deviceName: $this->string('device_name', self::DEFAULT_DEVICE_NAME)->toString(),
        );
    }
}
