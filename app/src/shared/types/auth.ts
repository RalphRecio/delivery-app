import { z } from 'zod';

export const userRoleSchema = z.enum(['customer', 'rider', 'admin']);

export type UserRole = z.infer<typeof userRoleSchema>;

/** What the app needs to remember between launches to stay signed in. */
export const sessionSchema = z.object({
  token: z.string().min(1),
  role: userRoleSchema,
});

export type Session = z.infer<typeof sessionSchema>;
