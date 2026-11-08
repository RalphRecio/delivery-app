import { nextStep } from './nextStep';

describe('nextStep', () => {
  it.each([
    ['accepted', 'picking_up'],
    ['picking_up', 'in_transit'],
    ['in_transit', 'completed'],
  ] as const)('moves %s to %s', (from, to) => {
    expect(nextStep(from)?.status).toBe(to);
  });

  it.each(['pending', 'searching', 'completed', 'cancelled'] as const)(
    'offers nothing for %s',
    (status) => {
      expect(nextStep(status)).toBeNull();
    },
  );
});
