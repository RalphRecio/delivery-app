import type { BookingStatus } from '@/features/booking';

import type { RiderProgressStatus } from '../types';

export interface NextStep {
  status: RiderProgressStatus;
  label: string;
}

/** The one button a rider sees on an active job: what happens next. */
export function nextStep(status: BookingStatus): NextStep | null {
  switch (status) {
    case 'accepted':
      return { status: 'picking_up', label: 'Heading to pickup' };
    case 'picking_up':
      return { status: 'in_transit', label: 'Picked up, on the way' };
    case 'in_transit':
      return { status: 'completed', label: 'Delivered' };
    default:
      return null;
  }
}
