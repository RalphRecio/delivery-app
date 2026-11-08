export const riderKeys = {
  all: ['rider'] as const,
  profile: () => [...riderKeys.all, 'profile'] as const,
  availableJobs: () => [...riderKeys.all, 'jobs', 'available'] as const,
  activeJob: () => [...riderKeys.all, 'jobs', 'active'] as const,
  jobHistory: () => [...riderKeys.all, 'jobs', 'history'] as const,
  job: (id: number) => [...riderKeys.all, 'jobs', 'detail', id] as const,
};
