import { ridersOnDutyLabel, riderStatusPill } from './riderStatus';

describe('rider card labels', () => {
  it('names each stage of a job', () => {
    expect(riderStatusPill('searching')).toBe('Finding a rider');
    expect(riderStatusPill('picking_up')).toBe('En route to pickup');
    expect(riderStatusPill('in_transit')).toBe('On the way to you');
  });

  it('pluralises the rider count', () => {
    expect(ridersOnDutyLabel(0)).toBe('0 riders on duty');
    expect(ridersOnDutyLabel(1)).toBe('1 rider on duty');
    expect(ridersOnDutyLabel(2)).toBe('2 riders on duty');
  });
});
