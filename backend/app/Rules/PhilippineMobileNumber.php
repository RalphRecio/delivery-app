<?php

declare(strict_types=1);

namespace App\Rules;

use App\Domain\Shared\ValueObjects\PhoneNumber;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/** Accepts any spelling PhoneNumber can normalise ("0917...", "+63917...", "917..."). */
final class PhilippineMobileNumber implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! PhoneNumber::isValid($value)) {
            $fail('The :attribute must be a valid Philippine mobile number.');
        }
    }
}
