import { Route } from 'react-router-dom';

import { lazyRoute } from './lazyRoute';

const ProposalRouter = lazyRoute(() => import('@/features/proposals/pages/ProposalRouter'));
const Proposal = lazyRoute(() => import('@/features/proposals/pages/Proposal'));
const Documents = lazyRoute(() => import('@/features/proposals/pages/Documents'));
const Quotes = lazyRoute(() => import('@/features/quotes/pages/Quotes'));
const CEWCustomization = lazyRoute(() => import('@/features/quotes/pages/CEWCustomization'));
const Payment = lazyRoute(() => import('@/features/proposals/pages/Payment'));
const Success = lazyRoute(() => import('@/features/proposals/pages/Success'));
const PISuccess = lazyRoute(() => import('@/features/proposals/pages/PISuccess'));

export const CustomerRoutes = (
    <>
        {/* Product-specific proposal forms */}
        <Route path="/customer/proposal/:productId" element={<ProposalRouter />} />

        {/* Legacy route - redirect to CAR proposal for backward compatibility */}
        <Route path="/customer/proposal" element={<Proposal />} />
        <Route path="/customer/documents" element={<Documents />} />
        <Route path="/customer/quotes" element={<Quotes />} />
        <Route path="/customer/cew-customization" element={<CEWCustomization />} />
        <Route path="/customer/payment" element={<Payment />} />
        <Route path="/customer/success" element={<Success />} />
        <Route path="/customer/pi-success" element={<PISuccess />} />
    </>
);
