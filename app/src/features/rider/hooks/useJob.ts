import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/shared/lib/api';

import { riderApi } from '../api/riderApi';
import type { Job } from '../types';

import { riderKeys } from './riderKeys';

export function useJob(id: number) {
  return useQuery<Job, ApiError>({
    queryKey: riderKeys.job(id),
    queryFn: () => riderApi.getJob(id),
  });
}
