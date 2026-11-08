import { features } from '@/config/features';
import type { TabBarItem } from '@/shared/ui/TabBar';

const WALLET_TAB: TabBarItem = {
  label: 'Wallet',
  href: '/rider/wallet',
  icon: 'wallet-outline',
  activeIcon: 'wallet',
};

/** The top-level rider areas: the job list, the wallet (when switched on), and settings. */
export const RIDER_TABS: readonly TabBarItem[] = [
  { label: 'Jobs', href: '/rider', icon: 'bicycle-outline', activeIcon: 'bicycle' },
  ...(features.riderWallet ? [WALLET_TAB] : []),
  { label: 'Settings', href: '/rider/settings', icon: 'settings-outline', activeIcon: 'settings' },
];

/** The tab bar shows on the tab screens only, not on job details or top-up forms. */
export function isRiderTabRoot(pathname: string): boolean {
  return RIDER_TABS.some((tab) => tab.href === pathname);
}
