import { usePathname } from 'expo-router';

import { TabBar } from '@/shared/ui/TabBar';

import { RIDER_TABS } from '../lib/tabs';

/** Phone bottom navigation: Jobs, Wallet, Settings. */
export function RiderTabBar() {
  const pathname = usePathname();

  return <TabBar tabs={RIDER_TABS} isActive={(tab) => tab.href === pathname} />;
}
