import { Navigate, Route } from 'react-router-dom';

import RequireAuth from '@/components/layout/RequireAuth';
import { ReinsurerLayout } from '@/components/layout/reinsurer/ReinsurerLayout';
import { lazyRoute } from './lazyRoute';

const ReinsurerDashboard = lazyRoute(() => import('@/features/reinsurers/pages/ReinsurerDashboard'));
const ReinsurerRecordDetailsPage = lazyRoute(
    () => import('@/features/reinsurers/pages/ReinsurerRecordDetailsPage'),
);
const ReinsurerFacSlipDetails = lazyRoute(() => import('@/features/reinsurers/pages/ReinsurerFacSlipDetails'));
const ReinsurerBreakdownPage = lazyRoute(
  () => import('@/features/reinsurer-management/pages/ReinsurerBreakdownPage'),
);

export const ReinsurerRoutes = (
  <Route
    path="/reinsurer"
    element={
      <RequireAuth requiredRole="reinsurer">
        <ReinsurerLayout />
      </RequireAuth>
    }
  >
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<ReinsurerDashboard />} />
    <Route path="dashboard/:recordId" element={<ReinsurerRecordDetailsPage />} />
    <Route path="fac-slips/:recordId" element={<ReinsurerFacSlipDetails />} />
    <Route path="fac-slips/:recordId/reinsurer/:reinsurerId" element={<ReinsurerFacSlipDetails />} />
    <Route path="dashboard/full-breakdown/:policyId/:unitId" element={<ReinsurerBreakdownPage />} />
    <Route path="policies" element={<ReinsurerDashboard />} />
    <Route path="analytics" element={<ReinsurerDashboard />} />
  </Route>
);
