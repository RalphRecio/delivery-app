import { z } from 'zod';

export const pushPublicKeySchema = z.object({
  /** Empty when the server has no VAPID keys configured. */
  public_key: z.string(),
});
