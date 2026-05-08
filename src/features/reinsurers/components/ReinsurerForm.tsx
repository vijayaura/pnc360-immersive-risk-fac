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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GeographicCoverage from "@/components/shared/GeographicCoverage";
import { Shield, UserPlus, Eye, EyeOff } from "lucide-react";
import { listMasterCountries, listMasterRegions, listMasterZones } from "@/features/product-config/masters/api/masters";
import type { Country, Region, Zone } from "@/features/product-config/masters/api/masters";
import { listReinsurerGrades, type ReinsurerGradeValue } from "@/features/reinsurers/api/reinsurers";
import FormSkeleton from "@/components/loaders/FormSkeleton";
import { validatePhone } from "@/lib/phone/phone-validation";

const reinsurerSchemaCreate = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  licenseNumber: z.string().min(1, "License number is required"),
  gradeId: z.string().min(1, "Please select a reinsurer grade"),
  email: z.string().email("Invalid email address"),
  phone: z.string().refine(
    (v) => validatePhone(v?.trim() || undefined, true) === null,
    (v) => ({ message: validatePhone(v?.trim() || undefined, true) ?? "Invalid phone number" }),
  ),
  address: z.string().min(1, "Address is required"),
  countries: z.array(z.string()).min(1, "At least one country is required"),
  regions: z.array(z.string()).min(1, "At least one region is required"),
  zones: z.array(z.string()).min(1, "At least one zone is required"),
  adminUserName: z.string().min(2, "Admin name must be at least 2 characters"),
  adminUserEmail: z.string().email("Invalid admin email address"),
  adminUserPassword: z.string().min(8, "Password must be at least 8 characters"),
});

const reinsurerSchemaEdit = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  licenseNumber: z.string().min(1, "License number is required"),
  gradeId: z.string().min(1, "Please select a reinsurer grade"),
  email: z.string().email("Invalid email address"),
  phone: z.string().refine(
    (v) => validatePhone(v?.trim() || undefined, true) === null,
    (v) => ({ message: validatePhone(v?.trim() || undefined, true) ?? "Invalid phone number" }),
  ),
  address: z.string().min(1, "Address is required"),
  countries: z.array(z.string()).min(1, "At least one country is required"),
  regions: z.array(z.string()).min(1, "At least one region is required"),
  zones: z.array(z.string()).min(1, "At least one zone is required"),
  adminUserName: z.string().min(2, "Admin name must be at least 2 characters"),
  adminUserEmail: z.string().email("Invalid admin email address").optional().or(z.literal("")),
  adminUserPassword: z.string().optional().or(z.literal("")).refine(
    (v) => !v || v.length >= 8,
    "Password must be at least 8 characters",
  ),
});

export type ReinsurerFormData = z.infer<typeof reinsurerSchemaCreate>;

interface ReinsurerFormProps {
  mode: "create" | "edit";
  initialData?: Partial<ReinsurerFormData & { id?: string; status?: string }>;
  onSubmit: (data: ReinsurerFormData) => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  disabled?: boolean;
}

const ReinsurerForm = ({
  mode,
  initialData,
  onSubmit,
  isSubmitting = false,
  serverError,
  disabled = false,
}: ReinsurerFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [gradeOptions, setGradeOptions] = useState<ReinsurerGradeValue[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [allRegions, setAllRegions] = useState<Region[]>([]);
  const [allZones, setAllZones] = useState<Zone[]>([]);
  const [availableRegions, setAvailableRegions] = useState<Region[]>([]);
  const [availableZones, setAvailableZones] = useState<Zone[]>([]);
  const [isMastersLoading, setIsMastersLoading] = useState<boolean>(true);
  const [mastersError, setMastersError] = useState<string | null>(null);

  const form = useForm<ReinsurerFormData>({
    resolver: zodResolver(mode === "create" ? reinsurerSchemaCreate : reinsurerSchemaEdit),
    defaultValues: {
      name: initialData?.name || "",
      licenseNumber: initialData?.licenseNumber || "",
      gradeId: initialData?.gradeId || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      countries: initialData?.countries || [],
      regions: initialData?.regions || [],
      zones: initialData?.zones || [],
      adminUserName: initialData?.adminUserName || "",
      adminUserEmail: initialData?.adminUserEmail || "",
      adminUserPassword: "",
    },
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      setIsMastersLoading(true);
      setMastersError(null);
      try {
        const [c, r, z, grades] = await Promise.all([
          listMasterCountries(),
          listMasterRegions(),
          listMasterZones(),
          listReinsurerGrades(),
        ]);

        if (!mounted) return;

        setCountries(c || []);
        setAllRegions(r || []);
        setAllZones(z || []);
        setGradeOptions(grades || []);

        if (initialData?.countries && initialData.countries.length > 0) {
          const regions = r.filter((reg) => initialData.countries!.includes(reg.countryId));
          setAvailableRegions(regions);
          if (initialData?.regions && initialData.regions.length > 0) {
            const zones = z.filter((zn) => initialData.regions!.includes(zn.regionId));
            setAvailableZones(zones);
          }
        }

        if (mode === "edit" && initialData) {
          form.reset({
            name: initialData.name ?? "",
            licenseNumber: initialData.licenseNumber ?? "",
            gradeId: initialData.gradeId ?? "",
            email: initialData.email ?? "",
            phone: initialData.phone ?? "",
            address: initialData.address ?? "",
            countries: initialData.countries ?? [],
            regions: initialData.regions ?? [],
            zones: initialData.zones ?? [],
            adminUserName: initialData.adminUserName ?? "",
            adminUserEmail: initialData.adminUserEmail ?? "",
            adminUserPassword: "",
          });
        }
      } catch (err: any) {
        if (!mounted) return;
        const status = err?.status;
        const friendly =
          status === 400 ? "Invalid request while loading masters." :
          status === 401 ? "Session expired. Please log in again." :
          status === 403 ? "You are not authorized to load masters." :
          status === 500 ? "Server error while fetching masters." :
          err?.message || "Failed to load masters.";
        setMastersError(friendly);
      } finally {
        if (mounted) setIsMastersLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [initialData]);

  const handleCountryChange = (countryIds: string[]) => {
    const regions = allRegions.filter((r) => countryIds.includes(r.countryId));
    setAvailableRegions(regions);
    if (countryIds.length === 0) {
      form.setValue("regions", []);
      form.setValue("zones", []);
    }
  };

  const handleRegionChange = (regionIds: string[]) => {
    const zones = allZones.filter((z) => regionIds.includes(z.regionId));
    setAvailableZones(zones);
    form.setValue("regions", regionIds);
    if (regionIds.length === 0) {
      form.setValue("zones", []);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Reinsurer Information
        </CardTitle>
        <CardDescription>
          {mode === "create"
            ? "Provide the basic details for the new reinsurance partner"
            : "Update the details for this reinsurance partner"}
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

              <fieldset disabled={disabled} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reinsurer Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Swiss Re" {...field} />
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
                        <Input placeholder="e.g., RE-2024-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gradeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reinsurer Grade <span className="text-destructive">*</span></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {gradeOptions.map((g) => (
                            <SelectItem key={g.id} value={g.id}>{g.valueLabel}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        <Input placeholder="contact@reinsurer.com" type="email" autoComplete="off" {...field} />
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
                        <PhoneInput placeholder="1234567890" {...field} />
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
                      <Input placeholder="e.g., DIFC Gate Village, Dubai, UAE" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Admin User Credentials */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Admin User Credentials
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {mode === "create"
                    ? "Set up the initial admin user account for this reinsurer"
                    : "Update the admin user credentials for this reinsurer"}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <FormField
                    control={form.control}
                    name="adminUserName"
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
                          Admin User Email{" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="admin@reinsurer.com" type="email" autoComplete="off" {...field} />
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
                          Admin User Password{" "}
                          {mode === "create" && <span className="text-destructive">*</span>}
                        </FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              placeholder={mode === "edit" ? "Leave blank to keep current" : "Enter admin password"}
                              type={showPassword ? "text" : "password"}
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
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Geographic Coverage */}
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
                regionsError={
                  form.formState.errors.countries ? undefined : form.formState.errors.regions?.message
                }
                zonesError={
                  form.formState.errors.countries || form.formState.errors.regions
                    ? undefined
                    : form.formState.errors.zones?.message
                }
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? mode === "create" ? "Creating..." : "Saving..."
                    : mode === "create" ? "Create Reinsurer" : "Save Changes"}
                </Button>
              </div>
              </fieldset>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};

export default ReinsurerForm;
