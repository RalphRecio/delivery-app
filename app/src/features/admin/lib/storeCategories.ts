import type { StoreCategory } from '@/features/store';

/** Store categories in the order the admin picks from; labels match the server's. */
export const STORE_CATEGORY_OPTIONS: { value: StoreCategory; label: string }[] = [
  { value: 'grocery', label: 'Grocery' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'convenience', label: 'Convenience store' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'other', label: 'Other' },
];
