<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Auth\Enums\UserRole;
use App\Domain\Auth\Exceptions\AccountDeactivatedException;
use App\Domain\Auth\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Guards a whole route group by role (`role:rider`). Runs after auth:sanctum,
 * so an unauthenticated request is already a 401 before it gets here.
 * Per-resource rules (may this rider see this booking?) belong in Policies.
 */
final class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $required = UserRole::from($role);
        $user = $request->user();

        if (! $user instanceof User || ! $user->hasRole($required)) {
            throw new AccessDeniedHttpException('This area is for '.$required->value.' accounts.');
        }

        // Deactivation revokes tokens, but a request already in flight (or a
        // token issued before the column existed) still lands here.
        if (! $user->isActive()) {
            throw new AccountDeactivatedException;
        }

        return $next($request);
    }
}
