import { setBaseUrl } from '@/lib/api/client';
import { ENV } from '@/config/env';

export function configureApi() {
  setBaseUrl(ENV.API_BASE_URL);
}
