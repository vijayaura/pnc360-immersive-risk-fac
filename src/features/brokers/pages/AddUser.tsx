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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, UserPlus, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createUser, updateUser, type CreateUserRequestBody } from '@/features/auth/api/users';
import { getRolesPermissions, assignRoleToUser, type Role } from '@/features/auth/api/roles';
import { useToast } from '@/shared/hooks/use-toast';
import { getBrokerCompanyId } from '@/lib/auth';

export default function AddUser() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadRoles() {
      setLoadingRoles(true);
      try {
        const stateOrgId = (location.state as { organizationId?: string })?.organizationId;
        const storageCompanyId = getBrokerCompanyId()?.toString();
        const companyId = stateOrgId !== undefined ? stateOrgId : storageCompanyId;

        const data = await getRolesPermissions(companyId);
        // Filter to main roles only
        setRoles(data.roles.filter((r) => r.type === 'main'));
      } catch (error) {
        console.error('Failed to load roles', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load roles',
          description: 'Could not fetch available roles.',
        });
      } finally {
        setLoadingRoles(false);
      }
    }
    loadRoles();
  }, [toast, location.state]);

  const schema = z.object({
    name: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    roleId: z.string().min(1, 'Select a role'),
  });

  type FormData = z.infer<typeof schema>;
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', roleId: '' },
  });

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    try {
      const selectedRole = roles.find((r) => r.id === values.roleId);
      const stateOrgId = (location.state as { organizationId?: string })?.organizationId;
      const storageCompanyId = getBrokerCompanyId()?.toString();
      const companyId = stateOrgId !== undefined ? stateOrgId : storageCompanyId;

      // Step 1: Create user (floating user)
      const createPayload: CreateUserRequestBody = {
        name: values.name,
        email: values.email,
        password: values.password,
        user_type: 'broker',
        type: 'user',
      };

      const createdUser = await createUser(createPayload);

      if (!createdUser?.id) {
        throw new Error('Failed to retrieve user ID after creation');
      }

      // Step 2: Assign to Organization (MANDATORY PATCH)
      if (companyId) {
        await updateUser(createdUser.id, {
          organizationId: companyId,
        });
      }

      // Step 3: Assign role to user (separate API call)
      if (values.roleId) {
        try {
          await assignRoleToUser(createdUser.id, values.roleId, companyId);
        } catch (roleError) {
          // User created but role assignment failed
          toast({
            variant: 'default',
            title: 'User created',
            description: `User created and assigned to organization, but role assignment failed. Please assign role manually.`,
          });
          navigate('/broker/user-management');
          return;
        }
      }

      toast({
        variant: 'default',
        title: 'User created successfully',
        description: `${values.email} has been added with role "${selectedRole?.name}".`,
      });
      navigate('/broker/user-management');
    } catch (error) {
      const err = error as Error & { message?: string };
      const message = err?.message || 'Request failed';
      toast({
        variant: 'destructive',
        title: 'Failed to create user',
        description: message,
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
            onClick={() => navigate('/broker/user-management')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Add New User</h1>
            <p className="text-muted-foreground">Create a new broker user account</p>
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
                        <FormLabel>Role</FormLabel>
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
                    onClick={() => navigate('/broker/user-management')}
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
