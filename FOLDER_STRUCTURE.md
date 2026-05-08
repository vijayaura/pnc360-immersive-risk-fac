# P&C 360 - Current Folder Structure

## Project Overview
Insurance Marketplace Platform with 4 Role-Based Access:
1. **Super Admin** - Environment & Market Admin Management
2. **Market Admin** - Insurer/Broker/Product Management & Form Design
3. **Insurer** - Insurance Provider (Rating Configuration)
4. **Broker** - Insurance Agent (Proposal Form Filling)

---

## 📁 Complete Folder Structure

```
AuraMarketPlace/
├── src/
│   ├── App.tsx                          # Main routing configuration
│   ├── main.tsx                          # Application entry point
│   ├── index.css                         # Global styles
│   │
│   ├── assets/                          # Static assets
│   │   ├── backgrounds/
│   │   │   └── cityscape-bg.jpg
│   │   ├── aura-logo.png
│   │   ├── broker-logo.png
│   │   ├── hero-construction.jpg
│   │   ├── illustration.svg
│   │   ├── insurer-logo.png
│   │   ├── logo.png
│   │   └── quotes-comparison.jpg
│   │
│   ├── components/                      # Reusable UI Components
│   │   ├── layout/                      # Layout Components
│   │   │   ├── BrokerLayout.tsx         # Broker portal layout
│   │   │   ├── InsurerLayout.tsx        # Insurer portal layout
│   │   │   ├── MarketAdminLayout.tsx    # Market Admin portal layout
│   │   │   ├── Header.tsx               # Common header
│   │   │   ├── Footer.tsx               # Common footer
│   │   │   ├── Hero.tsx                 # Hero section
│   │   │   └── RequireAuth.tsx          # Auth guard component
│   │   │
│   │   ├── shared/                      # Shared Business Components
│   │   │   ├── LocationSearch.tsx
│   │   │   ├── LocationSearchModal.tsx
│   │   │   ├── OpenStreetMapDialog.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   └── TableSearchFilter.tsx
│   │   │
│   │   ├── loaders/                     # Loading Skeletons
│   │   │   ├── DocumentSkeleton.tsx
│   │   │   ├── FormSkeleton.tsx
│   │   │   └── TableSkeleton.tsx
│   │   │
│   │   └── ui/                          # Design System Components (shadcn/ui)
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       └── ... (50+ UI components)
│   │
│   ├── features/                        # Feature-Based Organization
│   │   │
│   │   ├── brokers/                    # BROKER Feature
│   │   │   ├── pages/
│   │   │   │   ├── BrokerLogin.tsx
│   │   │   │   ├── BrokerDashboard.tsx
│   │   │   │   ├── BrokerAdminDashboard.tsx
│   │   │   │   ├── BrokerUserManagement.tsx
│   │   │   │   ├── AddUser.tsx
│   │   │   │   ├── EditUser.tsx
│   │   │   │   ├── BrokerDetailsView.tsx
│   │   │   │   ├── BrokerConfiguration.tsx
│   │   │   │   └── BrokerConfigurator.tsx
│   │   │   └── components/             # Broker-specific components
│   │   │
│   │   ├── insurers/                   # INSURER Feature
│   │   │   ├── pages/
│   │   │   │   ├── InsurerLogin.tsx
│   │   │   │   ├── InsurerDashboard.tsx
│   │   │   │   ├── InsurerDetailDashboard.tsx
│   │   │   │   ├── InsurerUserManagement.tsx
│   │   │   │   ├── AddInsurerUser.tsx
│   │   │   │   ├── EditInsurerUser.tsx
│   │   │   │   ├── InsurerEndorsements.tsx
│   │   │   │   ├── InsurerBrokerAssignments.tsx
│   │   │   │   ├── ManageInsurers.tsx
│   │   │   │   ├── CreateInsurer.tsx
│   │   │   │   └── EditInsurer.tsx
│   │   │   └── components/
│   │   │       ├── InsurerForm.tsx
│   │   │       └── CreateInsurerDialog.tsx
│   │   │
│   │   ├── market-admin/               # MARKET ADMIN Feature
│   │   │   ├── pages/
│   │   │   │   ├── MarketAdminLogin.tsx
│   │   │   │   ├── MarketAdminDashboard.tsx
│   │   │   │   ├── MarketAdminBrokerManagement.tsx
│   │   │   │   ├── MarketAdminInsurerManagement.tsx
│   │   │   │   ├── MarketAdminBrokerConfigurator.tsx
│   │   │   │   ├── CreateBroker.tsx
│   │   │   │   ├── EditBroker.tsx
│   │   │   │   └── RiskAccumulationDashboard.tsx
│   │   │   └── components/
│   │   │
│   │   ├── product-config/             # PRODUCT CONFIGURATION Feature
│   │   │   ├── pages/                  # Product Config Pages
│   │   │   │   ├── ProductConfig.tsx
│   │   │   │   ├── SingleProductConfig.tsx
│   │   │   │   ├── ProductsList.tsx
│   │   │   │   ├── InsurerProductConfig.tsx
│   │   │   │   ├── MarketAdminSingleProductConfig.tsx
│   │   │   │   ├── MarketAdminProductsList.tsx
│   │   │   │   ├── CreatePlan.tsx
│   │   │   │   ├── PIProductConfig.tsx
│   │   │   │   ├── InsurerPricingConfig.tsx
│   │   │   │   │
│   │   │   │   # Market Admin Product Management
│   │   │   │   ├── MarketAdminProductManagement.tsx
│   │   │   │   ├── CreateProduct.tsx
│   │   │   │   ├── AuthorityMatrix.tsx
│   │   │   │   ├── ReinsuranceSetup.tsx
│   │   │   │   ├── RatingConfigurator.tsx
│   │   │   │   ├── DocumentConfigurator.tsx
│   │   │   │   ├── KPIDesign.tsx
│   │   │   │   ├── UWRulesDesign.tsx
│   │   │   │   ├── IntegrationsConfigurator.tsx
│   │   │   │   │
│   │   │   │   # Form Design (Market Admin)
│   │   │   │   ├── ProposalFormDesign.tsx
│   │   │   │   ├── AdministrationFormDesign.tsx
│   │   │   │   │
│   │   │   │   # Masters Management
│   │   │   │   ├── MastersProductSelection.tsx
│   │   │   │   ├── CARMastersManagement.tsx
│   │   │   │   ├── PIMastersManagement.tsx
│   │   │   │   └── MastersManagement.tsx
│   │   │   │
│   │   │   ├── components/             # Product Config Components
│   │   │   │   ├── BaseRates.tsx
│   │   │   │   ├── CEWsConfiguration.tsx
│   │   │   │   ├── ClausePricingCard.tsx
│   │   │   │   ├── ContractorRiskFactors.tsx
│   │   │   │   ├── CoverageOptionsExtensions.tsx
│   │   │   │   ├── FeeTypes.tsx
│   │   │   │   ├── MasterDataTabs.tsx
│   │   │   │   ├── MinimumPremium.tsx
│   │   │   │   ├── PolicyLimitsDeductibles.tsx
│   │   │   │   ├── PricingConfigurator.tsx
│   │   │   │   ├── ProjectRiskFactors.tsx
│   │   │   │   ├── QuoteConfigurator.tsx
│   │   │   │   ├── QuoteFormat.tsx
│   │   │   │   ├── RequiredDocuments.tsx
│   │   │   │   ├── WordingConfigurations.tsx
│   │   │   │   └── pricing/
│   │   │   │       ├── ProjectTypeBaseRates.tsx
│   │   │   │       ├── ProjectTypeCard.tsx
│   │   │   │       └── SubProjectBaseRates.tsx
│   │   │   │
│   │   │   ├── api/                    # Product Config API functions
│   │   │   ├── hooks/                  # Product Config hooks
│   │   │   └── types.ts                # Product Config types
│   │   │
│   │   ├── quotes/                     # QUOTES Feature
│   │   │   ├── pages/
│   │   │   │   ├── Quotes.tsx
│   │   │   │   ├── QuoteDetails.tsx
│   │   │   │   ├── MarketAdminQuoteDetails.tsx
│   │   │   │   ├── MarketAdminBrokerQuoteDetails.tsx
│   │   │   │   ├── MarketAdminInsurerQuoteDetails.tsx
│   │   │   │   ├── QuoteFormat.tsx
│   │   │   │   ├── MarketAdminQuoteFormat.tsx
│   │   │   │   ├── PolicyDetails.tsx
│   │   │   │   └── CEWCustomization.tsx
│   │   │   ├── components/
│   │   │   │   ├── QuotesComparison.tsx
│   │   │   │   ├── QuoteStatusDot.tsx
│   │   │   │   └── CEWSelection.tsx
│   │   │   ├── api/                    # Quotes API functions
│   │   │   └── hooks/                  # Quotes hooks
│   │   │
│   │   └── proposals/                  # PROPOSALS Feature
│   │       ├── pages/
│   │       │   ├── Proposal.tsx        # CAR Proposal
│   │       │   ├── PIProposal.tsx       # PI Proposal
│   │       │   ├── ProposalRouter.tsx   # Routes to product-specific proposals
│   │       │   ├── ProductSelection.tsx
│   │       │   ├── Documents.tsx
│   │       │   ├── Payment.tsx
│   │       │   ├── Success.tsx
│   │       │   └── PISuccess.tsx
│   │       └── components/
│   │           ├── ProposalForm.tsx     # Main CAR proposal form
│   │           ├── PIProposalForm.tsx   # PI proposal form
│   │           ├── DeclarationTab.tsx
│   │           ├── DocumentUpload.tsx
│   │           ├── PaymentSection.tsx
│   │           ├── PolicyDelivery.tsx
│   │           ├── ProgressTracker.tsx
│   │           └── WorkflowSteps.tsx
│   │
│   ├── pages/                          # Root-Level Pages
│   │   ├── FlowSelection.tsx            # Role selection (entry point)
│   │   └── NotFound.tsx                # 404 page
│   │
│   ├── lib/                            # Core Libraries
│   │   ├── api/                        # API Client & Endpoints
│   │   │   ├── client.ts               # Axios client configuration
│   │   │   ├── auth.ts                 # Authentication API
│   │   │   ├── admin.ts                # Admin API
│   │   │   ├── brokers.ts              # Broker API
│   │   │   ├── insurers.ts             # Insurer API
│   │   │   ├── quotes.ts               # Quotes API
│   │   │   ├── products.ts             # Products API
│   │   │   ├── plans.ts                # Plans API
│   │   │   ├── users.ts                # Users API
│   │   │   ├── masters.ts              # Masters data API
│   │   │   ├── proposalFormDesign.ts   # Form design API
│   │   │   ├── authorityMatrix.ts      # Authority matrix API
│   │   │   ├── integrations.ts         # Integrations API
│   │   │   ├── water-body.ts           # Water body API
│   │   │   └── index.ts                # API exports
│   │   │
│   │   ├── auth.ts                     # Auth utilities (legacy support)
│   │   ├── location-data.ts            # Location data helpers
│   │   ├── masters-data.ts             # Masters data helpers
│   │   ├── quote-status.ts             # Quote status utilities
│   │   ├── types.ts                    # Shared types
│   │   └── utils.ts                    # Utility functions
│   │
│   ├── hooks/                          # Custom React Hooks
│   │   ├── use-mobile.tsx
│   │   ├── use-navigation-history.tsx
│   │   ├── use-toast.ts
│   │   ├── use-unsaved-changes.tsx
│   │   ├── useApiDataMapping.tsx
│   │   ├── useConfirmDialog.tsx
│   │   └── useTableSearch.tsx
│   │
│   ├── stores/                         # State Management
│   │   └── useAuthStore.ts             # Zustand auth store
│   │
│   └── utils/                          # Utility Functions
│       ├── date-format.ts
│       ├── downloadHelper.ts
│       ├── numberFormat.ts
│       ├── pdfGenerator.ts
│       └── quote-resume.ts
│
├── public/                             # Public assets
│   ├── _redirects
│   ├── favicon.ico
│   ├── robots.txt
│   └── lovable-uploads/
│
├── package.json                        # Dependencies
├── tsconfig.json                       # TypeScript config
├── vite.config.ts                      # Vite config
└── tailwind.config.ts                  # Tailwind CSS config
```

---

## 🎯 Role-Based Feature Mapping

### 1. **Super Admin** (Future Implementation)
- Environment management
- Market Admin creation
- Base form configurations
- **Location**: `src/features/super-admin/` (to be created)

### 2. **Market Admin**
- **Pages**: `src/features/market-admin/pages/`
  - Insurer/Broker management
  - Product management
  - Form design (ProposalFormDesign, AdministrationFormDesign)
  - Rating configurator setup
- **Components**: `src/features/market-admin/components/`

### 3. **Insurer**
- **Pages**: `src/features/insurers/pages/`
  - Dashboard
  - User management
  - Product configuration
  - Rating configurator (InsurerPricingConfig)
  - Broker assignments
- **Components**: `src/features/insurers/components/`

### 4. **Broker**
- **Pages**: `src/features/brokers/pages/`
  - Dashboard
  - User management
  - Quote management
- **Proposals**: `src/features/proposals/pages/`
  - Fill proposal forms
  - View quotes
  - Document upload
  - Payment processing

---

## 📊 Feature Breakdown

### **Product Configuration** (`src/features/product-config/`)
- **Purpose**: Product setup, pricing, form design
- **Used By**: Market Admin, Insurer
- **Key Features**:
  - Single product configuration
  - Pricing configurator
  - Form design (Proposal & Administration)
  - Masters management
  - Rating algorithms

### **Quotes** (`src/features/quotes/`)
- **Purpose**: Quote management and comparison
- **Used By**: All roles
- **Key Features**:
  - Quote listing
  - Quote details
  - Quote comparison
  - Policy details

### **Proposals** (`src/features/proposals/`)
- **Purpose**: Proposal form filling and submission
- **Used By**: Broker
- **Key Features**:
  - Multi-step proposal forms
  - Document upload
  - Payment processing
  - Success tracking

---

## 🔧 Architecture Principles

1. **Feature-Based Organization**: Each major feature has its own folder
2. **Separation of Concerns**: Pages, components, API, hooks separated
3. **Reusability**: Shared components in `components/shared/`
4. **Layout Components**: Role-specific layouts in `components/layout/`
5. **Design System**: UI primitives in `components/ui/`

---

## 📝 Notes

- **Legacy Files**: Some old files remain in `src/pages/SingleProductConfig.backup.tsx` (can be removed)
- **Empty Folders**: Some feature folders have empty `api/` and `hooks/` directories (ready for future use)
- **API Organization**: Core API functions in `src/lib/api/`, feature-specific APIs can be moved to `features/{feature}/api/`

