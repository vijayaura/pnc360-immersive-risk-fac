import { Navigate, Route } from 'react-router-dom';
import RequireAuth from '@/components/layout/RequireAuth';

import { BrokerLayout } from '@/components/layout/broker/BrokerLayout';
import { lazyRoute } from './lazyRoute';

const BrokerDashboard = lazyRoute(() => import('@/features/brokers/pages/BrokerDashboard'));
const BrokerUserManagement = lazyRoute(() => import('@/features/brokers/pages/BrokerUserManagement'));
const RoleUsersPage = lazyRoute(() => import('@/features/insurers/pages/RoleUsersPage'));
const InsurerEndorsements = lazyRoute(() => import('@/features/insurers/pages/InsurerEndorsements'));
const AddUser = lazyRoute(() => import('@/features/brokers/pages/AddUser'));
const EditUser = lazyRoute(() => import('@/features/brokers/pages/EditUser'));
const Proposal = lazyRoute(() => import('@/features/proposals/pages/Proposal'));
const QuoteDetailsV2 = lazyRoute(() => import('@/features/quotes/pages/QuoteDetailsV2'));
const BrokerReferralDetails = lazyRoute(() => import('@/features/referrals/pages/BrokerReferralDetails'));
const PolicyDetails = lazyRoute(() => import('@/features/quotes/pages/PolicyDetails'));
const ManageInsurers = lazyRoute(() => import('@/features/insurers/pages/ManageInsurers'));
const InsurerDetailDashboard = lazyRoute(() => import('@/features/insurers/pages/InsurerDetailDashboard'));
const ProductSelection = lazyRoute(() => import('@/features/proposals/pages/ProductSelection'));
const ProposalRouter = lazyRoute(() => import('@/features/proposals/pages/ProposalRouter'));
const CustomerProfilesList = lazyRoute(() => import('@/features/customer-profiles/pages/CustomerProfilesList'));
const CustomerProfileDetail = lazyRoute(() => import('@/features/customer-profiles/pages/CustomerProfileDetail'));
const PortalSupportPage = lazyRoute(() => import('@/features/portal-support/pages/PortalSupportPage'));

export const BrokerRoutes = (
    <>
        <Route path="/broker" element={
            <RequireAuth requiredRole="broker">
                <BrokerLayout />
            </RequireAuth>
        }>
            <Route index element={<BrokerDashboard />} />
            <Route path="dashboard" element={<BrokerDashboard />} />
            <Route path="customer-profiles" element={<CustomerProfilesList />} />
            <Route path="customer-profiles/:customerId" element={<CustomerProfileDetail />} />
            <Route path="user-management" element={<BrokerUserManagement />} />
            <Route path="user-management/role-users" element={<RoleUsersPage />} />
            <Route path="endorsements" element={<InsurerEndorsements />} />
            <Route path="endorsements/create" element={<InsurerEndorsements />} />
            <Route path="endorsements/:id" element={<InsurerEndorsements />} />
            <Route path="endorsements/edit/:id" element={<InsurerEndorsements />} />
            <Route path="endorsements/view/:id" element={<InsurerEndorsements />} />
            <Route path="add-user" element={<AddUser />} />
            <Route path="edit-user/:userId" element={<EditUser />} />
            <Route path="quote/:id/edit" element={<Proposal />} />
            <Route path="quote/:id" element={<QuoteDetailsV2 />} />
            <Route path="referral/:referralId" element={<BrokerReferralDetails />} />
            <Route path="policy/:id" element={<PolicyDetails />} />
            <Route path="endorsement/:id" element={<PolicyDetails />} />
        </Route>

        {/* Protected Non-Layout Routes */}
        <Route path="/broker/edit-user/:userId" element={
            <RequireAuth requiredRole="broker">
                <EditUser />
            </RequireAuth>
        } />
        <Route path="/broker/support" element={
            <RequireAuth requiredRole="broker">
                <PortalSupportPage />
            </RequireAuth>
        } />
        <Route path="/broker/faqs" element={
            <RequireAuth requiredRole="broker">
                <Navigate to="/broker/support" replace />
            </RequireAuth>
        } />
        <Route path="/broker/endorsements/proposal/:endorsementId" element={
            <RequireAuth requiredRole="broker">
                <ProposalRouter />
            </RequireAuth>
        } />
        <Route path="/broker/manage-insurers" element={
            <RequireAuth requiredRole="broker">
                <ManageInsurers />
            </RequireAuth>
        } />
        <Route path="/broker/insurer/:insurerId/dashboard" element={
            <RequireAuth requiredRole="broker">
                <InsurerDetailDashboard />
            </RequireAuth>
        } />
        <Route path="/broker/product-selection" element={
            <RequireAuth requiredRole="broker">
                <ProductSelection />
            </RequireAuth>
        } />
    </>
);
