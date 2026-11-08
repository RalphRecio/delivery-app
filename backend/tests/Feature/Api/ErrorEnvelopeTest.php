<?php

declare(strict_types=1);

use App\Domain\Shared\Exceptions\DomainException;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\Response;

/*
 * These tests register throw-away routes to exercise the exception renderer
 * without depending on any real endpoint.
 */

it('renders unknown routes as a 404 envelope', function (): void {
    $this->getJson('/api/v1/does-not-exist')
        ->assertNotFound()
        ->assertJson(['success' => false, 'data' => null, 'errors' => []])
        ->assertJsonPath('message', fn (string $message) => $message !== '');
});

it('renders validation failures with field errors', function (): void {
    Route::post('/api/v1/_test/validate', fn (Request $request) => ApiResponse::success(
        $request->validate(['name' => ['required', 'string']]),
    ));

    $this->postJson('/api/v1/_test/validate', [])
        ->assertUnprocessable()
        ->assertJson([
            'success' => false,
            'data' => null,
            'errors' => ['name' => ['The name field is required.']],
        ]);
});

it('renders unauthenticated access as a 401 envelope', function (): void {
    Route::get('/api/v1/_test/protected', fn () => ApiResponse::success())->middleware('auth:sanctum');

    $this->getJson('/api/v1/_test/protected')
        ->assertUnauthorized()
        ->assertJson(['success' => false, 'message' => 'Unauthenticated.', 'data' => null]);
});

it('renders domain exceptions with their declared status and errors', function (): void {
    $exception = new class('Booking was already accepted by another rider.') extends DomainException
    {
        public function httpStatus(): int
        {
            return Response::HTTP_CONFLICT;
        }

        public function errors(): array
        {
            return ['booking' => ['Already accepted.']];
        }
    };

    Route::get('/api/v1/_test/domain', fn () => throw $exception);

    $this->getJson('/api/v1/_test/domain')
        ->assertStatus(Response::HTTP_CONFLICT)
        ->assertExactJson([
            'success' => false,
            'message' => 'Booking was already accepted by another rider.',
            'data' => null,
            'errors' => ['booking' => ['Already accepted.']],
        ]);
});

it('hides unexpected failures behind a generic 500 envelope when not debugging', function (): void {
    config()->set('app.debug', false);
    $this->withoutExceptionHandling()->withExceptionHandling();

    Route::get('/api/v1/_test/boom', fn () => throw new RuntimeException('secret detail'));

    $this->getJson('/api/v1/_test/boom')
        ->assertStatus(Response::HTTP_INTERNAL_SERVER_ERROR)
        ->assertExactJson([
            'success' => false,
            'message' => 'Server error.',
            'data' => null,
            'errors' => [],
        ]);
});
