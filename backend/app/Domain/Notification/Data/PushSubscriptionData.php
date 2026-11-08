<?php

declare(strict_types=1);

namespace App\Domain\Notification\Data;

/**
 * What a browser hands back from PushManager.subscribe(): the push service
 * URL for this device and the keys that encrypt messages to it.
 */
final readonly class PushSubscriptionData
{
    public function __construct(
        public string $endpoint,
        public string $publicKey,
        public string $authToken,
        public string $contentEncoding,
    ) {}
}
