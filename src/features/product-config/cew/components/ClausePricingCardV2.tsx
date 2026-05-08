import { Button } from "@/components/ui/button";
import { FormattedNumberInput } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Product } from '@/features/product-config/api/products';;

export interface ProductCewPricingRow {
  id?: string;
  label: string;
  limits?: string;
  type: "percentage" | "currency";
  adjustmentValue: number;
  isActive: boolean;
}

interface ClausePricingCardV2Props {
  pricingList: ProductCewPricingRow[];
  productInfo: Product | null;
  onChange: (list: ProductCewPricingRow[]) => void;
}

export const ClausePricingCardV2 = ({ pricingList, productInfo, onChange }: ClausePricingCardV2Props) => {
  const handleUpdate = (index: number, field: keyof ProductCewPricingRow, value: string | number | boolean) => {
    const newList = [...pricingList];
    const item = { ...newList[index] };
    if (field === 'adjustmentValue' && typeof value === 'number') {
        item.adjustmentValue = value;
    } else if (field === 'isActive' && typeof value === 'boolean') {
        item.isActive = value;
    } else if (field === 'type' && (value === 'percentage' || value === 'currency')) {
        item.type = value;
        if (value === 'percentage') {
          item.adjustmentValue = Math.min(100, Math.max(0, Number(item.adjustmentValue) || 0));
        }
    } else if (field === 'label' && typeof value === 'string') {
        item.label = value;
    } else if (field === 'limits' && typeof value === 'string') {
        item.limits = value;
    }
    newList[index] = item;
    onChange(newList);
  };

  const handleAdd = () => {
    onChange([
      ...pricingList,
      {
        label: "",
        limits: "",
        type: "percentage",
        adjustmentValue: 0,
        isActive: true,
      },
    ]);
  };

  const handleRemove = (index: number) => {
    const newList = pricingList.filter((_, i) => i !== index);
    onChange(newList);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Clause Pricing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[23%]">Label</TableHead>
                <TableHead className="w-[23%]">Limits</TableHead>
                <TableHead className="w-[23%]">Type</TableHead>
                <TableHead className="w-[23%]">Value</TableHead>
                <TableHead className="w-[8%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricingList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No pricing rows added.
                  </TableCell>
                </TableRow>
              ) : (
                pricingList.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={item.label}
                        onChange={(e) => handleUpdate(index, "label", e.target.value)}
                        placeholder="Label"
                      />
                    </TableCell>
                    <TableCell>
                      <FormattedNumberInput
                        value={item.limits ? Number(item.limits) : undefined}
                        onChange={(val) => handleUpdate(index, "limits", val !== undefined ? String(val) : "")}
                        placeholder="Limits"
                        allowEmpty={true}
                        allowDecimals={true}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.type}
                        onValueChange={(value) => handleUpdate(index, "type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="currency">{productInfo.currency}</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <FormattedNumberInput
                        value={Number(item.adjustmentValue) || 0}
                        allowDecimals={true}
                        maxDecimals={2}
                        min={item.type === "percentage" ? 0 : undefined}
                        max={item.type === "percentage" ? 100 : undefined}
                        minFractionDigits={item.type === "percentage" ? 0 : undefined}
                        onChange={(value) => handleUpdate(index, "adjustmentValue", value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(index)}
                        disabled={pricingList.length === 1}
                        className="text-destructive hover:text-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Button variant="outline" size="sm" onClick={handleAdd} className="w-full border-dashed">
          <Plus className="mr-2 h-4 w-4" />
          Add Pricing Row
        </Button>
      </CardContent>
    </Card>
  );
};
