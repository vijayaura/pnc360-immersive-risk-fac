import { useFieldArray, useFormContext } from "react-hook-form";
import { Globe2, MapPin, Trash2, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import FormMultiSelect from "@/features/reinsurers/components/FormMultiSelect";
import TagChipInput from "@/features/reinsurance-brokers/components/TagChipInput";
import {
  BROKER_FACILITY_OPTIONS,
  PREFERRED_MARKET_OPTIONS,
  REGIONAL_CONNECTION_OPTIONS,
} from "@/features/reinsurance-brokers/constants/brokerConfigOptions";
import type { ReinsuranceBrokerFormData } from "@/features/reinsurance-brokers/model/reinsuranceBrokerFormSchema";
import { cn } from "@/shared/utils/lib-utils";

interface BrokerFacilityIntelligenceSectionProps {
  disabled?: boolean;
}

const BrokerFacilityIntelligenceSection = ({
  disabled = false,
}: BrokerFacilityIntelligenceSectionProps) => {
  const form = useFormContext<ReinsuranceBrokerFormData>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "regionalConnections",
  });

  const usedRegions = new Set(fields.map((f) => f.region));

  const addRegion = (value: string, label: string) => {
    if (usedRegions.has(value)) return;
    append({
      id: crypto.randomUUID(),
      region: value,
      regionLabel: label,
      reinsurers: [],
    });
  };

  const configuredRegions = fields.filter(
    (_, i) => (form.watch(`regionalConnections.${i}.reinsurers`)?.length ?? 0) > 0,
  ).length;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe2 className="h-5 w-5" />
            Facility Intelligence
          </CardTitle>
          {fields.length > 0 && (
            <Badge variant="secondary" className="font-normal">
              {configuredRegions}/{fields.length} region{fields.length !== 1 ? "s" : ""} linked
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="brokerFacilities"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Broker Facilities</FormLabel>
                <FormControl>
                  <FormMultiSelect
                    id="broker-facilities"
                    options={BROKER_FACILITY_OPTIONS}
                    value={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="Select facility types"
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preferredMarkets"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Markets</FormLabel>
                <FormControl>
                  <FormMultiSelect
                    id="preferred-markets"
                    options={PREFERRED_MARKET_OPTIONS}
                    value={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="Select preferred markets"
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3 border-t pt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Regional Connections / Reinsurers
          </p>
          <div className="flex flex-wrap gap-2">
            {REGIONAL_CONNECTION_OPTIONS.map((region) => {
              const added = usedRegions.has(region.value);
              return (
                <Button
                  key={region.value}
                  type="button"
                  variant={added ? "secondary" : "outline"}
                  size="sm"
                  disabled={disabled || added}
                  className={cn(added && "opacity-60")}
                  onClick={() => addRegion(region.value, region.label)}
                >
                  <MapPin className="mr-1.5 h-3.5 w-3.5" />
                  {region.label}
                </Button>
              );
            })}
          </div>
        </div>

        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 px-6 py-8 text-center">
            <Building2 className="mx-auto h-9 w-9 text-muted-foreground/50" />
            <p className="mt-2 text-sm font-medium">No regional connections added</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a region above and list connected reinsurers — e.g. European, African, or US markets.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => {
              const regionLabel = form.watch(`regionalConnections.${index}.regionLabel`);
              const reinsurerCount = form.watch(`regionalConnections.${index}.reinsurers`)?.length ?? 0;

              return (
                <div key={field.id} className="rounded-lg border bg-card overflow-hidden">
                  <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="h-4 w-4 shrink-0 text-primary" />
                      <span className="font-medium truncate">{regionLabel}</span>
                      {reinsurerCount > 0 && (
                        <Badge variant="outline" className="text-[10px] font-normal shrink-0">
                          {reinsurerCount} reinsurer{reinsurerCount !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={disabled}
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-4">
                    <FormField
                      control={form.control}
                      name={`regionalConnections.${index}.reinsurers`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>Connected Reinsurers</FormLabel>
                          <FormControl>
                            <TagChipInput
                              value={f.value ?? []}
                              onChange={f.onChange}
                              disabled={disabled}
                              placeholder="Add reinsurer name — Enter or paste comma-separated"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BrokerFacilityIntelligenceSection;
