import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { getBrokerCompanyId } from '@/lib/auth';
import { FormSkeleton } from '@/components/loaders/FormSkeleton';

export default function EditUser() {
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
    isActive: true,
    lastLogin: '',
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

        const stateOrgId = location.state?.organizationId;
        const storageCompanyId = getBrokerCompanyId()?.toString();
        const companyId = stateOrgId !== undefined ? stateOrgId : storageCompanyId;

        // Fetch Roles
        let rolesResponse: Role[] = [];
        try {
          const rolesData = await getRolesPermissions(companyId);
          rolesResponse = rolesData.roles.filter((r) => r.type === 'main');
          if (isMounted) setRoles(rolesResponse);
        } catch (rolesErr) {
          // Failure to fetch roles shouldn't block the whole page
        }

        // Fetch User Data
        try {
          const userDataResponse = await getUserById(userId || '');
          if (!isMounted) return;

          const userRoleIndicator =
            userDataResponse.roleName || userDataResponse.role || userDataResponse.user_type;
          const matchedRole =
            rolesResponse.find((r) => r.id === userDataResponse.roleId) ||
            rolesResponse.find(
              (r) => r.name === userRoleIndicator || r.id === userDataResponse.role,
            ) ||
            rolesResponse.find((r) => r.name === 'Broker') ||
            rolesResponse[0];

          setUserData((prev) => ({
            ...prev,
            id: String(userDataResponse.id),
            name: userDataResponse.name || prev.name || '',
            email: userDataResponse.email,
            password: '********',
            isAdmin: userDataResponse.user_type === 'admin',
            roleId: matchedRole ? matchedRole.id : '',
            status: userDataResponse.status || 'ACTIVE',
            isActive: userDataResponse.isActive,
          }));
        } catch (err: unknown) {
          if (!isMounted) return;
          const error = err as { status?: number; message?: string };
          const status = error?.status;
          const message = error?.message;

          if (status === 404) {
            setErrorMessage(`User not found (ID: ${userId}).`);
          } else if (status === 400) setErrorMessage(message || 'Bad request.');
          else if (status === 401) setErrorMessage('You are not authenticated. Please log in.');
          else if (status === 403) setErrorMessage("You don't have permission to view this user.");
          else if (status && (status as any) >= 500)
            setErrorMessage('Server error. Please try again later.');
          else setErrorMessage(message || 'Failed to load user.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [userId, location.state?.organizationId]);

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
          const storageCompanyId = getBrokerCompanyId()?.toString();
          const companyId = stateOrgId || storageCompanyId;

          const payload: UpdateUserRequestBody = {
            name: userData.name || undefined,
            email: userData.email || undefined,
            password:
              userData.password && userData.password !== '********' ? userData.password : undefined,
            user_type: 'broker',
            roleId: userData.roleId,
          };
          const response: UpdateUserResponseBody = await updateUser(userId || userData.id, payload);

          // Update role if changed
          if (userData.roleId) {
            await assignRoleToUser(userId || userData.id, userData.roleId, companyId);
          }

          toast({ title: response.message || 'User updated' });
          navigate('/broker/user-management');
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
        } ${userData.name}?`,
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
              onClick={() => navigate('/broker/user-management')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Edit User</h1>
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
              <Button variant="outline" onClick={() => navigate('/broker/user-management')}>
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
