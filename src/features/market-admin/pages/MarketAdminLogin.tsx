import { Shield } from 'lucide-react';
import { Login } from '@/components/auth/Login';
import { PortalType } from '@/types/auth';

const MarketAdminLogin = () => {
  return (
    <Login
      portalType={PortalType.MARKET_ADMIN}
      title="Market Admin Login"
      description="Let’s get started with your secure access."
      heroTitle="P&C 360 Platform"
      heroSubtitle="Market Admin"
      heroDescription="Manage distributors and oversee all operations."
      icon={<Shield className="w-6 h-6" />}
    />
  );
};

export default MarketAdminLogin;
