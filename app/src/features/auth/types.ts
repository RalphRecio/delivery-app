import type { z } from 'zod';

import type { UserRole } from '@/shared/types/auth';

import type {
  accountTypeSchema,
  authSessionSchema,
  loginFormSchema,
  registerFormSchema,
  userSchema,
} from './schemas/authSchemas';

export type User = z.infer<typeof userSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type AccountType = z.infer<typeof accountTypeSchema>;

/** Parsed form output. */
export type LoginInput = z.output<typeof loginFormSchema>;

/** What the API receives: the form plus the sign-in page it came from. */
export type LoginRequest = LoginInput & { portal: UserRole };
/** What the API receives: the form plus the account type the URL decided. */
export type RegisterInput = z.output<typeof registerFormSchema> & { account_type: AccountType };

/** Raw form state (strings from text fields). */
export type LoginFormValues = z.input<typeof loginFormSchema>;
export type RegisterFormValues = z.input<typeof registerFormSchema>;
