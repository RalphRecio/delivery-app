<?php

declare(strict_types=1);

namespace App\Http\Responses;

use App\Domain\Shared\Exceptions\DomainException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

/**
 * The single place where exceptions become API error responses.
 *
 * Callbacks are matched in registration order, so specific types come first
 * and the generic Throwable fallback last. Each callback returns null for
 * non-API requests so Laravel's default rendering still applies to them.
 */
final class ApiExceptionRenderer
{
    public static function register(Exceptions $exceptions): void
    {
        $exceptions->render(function (DomainException $exception, Request $request): ?JsonResponse {
            if (! self::wantsApiResponse($request)) {
                return null;
            }

            return ApiResponse::error($exception->getMessage(), $exception->errors(), $exception->httpStatus());
        });

        $exceptions->render(function (ValidationException $exception, Request $request): ?JsonResponse {
            if (! self::wantsApiResponse($request)) {
                return null;
            }

            return ApiResponse::error($exception->getMessage(), $exception->errors(), $exception->status);
        });

        $exceptions->render(function (AuthenticationException $exception, Request $request): ?JsonResponse {
            if (! self::wantsApiResponse($request)) {
                return null;
            }

            return ApiResponse::error($exception->getMessage(), [], Response::HTTP_UNAUTHORIZED);
        });

        // Covers 403 (AuthorizationException is converted to AccessDeniedHttpException),
        // 404 (including ModelNotFoundException), 405, 429 (rate limits) and friends.
        $exceptions->render(function (HttpExceptionInterface $exception, Request $request): ?JsonResponse {
            if (! self::wantsApiResponse($request)) {
                return null;
            }

            $status = $exception->getStatusCode();
            $message = $exception->getMessage() !== '' ? $exception->getMessage() : self::statusText($status);

            return ApiResponse::error($message, [], $status, $exception->getHeaders());
        });

        // Unexpected failures: hide details unless debugging. Laravel still reports them.
        $exceptions->render(function (Throwable $exception, Request $request): ?JsonResponse {
            if (! self::wantsApiResponse($request) || config('app.debug') === true) {
                return null;
            }

            return ApiResponse::error('Server error.', [], Response::HTTP_INTERNAL_SERVER_ERROR);
        });
    }

    private static function wantsApiResponse(Request $request): bool
    {
        return $request->is('api/*') || $request->expectsJson();
    }

    private static function statusText(int $status): string
    {
        return Response::$statusTexts[$status] ?? 'Error';
    }
}
