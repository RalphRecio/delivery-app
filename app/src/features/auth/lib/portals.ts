import type { Session, UserRole } from '@/shared/types/auth';

/** Where each role signs in, registers and lands. */
export interface Portal {
  role: UserRole;
  loginHref: string;
  /** Null when the role cannot sign up itself (admins are created by admins). */
  registerHref: string | null;
  homeHref: string;
  /** Line under the logo on the sign-in page; null for none. */
  signInBlurb: string | null;
}

export const PORTALS: Readonly<Record<UserRole, Portal>> = {
  customer: {
    role: 'customer',
    loginHref: '/login',
    registerHref: '/register',
    homeHref: '/customer',
    signInBlurb: 'Book a Pabili or a Pasuyo.',
  },
  rider: {
    role: 'rider',
    loginHref: '/rider/login',
    registerHref: '/rider/register',
    homeHref: '/rider',
    signInBlurb: 'Go online and take jobs near you.',
  },
  admin: {
    role: 'admin',
    loginHref: '/admin/login',
    registerHref: null,
    homeHref: '/admin',
    signInBlurb: null,
  },
};

export type AreaAccess =
  | { kind: 'allow' }
  /** The area's own sign-in or register page, shown to anyone not signed in as this role. */
  | { kind: 'auth-page' }
  | { kind: 'redirect'; href: string };

/**
 * The gate every role area runs before rendering a page. Signed-out people
 * go to that area's sign-in page; someone signed in as another role goes to
 * their own home; someone already signed in skips the sign-in page.
 */
export function resolveAreaAccess(
  areaRole: UserRole,
  pathname: string,
  session: Session | null,
): AreaAccess {
  const portal = PORTALS[areaRole];
  const isAuthPage = pathname === portal.loginHref || pathname === portal.registerHref;

  if (isAuthPage) {
    return session?.role === areaRole
      ? { kind: 'redirect', href: portal.homeHref }
      : { kind: 'auth-page' };
  }

  if (session === null) {
    return { kind: 'redirect', href: portal.loginHref };
  }

  if (session.role !== areaRole) {
    return { kind: 'redirect', href: PORTALS[session.role].homeHref };
  }

  return { kind: 'allow' };
}
