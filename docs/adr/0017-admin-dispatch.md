# ADR 0017: The admin dispatches riders alongside self-accept

Date: 2026-11-03 · Status: accepted

## Context

Riders found work only by accepting open jobs near them. Operations wants the admin to act as
dispatcher and put a specific available rider on a customer's booking.

## Decision

- **Both paths stay.** The admin can assign any `searching` booking; riders can still accept open
  jobs. Whoever acts first gets the job.
- **No rider confirmation.** A dispatched booking goes straight to `accepted`, exactly like a
  self-accept, so the state machine is unchanged (no `assigned` state, no decline flow). The status
  log shows the admin as actor with the reason "Assigned by dispatcher".
- **Eligibility:** an active (not deactivated) rider with no active job and a wallet at or above
  the minimum. Unlike self-accept, the rider need not be on duty: dispatchers phone riders who are
  not in the app, and the job waits as their active job until they open it (amended 2026-11-03;
  originally on-duty riders only). The candidate list shows every active rider with an on-duty or
  offline badge, and shows ineligible riders with the reason instead of hiding them.
- **One assignment path.** `RiderAssigner` is used by both `AcceptBookingOfferAction` and
  `DispatchRiderAction`. It locks the rider profile row and then the booking row: the first lock
  stops one rider from being given two jobs by concurrent requests, the second stops two riders
  from getting one booking.
- The rider app learns of a dispatched job by polling its active job every 10 s while online and
  idle, matching the offer polling (ADR 0008); no push infrastructure is added.

## Consequences

- A mistaken assignment cannot be undone yet; the admin's only remedy is a support cancellation.
  An "unassign / reassign" move would need a new transition (`accepted → searching`), deferred
  until it is asked for. The admin page asks for a second tap ("Confirm assign") to limit mistakes.
