import { setBaseUrl } from '@/lib/api/client';
import { ENV } from '@/config/env';
import { resolveApiBaseUrl } from '@/config/resolve-api-base-url';

export function configureApi() {
  setBaseUrl(resolveApiBaseUrl(ENV.API_BASE_URL));
}
