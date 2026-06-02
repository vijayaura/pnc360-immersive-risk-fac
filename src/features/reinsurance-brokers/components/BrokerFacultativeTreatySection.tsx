import { useFormContext } from "react-hook-form";
import { FileStack, Layers, Users2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { ReinsuranceBrokerFormData } from "@/features/reinsurance-brokers/model/reinsuranceBrokerFormSchema";
import { cn } from "@/shared/utils/lib-utils";

interface BrokerFacultativeTreatySectionProps {
  disabled?: boolean;
}

const BrokerFacultativeTreatySection = ({ disabled = false }: BrokerFacultativeTreatySectionProps) => {
  const form = useFormContext<ReinsuranceBrokerFormData>();
  const supportsFacultative = form.watch("supportsFacultative");
  const supportsTreaty = form.watch("supportsTreaty");
  const separateTeams = form.watch("separateTeamsForBoth");
  const bothSupported = supportsFacultative && supportsTreaty;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileStack className="h-5 w-5" />
          Facultative vs Treaty Identification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="supportsFacultative"
            render={({ field }) => (
              <FormItem>
                <div
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-4 transition-colors",
                    field.value ? "border-primary/40 bg-primary/5" : "bg-muted/20",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background border">
                      <FileStack className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <FormLabel className="text-base font-medium">Broker supports facultative</FormLabel>
                      <p className="text-xs text-muted-foreground mt-0.5">Individual risk placements</p>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (!checked && !form.getValues("supportsTreaty")) {
                          form.setValue("separateTeamsForBoth", false);
                        }
                      }}
                      disabled={disabled}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supportsTreaty"
            render={({ field }) => (
              <FormItem>
                <div
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-4 transition-colors",
                    field.value ? "border-primary/40 bg-primary/5" : "bg-muted/20",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background border">
                      <Layers className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <FormLabel className="text-base font-medium">Broker supports treaty</FormLabel>
                      <p className="text-xs text-muted-foreground mt-0.5">Proportional &amp; non-proportional treaties</p>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (!checked && !form.getValues("supportsFacultative")) {
                          form.setValue("separateTeamsForBoth", false);
                        }
                      }}
                      disabled={disabled}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />
        </div>

        {bothSupported && (
          <FormField
            control={form.control}
            name="separateTeamsForBoth"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between rounded-lg border border-dashed px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-muted-foreground" />
                    <FormLabel className="font-medium">Separate teams for facultative and treaty</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} disabled={disabled} />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />
        )}

        {bothSupported && separateTeams && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border bg-muted/10 p-4 space-y-4">
              <p className="text-sm font-semibold flex items-center gap-2">
                <FileStack className="h-4 w-4" />
                Facultative Team
              </p>
              <FormField
                control={form.control}
                name="facultativeTeam.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Team lead name" disabled={disabled} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="facultativeTeam.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="fac@broker.com" autoComplete="off" disabled={disabled} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="facultativeTeam.phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <PhoneInput placeholder="Optional" disabled={disabled} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-4 space-y-4">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Treaty Team
              </p>
              <FormField
                control={form.control}
                name="treatyTeam.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Team lead name" disabled={disabled} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="treatyTeam.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="treaty@broker.com" autoComplete="off" disabled={disabled} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="treatyTeam.phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <PhoneInput placeholder="Optional" disabled={disabled} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BrokerFacultativeTreatySection;
