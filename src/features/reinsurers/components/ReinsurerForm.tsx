import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";
import { Shield, UserPlus, Eye, EyeOff, Scale } from "lucide-react";
import {
  listReinsurerGrades,
  type ReinsurerGradeValue,
  type RiskAppetiteConfig,
  type FacultativeContactManagement,
} from "@/features/reinsurers/api/reinsurers";
import FormSkeleton from "@/components/loaders/FormSkeleton";
import FormMultiSelect from "@/features/reinsurers/components/FormMultiSelect";
import FacultativeContactManagementSection from "@/features/reinsurers/components/FacultativeContactManagementSection";
import {
  FACILITY_TYPE_OPTIONS,
  LINES_WRITTEN_OPTIONS,
  RETENTION_CURRENCY_OPTIONS,
  RISK_APPETITE_LEVEL_OPTIONS,
  RISK_CLASS_OPTIONS,
} from "@/features/reinsurers/constants/riskAppetiteOptions";
import {
  reinsurerSchemaCreate,
  reinsurerSchemaEdit,
  riskAppetiteFormDefaults,
  facultativeContactsFormDefaults,
  type ReinsurerFormData,
} from "@/features/reinsurers/model/reinsurerFormSchema";

export type { ReinsurerFormData };
export {
  buildRiskAppetitePayload,
  buildFacultativeContactsPayload,
} from "@/features/reinsurers/model/reinsurerFormSchema";

interface ReinsurerFormProps {
  mode: "create" | "edit";
  initialData?: Partial<
    ReinsurerFormData & {
      id?: string;
      status?: string;
      riskAppetite?: RiskAppetiteConfig;
      facultativeContacts?: FacultativeContactManagement;
    }
  >;
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
      adminUserName: initialData?.adminUserName || "",
      adminUserEmail: initialData?.adminUserEmail || "",
      adminUserPassword: "",
      ...riskAppetiteFormDefaults(initialData),
      facultativeContacts: facultativeContactsFormDefaults(initialData),
    },
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      setIsMastersLoading(true);
      setMastersError(null);
      try {
        const grades = await listReinsurerGrades();
        if (mounted) setGradeOptions(grades || []);
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
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !initialData?.id) return;
    form.reset({
      name: initialData.name ?? "",
      licenseNumber: initialData.licenseNumber ?? "",
      gradeId: initialData.gradeId ?? "",
      email: initialData.email ?? "",
      phone: initialData.phone ?? "",
      address: initialData.address ?? "",
      adminUserName: initialData.adminUserName ?? "",
      adminUserEmail: initialData.adminUserEmail ?? "",
      adminUserPassword: "",
      ...riskAppetiteFormDefaults(initialData),
      facultativeContacts: facultativeContactsFormDefaults(initialData),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when edit record id is known
  }, [mode, initialData?.id]);

  return (
    <>
      {mastersError && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {mastersError}
        </div>
      )}
      {isMastersLoading ? (
        <FormSkeleton pairs={6} />
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                {serverError}
              </div>
            )}

            <fieldset disabled={disabled} className="space-y-6">
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
                <CardContent className="space-y-6">
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    Risk Appetite &amp; Facilities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="linesWritten"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lines Written</FormLabel>
                          <FormControl>
                            <FormMultiSelect
                              id="lines-written"
                              options={LINES_WRITTEN_OPTIONS}
                              value={field.value ?? []}
                              onChange={field.onChange}
                              placeholder="Select lines of business written"
                              disabled={disabled}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="facilityTypes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facility Type</FormLabel>
                          <FormControl>
                            <FormMultiSelect
                              id="facility-types"
                              options={FACILITY_TYPE_OPTIONS}
                              value={field.value ?? []}
                              onChange={field.onChange}
                              placeholder="Select facility structures"
                              disabled={disabled}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="riskAppetiteLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Risk Appetite</FormLabel>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select appetite profile" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {RISK_APPETITE_LEVEL_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormItem>
                      <FormLabel>Maximum Retention</FormLabel>
                      <div className="flex gap-2">
                        <FormField
                          control={form.control}
                          name="maximumRetentionCurrency"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-[100px]">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {RETENTION_CURRENCY_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="maximumRetention"
                          render={({ field }) => (
                            <FormControl>
                              <FormattedNumberInput
                                allowDecimals={false}
                                allowEmpty
                                className="flex-1"
                                placeholder="e.g., 10,000,000"
                                value={field.value ?? undefined}
                                onChange={(v) => field.onChange(v ?? null)}
                              />
                            </FormControl>
                          )}
                        />
                      </div>
                    </FormItem>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="acceptedRisks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accepted Risks</FormLabel>
                          <FormControl>
                            <FormMultiSelect
                              id="accepted-risks"
                              options={RISK_CLASS_OPTIONS}
                              value={field.value ?? []}
                              onChange={field.onChange}
                              placeholder="Select accepted risk classes"
                              disabled={disabled}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="declinedRisks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Declined Risks</FormLabel>
                          <FormControl>
                            <FormMultiSelect
                              id="declined-risks"
                              options={RISK_CLASS_OPTIONS}
                              value={field.value ?? []}
                              onChange={field.onChange}
                              placeholder="Select declined risk classes"
                              disabled={disabled}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <FacultativeContactManagementSection disabled={disabled} />

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
    </>
  );
};

export default ReinsurerForm;
