import { Login } from '@/components/auth/Login';
import { PortalType } from '@/types/auth';

const InsurerLogin = () => {
  return (
    <Login
      portalType={PortalType.INSURER}
      title="Underwriter Login"
      description="Sign in to continue."
    />
  );
};

export default InsurerLogin;
