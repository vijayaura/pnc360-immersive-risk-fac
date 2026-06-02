import { useQuery } from '@tanstack/react-query';

import { fetchLiveWeather, weatherCodeLabel } from '../api/liveApis';

export function useLiveWeather(lat: number, lng: number) {
  return useQuery({
    queryKey: ['live-weather', lat, lng],
    queryFn: () => fetchLiveWeather(lat, lng),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 1,
  });
}

export { weatherCodeLabel };
