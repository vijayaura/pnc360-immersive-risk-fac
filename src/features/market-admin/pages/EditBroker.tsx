import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useNavigationHistory } from '@/shared/hooks/use-navigation-history';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { PhoneInput } from '@/components/ui/phone-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Upload,
  X,
  UserPlus,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Label } from '@/components/ui/label';

import { useToast } from '@/shared/hooks/use-toast';
import { getBroker, setBrokerStatus } from '@/features/brokers/api/brokers';;
import {
  uploadBrokerFile,
  updateBrokerViaManagement,
  type UpdateBrokerManagementRequest,
} from '@/features/brokers/api/brokers';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import FormSkeleton from '@/components/loaders/FormSkeleton';
import { formatFileSize } from '@/shared/utils/fileUtils';
import { validatePhone } from '@/lib/phone/phone-validation';

const editBrokerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().refine(
    (v) => validatePhone(v?.trim() || undefined, true) === null,
    (v) => ({
      message: validatePhone(v?.trim() || undefined, true) ?? 'Invalid phone number',
    }),
  ),
  licenseNumber: z.string().min(1, 'License number is required'),
  validityStartDate: z.string().min(1, 'Validity start date is required'),
  validityEndDate: z.string().min(1, 'Validity end date is required'),
  adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
  // Admin email/password should not be edited from this screen; keep them optional to avoid validation issues.
  adminUserEmail: z.string().email('Invalid admin email address').optional().or(z.literal('')),
  adminUserPassword: z.string().optional().or(z.literal('')).refine(
    (v) => !v || v.length >= 6,
    'Password must be at least 6 characters',
  ),
});

type EditBrokerForm = z.infer<typeof editBrokerSchema>;

const EditBroker = () => {
  const { navigateBack } = useNavigationHistory();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { brokerId } = useParams<{ brokerId: string }>();
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licenseFileUrl, setLicenseFileUrl] = useState<string | null>(null);
  const [licenseFileId, setLicenseFileId] = useState<string | null>(null);
  const [licenseFileName, setLicenseFileName] = useState<string | null>(null);
  const [licenseFileSize, setLicenseFileSize] = useState<number | null>(null);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoFileUrl, setLogoFileUrl] = useState<string | null>(null);
  const [logoFileId, setLogoFileId] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [logoFileSize, setLogoFileSize] = useState<number | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastFetchedIdRef = useRef<string | null>(null);
  const initialFormValuesRef = useRef<EditBrokerForm | null>(null);

  const form = useForm<EditBrokerForm>({
    resolver: zodResolver(editBrokerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      licenseNumber: '',
      validityStartDate: '',
      validityEndDate: '',
      adminName: '',
      adminUserEmail: '',
      adminUserPassword: '',
    },
  });

  // Load broker data from API
  useEffect(() => {
    const load = async () => {
      if (!brokerId || lastFetchedIdRef.current === brokerId) return;
      lastFetchedIdRef.current = brokerId;

      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getBroker(brokerId);

        const licenseNumber = data.license?.licenseNumber || '';
        const validityStart = data.license?.validityStart || '';
        const validityEnd = data.license?.validityEnd || '';

        const initialValues: EditBrokerForm = {
          name: data.name || '',
          email: data.tenantEmail || data.contact?.email || '',
          phone: data.contactNumber || data.contact?.phone || '',
          licenseNumber: licenseNumber,
          validityStartDate: validityStart ? validityStart.slice(0, 10) : '',
          validityEndDate: validityEnd ? validityEnd.slice(0, 10) : '',
          adminName: data.adminName || '',
          adminUserEmail: data.adminEmail || data.contact?.adminEmail || '',
          adminUserPassword: '',
        };

        form.reset(initialValues);
        initialFormValuesRef.current = initialValues;
        setIsActive((data.status.toLowerCase() || 'active') === 'active' ? true : false);

        // Populate existing files
        if (data.branding?.logoFileUrl) {
          setLogoFileUrl(data.branding.logoFileUrl);
          setLogoFileName(data.branding.logoFileName || 'Company Logo');
          setLogoFileSize(data.branding.logoFileSize || null);
          // Not setting ID implies we don't change it unless user uploads new
        }

        if (data.license?.licenseDocumentUrl) {
          setLicenseFileUrl(data.license.licenseDocumentUrl);
          setLicenseFileName(data.license.licenseDocument || 'License Document');
          setLicenseFileSize(data.license.licenseDocumentSize || null);
        }

        setInitialLoaded(true);
      } catch (err: any) {
        const status = err?.status;
        const friendly =
          status === 400
            ? 'Invalid request while loading broker.'
            : status === 401
              ? 'Session expired. Please log in again.'
              : status === 403
                ? 'You are not authorized to view this broker.'
                : status === 500
                  ? 'Server error while fetching broker.'
                  : err?.message || 'Failed to load broker.';
        setLoadError(friendly);
        toast({ title: 'Error', description: friendly });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [brokerId]);

  const handleToggleStatus = () => {
    const newStatus = !isActive;
    setPendingStatusChange(newStatus);
    setShowStatusDialog(true);
  };

  const [statusChanging, setStatusChanging] = useState(false);
  const confirmStatusChange = async () => {
    if (pendingStatusChange === null || !brokerId) return;
    try {
      setStatusChanging(true);
      await setBrokerStatus(brokerId, pendingStatusChange);
      setIsActive(pendingStatusChange);
      toast({
        title: 'Status Updated',
        description: `Broker has been ${pendingStatusChange ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (err: any) {
      const s = err?.status;
      const friendly =
        s === 400
          ? 'Invalid request'
          : s === 401
            ? 'Session expired'
            : s === 403
              ? 'Not authorized'
              : s === 500
                ? 'Server error'
                : err?.message || 'Status change failed';
      setLoadError(friendly);
      toast({ title: 'Error', description: friendly });
    } finally {
      setShowStatusDialog(false);
      setPendingStatusChange(null);
      setStatusChanging(false);
    }
  };

  const onSubmit = async (values: EditBrokerForm) => {
    // Validate end date is after start date
    const startDate = new Date(values.validityStartDate);
    const endDate = new Date(values.validityEndDate);

    if (endDate <= startDate) {
      toast({
        title: 'Invalid Dates',
        description: 'Validity end date must be after start date.',
        variant: 'destructive',
      });
      return;
    }

    // Prevent update call if nothing has changed in the form and no files were updated
    const hasFileChanges = Boolean(licenseFileId || logoFileId);
    const initialValues = initialFormValuesRef.current;
    const currentValues = form.getValues();

    const hasFormChanges = initialValues
      ? JSON.stringify({ ...initialValues, adminUserPassword: '' }) !==
      JSON.stringify({ ...currentValues, adminUserPassword: '' })
      : true;

    if (!hasFormChanges && !hasFileChanges) {
      toast({
        title: 'No Changes Detected',
        description: 'There are no changes to update.',
      });
      navigate('/market-admin/broker-management');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (!brokerId) throw new Error('Missing broker id');

      const payload: UpdateBrokerManagementRequest = {
        name: values.name,
        adminName: values.adminName,
        contactNumber: values.phone,
      };

      if (values.email) {
        payload.brokerEmail = values.email;
      }

      if (values.licenseNumber) {
        payload.licenseNumber = values.licenseNumber;
      }

      if (values.validityStartDate) {
        payload.validityStartDate = values.validityStartDate;
      }

      if (values.validityEndDate) {
        payload.validityEndDate = values.validityEndDate;
      }

      if (!licenseFileId && !licenseFileUrl) {
        toast({
          title: 'License Required',
          description: 'Please upload a license document before updating the broker.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (!logoFileId && !logoFileUrl) {
        toast({
          title: 'Logo Required',
          description: 'Please upload a company logo before updating the broker.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (licenseFileId) {
        payload.licenseDocumentId = licenseFileId;
      }

      if (logoFileId) {
        payload.companyLogoId = logoFileId;
      }

      if (user?.marketDomain) {
        payload.domain = user.marketDomain;
      }

      await updateBrokerViaManagement(brokerId, payload);

      toast({
        title: 'Broker Updated Successfully',
        description: `${values.name} details have been updated.`,
      });

      navigate('/market-admin/broker-management');
    } catch (err: any) {
      console.error('Update Broker Error:', err);
      const status = err?.response?.status || err?.status;
      const msg = (
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        ''
      ).toString();
      const isAdminExists = msg.toLowerCase().includes('admin email already exists');

      const friendly = isAdminExists
        ? 'Admin email already exists'
        : status === 400
          ? `Validation failed: ${msg}`
          : status === 401
            ? 'Session expired. Please log in again.'
            : status === 403
              ? 'You are not authorized to update brokers.'
              : status === 500
                ? `Server error: ${msg}`
                : msg || 'Failed to update broker.';

      // Update error handling logic to use errorMessage
      setErrorMessage(friendly);

      toast({
        title: 'Update Failed',
        description: friendly,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLicenseFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (only JPEG, PNG, SVG, WebP - no GIF or videos)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description:
          'Please upload a JPEG, PNG, SVG, or WebP image. GIF and video files are not allowed.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingLicense(true);

    try {
      const uploadResponse = await uploadBrokerFile(file, 'license');

      if (uploadResponse.url && uploadResponse.fileId) {
        setLicenseFile(file);
        setLicenseFileUrl(uploadResponse.url);
        setLicenseFileId(uploadResponse.fileId);

        toast({
          title: 'License Document Uploaded Successfully',
          description:
            uploadResponse.message || `File "${file.name}" has been uploaded successfully.`,
        });
      } else {
        throw new Error('No URL or file ID returned from upload');
      }
    } catch (error: any) {
      console.error('License upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload license document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingLicense(false);
    }
  };

  const removeLicenseFile = () => {
    setLicenseFile(null);
    setLicenseFileUrl(null);
    setLicenseFileId(null);
    setLicenseFileName(null);
    setLicenseFileSize(null);
    const fileInput = document.getElementById('license-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (only JPEG, PNG, SVG, WebP - no GIF or videos)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description:
          'Please upload a JPEG, PNG, SVG, or WebP image. GIF and video files are not allowed.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingLogo(true);

    try {
      const uploadResponse = await uploadBrokerFile(file, 'logo');

      if (uploadResponse.url && uploadResponse.fileId) {
        setLogoFile(file);
        setLogoFileUrl(uploadResponse.url);
        setLogoFileId(uploadResponse.fileId);

        toast({
          title: 'Logo Uploaded Successfully',
          description: uploadResponse.message || `${file.name} has been uploaded successfully.`,
        });
      } else {
        throw new Error('No URL or file ID returned from upload');
      }
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload logo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const removeLogoFile = () => {
    setLogoFile(null);
    setLogoFileUrl(null);
    setLogoFileId(null);
    setLogoFileName(null);
    setLogoFileSize(null);
    const fileInput = document.getElementById('broker-logo-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleBack = () => {
    navigate('/market-admin/broker-management');
  };

  if (isLoading || !initialLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg">
        <div className="flex-1 p-6">
          <div className="w-full max-w-7xl mx-auto">
            <FormSkeleton pairs={6} />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Failed to load</h1>
          <p className="text-muted-foreground mb-4">{loadError}</p>
          <Button onClick={() => navigate('/market-admin/broker-management')}>
            Back to Broker Management
          </Button>
        </div>
      </div>
    );
  }

  if (!initialLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Broker Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested broker could not be found.</p>
          <Button onClick={handleBack}>Back to Broker Management</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
      <div className="flex-1 p-6">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Edit Broker Details</h1>
                <p className="text-muted-foreground">Update broker information and settings</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-card p-4 rounded-lg border">
              <Label htmlFor="broker-status" className="text-sm font-medium">
                {isActive ? 'Active' : 'Inactive'}
              </Label>
              <Switch id="broker-status" checked={isActive} onCheckedChange={handleToggleStatus} />
            </div>
          </div>

          {/* Form Card */}
          <div className="transition-all duration-300">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Broker Information
                </CardTitle>
                <CardDescription>Update the details for this insurance broker</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {errorMessage && (
                      <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                        {errorMessage}
                      </div>
                    )}
                    <fieldset disabled={!isActive} className="space-y-6">
                    {/* Basic Information Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Broker Name <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Gulf Insurance Brokers" {...field} />
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
                              Email <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="contact@broker.com"
                                type="email"
                                autoComplete="off"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Phone Number <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <PhoneInput placeholder="Enter phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Admin User Credentials Section */}
                    <div className="pt-6 border-t">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Admin User Credentials
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Manage the admin user account for this broker
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="adminName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Admin Name <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., John Doe" autoComplete="off" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="adminUserEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Admin User Email <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="admin@broker.com"
                                  type="email"
                                  autoComplete="off"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="adminUserPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Admin User Password
                              </FormLabel>
                              <div className="relative">
                                <FormControl>
                                  <Input
                                    placeholder="Leave blank to keep current"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="off"
                                    className="pr-10"
                                    {...field}
                                  />
                                </FormControl>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:bg-transparent hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* License Information Section */}
                    <div className="pt-6 border-t">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        License Information
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="licenseNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                License Number <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., BRK-2024-001" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="validityStartDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Validity Start Date <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <DatePicker
                                  value={field.value || ''}
                                  onChange={(date) => {
                                    field.onChange(date || '');
                                    // If end date is before new start date, clear it
                                    const endDate = form.getValues('validityEndDate');
                                    if (endDate && date && endDate < date) {
                                      form.setValue('validityEndDate', '');
                                    }
                                  }}
                                  placeholder="Select start date"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="validityEndDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Validity End Date <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <DatePicker
                                  value={field.value || ''}
                                  onChange={(date) => field.onChange(date || '')}
                                  placeholder="Select end date"
                                  min={form.watch('validityStartDate') || undefined}
                                  disabled={!form.watch('validityStartDate')}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* License Image Upload */}
                        <div className="space-y-3 col-span-full">
                          <FormLabel>
                            License Document Image <span className="text-destructive">*</span>
                          </FormLabel>
                          <div className="space-y-3">
                            {!licenseFile && !licenseFileUrl ? (
                              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                                <div className="text-center">
                                  {isUploadingLicense ? (
                                    <>
                                      <div className="mx-auto h-12 w-12 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                      <div className="mt-4">
                                        <span className="text-sm font-medium text-muted-foreground">
                                          Uploading...
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                      <div className="mt-4">
                                        <label htmlFor="license-file" className="cursor-pointer">
                                          <span className="text-sm font-medium text-primary hover:text-primary/80">
                                            Upload license image
                                          </span>
                                          <input
                                            id="license-file"
                                            type="file"
                                            className="sr-only"
                                            accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                                            onChange={handleLicenseFileChange}
                                            disabled={isUploadingLicense}
                                          />
                                        </label>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          PNG, JPG, SVG, WebP up to 5MB
                                        </p>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-14 h-14 rounded bg-background border flex items-center justify-center overflow-hidden p-1">
                                    {isUploadingLicense ? (
                                      <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    ) : licenseFileUrl ? (
                                      <img
                                        src={licenseFileUrl}
                                        alt="License Preview"
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Upload className="h-4 w-4 text-primary" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {licenseFile ? licenseFile.name : licenseFileName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {licenseFile
                                        ? formatFileSize(licenseFile.size)
                                        : licenseFileSize
                                          ? formatFileSize(licenseFileSize)
                                          : 'Size unknown'}
                                    </p>
                                    {isUploadingLicense ? (
                                      <p className="text-xs text-muted-foreground animate-pulse">
                                        Uploading...
                                      </p>
                                    ) : licenseFileUrl && licenseFile ? (
                                      <p className="text-xs text-green-600">
                                        ✓ Uploaded successfully
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={removeLicenseFile}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Company Logo Upload */}
                    <div className="space-y-3">
                      <FormLabel>Company Logo <span className="text-destructive">*</span></FormLabel>
                      <div className="space-y-3">
                        {!logoFile && !logoFileUrl ? (
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                            <div className="text-center">
                              <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                              <div className="mt-4">
                                <label htmlFor="broker-logo-file" className="cursor-pointer">
                                  <span className="text-sm font-medium text-primary hover:text-primary/80">
                                    {isUploadingLogo ? 'Uploading...' : 'Upload company logo'}
                                  </span>
                                  <input
                                    id="broker-logo-file"
                                    type="file"
                                    className="sr-only"
                                    accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                                    onChange={handleLogoFileChange}
                                    disabled={isUploadingLogo}
                                  />
                                </label>
                                <p className="text-xs text-muted-foreground mt-1">
                                  PNG, JPG, SVG, WebP up to 5MB
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded bg-background border flex items-center justify-center overflow-hidden p-1">
                                {isUploadingLogo ? (
                                  <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                ) : logoFileUrl ? (
                                  <img
                                    src={logoFileUrl}
                                    alt="Logo Preview"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Upload className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {logoFile ? logoFile.name : logoFileName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {logoFile
                                    ? formatFileSize(logoFile.size)
                                    : logoFileSize
                                      ? formatFileSize(logoFileSize)
                                      : 'Size unknown'}
                                </p>
                                {isUploadingLogo ? (
                                  <p className="text-xs text-muted-foreground animate-pulse">
                                    Uploading...
                                  </p>
                                ) : logoFileUrl && logoFile ? (
                                  <p className="text-xs text-green-600">✓ Uploaded successfully</p>
                                ) : null}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeLogoFile}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    </fieldset>
                    <div className="flex gap-4 pt-6">
                      <Button type="button" variant="outline" onClick={handleBack}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={!isActive || isLoading || isUploadingLogo || isUploadingLicense}
                      >
                        {isLoading ? 'Updating...' : 'Update Broker'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatusChange ? 'Activate' : 'Deactivate'} Broker
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {pendingStatusChange ? 'activate' : 'deactivate'} this
              broker?
              {!pendingStatusChange &&
                ' This will prevent them from accessing the platform and processing new quotes.'}
              {pendingStatusChange && ' This will restore their access to the platform.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowStatusDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange} disabled={statusChanging}>
              {statusChanging ? 'Updating...' : pendingStatusChange ? 'Activate' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditBroker;
