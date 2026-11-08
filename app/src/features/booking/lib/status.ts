import type { BadgeTone } from '@/shared/ui';

import type { BookingStatus } from '../types';

export function statusTone(status: BookingStatus): BadgeTone {
  switch (status) {
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'danger';
    case 'pending':
      return 'neutral';
    default:
      return 'info';
  }
}
