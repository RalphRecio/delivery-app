import type { BookingFilters, PageParams, StoreFilters, UserFilters } from '../types';

export const adminKeys = {
  all: ['admin'] as const,
  dashboard: () => [...adminKeys.all, 'dashboard'] as const,
  fareSettings: () => [...adminKeys.all, 'fare-settings'] as const,
  users: (filters: UserFilters & PageParams) => [...adminKeys.all, 'users', filters] as const,
  riders: (filters: { search?: string } & PageParams) =>
    [...adminKeys.all, 'riders', filters] as const,
  bookings: (filters: BookingFilters & PageParams) =>
    [...adminKeys.all, 'bookings', filters] as const,
  booking: (id: number) => [...adminKeys.all, 'booking', id] as const,
  riderCandidates: (bookingId: number) =>
    [...adminKeys.all, 'booking', bookingId, 'rider-candidates'] as const,
  stores: (filters: StoreFilters & PageParams) => [...adminKeys.all, 'stores', filters] as const,
  store: (id: number) => [...adminKeys.all, 'store', id] as const,
};
