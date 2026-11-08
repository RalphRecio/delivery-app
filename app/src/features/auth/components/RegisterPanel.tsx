import { router } from 'expo-router';

import { useRegister } from '../hooks/useRegister';
import { PORTALS } from '../lib/portals';
import type { AccountType } from '../types';

import { AuthCard, AuthLink } from './AuthCard';
import { RegisterForm } from './RegisterForm';

const COPY: Record<AccountType, string> = {
  customer: 'Create your account and book a Pabili or a Pasuyo in a minute.',
  rider: 'Become a rider: sign up, go online, and take jobs near you.',
};

/** The whole register page for customers or riders; the URL decides which. */
export function RegisterPanel({ accountType }: { accountType: AccountType }) {
  const portal = PORTALS[accountType];
  const register = useRegister();

  return (
    <>
      <AuthCard blurb={COPY[accountType]}>
        <RegisterForm
          accountType={accountType}
          onSubmit={(input) =>
            register.mutate(input, { onSuccess: () => router.replace(portal.homeHref) })
          }
          isSubmitting={register.isPending}
          error={register.error}
        />
      </AuthCard>
      <AuthLink prompt="Already have an account?" label="Sign in" href={portal.loginHref} replace />
    </>
  );
}
