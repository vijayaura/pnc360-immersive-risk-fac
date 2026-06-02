import { FormEvent, useMemo, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Network, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PoweredBy } from '@/components/auth/PoweredBy';
import { setAuthToken } from '@/lib/api/client';
import { setAuthTokens } from '@/lib/auth';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import siteLogo from '@/assets/logo.png';

const bgImage = '/bg.jpeg';
const DEMO_TOKEN = 'dummy-reinsurer-broker-token';
const DEMO_REFRESH_TOKEN = 'dummy-reinsurer-broker-refresh-token';

export default function ReinsurerBrokerLogin() {
  const navigate = useNavigate();
  const { setUser, setToken, setRefreshToken } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: 'reinsurerbroker@demo.com',
    password: 'password',
  });

  const isReady = useMemo(
    () => formData.email.trim().length > 0 && formData.password.trim().length > 0,
    [formData.email, formData.password],
  );

  const handleLogin = (event: FormEvent) => {
    event.preventDefault();

    const demoUser = {
      id: 'demo-reinsurer-broker',
      email: formData.email.trim(),
      name: 'Demo Reinsurance Requester',
      role: 'reinsurer_broker' as const,
      userType: 'REINSURER_BROKER',
      user_type: 'reinsurer_broker',
      organizationId: 'demo-reinsurer-broker-org',
    };

    setUser(demoUser);
    setToken(DEMO_TOKEN, DEMO_REFRESH_TOKEN);
    setRefreshToken(DEMO_REFRESH_TOKEN);
    setAuthToken(DEMO_TOKEN);
    setAuthTokens(DEMO_TOKEN, DEMO_REFRESH_TOKEN);

    navigate('/reinsurer-broker/dashboard');
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/')}
        className="absolute left-6 top-6 z-[999] rounded-full bg-white shadow-lg backdrop-blur-sm hover:bg-white/80"
      >
        <ArrowLeft className="h-5 w-5 text-primary" />
      </Button>

      <div className="flex min-h-screen w-full cityscape-bg">
        <div className="relative hidden w-1/2 overflow-hidden text-white lg:flex">
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div className="absolute inset-0 z-[1] bg-gradient-to-br from-primary/40 via-primary/30 to-primary/20 backdrop-blur-sm" />
          <div className="relative z-10 mx-auto my-auto flex w-full max-w-xl flex-col rounded-2xl border border-white/10 bg-white/5 px-12 py-16 backdrop-blur-[2px]">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <Network className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold">P&C 360 Platform</h2>
            </div>
            <h1 className="mb-4 text-4xl font-bold leading-tight lg:text-5xl">Reinsurance Requester Portal</h1>
            <p className="text-base leading-relaxed text-white/90 lg:text-lg">
              Place facultative reinsurance requests, coordinate referrals, and track policies from a requester workspace.
            </p>
          </div>
        </div>

        <div className="relative flex flex-1 flex-col overflow-hidden bg-gradient-to-br from-background to-secondary/20 p-6">
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <Network className="absolute right-12 top-12 h-16 w-16 rotate-12 stroke-[1.5] text-primary/50" />
            <ShieldCheck className="absolute bottom-20 left-12 h-14 w-14 -rotate-12 stroke-[1.5] text-primary/40" />
            <Lock className="absolute right-24 top-1/3 h-10 w-10 rotate-45 stroke-[1.5] text-primary/30" />
          </div>

          <div className="relative z-10 flex flex-1 items-center justify-center">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center">
                <img src={siteLogo} alt="P&C 360 Logo" className="mx-auto mb-4 h-16 w-auto" />
                <h1 className="mb-2 text-3xl font-bold text-foreground">Reinsurance Requester Login</h1>
                <p className="text-muted-foreground">Use any dummy credentials to continue.</p>
              </div>

              <Card className="border-0 bg-white/95 shadow-2xl backdrop-blur-sm">
                <CardHeader className="space-y-1 pb-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Network className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Demo Access</CardTitle>
                  <CardDescription>Sign in to open the facultative placement dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                        placeholder="reinsurerbroker@demo.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                          placeholder="Enter any password"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword((value) => !value)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={!isReady}>
                      Login to Reinsurance Requester Portal
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          <PoweredBy />
        </div>
      </div>
    </div>
  );
}
