import type { Ionicons } from '@expo/vector-icons';

import { pabiliCategorySchema, serviceTypeSchema } from '../schemas/bookingSchemas';
import type { PabiliCategory, ServiceType } from '../types';

/**
 * One thing a customer can book. Three of the four are Pabili with a
 * category; the flow and tariff are shared, the wording and the rider's
 * destination differ.
 */
export interface ServiceOffering {
  /** Stable key for lists and route matching, e.g. "pabili:food". */
  key: string;
  serviceType: ServiceType;
  /** Null for Pasuyo. */
  pabiliCategory: PabiliCategory | null;
  title: string;
  /** One or two words for the icon row on the home screen. */
  shortTitle: string;
  blurb: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const SERVICE_OFFERINGS: readonly ServiceOffering[] = [
  {
    key: 'pabili:grocery',
    serviceType: 'pabili',
    pabiliCategory: 'grocery',
    title: 'Pabili',
    shortTitle: 'Pabili',
    blurb: 'Pharmacy, grocery and more.',
    icon: 'cart-outline',
  },
  {
    key: 'pabili:food',
    serviceType: 'pabili',
    pabiliCategory: 'food',
    title: 'Pabili Food',
    shortTitle: 'Food',
    blurb: 'Food takeout and food delivery.',
    icon: 'fast-food-outline',
  },
  {
    key: 'pabili:pet_food',
    serviceType: 'pabili',
    pabiliCategory: 'pet_food',
    title: 'Pabili Pet Food',
    shortTitle: 'Pet food',
    blurb: 'Cat and dog food, and more.',
    icon: 'paw-outline',
  },
  {
    key: 'pasuyo',
    serviceType: 'pasuyo',
    pabiliCategory: null,
    title: 'Pasuyo',
    shortTitle: 'Pasuyo',
    blurb: 'May ipapakuha o ipapahatid? A rider fetches it and brings it over.',
    icon: 'cube-outline',
  },
];

/** What the form defaults to when the URL says nothing. */
const DEFAULT_SERVICE_TYPE: ServiceType = 'pasuyo';
const DEFAULT_PABILI_CATEGORY: PabiliCategory = 'grocery';

/** Route params → offering, or null when they name something that does not exist. */
export function resolveOffering(
  serviceType: string | undefined,
  category: string | undefined,
): ServiceOffering | null {
  const parsedType = serviceTypeSchema.safeParse(serviceType ?? DEFAULT_SERVICE_TYPE);

  if (!parsedType.success) {
    return null;
  }

  if (parsedType.data === 'pasuyo') {
    return SERVICE_OFFERINGS.find((offering) => offering.serviceType === 'pasuyo') ?? null;
  }

  const parsedCategory = pabiliCategorySchema.safeParse(category ?? DEFAULT_PABILI_CATEGORY);

  if (!parsedCategory.success) {
    return null;
  }

  return (
    SERVICE_OFFERINGS.find(
      (offering) =>
        offering.serviceType === 'pabili' && offering.pabiliCategory === parsedCategory.data,
    ) ?? null
  );
}

/** The route params that bring the booking form to this offering. */
export function offeringParams(offering: ServiceOffering): {
  serviceType: ServiceType;
  category?: PabiliCategory;
} {
  return offering.pabiliCategory === null
    ? { serviceType: offering.serviceType }
    : { serviceType: offering.serviceType, category: offering.pabiliCategory };
}

export interface PabiliFormCopy {
  listTitle: string;
  itemPlaceholder: string;
  notePlaceholder: string;
  budgetHint: string;
  riderNotesPlaceholder: string;
}

/** Wording of the Pabili form per category; the fields are the same. */
export function pabiliFormCopy(category: PabiliCategory): PabiliFormCopy {
  switch (category) {
    case 'grocery':
      return {
        listTitle: 'Shopping list',
        itemPlaceholder: 'e.g. Biogesic 500mg, 10 tablets',
        notePlaceholder: 'Brand, size',
        budgetHint: 'The most the rider may spend at the store. Reimbursed in cash on delivery.',
        riderNotesPlaceholder: 'Preferred store or brands, what to do if an item is out of stock',
      };
    case 'food':
      return {
        listTitle: 'Your order',
        itemPlaceholder: 'e.g. 2-pc Chickenjoy with rice',
        notePlaceholder: 'Flavor, size, no onions',
        budgetHint:
          'The most the rider may spend at the restaurant. Reimbursed in cash on delivery.',
        riderNotesPlaceholder: 'Restaurant or branch, what to swap if sold out',
      };
    case 'pet_food':
      return {
        listTitle: 'Shopping list',
        itemPlaceholder: 'e.g. Whiskas adult 1.2 kg',
        notePlaceholder: 'Brand, flavor, size',
        budgetHint: 'The most the rider may spend at the pet shop. Reimbursed in cash on delivery.',
        riderNotesPlaceholder: 'Preferred pet shop or brands, what to do if out of stock',
      };
  }
}
