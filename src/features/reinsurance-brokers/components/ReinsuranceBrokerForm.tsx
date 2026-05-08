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
import GeographicCoverage from "@/components/shared/GeographicCoverage";
import { Handshake } from "lucide-react";
import { listMasterCountries, listMasterRegions, listMasterZones } from "@/features/product-config/masters/api/masters";
import type { Country, Region, Zone } from "@/features/product-config/masters/api/masters";
import FormSkeleton from "@/components/loaders/FormSkeleton";
import { validatePhone } from "@/lib/phone/phone-validation";

const brokerSchemaCreate = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  licenseNumber: z.string().min(1, "License number is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().refine(
    (v) => validatePhone(v?.trim() || undefined, true) === null,
    (v) => ({ message: validatePhone(v?.trim() || undefined, true) ?? "Invalid phone number" }),
  ),
  address: z.string().min(1, "Address is required"),
  isDirect: z.boolean().optional().default(false),
  countries: z.array(z.string()).min(1, "At least one country is required"),
  regions: z.array(z.string()).min(1, "At least one region is required"),
  zones: z.array(z.string()).min(1, "At least one zone is required"),
  adminUserName: z.string().min(1, "Admin name is required"),
  adminUserEmail: z.string().email("Invalid admin email address"),
  adminUserPassword: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

const brokerSchemaEdit = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  licenseNumber: z.string().min(1, "License number is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().refine(
    (v) => validatePhone(v?.trim() || undefined, true) === null,
    (v) => ({ message: validatePhone(v?.trim() || undefined, true) ?? "Invalid phone number" }),
  ),
  address: z.string().min(1, "Address is required"),
  isDirect: z.boolean().optional().default(false),
  countries: z.array(z.string()).min(1, "At least one country is required"),
  regions: z.array(z.string()).min(1, "At least one region is required"),
  zones: z.array(z.string()).min(1, "At least one zone is required"),
  adminUserName: z.string().min(1, "Admin name is required"),
  adminUserEmail: z.string().email("Invalid admin email address"),
  adminUserPassword: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

export type ReinsuranceBrokerFormData = z.infer<typeof brokerSchemaCreate>;

interface ReinsuranceBrokerFormProps {
  mode: "create" | "edit";
  initialData?: Partial<ReinsuranceBrokerFormData & { id?: string; status?: string; isDirect?: boolean }>;
  onSubmit: (data: ReinsuranceBrokerFormData) => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  disabled?: boolean;
}

const ReinsuranceBrokerForm = ({
  mode,
  initialData,
  onSubmit,
  isSubmitting = false,
  serverError,
  disabled = false,
}: ReinsuranceBrokerFormProps) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [allRegions, setAllRegions] = useState<Region[]>([]);
  const [allZones, setAllZones] = useState<Zone[]>([]);
  const [availableRegions, setAvailableRegions] = useState<Region[]>([]);
  const [availableZones, setAvailableZones] = useState<Zone[]>([]);
  const [isMastersLoading, setIsMastersLoading] = useState<boolean>(true);
  const [mastersError, setMastersError] = useState<string | null>(null);

  const form = useForm<ReinsuranceBrokerFormData>({
    resolver: zodResolver(mode === "create" ? brokerSchemaCreate : brokerSchemaEdit),
    defaultValues: {
      name: initialData?.name || "",
      licenseNumber: initialData?.licenseNumber || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      isDirect: initialData?.isDirect ?? false,
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

        if (mode === "edit" && initialData) {
          form.reset({
            name: initialData.name ?? "",
            licenseNumber: initialData.licenseNumber ?? "",
            email: initialData.email ?? "",
            phone: initialData.phone ?? "",
            address: initialData.address ?? "",
            isDirect: initialData.isDirect ?? false,
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
          <Handshake className="w-5 h-5" />
          Reinsurance Broker Information
        </CardTitle>
        <CardDescription>
          {mode === "create"
            ? "Provide the basic details for the new reinsurance broker"
            : "Update the details for this reinsurance broker"}
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
                if (disabled) return;
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

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Broker Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Aon Re" disabled={disabled} {...field} />
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
                        <Input placeholder="e.g., RB-2024-001" disabled={disabled} {...field} />
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
                        <Input placeholder="contact@broker.com" type="email" autoComplete="off" disabled={disabled} {...field} />
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
                        <PhoneInput placeholder="1234567890" disabled={disabled} {...field} />
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
                      <Input placeholder="e.g., DIFC Gate Village, Dubai, UAE" disabled={disabled} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Admin User Credentials */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">Admin User Credentials</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {mode === "create"
                    ? "Set up the initial admin user account for this reinsurance broker"
                    : "Update the admin user credentials for this reinsurance broker"}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="adminUserName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Name <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., John Doe" autoComplete="off" disabled={disabled} {...field} />
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
                          <Input placeholder="admin@broker.com" type="email" autoComplete="off" disabled={disabled} {...field} />
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
                        <FormControl>
                          <Input
                            placeholder={mode === "edit" ? "Leave blank to keep current" : "Enter admin password"}
                            type="password"
                            autoComplete="new-password"
                            disabled={disabled}
                            {...field}
                          />
                        </FormControl>
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

              {!disabled && (
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? mode === "create" ? "Creating..." : "Saving..."
                      : mode === "create" ? "Create Reinsurance Broker" : "Save Changes"}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};

export default ReinsuranceBrokerForm;
