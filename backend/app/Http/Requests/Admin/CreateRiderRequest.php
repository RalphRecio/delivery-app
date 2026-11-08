<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domain\Auth\Data\CreateRiderData;
use App\Domain\Shared\ValueObjects\PhoneNumber;
use App\Rules\PhilippineMobileNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

final class CreateRiderRequest extends FormRequest
{
    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:60'],
            'last_name' => ['required', 'string', 'max:60'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:20', new PhilippineMobileNumber],
            'password' => ['required', 'string', Password::min(8)],
        ];
    }

    public function toData(): CreateRiderData
    {
        return new CreateRiderData(
            firstName: trim($this->string('first_name')->toString()),
            lastName: trim($this->string('last_name')->toString()),
            email: mb_strtolower(trim($this->string('email')->toString())),
            phone: PhoneNumber::fromString($this->string('phone')->toString()),
            password: $this->string('password')->toString(),
        );
    }
}
