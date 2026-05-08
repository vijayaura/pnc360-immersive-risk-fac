import { Login } from '@/components/auth/Login';
import { PortalType } from '@/types/auth';

const BrokerLogin = () => {
  return (
    <Login
      portalType={PortalType.BROKER}
      title="Distributor Login"
      description="Let’s get started with your secure access."
    />
  );
};

export default BrokerLogin;
