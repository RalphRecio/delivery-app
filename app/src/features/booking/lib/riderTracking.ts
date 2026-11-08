import type { Booking, BookingStatus } from '../types';

/** The rider app reports every 15 s during a job; older than this, say so. */
export const STALE_LOCATION_SECONDS = 120;

const TRACKABLE: readonly BookingStatus[] = ['accepted', 'picking_up', 'in_transit'];

/** Mirrors the server: a rider is assigned and working the job. */
export function isRiderTrackable(status: BookingStatus): boolean {
  return TRACKABLE.includes(status);
}

export function secondsSince(isoTime: string, now: Date): number {
  return Math.max(0, Math.round((now.getTime() - new Date(isoTime).getTime()) / 1000));
}

/** "Updated just now", "Updated 40 s ago", "Updated 3 min ago". */
export function locationAgeLabel(isoTime: string, now: Date): string {
  const seconds = secondsSince(isoTime, now);

  if (seconds < 15) {
    return 'Updated just now';
  }

  if (seconds < 60) {
    return `Updated ${seconds} s ago`;
  }

  return `Updated ${Math.round(seconds / 60)} min ago`;
}

/**
 * Where the rider is headed, in words. A Pabili without a store has its
 * pickup at the drop-off point (the rider shops nearby), so there is no
 * separate pickup leg to show.
 */
export function separatePickup(booking: Booking): { latitude: number; longitude: number } | null {
  const { pickup, dropoff } = booking;
  const isSamePoint =
    Math.abs(pickup.point.latitude - dropoff.point.latitude) < 1e-6 &&
    Math.abs(pickup.point.longitude - dropoff.point.longitude) < 1e-6;

  return isSamePoint ? null : pickup.point;
}
