<?php

declare(strict_types=1);

namespace App\Domain\Notification\Notifications;

use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

/**
 * A plain web push: title, body, and the in-app path to open when tapped.
 * Sent to every browser the user turned notifications on in; the service
 * worker (app/public/sw.js) shows it even when the app is closed.
 */
final class PushMessageNotification extends Notification
{
    private const string ICON_PATH = '/icons/icon-192.png';

    public function __construct(
        public readonly string $title,
        public readonly string $body,
        /** In-app path such as "/customer/bookings/12"; the worker opens it on tap. */
        public readonly string $url = '/',
        /** Same tag replaces the previous notification instead of stacking, e.g. per booking. */
        public readonly ?string $tag = null,
    ) {}

    /**
     * @return list<class-string>
     */
    public function via(object $notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush(object $notifiable, Notification $notification): WebPushMessage
    {
        $message = (new WebPushMessage)
            ->title($this->title)
            ->body($this->body)
            ->icon(self::ICON_PATH)
            ->badge(self::ICON_PATH)
            ->data(['url' => $this->url]);

        if ($this->tag !== null) {
            $message->tag($this->tag);
        }

        return $message;
    }
}
