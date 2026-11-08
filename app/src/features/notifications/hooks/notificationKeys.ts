export const notificationKeys = {
  all: ['notifications'] as const,
  pushStatus: () => [...notificationKeys.all, 'push-status'] as const,
};
