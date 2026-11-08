<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domain\Auth\Models\User;
use App\Domain\Notification\Notifications\PushMessageNotification;
use Illuminate\Console\Command;

/**
 * Sends a web push to every browser a user turned notifications on in, to
 * check the pipeline end to end:
 *   php artisan push:test customer@example.com --title="Rider on the way" --body="Rita is 5 minutes out"
 */
final class SendTestPushCommand extends Command
{
    protected $signature = 'push:test {email : The user\'s email} {--title=Pasuyo Parang : Notification title} {--body=Test notification from the server. : Notification body} {--url=/ : In-app path to open on tap}';

    protected $description = 'Send a test web push notification to a user';

    public function handle(): int
    {
        $user = User::query()->where('email', mb_strtolower((string) $this->argument('email')))->first();

        if ($user === null) {
            $this->error('No user with that email.');

            return self::FAILURE;
        }

        $devices = $user->pushSubscriptions()->count();

        if ($devices === 0) {
            $this->error("{$user->name} has not turned notifications on in any browser yet.");

            return self::FAILURE;
        }

        $user->notify(new PushMessageNotification(
            title: (string) $this->option('title'),
            body: (string) $this->option('body'),
            url: (string) $this->option('url'),
        ));

        $this->info("Sent to {$devices} ".($devices === 1 ? 'device' : 'devices')." of {$user->name}.");

        return self::SUCCESS;
    }
}
