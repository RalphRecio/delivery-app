import { Redirect, Slot } from 'expo-router';

import { AuthFrame } from '@/features/auth';
import { useAuthStore } from '@/stores/authStore';

/**
 * Customer sign-in and register (/login, /register). Someone already signed
 * in goes to their own home instead. Riders and admins sign in on their own
 * pages under /rider and /admin.
 */
export default function CustomerAuthLayout() {
  const session = useAuthStore((state) => state.session);

  if (session !== null) {
    return <Redirect href="/" />;
  }

  return (
    <AuthFrame>
      <Slot />
    </AuthFrame>
  );
}
