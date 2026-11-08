<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Webhooks;

use App\Domain\Payment\Contracts\PaymentGateway;
use App\Domain\Wallet\Actions\HandlePaymentWebhookAction;
use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * PayMongo posts here when a checkout is paid or a payment fails. The raw
 * body is verified against Paymongo-Signature before anything happens; an
 * invalid signature answers 401. Every valid event answers 200, even ones we
 * ignore, so PayMongo stops retrying.
 */
final class PayMongoWebhookController extends Controller
{
    public function __invoke(Request $request, PaymentGateway $gateway, HandlePaymentWebhookAction $handle): JsonResponse
    {
        $event = $gateway->parseWebhook($request->getContent(), $request->header('Paymongo-Signature'));

        $handle->handle($event);

        return ApiResponse::success(null, 'Received.');
    }
}
