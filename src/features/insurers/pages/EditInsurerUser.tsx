import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, User, Save, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  updateUser,
  type UpdateUserRequestBody,
  type UpdateUserResponseBody,
  activateUser,
  deactivateUser,
} from '@/features/auth/api/users';
import { getUserById, type GetUserByIdResponseBody } from '@/features/auth/api/users';
import { getRolesPermissions, assignRoleToUser, type Role } from '@/features/auth/api/roles';
import { getInsurerCompanyId } from '@/lib/auth';
import { FormSkeleton } from '@/components/loaders/FormSkeleton';

export default function EditInsurerUser() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams();
  const { toast } = useToast();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [userData, setUserData] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    isAdmin: false,
    roleId: '',
    status: 'ACTIVE',
    createdDate: '',
    activeSince: '',
    inactiveSince: '',
    lastLogin: '',
    isActive: true,
    user_type: '',
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setErrorMessage(null);

        // 1. Fetch User Data First
        let userDataResponse: GetUserByIdResponseBody;
        try {
          // Note: We don't always have an organizationId yet, so we fetch with just userId
          // (Backend should return basic user info regardless)
          userDataResponse = await getUserById(userId || '');
        } catch (err: unknown) {
          const error = err as { status?: number; message?: string };
          if (error?.status === 404) {
            setErrorMessage(`User not found (ID: ${userId}).`);
          } else {
            setErrorMessage(error?.message || 'Failed to load user.');
          }
          return;
        }

        if (!isMounted) return;

        // 2. Identify the correct organization context FROM the user object
        const userType = userDataResponse.user_type?.toLowerCase() || '';
        const isPlatformAdmin =
          userType === 'market_admin' || userType === 'market-admin' || userType === 'admin';

        const userOrgId =
          (userDataResponse as GetUserByIdResponseBody & { organizationId?: string }).organizationId ||
          (userDataResponse as GetUserByIdResponseBody & { organization_id?: string })
            .organization_id;
        const stateOrgId = location.state?.organizationId;
        const storageCompanyId = getInsurerCompanyId()?.toString();

        // 3. Determine if this user belongs to a Broker (for role context and type preservation)
        const stateOrgType = location.state?.organizationType;
        const isBroker = stateOrgType === 'Broker';

        // Context Logic:
        // Market Admins / Platform Admins should fetch platform roles (companyId = undefined)
        // Organization users (Insurers/Brokers) should use their respective organizationId
        const companyId = isPlatformAdmin ? undefined : userOrgId || stateOrgId || storageCompanyId;

        // 3. Fetch Roles based on the identified context
        let rolesResponse: Role[] = [];
        try {
          const rolesData = await getRolesPermissions(companyId?.toString());
          rolesResponse = rolesData.roles.filter((r) => r.type === 'main');
          if (isMounted) setRoles(rolesResponse);
        } catch (rolesErr) {
          console.error('Failed to fetch roles for context', companyId, rolesErr);
        }

        // 4. Finalize User Data State
        const userRoleIndicator =
          userDataResponse.roleName || userDataResponse.role || userDataResponse.user_type;
        const matchedRole = userDataResponse.roleId
          ? rolesResponse.find((r) => r.id === userDataResponse.roleId) ||
            rolesResponse.find(
              (r) => r.name === userRoleIndicator || r.id === userDataResponse.role,
            )
          : undefined;

        setUserData((prev) => ({
          ...prev,
          id: String(userDataResponse.id),
          name: userDataResponse.name || prev.name || '',
          email: userDataResponse.email,
          password: '********',
          isAdmin:
            userDataResponse.user_type === 'admin' ||
            userDataResponse.user_type === 'market_admin' ||
            userDataResponse.user_type === 'market-admin',
          roleId: matchedRole?.id || '',
          status: userDataResponse.status || 'ACTIVE',
          isActive:
            typeof userDataResponse.isActive === 'boolean'
              ? userDataResponse.isActive
              : prev.isActive,
          user_type: userDataResponse.user_type || '',
        }));
      } catch (err: unknown) {
        console.error('Error in EditInsurerUser initialize:', err);
        setErrorMessage('An unexpected error occurred while loading user details.');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [userId, location.state?.organizationId, location.state?.organizationType]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-6 cityscape-bg">
        <div className="w-full max-w-7xl mx-auto">
          <FormSkeleton pairs={6} />
        </div>
      </div>
    );
  }

  const handleSave = () => {
    showConfirmDialog(
      {
        title: 'Confirm Changes',
        description: `Are you sure you want to save the changes to ${userData.name}'s account?`,
        confirmText: 'Save Changes',
      },
      async () => {
        try {
          setSubmitting(true);
          setErrorMessage(null);
          const stateOrgId = location.state?.organizationId;
          const storageCompanyId = getInsurerCompanyId()?.toString();
          const companyId = stateOrgId !== undefined ? stateOrgId : storageCompanyId;

          const stateOrgType = location.state?.organizationType;
          const isBroker = stateOrgType === 'Broker' || userData.user_type === 'broker';

          const payload: UpdateUserRequestBody = {
            name: userData.name || undefined,
            email: userData.email || undefined,
            password:
              userData.password && userData.password !== '********' ? userData.password : undefined,
            user_type:
              userData.user_type === 'market-admin'
                ? 'market_admin'
                : isBroker
                  ? 'broker'
                  : 'insurer', // Correctly determine final type
            roleId: userData.roleId,
          };
          const response: UpdateUserResponseBody = await updateUser(userId || userData.id, payload);

          // Update role if changed
          if (userData.roleId) {
            await assignRoleToUser(userId || userData.id, userData.roleId, companyId);
          }

          const returnPath = location.pathname.startsWith('/market-admin')
            ? `/market-admin/user-management${stateOrgId ? `?orgId=${stateOrgId}` : ''}`
            : '/insurer/user-management';

          toast({ title: response.message || 'User updated' });

          navigate(returnPath);
        } catch (err: unknown) {
          const error = err as { status?: number; message?: string };
          const status = error?.status;
          const message = error?.message;
          if (status === 400)
            setErrorMessage(message || 'Invalid data. Check inputs and try again.');
          else if (status === 401) setErrorMessage('You are not authenticated. Please log in.');
          else if (status === 403) setErrorMessage("You don't have permission to update users.");
          else if (status && status >= 500)
            setErrorMessage('Server error. Please try again later.');
          else setErrorMessage(message || 'Failed to update user.');
        } finally {
          setSubmitting(false);
        }
      },
    );
  };

  const handleStatusChange = (checked: boolean) => {
    const newStatus = checked ? 'ACTIVE' : 'INACTIVE';
    setPendingStatus(newStatus);

    showConfirmDialog(
      {
        title: `${newStatus === 'ACTIVE' ? 'Activate' : 'Deactivate'} User`,
        description: `Are you sure you want to ${
          newStatus === 'ACTIVE' ? 'activate' : 'deactivate'
        } ${userData.name}?${
          newStatus === 'INACTIVE' ? ' This will disable their access to the system.' : ''
        }`,
        confirmText: newStatus === 'ACTIVE' ? 'Activate' : 'Deactivate',
        variant: newStatus === 'INACTIVE' ? 'destructive' : 'default',
      },
      async () => {
        try {
          setSubmitting(true);
          setErrorMessage(null);
          if (newStatus === 'ACTIVE') {
            await activateUser(userId || userData.id);
          } else {
            await deactivateUser(userId || userData.id);
          }
          setUserData((prev) => ({ ...prev, status: newStatus, isActive: newStatus === 'ACTIVE' }));
          toast({
            title: 'User status updated',
            description: `${userData.name} has been ${newStatus.toLowerCase()}.`,
          });
        } catch (err: unknown) {
          const error = err as { status?: number; message?: string };
          const status = error?.status;
          const message = error?.message;
          if (status === 400) setErrorMessage(message || 'Invalid request.');
          else if (status === 401) setErrorMessage('You are not authenticated. Please log in.');
          else if (status === 403) setErrorMessage("You don't have permission to change status.");
          else if (status && status >= 500)
            setErrorMessage('Server error. Please try again later.');
          else setErrorMessage(message || 'Failed to update status.');
        } finally {
          setSubmitting(false);
          setPendingStatus(null);
        }
      },
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-6 cityscape-bg">
      <div className="w-full max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const returnPath = location.pathname.startsWith('/market-admin')
                  ? `/market-admin/user-management${location.state?.organizationId ? `?orgId=${location.state.organizationId}` : ''}`
                  : '/insurer/user-management';
                navigate(returnPath);
              }}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">Edit User</h1>
                {/* {location.state?.organizationName && (
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    {location.state.organizationName}
                  </Badge>
                )} */}
              </div>
              <p className="text-muted-foreground">Modify user account details</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-card p-4 rounded-lg border">
            <Label htmlFor="userStatus" className="text-sm font-medium">
              {userData.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </Label>
            <Switch
              id="userStatus"
              checked={userData.isActive}
              onCheckedChange={handleStatusChange}
            />
          </div>
        </div>

        {/* Edit User Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              User Details
            </CardTitle>
            <CardDescription>Update the user information and settings</CardDescription>
          </CardHeader>
          <CardContent
            className={`space-y-6 transition-all duration-300 ${
              userData.status === 'INACTIVE' ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            {errorMessage && (
              <Alert variant="destructive">
                <AlertTitle>Failed to update user</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="userName">Full Name *</Label>
                <Input
                  id="userName"
                  placeholder="Enter full name"
                  value={userData.name}
                  onChange={(e) => setUserData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email Address *</Label>
                <Input
                  id="userEmail"
                  type="email"
                  autoComplete="off"
                  placeholder="Enter email address"
                  value={userData.email}
                  onChange={(e) => setUserData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userPassword">Password</Label>
              <div className="relative">
                <Input
                  id="userPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password (leave blank to keep current)"
                  value={userData.password}
                  onChange={(e) => setUserData((prev) => ({ ...prev, password: e.target.value }))}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userRole">Role</Label>
              <Select
                value={userData.roleId}
                onValueChange={(value) => setUserData((prev) => ({ ...prev, roleId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <Button
                variant="outline"
                onClick={() => {
                  const returnPath = location.pathname.startsWith('/market-admin')
                    ? `/market-admin/user-management${location.state?.organizationId ? `?orgId=${location.state.organizationId}` : ''}`
                    : '/insurer/user-management';
                  navigate(returnPath);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} className="gap-2" disabled={submitting}>
                <Save className="w-4 h-4" />
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <ConfirmDialog />
      </div>
    </div>
  );
}
