<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Auth;

use App\Domain\Auth\Actions\RegisterAccountAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\AuthSessionResource;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

final class RegistrationController extends Controller
{
    public function __invoke(RegisterRequest $request, RegisterAccountAction $register): JsonResponse
    {
        $session = $register->handle($request->toData());

        return AuthSessionResource::make($session)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }
}
