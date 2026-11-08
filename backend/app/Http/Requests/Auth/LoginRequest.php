<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Domain\Auth\Data\LoginData;
use App\Domain\Auth\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class LoginRequest extends FormRequest
{
    private const string DEFAULT_DEVICE_NAME = 'unknown';

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string'],
            'device_name' => ['sometimes', 'string', 'max:60'],
            'portal' => ['sometimes', Rule::enum(UserRole::class)],
        ];
    }

    public function toData(): LoginData
    {
        return new LoginData(
            email: mb_strtolower(trim($this->string('email')->toString())),
            password: $this->string('password')->toString(),
            deviceName: $this->string('device_name', self::DEFAULT_DEVICE_NAME)->toString(),
            portal: $this->filled('portal') ? UserRole::from($this->string('portal')->toString()) : null,
        );
    }
}
