import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Save, Upload, X, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { createEnvironment, type CreateEnvironmentRequest } from '@/features/super-admin/api/super-admin';
import { useState } from 'react';

// Preset colors for the theme picker (per backend guide)
const PRESET_COLORS = [
  '#80a9ea', // Light Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
];

// Zod validation schema
const createEnvironmentSchema = z
  .object({
    // Basic Details
    name: z
      .string()
      .min(2, 'Environment name must be at least 2 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Environment name must contain only letters and spaces'),
    clientName: z
      .string()
      .min(2, 'Client name must be at least 2 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Client name must contain only letters and spaces'),
    description: z.string().optional(),

    // Branding (per backend integration guide)
    themeColor: z.string().optional(),

    // Admin Access
    adminName: z
      .string()
      .min(2, 'Admin name must be at least 2 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Admin name must contain only letters and spaces'),
    adminEmail: z.string().email('Invalid email address'),
    adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.adminPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type CreateEnvironmentFormData = z.infer<typeof createEnvironmentSchema>;

const CreateEnvironment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<CreateEnvironmentFormData>({
    resolver: zodResolver(createEnvironmentSchema),
    defaultValues: {
      name: '',
      clientName: '',
      description: '',
      themeColor: '#80a9ea', // Default light blue (HEX)
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: CreateEnvironmentFormData) => {
    try {
      // Map form data to API request format
      const requestData: CreateEnvironmentRequest = {
        name: data.name,
        clientName: data.clientName,
        description: data.description || null,
        adminName: data.adminName,
        adminEmail: data.adminEmail,
        adminPassword: data.adminPassword,
        themeColor: data.themeColor || undefined,
        logoFile: logoFile || undefined,
      };

      // Call the API
      const response = await createEnvironment(requestData);

      toast({
        title: 'Environment Created',
        description:
          response.message || `Environment "${data.name}" has been created successfully.`,
      });

      // Navigate to authority matrix or dashboard
      navigate('/super-admin/dashboard');
    } catch (error: any) {
      console.error('Failed to create environment:', error);

      // Extract error message
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create environment. Please try again.';

      toast({
        title: 'Creation Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate('/super-admin/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Create Environment</h1>
              <p className="text-lg text-muted-foreground">
                Create a new environment for a client with admin access
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Details Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Details</CardTitle>
                  <CardDescription>
                    Enter the basic information for this environment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Environment Name *</Label>
                        <FormControl>
                          <Input
                            placeholder="e.g., UAE Market, Saudi Market"
                            {...field}
                            onKeyDown={(e) => {
                              // Prevent numbers and special characters, allow letters, spaces, and control keys
                              if (!/^[a-zA-Z\s]$/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              // Remove any characters that are not letters or spaces
                              const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Client Name *</Label>
                        <FormControl>
                          <Input
                            placeholder="e.g., UAE Insurance Authority"
                            {...field}
                            onKeyDown={(e) => {
                              // Prevent numbers and special characters, allow letters, spaces, and control keys
                              if (!/^[a-zA-Z\s]$/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              // Remove any characters that are not letters or spaces
                              const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Description</Label>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of this environment..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


                </CardContent>
              </Card>

              {/* Branding Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Branding</CardTitle>
                  <CardDescription>Customize the look and feel for this market</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="themeColor"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Theme Color</Label>
                        <div className="flex flex-col gap-3">
                          {/* Preset color swatches */}
                          <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`w-10 h-10 rounded-md border-2 transition-all ${field.value === color
                                  ? 'border-primary ring-2 ring-primary/30'
                                  : 'border-transparent hover:border-muted-foreground/50'
                                  }`}
                                style={{ backgroundColor: color }}
                                onClick={() => field.onChange(color)}
                              />
                            ))}
                          </div>
                          {/* Custom color picker */}
                          <div className="flex items-center gap-3">
                            <FormControl>
                              <Input
                                type="color"
                                value={field.value || '#3B82F6'}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="w-16 h-10 p-1 cursor-pointer"
                              />
                            </FormControl>
                            <Input
                              type="text"
                              placeholder="#3B82F6"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label>Logo</Label>
                    {!logoPreview ? (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:bg-muted/50 transition-colors">
                        <div className="text-center">
                          <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                          <div className="mt-4">
                            <label htmlFor="logo-upload" className="cursor-pointer relative">
                              <span className="text-sm font-medium text-primary hover:text-primary/80">
                                Click to upload
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {' '}
                                or drag and drop
                              </span>
                              <input
                                id="logo-upload"
                                type="file"
                                className="sr-only"
                                accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  // Validate file type
                                  const allowedTypes = [
                                    'image/jpeg',
                                    'image/png',
                                    'image/gif',
                                    'image/svg+xml',
                                    'image/webp',
                                  ];
                                  if (!allowedTypes.includes(file.type)) {
                                    toast({
                                      title: 'Invalid file type',
                                      description: 'Allowed: JPEG, PNG, SVG, WebP',
                                      variant: 'destructive',
                                    });
                                    return;
                                  }

                                  // Validate file size (max 5MB)
                                  if (file.size > 5 * 1024 * 1024) {
                                    toast({
                                      title: 'File too large',
                                      description: 'Maximum file size is 5MB',
                                      variant: 'destructive',
                                    });
                                    return;
                                  }

                                  setLogoFile(file);
                                  const objectUrl = URL.createObjectURL(file);
                                  setLogoPreview(objectUrl);
                                }}
                              />
                            </label>
                            <p className="text-xs text-muted-foreground mt-2">
                              JPEG, PNG, SVG, WebP up to 5MB
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 p-3 bg-muted rounded-lg border border-border">
                        <div className="w-16 h-16 border rounded-lg overflow-hidden bg-white flex items-center justify-center relative checkered-bg">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{logoFile?.name || 'Logo Selected'}</p>
                          <p className="text-xs text-muted-foreground">
                            {logoFile?.size ? (logoFile.size / 1024).toFixed(1) : 0} KB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLogoFile(null);
                            setLogoPreview(null);
                          }}
                          className="text-muted-foreground hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Admin Access Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Admin Access</CardTitle>
                  <CardDescription>
                    Create the initial market admin account for this environment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="adminName"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Admin Full Name *</Label>
                        <FormControl>
                          <Input
                            placeholder="Enter admin's full name"
                            {...field}
                            onKeyDown={(e) => {
                              // Prevent numbers and special characters, allow letters, spaces, and control keys
                              if (!/^[a-zA-Z\s]$/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              // Remove any characters that are not letters or spaces
                              const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Admin Email *</Label>
                        <FormControl>
                          <Input type="email" placeholder="admin@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="adminPassword"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Password *</Label>
                          <div className="relative">
                            <FormControl>
                              <Input type={showPassword ? "text" : "password"} placeholder="Minimum 8 characters" className="pr-10" {...field} />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:bg-transparent hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Confirm Password *</Label>
                          <div className="relative">
                            <FormControl>
                              <Input type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter password" className="pr-10" {...field} />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:bg-transparent hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/super-admin/dashboard')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  <Save className="w-4 h-4 mr-2" />
                  {form.formState.isSubmitting ? 'Creating...' : 'Create Environment'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default CreateEnvironment;


