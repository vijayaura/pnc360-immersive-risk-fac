import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  Users,
  Loader2,
  AlertCircle,
  Package,
  SlidersHorizontal,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  getRolesPermissions,
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  isPermissionAllowed,
  type Role,
  type PermissionGroup,
  type AvailablePermission,
  PERMISSION_KEYS,
  type PermissionPayload,
  type PermissionAction,
} from '@/features/auth/api/roles';
import { listInsurers } from '@/features/insurers/api/insurers';
import { listBrokersViaManagement } from '@/features/brokers/api/brokers';
import { getAuthUser, getInsurerCompanyId } from '@/lib/auth';
import type { AuthUser } from '@/features/auth/api/auth';
import { getUserFriendlyMessage, getErrorTitle } from '@/lib/errorMessages';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { FormattedNumberInput } from '@/components/ui';
import {
  getRoleLoadingDiscountConfig,
  getRoleProductAssignments,
  saveRoleLoadingDiscountConfig,
  saveRoleProductAssignments,
  type RoleLoadingDiscountConfig,
  type RoleLoadingDiscountRow,
  type RolePremiumSelection,
  type RolePricingType,
  type RoleProductAssignmentItem,
} from '@/features/auth/api/role-settings';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';

interface InsurerRoleManagementProps {
  embedded?: boolean;
  externalOrgId?: string;
  externalOrganizations?: { id: string; name: string; type: string; status: string }[];
}

// Form state for permission actions
interface PermissionFormState {
  [permissionKey: string]: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
}

type OrganizationOption = {
  id: string;
  name: string;
  status?: string;
};

type PermissionLike = {
  id?: string;
  key?: string;
  permissionKey?: string;
  name?: string;
};

type PermissionGroupLike = PermissionGroup & PermissionLike;
type RoleWithAssignedProducts = Role & {
  assignedProductCount?: number;
  assignedProducts?: Array<{ id: string; name: string; assigned?: boolean; status?: string }>;
};

const createLoadingDiscountRow = (): RoleLoadingDiscountRow => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  premiumSelection: 'sumInsured',
  from: 0,
  to: 0,
  pricingType: 'percentage',
  value: 0,
});

const createEmptyLoadingDiscountConfig = (): RoleLoadingDiscountConfig => ({
  rows: [createLoadingDiscountRow()],
});

export default function InsurerRoleManagement({
  embedded = false,
  externalOrgId,
  externalOrganizations,
}: InsurerRoleManagementProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [superAdminMatrix, setSuperAdminMatrix] = useState<Record<string, Record<string, boolean>>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPermissions, setFormPermissions] = useState<PermissionFormState>({});
  const [saving, setSaving] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedProductRole, setSelectedProductRole] = useState<Role | null>(null);
  const [roleProducts, setRoleProducts] = useState<RoleProductAssignmentItem[]>([]);
  const [roleProductsLoading, setRoleProductsLoading] = useState(false);
  const [roleProductsSaving, setRoleProductsSaving] = useState(false);
  const [roleProductsError, setRoleProductsError] = useState<string | null>(null);
  const [loadingDiscountDialogOpen, setLoadingDiscountDialogOpen] = useState(false);
  const [selectedLoadingRole, setSelectedLoadingRole] = useState<Role | null>(null);
  const [loadingDiscountConfig, setLoadingDiscountConfig] = useState<RoleLoadingDiscountConfig>(
    createEmptyLoadingDiscountConfig(),
  );
  const [loadingDiscountLoading, setLoadingDiscountLoading] = useState(false);
  const [loadingDiscountSaving, setLoadingDiscountSaving] = useState(false);
  const [loadingDiscountError, setLoadingDiscountError] = useState<string | null>(null);
  const [loadingDiscountValidationError, setLoadingDiscountValidationError] = useState<string | null>(
    null,
  );
  const [loadingDiscountRowErrors, setLoadingDiscountRowErrors] = useState<
    Record<string, { from?: string; to?: string }>
  >({});

  // Navigate to role users page
  const openUsersSheet = (role: Role) => {
    const orgId = getCurrentOrganizationId();
    const orgName = externalOrganizations?.find((o) => o.id === orgId)?.name || '';
    const isMarketAdminPath =
      location.pathname.includes('/market-admin') ||
      window.location.pathname.includes('/market-admin');
    const basePath = isMarketAdminPath
      ? '/market-admin/user-management/role-users'
      : '/insurer/user-management/role-users';
    const params = new URLSearchParams({
      roleId: role.id,
      roleName: role.name,
      ...(orgId ? { orgId } : {}),
      ...(orgName ? { orgName } : {}),
    });
    navigate(`${basePath}?${params.toString()}`);
  };

  const getMinimumFromValue = (rowIndex: number, rows: RoleLoadingDiscountRow[]): number =>
    rowIndex <= 0 ? 0 : (Number(rows[rowIndex - 1]?.to ?? 0) || 0) + 1;

  const getLoadingDiscountRowErrors = (rows: RoleLoadingDiscountRow[]) => {
    const errors: Record<string, { from?: string; to?: string }> = {};

    rows.forEach((row, index) => {
      const minFrom = getMinimumFromValue(index, rows);

      if (Number(row.from ?? 0) < minFrom) {
        errors[row.id] = {
          ...errors[row.id],
          from:
            index === 0
              ? 'From value must be 0 or greater.'
              : `From value must be greater than ${rows[index - 1].to}.`,
        };
      }

      if (Number(row.to ?? 0) < Number(row.from ?? 0)) {
        errors[row.id] = {
          ...errors[row.id],
          to: 'To value must be greater than or equal to From.',
        };
      }
    });

    return errors;
  };

  const { toast } = useToast();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  const location = useLocation();
  const navigate = useNavigate();
  const authUser = getAuthUser<AuthUser>();
  const userType = (authUser?.user_type || '').toLowerCase();

  const isMarketAdmin =
    userType.includes('admin') ||
    location.pathname.includes('/market-admin') ||
    window.location.pathname.includes('/market-admin');

  const [organizations, setOrganizations] = useState<
    { id: string; name: string; type: string; status: string }[]
  >([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [fetchingOrgs, setFetchingOrgs] = useState(false);

  const getCurrentOrganizationId = useCallback(() => {
    return (
      (isMarketAdmin ? externalOrgId || selectedOrgId : getInsurerCompanyId()?.toString()) || ''
    );
  }, [externalOrgId, isMarketAdmin, selectedOrgId]);

  const fetchData = useCallback(async () => {
    const companyId = getCurrentOrganizationId();

    if (!companyId) {
      if (isMarketAdmin) {
        // For Market Admin, if companyId is missing (selection is 'all'),
        // we can still fetch permissions if the API allows it, or just show empty.
        // Let's assume they MUST select an organization to manage roles.
        setRoles([]);
        setPermissionGroups([]);
        setLoading(false);
        return;
      }
      setRoles([]);
      setPermissionGroups([]);
      setLoading(false);
      toast({
        title: 'Organization Not Selected',
        description: 'Please select an organization to manage roles and permissions.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const data = await getRolesPermissions(companyId);

      // Fallback to static keys if BE returns empty permissions
      if (!data.permissions || data.permissions.length === 0) {
        const fallbackGroup: PermissionGroup = {
          groupId: 'default-org-permissions',
          groupName: 'Organization Permissions',
          permissions: PERMISSION_KEYS.map((key) => ({
            id: key,
            key: key,
            name: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
            actions: ['view', 'create', 'update', 'delete'],
          })),
        };
        setPermissionGroups([fallbackGroup]);
      } else {
        setPermissionGroups(data.permissions);
      }

      let detailedRoles: Role[] = [];
      try {
        detailedRoles = await getRoles(companyId);
      } catch (e) {
        // Ignore secondary list fetch failure
      }

      // Merge roles: keep the roles-permissions permission matrix, but also carry
      // richer fields from the roles listing response such as assignedProductCount.
      const finalRoles = (data.roles || []).map((listRole) => {
        const matchingDetailedRole = detailedRoles.find((r) => r.id === listRole.id);
        if (!matchingDetailedRole) return listRole;

        return {
          ...matchingDetailedRole,
          ...listRole,
          permissions:
            matchingDetailedRole.permissions && matchingDetailedRole.permissions.length > 0
              ? matchingDetailedRole.permissions
              : listRole.permissions,
        };
      });

      setRoles(finalRoles);
      setSuperAdminMatrix(data.superAdminMatrix || {});
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to load roles and permissions.';
      toast({
        title: getErrorTitle(error),
        description: getUserFriendlyMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, isMarketAdmin, getCurrentOrganizationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, selectedOrgId, externalOrgId]);

  // Market Admin: Fetch available organizations
  const fetchOrgs = useCallback(async () => {
    if (!isMarketAdmin || externalOrganizations) return;

    setFetchingOrgs(true);
    try {
      const [insurersRes, brokersRes] = await Promise.all([
        listInsurers({ limit: 100 }),
        listBrokersViaManagement('', { limit: 100 }),
      ]);

      const orgs = [
        ...insurersRes.data.map((i: OrganizationOption) => ({
          id: i.id,
          name: i.name,
          type: 'Insurer',
          status: i.status || 'ACTIVE',
        })),
        ...brokersRes.data.map((b: OrganizationOption) => ({
          id: b.id,
          name: b.name,
          type: 'Broker',
          status: b.status || 'ACTIVE',
        })),
      ];

      setOrganizations(orgs);
    } catch (error) {
      // Ignore org fetch failure
    } finally {
      setFetchingOrgs(false);
    }
  }, [isMarketAdmin, externalOrganizations]);

  useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId && !externalOrgId) {
      setSelectedOrgId(organizations[0].id.toString());
    }
  }, [organizations, selectedOrgId, externalOrgId]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  // Initialize form permissions from a Role or empty state
  const initializeFormPermissions = (role?: Role): PermissionFormState => {
    const state: PermissionFormState = {};

    if (role && role.permissions) {
      // Populate from existing role permissions
      role.permissions.forEach((perm) => {
        state[perm.permissionKey] = {
          view: perm.actions.view,
          create: perm.actions.create,
          update: perm.actions.update,
          delete: perm.actions.delete,
        };
      });
    }

    // Ensure all available permissions have an entry (default false)
    permissionGroups.forEach((group: PermissionGroup) => {
      // Handle both grouped and flat list from API
      const perms = Array.isArray(group.permissions) ? group.permissions : [];
      perms.forEach((perm: AvailablePermission | { permissionKey?: string; key?: string }) => {
        const key =
          (perm as AvailablePermission).key || (perm as { permissionKey?: string }).permissionKey;
        if (key && !state[key]) {
          state[key] = { view: false, create: false, update: false, delete: false };
        }
      });
    });

    return state;
  };

  // State for loading role details when editing
  const [loadingRole, setLoadingRole] = useState(false);

  const handleOpenDialog = async (role?: Role) => {
    if (role) {
      // If role already has permissions, use them
      if (role.permissions && role.permissions.length > 0) {
        setEditingRole(role);
        setFormName(role.name);
        setFormDescription(role.description || '');
        setFormPermissions(initializeFormPermissions(role));
        setIsDialogOpen(true);
        return;
      }

      // Fetch full role details if permissions are missing (fallback)
      setLoadingRole(true);
      try {
        const companyId = getCurrentOrganizationId();
        const fullRole = await getRoleById(role.id, companyId);
        setEditingRole(fullRole);
        setFormName(fullRole.name);
        setFormDescription(fullRole.description || '');
        setFormPermissions(initializeFormPermissions(fullRole));
        setIsDialogOpen(true);
      } catch (error: unknown) {
        toast({
          title: 'Error',
          description: 'Failed to load role details. Falling back to basic info.',
          variant: 'destructive',
        });

        // Fallback: try to find the role in current state as it might have been merged
        const fallbackRole = roles.find((r) => r.id === role.id) || role;

        setEditingRole(fallbackRole);
        setFormName(fallbackRole.name);
        setFormDescription(fallbackRole.description || '');
        setFormPermissions(initializeFormPermissions(fallbackRole));
        setIsDialogOpen(true);
      } finally {
        setLoadingRole(false);
      }
    } else {
      setEditingRole(null);
      setFormName('');
      setFormDescription('');
      setFormPermissions(initializeFormPermissions());
      setIsDialogOpen(true);
    }
  };

  const openProductAssignmentDialog = async (role: Role) => {
    const companyId = getCurrentOrganizationId();
    if (!companyId) {
      toast({
        title: 'Organization Identity Missing',
        description: 'Please select an organization first.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedProductRole(role);
    setProductDialogOpen(true);
    setRoleProducts([]);
    setRoleProductsError(null);
    setRoleProductsLoading(true);

    try {
      const products = await getRoleProductAssignments(role.id, companyId);
      setRoleProducts(products);
    } catch (error: unknown) {
      setRoleProductsError(getUserFriendlyMessage(error, 'Unable to load product assignments.'));
    } finally {
      setRoleProductsLoading(false);
    }
  };

  const toggleRoleProduct = (productId: string) => {
    setRoleProducts((prev) =>
      prev.map((product) =>
        product.productId === productId ? { ...product, assigned: !product.assigned } : product,
      ),
    );
  };

  const toggleAllRoleProducts = () => {
    setRoleProducts((prev) => {
      const allSelected = prev.length > 0 && prev.every((product) => product.assigned);
      return prev.map((product) => ({ ...product, assigned: !allSelected }));
    });
  };

  const handleSaveRoleProducts = async () => {
    if (!selectedProductRole) return;

    try {
      const companyId = getCurrentOrganizationId();
      if (!companyId) {
        toast({
          title: 'Organization Identity Missing',
          description: 'Please select an organization first.',
          variant: 'destructive',
        });
        return;
      }

      setRoleProductsSaving(true);
      setRoleProductsError(null);
      await saveRoleProductAssignments(
        selectedProductRole.id,
        roleProducts.filter((product) => product.assigned).map((product) => product.productId),
        companyId,
      );
      toast({
        title: 'Assignments Saved',
        description: `${selectedProductRole.name} product assignments were saved successfully.`,
      });
      await fetchData();
      setProductDialogOpen(false);
    } catch (error: unknown) {
      setRoleProductsError(getUserFriendlyMessage(error, 'Unable to save product assignments.'));
    } finally {
      setRoleProductsSaving(false);
    }
  };

  const openLoadingDiscountDialog = async (role: Role) => {
    const companyId = getCurrentOrganizationId();
    if (!companyId) {
      toast({
        title: 'Organization Identity Missing',
        description: 'Please select an organization first.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedLoadingRole(role);
    setLoadingDiscountDialogOpen(true);
    setLoadingDiscountError(null);
    setLoadingDiscountLoading(true);

    try {
      const config = await getRoleLoadingDiscountConfig(role.id, companyId);
      setLoadingDiscountConfig({
        premiumSelection: config.premiumSelection,
        rows: config.rows.length > 0 ? config.rows : [createLoadingDiscountRow()],
      });
      setLoadingDiscountValidationError(null);
      setLoadingDiscountRowErrors(getLoadingDiscountRowErrors(config.rows));
    } catch (error: unknown) {
      setLoadingDiscountError(
        getUserFriendlyMessage(error, 'Unable to load loading/discount configuration.'),
      );
      setLoadingDiscountConfig(createEmptyLoadingDiscountConfig());
      setLoadingDiscountValidationError(null);
      setLoadingDiscountRowErrors({});
    } finally {
      setLoadingDiscountLoading(false);
    }
  };

  const addLoadingDiscountRow = () => {
    setLoadingDiscountConfig((prev) => {
      const nextConfig = {
        ...prev,
        rows: [...prev.rows, createLoadingDiscountRow()],
      };
      setLoadingDiscountRowErrors(getLoadingDiscountRowErrors(nextConfig.rows));
      return nextConfig;
    });
  };

  const updateLoadingDiscountRow = (
    rowId: string,
    field: keyof RoleLoadingDiscountRow,
    value: number | string,
  ) => {
    setLoadingDiscountConfig((prev) => {
      const nextRows = prev.rows.map((row, index) => {
        if (row.id !== rowId) return row;

        const nextRow = { ...row, [field]: value };

        if (field === 'from') {
          const minFrom = getMinimumFromValue(index, prev.rows);
          const nextFrom = Math.max(Number(value ?? 0) || 0, minFrom);
          return {
            ...nextRow,
            from: nextFrom,
            to: nextRow.to < nextFrom ? nextFrom : nextRow.to,
          };
        }

        if (field === 'to') {
          const currentFrom = Number(nextRow.from ?? 0) || 0;
          return {
            ...nextRow,
            to: Math.max(Number(value ?? 0) || 0, currentFrom),
          };
        }

        return nextRow;
      });

      setLoadingDiscountRowErrors(getLoadingDiscountRowErrors(nextRows));

      return {
        ...prev,
        rows: nextRows,
      };
    });

    if (field === 'from' || field === 'to') {
      setLoadingDiscountValidationError(null);
    }
  };

  const removeLoadingDiscountRow = (rowId: string) => {
    setLoadingDiscountConfig((prev) => {
      const nextRows = prev.rows.filter((row) => row.id !== rowId);
      const nextConfig = {
        ...prev,
        rows: nextRows.length > 0 ? nextRows : [createLoadingDiscountRow()],
      };
      setLoadingDiscountRowErrors(getLoadingDiscountRowErrors(nextConfig.rows));
      return nextConfig;
    });
  };

  const handleSaveLoadingDiscount = async () => {
    if (!selectedLoadingRole) return;
    if (!loadingDiscountConfig.premiumSelection) {
      setLoadingDiscountValidationError('Premium Selection is required.');
      return;
    }
    const rowErrors = getLoadingDiscountRowErrors(loadingDiscountConfig.rows);
    if (Object.keys(rowErrors).length > 0) {
      setLoadingDiscountRowErrors(rowErrors);
      return;
    }

    try {
      const companyId = getCurrentOrganizationId();
      if (!companyId) {
        toast({
          title: 'Organization Identity Missing',
          description: 'Please select an organization first.',
          variant: 'destructive',
        });
        return;
      }

      setLoadingDiscountSaving(true);
      setLoadingDiscountError(null);
      setLoadingDiscountValidationError(null);
      setLoadingDiscountRowErrors({});
      await saveRoleLoadingDiscountConfig(selectedLoadingRole.id, loadingDiscountConfig, companyId);
      toast({
        title: 'Configuration Saved',
        description: `${selectedLoadingRole.name} loading/discount rules were saved successfully.`,
      });
      setLoadingDiscountDialogOpen(false);
    } catch (error: unknown) {
      setLoadingDiscountError(
        getUserFriendlyMessage(error, 'Unable to save loading/discount configuration.'),
      );
    } finally {
      setLoadingDiscountSaving(false);
    }
  };

  const handleActionToggle = (permissionKey: string, action: PermissionAction) => {
    setFormPermissions((prev) => ({
      ...prev,
      [permissionKey]: {
        ...prev[permissionKey],
        [action]: !prev[permissionKey]?.[action],
      },
    }));
  };

  // Convert form state to API payload
  const getPermissionPayload = (): PermissionPayload[] => {
    return Object.entries(formPermissions)
      .map(([key, actions]) => {
        const selectedActions: PermissionAction[] = [];
        if (actions.view) selectedActions.push('view');
        if (actions.create) selectedActions.push('create');
        if (actions.update) selectedActions.push('update');
        if (actions.delete) selectedActions.push('delete');
        return { permissionKey: key, actions: selectedActions };
      })
      .filter((p) => p.actions.length > 0);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast({ title: 'Error', description: 'Role name is required.', variant: 'destructive' });
      return;
    }

    try {
      const companyId = getCurrentOrganizationId();

      if (!companyId) {
        toast({
          title: 'Organization Identity Missing',
          description: 'Please select an organization first.',
          variant: 'destructive',
        });
        return;
      }

      setSaving(true);
      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        organizationId: isMarketAdmin ? companyId : undefined,
        permissions: getPermissionPayload(),
      };

      if (editingRole) {
        await updateRole(editingRole.id, payload, companyId);
        toast({ title: 'Success', description: 'Role updated successfully.' });
      } else {
        await createRole(payload, companyId);
        toast({ title: 'Success', description: 'Role created successfully.' });
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error: unknown) {
      const friendlyMessage = getUserFriendlyMessage(
        error,
        'Unable to save role. Please try again.',
      );
      toast({ title: getErrorTitle(error), description: friendlyMessage, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (role: Role) => {
    showConfirmDialog(
      {
        title: 'Delete Role',
        description: `Are you sure you want to delete the "${role.name}" role? This action cannot be undone.`,
        confirmText: 'Delete',
        variant: 'destructive',
      },
      async () => {
        try {
          const companyId =
            (isMarketAdmin ? externalOrgId || selectedOrgId : getInsurerCompanyId()?.toString()) ||
            '';
          await deleteRole(role.id, companyId || undefined);
          toast({
            title: 'Success',
            description: 'Role deleted successfully.',
          });
          fetchData();
        } catch (error: unknown) {
          const friendlyMessage = getUserFriendlyMessage(
            error,
            'Unable to delete role. Please try again.',
          );
          toast({
            title: getErrorTitle(error),
            description: friendlyMessage,
            variant: 'destructive',
          });
        }
      },
    );
  };

  // Filter roles by search
  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Check if permission is allowed by SuperAdmin matrix
  const canAssignPermission = (permissionKey: string): boolean => {
    return isPermissionAllowed(superAdminMatrix, userType, permissionKey);
  };

  // Count total assigned permissions for a role
  const countRolePermissions = (role: Role): number => {
    // Priority 1: Use the new direct permissionCount from the optimized API
    if (typeof role.permissionCount === 'number') {
      return role.permissionCount;
    }

    // Priority 2: Fallback to manual count if full permissions array is present
    const perms =
      role.permissions ||
      ((role as Role & { role_permissions?: Role['permissions'] }).role_permissions ?? []) ||
      ((role as Role & { rolePermissions?: Role['permissions'] }).rolePermissions ?? []);
    if (!perms || !Array.isArray(perms)) return 0;

    return perms.reduce((count, perm) => {
      if (!perm.actions) return count;

      // Handle array format (payload style)
      if (Array.isArray(perm.actions)) {
        return count + perm.actions.length;
      }

      // Handle object format (response style)
      if (typeof perm.actions === 'object') {
        const actionCount = Object.values(perm.actions).filter(
          (v:any) => v === true || v === 'true',
        ).length;
        return count + actionCount;
      }

      return count;
    }, 0);
  };

  const getAssignedProductCount = (role: Role): number => {
    const roleWithProducts = role as RoleWithAssignedProducts;

    if (typeof roleWithProducts.assignedProductCount === 'number') {
      return roleWithProducts.assignedProductCount;
    }

    if (Array.isArray(roleWithProducts.assignedProducts)) {
      return roleWithProducts.assignedProducts.filter((product) => product.assigned !== false)
        .length;
    }

    return 0;
  };

  // Wrapper classes for embedded vs standalone
  const wrapperClass = embedded
    ? 'space-y-6'
    : 'min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-6 cityscape-bg';

  return (
    <div className={wrapperClass}>
      <div className={embedded ? 'space-y-6' : 'max-w-7xl mx-auto space-y-8'}>
        {!(externalOrgId || selectedOrgId || getInsurerCompanyId()) && (
          <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Organization Not Selected</AlertTitle>
            <AlertDescription>
              Please select an organization to manage roles and permissions.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Header Row */}
        <div className="flex items-center justify-end pb-6 border-b mb-6">
          {/* Right: org selector + button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
            {isMarketAdmin && !embedded && (
              <div className="flex items-center gap-3 bg-primary/5 p-3 rounded-lg border border-primary/10 min-w-[320px]">
                <Building2 className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase text-primary/70 block leading-none mb-1">
                    Managing Organization
                  </span>
                  <Select
                    value={selectedOrgId}
                    onValueChange={setSelectedOrgId}
                    disabled={fetchingOrgs}
                  >
                    <SelectTrigger
                      id="org-select"
                      className="h-8 border-0 bg-transparent p-0 focus:ring-0 text-base font-semibold text-foreground"
                    >
                      <SelectValue
                        placeholder={fetchingOrgs ? 'Fetching...' : 'Select Organization'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id.toString()}>
                          <div className="flex items-center justify-between w-full gap-8">
                            <span>
                              {org.name}{' '}
                              <span className="text-xs opacity-50 ml-1">({org.type})</span>
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                                org.status?.toLowerCase() === 'active'
                                  ? 'bg-green-100 text-green-700 border-green-200'
                                  : 'bg-red-100 text-red-700 border-red-200'
                              }`}
                            >
                              {org.status}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Button
              size="lg"
              onClick={() => handleOpenDialog()}
              className="gap-2 shadow-sm font-semibold whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Create New Role
            </Button>
          </div>
        </div>

        {/* Roles Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Roles
            </CardTitle>
            <CardDescription>
              Manage custom roles with specific permissions for your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-6">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 max-w-full"
              />
            </div>

            {/* Roles Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Permissions</TableHead>
                    <TableHead className="text-center">Users</TableHead>
                    <TableHead className="text-center">Product Assignment</TableHead>
                    <TableHead className="text-center">Loading/Discount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableSkeleton rowCount={3} colCount={7} />
                  ) : !selectedOrgId && !externalOrgId && isMarketAdmin ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-foreground mb-1">
                          No Organization Selected
                        </h3>
                        <p>
                          Select an organization from the dropdown to manage its roles and
                          permissions.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : filteredRoles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No roles found. Create your first role to get started.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {role.description || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{countRolePermissions(role)}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            className="flex items-center justify-center gap-1 mx-auto hover:text-primary transition-colors cursor-pointer group"
                            onClick={() => openUsersSheet(role)}
                            title="View users with this role"
                          >
                            <Users className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                            <span className="underline-offset-2 group-hover:underline font-medium">
                              {role.userCount}
                            </span>
                          </button>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => openProductAssignmentDialog(role)}
                          >
                            <Package className="w-4 h-4" />
                            {getAssignedProductCount(role)}{' '}
                            {getAssignedProductCount(role) === 1 ? 'Product' : 'Products'}
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => openLoadingDiscountDialog(role)}
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                            Configure Loading/Discount
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(role)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(role)}
                              disabled={role.userCount > 0}
                              title={
                                role.userCount > 0
                                  ? 'Cannot delete role with assigned users'
                                  : 'Delete role'
                              }
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Role Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
              <DialogDescription>
                {editingRole
                  ? 'Modify the role name, description, and permissions.'
                  : 'Define a new role with specific permissions for your users.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Name & Description */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role-name">Role Name *</Label>
                  <Input
                    id="role-name"
                    placeholder="e.g., Underwriter"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-description">Description</Label>
                  <Textarea
                    id="role-description"
                    placeholder="Describe what this role can do..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              {/* Permissions Grid */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Permissions</Label>
                <p className="text-sm text-muted-foreground">
                  Select the actions allowed for each permission. Greyed-out permissions are
                  restricted by your organization's policy.
                </p>

                {permissionGroups.map((group: PermissionGroupLike) => {
                  const perms = Array.isArray(group.permissions) ? group.permissions : [group];
                  const hasSubPermissions = Array.isArray(group.permissions);

                  return (
                    <div
                      key={group.groupId || group.key || group.permissionKey}
                      className="space-y-3 border rounded-lg p-4 bg-muted/20"
                    >
                      {hasSubPermissions && (
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                          {group.groupName}
                        </h4>
                      )}
                      <div className="space-y-3">
                        {perms.map((perm: PermissionLike) => {
                          const key = perm.key || perm.permissionKey;
                          if (!key) return null;

                          const isAllowed = canAssignPermission(key);
                          const permState = formPermissions[key] || {
                            view: false,
                            create: false,
                            update: false,
                            delete: false,
                          };

                          return (
                            <div
                              key={perm.id}
                              className={`flex items-center justify-between p-3 rounded-md border ${
                                isAllowed ? 'bg-background' : 'bg-muted/50 opacity-60'
                              }`}
                            >
                              <span className="font-medium text-sm">{perm.name}</span>
                              <div className="flex items-center gap-4">
                                {(['view', 'create', 'update', 'delete'] as PermissionAction[]).map(
                                  (action) => {
                                    const isRestricted = !isPermissionAllowed(
                                      superAdminMatrix,
                                      'insurer', // Target context
                                      perm.key || perm.permissionKey,
                                    );

                                    return (
                                      <label
                                        key={action}
                                        className={`flex items-center gap-1.5 cursor-pointer ${
                                          isRestricted ? 'opacity-50 grayscale' : ''
                                        }`}
                                      >
                                        <Checkbox
                                          checked={permState[action]}
                                          onCheckedChange={() => handleActionToggle(key, action)}
                                          disabled={!isAllowed || isRestricted}
                                        />
                                        <span className="text-xs text-muted-foreground capitalize">
                                          {action}
                                        </span>
                                      </label>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingRole ? 'Save Changes' : 'Create Role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Product Assignment{selectedProductRole ? ` - ${selectedProductRole.name}` : ''}
              </DialogTitle>
              <DialogDescription>
                Select the products that should be available for this role.
              </DialogDescription>
            </DialogHeader>

            {roleProductsError && (
              <Alert variant="destructive">
                <AlertTitle>Unable to load products</AlertTitle>
                <AlertDescription>{roleProductsError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllRoleProducts}
                disabled={roleProductsLoading || roleProducts.length === 0}
              >
                {roleProducts.length > 0 && roleProducts.every((product) => product.assigned)
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Assigned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roleProductsLoading ? (
                    <TableSkeleton rowCount={4} colCount={2} />
                  ) : roleProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-10 text-muted-foreground">
                        No products available for assignment.
                      </TableCell>
                    </TableRow>
                  ) : (
                    roleProducts.map((product) => (
                      <TableRow key={product.productId}>
                        <TableCell className="font-medium">{product.productName}</TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={product.assigned}
                            onCheckedChange={() => toggleRoleProduct(product.productId)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setProductDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRoleProducts} disabled={roleProductsSaving}>
                {roleProductsSaving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={loadingDiscountDialogOpen} onOpenChange={setLoadingDiscountDialogOpen}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Loading/Discount Configuration
                {selectedLoadingRole ? ` - ${selectedLoadingRole.name}` : ''}
              </DialogTitle>
              <DialogDescription>
                Configure Sum Insured and Base Premium ranges for this role.
              </DialogDescription>
            </DialogHeader>

            {loadingDiscountError && (
              <Alert variant="destructive">
                <AlertTitle>Unable to load configuration</AlertTitle>
                <AlertDescription>{loadingDiscountError}</AlertDescription>
              </Alert>
            )}

            {loadingDiscountLoading ? (
              <TableSkeleton rowCount={4} colCount={5} />
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg">Range Configuration</CardTitle>
                    <CardDescription>
                      Select one premium type and configure all rows for that selection.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={addLoadingDiscountRow}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Row
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 max-w-xs">
                    <Label className="mb-2 block">Premium Selection</Label>
                    <Select
                      value={loadingDiscountConfig.premiumSelection}
                      onValueChange={(value) =>
                        {
                          setLoadingDiscountConfig((prev) => ({
                            ...prev,
                            premiumSelection: value as RolePremiumSelection,
                          }));
                          setLoadingDiscountValidationError(null);
                        }
                      }
                    >
                      <SelectTrigger
                        className={`w-full ${loadingDiscountValidationError ? 'border-destructive focus:ring-destructive' : ''}`}
                      >
                        <SelectValue placeholder="Select Premium" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sumInsured">Sum Insured</SelectItem>
                        <SelectItem value="basePremium">Base Premium</SelectItem>
                      </SelectContent>
                    </Select>
                    {loadingDiscountValidationError && (
                      <p className="mt-2 text-sm text-destructive">
                        {loadingDiscountValidationError}
                      </p>
                    )}
                  </div>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Pricing Type</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingDiscountConfig.rows.map((row, index) => (
                          <TableRow key={row.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <FormattedNumberInput
                                  value={row.from}
                                  min={String(getMinimumFromValue(index, loadingDiscountConfig.rows))}
                                  step="1"
                                  className={`w-full ${loadingDiscountRowErrors[row.id]?.from ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                  onChange={(value) =>
                                    updateLoadingDiscountRow(row.id, 'from', value)
                                  }
                                />
                                {loadingDiscountRowErrors[row.id]?.from && (
                                  <p className="text-xs text-destructive">
                                    {loadingDiscountRowErrors[row.id]?.from}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <FormattedNumberInput
                                  value={row.to}
                                  min={String(Math.max(Number(row.from ?? 0) || 0, 0))}
                                  step="1"
                                  className={`w-full ${loadingDiscountRowErrors[row.id]?.to ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                  onChange={(value) => updateLoadingDiscountRow(row.id, 'to', value)}
                                />
                                {loadingDiscountRowErrors[row.id]?.to && (
                                  <p className="text-xs text-destructive">
                                    {loadingDiscountRowErrors[row.id]?.to}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[180px]">
                              <Select
                                value={row.pricingType}
                                onValueChange={(value) =>
                                  updateLoadingDiscountRow(
                                    row.id,
                                    'pricingType',
                                    value as RolePricingType,
                                  )
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">Percentage</SelectItem>
                                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 min-w-[180px]">
                                <FormattedNumberInput
                                  value={row.value}
                                  min="0"
                                  className="w-[140px] min-w-[140px]"
                                  onChange={(value) =>
                                    updateLoadingDiscountRow(row.id, 'value', value)
                                  }
                                />
                                <span className="min-w-[28px] text-sm text-muted-foreground whitespace-nowrap">
                                  {row.pricingType === 'percentage' ? '%' : 'AED'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeLoadingDiscountRow(row.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setLoadingDiscountDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveLoadingDiscount} disabled={loadingDiscountSaving}>
                {loadingDiscountSaving ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
