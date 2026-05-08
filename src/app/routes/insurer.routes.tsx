import { Navigate, Route } from 'react-router-dom';

import { InsurerLayout } from '@/components/layout/insurer/InsurerLayout';
import RequireAuth from '@/components/layout/RequireAuth';

import { lazyRoute } from './lazyRoute';

const InsurerDashboard = lazyRoute(() => import('@/features/insurers/pages/InsurerDashboard'));
const InsurerUWRulesProductSelection = lazyRoute(
    () => import('@/features/insurers/pages/InsurerUWRulesProductSelection'),
);
const InsurerUWRulesDesign = lazyRoute(() => import('@/features/insurers/pages/InsurerUWRulesDesign'));
const InsurerCreateQuoteProductSelection = lazyRoute(
    () => import('@/features/quotes/pages/InsurerCreateQuoteProductSelection'),
);
const InsurerCreateQuoteDistributorSelection = lazyRoute(
    () => import('@/features/quotes/pages/InsurerCreateQuoteDistributorSelection'),
);
const InsurerUserManagement = lazyRoute(() => import('@/features/insurers/pages/InsurerUserManagement'));
const InsurerProductConfig = lazyRoute(() => import('@/features/product-config/pages/InsurerProductConfig'));
const InsurerEndorsements = lazyRoute(() => import('@/features/insurers/pages/InsurerEndorsements'));
const ILFIdentification = lazyRoute(() => import('@/features/quotes/pages/ILFIdentification'));
const InsurerCreateBrokerQuote = lazyRoute(() => import('@/features/quotes/pages/InsurerCreateBrokerQuote'));
const AnalyticsReporting = lazyRoute(() => import('@/features/analytics/pages/AnalyticsReporting'));
const ProductsList = lazyRoute(() => import('@/features/product-config/pages/ProductsList'));
const SingleProductConfig = lazyRoute(() => import('@/features/product-config/pages/SingleProductConfig'));
const BrokerConfigurator = lazyRoute(() => import('@/features/brokers/pages/BrokerConfigurator'));
const QuoteFormat = lazyRoute(() => import('@/features/quotes/pages/QuoteFormat'));
const AddInsurerUser = lazyRoute(() => import('@/features/insurers/pages/AddInsurerUser'));
const EditInsurerUser = lazyRoute(() => import('@/features/insurers/pages/EditInsurerUser'));
const RoleUsersPage = lazyRoute(() => import('@/features/insurers/pages/RoleUsersPage'));
const QuoteDetailsV2 = lazyRoute(() => import('@/features/quotes/pages/QuoteDetailsV2'));
const ReinsuranceHandlingPage = lazyRoute(() => import('@/features/referrals/pages/ReinsuranceHandlingPage'));
const InsurerCombinedReferralPage = lazyRoute(
    () => import('@/features/referrals/pages/InsurerCombinedReferralPage'),
);
const InsurerReferralFacReinsurerDetail = lazyRoute(
    () => import('@/features/referrals/pages/InsurerReferralFacReinsurerDetail'),
);
const PolicyDetails = lazyRoute(() => import('@/features/quotes/pages/PolicyDetails'));
const PIProductConfig = lazyRoute(() => import('@/features/product-config/pages/PIProductConfig'));
const CreatePlan = lazyRoute(() => import('@/features/product-config/pages/CreatePlan'));
const InsurerPricingConfig = lazyRoute(() => import('@/features/product-config/pages/InsurerPricingConfig'));
const InsurerCreateQuoteProposal = lazyRoute(
    () => import('@/features/quotes/pages/InsurerCreateQuoteProposal'),
);
const RatingConfigurator = lazyRoute(() => import('@/features/product-config/pages/RatingConfigurator'));
const PremiumRecalculation = lazyRoute(() => import('@/features/insurers/pages/PremiumRecalculation'));
const ProposalRouter = lazyRoute(() => import('@/features/proposals/pages/ProposalRouter'));
const PortalSupportPage = lazyRoute(() => import('@/features/portal-support/pages/PortalSupportPage'));
const ReinsurerManagementPage = lazyRoute(
    () => import('@/features/reinsurer-management/pages/ReinsurerManagementPage'),
);
const ReinsurerDetailsPage = lazyRoute(
    () => import('@/features/reinsurer-management/pages/ReinsurerDetailsPage'),
);
const ReinsurerBreakdownPage = lazyRoute(
    () => import('@/features/reinsurer-management/pages/ReinsurerBreakdownPage'),
);
const CustomerProfilesList = lazyRoute(() => import('@/features/customer-profiles/pages/CustomerProfilesList'));
const CustomerProfileDetail = lazyRoute(
    () => import('@/features/customer-profiles/pages/CustomerProfileDetail'),
);
const CommandCenter = lazyRoute(() => import('@/features/command-center/pages/CommandCenter'));
const InsurerFacInRequestDetails = lazyRoute(() => import('@/features/insurers/pages/InsurerFacInRequestDetails'));
const InsurerFacInCasesPage = lazyRoute(() => import('@/features/insurers/pages/InsurerFacInCasesPage'));

export const InsurerRoutes = (
    <>
        <Route path="/insurer" element={
            <RequireAuth requiredRole="insurer">
                <InsurerLayout />
            </RequireAuth>
        }>
            <Route path="reinsurer-management/full-breakdown/:policyId/:unitId" element={<ReinsurerBreakdownPage />} />
            <Route index element={<InsurerDashboard />} />
            <Route path="dashboard" element={<InsurerDashboard />} />
            <Route path="fac-in-cases" element={<InsurerFacInCasesPage />} />
            <Route path="fac-in-cases/:recordId" element={<InsurerFacInRequestDetails />} />
            <Route path="fac-in-cases/:recordId/reinsurer/:reinsurerId" element={<InsurerFacInRequestDetails />} />
            <Route path="uw-rules-design" element={<InsurerUWRulesProductSelection />} />
            <Route path="uw-rules-design/edit" element={<InsurerUWRulesDesign />} />
            <Route path="create-quote" element={<InsurerCreateQuoteProductSelection />} />
            <Route
                path="create-quote/distributor"
                element={<InsurerCreateQuoteDistributorSelection />}
            />
            <Route path="user-management" element={<InsurerUserManagement />} />
            <Route path="user-management/role-users" element={<RoleUsersPage />} />
            <Route path="product-config" element={<InsurerProductConfig />} />
            <Route path="broker-assignments" element={<div />} />
            <Route path="endorsements" element={<InsurerEndorsements />} />
            <Route path="endorsements/create" element={<InsurerEndorsements />} />
            <Route path="endorsements/:id" element={<InsurerEndorsements />} />
            <Route path="endorsements/edit/:id" element={<InsurerEndorsements />} />
            <Route path="endorsements/view/:id" element={<InsurerEndorsements />} />
            <Route path="ilf-identification" element={<ILFIdentification />} />
            <Route path="create-broker-quote" element={<InsurerCreateBrokerQuote />} />
            <Route path="analytics" element={<AnalyticsReporting />} />
            <Route path="product-config/products" element={<ProductsList />} />
            <Route path="product-config/products/:productId" element={<SingleProductConfig />} />
            <Route path="product-config/broker-configurator" element={<BrokerConfigurator />} />
            <Route path="product-config/quote-format" element={<QuoteFormat />} />
            <Route path="add-user" element={<AddInsurerUser />} />
            <Route path="edit-user/:userId" element={<EditInsurerUser />} />
            <Route path="quote/:id" element={<QuoteDetailsV2 />} />
            <Route path="referral/:referralId" element={<InsurerCombinedReferralPage />} />
            <Route
                path="referral/:referralId/reinsurance/fac/:recordId/reinsurer/:reinsurerId"
                element={<InsurerReferralFacReinsurerDetail />}
            />
            <Route path="referral/:referralId/reinsurance" element={<ReinsuranceHandlingPage />} />
            <Route path="policy/:id" element={<PolicyDetails />} />
            <Route path="endorsement/:id" element={<PolicyDetails />} />
            <Route path="endorsements/premium-recalculation" element={<PremiumRecalculation />} />
            <Route path="reinsurer-management" element={<ReinsurerManagementPage />} />
            <Route path="reinsurer-management/:policyId" element={<ReinsurerDetailsPage />} />
            <Route path="customer-profiles" element={<CustomerProfilesList />} />
            <Route path="customer-profiles/:customerId" element={<CustomerProfileDetail />} />
        </Route>

        {/* Protected Non-Layout Routes */}
        <Route path="/insurer/products" element={
            <RequireAuth requiredRole="insurer">
                <ProductsList />
            </RequireAuth>
        } />
        <Route path="/insurer/support" element={
            <RequireAuth requiredRole="insurer">
                <PortalSupportPage />
            </RequireAuth>
        } />
        <Route path="/insurer/faqs" element={
            <RequireAuth requiredRole="insurer">
                <Navigate to="/insurer/support" replace />
            </RequireAuth>
        } />
        {/* Insurer Endorsement Proposal - Full page without sidebar */}
        <Route path="/insurer/endorsements/proposal/:endorsementId" element={
            <RequireAuth requiredRole="insurer">
                <ProposalRouter />
            </RequireAuth>
        } />
        <Route path="/insurer/products/:productId" element={
            <RequireAuth requiredRole="insurer">
                <SingleProductConfig />
            </RequireAuth>
        } />
        <Route path="/insurer/products/2" element={
            <RequireAuth requiredRole="insurer">
                <PIProductConfig />
            </RequireAuth>
        } />
        <Route path="/insurer/product-config/new" element={
            <RequireAuth requiredRole="insurer">
                <CreatePlan />
            </RequireAuth>
        } />
        <Route path="/insurer/:insurerId/product-config" element={
            <RequireAuth requiredRole="insurer">
                <InsurerProductConfig />
            </RequireAuth>
        } />
        <Route path="/insurer/:insurerId/pricing-config" element={
            <RequireAuth requiredRole="insurer">
                <InsurerPricingConfig />
            </RequireAuth>
        } />

        {/* Insurer Create Quote - Full Page Proposal Form (outside layout, no sidebar) */}
        <Route path="/insurer/create-quote/proposal" element={
            <RequireAuth requiredRole="insurer">
                <InsurerCreateQuoteProposal />
            </RequireAuth>
        } />

        <Route
            path="/insurer/rating-configurator"
            element={
                <RequireAuth requiredRole="insurer">
                    <RatingConfigurator />
                </RequireAuth>
            }
        />
        <Route
            path="/insurer/command-center"
            element={
                <RequireAuth requiredRole="insurer">
                    <CommandCenter />
                </RequireAuth>
            }
        />
    </>
);
