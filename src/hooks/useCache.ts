import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { cacheOrFetch, CacheKeys, CacheTTL } from '../lib/cache';

interface UseCachedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  cacheKey: string;
  cacheTTL?: number;
}

export function useCachedQuery<T>(
  queryKey: string[],
  fetcher: () => Promise<T>,
  options?: UseCachedQueryOptions<T>
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const cacheKey = options?.cacheKey || queryKey.join(':');
      const ttl = options?.cacheTTL || CacheTTL.FIVE_MINUTES;

      return cacheOrFetch(cacheKey, fetcher, { ttl });
    },
    staleTime: options?.cacheTTL ? options.cacheTTL * 1000 : CacheTTL.FIVE_MINUTES * 1000,
    ...options,
  });
}

export function useInvalidateCache() {
  const queryClient = useQueryClient();

  return {
    invalidateFacility: (facilityId: string) => {
      queryClient.invalidateQueries({ queryKey: ['facility', facilityId] });
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
    },
    invalidateCourt: (courtId: string) => {
      queryClient.invalidateQueries({ queryKey: ['court', courtId] });
      queryClient.invalidateQueries({ queryKey: ['courts'] });
    },
    invalidateBookings: (userId?: string) => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['bookings', userId] });
      }
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    invalidateAvailability: (courtId: string, date?: string) => {
      if (date) {
        queryClient.invalidateQueries({ queryKey: ['availability', courtId, date] });
      }
      queryClient.invalidateQueries({ queryKey: ['availability', courtId] });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries();
    },
  };
}

export { CacheKeys, CacheTTL };
