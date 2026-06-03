import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useToast } from '@/shared/hooks/use-toast';
import { login } from '@/features/auth/api/auth';
import { getInsurer } from '@/features/insurers/api/insurers';
import { setAuthToken } from '@/lib/api/client';
import {
  getAuthToken,
  getAuthUser,
  setAuthTokens,
  setInsurerCompany,
  setBrokerCompany,
  setBrokerLicense,
} from '@/lib/auth';
import { useAccessMatrixStore } from '@/shared/stores/useAccessMatrixStore';
import { useMarketThemeStore } from '@/shared/stores/useMarketThemeStore';
import { applyPortalDefault, applySuperAdminTheme } from '@/lib/market-theme';
import { PoweredBy } from '@/components/auth/PoweredBy';
import { PortalType, PortalTypeString } from '@/types/auth';
import { navigateToDefaultDashboard } from '@/lib/navigation-helpers';
import {
  Shield,
  Eye,
  EyeOff,
  Crown,
  ArrowLeft,
  FileText,
  TrendingUp,
  CheckCircle2,
  DollarSign,
  Home,
  Briefcase,
  Award,
  BarChart3,
  PieChart,
  Target,
  Users,
  CreditCard,
  Calendar,
  Clock,
  Globe,
  Mail,
  Phone,
  Settings,
  Star,
  Activity,
  ArrowUp,
  ArrowDown,
  Lock,
} from 'lucide-react';
import siteLogo from '@/assets/logo.png';

const bgImage = '/bg.jpeg';

interface LoginProps {
  portalType: PortalTypeString;
  title: string;
  description?: string;
  subtitle?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  icon?: React.ReactNode;
}

export const Login: React.FC<LoginProps> = ({
  portalType,
  title,
  description,
  heroTitle,
  heroSubtitle,
  heroDescription,
  icon,
}) => {
  const navigate = useNavigate();
  const { setUser, setToken, setRefreshToken } = useAuthStore();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { theme, isInitialized } = useMarketThemeStore();

  // Existing session: decide synchronously so we never paint the login form, then navigate before paint (useLayoutEffect).
  const existingSessionForPortal = useMemo(() => {
    if (portalType === PortalType.SUPER_ADMIN) return false;
    const token = getAuthToken();
    if (!token) return false;
    const user = getAuthUser<{ role?: string; user_type?: string; userType?: string }>();
    if (!user) return false;
    const raw = user.role ?? user.user_type ?? user.userType;
    const role = typeof raw === 'string' && raw.trim().length > 0 ? raw.trim().toLowerCase() : '';
    if (portalType === PortalType.BROKER) return role === 'broker';
    if (portalType === PortalType.INSURER) return role === 'insurer';
    if (portalType === PortalType.MARKET_ADMIN) return role === 'admin' || role === 'market_admin';
    return false;
  }, [portalType]);

  useLayoutEffect(() => {
    if (!existingSessionForPortal) return;
    navigateToDefaultDashboard(navigate, portalType);
  }, [existingSessionForPortal, navigate, portalType]);

  // Handle fresh app / default branding
  useEffect(() => {
    if (!isInitialized) return;
    if (portalType === PortalType.SUPER_ADMIN) {
      useMarketThemeStore.getState().clearTheme();
      applySuperAdminTheme();
      return;
    }
    if (!theme) {
      applyPortalDefault(portalType);
    }
  }, [isInitialized, theme, portalType]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Super Admin specific logic path
      if (portalType === PortalType.SUPER_ADMIN) {
        const res = await login({ email: formData.email, password: formData.password });
        // Guarantee 'super_admin' role if missing from response
        const superAdminUser = {
          ...res.user,
          role: (res.user.role || 'super_admin') as 'super_admin',
        };

        setUser(superAdminUser);
        setToken(res.accessToken, res.refreshToken);
        setRefreshToken(res.refreshToken);

        // Also set legacy auth tokens for backward compatibility
        setAuthToken(res.accessToken);
        setAuthTokens(res.accessToken, res.refreshToken);

        // Super-admin uses #bad5ea (Aura) theme only
        useMarketThemeStore.getState().clearTheme();
        applySuperAdminTheme();

        toast({
          title: 'Login Successful',
          description: `Welcome, ${res.user.email}!`,
        });

        navigateToDefaultDashboard(navigate, PortalType.SUPER_ADMIN);
        return;
      }

      // Regular Login
      // portalType is narrowed here to Exclude<..., 'super_admin'>
      const res = await login(
        {
          email: formData.email,
          password: formData.password,
          userType: portalType,
        },
        true,
      );

      let organizationId: string | undefined;

      try {
        const payloadBase64 = res.accessToken.split('.')[1];
        if (payloadBase64) {
          const decodedPayload = JSON.parse(atob(payloadBase64));
          organizationId = decodedPayload.organizationId;
          console.log('[AUTH] Extracted organizationId from JWT:', organizationId);
        }
      } catch (e) {
        console.error('[AUTH] Failed to decode JWT payload', e);
      }

      // Merge API user last so `role` is not overwritten by an empty/null role from `...res.user`
      // (that bug made persisted sessions fail RequireAuth after reopening the tab).
      const apiRole = typeof res.user?.role === 'string' ? res.user.role.trim().toLowerCase() : '';
      const knownRoles = ['broker', 'insurer', 'admin', 'market_admin', 'super_admin'] as const;
      const resolvedRole = (knownRoles as readonly string[]).includes(apiRole)
        ? apiRole
        : portalType;

      const userToSet = {
        ...res.user,
        organizationId: res.user.organizationId || organizationId,
        logo: res.user.logo || res.branding?.logoUrl || (res.user as any).company_logo,
        ...(res.market?.marketId ? { marketId: res.market.marketId } : {}),
        ...(res.market?.domain ? { marketDomain: res.market.domain } : {}),
        role: resolvedRole as any,
      };

      setUser(userToSet);
      setToken(res.accessToken, res.refreshToken);
      setRefreshToken(res.refreshToken);
      setAuthTokens(res.accessToken, res.refreshToken);

      if (res.branding) {
        useMarketThemeStore.getState().setTheme({
          marketId: res.market?.marketId || '',
          name: res.market?.name || 'Marketplace',
          clientName: res.market?.clientName || 'Marketplace',
          themeColor: res.branding.themeColor,
          logoUrl: res.branding.logoUrl,
        });
      }

      if (portalType === PortalType.BROKER && res.license) {
        setBrokerLicense({
          licenseNumber: res.license.licenseNumber,
          validityStart: res.license.validityStart,
          validityEnd: res.license.validityEnd,
          licenseDocumentFileId: res.license.licenseDocumentFileId,
          licenseDocument: res.license.licenseDocument,
          licenseDocumentUrl: res.license.licenseDocumentUrl,
          licenseDocumentSize: res.license.licenseDocumentSize,
        });
      }

      // Portal specific post-login actions
      if (portalType === PortalType.INSURER && res.user?.company_id) {
        try {
          const company = await getInsurer(res.user.company_id);
          setInsurerCompany({
            id: typeof company.id === 'number' ? company.id : Number(company.id),
            name: company.name,
            logo: (company as any).companyLogo ?? (company as any).logo ?? null,
          });
        } catch (e: unknown) {
          console.error('Failed to fetch insurer details', e);
        }
      }

      if (portalType === PortalType.BROKER && (res.market?.marketId || res.user?.company_id)) {
        try {
          const companyId = res.user?.company_id || res.market?.marketId;
          if (companyId) {
            setBrokerCompany({
              id: typeof companyId === 'number' ? companyId : Number(companyId) || 0,
              name: res.market?.name || 'Brokerage',
              logo:
                res.branding?.logoUrl ||
                (res.user as any).logo ||
                (res.user as any).company_logo ||
                null,
            });
          }
        } catch (e: unknown) {
          console.error('Failed to set broker company details', e);
        }
      }

      // Initialize Access Matrix
      {
        const s = useAccessMatrixStore.getState();
        await s.clear();
        await s.load();
      }

      toast({
        title: 'Login Successful',
        description: `Welcome, ${res.user.email}!`,
      });

      navigateToDefaultDashboard(navigate, portalType);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setErrorMessage(message);
      toast({
        title: 'Login Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHeroIcon = () => {
    if (icon) return icon;
    switch (portalType) {
      case PortalType.SUPER_ADMIN:
        return <Crown className="w-6 h-6" />;
      case PortalType.INSURER:
        return <Shield className="w-6 h-6" />;
      case PortalType.BROKER:
        return <Users className="w-6 h-6" />;
      default:
        return <Crown className="w-6 h-6" />;
    }
  };

  const defaultHeroTitle = 'P&C 360 Platform';
  const defaultHeroSubtitle =
    portalType === PortalType.SUPER_ADMIN
      ? 'Super Admin Portal'
      : portalType === PortalType.INSURER
        ? 'Insurer Portal'
        : portalType === PortalType.BROKER
          ? 'Distributor Portal'
          : 'Portal';

  const defaultHeroDescription =
    portalType === PortalType.SUPER_ADMIN
      ? 'Manage environments, clients, and access controls across all marketplaces.'
      : portalType === PortalType.INSURER
        ? 'Manage your underwriter operations with ease and control.'
        : 'Issue and Manage Quotes Policies and Endorsements.';

  if (existingSessionForPortal) {
    return (
      <div
        className="min-h-screen w-full cityscape-bg flex items-center justify-center"
        aria-busy="true"
        aria-label="Continuing to your dashboard"
      />
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-[999] rounded-full hover:bg-white/80 bg-white backdrop-blur-sm shadow-lg"
      >
        <ArrowLeft className="w-5 h-5 text-primary" />
      </Button>
      <div className="min-h-screen w-full flex cityscape-bg">
        {/* Left hero panel */}
        <div className="hidden lg:flex w-1/2 relative text-white overflow-hidden">
          {/* Cityscape background image */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          {/* Glass blur overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-primary/30 to-primary/20 backdrop-blur-sm z-[1]" />
          {/* Content with glass effect */}
          <div className="relative z-10 max-w-xl mx-auto my-auto px-12 py-16 flex flex-col w-full backdrop-blur-[2px] bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3 mb-6 flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                {getHeroIcon()}
              </div>
              <h2 className="text-2xl font-semibold">{heroTitle || defaultHeroTitle}</h2>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4 flex-shrink-0">
              {heroSubtitle || defaultHeroSubtitle}
            </h1>
            <p className="text-white/90 text-base lg:text-lg leading-relaxed break-words">
              {heroDescription || (heroSubtitle ? description : defaultHeroDescription)}
            </p>
          </div>
        </div>

        {/* Right login card */}
        <div className="flex-1 flex flex-col p-6 bg-gradient-to-br from-background to-secondary/20 relative overflow-hidden">
          {/* Material Design Doodles - From SuperAdminLogin */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <Crown
              className="absolute top-12 right-12 w-16 h-16 stroke-[1.5] rotate-12"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <Shield
              className="absolute bottom-24 right-24 w-14 h-14 stroke-[1.5] -rotate-12"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <FileText
              className="absolute top-28 left-8 w-12 h-12 stroke-[1.5] rotate-45"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <TrendingUp
              className="absolute bottom-28 left-16 w-14 h-14 stroke-[1.5] -rotate-12"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <CheckCircle2
              className="absolute top-44 right-28 w-10 h-10 stroke-[1.5] rotate-12"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <DollarSign
              className="absolute bottom-12 left-28 w-8 h-8 stroke-[1.5] -rotate-45"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <Home
              className="absolute top-56 right-20 w-12 h-12 stroke-[1.5] rotate-30"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <Briefcase
              className="absolute bottom-40 left-4 w-10 h-10 stroke-[1.5] -rotate-20"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <Lock
              className="absolute top-20 right-40 w-14 h-14 stroke-[1.5] rotate-45"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <Award
              className="absolute bottom-48 left-20 w-12 h-12 stroke-[1.5] -rotate-15"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <BarChart3
              className="absolute top-36 left-36 w-10 h-10 stroke-[1.5] rotate-25"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <PieChart
              className="absolute bottom-56 right-8 w-14 h-14 stroke-[1.5] -rotate-30"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <Target
              className="absolute top-64 left-24 w-8 h-8 stroke-[1.5] rotate-40"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <Users
              className="absolute bottom-20 right-36 w-10 h-10 stroke-[1.5] -rotate-25"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <CreditCard
              className="absolute top-20 left-48 w-12 h-12 stroke-[1.5] rotate-15"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <Calendar
              className="absolute bottom-36 right-52 w-10 h-10 stroke-[1.5] -rotate-35"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <Clock
              className="absolute top-52 right-8 w-11 h-11 stroke-[1.5] rotate-50"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <Globe
              className="absolute bottom-64 left-12 w-13 h-13 stroke-[1.5] -rotate-10"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <Mail
              className="absolute top-40 right-56 w-9 h-9 stroke-[1.5] rotate-20"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <Phone
              className="absolute bottom-52 left-40 w-11 h-11 stroke-[1.5] -rotate-40"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <Settings
              className="absolute top-68 left-52 w-10 h-10 stroke-[1.5] rotate-30"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <Star
              className="absolute bottom-28 right-16 w-9 h-9 stroke-[1.5] -rotate-20"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <Activity
              className="absolute top-32 left-20 w-12 h-12 stroke-[1.5] rotate-45"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <ArrowUp
              className="absolute bottom-44 right-44 w-8 h-8 stroke-[1.5] rotate-25"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
            <ArrowDown
              className="absolute top-76 left-16 w-8 h-8 stroke-[1.5] -rotate-25"
              style={{ color: 'hsl(var(--primary) / 0.5)' }}
            />
          </div>
          <div className="flex-1 flex items-center justify-center relative z-10">
            <div className="w-full max-w-md">
              <Card className="shadow-medium rounded-2xl">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <img src={siteLogo} alt="aura logo" className="h-12 w-auto" />
                  </div>
                  <CardTitle className="text-2xl">{title}</CardTitle>
                  <CardDescription>
                    {description || "Let's get started with your secure access."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    {errorMessage && (
                      <div className="text-sm rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
                        {errorMessage}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          disabled={isSubmitting}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" size="lg" className="w-full">
                      {isSubmitting ? 'Signing In...' : 'Login'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
          {portalType === PortalType.SUPER_ADMIN ? (
            <div className="pt-6 text-center text-muted-foreground flex items-center justify-center gap-2">
              <span className="text-sm md:text-base font-medium">Powered by</span>
              <img
                src={siteLogo}
                alt="AURA"
                className="h-5 w-auto object-contain"
                loading="eager"
              />
            </div>
          ) : (
            <PoweredBy />
          )}
        </div>
      </div>
    </div>
  );
};
