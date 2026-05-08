import { Login } from '@/components/auth/Login';
import { PortalType } from '@/types/auth';

const SuperAdminLogin = () => {
  return <Login portalType={PortalType.SUPER_ADMIN} title="Super Admin Login" />;
};

export default SuperAdminLogin;
