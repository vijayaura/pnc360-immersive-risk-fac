import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

type ContractorRiskFactorsProps = {
  ratingConfig: any;
  onSave: () => void;
  addContractorRiskEntry: (category: string) => void;
  updateContractorRiskEntry: (category: string, id: number, field: string, value: any) => void;
  removeContractorRiskEntry: (category: string, id: number) => void;
  isLoading?: boolean;
  error?: string | null;
  isSaving?: boolean;
};

const ContractorRiskFactors: React.FC<ContractorRiskFactorsProps> = ({
  ratingConfig,
  onSave,
  addContractorRiskEntry,
  updateContractorRiskEntry,
  removeContractorRiskEntry,
  isLoading = false,
  error = null,
  isSaving = false,
}) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Contractor Risk Factors</CardTitle>
            <CardDescription>Configure risk adjustments based on contractor profile</CardDescription>
          </div>
          <Button onClick={onSave} size="sm" disabled={isLoading || isSaving}>
            {isLoading || isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            {isLoading ? 'Loading...' : isSaving ? 'Saving...' : 'Save Contractor Risk Factors'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading && (
          <div className="space-y-6">
            {/* Experience Loadings Skeleton */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="w-48 h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-6 gap-4">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <div key={j} className="h-10 bg-gray-200 rounded animate-pulse" />
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Claims Based Loading Skeleton */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3">
                <div className="w-56 h-5 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-6 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                        ))}
                      </div>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-6 gap-4">
                          {Array.from({ length: 6 }).map((_, j) => (
                            <div key={j} className="h-10 bg-gray-200 rounded animate-pulse" />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-40 h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-6 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                        ))}
                      </div>
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-6 gap-4">
                          {Array.from({ length: 6 }).map((_, j) => (
                            <div key={j} className="h-10 bg-gray-200 rounded animate-pulse" />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Contractor Number Based Skeleton */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="w-64 h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="w-40 h-4 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-6 gap-4">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <div key={j} className="h-10 bg-gray-200 rounded animate-pulse" />
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {!isLoading && (
          <>
            {(!ratingConfig.contractorRisk?.experienceDiscounts?.length && 
              !ratingConfig.contractorRisk?.claimFrequency?.length && 
              !ratingConfig.contractorRisk?.claimAmountCategories?.length &&
              !ratingConfig.contractorRisk?.contractorNumbers?.length &&
              !ratingConfig.contractorRisk?.subcontractorNumbers?.length) && (
              <div className="rounded-md border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 mb-4">
                <p className="font-medium">Yet to configure this section</p>
                <p className="text-sm mt-1">Start by adding rows to configure contractor risk factors below.</p>
              </div>
            )}
            <div className="space-y-6">
          {/* Experience Loadings/Discounts */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Experience Loadings/Discounts</CardTitle>
                <p className="text-xs text-muted-foreground">Experience in years</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => addContractorRiskEntry('experienceDiscounts')}
                >
                  Add Row
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/6">From</TableHead>
                    <TableHead className="w-1/6">To</TableHead>
                    <TableHead className="w-1/5">Pricing Type</TableHead>
                    <TableHead className="w-1/5">Loading/Discount</TableHead>
                    <TableHead className="w-1/5">Quote Option</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratingConfig.contractorRisk.experienceDiscounts.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Input
                          type="number"
                          value={entry.from}
                          onChange={(e) => updateContractorRiskEntry('experienceDiscounts', entry.id, 'from', parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={entry.to}
                          onChange={(e) => updateContractorRiskEntry('experienceDiscounts', entry.id, 'to', parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={entry.pricingType} 
                          onValueChange={(value) => updateContractorRiskEntry('experienceDiscounts', entry.id, 'pricingType', value)}
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
                          onChange={(e) => updateContractorRiskEntry('experienceDiscounts', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={entry.quoteOption} 
                          onValueChange={(value) => updateContractorRiskEntry('experienceDiscounts', entry.id, 'quoteOption', value)}
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
                          onClick={() => removeContractorRiskEntry('experienceDiscounts', entry.id)}
                          className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Claims Based Loading/Discount */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Claims Based Loading/Discount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Claim Frequency */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">Claim Frequency (Last 5 Years)</Label>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addContractorRiskEntry('claimFrequency')}
                      >
                        Add Row
                      </Button>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Pricing Type</TableHead>
                        <TableHead>Loading/Discount</TableHead>
                        <TableHead>Quote Option</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ratingConfig.contractorRisk.claimFrequency.map((entry: any) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <Input
                              type="number"
                              value={entry.from}
                              onChange={(e) => updateContractorRiskEntry('claimFrequency', entry.id, 'from', parseFloat(e.target.value) || 0)}
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={entry.to}
                              onChange={(e) => updateContractorRiskEntry('claimFrequency', entry.id, 'to', parseFloat(e.target.value) || 0)}
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={entry.pricingType} 
                              onValueChange={(value) => updateContractorRiskEntry('claimFrequency', entry.id, 'pricingType', value)}
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
                              onChange={(e) => updateContractorRiskEntry('claimFrequency', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={entry.quoteOption} 
                              onValueChange={(value) => updateContractorRiskEntry('claimFrequency', entry.id, 'quoteOption', value)}
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
                              onClick={() => removeContractorRiskEntry('claimFrequency', entry.id)}
                              className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Claim Amount Categories */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">Claim Amount Categories</Label>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addContractorRiskEntry('claimAmountCategories')}
                      >
                        Add Row
                      </Button>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>From (AED)</TableHead>
                        <TableHead>To (AED)</TableHead>
                        <TableHead>Pricing Type</TableHead>
                        <TableHead>Loading/Discount</TableHead>
                        <TableHead>Quote Option</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ratingConfig.contractorRisk.claimAmountCategories.map((entry: any) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <Input
                              type="number"
                              value={entry.from}
                              onChange={(e) => updateContractorRiskEntry('claimAmountCategories', entry.id, 'from', parseFloat(e.target.value) || 0)}
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={entry.to}
                              onChange={(e) => updateContractorRiskEntry('claimAmountCategories', entry.id, 'to', parseFloat(e.target.value) || 0)}
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={entry.pricingType} 
                              onValueChange={(value) => updateContractorRiskEntry('claimAmountCategories', entry.id, 'pricingType', value)}
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
                              onChange={(e) => updateContractorRiskEntry('claimAmountCategories', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={entry.quoteOption} 
                              onValueChange={(value) => updateContractorRiskEntry('claimAmountCategories', entry.id, 'quoteOption', value)}
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
                              onClick={() => removeContractorRiskEntry('claimAmountCategories', entry.id)}
                              className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contractor Number Based Configuration */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Contractor Number Based Configuration</CardTitle>
                <p className="text-xs text-muted-foreground">Number of contractors</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => addContractorRiskEntry('contractorNumbers')}
                >
                  Add Row
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/6">From</TableHead>
                    <TableHead className="w-1/6">To</TableHead>
                    <TableHead className="w-1/5">Pricing Type</TableHead>
                    <TableHead className="w-1/5">Loading/Discount</TableHead>
                    <TableHead className="w-1/5">Quote Option</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratingConfig.contractorRisk.contractorNumbers.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Input
                          type="number"
                          value={entry.from}
                          onChange={(e) => updateContractorRiskEntry('contractorNumbers', entry.id, 'from', parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={entry.to}
                          onChange={(e) => updateContractorRiskEntry('contractorNumbers', entry.id, 'to', parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={entry.pricingType} 
                          onValueChange={(value) => updateContractorRiskEntry('contractorNumbers', entry.id, 'pricingType', value)}
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
                          onChange={(e) => updateContractorRiskEntry('contractorNumbers', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={entry.quoteOption} 
                          onValueChange={(value) => updateContractorRiskEntry('contractorNumbers', entry.id, 'quoteOption', value)}
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
                          onClick={() => removeContractorRiskEntry('contractorNumbers', entry.id)}
                          className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Subcontractor Number Based Configuration */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Subcontractor Number Based Configuration</CardTitle>
                <p className="text-xs text-muted-foreground">Number of subcontractors</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => addContractorRiskEntry('subcontractorNumbers')}
                >
                  Add Row
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/6">From</TableHead>
                    <TableHead className="w-1/6">To</TableHead>
                    <TableHead className="w-1/5">Pricing Type</TableHead>
                    <TableHead className="w-1/5">Loading/Discount</TableHead>
                    <TableHead className="w-1/5">Quote Option</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratingConfig.contractorRisk.subcontractorNumbers.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Input
                          type="number"
                          value={entry.from}
                          onChange={(e) => updateContractorRiskEntry('subcontractorNumbers', entry.id, 'from', parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={entry.to}
                          onChange={(e) => updateContractorRiskEntry('subcontractorNumbers', entry.id, 'to', parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={entry.pricingType} 
                          onValueChange={(value) => updateContractorRiskEntry('subcontractorNumbers', entry.id, 'pricingType', value)}
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
                          onChange={(e) => updateContractorRiskEntry('subcontractorNumbers', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={entry.quoteOption} 
                          onValueChange={(value) => updateContractorRiskEntry('subcontractorNumbers', entry.id, 'quoteOption', value)}
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
                          onClick={() => removeContractorRiskEntry('subcontractorNumbers', entry.id)}
                          className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ContractorRiskFactors;


