import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/config/theme';
import type { UserRole } from '@/shared/types/auth';

import { useLogin } from '../hooks/useLogin';
import { PORTALS } from '../lib/portals';

import { AuthCard, AuthLink } from './AuthCard';
import { LoginForm } from './LoginForm';

/** The whole sign-in page for one role: brand, form card, and the links that belong on it. */
export function SignInPanel({ role }: { role: UserRole }) {
  const portal = PORTALS[role];
  const login = useLogin();

  return (
    <>
      <AuthCard blurb={portal.signInBlurb}>
        <LoginForm
          onSubmit={(input) =>
            login.mutate(
              { ...input, portal: role },
              { onSuccess: () => router.replace(portal.homeHref) },
            )
          }
          isSubmitting={login.isPending}
          error={login.error}
        />
      </AuthCard>
      <View style={styles.links}>
        {portal.registerHref !== null && (
          <AuthLink
            prompt={role === 'rider' ? 'New rider?' : 'New here?'}
            label={role === 'rider' ? 'Sign up as a rider' : 'Create an account'}
            href={portal.registerHref}
          />
        )}
        {role === 'customer' && (
          <AuthLink prompt="Riding with us?" label="Rider sign in" href={PORTALS.rider.loginHref} />
        )}
        {role === 'rider' && (
          <AuthLink
            prompt="Booking a delivery?"
            label="Customer sign in"
            href={PORTALS.customer.loginHref}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  links: { gap: spacing.sm },
});
