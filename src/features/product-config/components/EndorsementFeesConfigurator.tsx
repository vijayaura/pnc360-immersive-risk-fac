import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Save, X } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import {
  getProductEndorsementFeeTypes,
  saveProductEndorsementFeeTypes,
  type EndorsementFeeTypeItem,
} from "@/lib/api/endorsements";
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";

type EndorsementFeeTypeRow = {
  rowId: string;
  id?: string;
  label: string;
  adjustmentType: "PERCENTAGE" | "FIXED";
  adjustmentValue: number | "";
  status: "ACTIVE" | "INACTIVE";
  productId?: string;
};

function normalizeFeeAdjustmentType(value: unknown): EndorsementFeeTypeRow["adjustmentType"] {
  return String(value || "").toUpperCase() === "PERCENTAGE" ? "PERCENTAGE" : "FIXED";
}

function normalizeFeeStatus(value: unknown): EndorsementFeeTypeRow["status"] {
  return String(value || "").toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE";
}

function mapFeeTypeRow(item: EndorsementFeeTypeItem, index: number): EndorsementFeeTypeRow {
  return {
    rowId: item.id || `fee-${index}-${Date.now()}`,
    id: item.id,
    label: item.label || "",
    adjustmentType: normalizeFeeAdjustmentType(item.adjustmentType),
    adjustmentValue:
      item.adjustmentValue === null ||
      item.adjustmentValue === undefined ||
      item.adjustmentValue === ""
        ? ""
        : Number(item.adjustmentValue),
    status: normalizeFeeStatus(item.status),
    productId: item.productId,
  };
}

export interface EndorsementFeesConfiguratorProps {
  insurerId: string | number | null;
  productId: string | number | null;
}

export function EndorsementFeesConfigurator({ insurerId, productId }: EndorsementFeesConfiguratorProps) {
  const { toast } = useToast();
  const [initialFeeTypes, setInitialFeeTypes] = useState<EndorsementFeeTypeRow[]>([]);
  const [endorsementFeeTypes, setEndorsementFeeTypes] = useState<EndorsementFeeTypeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setEndorsementFeeTypes([]);
      setInitialFeeTypes([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProductEndorsementFeeTypes(productId)
      .then((rows) => {
        if (cancelled) return;
        const mapped = (rows || []).map(mapFeeTypeRow);
        setEndorsementFeeTypes(mapped);
        setInitialFeeTypes(mapped);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load endorsement fees");
        setEndorsementFeeTypes([]);
        setInitialFeeTypes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const addRow = () => {
    setEndorsementFeeTypes((prev) => [
      ...prev,
      {
        rowId: `fee-${Date.now()}`,
        label: "",
        adjustmentType: "PERCENTAGE",
        adjustmentValue: "",
        status: "ACTIVE",
        productId: productId ? String(productId) : undefined,
      },
    ]);
  };

  const removeRow = (rowId: string) => {
    setEndorsementFeeTypes((prev) => prev.filter((row) => row.rowId !== rowId));
  };

  const updateRow = (
    rowId: string,
    field: "label" | "adjustmentType" | "adjustmentValue" | "status",
    value: string | number
  ) => {
    setEndorsementFeeTypes((prev) =>
      prev.map((row) => (row.rowId === rowId ? { ...row, [field]: value } : row))
    );
  };

  const isDirty = useMemo(() => {
    if (initialFeeTypes.length !== endorsementFeeTypes.length) return true;
    for (let i = 0; i < endorsementFeeTypes.length; i++) {
      const current = endorsementFeeTypes[i];
      const initial = initialFeeTypes[i];
      if (
        current.id !== initial.id ||
        current.label !== initial.label ||
        current.adjustmentType !== initial.adjustmentType ||
        current.adjustmentValue !== initial.adjustmentValue ||
        current.status !== initial.status
      ) {
        return true;
      }
    }
    return false;
  }, [initialFeeTypes, endorsementFeeTypes]);

  const hasInvalidRows = endorsementFeeTypes.some(
    (row) => row.label.trim() === "" || row.adjustmentValue === "" || Number.isNaN(Number(row.adjustmentValue))
  );

  const handleSave = async () => {
    if (!productId) {
      const msg = "Unable to determine product ID.";
      setError(msg);
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const validRows = endorsementFeeTypes.filter((row) => row.label.trim() !== "");
      await saveProductEndorsementFeeTypes(
        productId,
        validRows.map((row) => ({
          ...(row.id ? { id: row.id } : {}),
          label: row.label.trim(),
          adjustmentType: row.adjustmentType,
          adjustmentValue: Number(row.adjustmentValue || 0),
          status: row.status,
          productId: String(productId),
        }))
      );
      const refreshed = await getProductEndorsementFeeTypes(productId);
      const mapped = (refreshed || []).map(mapFeeTypeRow);
      setEndorsementFeeTypes(mapped);
      setInitialFeeTypes(mapped);
      
      toast({
        title: "Success",
        description: "Endorsement fees saved successfully.",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save endorsement fees";
      setError(errorMessage);
      toast({
        title: "Error saving fees",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Endorsement Fees</CardTitle>
            <CardDescription>Configure fee types and their values specifically for this product.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addRow}
              disabled={saving || !productId}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Row
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !productId || !isDirty || hasInvalidRows}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Fees
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive mb-4">
            {error}
          </div>
        )}
        {loading ? (
          <div className="py-8 flex items-center justify-center text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading endorsement fees...
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Pricing Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endorsementFeeTypes.map((fee) => (
                  <TableRow key={fee.rowId}>
                    <TableCell>
                      <Input
                        value={fee.label}
                        onChange={(e) => updateRow(fee.rowId, "label", e.target.value)}
                        placeholder="Enter fee type name"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={fee.adjustmentType}
                        onValueChange={(value: "PERCENTAGE" | "FIXED") => {
                          updateRow(fee.rowId, "adjustmentType", value);
                          if (value === "PERCENTAGE" && Number(fee.adjustmentValue) > 100) {
                            updateRow(fee.rowId, "adjustmentValue", 0);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                          <SelectItem value="FIXED">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FormattedNumberInput
                          value={fee.adjustmentValue === "" ? undefined : Number(fee.adjustmentValue)}
                          placeholder="Enter Value"
                          onChange={(val) =>
                            updateRow(
                                fee.rowId,
                                "adjustmentValue",
                                val === undefined ? "" : val
                            )
                          }
                          min={0}
                          max={fee.adjustmentType === "PERCENTAGE" ? 100 : undefined}
                          allowDecimals={true}
                          maxDecimals={fee.adjustmentType === "PERCENTAGE" ? 2 : undefined}
                          className="w-32"
                        />
                        <span className="text-sm text-muted-foreground">
                          {fee.adjustmentType === "PERCENTAGE" ? "%" : "SAR"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={fee.status}
                        onValueChange={(value: "ACTIVE" | "INACTIVE") =>
                          updateRow(fee.rowId, "status", value)
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
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(fee.rowId)}
                        aria-label="Remove row"
                        className="text-destructive hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                        disabled={saving || endorsementFeeTypes.length === 1}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {endorsementFeeTypes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No fee types configured. Click "Add Row" to add a fee type.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

