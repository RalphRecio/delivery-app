<?php

declare(strict_types=1);

use App\Domain\Shared\ValueObjects\PhoneNumber;

it('normalises every common spelling to E.164', function (string $input): void {
    expect(PhoneNumber::fromString($input)->value)->toBe('+639171234567');
})->with([
    '+639171234567',
    '639171234567',
    '09171234567',
    '9171234567',
    '0917 123 4567',
    '+63 917-123-4567',
    '(0917) 123 4567',
    ' 09171234567 ',
]);

it('rejects numbers that are not Philippine mobiles', function (string $input): void {
    expect(PhoneNumber::tryFromString($input))->toBeNull();
    expect(PhoneNumber::isValid($input))->toBeFalse();
})->with([
    '',
    'abc',
    '0287654321',      // landline
    '+14155552671',    // foreign
    '+1917123456',     // foreign but 10 digits after "+"
    '917123456',       // too short
    '091712345678',    // too long
    '08171234567',     // not a 9xx prefix
]);

it('throws on invalid input when a value is required', function (): void {
    PhoneNumber::fromString('nope');
})->throws(InvalidArgumentException::class);

it('masks the middle digits for logs', function (): void {
    expect(PhoneNumber::fromString('09171234567')->masked())->toBe('+63917*****67');
});

it('compares by value and serialises as a string', function (): void {
    $a = PhoneNumber::fromString('09171234567');
    $b = PhoneNumber::fromString('+639171234567');

    expect($a->equals($b))->toBeTrue()
        ->and((string) $a)->toBe('+639171234567')
        ->and(json_encode($a))->toBe('"+639171234567"');
});
