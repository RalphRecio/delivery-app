# ADR 0015: Email + password registration replaces phone OTP

Date: 2026-11-03 · Status: accepted · Supersedes ADR 0006

## Decision

- Customers register in the app with first name, last name, email, password and mobile number (`POST /auth/register`), and sign in with email and password (`POST /auth/login`). Both answer with a Sanctum bearer token exactly as the OTP exchange did, so everything after sign-in is unchanged.
- `users` gains `first_name`, `last_name`, `email` (unique, lower-cased) and `password` (bcrypt via the `hashed` cast); `name` becomes a computed "First Last" and `phone_verified_at` is dropped. The mobile number stays required and unique because riders call customers and Pasuyo names a recipient by phone.
- Self-service registration creates customers or riders (`account_type`), never admins. Admins can still create riders and set their first password. Riders sign in with email and password like everyone else; the mobile number is a contact number only.
- Update 2026-11-03: rider self-registration was added on request. A self-registered rider can go online and accept jobs without vetting; an approval step (pending until an admin checks ID and vehicle) is the obvious follow-up if that is a concern.
- The OTP code path is removed outright: actions, OTP model and table, the SMS sender contract and its log/Semaphore implementations, the `otp` config and env keys, the two throttles and the related tests. A backup of the removed files was taken before deletion.
- Rate limits: 5 registrations per minute per IP; 10 login attempts per minute per email + IP, so one account cannot be hammered from many addresses nor one address try many accounts.

## Why

- The product owner asked for a conventional registration (name, email, password). Passwords also remove the SMS provider dependency and its cost from the critical path of signing in.
- Keeping the token model means no change to the role guards, policies, the Axios interceptor or the session store.
- Deleting the OTP path rather than leaving it dormant keeps one way to sign in; the backup and this ADR are enough to bring it back if SMS verification is wanted later as a second factor.

## Consequences

- Existing rows got a placeholder email and an unguessable password in the migration; the seeded local accounts were refreshed with real emails (`*@example.com`, password `password`). Any other local account must re-register.
- A wrong email and a wrong password produce the same message, so the login endpoint cannot be used to find out which emails are registered. Registration necessarily reveals a taken email or phone (409).
- There is no password reset or change yet; that is the next piece of this area.
