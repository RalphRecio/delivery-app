<?php

declare(strict_types=1);

use App\Http\Middleware\AddRequestContext;
use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Responses\ApiExceptionRenderer;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // The API runs behind a reverse proxy (nginx on the Docker host). Trusting
        // its X-Forwarded-* headers gives the real client IP (rate limits, logs)
        // and https:// URLs; without it every visitor looks like the Docker
        // gateway and shares one rate-limit bucket. Only loopback and Docker
        // bridge networks are trusted, so other clients cannot spoof their IP.
        $middleware->trustProxies(at: ['127.0.0.1', '172.16.0.0/12']);

        $middleware->api(prepend: [AddRequestContext::class]);
        $middleware->throttleApi();
        $middleware->alias(['role' => EnsureUserHasRole::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        ApiExceptionRenderer::register($exceptions);
    })->create();
