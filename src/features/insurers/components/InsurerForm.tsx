import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import GeographicCoverage from "@/components/shared/GeographicCoverage";
import { Building2, MapPin, UserPlus, Eye, EyeOff } from "lucide-react";
import { listMasterCountries, listMasterRegions, listMasterZones, type Country, type Region, type Zone } from '@/features/product-config/masters/api/masters';
import FormSkeleton from "@/components/loaders/FormSkeleton";
import { validatePhone } from "@/lib/phone/phone-validation";

const insurerSchemaCreate = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  licenseNumber: z.string().min(1, "License number is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().refine(
    (v) => validatePhone(v?.trim() || undefined, true) === null,
    (v) => ({
      message: validatePhone(v?.trim() || undefined, true) ?? "Invalid phone number",
    }),
  ),
  address: z.string().min(1, "Address is required"),
  countries: z.array(z.string()).min(1, "At least one country is required"),
  regions: z.array(z.string()).min(1, "At least one region is required"),
  zones: z.array(z.string()).min(1, "At least one zone is required"),
  adminUserName: z.string().min(2, "Admin name must be at least 2 characters"),
  adminUserEmail: z.string().email("Invalid admin email address").optional().or(z.literal('')),
  adminUserPassword: z.string().min(6, "Password must be at least 6 characters"),
});

const insurerSchemaEdit = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  licenseNumber: z.string().min(1, "License number is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().refine(
    (v) => validatePhone(v?.trim() || undefined, true) === null,
    (v) => ({
      message: validatePhone(v?.trim() || undefined, true) ?? "Invalid phone number",
    }),
  ),
  address: z.string().min(1, "Address is required"),
  countries: z.array(z.string()).min(1, "At least one country is required"),
  regions: z.array(z.string()).min(1, "At least one region is required"),
  zones: z.array(z.string()).min(1, "At least one zone is required"),
  adminUserName: z.string().min(2, "Admin name must be at least 2 characters"),
  adminUserEmail: z.string().email("Invalid admin email address").optional().or(z.literal('')),
  adminUserPassword: z.string().optional().or(z.literal('')).refine(
    (v) => !v || v.length >= 6,
    "Password must be at least 6 characters",
  ),
});

const insurerSchema = insurerSchemaCreate;

export type InsurerFormData = z.infer<typeof insurerSchema>;

interface InsurerFormProps {
  mode: "create" | "edit";
  initialData?: Partial<InsurerFormData & { id?: string; status?: string }>;
  onSubmit: (data: InsurerFormData) => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  disabled?: boolean;
}

const InsurerForm = ({ mode, initialData, onSubmit, isSubmitting = false, serverError, disabled = false }: InsurerFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [allRegions, setAllRegions] = useState<Region[]>([]);
  const [allZones, setAllZones] = useState<Zone[]>([]);
  const [availableRegions, setAvailableRegions] = useState<Region[]>([]);
  const [availableZones, setAvailableZones] = useState<Zone[]>([]);
  const [isMastersLoading, setIsMastersLoading] = useState<boolean>(true);
  const [mastersError, setMastersError] = useState<string | null>(null);

  const form = useForm<InsurerFormData>({
    resolver: zodResolver(mode === "create" ? insurerSchemaCreate : insurerSchemaEdit),
    defaultValues: {
      name: initialData?.name || "",
      licenseNumber: initialData?.licenseNumber || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      countries: initialData?.countries || [],
      regions: initialData?.regions || [],
      zones: initialData?.zones || [],
      adminUserName: initialData?.adminUserName || "",
      adminUserEmail: initialData?.adminUserEmail || "",
      adminUserPassword: initialData?.adminUserPassword || "",
    },
  });

  // Load masters and initialize available lists
  useEffect(() => {
    let mounted = true;

    (async () => {
      setIsMastersLoading(true);
      setMastersError(null);
      try {
        const [c, r, z] = await Promise.all([
          listMasterCountries(),
          listMasterRegions(),
          listMasterZones(),
        ]);

        if (!mounted) return;

        setCountries(c || []);
        setAllRegions(r || []);
        setAllZones(z || []);

        if (initialData?.countries && initialData.countries.length > 0) {
          const regions = r.filter((reg) => initialData.countries!.includes(reg.countryId));
          setAvailableRegions(regions);
          if (initialData?.regions && initialData.regions.length > 0) {
            const zones = z.filter((zn) => initialData.regions!.includes(zn.regionId));
            setAvailableZones(zones);
          }
        }

        // In edit mode, reset form with initialData so geo (and other fields) are definitely applied and checkboxes show as selected
        if (mode === "edit" && initialData) {
          form.reset({
            name: initialData.name ?? "",
            licenseNumber: initialData.licenseNumber ?? "",
            email: initialData.email ?? "",
            phone: initialData.phone ?? "",
            address: initialData.address ?? "",
            countries: initialData.countries ?? [],
            regions: initialData.regions ?? [],
            zones: initialData.zones ?? [],
            adminUserName: initialData.adminUserName ?? "",
            adminUserEmail: initialData.adminUserEmail ?? "",
            // Don't pre-fill password for edit
            adminUserPassword: "",
          });
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error("Error fetching masters:", err);
        const status = err?.status;
        const friendly =
          status === 400
            ? "Invalid request while loading masters."
            : status === 401
              ? "Session expired. Please log in again."
              : status === 403
                ? "You are not authorized to load masters."
                : status === 500
                  ? "Server error while fetching masters."
                  : err?.message || "Failed to load masters.";
        setMastersError(friendly);
      } finally {
        if (mounted) setIsMastersLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [initialData]);

  // Update available regions when countries change (form state is source of truth via form.watch in GeographicCoverage)
  const handleCountryChange = (countryIds: string[]) => {
    // Filter regions by countryId, not by region id
    const regions = allRegions.filter((r) => countryIds.includes(r.countryId));
    setAvailableRegions(regions);
    // Reset regions if no countries selected
    if (countryIds.length === 0) {
      form.setValue("regions", []);
      form.setValue("zones", []);
    }
  };

  const handleRegionChange = (regionIds: string[]) => {
    // Filter zones by regionId, not by region id
    const zones = allZones.filter((z) => regionIds.includes(z.regionId));
    setAvailableZones(zones);
    form.setValue("regions", regionIds);
    // Reset zones if no regions selected
    if (regionIds.length === 0) {
      form.setValue("zones", []);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Insurer Information
        </CardTitle>
        <CardDescription>
          {mode === "create"
            ? "Provide the basic details for the new insurance partner"
            : "Update the details for this insurance partner"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mastersError && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {mastersError}
          </div>
        )}
        {isMastersLoading ? (
          <FormSkeleton pairs={6} />
        ) : (
          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Mandatory geographical coverage: validate first so messages show and we never call API when empty (same as Add Insurer)
                const values = form.getValues();
                const hasCountries = (values.countries?.length ?? 0) >= 1;
                const hasRegions = (values.regions?.length ?? 0) >= 1;
                const hasZones = (values.zones?.length ?? 0) >= 1;
                if (!hasCountries || !hasRegions || !hasZones) {
                  if (!hasCountries) {
                    form.setError("countries", { type: "manual", message: "At least one country is required" });
                  } else {
                    form.clearErrors("countries");
                  }
                  if (!hasRegions) {
                    form.setError("regions", { type: "manual", message: "At least one region is required" });
                  } else {
                    form.clearErrors("regions");
                  }
                  if (!hasZones) {
                    form.setError("zones", { type: "manual", message: "At least one zone is required" });
                  } else {
                    form.clearErrors("zones");
                  }
                  return;
                }
                form.clearErrors(["countries", "regions", "zones"]);
                form.handleSubmit(onSubmit)(e);
              }}
              className="space-y-6"
            >
              {serverError && (
                <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                  {serverError}
                </div>
              )}
              {/* Basic Information Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurer Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Emirates Insurance" {...field} disabled={disabled} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., EI-2024-001" {...field} disabled={disabled} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="contact@insurer.com"
                          type="email"
                          autoComplete="off"
                          {...field}
                          disabled={disabled}
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
                      <FormLabel>Phone Number <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <PhoneInput
                          placeholder="1234567890"
                          {...field}
                          disabled={disabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Sheikh Zayed Road, Dubai, UAE" {...field} disabled={disabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Website field removed as per requirements */}

              {/* Admin User Credentials Section */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Admin User Credentials
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {mode === "create"
                    ? "Set up the initial admin user account for this insurer"
                    : "Update the admin user credentials for this insurer"}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="adminUserName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Name <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., John Doe" autoComplete="off" {...field} disabled={disabled} />
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
                          <Input
                            placeholder="admin@insurer.com"
                            type="email"
                            autoComplete="off"
                            {...field}
                            disabled={disabled}
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
                        <FormLabel>Admin User Password {mode === "create" && <span className="text-destructive">*</span>}</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              placeholder={mode === "edit" ? "Leave blank to keep current" : "Enter admin password"}
                              type={showPassword ? "text" : "password"}
                              autoComplete="off"
                              className="pr-10"
                              {...field}
                              disabled={disabled}
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

              <GeographicCoverage
                countries={countries}
                regions={allRegions}
                zones={allZones}
                selectedCountries={form.watch("countries") || []}
                selectedRegions={form.watch("regions") || []}
                selectedZones={form.watch("zones") || []}
                onCountriesChange={(ids) => {
                  form.setValue("countries", ids, { shouldDirty: true, shouldValidate: true });
                  handleCountryChange(ids);
                }}
                onRegionsChange={(ids) => {
                  form.setValue("regions", ids, { shouldDirty: true, shouldValidate: true });
                  handleRegionChange(ids);
                }}
                onZonesChange={(ids) => {
                  form.setValue("zones", ids, { shouldDirty: true, shouldValidate: true });
                }}
                required
                countriesError={form.formState.errors.countries?.message}
                regionsError={form.formState.errors.countries ? undefined : form.formState.errors.regions?.message}
                zonesError={
                  form.formState.errors.countries || form.formState.errors.regions
                    ? undefined
                    : form.formState.errors.zones?.message
                }
                disabled={disabled}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || disabled}>
                  {mode === "create" ? "Create Insurer" : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};

export default InsurerForm;
