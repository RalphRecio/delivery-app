<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Collection counterpart of ApiResource. Paginated collections keep
 * Laravel's `links` and `meta` keys next to the envelope keys.
 */
final class ApiResourceCollection extends AnonymousResourceCollection
{
    /**
     * @return array<string, mixed>
     */
    public function with(Request $request): array
    {
        return self::envelope();
    }

    /**
     * @return array{success: true, message: null, errors: object}
     */
    public static function envelope(): array
    {
        return [
            'success' => true,
            'message' => null,
            'errors' => (object) [],
        ];
    }
}
