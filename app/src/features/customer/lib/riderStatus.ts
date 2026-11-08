import type { BookingStatus } from '@/features/booking';

/** The short pill on the home rider card; the long label comes from the server. */
export function riderStatusPill(status: BookingStatus): string {
  switch (status) {
    case 'pending':
    case 'searching':
      return 'Finding a rider';
    case 'accepted':
      return 'Assigned';
    case 'picking_up':
      return 'En route to pickup';
    case 'in_transit':
      return 'On the way to you';
    case 'completed':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
  }
}

export function ridersOnDutyLabel(count: number): string {
  return count === 1 ? '1 rider on duty' : `${count} riders on duty`;
}
