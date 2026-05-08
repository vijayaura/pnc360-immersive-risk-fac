import { Navigate, Route } from 'react-router-dom';
import RequireAuth from '@/components/layout/RequireAuth';
import { MarketAdminLayout } from '@/components/layout/market-admin/MarketAdminLayout';
import RequirePermission from '@/components/layout/RequirePermission';

import { lazyRoute } from './lazyRoute';

const ProductMastersManagement = lazyRoute(() => import('@/features/product-config/pages/ProductMastersManagement'));
const MarketAdminDashboard = lazyRoute(() => import('@/features/market-admin/pages/MarketAdminDashboard'));
const AnalyticsReporting = lazyRoute(() => import('@/features/analytics/pages/AnalyticsReporting'));
const InsurerUserManagement = lazyRoute(() => import('@/features/insurers/pages/InsurerUserManagement'));
const AddInsurerUser = lazyRoute(() => import('@/features/insurers/pages/AddInsurerUser'));
const EditInsurerUser = lazyRoute(() => import('@/features/insurers/pages/EditInsurerUser'));
const RoleUsersPage = lazyRoute(() => import('@/features/insurers/pages/RoleUsersPage'));
const MarketAdminProductManagement = lazyRoute(
  () => import('@/features/product-config/pages/MarketAdminProductManagement'),
);
const CustomerTemplateManagement = lazyRoute(
  () => import('@/features/product-config/pages/CustomerTemplateManagement'),
);
const AuthorityMatrix = lazyRoute(
  () => import('@/features/product-config/rating-configurator/pages/AuthorityMatrix'),
);
const MastersProductSelection = lazyRoute(
  () => import('@/features/product-config/pages/MastersProductSelection'),
);
const CARMastersManagement = lazyRoute(() => import('@/features/product-config/pages/CARMastersManagement'));
const PIMastersManagement = lazyRoute(() => import('@/features/product-config/pages/PIMastersManagement'));
const MarketAdminBrokerManagement = lazyRoute(
  () => import('@/features/market-admin/pages/MarketAdminBrokerManagement'),
);
const ReinsuranceManagementPage = lazyRoute(
  () => import('@/features/market-admin/pages/ReinsuranceManagementPage'),
  'ReinsuranceManagementPage',
);
const CreateReinsurer = lazyRoute(() => import('@/features/market-admin/pages/CreateReinsurer'));
const EditReinsurer = lazyRoute(() => import('@/features/market-admin/pages/EditReinsurer'));
const CreateReinsuranceBroker = lazyRoute(() => import('@/features/market-admin/pages/CreateReinsuranceBroker'));
const EditReinsuranceBroker = lazyRoute(() => import('@/features/market-admin/pages/EditReinsuranceBroker'));
const BrokerDetailsView = lazyRoute(() => import('@/features/brokers/pages/BrokerDetailsView'));
const BrokerConfiguration = lazyRoute(() => import('@/features/brokers/pages/BrokerConfiguration'));
const MarketAdminInsurerManagement = lazyRoute(
  () => import('@/features/market-admin/pages/MarketAdminInsurerManagement'),
);
const InsurerDetailDashboard = lazyRoute(() => import('@/features/insurers/pages/InsurerDetailDashboard'));
const CreateInsurer = lazyRoute(() => import('@/features/insurers/pages/CreateInsurer'));
const EditInsurer = lazyRoute(() => import('@/features/insurers/pages/EditInsurer'));
const MarketAdminAuditLogs = lazyRoute(() => import('@/features/market-admin/pages/MarketAdminAuditLogs'));
const CreateBroker = lazyRoute(() => import('@/features/market-admin/pages/CreateBroker'));
const EditBroker = lazyRoute(() => import('@/features/market-admin/pages/EditBroker'));
const PolicyDetails = lazyRoute(() => import('@/features/quotes/pages/PolicyDetails'));
const QuoteDetailsV2 = lazyRoute(() => import('@/features/quotes/pages/QuoteDetailsV2'));
const ReinsuranceHandlingPage = lazyRoute(() => import('@/features/referrals/pages/ReinsuranceHandlingPage'));
const InsurerProductConfig = lazyRoute(() => import('@/features/product-config/pages/InsurerProductConfig'));
const MarketAdminBrokerConfigurator = lazyRoute(
  () => import('@/features/market-admin/pages/MarketAdminBrokerConfigurator'),
);
const MarketAdminQuoteFormat = lazyRoute(() => import('@/features/quotes/pages/MarketAdminQuoteFormat'));
const MarketAdminProductsList = lazyRoute(
  () => import('@/features/product-config/pages/MarketAdminProductsList'),
);
const InsurerPricingConfig = lazyRoute(() => import('@/features/product-config/pages/InsurerPricingConfig'));
const ProductConfig = lazyRoute(() => import('@/features/product-config/pages/ProductConfig'));
const WorkflowManagement = lazyRoute(() => import('@/features/product-config/pages/WorkflowManagement'));
const PremiumAdditives = lazyRoute(() => import('@/features/product-config/pages/PremiumAdditives'));
const CreateProduct = lazyRoute(() => import('@/features/product-config/pages/CreateProduct'));
const ReinsuranceSetup = lazyRoute(() => import('@/features/product-config/pages/ReinsuranceSetup'));
const ProposalFormDesign = lazyRoute(() => import('@/features/product-config/pages/ProposalFormDesign'));
const AdministrationFormDesign = lazyRoute(
  () => import('@/features/product-config/pages/AdministrationFormDesign'),
);
const RatingConfigurator = lazyRoute(() => import('@/features/product-config/pages/RatingConfigurator'));
const DocumentConfigurator = lazyRoute(() => import('@/features/product-config/pages/DocumentConfigurator'));
const KPIDesign = lazyRoute(() => import('@/features/product-config/pages/KPIDesign'));
const DistributionChannelManagement = lazyRoute(
  () => import('@/features/product-config/pages/DistributionChannelManagement'),
);
const RateManagement = lazyRoute(() => import('@/features/product-config/pages/RateManagement'));
const MarketabilityManagement = lazyRoute(
  () => import('@/features/market-admin/pages/MarketabilityManagement'),
);
const B2CHandling = lazyRoute(() => import('@/features/product-config/pages/B2CHandling'));
const NotificationsManagement = lazyRoute(
  () => import('@/features/market-admin/pages/NotificationsManagement'),
);
const PIProductConfig = lazyRoute(() => import('@/features/product-config/pages/PIProductConfig'));
const CoverReinsuranceSetup = lazyRoute(() => import('@/features/product-config/pages/CoverReinsuranceSetup'));
const InsurerReferralDetails = lazyRoute<{ hideStatusDropdown?: boolean }>(
  () => import('@/features/referrals/pages/InsurerReferralDetails'),
);
const PortalSupportPage = lazyRoute(() => import('@/features/portal-support/pages/PortalSupportPage'));
const RiskCategorisationManagement = lazyRoute(
  () => import('@/features/market-admin/risk-categorisation/pages/RiskCategorisationManagement'),
  'RiskCategorisationManagement',
);
const RiskCategoryDetailPage = lazyRoute(
  () => import('@/features/market-admin/risk-categorisation/pages/RiskCategoryDetailPage'),
  'RiskCategoryDetailPage',
);
const MarketAdminFacAiStudioList = lazyRoute(
  () => import('@/features/market-admin/pages/MarketAdminFacAiStudioList'),
);
const MarketAdminFacAiStudioWizard = lazyRoute(
  () => import('@/features/market-admin/pages/MarketAdminFacAiStudioWizard'),
);
const ReinsuranceDashboardPage = lazyRoute(
  () => import('@/features/reinsurer-management/pages/ReinsuranceDashboardPage'),
);
const ReinsurerDetailsPage = lazyRoute(
  () => import('@/features/reinsurer-management/pages/ReinsurerDetailsPage'),
);
const ReinsurerBreakdownPage = lazyRoute(
  () => import('@/features/reinsurer-management/pages/ReinsurerBreakdownPage'),
);

export const MarketAdminRoutes = (
  <>
    {/* Product Masters Management - Outside layout when accessed from product configuration (must be before MarketAdminLayout routes) */}
    <Route
      path="/market-admin/product-management/masters-management"
      element={
        <RequireAuth requiredRole="market_admin">
          <ProductMastersManagement />
        </RequireAuth>
      }
    />

    {/* Market Admin Routes - Protected */}
    <Route
      path="/market-admin"
      element={
        <RequireAuth requiredRole="admin">
          <MarketAdminLayout />
        </RequireAuth>
      }
    >
      <Route path="dashboard" element={<MarketAdminDashboard />} />
      <Route path="analytics" element={<AnalyticsReporting />} />
      <Route path="audit-logs" element={<MarketAdminAuditLogs />} />
      <Route path="user-management" element={<InsurerUserManagement />} />
      <Route path="user-management/role-users" element={<RoleUsersPage />} />
      <Route path="add-user" element={<AddInsurerUser />} />
      <Route path="edit-user/:userId" element={<EditInsurerUser />} />
      <Route
        path="product-management"
        element={
          <RequirePermission permissionId="apiIntegrations">
            <MarketAdminProductManagement />
          </RequirePermission>
        }
      />
      <Route
        path="customer-template-management"
        element={
          <RequirePermission permissionId="apiIntegrations">
            <CustomerTemplateManagement />
          </RequirePermission>
        }
      />
      <Route
        path="fac-ai-studio"
        element={
          <RequirePermission permissionId="apiIntegrations">
            <MarketAdminFacAiStudioList />
          </RequirePermission>
        }
      />
      <Route
        path="fac-ai-studio/new"
        element={
          <RequirePermission permissionId="apiIntegrations">
            <MarketAdminFacAiStudioWizard />
          </RequirePermission>
        }
      />
      <Route
        path="fac-ai-studio/product/:productId"
        element={
          <RequirePermission permissionId="apiIntegrations">
            <MarketAdminFacAiStudioWizard />
          </RequirePermission>
        }
      />
      <Route
        path="product-management/authority-matrix"
        element={
          <RequirePermission permissionId="apiIntegrations">
            <AuthorityMatrix />
          </RequirePermission>
        }
      />
      <Route
        path="masters-management"
        element={
          <RequirePermission permissionId="mastersManagement">
            <MastersProductSelection />
          </RequirePermission>
        }
      />
      <Route
        path="masters-management/product/:productId"
        element={
          <RequirePermission permissionId="mastersManagement">
            <ProductMastersManagement />
          </RequirePermission>
        }
      />
      <Route path="masters-management/car" element={<CARMastersManagement />} />
      <Route path="masters-management/pi" element={<PIMastersManagement />} />
      <Route path="broker-management" element={<MarketAdminBrokerManagement />} />
      <Route path="broker/:brokerId/details" element={<BrokerDetailsView />} />
      <Route path="broker/:brokerId/configure" element={<BrokerConfiguration />} />
      <Route path="insurer-management" element={<MarketAdminInsurerManagement />} />
      <Route path="insurers" element={<MarketAdminInsurerManagement />} />
      <Route path="insurers/:insurerId" element={<InsurerDetailDashboard />} />
      <Route path="insurer-management/create" element={<CreateInsurer />} />
      <Route path="insurer/:insurerId/edit" element={<EditInsurer />} />
      <Route path="broker-management/create" element={<CreateBroker />} />
      <Route path="broker/:brokerId/edit" element={<EditBroker />} />
      <Route path="reinsurance-management" element={<ReinsuranceManagementPage />} />
      <Route path="reinsurance-dashboard" element={<ReinsuranceDashboardPage />} />
      <Route path="reinsurer-management/:policyId" element={<ReinsurerDetailsPage />} />
      <Route path="reinsurer-management/full-breakdown/:policyId/:unitId" element={<ReinsurerBreakdownPage />} />
      <Route path="create-reinsurer" element={<CreateReinsurer />} />
      <Route path="reinsurer/:reinsurerMapId/edit" element={<EditReinsurer />} />
      <Route path="create-reinsurance-broker" element={<CreateReinsuranceBroker />} />
      <Route path="reinsurance-broker/:id/edit" element={<EditReinsuranceBroker />} />

      <Route path="insurer/:insurerId/dashboard" element={<InsurerDetailDashboard />} />
      <Route path="insurer/:insurerId/policy/:id" element={<PolicyDetails />} />
      <Route path="broker/:brokerId/policy/:id" element={<PolicyDetails />} />
      <Route path="quote/:id" element={<QuoteDetailsV2 />} />
      <Route path="referral/:referralId" element={<InsurerReferralDetails hideStatusDropdown />} />
      <Route path="referral/:referralId/reinsurance" element={<ReinsuranceHandlingPage />} />
      <Route path="policy/:id" element={<PolicyDetails />} />
      <Route path="endorsement/:id" element={<PolicyDetails />} />
      <Route path="insurer/:insurerId/product-config" element={<InsurerProductConfig />} />
      <Route
        path="insurer/:insurerId/product-config/broker-configurator"
        element={<MarketAdminBrokerConfigurator />}
      />
      <Route
        path="insurer/:insurerId/product-config/quote-format"
        element={<MarketAdminQuoteFormat />}
      />
      <Route
        path="insurer/:insurerId/product-config/products"
        element={<MarketAdminProductsList />}
      />
      <Route path="insurer/:insurerId/pricing-config" element={<InsurerPricingConfig />} />
      <Route path="product-config" element={<ProductConfig />} />
      <Route path="risk-categorisation" element={<RiskCategorisationManagement />} />
      <Route
        path="risk-categorisation/:rcId/category/:categoryId"
        element={<RiskCategoryDetailPage />}
      />
    </Route>

    {/* Routes without sidebar */}
    <Route
      path="/market-admin/support"
      element={
        <RequireAuth requiredRole="market_admin">
          <PortalSupportPage />
        </RequireAuth>
      }
    />
    <Route
      path="/market-admin/faqs"
      element={
        <RequireAuth requiredRole="market_admin">
          <Navigate to="/market-admin/support" replace />
        </RequireAuth>
      }
    />
    <Route
      path="/market-admin/product-management/workflow-management"
      element={<WorkflowManagement />}
    />
    <Route
      path="/market-admin/product-management/premium-additives"
      element={<PremiumAdditives />}
    />
    <Route
      path="/market-admin/product-management/create"
      element={
        <RequirePermission permissionId="apiIntegrations">
          <CreateProduct />
        </RequirePermission>
      }
    />
    <Route
      path="/market-admin/product-management/reinsurance-setup"
      element={
        <RequirePermission permissionId="apiIntegrations">
          <ReinsuranceSetup />
        </RequirePermission>
      }
    />
    <Route
      path="/market-admin/product-management/cover-reinsurance-setup"
      element={
        <RequirePermission permissionId="apiIntegrations">
          <CoverReinsuranceSetup />
        </RequirePermission>
      }
    />

    <Route
      path="/market-admin/product-management/proposal-form-design"
      element={
        <RequirePermission permissionId="apiIntegrations">
          <ProposalFormDesign />
        </RequirePermission>
      }
    />
    <Route
      path="/market-admin/customer-template-management/proposal-form-design"
      element={
        <RequirePermission permissionId="apiIntegrations">
          <ProposalFormDesign />
        </RequirePermission>
      }
    />
    <Route
      path="/market-admin/product-management/administration-form-design"
      element={
        <RequirePermission permissionId="apiIntegrations">
          <AdministrationFormDesign />
        </RequirePermission>
      }
    />
    <Route
      path="/market-admin/product-management/rating-configurator/:productId"
      element={
        <RequirePermission permissionId="apiIntegrations">
          <RatingConfigurator />
        </RequirePermission>
      }
    />
    <Route
      path="/market-admin/product-management/rating-configurator"
      element={
        <RequirePermission permissionId="apiIntegrations">
          <RatingConfigurator />
        </RequirePermission>
      }
    />
    <Route
      path="/market-admin/product-management/document-configurator"
      element={
        <RequirePermission permissionId="apiIntegrations">
          <DocumentConfigurator />
        </RequirePermission>
      }
    />
    <Route
      path="/market-admin/product-management/kpi-design"
      element={
        <RequirePermission permissionId="apiIntegrations">
          <KPIDesign />
        </RequirePermission>
      }
    />
    <Route
      path="/market-admin/product-management/distribution-channel"
      element={<DistributionChannelManagement />}
    />
    <Route path="/market-admin/product-management/rate-management" element={<RateManagement />} />
    <Route
      path="/market-admin/product-management/marketability"
      element={<MarketabilityManagement />}
    />
    <Route path="/market-admin/product-management/b2c-handling" element={<B2CHandling />} />
    <Route
      path="/market-admin/product-management/notifications"
      element={<NotificationsManagement />}
    />
    <Route path="/market-admin/insurer/:insurerId/products/2" element={<PIProductConfig />} />
  </>
);
