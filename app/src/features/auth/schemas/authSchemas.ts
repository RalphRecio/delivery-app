import { z } from 'zod';

import { userRoleSchema } from '@/shared/types/auth';

import { normalizePhilippineMobile } from '../lib/phone';

export const PASSWORD_MIN_LENGTH = 8;

/* API responses */

export const userSchema = z.object({
  id: z.number().int(),
  first_name: z.string(),
  last_name: z.string(),
  /** "First Last", for display. */
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  role: userRoleSchema,
  is_active: z.boolean(),
  deactivated_at: z.string().nullable(),
  created_at: z.string(),
});

export const authSessionSchema = z.object({
  token: z.string().min(1),
  user: userSchema,
});

/* Forms */

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Enter your email.')
  .email('Enter a valid email address.');

const phoneField = z.string().transform((value, context) => {
  const normalized = normalizePhilippineMobile(value);

  if (normalized === null) {
    context.addIssue({ code: 'custom', message: 'Enter a valid PH mobile number.' });

    return z.NEVER;
  }

  return normalized;
});

export const loginFormSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Enter your password.'),
});

/** What someone may sign up as; admins are created by other admins. */
export const accountTypeSchema = z.enum(['customer', 'rider']);

export const registerFormSchema = z.object({
  first_name: z.string().trim().min(1, 'Enter your first name.').max(60),
  last_name: z.string().trim().min(1, 'Enter your last name.').max(60),
  email: emailField,
  password: z.string().min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`),
  phone: phoneField,
});
