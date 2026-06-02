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
import { Building2, UserPlus, Eye, EyeOff } from "lucide-react";
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
  adminUserName: z.string().min(2, "Admin name must be at least 2 characters"),
  adminUserEmail: z.string().email("Invalid admin email address").optional().or(z.literal('')),
  adminUserPassword: z.string().optional().or(z.literal('')).refine(
    (v) => !v || v.length >= 6,
    "Password must be at least 6 characters",
  ),
});

export type InsurerFormData = z.infer<typeof insurerSchemaCreate>;

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

  const form = useForm<InsurerFormData>({
    resolver: zodResolver(mode === "create" ? insurerSchemaCreate : insurerSchemaEdit),
    defaultValues: {
      name: initialData?.name || "",
      licenseNumber: initialData?.licenseNumber || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      adminUserName: initialData?.adminUserName || "",
      adminUserEmail: initialData?.adminUserEmail || "",
      adminUserPassword: initialData?.adminUserPassword || "",
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
      adminUserName: initialData.adminUserName ?? "",
      adminUserEmail: initialData.adminUserEmail ?? "",
      adminUserPassword: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when edit record id is known
  }, [mode, initialData?.id]);

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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                {serverError}
              </div>
            )}
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
                      <PhoneInput placeholder="1234567890" {...field} disabled={disabled} />
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
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || disabled}>
                {mode === "create" ? "Create Insurer" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default InsurerForm;
