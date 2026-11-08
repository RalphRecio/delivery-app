import { usePathname } from 'expo-router';

import { TabBar } from '@/shared/ui/TabBar';

import { CUSTOMER_TABS, isTabActive } from '../lib/tabs';

/** Phone bottom navigation: Home, Bookings, Messages, Profile. */
export function CustomerTabBar() {
  const pathname = usePathname();

  return <TabBar tabs={CUSTOMER_TABS} isActive={(tab) => isTabActive(tab, pathname)} />;
}
