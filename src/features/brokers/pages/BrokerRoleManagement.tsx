import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Plus, Search, Edit, Trash2, Shield, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { TableSkeleton } from '@/components/loaders/TableSkeleton';
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
  PERMISSION_KEYS,
  type PermissionPayload,
  type PermissionAction,
} from '@/features/auth/api/roles';
import { getAuthUser, getBrokerCompanyId } from '@/lib/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { AuthUser } from '@/features/auth/api/auth';
import { getUserFriendlyMessage, getErrorTitle } from '@/lib/errorMessages';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';

interface BrokerRoleManagementProps {
  embedded?: boolean;
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

export default function BrokerRoleManagement({ embedded = false }: BrokerRoleManagementProps) {
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

  const { toast } = useToast();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  const navigate = useNavigate();
  const authUser = getAuthUser<AuthUser>();
  const userType = (authUser?.user_type || 'broker').toLowerCase();

  const openUsersSheet = (role: Role) => {
    const orgId = getBrokerCompanyId()?.toString() || '';
    const params = new URLSearchParams({
      roleId: role.id,
      roleName: role.name,
      ...(orgId ? { orgId } : {}),
    });
    navigate(`/broker/user-management/role-users?${params.toString()}`);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = getBrokerCompanyId()?.toString();
      if (!companyId) {
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

      setRoles(data.roles || []);
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
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    permissionGroups.forEach((group) => {
      // Handle both grouped and flat list from API
      const perms = Array.isArray(group.permissions)
        ? group.permissions
        : ([group] as unknown as any[]);
      perms.forEach((perm) => {
        const key = (perm as any).key || (perm as any).permissionKey;
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
      // Fetch full role details including permissions
      setLoadingRole(true);
      try {
        const companyId = getBrokerCompanyId()?.toString();
        const fullRole = await getRoleById(role.id, companyId);
        setEditingRole(fullRole);
        setFormName(fullRole.name);
        setFormDescription(fullRole.description || '');
        setFormPermissions(initializeFormPermissions(fullRole));
        setIsDialogOpen(true);
      } catch (error) {
        toast({
          title: getErrorTitle(error),
          description: getUserFriendlyMessage(
            error,
            'Unable to load role details. Please try again.',
          ),
          variant: 'destructive',
        });
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

    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        permissions: getPermissionPayload(),
      };

      if (editingRole) {
        const companyId = getBrokerCompanyId()?.toString();
        await updateRole(editingRole.id, payload, companyId);
        toast({ title: 'Success', description: 'Role updated successfully.' });
      } else {
        const companyId = getBrokerCompanyId()?.toString();
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
          const companyId = getBrokerCompanyId()?.toString();
          await deleteRole(role.id, companyId);
          toast({ title: 'Success', description: `Role "${role.name}" deleted successfully.` });
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
    // Priority 1: Use the new direct permissionCount
    if (typeof role.permissionCount === 'number') {
      return role.permissionCount;
    }

    // Priority 2: Fallback to manual count if full permissions array is present
    const perms =
      role.permissions || (role as any).role_permissions || (role as any).rolePermissions;
    if (!perms || !Array.isArray(perms)) return 0;

    return perms.reduce((count, perm) => {
      if (!perm.actions) return count;

      if (Array.isArray(perm.actions)) {
        return count + perm.actions.length;
      }

      if (typeof perm.actions === 'object') {
        const actionCount = Object.values(perm.actions).filter(
          (v) => v === true || v === 'true',
        ).length;
        return count + actionCount;
      }

      return count;
    }, 0);
  };

  // Wrapper classes for embedded vs standalone
  const wrapperClass = embedded
    ? 'space-y-6'
    : 'min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-6 cityscape-bg';

  return (
    <div className={wrapperClass}>
      <div className={embedded ? 'space-y-6' : 'max-w-7xl mx-auto space-y-8'}>
        {!getBrokerCompanyId() && (
          <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Organization Not Selected</AlertTitle>
            <AlertDescription>
              Please select an organization to manage roles and permissions.
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex items-center justify-end">
          <Button
            onClick={() => handleOpenDialog()}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Role
          </Button>
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
                className="pl-10 max-w-sm"
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
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableSkeleton rowCount={3} colCount={5} />
                  ) : filteredRoles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
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
                            type="button"
                            className="flex items-center justify-center gap-1 mx-auto text-primary hover:underline cursor-pointer"
                            onClick={() => openUsersSheet(role)}
                          >
                            <Users className="w-4 h-4" />
                            {role.userCount ?? 0}
                          </button>
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
                    placeholder="e.g., Senior Agent"
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

                {permissionGroups.map((group: any) => {
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
                        {perms.map((perm: any) => {
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
                              className={`flex items-center justify-between p-3 rounded-md border ${isAllowed ? 'bg-background' : 'bg-muted/50 opacity-60'
                                }`}
                            >
                              <span className="font-medium text-sm">{perm.name}</span>
                              <div className="flex items-center gap-4">
                                {(['view', 'create', 'update', 'delete'] as PermissionAction[]).map(
                                  (action) => {
                                    const isRestricted = !isPermissionAllowed(
                                      superAdminMatrix,
                                      'broker',
                                      perm.key,
                                    );

                                    return (
                                      <div
                                        key={action}
                                        className="flex flex-col items-center gap-2 p-3 bg-muted/30 rounded-lg border border-transparent hover:border-primary/20 transition-all"
                                      >
                                        <Label
                                          htmlFor={`${perm.id}-${action}`}
                                          className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold"
                                        >
                                          {action}
                                        </Label>
                                        <Checkbox
                                          id={`${perm.id}-${action}`}
                                          disabled={isRestricted}
                                          checked={permState[action]}
                                          onCheckedChange={() => handleActionToggle(key, action)}
                                        />
                                      </div>
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
        <ConfirmDialog />
      </div>
    </div>
  );
}
