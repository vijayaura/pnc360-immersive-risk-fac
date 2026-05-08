import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plus, AlertCircle, X } from "lucide-react";
import TableSkeleton from "@/components/loaders/TableSkeleton";

export interface FeeTypeItem {
  id: string;
  label: string;
  value: number;
  status: 'ACTIVE' | 'INACTIVE';
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  display_order: number;
}

type FeeTypesProps = {
  feeTypesConfigData: any[];
  isLoadingFeeTypesConfig: boolean;
  feeTypesConfigError: string | null;
  onSave: (feeTypes: FeeTypeItem[]) => Promise<void>;
  isSaving?: boolean;
};

const FeeTypes: React.FC<FeeTypesProps> = ({
  feeTypesConfigData,
  isLoadingFeeTypesConfig,
  feeTypesConfigError,
  onSave,
  isSaving = false,
}) => {
  const [feeTypes, setFeeTypes] = useState<FeeTypeItem[]>([]);

  // Populate form data when API data is available
  useEffect(() => {
    console.log('🔍 Fee Types Effect Triggered:', {
      hasConfigData: !!feeTypesConfigData,
      configDataLength: feeTypesConfigData?.length,
      configData: feeTypesConfigData
    });

    if (feeTypesConfigData && feeTypesConfigData.length > 0) {
      console.log('✅ Populating Fee Types form data...');
      const mappedFeeTypes: FeeTypeItem[] = feeTypesConfigData.map((item: any, index: number) => ({
        id: `fee-${index}`,
        label: item.label || '',
        value: item.value || 0,
        status: item.status || 'ACTIVE',
        pricing_type: item.pricing_type || 'PERCENTAGE',
        display_order: item.display_order || index + 1
      }));
      
      setFeeTypes(mappedFeeTypes);
      console.log('✅ Fee Types form data populated:', mappedFeeTypes);
    } else if (feeTypesConfigData && feeTypesConfigData.length === 0) {
      // If API returns empty array, start with one empty row
      setFeeTypes([{
        id: 'fee-0',
        label: '',
        value: 0,
        status: 'ACTIVE',
        pricing_type: 'PERCENTAGE',
        display_order: 1
      }]);
    }
  }, [feeTypesConfigData]);

  const addFeeType = () => {
    const newId = `fee-${Date.now()}`;
    const newFeeType: FeeTypeItem = {
      id: newId,
      label: '',
      value: 0,
      status: 'ACTIVE',
      pricing_type: 'PERCENTAGE',
      display_order: feeTypes.length + 1
    };
    setFeeTypes([...feeTypes, newFeeType]);
  };

  const removeFeeType = (id: string) => {
    setFeeTypes(feeTypes.filter(fee => fee.id !== id));
  };

  const updateFeeType = (id: string, field: keyof FeeTypeItem, value: any) => {
    setFeeTypes(feeTypes.map(fee => 
      fee.id === id ? { ...fee, [field]: value } : fee
    ));
  };

  const handleSave = async () => {
    // Filter out empty fee types
    const validFeeTypes = feeTypes.filter(fee => fee.label.trim() !== '');
    await onSave(validFeeTypes);
  };

  if (isLoadingFeeTypesConfig) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Fee Types</CardTitle>
          <CardDescription>Configure fee types and their values (VAT, GST, etc.)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Pricing Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeleton numRows={3} numCols={5} />
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Fee Types</CardTitle>
            <CardDescription>Configure fee types and their values (VAT, GST, etc.)</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={addFeeType} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Row
            </Button>
            <Button onClick={handleSave} size="sm" disabled={isSaving}>
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {feeTypes.length === 0 && !isLoadingFeeTypesConfig && (
          <div className="rounded-md border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 mb-6">
            <p className="font-medium">Yet to configure this section</p>
            <p className="text-sm mt-1">Add fee types and configure their values below.</p>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Pricing Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feeTypes.map((fee) => (
              <TableRow key={fee.id}>
                <TableCell>
                  <Input
                    value={fee.label}
                    onChange={(e) => updateFeeType(fee.id, 'label', e.target.value)}
                    placeholder="Enter fee type name"
                    className="w-full"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={fee.pricing_type}
                    onValueChange={(value: 'PERCENTAGE' | 'FIXED_RATE') => 
                      updateFeeType(fee.id, 'pricing_type', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FIXED_RATE">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step={fee.pricing_type === "PERCENTAGE" ? "0.01" : "1"}
                      value={fee.value}
                      onChange={(e) => updateFeeType(fee.id, 'value', parseFloat(e.target.value) || 0)}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">
                      {fee.pricing_type === "PERCENTAGE" ? "%" : "AED"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={fee.status}
                    onValueChange={(value: 'ACTIVE' | 'INACTIVE') => 
                      updateFeeType(fee.id, 'status', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFeeType(fee.id)}
                    aria-label="Remove fee type"
                    className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                    // disabled={feeTypes.length === 1}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {feeTypes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No fee types configured. Click "Add Row" to add a fee type.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeeTypes;

