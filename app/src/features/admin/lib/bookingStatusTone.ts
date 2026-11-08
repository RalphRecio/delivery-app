import type { PillTone } from '@/config/adminTheme';
import type { BookingStatus } from '@/features/booking';

/** One hue per stage, so the bookings table can be scanned by colour. */
export function bookingStatusTone(status: BookingStatus): PillTone {
  switch (status) {
    case 'searching':
      return 'amber';
    case 'accepted':
      return 'indigo';
    case 'picking_up':
      return 'sky';
    case 'in_transit':
      return 'purple';
    case 'completed':
      return 'green';
    case 'cancelled':
      return 'red';
    default:
      return 'gray';
  }
}
