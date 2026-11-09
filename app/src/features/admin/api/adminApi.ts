import { z } from 'zod';

import type { ServiceType } from '@/features/booking';
import { apiRequest, apiRequestPaginated } from '@/shared/lib/api';
import type { Paginated } from '@/shared/types/api';

import {
  adminBookingSchema,
  adminRiderSchema,
  adminStoreProductSchema,
  adminStoreSchema,
  adminUserSchema,
  dashboardSchema,
  dispatchCandidateSchema,
  fareSettingSchema,
} from '../schemas/adminSchemas';
import type {
  AdminBooking,
  AdminRider,
  AdminUser,
  BookingFilters,
  Dashboard,
  DispatchCandidate,
  FareSetting,
  FareSettingInput,
  PageParams,
  UserFilters,
  CreateAdminInput,
  CreateRiderInput,
  AdminStore,
  AdminStoreProduct,
  StoreFilters,
  StoreInput,
  StoreProductInput,
} from '../types';

/** Drops empty filters so the query string only carries what is set. */
function params(filters: object): Record<string, string> {
  return Object.fromEntries(
    Object.entries(filters)
      .filter(
        ([, value]) => (typeof value === 'string' && value !== '') || typeof value === 'number',
      )
      .map(([key, value]) => [key, String(value)]),
  );
}

export const adminApi = {
  getDashboard: (): Promise<Dashboard> =>
    apiRequest({ method: 'GET', url: '/admin/dashboard' }, dashboardSchema),

  listFareSettings: (): Promise<FareSetting[]> =>
    apiRequest({ method: 'GET', url: '/admin/fare-settings' }, z.array(fareSettingSchema)),

  updateFareSetting: (serviceType: ServiceType, input: FareSettingInput): Promise<FareSetting> =>
    apiRequest(
      { method: 'PUT', url: `/admin/fare-settings/${serviceType}`, data: input },
      fareSettingSchema,
    ),

  listUsers: (filters: UserFilters & PageParams): Promise<Paginated<AdminUser>> =>
    apiRequestPaginated(
      { method: 'GET', url: '/admin/users', params: params(filters) },
      adminUserSchema,
    ),

  listRiders: (filters: { search?: string } & PageParams): Promise<Paginated<AdminRider>> =>
    apiRequestPaginated(
      { method: 'GET', url: '/admin/riders', params: params(filters) },
      adminRiderSchema,
    ),

  createRider: (input: CreateRiderInput): Promise<AdminUser> =>
    apiRequest({ method: 'POST', url: '/admin/riders', data: input }, adminUserSchema),
  createAdmin: (input: CreateAdminInput): Promise<AdminUser> =>
    apiRequest({ method: 'POST', url: '/admin/admins', data: input }, adminUserSchema),

  /** Customers only; they keep their password and sign in again as an admin. */
  makeAdmin: (id: number): Promise<AdminUser> =>
    apiRequest({ method: 'POST', url: `/admin/users/${id}/make-admin` }, adminUserSchema),
  setUserActivation: (id: number, isActive: boolean): Promise<AdminUser> =>
    apiRequest(
      { method: 'POST', url: `/admin/users/${id}/${isActive ? 'reactivate' : 'deactivate'}` },
      adminUserSchema,
    ),

  listBookings: (filters: BookingFilters & PageParams): Promise<Paginated<AdminBooking>> =>
    apiRequestPaginated(
      { method: 'GET', url: '/admin/bookings', params: params(filters) },
      adminBookingSchema,
    ),

  listStores: (filters: StoreFilters & PageParams): Promise<Paginated<AdminStore>> =>
    apiRequestPaginated(
      { method: 'GET', url: '/admin/stores', params: params(filters) },
      adminStoreSchema,
    ),

  getStore: (id: number): Promise<AdminStore> =>
    apiRequest({ method: 'GET', url: `/admin/stores/${id}` }, adminStoreSchema),

  createStore: (input: StoreInput): Promise<AdminStore> =>
    apiRequest({ method: 'POST', url: '/admin/stores', data: input }, adminStoreSchema),

  updateStore: (id: number, input: StoreInput): Promise<AdminStore> =>
    apiRequest({ method: 'PUT', url: `/admin/stores/${id}`, data: input }, adminStoreSchema),

  addStoreProduct: (storeId: number, input: StoreProductInput): Promise<AdminStoreProduct> =>
    apiRequest(
      { method: 'POST', url: `/admin/stores/${storeId}/products`, data: input },
      adminStoreProductSchema,
    ),

  updateStoreProduct: (
    storeId: number,
    productId: number,
    input: StoreProductInput,
  ): Promise<AdminStoreProduct> =>
    apiRequest(
      { method: 'PUT', url: `/admin/stores/${storeId}/products/${productId}`, data: input },
      adminStoreProductSchema,
    ),

  getBooking: (id: number): Promise<AdminBooking> =>
    apiRequest({ method: 'GET', url: `/admin/bookings/${id}` }, adminBookingSchema),

  cancelBooking: (id: number, reason: string): Promise<AdminBooking> =>
    apiRequest(
      { method: 'POST', url: `/admin/bookings/${id}/cancel`, data: { reason } },
      adminBookingSchema,
    ),

  listRiderCandidates: (bookingId: number): Promise<DispatchCandidate[]> =>
    apiRequest(
      { method: 'GET', url: `/admin/bookings/${bookingId}/rider-candidates` },
      z.array(dispatchCandidateSchema),
    ),

  assignRider: (bookingId: number, riderId: number): Promise<AdminBooking> =>
    apiRequest(
      {
        method: 'POST',
        url: `/admin/bookings/${bookingId}/assign-rider`,
        data: { rider_id: riderId },
      },
      adminBookingSchema,
    ),
};
