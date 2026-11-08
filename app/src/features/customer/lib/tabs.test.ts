import { CUSTOMER_TABS, isTabActive, isTabRoot } from './tabs';

const tab = (label: string) => CUSTOMER_TABS.find((t) => t.label === label)!;

describe('customer tabs', () => {
  it('marks Bookings active on the list and on a booking, not on the booking form', () => {
    expect(isTabActive(tab('Bookings'), '/customer/bookings')).toBe(true);
    expect(isTabActive(tab('Bookings'), '/customer/bookings/42')).toBe(true);
    expect(isTabActive(tab('Bookings'), '/customer/bookings/new')).toBe(false);
    expect(isTabActive(tab('Home'), '/customer/bookings')).toBe(false);
  });

  it('shows the tab bar only on the four tab screens', () => {
    expect(isTabRoot('/customer')).toBe(true);
    expect(isTabRoot('/customer/profile')).toBe(true);
    expect(isTabRoot('/customer/bookings/new')).toBe(false);
    expect(isTabRoot('/customer/bookings/42')).toBe(false);
  });
});
