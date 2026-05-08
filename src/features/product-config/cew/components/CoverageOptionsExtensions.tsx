import React, { useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, AlertCircle, X } from "lucide-react";
import { CoverageOptionsResponse } from '@/features/insurers/api/insurers';
import TableSkeleton from "@/components/loaders/TableSkeleton";

export interface CoverageOptionsExtensionsProps {
  ratingConfig: any;
  onSave: () => void;
  addCoverRequirementEntry: (category: string) => void;
  updateCoverRequirementEntry: (category: string, id: number, field: string, value: any) => void;
  removeCoverRequirementEntry: (category: string, id: number) => void;
  updateCoverRequirement: (category: string, key: string, value: number) => void;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  coverageOptionsData: CoverageOptionsResponse | null;
}

const CoverageOptionsExtensions: React.FC<CoverageOptionsExtensionsProps> = ({
  ratingConfig,
  onSave,
  addCoverRequirementEntry,
  updateCoverRequirementEntry,
  removeCoverRequirementEntry,
  updateCoverRequirement,
  isLoading,
  isSaving,
  error,
  coverageOptionsData,
}) => {
  // Track if data has been mapped to prevent continuous overwrites
  const hasBeenMapped = useRef(false);

  // Auto-populate fields when API data is available (ONE-TIME MAPPING)
  useEffect(() => {
    if (coverageOptionsData && ratingConfig && !hasBeenMapped.current) {
      console.log('🔄 Mapping Coverage Options API data to UI fields (one-time)');
      hasBeenMapped.current = true;
      // Map sum_insured_loadings to sumInsured entries
      if (coverageOptionsData.sum_insured_loadings && ratingConfig.coverRequirements?.sumInsured) {
        coverageOptionsData.sum_insured_loadings.forEach((apiEntry, index) => {
          if (ratingConfig.coverRequirements.sumInsured[index]) {
            const entry = ratingConfig.coverRequirements.sumInsured[index];
            updateCoverRequirementEntry('sumInsured', entry.id, 'from', apiEntry.from_amount);
            updateCoverRequirementEntry('sumInsured', entry.id, 'to', apiEntry.to_amount);
            updateCoverRequirementEntry('sumInsured', entry.id, 'pricingType', apiEntry.pricing_type.toLowerCase());
            updateCoverRequirementEntry('sumInsured', entry.id, 'loadingDiscount', apiEntry.loading_discount);
            updateCoverRequirementEntry('sumInsured', entry.id, 'quoteOption', apiEntry.quote_option === 'AUTO_QUOTE' ? 'quote' : 'no-quote');
          }
        });
      }

      // Map project_value_loadings to projectValue entries
      if (coverageOptionsData.project_value_loadings && ratingConfig.coverRequirements?.projectValue) {
        coverageOptionsData.project_value_loadings.forEach((apiEntry, index) => {
          if (ratingConfig.coverRequirements.projectValue[index]) {
            const entry = ratingConfig.coverRequirements.projectValue[index];
            updateCoverRequirementEntry('projectValue', entry.id, 'from', apiEntry.from_amount);
            updateCoverRequirementEntry('projectValue', entry.id, 'to', apiEntry.to_amount);
            updateCoverRequirementEntry('projectValue', entry.id, 'pricingType', apiEntry.pricing_type.toLowerCase());
            updateCoverRequirementEntry('projectValue', entry.id, 'loadingDiscount', apiEntry.loading_discount);
            updateCoverRequirementEntry('projectValue', entry.id, 'quoteOption', apiEntry.quote_option === 'AUTO_QUOTE' ? 'quote' : 'no-quote');
          }
        });
      }

      // Map contract_works_loadings to contractWorks entries
      if (coverageOptionsData.contract_works_loadings && ratingConfig.coverRequirements?.contractWorks) {
        coverageOptionsData.contract_works_loadings.forEach((apiEntry, index) => {
          if (ratingConfig.coverRequirements.contractWorks[index]) {
            const entry = ratingConfig.coverRequirements.contractWorks[index];
            updateCoverRequirementEntry('contractWorks', entry.id, 'from', apiEntry.from_amount);
            updateCoverRequirementEntry('contractWorks', entry.id, 'to', apiEntry.to_amount);
            updateCoverRequirementEntry('contractWorks', entry.id, 'pricingType', apiEntry.pricing_type.toLowerCase());
            updateCoverRequirementEntry('contractWorks', entry.id, 'loadingDiscount', apiEntry.loading_discount);
            updateCoverRequirementEntry('contractWorks', entry.id, 'quoteOption', apiEntry.quote_option === 'AUTO_QUOTE' ? 'quote' : 'no-quote');
          }
        });
      }

      // Map plant_equipment_loadings to plantEquipment entries
      if (coverageOptionsData.plant_equipment_loadings && ratingConfig.coverRequirements?.plantEquipment) {
        coverageOptionsData.plant_equipment_loadings.forEach((apiEntry, index) => {
          if (ratingConfig.coverRequirements.plantEquipment[index]) {
            const entry = ratingConfig.coverRequirements.plantEquipment[index];
            updateCoverRequirementEntry('plantEquipment', entry.id, 'from', apiEntry.from_amount);
            updateCoverRequirementEntry('plantEquipment', entry.id, 'to', apiEntry.to_amount);
            updateCoverRequirementEntry('plantEquipment', entry.id, 'pricingType', apiEntry.pricing_type.toLowerCase());
            updateCoverRequirementEntry('plantEquipment', entry.id, 'loadingDiscount', apiEntry.loading_discount);
            updateCoverRequirementEntry('plantEquipment', entry.id, 'quoteOption', apiEntry.quote_option === 'AUTO_QUOTE' ? 'quote' : 'no-quote');
          }
        });
      }

      // Map temporay_work to temporaryWorks entries
      if (coverageOptionsData.temporay_work && ratingConfig.coverRequirements?.temporaryWorks) {
        coverageOptionsData.temporay_work.forEach((apiEntry, index) => {
          if (ratingConfig.coverRequirements.temporaryWorks[index]) {
            const entry = ratingConfig.coverRequirements.temporaryWorks[index];
            updateCoverRequirementEntry('temporaryWorks', entry.id, 'from', apiEntry.from_amount);
            updateCoverRequirementEntry('temporaryWorks', entry.id, 'to', apiEntry.to_amount);
            updateCoverRequirementEntry('temporaryWorks', entry.id, 'pricingType', apiEntry.pricing_type.toLowerCase());
            updateCoverRequirementEntry('temporaryWorks', entry.id, 'loadingDiscount', apiEntry.loading_discount);
            updateCoverRequirementEntry('temporaryWorks', entry.id, 'quoteOption', apiEntry.quote_option === 'AUTO_QUOTE' ? 'quote' : 'no-quote');
          }
        });
      }

      // Map other_materials to otherMaterials entries
      if (coverageOptionsData.other_materials && ratingConfig.coverRequirements?.otherMaterials) {
        coverageOptionsData.other_materials.forEach((apiEntry, index) => {
          if (ratingConfig.coverRequirements.otherMaterials[index]) {
            const entry = ratingConfig.coverRequirements.otherMaterials[index];
            updateCoverRequirementEntry('otherMaterials', entry.id, 'from', apiEntry.from_amount);
            updateCoverRequirementEntry('otherMaterials', entry.id, 'to', apiEntry.to_amount);
            updateCoverRequirementEntry('otherMaterials', entry.id, 'pricingType', apiEntry.pricing_type.toLowerCase());
            updateCoverRequirementEntry('otherMaterials', entry.id, 'loadingDiscount', apiEntry.loading_discount);
            updateCoverRequirementEntry('otherMaterials', entry.id, 'quoteOption', apiEntry.quote_option === 'AUTO_QUOTE' ? 'quote' : 'no-quote');
          }
        });
      }

      // Map Principal_Existing_Surrounding_Property to principalExistingProperty entries
      if (coverageOptionsData.Principal_Existing_Surrounding_Property && ratingConfig.coverRequirements?.principalExistingProperty) {
        coverageOptionsData.Principal_Existing_Surrounding_Property.forEach((apiEntry, index) => {
          if (ratingConfig.coverRequirements.principalExistingProperty[index]) {
            const entry = ratingConfig.coverRequirements.principalExistingProperty[index];
            updateCoverRequirementEntry('principalExistingProperty', entry.id, 'from', apiEntry.from_amount);
            updateCoverRequirementEntry('principalExistingProperty', entry.id, 'to', apiEntry.to_amount);
            updateCoverRequirementEntry('principalExistingProperty', entry.id, 'pricingType', apiEntry.pricing_type.toLowerCase());
            updateCoverRequirementEntry('principalExistingProperty', entry.id, 'loadingDiscount', apiEntry.loading_discount);
            updateCoverRequirementEntry('principalExistingProperty', entry.id, 'quoteOption', apiEntry.quote_option === 'AUTO_QUOTE' ? 'quote' : 'no-quote');
          }
        });
      }

      // Map cross_liability_cover to crossLiabilityCover
      if (coverageOptionsData.cross_liability_cover && ratingConfig.coverRequirements?.crossLiabilityCover) {
        coverageOptionsData.cross_liability_cover.forEach((apiEntry) => {
          const key = apiEntry.cover_option.includes('Yes') ? 'yes' : 'no';
          updateCoverRequirement('crossLiabilityCover', key, apiEntry.loading_discount);
        });
      }
    }
  }, [coverageOptionsData, ratingConfig]);

  // Reset mapping flag when new API data arrives
  useEffect(() => {
    if (coverageOptionsData) {
      hasBeenMapped.current = false;
    }
  }, [coverageOptionsData]);


  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cover Requirements Configuration</CardTitle>
            <CardDescription>Configure loading/discount rates based on cover requirement values from proposal form</CardDescription>
          </div>
          <Button onClick={onSave} size="sm" disabled={isLoading || isSaving}>
            <Save className="w-4 h-4 mr-1" />
            {isLoading ? 'Loading...' : isSaving ? 'Saving...' : 'Save Cover Requirements'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {(!ratingConfig.coverRequirements?.projectValue?.length && 
          !ratingConfig.coverRequirements?.contractWorks?.length &&
          !ratingConfig.coverRequirements?.plantAndEquipment?.length &&
          !ratingConfig.coverRequirements?.temporaryWorks?.length &&
          !ratingConfig.coverRequirements?.otherMaterials?.length &&
          !ratingConfig.coverRequirements?.principalsProperty?.length) && (
          <div className="rounded-md border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 mb-6">
            <p className="font-medium">Yet to configure this section</p>
            <p className="text-sm mt-1">Start by adding rows to configure cover requirements below.</p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coverage Option</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableSkeleton numRows={10} numCols={4} />
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sum Insured */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Sum Insured</CardTitle>
                  <p className="text-xs text-muted-foreground">Rate based on sum insured value ranges</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addCoverRequirementEntry('sumInsured')}
                  >
                    Add Row
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/6">From (AED)</TableHead>
                      <TableHead className="w-1/6">To (AED)</TableHead>
                      <TableHead className="w-1/5">Pricing Type</TableHead>
                      <TableHead className="w-1/5">Loading/Discount</TableHead>
                      <TableHead className="w-1/5">Quote Option</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ratingConfig.coverRequirements?.sumInsured?.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.from || 0}
                            onChange={(e) => updateCoverRequirementEntry('sumInsured', entry.id, 'from', parseFloat(e.target.value) || 0)}
                            className="w-full"
                            placeholder="From amount"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.to || 0}
                            onChange={(e) => updateCoverRequirementEntry('sumInsured', entry.id, 'to', parseFloat(e.target.value) || 0)}
                            className="w-full"
                            placeholder="To amount"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={entry.pricingType || 'percentage'} 
                            onValueChange={(value) => updateCoverRequirementEntry('sumInsured', entry.id, 'pricingType', value)}
                          >
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
                            step="0.01"
                            value={entry.loadingDiscount || 0}
                            onChange={(e) => updateCoverRequirementEntry('sumInsured', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                            className="w-full"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={entry.quoteOption || 'quote'} 
                            onValueChange={(value) => updateCoverRequirementEntry('sumInsured', entry.id, 'quoteOption', value)}
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
                            onClick={() => removeCoverRequirementEntry('sumInsured', entry.id)}
                            className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) || []}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Project Value */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Project Value</CardTitle>
                  <p className="text-xs text-muted-foreground">Rate based on project value ranges</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addCoverRequirementEntry('projectValue')}
                  >
                    Add Row
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/6">From (AED)</TableHead>
                      <TableHead className="w-1/6">To (AED)</TableHead>
                      <TableHead className="w-1/5">Pricing Type</TableHead>
                      <TableHead className="w-1/5">Loading/Discount</TableHead>
                      <TableHead className="w-1/5">Quote Option</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ratingConfig.coverRequirements?.projectValue?.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.from}
                            onChange={(e) => updateCoverRequirementEntry('projectValue', entry.id, 'from', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.to}
                            onChange={(e) => updateCoverRequirementEntry('projectValue', entry.id, 'to', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={entry.pricingType} 
                            onValueChange={(value) => updateCoverRequirementEntry('projectValue', entry.id, 'pricingType', value)}
                          >
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
                            step="0.01"
                            value={entry.loadingDiscount}
                            onChange={(e) => updateCoverRequirementEntry('projectValue', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={entry.quoteOption} 
                            onValueChange={(value) => updateCoverRequirementEntry('projectValue', entry.id, 'quoteOption', value)}
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
                            onClick={() => removeCoverRequirementEntry('projectValue', entry.id)}
                            className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) || []}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Contract Works */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Contract Works (Material Damage)</CardTitle>
                  <p className="text-xs text-muted-foreground">Rate based on contract works value ranges</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addCoverRequirementEntry('contractWorks')}
                  >
                    Add Row
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/6">From (AED)</TableHead>
                      <TableHead className="w-1/6">To (AED)</TableHead>
                      <TableHead className="w-1/5">Pricing Type</TableHead>
                      <TableHead className="w-1/5">Loading/Discount</TableHead>
                      <TableHead className="w-1/5">Quote Option</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ratingConfig.coverRequirements?.contractWorks?.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.from}
                            onChange={(e) => updateCoverRequirementEntry('contractWorks', entry.id, 'from', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.to}
                            onChange={(e) => updateCoverRequirementEntry('contractWorks', entry.id, 'to', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={entry.pricingType} 
                            onValueChange={(value) => updateCoverRequirementEntry('contractWorks', entry.id, 'pricingType', value)}
                          >
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
                            step="0.01"
                            value={entry.loadingDiscount}
                            onChange={(e) => updateCoverRequirementEntry('contractWorks', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={entry.quoteOption} 
                            onValueChange={(value) => updateCoverRequirementEntry('contractWorks', entry.id, 'quoteOption', value)}
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
                            onClick={() => removeCoverRequirementEntry('contractWorks', entry.id)}
                            className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) || []}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Plant & Equipment */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Plant & Equipment (CPM)</CardTitle>
                  <p className="text-xs text-muted-foreground">Rate based on plant & machinery value ranges</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addCoverRequirementEntry('plantEquipment')}
                  >
                    Add Row
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/6">From (AED)</TableHead>
                      <TableHead className="w-1/6">To (AED)</TableHead>
                      <TableHead className="w-1/5">Pricing Type</TableHead>
                      <TableHead className="w-1/5">Loading/Discount</TableHead>
                      <TableHead className="w-1/5">Quote Option</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ratingConfig.coverRequirements?.plantEquipment?.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.from}
                            onChange={(e) => updateCoverRequirementEntry('plantEquipment', entry.id, 'from', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.to}
                            onChange={(e) => updateCoverRequirementEntry('plantEquipment', entry.id, 'to', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={entry.pricingType} 
                            onValueChange={(value) => updateCoverRequirementEntry('plantEquipment', entry.id, 'pricingType', value)}
                          >
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
                            step="0.01"
                            value={entry.loadingDiscount}
                            onChange={(e) => updateCoverRequirementEntry('plantEquipment', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={entry.quoteOption} 
                            onValueChange={(value) => updateCoverRequirementEntry('plantEquipment', entry.id, 'quoteOption', value)}
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
                            onClick={() => removeCoverRequirementEntry('plantEquipment', entry.id)}
                            className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) || []}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Temporary Works */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Temporary Works</CardTitle>
                  <p className="text-xs text-muted-foreground">Rate based on temporary works value ranges</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addCoverRequirementEntry('temporaryWorks')}
                  >
                    Add Row
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/6">From (AED)</TableHead>
                      <TableHead className="w-1/6">To (AED)</TableHead>
                      <TableHead className="w-1/5">Pricing Type</TableHead>
                      <TableHead className="w-1/5">Loading/Discount</TableHead>
                      <TableHead className="w-1/5">Quote Option</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ratingConfig.coverRequirements?.temporaryWorks?.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.from}
                            onChange={(e) => updateCoverRequirementEntry('temporaryWorks', entry.id, 'from', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.to}
                            onChange={(e) => updateCoverRequirementEntry('temporaryWorks', entry.id, 'to', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={entry.pricingType} 
                            onValueChange={(value) => updateCoverRequirementEntry('temporaryWorks', entry.id, 'pricingType', value)}
                          >
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
                            step="0.01"
                            value={entry.loadingDiscount}
                            onChange={(e) => updateCoverRequirementEntry('temporaryWorks', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={entry.quoteOption} 
                            onValueChange={(value) => updateCoverRequirementEntry('temporaryWorks', entry.id, 'quoteOption', value)}
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
                            onClick={() => removeCoverRequirementEntry('temporaryWorks', entry.id)}
                            className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) || []}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Other Materials */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Other Materials</CardTitle>
                  <p className="text-xs text-muted-foreground">Rate based on other materials value ranges</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addCoverRequirementEntry('otherMaterials')}
                  >
                    Add Row
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/6">From (AED)</TableHead>
                      <TableHead className="w-1/6">To (AED)</TableHead>
                      <TableHead className="w-1/5">Pricing Type</TableHead>
                      <TableHead className="w-1/5">Loading/Discount</TableHead>
                      <TableHead className="w-1/5">Quote Option</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ratingConfig.coverRequirements?.otherMaterials?.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.from}
                            onChange={(e) => updateCoverRequirementEntry('otherMaterials', entry.id, 'from', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.to}
                            onChange={(e) => updateCoverRequirementEntry('otherMaterials', entry.id, 'to', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={entry.pricingType} 
                            onValueChange={(value) => updateCoverRequirementEntry('otherMaterials', entry.id, 'pricingType', value)}
                          >
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
                            step="0.01"
                            value={entry.loadingDiscount}
                            onChange={(e) => updateCoverRequirementEntry('otherMaterials', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={entry.quoteOption} 
                            onValueChange={(value) => updateCoverRequirementEntry('otherMaterials', entry.id, 'quoteOption', value)}
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
                            onClick={() => removeCoverRequirementEntry('otherMaterials', entry.id)}
                            className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) || []}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Principal's Existing/Surrounding Property */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Principal's Existing/Surrounding Property</CardTitle>
                  <p className="text-xs text-muted-foreground">Rate based on principal's existing/surrounding property value ranges</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addCoverRequirementEntry('principalExistingProperty')}
                  >
                    Add Row
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/6">From (AED)</TableHead>
                      <TableHead className="w-1/6">To (AED)</TableHead>
                      <TableHead className="w-1/5">Pricing Type</TableHead>
                      <TableHead className="w-1/5">Loading/Discount</TableHead>
                      <TableHead className="w-1/5">Quote Option</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ratingConfig.coverRequirements?.principalExistingProperty?.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.from}
                            onChange={(e) => updateCoverRequirementEntry('principalExistingProperty', entry.id, 'from', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={entry.to}
                            onChange={(e) => updateCoverRequirementEntry('principalExistingProperty', entry.id, 'to', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={entry.pricingType} 
                            onValueChange={(value) => updateCoverRequirementEntry('principalExistingProperty', entry.id, 'pricingType', value)}
                          >
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
                            step="0.01"
                            value={entry.loadingDiscount}
                            onChange={(e) => updateCoverRequirementEntry('principalExistingProperty', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={entry.quoteOption} 
                            onValueChange={(value) => updateCoverRequirementEntry('principalExistingProperty', entry.id, 'quoteOption', value)}
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
                            onClick={() => removeCoverRequirementEntry('principalExistingProperty', entry.id)}
                            className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) || []}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Cross Liability Cover */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Cross Liability Cover</CardTitle>
                    <p className="text-xs text-muted-foreground">Rate based on cross liability cover selection</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4">Cover Option</TableHead>
                      <TableHead className="w-1/4">Pricing Type</TableHead>
                      <TableHead className="w-1/4">Loading/Discount</TableHead>
                      <TableHead className="w-1/4">Quote Option</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { key: 'yes', label: 'Yes (Included)' },
                      { key: 'no', label: 'No (Not Included)' }
                    ].map((option) => (
                      <TableRow key={option.key}>
                        <TableCell className="font-medium">{option.label}</TableCell>
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
                            step="0.01"
                            value={ratingConfig.coverRequirements?.crossLiabilityCover?.[option.key as keyof typeof ratingConfig.coverRequirements.crossLiabilityCover] || 0}
                            onChange={(e) => updateCoverRequirement('crossLiabilityCover', option.key, parseFloat(e.target.value) || 0)}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Select defaultValue="quote">
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="quote">Auto Quote</SelectItem>
                              <SelectItem value="no-quote">No Quote</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CoverageOptionsExtensions;
