/** Query key factory for what the customer feature caches. */
export const customerKeys = {
  all: ['customer'] as const,
  ridersOnDuty: () => [...customerKeys.all, 'riders-on-duty'] as const,
};
