import { useNavigate } from 'react-router-dom';
import { useNavigationHistory } from '@/shared/hooks/use-navigation-history';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/layout/Footer';
import { Users, Building, Shield, Eye, Phone, Network, Handshake } from 'lucide-react';
import siteLogo from '@/assets/logo.png';

const FlowSelection = () => {
  const navigate = useNavigate();
  // Clear navigation history on landing page to start fresh
  const { navigateBack } = useNavigationHistory();

  return (
    <div className="h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
        <div className="max-w-7xl w-full py-4">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <img src={siteLogo} alt="P&C 360 Logo" className="h-16 w-auto" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Property & Casualty Insurance Platform
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive insurance solutions for property, liability, and casualty risks. Access
              your portal to manage quotes, policies, and coverage.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="hover:shadow-medium transition-shadow cursor-pointer group flex flex-col">
              <CardHeader className="text-center pb-3">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Super Admin</CardTitle>
                <CardDescription className="text-sm">
                  Create and manage market admins with eagle eye view
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center flex flex-col flex-1 p-4 pt-0">
                <p className="text-muted-foreground mb-4 flex-1 text-sm">
                  Super administrative access to create and manage market admins, and have an eagle
                  eye view of all ecosystems.
                </p>
                <Button
                  size="sm"
                  className="w-full mt-auto"
                  onClick={() => navigate('/super-admin/login')}
                >
                  Access
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-medium transition-shadow cursor-pointer group flex flex-col">
              <CardHeader className="text-center pb-3">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <Handshake className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Reinsurer Broker Portal</CardTitle>
                <CardDescription className="text-sm">
                  Place facultative requests and manage slips
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center flex flex-col flex-1 p-4 pt-0">
                <p className="text-muted-foreground mb-4 flex-1 text-sm">
                  Create facultative placement requests, attach quote forms, manage referrals, and
                  track bound reinsurance policies.
                </p>
                <Button
                  size="sm"
                  className="w-full mt-auto bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => navigate('/reinsurer-broker/login')}
                >
                  Access
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-medium transition-shadow cursor-pointer group flex flex-col">
              <CardHeader className="text-center pb-3">
                <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Market Admin</CardTitle>
                <CardDescription className="text-sm">
                  Manage distributors and oversee all operations
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center flex flex-col flex-1 p-4 pt-0">
                <p className="text-muted-foreground mb-4 flex-1 text-sm">
                  Administrative access to manage distributor users, view all quotes, and control
                  platform settings.
                </p>
                <Button
                  size="sm"
                  className="w-full mt-auto bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => navigate('/admin/login')}
                >
                  Access
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-medium transition-shadow cursor-pointer group flex flex-col">
              <CardHeader className="text-center pb-3">
                <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-secondary/20 transition-colors">
                  <Building className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Underwriter Portal</CardTitle>
                <CardDescription className="text-sm">
                  Review and manage insurance applications
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center flex flex-col flex-1 p-4 pt-0">
                <p className="text-muted-foreground mb-4 flex-1 text-sm">
                  Access submitted applications, review quote requests, and manage policies for your
                  customers.
                </p>
                <Button
                  size="sm"
                  className="w-full mt-auto bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => navigate('/insurer/login')}
                >
                  Access
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-medium transition-shadow cursor-pointer group flex flex-col">
              <CardHeader className="text-center pb-3">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <Network className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Reinsurer Portal</CardTitle>
                <CardDescription className="text-sm">
                  Monitor ceded risk and treaty participation
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center flex flex-col flex-1 p-4 pt-0">
                <p className="text-muted-foreground mb-4 flex-1 text-sm">
                  Access your reinsurance dashboard to review ceded exposure, treaty allocations, and
                  policy participation.
                </p>
                <Button
                  size="sm"
                  className="w-full mt-auto bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => navigate('/reinsurer/login')}
                >
                  Access
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-medium transition-shadow cursor-pointer group flex flex-col">
              <CardHeader className="text-center pb-3">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Distributor Portal</CardTitle>
                <CardDescription className="text-sm">
                  Manage contractor insurance quotes and applications
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center flex flex-col flex-1 p-4 pt-0">
                <p className="text-muted-foreground mb-4 flex-1 text-sm">
                  Access your distributor dashboard to manage quotes, track applications, and create
                  new policies for clients.
                </p>
                <Button
                  size="sm"
                  className="w-full mt-auto"
                  onClick={() => navigate('/broker/login')}
                >
                  Access
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-medium transition-shadow cursor-pointer group flex flex-col">
              <CardHeader className="text-center pb-3">
                <div className="mx-auto w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-success/20 transition-colors">
                  <Phone className="w-6 h-6 text-success" />
                </div>
                <CardTitle className="text-xl">Lead Management Portal</CardTitle>
                <CardDescription className="text-sm">
                  View and manage leads by product
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center flex flex-col flex-1 p-4 pt-0">
                <p className="text-muted-foreground mb-4 flex-1 text-sm">
                  Access all leads created across different insurance products. View and manage
                  customer inquiries organized by product type.
                </p>
                <Button
                  size="sm"
                  variant="success"
                  className="w-full mt-auto"
                  onClick={() => navigate('/call-center/login')}
                >
                  Access
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FlowSelection;
