import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { getInsurerCompanyId } from '@/lib/auth';
import { listInsurers } from '@/features/insurers/api/insurers';
import { listBrokersViaManagement } from '@/features/brokers/api/brokers';
import InsurerRoleManagement from './InsurerRoleManagement';
import { useAccessMatrixStore } from '@/shared/stores/useAccessMatrixStore';

type UiUser = {
  id: string;
  name?: string;
  email: string;
  type: string;
  roleId?: string | null;
  roleName?: string | null;
  status: string;
  createdAt: string;
  organizationId: string;
};

export default function InsurerUserManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { toast } = useToast();

  const [users, setUsers] = useState<UiUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [page] = useState(1);
  const [limit] = useState(10);
  const [searchTerm] = useState('');

  const isMarketAdmin =
    location.pathname.includes('/market-admin') ||
    window.location.pathname.includes('/market-admin');

  // Org name from URL param (passed by MarketAdminInsurerManagement)
  const orgNameFromUrl = searchParams.get('orgName') || '';

  // Market Admin Context
  const [organizations, setOrganizations] = useState<
    { id: string; name: string; type: string; status: string }[]
  >([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>(
    searchParams.get('orgId') || searchParams.get('organizationId') || 'all',
  );
  const [fetchingOrgs, setFetchingOrgs] = useState(false);

  // Fetch available organizations
  useEffect(() => {
    if (!isMarketAdmin) return;

    const fetchOrgs = async () => {
      setFetchingOrgs(true);
      try {
        const [insurersRes, brokersRes] = await Promise.all([
          listInsurers({ limit: 100 }),
          listBrokersViaManagement('', { limit: 100 }),
        ]);

        const orgs = [
          ...insurersRes.data.map((i) => ({
            id: i.id,
            name: i.name,
            type: 'Insurer',
            status: i.status || 'ACTIVE',
          })),
          ...brokersRes.data.map((b) => ({
            id: b.id,
            name: b.name,
            type: 'Broker',
            status: b.status || 'ACTIVE',
          })),
        ];

        setOrganizations(orgs);
      } catch (error) {
        console.error('Failed to fetch organizations', error);
      } finally {
        setFetchingOrgs(false);
      }
    };

    fetchOrgs();
  }, [isMarketAdmin]);

  // Sync state to URL and vice-versa
  useEffect(() => {
    const orgIdFromUrl = searchParams.get('orgId') || searchParams.get('organizationId') || 'all';
    if (orgIdFromUrl !== selectedOrgId) {
      setSelectedOrgId(orgIdFromUrl);
    }
  }, [searchParams, selectedOrgId]);

  useEffect(() => {
    // Sync access matrix when orgId changes
    useAccessMatrixStore.getState().load(selectedOrgId === 'all' ? undefined : selectedOrgId);
  }, [selectedOrgId]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil((total || 0) / (limit || 10)));
  }, [total, limit]);

  const isGlobalView = isMarketAdmin && selectedOrgId === 'all';
  const isRolesTabEnabled = !isGlobalView;
  const currentTab = isRolesTabEnabled && searchParams.get('tab') === 'roles' ? 'roles' : 'users';

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toUpperCase();
    switch (normalizedStatus) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-6 cityscape-bg">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className='flex items-center gap-2'>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">
                  {orgNameFromUrl || 'User Management'}
                </h1>
                {isMarketAdmin && selectedOrgId !== 'all' && (
                  <Badge
                    variant="outline"
                    className={getStatusColor(
                      organizations.find((o) => o.id.toString() === selectedOrgId)?.status || '',
                    )}
                  >
                    {organizations.find((o) => o.id.toString() === selectedOrgId)?.status || ''}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {orgNameFromUrl ? 'User Management' : 'Manage insurer portal users and permissions'}
              </p>
            </div>
          </div>
        </div>

        {/* Roles & Permissions */}
        <InsurerRoleManagement
          embedded
          externalOrgId={selectedOrgId === 'all' ? undefined : selectedOrgId}
          externalOrganizations={organizations}
        />
      </div>
    </div>
  );
}
