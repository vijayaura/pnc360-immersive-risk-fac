import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PWAUpdateProvider } from '@/contexts/PWAUpdateContext';
import { PWAWrapper } from '@/components/pwa/PWAWrapper';

import { lazyRoute } from '@/app/routes/lazyRoute';

const FlowSelection = lazyRoute(() => import('./pages/FlowSelection'));
const NotFound = lazyRoute(() => import('./pages/NotFound'));
const CallCenterPortal = lazyRoute(() => import('./features/call-center/pages/CallCenterPortal'));
const CallCenterLogin = lazyRoute(() => import('./features/call-center/pages/CallCenterLogin'));
const BrokerLogin = lazyRoute(() => import('./features/brokers/pages/BrokerLogin'));
const InsurerLogin = lazyRoute(() => import('./features/insurers/pages/InsurerLogin'));
const ReinsurerLogin = lazyRoute(() => import('./features/reinsurers/pages/ReinsurerLogin'));
const ReinsurerBrokerLogin = lazyRoute(() => import('./features/reinsurer-brokers/pages/ReinsurerBrokerLogin'));
const MarketAdminLogin = lazyRoute(() => import('./features/market-admin/pages/MarketAdminLogin'));
const SuperAdminLogin = lazyRoute(() => import('./features/super-admin/pages/SuperAdminLogin'));

// Routes
import {
  BrokerRoutes,
  InsurerRoutes,
  ReinsurerRoutes,
  ReinsurerBrokerRoutes,
  MarketAdminRoutes,
  SuperAdminRoutes,
  CustomerRoutes,
} from '@/app/routes';

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <PWAWrapper>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<FlowSelection />} />
            <Route path="/call-center" element={<CallCenterPortal />} />

            {/* Login Routes */}
            <Route path="/call-center/login" element={<CallCenterLogin />} />
            <Route path="/broker/login" element={<BrokerLogin />} />
            <Route path="/insurer/login" element={<InsurerLogin />} />
            <Route path="/reinsurer/login" element={<ReinsurerLogin />} />
            <Route path="/reinsurer-broker/login" element={<ReinsurerBrokerLogin />} />
            <Route path="/admin/login" element={<MarketAdminLogin />} />
            <Route path="/super-admin/login" element={<SuperAdminLogin />} />

            {/* Domain Routes */}
            {BrokerRoutes}
            {MarketAdminRoutes}
            {CustomerRoutes}
            {InsurerRoutes}
            {ReinsurerRoutes}
            {ReinsurerBrokerRoutes}
            {SuperAdminRoutes}

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      {/* <PWATestButton /> */}
    </PWAWrapper>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <PWAUpdateProvider>
        <AppContent />
      </PWAUpdateProvider>
    </QueryClientProvider>
  );
};

export default App;
