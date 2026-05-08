import React, { useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, AlertCircle } from "lucide-react";
import TableSkeleton from "@/components/loaders/TableSkeleton";
import { PolicyLimitsResponse } from '@/features/insurers/api/insurers';

export interface PolicyLimitsDeductiblesProps {
  ratingConfig: any;
  onSave: () => void;
  updateLimits: (key: string, value: number) => void;
  addCoverRequirementEntry: (category: string) => void;
  updateCoverRequirementEntry: (category: string, id: number, field: string, value: any) => void;
  removeCoverRequirementEntry: (category: string, id: number) => void;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  policyLimitsData: PolicyLimitsResponse | null;
}

const PolicyLimitsDeductibles: React.FC<PolicyLimitsDeductiblesProps> = ({
  ratingConfig,
  onSave,
  updateLimits,
  addCoverRequirementEntry,
  updateCoverRequirementEntry,
  removeCoverRequirementEntry,
  isLoading,
  isSaving,
  error,
  policyLimitsData,
}) => {
  const hasMappedData = useRef(false);

  // Map API data to UI fields when data is received
  useEffect(() => {
    if (policyLimitsData && ratingConfig && !hasMappedData.current) {
      hasMappedData.current = true;


      // Map policy limits to ratingConfig.limits
      if (policyLimitsData.policy_limits) {
        const limits = policyLimitsData.policy_limits;

        // Update policy limits
        if (limits.maximum_cover) {
          updateLimits('maximumCover', limits.maximum_cover.value);
        }
        if (limits.minimum_premium) {
          updateLimits('minimumPremium', limits.minimum_premium.value);
        }
        if (limits.base_broker_commission) {
          updateLimits('baseBrokerCommission', limits.base_broker_commission.value);
        }
        if (limits.maximum_broker_commission) {
          updateLimits('maximumBrokerCommission', limits.maximum_broker_commission.value);
        }
        if (limits.minimum_broker_commission) {
          updateLimits('minimumBrokerCommission', limits.minimum_broker_commission.value);
        }
      }

      // Map sub limits to ratingConfig.coverRequirements.subLimits
      if (policyLimitsData.sub_limits && Array.isArray(policyLimitsData.sub_limits)) {
        // Clear existing sub limits and add new ones from API
        policyLimitsData.sub_limits.forEach((subLimit, index) => {
          // Add entry if it doesn't exist
          if (!ratingConfig.coverRequirements?.subLimits?.[index]) {
            addCoverRequirementEntry('subLimits');
          }

          // Update the entry with API data
          const entryId = ratingConfig.coverRequirements?.subLimits?.[index]?.id;
          if (entryId) {
            updateCoverRequirementEntry('subLimits', entryId, 'title', subLimit.title);
            updateCoverRequirementEntry('subLimits', entryId, 'description', subLimit.description);
            updateCoverRequirementEntry('subLimits', entryId, 'value', subLimit.value);
            updateCoverRequirementEntry('subLimits', entryId, 'pricingType',
              subLimit.pricing_type === 'FIXED_AMOUNT' ? 'fixed' :
                subLimit.pricing_type === 'PERCENTAGE_OF_SUM_INSURED' ? 'percentage_sum_insured' :
                  subLimit.pricing_type === 'PERCENTAGE_OF_LOSS' ? 'percentage_loss' : 'fixed'
            );
          }
        });
      }

      // Map deductibles to ratingConfig.coverRequirements.deductibles
      if (policyLimitsData.deductibles && Array.isArray(policyLimitsData.deductibles)) {
        policyLimitsData.deductibles.forEach((deductible, index) => {
          // Add entry if it doesn't exist
          if (!ratingConfig.coverRequirements?.deductibles?.[index]) {
            addCoverRequirementEntry('deductibles');
          }

          // Update the entry with API data
          const entryId = ratingConfig.coverRequirements?.deductibles?.[index]?.id;
          if (entryId) {
            updateCoverRequirementEntry('deductibles', entryId, 'deductibleType',
              deductible.type === 'FIXED_AMOUNT' ? 'fixed' :
                deductible.type === 'PERCENTAGE_OF_LOSS' ? 'percentage_loss' :
                  deductible.type === 'PERCENTAGE_OF_SUM_INSURED' ? 'percentage_sum_insured' : 'fixed'
            );
            updateCoverRequirementEntry('deductibles', entryId, 'value', deductible.value);
            updateCoverRequirementEntry('deductibles', entryId, 'quoteOption',
              deductible.quote_option === 'AUTO_QUOTE' ? 'quote' : 'no-quote'
            );
            updateCoverRequirementEntry('deductibles', entryId, 'loadingDiscount', deductible.loading_discount);
          }
        });
      }


    }
  }, [policyLimitsData, ratingConfig, updateLimits, addCoverRequirementEntry, updateCoverRequirementEntry]);

  // Reset mapping flag when new data arrives
  useEffect(() => {
    if (policyLimitsData) {
      hasMappedData.current = false;
    }
  }, [policyLimitsData]);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Policy Limits & Deductibles</CardTitle>
            <CardDescription>Configure policy limits and deductible adjustments</CardDescription>
          </div>
          <Button onClick={onSave} size="sm" disabled={isLoading || isSaving}>
            <Save className="w-4 h-4 mr-1" />
            {isLoading ? 'Loading...' : isSaving ? 'Saving...' : 'Save Limits & Deductibles'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 overflow-x-auto">
        {!ratingConfig.limits?.minimumPremium && (
          <div className="rounded-md border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 mb-6">
            <p className="font-medium">Yet to configure this section</p>
            <p className="text-sm mt-1">Configure policy limits below.</p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Limit</TableHead>
                  <TableHead>Deductible</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableSkeleton rowCount={8} colCount={4} />
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Policy Limits */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Policy Limits</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">Limit Type</TableHead>
                      <TableHead className="w-1/3">Pricing Type</TableHead>
                      <TableHead className="w-1/3">Value (AED)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Minimum Premium</TableCell>
                      <TableCell>
                        <Select defaultValue="fixed">
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage-sum-insured">Percentage of Sum Insured</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={ratingConfig.limits?.minimumPremium || 0}
                          onChange={(e) => updateLimits('minimumPremium', parseInt(e.target.value) || 0)}
                          className="w-full"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Maximum Cover</TableCell>
                      <TableCell>
                        <Select defaultValue="fixed">
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage-sum-insured">Percentage of Sum Insured</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={ratingConfig.limits?.maximumCover || 0}
                          onChange={(e) => updateLimits('maximumCover', parseInt(e.target.value) || 0)}
                          className="w-full"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Base Broker Commission</TableCell>
                      <TableCell>
                        <Select defaultValue="percentage">
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={ratingConfig.limits?.baseBrokerCommission || 0}
                          onChange={(e) => updateLimits('baseBrokerCommission', parseInt(e.target.value) || 0)}
                          className="w-full"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Minimum Broker Commission</TableCell>
                      <TableCell>
                        <Select defaultValue="percentage">
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={ratingConfig.limits?.minimumBrokerCommission || 0}
                          onChange={(e) => updateLimits('minimumBrokerCommission', parseInt(e.target.value) || 0)}
                          className="w-full"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Maximum Broker Commission</TableCell>
                      <TableCell>
                        <Select defaultValue="percentage">
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={ratingConfig.limits?.maximumBrokerCommission || 0}
                          onChange={(e) => updateLimits('maximumBrokerCommission', parseInt(e.target.value) || 0)}
                          className="w-full"
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Sub-limits - HIDDEN */}
            {false && <Card className="border border-border bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Sub-limits</CardTitle>
                  <p className="text-xs text-muted-foreground">Define coverage sub-limits and restrictions</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addCoverRequirementEntry('subLimits')}
                  >
                    Add Sub-limit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4">Title</TableHead>
                      <TableHead className="w-1/3">Description</TableHead>
                      <TableHead className="w-1/5">Pricing Type</TableHead>
                      <TableHead className="w-1/6">Value</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ratingConfig.coverRequirements.subLimits?.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Input
                            type="text"
                            value={entry.title || ''}
                            onChange={(e) => updateCoverRequirementEntry('subLimits', entry.id, 'title', e.target.value)}
                            className="w-full"
                            placeholder="Enter title"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={entry.description || ''}
                            onChange={(e) => updateCoverRequirementEntry('subLimits', entry.id, 'description', e.target.value)}
                            className="w-full"
                            placeholder="Enter description"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={entry.pricingType || 'fixed'}
                            onValueChange={(value) => updateCoverRequirementEntry('subLimits', entry.id, 'pricingType', value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage-sum-insured">Percentage of Sum Insured</SelectItem>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={entry.value || 0}
                            onChange={(e) => updateCoverRequirementEntry('subLimits', entry.id, 'value', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCoverRequirementEntry('subLimits', entry.id)}
                            className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) || (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No sub-limits configured. Click "Add Sub-limit" to get started.
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>}

            {/* Deductibles - HIDDEN */}
            {false && <Card className="border border-border bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Deductibles</CardTitle>
                  <p className="text-xs text-muted-foreground">Configure deductible options and pricing</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addCoverRequirementEntry('deductibles')}
                  >
                    Add Deductible
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4">Deductible Type</TableHead>
                      <TableHead className="w-1/5">Value</TableHead>
                      <TableHead className="w-1/5">Loading/Discount</TableHead>
                      <TableHead className="w-1/4">Quote Option</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ratingConfig.coverRequirements.deductibles?.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Select
                            value={entry.deductibleType || 'fixed'}
                            onValueChange={(value) => updateCoverRequirementEntry('deductibles', entry.id, 'deductibleType', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                              <SelectItem value="percentage-loss">Percentage of Loss</SelectItem>
                              <SelectItem value="percentage-sum-insured">Percentage of Sum Insured</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={entry.value || 0}
                            onChange={(e) => updateCoverRequirementEntry('deductibles', entry.id, 'value', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={entry.loadingDiscount || 0}
                            onChange={(e) => updateCoverRequirementEntry('deductibles', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={entry.quoteOption || 'quote'}
                            onValueChange={(value) => updateCoverRequirementEntry('deductibles', entry.id, 'quoteOption', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="quote">Auto Quote</SelectItem>
                              <SelectItem value="no-quote">No Quote</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCoverRequirementEntry('deductibles', entry.id)}
                            className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) || (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No deductibles configured. Click "Add Deductible" to get started.
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PolicyLimitsDeductibles;



