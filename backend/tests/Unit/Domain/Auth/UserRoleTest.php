<?php

declare(strict_types=1);

use App\Domain\Auth\Enums\UserRole;

it('lists the role values used by the API and the route guards', function (): void {
    expect(UserRole::values())->toBe(['customer', 'rider', 'admin']);
});
