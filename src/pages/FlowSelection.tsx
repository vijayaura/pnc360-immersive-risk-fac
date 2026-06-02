import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/layout/Footer';
import {
  Users,
  Building,
  Shield,
  Eye,
  Phone,
  Network,
  Handshake,
  type LucideIcon,
} from 'lucide-react';
import siteLogo from '@/assets/logo.png';
import flowSelectionCityscape from '@/assets/backgrounds/flow-selection-cityscape.png';

type PortalCard = {
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
  route: string;
  buttonClassName?: string;
  buttonVariant?: 'default' | 'success';
};

const PORTALS: PortalCard[] = [
  {
    title: 'Super Admin',
    description: 'Create and manage market admins with eagle eye view of all ecosystems.',
    icon: Eye,
    iconClassName: 'bg-primary/10 group-hover:bg-primary/20',
    route: '/super-admin/login',
  },
  {
    title: 'Market Admin',
    description: 'Manage distributors, view all quotes, and control platform settings.',
    icon: Shield,
    iconClassName: 'bg-accent/10 group-hover:bg-accent/20',
    route: '/admin/login',
    buttonClassName: 'bg-accent hover:bg-accent/90 text-accent-foreground',
  },
  {
    title: 'Underwriter Portal',
    description: 'Review applications, quote requests, and manage policies.',
    icon: Building,
    iconClassName: 'bg-secondary/10 group-hover:bg-secondary/20',
    route: '/insurer/login',
    buttonClassName: 'bg-accent hover:bg-accent/90 text-accent-foreground',
  },
  {
    title: 'Distributor Portal',
    description: 'Manage quotes, track applications, and create policies for clients.',
    icon: Users,
    iconClassName: 'bg-primary/10 group-hover:bg-primary/20',
    route: '/broker/login',
  },
  {
    title: 'Reinsurer Portal',
    description: 'Review ceded exposure, treaty allocations, and policy participation.',
    icon: Network,
    iconClassName: 'bg-primary/10 group-hover:bg-primary/20',
    route: '/reinsurer/login',
    buttonClassName: 'bg-accent hover:bg-accent/90 text-accent-foreground',
  },
  {
    title: 'Reinsurance Requester Portal',
    description: 'Place facultative requests, manage referrals, and track bound policies.',
    icon: Handshake,
    iconClassName: 'bg-primary/10 group-hover:bg-primary/20',
    route: '/reinsurer-broker/login',
    buttonClassName: 'bg-accent hover:bg-accent/90 text-accent-foreground',
  },
  {
    title: 'Lead Management Portal',
    description: 'View and manage customer inquiries organized by product type.',
    icon: Phone,
    iconClassName: 'bg-primary/10 group-hover:bg-primary/20',
    route: '/call-center/login',
  },
];

function PortalCardItem({
  portal,
  onAccess,
}: {
  portal: PortalCard;
  onAccess: (route: string) => void;
}) {
  const Icon = portal.icon;

  return (
    <Card className="hover:shadow-medium transition-shadow cursor-pointer group h-full">
      <CardHeader className="text-center space-y-2 p-4 pb-2">
        <div
          className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center transition-colors ${portal.iconClassName}`}
        >
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <CardTitle className="text-base leading-snug">{portal.title}</CardTitle>
        <CardDescription className="text-xs leading-relaxed min-h-[2.5rem]">
          {portal.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <Button
          size="sm"
          variant={portal.buttonVariant}
          className={`w-full ${portal.buttonClassName ?? ''}`}
          onClick={() => onAccess(portal.route)}
        >
          Access
        </Button>
      </CardContent>
    </Card>
  );
}

const FlowSelection = () => {
  const navigate = useNavigate();
  const topRow = PORTALS.slice(0, 4);
  const bottomRow = PORTALS.slice(4);

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(210,40%,98%)]">
      <header className="shrink-0 text-center space-y-2 px-4 pt-8 pb-4 md:pt-10">
        <div className="flex justify-center">
          <img src={siteLogo} alt="P&C 360 Logo" className="h-11 md:h-14 w-auto" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Property & Casualty Insurance Platform
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Comprehensive insurance solutions for property, liability, and casualty risks.
        </p>
      </header>

      <section className="relative flex-1 flex items-center justify-center w-full min-h-0 px-4 md:px-8">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none grayscale opacity-10"
          style={{
            backgroundImage: `url(${flowSelectionCityscape})`,
            backgroundSize: '100% auto',
            backgroundPosition: 'bottom center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center gap-4 py-6">
          <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center">
            {topRow.map((portal) => (
              <div key={portal.route} className="w-full max-w-sm lg:max-w-none">
                <PortalCardItem portal={portal} onAccess={navigate} />
              </div>
            ))}
          </div>

          <div className="grid w-full mx-auto grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center lg:max-w-[75%]">
            {bottomRow.map((portal) => (
              <div key={portal.route} className="w-full max-w-sm lg:max-w-none">
                <PortalCardItem portal={portal} onAccess={navigate} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FlowSelection;
