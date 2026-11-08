export const bookingKeys = {
  all: ['bookings'] as const,
  list: () => [...bookingKeys.all, 'list'] as const,
  detail: (id: number) => [...bookingKeys.all, 'detail', id] as const,
};
