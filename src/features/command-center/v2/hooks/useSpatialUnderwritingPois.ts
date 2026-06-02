import { useQuery } from '@tanstack/react-query';

import { fetchSpatialUnderwritingPois } from '../api/spatialUnderwriting';

export function useSpatialUnderwritingPois(lat: number, lng: number, enabled = true) {
  return useQuery({
    queryKey: ['spatial-underwriting', lat, lng],
    queryFn: () => fetchSpatialUnderwritingPois(lat, lng),
    staleTime: 30 * 60 * 1000,
    enabled,
    retry: 1,
  });
}
