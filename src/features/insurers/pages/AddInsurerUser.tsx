import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, UserPlus, Loader2, EyeOff, Eye, Building2 } from 'lucide-react';
import { createUser, updateUser, type CreateUserRequestBody } from '@/features/auth/api/users';
import { getRolesPermissions, assignRoleToUser, type Role } from '@/features/auth/api/roles';
import { listInsurers } from '@/features/insurers/api/insurers';
import { listBrokersViaManagement } from '@/features/brokers/api/brokers';
import { useToast } from '@/shared/hooks/use-toast';
import { getInsurerCompanyId } from '@/lib/auth';

export default function AddInsurerUser() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [organizations, setOrganizations] = useState<{ id: string; name: string; type: string }[]>(
    [],
  );
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();

  const isMarketAdminPortal = location.pathname.startsWith('/market-admin');
  const stateOrgId = location.state?.organizationId;

  const schema = z.object({
    name: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    roleId: z.string().min(1, 'Select a role'),
    userType: z.enum(['market_admin', 'insurer']).default('insurer'),
    organizationId: z.string().optional(),
  });

  type FormData = z.infer<typeof schema>;
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      roleId: '',
      userType: stateOrgId ? 'insurer' : 'market_admin',
      organizationId: stateOrgId || '',
    },
  });

  const selectedUserType = form.watch('userType');
  const selectedOrgId = form.watch('organizationId');

  // Fetch organizations for Market Admin global view
  useEffect(() => {
    if (isMarketAdminPortal && !stateOrgId) {
      async function loadOrgs() {
        setLoadingOrgs(true);
        try {
          const [insurersRes, brokersRes] = await Promise.all([
            listInsurers({ limit: 100 }),
            listBrokersViaManagement('', { limit: 100 }),
          ]);

          const orgs = [
            ...insurersRes.data.map((i) => ({ id: i.id, name: i.name, type: 'Insurer' })),
            ...brokersRes.data.map((b) => ({ id: b.id, name: b.name, type: 'Broker' })),
          ];
          setOrganizations(orgs);
        } catch (error) {
          console.error('Failed to load organizations', error);
        } finally {
          setLoadingOrgs(false);
        }
      }
      loadOrgs();
    }
  }, [isMarketAdminPortal, stateOrgId]);

  useEffect(() => {
    async function loadRoles() {
      setLoadingRoles(true);
      try {
        const storageCompanyId = getInsurerCompanyId()?.toString();

        // Context logic:
        // if userType is market_admin -> fetch platform roles (no orgId)
        // if userType is insurer -> fetch from state orgId, form selected orgId, or storage
        const companyId =
          selectedUserType === 'market_admin'
            ? undefined
            : stateOrgId || selectedOrgId || storageCompanyId;

        const data = await getRolesPermissions(companyId);
        // Filter to main roles only
        const fetchedRoles = data.roles.filter((r) => r.type === 'main');
        setRoles(fetchedRoles);

        // Reset roleId if current selection is not in the new roles list
        if (
          form.getValues('roleId') &&
          !fetchedRoles.find((r) => r.id === form.getValues('roleId'))
        ) {
          form.setValue('roleId', '');
        }
      } catch (error) {
        console.error('Failed to load roles', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load roles',
          description: 'Could not fetch available roles for the selected user type.',
        });
      } finally {
        setLoadingRoles(false);
      }
    }
    loadRoles();
  }, [toast, stateOrgId, selectedUserType, selectedOrgId, form]);

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    try {
      const storageCompanyId = getInsurerCompanyId()?.toString();

      // Determine final org context
      const companyId =
        values.userType === 'market_admin'
          ? undefined
          : stateOrgId || values.organizationId || storageCompanyId;

      // 1. Identify organization type (Insurer vs Broker)
      // Preference: State-passed type (most reliable when navigating from filtered view)
      // Fallback: Lookup in available organizations list
      const stateOrgType = location.state?.organizationType;
      const selectedOrg = organizations.find((org) => org.id.toString() === companyId);
      const orgType = stateOrgType || selectedOrg?.type;
      const isBroker = orgType === 'Broker';
      const determinedUserType =
        values.userType === 'market_admin' ? 'market_admin' : isBroker ? 'broker' : 'insurer';

      // Step 1: Create user (Match Broker flow: user_type = portal, type = user/admin)
      const createPayload: CreateUserRequestBody = {
        name: values.name,
        email: values.email,
        password: values.password,
        user_type: determinedUserType,
        type: values.userType === 'market_admin' ? 'admin' : 'user', // Permission flag
        organizationId: companyId,
      };

      const createdUser = await createUser(createPayload);

      if (!createdUser?.id) {
        throw new Error('Failed to retrieve user ID after creation');
      }

      // Step 2: Assign to Organization (MANDATORY PATCH for association)
      if (companyId && values.userType === 'insurer') {
        await updateUser(createdUser.id, {
          organizationId: companyId,
          user_type: determinedUserType,
        });
      }

      // Step 3: Assign role to user
      if (values.roleId) {
        try {
          await assignRoleToUser(createdUser.id, values.roleId, companyId);
        } catch (roleError) {
          toast({
            variant: 'default',
            title: 'User created',
            description: `User created but role assignment failed. Please assign role manually.`,
          });
          navigate(
            isMarketAdminPortal ? '/market-admin/user-management' : '/insurer/user-management',
          );
          return;
        }
      }

      const returnPath = isMarketAdminPortal
        ? `/market-admin/user-management${
            stateOrgId || values.organizationId
              ? `?orgId=${stateOrgId || values.organizationId}`
              : ''
          }`
        : '/insurer/user-management';

      toast({
        variant: 'default',
        title: 'User created successfully',
        description: `User ${values.name} has been created as a ${
          values.userType === 'market_admin' ? 'Platform Admin' : 'Organization User'
        }.`,
      });
      navigate(returnPath);
    } catch (error) {
      const err = error as Error & { message?: string };
      toast({
        variant: 'destructive',
        title: 'Failed to create user',
        description: err?.message || 'Request failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-6 cityscape-bg">
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const returnPath = location.pathname.startsWith('/market-admin')
                ? `/market-admin/user-management${stateOrgId ? `?orgId=${stateOrgId}` : ''}`
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
              <h1 className="text-3xl font-bold text-foreground">Add New User</h1>
              {location.state?.organizationName && (
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  {location.state.organizationName}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">Create a new user account</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              User Details
            </CardTitle>
            <CardDescription>Enter the user information to create a new account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {!stateOrgId && isMarketAdminPortal && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <FormField
                      control={form.control}
                      name="userType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>User Type</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select user type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="market_admin">
                                  Platform Admin (Market Portal)
                                </SelectItem>
                                <SelectItem value="insurer">Organization User</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            Platform Admins have access to the Market Portal.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedUserType === 'insurer' && (
                      <FormField
                        control={form.control}
                        name="organizationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Select Organization
                              {loadingOrgs && <Loader2 className="w-3 h-3 animate-spin" />}
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={loadingOrgs ? 'Loading...' : 'Select organization'}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {organizations.map((org) => (
                                  <SelectItem key={org.id} value={org.id}>
                                    <div className="flex items-center gap-2">
                                      <Building2 className="w-3 h-3 text-muted-foreground" />
                                      {org.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>Tie user to a specific insurer.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Full Name <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Email Address <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            autoComplete="off"
                            placeholder="Enter email address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Password <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              autoComplete="off"
                              placeholder="Enter password"
                              className="pr-10"
                              {...field}
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="roleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role <span className="text-destructive">*</span></FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={loadingRoles}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={loadingRoles ? 'Loading roles...' : 'Select user role'}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const returnPath = location.pathname.startsWith('/market-admin')
                        ? `/market-admin/user-management${stateOrgId ? `?orgId=${stateOrgId}` : ''}`
                        : '/insurer/user-management';
                      navigate(returnPath);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="gap-2" disabled={form.formState.isSubmitting}>
                    <UserPlus className="w-4 h-4" />
                    Add User
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
