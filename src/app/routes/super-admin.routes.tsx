import { Navigate, Route } from 'react-router-dom';
import RequireAuth from '@/components/layout/RequireAuth';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';

import { lazyRoute } from './lazyRoute';

const SuperAdminDashboard = lazyRoute(() => import('@/features/super-admin/pages/SuperAdminDashboard'));
const CreateEnvironment = lazyRoute(() => import('@/features/super-admin/pages/CreateEnvironment'));
const EnvironmentAuthorityMatrix = lazyRoute(
    () => import('@/features/super-admin/pages/EnvironmentAuthorityMatrix'),
);
const SuperAdminMastersManagement = lazyRoute(
    () => import('@/features/super-admin/pages/SuperAdminMastersManagement'),
);
const SuperAdminSupportCenter = lazyRoute(
    () => import('@/features/super-admin/support-center/pages/SuperAdminSupportCenter'),
);
const SuperAdminSupportTopicsPage = lazyRoute(
    () => import('@/features/super-admin/support-center/pages/SuperAdminSupportTopicsPage'),
);

export const SuperAdminRoutes = (
    <>
        <Route
            path="/super-admin"
            element={
                <RequireAuth requiredRole="super_admin">
                    <SuperAdminLayout />
                </RequireAuth>
            }
        >
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="environments" element={<SuperAdminDashboard />} />
            <Route path="environments/create" element={<CreateEnvironment />} />
            <Route path="environments/:environmentId" element={<SuperAdminDashboard />} />
            <Route
                path="environments/:environmentId/authority-matrix"
                element={<EnvironmentAuthorityMatrix />}
            />
            <Route path="settings" element={<SuperAdminDashboard />} />
            <Route path="masters-management" element={<SuperAdminMastersManagement />} />
            <Route path="support-center" element={<SuperAdminSupportCenter />}>
                <Route index element={<Navigate to="support" replace />} />
                <Route path="support" element={<SuperAdminSupportTopicsPage />} />
                <Route path="faqs" element={<Navigate to="../support" replace />} />
            </Route>
        </Route>
    </>
);
