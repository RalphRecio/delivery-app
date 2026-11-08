<?php

declare(strict_types=1);

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Builds the API envelope `{ success, message, data, errors }` for responses
 * that are not backed by an API resource (health checks, plain messages, errors).
 */
final class ApiResponse
{
    /**
     * @param  array<string, mixed>  $headers
     */
    public static function success(
        mixed $data = null,
        ?string $message = null,
        int $status = Response::HTTP_OK,
        array $headers = [],
    ): JsonResponse {
        return new JsonResponse([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'errors' => (object) [],
        ], $status, $headers);
    }

    /**
     * @param  array<string, list<string>>  $errors
     * @param  array<string, mixed>  $headers
     */
    public static function error(
        string $message,
        array $errors = [],
        int $status = Response::HTTP_BAD_REQUEST,
        array $headers = [],
    ): JsonResponse {
        return new JsonResponse([
            'success' => false,
            'message' => $message,
            'data' => null,
            'errors' => (object) $errors,
        ], $status, $headers);
    }
}
