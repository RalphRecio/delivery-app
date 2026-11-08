<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Domain\Notification\Data\PushSubscriptionData;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** The PushSubscription.toJSON() shape, plus the encoding the browser supports. */
final class StorePushSubscriptionRequest extends FormRequest
{
    private const string DEFAULT_ENCODING = 'aes128gcm';

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'endpoint' => ['required', 'string', 'url', 'max:2000'],
            'keys' => ['required', 'array'],
            'keys.p256dh' => ['required', 'string', 'max:255'],
            'keys.auth' => ['required', 'string', 'max:255'],
            'content_encoding' => ['sometimes', 'string', Rule::in(['aes128gcm', 'aesgcm'])],
        ];
    }

    public function toData(): PushSubscriptionData
    {
        return new PushSubscriptionData(
            endpoint: $this->string('endpoint')->toString(),
            publicKey: $this->string('keys.p256dh')->toString(),
            authToken: $this->string('keys.auth')->toString(),
            contentEncoding: $this->string('content_encoding', self::DEFAULT_ENCODING)->toString(),
        );
    }
}
