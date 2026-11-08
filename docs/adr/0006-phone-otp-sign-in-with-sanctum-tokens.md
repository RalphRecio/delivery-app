# ADR 0006: Phone + OTP sign-in with Sanctum bearer tokens

Date: 2026-11-02 · Status: superseded by [ADR 0015](0015-email-password-registration.md) on 2026-11-03 (sign-in is now email + password; the token model below still applies)

## Decision

Everyone (customers, riders, admins) signs in with a Philippine mobile number and a one-time code sent by SMS. There are no passwords. A successful code exchange issues a Sanctum personal access token that the app stores in secure storage and sends as a bearer token. Tokens expire after 90 days (`SANCTUM_TOKEN_EXPIRATION_MINUTES`).

All roles live in one `users` table with a `role` column (`Domain\Auth\Enums\UserRole`). A number that has never signed in becomes a **customer**; rider and admin accounts are provisioned by an admin, never chosen at sign-in.

## Why

- A phone number is the identity riders and customers already share with each other and with the SMS provider; passwords would be a second thing to forget and to reset.
- One `users` table keeps authentication in one place. Role-specific data (vehicle, documents, wallet) belongs to the Rider/Customer domains, not to identity.
- Bearer tokens suit a native app: no cookies, no CSRF, one token per device so signing out one phone does not sign out the others.

## How it is kept safe

- Codes are 6 digits, hashed at rest, valid for 5 minutes, single-use, and locked after 5 wrong guesses.
- Requests are rate limited per phone number (`throttle:otp` 3/min, `throttle:otp-verify` 10/min) and a 60-second resend cooldown is enforced in the action, so one number cannot be flooded from many IPs.
- The request endpoint behaves identically for known and unknown numbers, so it cannot be used to enumerate accounts.
- `OTP_FIXED_CODE` (a predictable code for local/staging) is ignored in production no matter what the environment says.

## Consequences

- `app/Models/User.php` moved to `app/Domain/Auth/Models/User.php` (closing the open point in ADR 0003).
- The SMS provider sits behind `Domain\Auth\Contracts\OtpSender`; Semaphore is the production implementation, the log is the local one, and tests swap in a fake.
- Audience route groups are guarded by `role:<role>` middleware in addition to `auth:sanctum`. Per-resource rules still belong in Policies.
