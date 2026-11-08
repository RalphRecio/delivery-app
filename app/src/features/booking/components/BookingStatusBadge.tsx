import { Badge } from '@/shared/ui';

import { statusTone } from '../lib/status';
import type { Booking } from '../types';

export function BookingStatusBadge({
  booking,
}: {
  booking: Pick<Booking, 'status' | 'status_label'>;
}) {
  return <Badge label={booking.status_label} tone={statusTone(booking.status)} />;
}
