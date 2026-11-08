import { Redirect } from 'expo-router';

import { PORTALS } from '@/features/auth';
import { useAuthStore } from '@/stores/authStore';

/** Entry point: each role to its own area; signed-out visitors to the customer sign-in. */
export default function Index() {
  const session = useAuthStore((state) => state.session);

  return (
    <Redirect
      href={session === null ? PORTALS.customer.loginHref : PORTALS[session.role].homeHref}
    />
  );
}
