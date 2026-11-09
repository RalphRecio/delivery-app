import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ServiceType } from '@/features/booking';
import type { ApiError } from '@/shared/lib/api';
import type { Paginated } from '@/shared/types/api';

import { adminApi } from '../api/adminApi';
import type {
  PageParams,
  AdminBooking,
  AdminRider,
  AdminUser,
  BookingFilters,
  Dashboard,
  DispatchCandidate,
  FareSetting,
  FareSettingInput,
  UserFilters,
  CreateAdminInput,
  CreateRiderInput,
  AdminStore,
  AdminStoreProduct,
  StoreFilters,
  StoreInput,
  StoreProductInput,
} from '../types';

import { adminKeys } from './adminKeys';

const DASHBOARD_REFRESH_MS = 30_000;
/** Riders come online, move and take jobs; the dispatcher's list keeps up. */
const CANDIDATES_REFRESH_MS = 15_000;

export function useDashboard() {
  return useQuery<Dashboard, ApiError>({
    queryKey: adminKeys.dashboard(),
    queryFn: adminApi.getDashboard,
    refetchInterval: DASHBOARD_REFRESH_MS,
  });
}

export function useFareSettings() {
  return useQuery<FareSetting[], ApiError>({
    queryKey: adminKeys.fareSettings(),
    queryFn: adminApi.listFareSettings,
  });
}

export function useUpdateFareSetting() {
  const queryClient = useQueryClient();

  return useMutation<FareSetting, ApiError, { serviceType: ServiceType; input: FareSettingInput }>({
    mutationFn: ({ serviceType, input }) => adminApi.updateFareSetting(serviceType, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.fareSettings() });
    },
  });
}

export function useAdminUsers(filters: UserFilters & PageParams) {
  return useQuery<Paginated<AdminUser>, ApiError>({
    queryKey: adminKeys.users(filters),
    queryFn: () => adminApi.listUsers(filters),
    placeholderData: (previous) => previous,
  });
}

export function useAdminRiders(filters: { search?: string } & PageParams) {
  return useQuery<Paginated<AdminRider>, ApiError>({
    queryKey: adminKeys.riders(filters),
    queryFn: () => adminApi.listRiders(filters),
    refetchInterval: DASHBOARD_REFRESH_MS,
    placeholderData: (previous) => previous,
  });
}

export function useCreateRider() {
  const queryClient = useQueryClient();

  return useMutation<AdminUser, ApiError, CreateRiderInput>({
    mutationFn: adminApi.createRider,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'riders'] });
      await queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'users'] });
      await queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();

  return useMutation<AdminUser, ApiError, CreateAdminInput>({
    mutationFn: adminApi.createAdmin,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'users'] });
    },
  });
}

export function useMakeAdmin() {
  const queryClient = useQueryClient();

  return useMutation<AdminUser, ApiError, number>({
    mutationFn: adminApi.makeAdmin,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'users'] });
    },
  });
}

export function useSetUserActivation() {
  const queryClient = useQueryClient();

  return useMutation<AdminUser, ApiError, { id: number; isActive: boolean }>({
    mutationFn: ({ id, isActive }) => adminApi.setUserActivation(id, isActive),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'riders'] });
      await queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'users'] });
    },
  });
}

export function useAdminBookings(filters: BookingFilters & PageParams) {
  return useQuery<Paginated<AdminBooking>, ApiError>({
    queryKey: adminKeys.bookings(filters),
    queryFn: () => adminApi.listBookings(filters),
    refetchInterval: DASHBOARD_REFRESH_MS,
    // Keep the old page on screen while the next one loads, so the table does not flash empty.
    placeholderData: (previous) => previous,
  });
}

export function useAdminBooking(id: number) {
  return useQuery<AdminBooking, ApiError>({
    queryKey: adminKeys.booking(id),
    queryFn: () => adminApi.getBooking(id),
  });
}

export function useSupportCancel() {
  const queryClient = useQueryClient();

  return useMutation<AdminBooking, ApiError, { id: number; reason: string }>({
    mutationFn: ({ id, reason }) => adminApi.cancelBooking(id, reason),
    onSuccess: async (booking) => {
      queryClient.setQueryData(adminKeys.booking(booking.id), booking);
      await queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'bookings'] });
      await queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

/** On-duty riders for a waiting booking. Only fetched while it is waiting. */
export function useRiderCandidates(bookingId: number, isEnabled: boolean) {
  return useQuery<DispatchCandidate[], ApiError>({
    queryKey: adminKeys.riderCandidates(bookingId),
    queryFn: () => adminApi.listRiderCandidates(bookingId),
    enabled: isEnabled,
    refetchInterval: isEnabled ? CANDIDATES_REFRESH_MS : false,
  });
}

export function useAssignRider() {
  const queryClient = useQueryClient();

  return useMutation<AdminBooking, ApiError, { bookingId: number; riderId: number }>({
    mutationFn: ({ bookingId, riderId }) => adminApi.assignRider(bookingId, riderId),
    onSuccess: async (booking) => {
      queryClient.setQueryData(adminKeys.booking(booking.id), booking);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.riderCandidates(booking.id) }),
        queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'bookings'] }),
        queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'riders'] }),
        queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() }),
      ]);
    },
  });
}

export function useAdminStores(filters: StoreFilters & PageParams) {
  return useQuery<Paginated<AdminStore>, ApiError>({
    queryKey: adminKeys.stores(filters),
    queryFn: () => adminApi.listStores(filters),
    placeholderData: (previous) => previous,
  });
}

export function useAdminStore(id: number) {
  return useQuery<AdminStore, ApiError>({
    queryKey: adminKeys.store(id),
    queryFn: () => adminApi.getStore(id),
  });
}

/** Store lists show counts and customer-facing store pages cache menus: refresh both. */
async function invalidateStores(
  queryClient: ReturnType<typeof useQueryClient>,
  storeId: number,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'stores'] }),
    queryClient.invalidateQueries({ queryKey: adminKeys.store(storeId) }),
    queryClient.invalidateQueries({ queryKey: ['stores'] }),
  ]);
}

export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation<AdminStore, ApiError, StoreInput>({
    mutationFn: adminApi.createStore,
    onSuccess: async (store) => {
      queryClient.setQueryData(adminKeys.store(store.id), store);
      await invalidateStores(queryClient, store.id);
    },
  });
}

export function useUpdateStore(storeId: number) {
  const queryClient = useQueryClient();

  return useMutation<AdminStore, ApiError, StoreInput>({
    mutationFn: (input) => adminApi.updateStore(storeId, input),
    onSuccess: async (store) => {
      queryClient.setQueryData(adminKeys.store(store.id), store);
      await invalidateStores(queryClient, store.id);
    },
  });
}

export function useAddStoreProduct(storeId: number) {
  const queryClient = useQueryClient();

  return useMutation<AdminStoreProduct, ApiError, StoreProductInput>({
    mutationFn: (input) => adminApi.addStoreProduct(storeId, input),
    onSuccess: () => invalidateStores(queryClient, storeId),
  });
}

export function useUpdateStoreProduct(storeId: number) {
  const queryClient = useQueryClient();

  return useMutation<AdminStoreProduct, ApiError, { productId: number; input: StoreProductInput }>({
    mutationFn: ({ productId, input }) => adminApi.updateStoreProduct(storeId, productId, input),
    onSuccess: () => invalidateStores(queryClient, storeId),
  });
}
