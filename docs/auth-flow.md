# Sign-in flow

Plain-language description of how a user gets a session. The code lives in `backend/app/Domain/Auth` and `app/src/features/auth`. Design decision: [ADR 0015](adr/0015-email-password-registration.md) (supersedes [ADR 0006](adr/0006-phone-otp-sign-in-with-sanctum-tokens.md)).

## Steps

```
App                                                    API
 │  POST /auth/register                                 │
 │  {account_type, first_name, last_name, email,        │
 │   password, phone}                                   │
 │─────────────────────────────────────────────────────►│ email + phone must be new,
 │                                                      │ create customer, hash password,
 │  201 { token, user }                                 │ issue token
 │◄─────────────────────────────────────────────────────│
 │  POST /auth/login {email, password}                  │
 │─────────────────────────────────────────────────────►│ check password, refuse if
 │  201 { token, user }                                 │ deactivated, issue token
 │◄─────────────────────────────────────────────────────│
 │  Authorization: Bearer <token>                       │
 │─────────────────────────────────────────────────────►│ GET /auth/me, POST /auth/logout, ...
```

## Sign-in pages

Each role has its own address. The page sends `portal` with the login request, and the API refuses an account of another role on it (after the password checks out, so nothing leaks): "This is a rider account. Sign in on the rider sign-in page."

| Role | Sign in | Register | Lands on |
|---|---|---|---|
| Customer | `/login` | `/register` | `/customer` |
| Rider | `/rider/login` | `/rider/register` | `/rider` |
| Admin | `/admin/login` | none | `/admin` |

Each area's layout runs `resolveAreaAccess` (`app/src/features/auth/lib/portals.ts`): signed-out visitors go to that area's sign-in page, other roles go to their own home, and someone already signed in skips the sign-in page. Signing out therefore lands each role back on its own sign-in page.

## Rules

| Rule | Value | Where |
|---|---|---|
| Email | Stored lower-cased, unique | `RegisterRequest`, `users.email` |
| Password | At least 8 characters, bcrypt-hashed by the model cast | `RegisterRequest`, `User::casts()` |
| Mobile number | PH mobile in any spelling, stored as `+639XXXXXXXXX`, unique; a contact number only, never used to sign in | `PhoneNumber`, `users.phone` |
| Who can register | Customers and riders (`account_type`, default customer); admins never. Admins can also create riders | `RegisterAccountAction`, `CreateRiderAccountAction` |
| Wrong email or password | One message for both, so accounts cannot be probed | `InvalidCredentialsException` |
| Rate limits | register 5/min per IP; login 10/min per email + IP | `AppServiceProvider` |
| Token lifetime | 90 days, one token per device | `config/sanctum.php` |

## Errors the app shows inline

All come back in the standard envelope under `errors.<field>`:

- `That email already has an account.` (409, `errors.email`)
- `That number already has an account.` (409, `errors.phone`)
- `Email or password is incorrect.` (422, `errors.email`)
- `This account has been deactivated. Contact support.` (403, message only)
- Validation messages for each field (422)

## Local development

`php artisan db:seed` creates one account per role, all with the password `password`:

| Role | Email | Phone |
|---|---|---|
| admin | admin@example.com | 0917 000 0001 |
| rider | rider@example.com | 0917 000 0002 |
| rider | rider2@example.com | 0917 000 0004 |
| customer | customer@example.com | 0917 000 0003 |

Anyone else registers at `/register` (customer) or `/rider/register` (rider). A self-registered rider starts offline and can go online straight away; there is no admin approval step yet. Rider accounts are created by an admin (Riders & users screen), who sets the first password.

## App side

- The sign-in screens render `SignInPanel` for their role and the register screens render `RegisterPanel` for theirs; the URL decides the account type, there is no picker.
- `useLogin` and `useRegister` share `useStoreSession`: the token and role go to the auth store (secure storage) and the user is seeded into the current-user query. The root route then redirects by role.
- `useLogout` clears the local session even if the server cannot be reached; the token simply expires later.
- A `401` from any request clears the session (Axios interceptor), which sends the user back to login.

## Riders on duty

Customers see how many riders are on duty, never who. A rider counts while all three hold:

- the rider switched **Online**,
- the account is active,
- the rider app sent a heartbeat within the last 150 seconds (`matching.presence_timeout_seconds`). The app sends one every 60 seconds while it is open and the rider is online.

Signing out takes a rider offline at once. Closing the app without signing out drops them from the count within about two and a half minutes.
