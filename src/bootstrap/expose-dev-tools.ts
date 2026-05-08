import * as PlansApi from '@/features/product-config/api/plans';
import * as AuthApi from '@/features/auth/api/auth';
import { setBaseUrl, setAuthToken } from '@/lib/api/client';
import { ENV } from '@/config/env';
import { ENV_CHECKS } from '@/config/env-constants';

export function exposeDevTools() {
  if (!ENV_CHECKS.isLocal(ENV.APP_ENV)) return;

  // @ts-expect-error – intentional dev exposure
  window.__api = { PlansApi, AuthApi, setBaseUrl, setAuthToken };
}
