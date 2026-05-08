import { Navigate, Route } from 'react-router-dom';
import RequireAuth from '@/components/layout/RequireAuth';
import { ReinsurerBrokerLayout } from '@/components/layout/reinsurer-broker/ReinsurerBrokerLayout';
import { lazyRoute } from './lazyRoute';

const ReinsurerBrokerDashboard = lazyRoute(() => import('@/features/reinsurer-brokers/pages/ReinsurerBrokerDashboard'));
const ReinsurerBrokerProductSelection = lazyRoute(() => import('@/features/reinsurer-brokers/pages/ReinsurerBrokerProductSelection'));
const ReinsurerBrokerFacultativeRequest = lazyRoute(() => import('@/features/reinsurer-brokers/pages/ReinsurerBrokerFacultativeRequest'));
const ReinsurerBrokerRequestDetails = lazyRoute(() => import('@/features/reinsurer-brokers/pages/ReinsurerBrokerRequestDetails'));

export const ReinsurerBrokerRoutes = (
  <Route
    path="/reinsurer-broker"
    element={
      <RequireAuth requiredRole="reinsurer_broker">
        <ReinsurerBrokerLayout />
      </RequireAuth>
    }
  >
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<ReinsurerBrokerDashboard />} />
    <Route path="referral/:recordId" element={<ReinsurerBrokerRequestDetails />} />
    <Route path="referral/:recordId/reinsurer/:reinsurerId" element={<ReinsurerBrokerRequestDetails />} />
    <Route path="facultative-request" element={<ReinsurerBrokerProductSelection />} />
    <Route path="facultative-request/:productId" element={<ReinsurerBrokerFacultativeRequest />} />
    <Route path="policies" element={<ReinsurerBrokerDashboard />} />
  </Route>
);
