import { useEffect } from "react";
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
import { Handshake } from "lucide-react";
import type {
  BrokerFacultativeTreatyConfig,
  BrokerFacilityIntelligence,
} from "@/features/reinsurance-brokers/api/reinsurance-brokers";
import BrokerFacultativeTreatySection from "@/features/reinsurance-brokers/components/BrokerFacultativeTreatySection";
import BrokerFacilityIntelligenceSection from "@/features/reinsurance-brokers/components/BrokerFacilityIntelligenceSection";
import {
  brokerSchemaCreate,
  brokerSchemaEdit,
  facultativeTreatyFormDefaults,
  facilityIntelligenceFormDefaults,
  type ReinsuranceBrokerFormData,
} from "@/features/reinsurance-brokers/model/reinsuranceBrokerFormSchema";

export type { ReinsuranceBrokerFormData };
export {
  buildFacultativeTreatyPayload,
  buildFacilityIntelligencePayload,
} from "@/features/reinsurance-brokers/model/reinsuranceBrokerFormSchema";

interface ReinsuranceBrokerFormProps {
  mode: "create" | "edit";
  initialData?: Partial<
    ReinsuranceBrokerFormData & {
      id?: string;
      status?: string;
      isDirect?: boolean;
      facultativeTreaty?: BrokerFacultativeTreatyConfig;
      facilityIntelligence?: BrokerFacilityIntelligence;
    }
  >;
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
  const form = useForm<ReinsuranceBrokerFormData>({
    resolver: zodResolver(mode === "create" ? brokerSchemaCreate : brokerSchemaEdit),
    defaultValues: {
      name: initialData?.name || "",
      licenseNumber: initialData?.licenseNumber || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      isDirect: initialData?.isDirect ?? false,
      adminUserName: initialData?.adminUserName || "",
      adminUserEmail: initialData?.adminUserEmail || "",
      adminUserPassword: "",
      ...facultativeTreatyFormDefaults(initialData),
      ...facilityIntelligenceFormDefaults(initialData),
    },
  });

  useEffect(() => {
    if (mode !== "edit" || !initialData?.id) return;
    form.reset({
      name: initialData.name ?? "",
      licenseNumber: initialData.licenseNumber ?? "",
      email: initialData.email ?? "",
      phone: initialData.phone ?? "",
      address: initialData.address ?? "",
      isDirect: initialData.isDirect ?? false,
      adminUserName: initialData.adminUserName ?? "",
      adminUserEmail: initialData.adminUserEmail ?? "",
      adminUserPassword: "",
      ...facultativeTreatyFormDefaults(initialData),
      ...facilityIntelligenceFormDefaults(initialData),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when edit record id is known
  }, [mode, initialData?.id]);

  return (
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
                <Handshake className="w-5 h-5" />
                Reinsurance Broker Information
              </CardTitle>
              <CardDescription>
                {mode === "create"
                  ? "Provide the basic details for the new reinsurance broker"
                  : "Update the details for this reinsurance broker"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Broker Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Guy Carpenter" disabled={disabled} {...field} />
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

              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-6">Admin User Credentials</h3>
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
            </CardContent>
          </Card>

          <BrokerFacultativeTreatySection disabled={disabled} />
          <BrokerFacilityIntelligenceSection disabled={disabled} />

          {!disabled && (
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? mode === "create" ? "Creating..." : "Saving..."
                  : mode === "create" ? "Create Reinsurance Broker" : "Save Changes"}
              </Button>
            </div>
          )}
        </fieldset>
      </form>
    </Form>
  );
};

export default ReinsuranceBrokerForm;
