import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useNavigationHistory } from '@/shared/hooks/use-navigation-history';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { ArrowLeft, Building2, Calendar, Upload, X, UserPlus, Eye, EyeOff } from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';
import { createBrokerViaManagement, uploadBrokerFile, type CreateBrokerManagementRequest } from '@/features/brokers/api/brokers';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { formatFileSize } from '@/shared/utils/fileUtils';
import { validatePhone } from "@/lib/phone/phone-validation";

// Simplified schema - only validate fields that are required for the API
const createBrokerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().refine(
    (v) => validatePhone(v?.trim() || undefined, true) === null,
    (v) => ({
      message: validatePhone(v?.trim() || undefined, true) ?? "Invalid phone number",
    }),
  ),
  adminName: z.string().min(2, "Admin name must be at least 2 characters"),
  adminUserEmail: z.string().email("Invalid admin email address"),
  adminUserPassword: z.string().min(8, "Password must be at least 8 characters"),
  // Optional fields
  email: z.string().email("Invalid email address"),
  licenseNumber: z.string().min(1, "License number is required"),
  validityStartDate: z.string().min(1, "Validity start date is required"),
  validityEndDate: z.string().min(1, "Validity end date is required"),
});

type CreateBrokerForm = z.infer<typeof createBrokerSchema>;

const CreateBroker = () => {
  const { navigateBack } = useNavigationHistory();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licenseFileUrl, setLicenseFileUrl] = useState<string | null>(null);
  const [licenseFileId, setLicenseFileId] = useState<string | null>(null);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoFileUrl, setLogoFileUrl] = useState<string | null>(null);
  const [logoFileId, setLogoFileId] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const form = useForm<CreateBrokerForm>({
    resolver: zodResolver(createBrokerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      licenseNumber: "",
      validityStartDate: "",
      validityEndDate: "",
      adminUserEmail: "",
      adminUserPassword: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (values: CreateBrokerForm) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const marketId = user?.marketId;

      if (!marketId) {
        toast({
          title: 'Error',
          description: 'Market ID not found. Please log out and log in again.',
          variant: 'destructive'
        });
        throw new Error('Market ID not found. Please ensure you are logged in as a market admin.');
      }

      const payload: CreateBrokerManagementRequest = {
        name: values.name,
        adminName: values.adminName,
        adminEmail: values.adminUserEmail,
        adminPassword: values.adminUserPassword,
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

      if (licenseFileId) {
        payload.licenseDocumentId = licenseFileId;
      }

      if (logoFileId) {
        payload.companyLogoId = logoFileId;
      }

      if (user?.marketDomain) {
        payload.domain = user.marketDomain;
      }

      if (!licenseFileId) {
        toast({
          title: "License Required",
          description: "Please upload a license document before creating the broker.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      if (!logoFileId) {
        toast({
          title: "Logo Required",
          description: "Please upload a company logo before creating the broker.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const response = await createBrokerViaManagement(marketId, payload);

      toast({
        title: "Success",
        description: response.message || "Broker created successfully",
      });

      // Navigate back to broker management
      setTimeout(() => {
        navigate("/market-admin/broker-management");
      }, 1500);
    } catch (err: any) {
      console.error("Create Broker Error:", err);
      const status = err?.response?.status || err?.status;
      const msg = err?.response?.data?.message || err?.data?.message || err?.message || '';

      const friendly = status === 400 ? `Validation failed: ${msg}`
        : status === 401 ? 'Session expired. Please log in again.'
          : status === 403 ? 'You are not authorized to create brokers.'
            : status === 500 ? `Server error: ${msg}`
              : msg || 'Failed to create broker.';

      setErrorMessage(friendly);

      toast({
        title: "Creation Failed",
        description: friendly,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLicenseFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (only JPEG, PNG, SVG, WebP - no GIF or videos)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, SVG, or WebP image. GIF and video files are not allowed.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingLicense(true);
    setLicenseFile(file); // Set file immediately to show we intend to upload
    setLicenseFileId(null);
    setLicenseFileUrl(null);

    try {
      const uploadResponse = await uploadBrokerFile(file, "license");

      if (uploadResponse.url && uploadResponse.fileId) {
        setLicenseFileUrl(uploadResponse.url);
        setLicenseFileId(uploadResponse.fileId);

        toast({
          title: "License Document Uploaded Successfully",
          description: uploadResponse.message || `File "${file.name}" has been uploaded successfully.`,
        });
      } else {
        throw new Error('No URL or file ID returned from upload');
      }
    } catch (error: any) {
      console.error('License upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload license document. Please try again.",
        variant: "destructive",
      });
      setLicenseFileId(null);
      setLicenseFileUrl(null);
    } finally {
      setIsUploadingLicense(false);
    }
  };

  const removeLicenseFile = () => {
    setLicenseFile(null);
    setLicenseFileUrl(null);
    setLicenseFileId(null);
    // Reset the file input
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
        description: 'Please upload a JPEG, PNG, SVG, or WebP image. GIF and video files are not allowed.',
        variant: 'destructive'
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File Too Large', description: 'Please upload an image smaller than 5MB', variant: 'destructive' });
      return;
    }

    setIsUploadingLogo(true);
    setLogoFile(file);
    setLogoFileId(null);
    setLogoFileUrl(null);

    try {
      const uploadResponse = await uploadBrokerFile(file, "logo");

      if (uploadResponse.url && uploadResponse.fileId) {
        setLogoFileUrl(uploadResponse.url);
        setLogoFileId(uploadResponse.fileId);

        toast({
          title: "Logo Uploaded Successfully",
          description: uploadResponse.message || `${file.name} has been uploaded successfully.`,
        });
      } else {
        throw new Error('No URL or file ID returned from upload');
      }
    } catch (error: any) {
      console.error('Logo upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
      setLogoFileId(null);
      setLogoFileUrl(null);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const removeLogoFile = () => {
    setLogoFile(null);
    setLogoFileUrl(null);
    setLogoFileId(null);
    const fileInput = document.getElementById('logo-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleBack = () => {
    navigate("/market-admin/broker-management");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg">
      <div className="flex-1 p-6">
        <div className="w-full max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Create New Broker
              </h1>
              <p className="text-muted-foreground">
                Add a new insurance broker to your platform
              </p>
            </div>
          </div>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Broker Information
              </CardTitle>
              <CardDescription>
                Provide the basic details for the new insurance broker
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {errorMessage && (
                      <div className="mb-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{errorMessage}</div>
                    )}
                    {/* Basic Information Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Broker Name <span className="text-destructive">*</span></FormLabel>
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
                            <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="contact@broker.com" type="email" autoComplete="off" {...field} />
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
                            <FormLabel>Phone Number <span className="text-destructive">*</span></FormLabel>
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
                        Set up the initial admin user account for this broker
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="adminName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Admin Name <span className="text-destructive">*</span></FormLabel>
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
                              <FormLabel>Admin User Email <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="admin@broker.com" type="email" autoComplete="off" {...field} />
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
                              <FormLabel>Admin User Password <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    placeholder="Enter admin password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="off"
                                    {...field}
                                    className="pr-10"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
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
                              <FormLabel>License Number <span className="text-destructive">*</span></FormLabel>
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
                              <FormLabel>Validity Start Date <span className="text-destructive">*</span></FormLabel>
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
                              <FormLabel>Validity End Date <span className="text-destructive">*</span></FormLabel>
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
                          <FormLabel>License Document Image <span className="text-destructive">*</span></FormLabel>
                          <div className="space-y-3">
                            {!licenseFile ? (
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
                                    <p className="text-sm font-medium">{licenseFile.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(licenseFile.size)}
                                    </p>
                                    {isUploadingLicense ? (
                                      <p className="text-xs text-muted-foreground animate-pulse">Uploading...</p>
                                    ) : licenseFileUrl ? (
                                      <p className="text-xs text-green-600">✓ Uploaded successfully</p>
                                    ) : (
                                      <p className="text-xs text-destructive">✗ Upload failed. Please remove and try again.</p>
                                    )}
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
                        {!logoFile ? (
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                            <div className="text-center">
                              <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                              <div className="mt-4">
                                <label htmlFor="logo-file" className="cursor-pointer">
                                  <span className="text-sm font-medium text-primary hover:text-primary/80">
                                    {isUploadingLogo ? "Uploading..." : "Upload company logo"}
                                  </span>
                                  <input
                                    id="logo-file"
                                    type="file"
                                    className="sr-only"
                                    accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                                    onChange={handleLogoFileChange}
                                    disabled={isUploadingLogo}
                                  />
                                </label>
                                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG, WebP up to 5MB</p>
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
                                <p className="text-sm font-medium">{logoFile.name}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(logoFile.size)}</p>
                                {isUploadingLogo ? (
                                  <p className="text-xs text-muted-foreground animate-pulse">Uploading...</p>
                                ) : logoFileUrl ? (
                                  <p className="text-xs text-green-600">✓ Uploaded successfully</p>
                                ) : (
                                  <p className="text-xs text-destructive">✗ Upload failed. Please remove and try again.</p>
                                )}
                              </div>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={removeLogoFile} className="text-muted-foreground hover:text-destructive">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                      <Button type="button" variant="outline" onClick={handleBack}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting || isUploadingLogo || isUploadingLicense}>
                        {isSubmitting ? 'Creating…' : 'Create Broker'}
                      </Button>
                    </div>
                  </form>
                </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateBroker;
