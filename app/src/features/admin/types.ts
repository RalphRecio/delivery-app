import type { z } from 'zod';

import type { BookingStatus, ServiceType } from '@/features/booking';

import type {
  adminBookingSchema,
  adminRiderSchema,
  adminUserSchema,
  dispatchCandidateSchema,
  dashboardSchema,
  fareSettingFormSchema,
  fareSettingSchema,
  createAdminFormSchema,
  createRiderFormSchema,
  adminStoreProductSchema,
  adminStoreSchema,
  storeFormSchema,
  storeProductFormSchema,
} from './schemas/adminSchemas';

export type Dashboard = z.infer<typeof dashboardSchema>;
export type FareSetting = z.infer<typeof fareSettingSchema>;
export type FareSettingInput = z.output<typeof fareSettingFormSchema>;
export type AdminUser = z.infer<typeof adminUserSchema>;
export type AdminRider = z.infer<typeof adminRiderSchema>;
export type AdminBooking = z.infer<typeof adminBookingSchema>;
export type DispatchCandidate = z.infer<typeof dispatchCandidateSchema>;

export interface PageParams {
  page?: number;
  per_page?: number;
}

export interface UserFilters {
  role?: 'customer' | 'rider' | 'admin';
  search?: string;
}

export interface BookingFilters {
  status?: BookingStatus;
  service_type?: ServiceType;
  search?: string;
}

export type CreateRiderInput = z.output<typeof createRiderFormSchema>;
export type CreateAdminInput = z.output<typeof createAdminFormSchema>;
/** Riders and admins are created with the same fields; only the rules differ. */
export type CreateAccountFormValues = z.input<typeof createRiderFormSchema>;

export type AdminStore = z.infer<typeof adminStoreSchema>;
export type AdminStoreProduct = z.infer<typeof adminStoreProductSchema>;
export type StoreInput = z.output<typeof storeFormSchema>;
export type StoreFormValues = z.input<typeof storeFormSchema>;
export type StoreProductInput = z.output<typeof storeProductFormSchema>;
export type StoreProductFormValues = z.input<typeof storeProductFormSchema>;

export interface StoreFilters {
  search?: string;
}
