import { isRiderTabRoot } from './tabs';

describe('isRiderTabRoot', () => {
  it('shows the tab bar on the tab screens only', () => {
    expect(isRiderTabRoot('/rider')).toBe(true);
    expect(isRiderTabRoot('/rider/settings')).toBe(true);
    expect(isRiderTabRoot('/rider/jobs/12')).toBe(false);
    expect(isRiderTabRoot('/rider/wallet/topup')).toBe(false);
  });
});
