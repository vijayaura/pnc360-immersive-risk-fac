import { configureApi } from './configure-api';
import { initAuth } from './init-auth';
import { exposeDevTools } from './expose-dev-tools';

export function bootstrapApp() {
  configureApi();
  initAuth();
  exposeDevTools();
}
