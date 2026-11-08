import type { Ionicons } from '@expo/vector-icons';

export interface CustomerTab {
  label: string;
  href: '/customer' | '/customer/bookings' | '/customer/messages' | '/customer/profile';
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

/** The four top-level customer areas; the phone tab bar and the desktop top bar share them. */
export const CUSTOMER_TABS: readonly CustomerTab[] = [
  { label: 'Home', href: '/customer', icon: 'home-outline', activeIcon: 'home' },
  {
    label: 'Bookings',
    href: '/customer/bookings',
    icon: 'document-text-outline',
    activeIcon: 'document-text',
  },
  {
    label: 'Messages',
    href: '/customer/messages',
    icon: 'chatbubble-ellipses-outline',
    activeIcon: 'chatbubble-ellipses',
  },
  {
    label: 'Profile',
    href: '/customer/profile',
    icon: 'person-circle-outline',
    activeIcon: 'person-circle',
  },
];

/** A booking's detail page counts as the Bookings tab; the booking form does not. */
const BOOKING_DETAIL = /^\/customer\/bookings\/\d+$/;

export function isTabActive(tab: CustomerTab, pathname: string): boolean {
  if (tab.href === '/customer/bookings') {
    return pathname === tab.href || BOOKING_DETAIL.test(pathname);
  }

  return pathname === tab.href;
}

/** The phone tab bar shows on the four tab screens only, not on forms or details. */
export function isTabRoot(pathname: string): boolean {
  return CUSTOMER_TABS.some((tab) => tab.href === pathname);
}
