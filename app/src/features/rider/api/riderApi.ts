import { z } from 'zod';

import { bookingSchema } from '@/features/booking';
import { apiRequest } from '@/shared/lib/api';

import { riderProfileSchema } from '../schemas/riderSchemas';
import type { Job, LocationInput, RiderProfile, RiderProgressStatus } from '../types';

export const riderApi = {
  getProfile: (): Promise<RiderProfile> =>
    apiRequest({ method: 'GET', url: '/rider/profile' }, riderProfileSchema),

  setAvailability: (isOnline: boolean): Promise<RiderProfile> =>
    apiRequest(
      { method: 'PUT', url: '/rider/availability', data: { is_online: isOnline } },
      riderProfileSchema,
    ),

  heartbeat: (): Promise<RiderProfile> =>
    apiRequest({ method: 'POST', url: '/rider/heartbeat' }, riderProfileSchema),

  updateLocation: (location: LocationInput): Promise<RiderProfile> =>
    apiRequest({ method: 'PUT', url: '/rider/location', data: location }, riderProfileSchema),

  listAvailableJobs: (): Promise<Job[]> =>
    apiRequest({ method: 'GET', url: '/rider/jobs/available' }, z.array(bookingSchema)),

  getActiveJob: (): Promise<Job | null> =>
    apiRequest({ method: 'GET', url: '/rider/jobs/active' }, bookingSchema.nullable()),

  listJobs: (): Promise<Job[]> =>
    apiRequest({ method: 'GET', url: '/rider/jobs' }, z.array(bookingSchema)),

  getJob: (id: number): Promise<Job> =>
    apiRequest({ method: 'GET', url: `/rider/jobs/${id}` }, bookingSchema),

  acceptJob: (id: number): Promise<Job> =>
    apiRequest({ method: 'POST', url: `/rider/jobs/${id}/accept` }, bookingSchema),

  progressJob: (id: number, status: RiderProgressStatus): Promise<Job> =>
    apiRequest(
      { method: 'POST', url: `/rider/jobs/${id}/status`, data: { status } },
      bookingSchema,
    ),
};
