import { Phone } from 'lucide-react';
import { Login } from '@/components/auth/Login';
import { PortalType } from '@/types/auth';

const CallCenterLogin = () => {
  return (
    <Login
      portalType={PortalType.CALL_CENTER}
      title="Lead Management Login"
      description="Let's get started with your secure access."
      heroTitle="P&C 360 Platform"
      heroSubtitle="Lead Management Login"
      heroDescription="Manage and track all leads across all insurance products with ease."
      icon={<Phone className="w-6 h-6" />}
    />
  );
};

export default CallCenterLogin;
