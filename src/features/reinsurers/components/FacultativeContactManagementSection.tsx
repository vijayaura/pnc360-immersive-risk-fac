import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import {
  Contact,
  Plus,
  Trash2,
  Users,
  Mail,
  UserCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import EmailChipInput from "@/features/reinsurers/components/EmailChipInput";
import {
  FACULTATIVE_CONTACT_PRODUCT_LINES,
  getFacultativeProductLine,
} from "@/features/reinsurers/constants/facultativeContactOptions";
import type { ReinsurerFormData } from "@/features/reinsurers/model/reinsurerFormSchema";
import { cn } from "@/shared/utils/lib-utils";

function newTeamId() {
  return crypto.randomUUID();
}

function emptyTeam(productLine: string, productLabel: string, isCustom = false) {
  return {
    id: newTeamId(),
    productLine,
    productLabel,
    isCustom,
    primaryContact: { name: "", email: "", phone: "", title: "Specialized Underwriter" },
    ccRecipients: [] as string[],
  };
}

function isTeamConfigured(team: ReinsurerFormData["facultativeContacts"]["teams"][number]) {
  const pc = team.primaryContact;
  return !!(pc.name?.trim() && pc.email?.trim());
}

interface FacultativeContactManagementSectionProps {
  disabled?: boolean;
}

const FacultativeContactManagementSection = ({
  disabled = false,
}: FacultativeContactManagementSectionProps) => {
  const form = useFormContext<ReinsurerFormData>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "facultativeContacts.teams",
  });

  const [customOpen, setCustomOpen] = useState(false);
  const [customLabel, setCustomLabel] = useState("");

  const configuredCount = fields.filter((_, i) =>
    isTeamConfigured(form.watch(`facultativeContacts.teams.${i}`)),
  ).length;

  const usedProductLines = new Set(fields.map((f) => f.productLine));

  const addPresetTeam = (value: string, label: string) => {
    if (usedProductLines.has(value)) return;
    append(emptyTeam(value, label));
  };

  const addCustomTeam = () => {
    const label = customLabel.trim();
    if (!label) return;
    const value = `custom_${label.toLowerCase().replace(/\s+/g, "_")}`;
    if (usedProductLines.has(value)) {
      setCustomOpen(false);
      setCustomLabel("");
      return;
    }
    append(emptyTeam(value, label, true));
    setCustomLabel("");
    setCustomOpen(false);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Contact className="h-5 w-5" />
            Facultative Contact Management
          </CardTitle>
          {fields.length > 0 && (
            <Badge variant="secondary" className="font-normal">
              {configuredCount}/{fields.length} team{fields.length !== 1 ? "s" : ""} configured
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Add product team
          </p>
          <div className="flex flex-wrap gap-2">
            {FACULTATIVE_CONTACT_PRODUCT_LINES.map((product) => {
              const added = usedProductLines.has(product.value);
              const Icon = product.icon;
              return (
                <Button
                  key={product.value}
                  type="button"
                  variant={added ? "secondary" : "outline"}
                  size="sm"
                  disabled={disabled || added}
                  className={cn("gap-1.5", added && "opacity-60")}
                  onClick={() => addPresetTeam(product.value, product.label)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {product.label}
                </Button>
              );
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className="gap-1.5 border-dashed"
              onClick={() => setCustomOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Custom team
            </Button>
          </div>
        </div>

        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 px-6 py-10 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-foreground">No contact teams yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add product-wise contacts — e.g. Property, Liability, or Engineering underwriters with CC recipients.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => {
              const team = form.watch(`facultativeContacts.teams.${index}`);
              const preset = getFacultativeProductLine(team.productLine);
              const Icon = preset?.icon ?? UserCircle2;
              const configured = isTeamConfigured(team);
              const ccCount = team.ccRecipients?.length ?? 0;

              return (
                <div
                  key={field.id}
                  className="overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{team.productLabel}</p>
                          {team.isCustom && (
                            <Badge variant="outline" className="text-[10px] font-normal">
                              Custom
                            </Badge>
                          )}
                          <span
                            className={cn(
                              "inline-block h-2 w-2 rounded-full",
                              configured ? "bg-emerald-500" : "bg-amber-400",
                            )}
                            title={configured ? "Configured" : "Incomplete"}
                          />
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {configured
                            ? `${team.primaryContact.name} · ${team.primaryContact.email}`
                            : "Add specialized underwriter details"}
                          {ccCount > 0 && ` · ${ccCount} CC`}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={disabled}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-5 p-4">
                    <div>
                      <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                        <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                        Specialized Underwriter
                      </p>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`facultativeContacts.teams.${index}.primaryContact.name`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Sarah Chen" disabled={disabled} {...f} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`facultativeContacts.teams.${index}.primaryContact.email`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="sarah.chen@reinsurer.com"
                                  autoComplete="off"
                                  disabled={disabled}
                                  {...f}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`facultativeContacts.teams.${index}.primaryContact.phone`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <PhoneInput placeholder="Optional" disabled={disabled} {...f} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`facultativeContacts.teams.${index}.primaryContact.title`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>Role / Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Specialized Underwriter" disabled={disabled} {...f} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        CC Recipients
                      </p>
                      <FormField
                        control={form.control}
                        name={`facultativeContacts.teams.${index}.ccRecipients`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <EmailChipInput
                                value={f.value ?? []}
                                onChange={f.onChange}
                                disabled={disabled}
                                placeholder="Add CC email — Enter or paste comma-separated"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add custom contact team</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <FormLabel htmlFor="custom-team-name">Team / product name</FormLabel>
            <Input
              id="custom-team-name"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="e.g., Political Risk, Treaty Operations"
              className="mt-2"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTeam())}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCustomOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={addCustomTeam} disabled={!customLabel.trim()}>
              Add team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default FacultativeContactManagementSection;
