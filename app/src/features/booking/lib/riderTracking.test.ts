import { isRiderTrackable, locationAgeLabel, secondsSince } from './riderTracking';

const now = new Date('2026-11-03T08:00:00Z');
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000).toISOString();

describe('rider tracking', () => {
  it('tracks only while a rider is working the job', () => {
    expect(isRiderTrackable('accepted')).toBe(true);
    expect(isRiderTrackable('in_transit')).toBe(true);
    expect(isRiderTrackable('searching')).toBe(false);
    expect(isRiderTrackable('completed')).toBe(false);
  });

  it('words how old the position is', () => {
    expect(locationAgeLabel(ago(5), now)).toBe('Updated just now');
    expect(locationAgeLabel(ago(40), now)).toBe('Updated 40 s ago');
    expect(locationAgeLabel(ago(185), now)).toBe('Updated 3 min ago');
  });

  it('never reports a negative age for a clock slightly ahead', () => {
    expect(secondsSince(ago(-3), now)).toBe(0);
  });
});
