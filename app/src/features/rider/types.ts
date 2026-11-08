import type { z } from 'zod';

import type { Booking } from '@/features/booking';

import type { riderProfileSchema } from './schemas/riderSchemas';

export type RiderProfile = z.infer<typeof riderProfileSchema>;

/** A booking as the rider sees it. Same shape; the name says who is looking. */
export type Job = Booking;

export interface LocationInput {
  latitude: number;
  longitude: number;
}

export type RiderProgressStatus = 'picking_up' | 'in_transit' | 'completed';
