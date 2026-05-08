import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { apiGet, apiPost } from '@/lib/api/client';
import { Product } from '@/features/product-config/api/products';
import { Insurer } from '@/features/insurers/api/insurers';

interface InsurerProductConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insurer: Insurer | null;
}

interface ProductConfigRow {
  productId: string;
  maxQuoteLimit: number;
}

interface InsurerProductConfigResponse {
  productId: string;
  maxQuoteLimit: number | string;
}

export const InsurerProductConfigDialog: React.FC<InsurerProductConfigDialogProps> = ({
  open,
  onOpenChange,
  insurer,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [rows, setRows] = useState<ProductConfigRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !insurer) return;

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);

        const [productsRes, configsRes] = await Promise.all([
          apiGet<{ items?: Product[] } | Product[]>('/product/list'),
          insurer.adminUserId
            ? apiGet<InsurerProductConfigResponse[]>(
                `/insurer-product-config/${encodeURIComponent(
                  insurer.adminUserId,
                )}?orgId=${encodeURIComponent(insurer.id)}`,
              )
            : Promise.resolve([]),
        ]);

        if (cancelled) return;

        const items = Array.isArray(productsRes) ? productsRes : (productsRes.items ?? []);
        setProducts(items);

        const initialRows =
          Array.isArray(configsRes) && configsRes.length > 0
            ? configsRes.map((c) => ({
                productId: c.productId,
                maxQuoteLimit: Number(c.maxQuoteLimit) || 0,
              }))
            : [{ productId: '', maxQuoteLimit: 0 }];

        setRows(initialRows);
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load products and configurations.',
          variant: 'destructive',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, insurer, toast]);

  const handleAddRow = () => {
    setRows([...rows, { productId: '', maxQuoteLimit: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    const newRows = [...rows];
    newRows.splice(index, 1);
    setRows(newRows);
  };

  const handleRowChange = (index: number, field: keyof ProductConfigRow, value: string) => {
    const newRows = [...rows];

    if (field === 'maxQuoteLimit') {
      const parsed = Number(value);
      newRows[index] = {
        ...newRows[index],
        maxQuoteLimit: Number.isFinite(parsed) ? parsed : 0,
      };
    } else {
      newRows[index] = { ...newRows[index], productId: value };
    }

    setRows(newRows);
  };

  const handleSave = async () => {
    if (!insurer || !insurer.adminUserId) {
      toast({
        title: 'Error',
        description: 'Insurer admin user not found. Cannot configure products.',
        variant: 'destructive',
      });
      return;
    }

    // Validate rows
    const validRows = rows.filter((r) => r.productId && r.maxQuoteLimit > 0);
    if (validRows.length === 0) {
      toast({
        title: 'Warning',
        description: 'Please add at least one valid configuration (Product + Limit > 0).',
      });
      return;
    }

    try {
      setSaving(true);
      const payload = validRows.map((r) => ({
        orgId: insurer.id,
        userId: insurer.adminUserId!,
        productId: r.productId,
        maxQuoteLimit: Number(r.maxQuoteLimit),
      }));

      await apiPost('/insurer-product-config', payload);

      toast({
        title: 'Success',
        description: 'Product configurations saved successfully.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save config', error);
      toast({
        title: 'Error',
        description: 'Failed to save configurations.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedProductIds = new Set(rows.map((r) => r.productId).filter(Boolean));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Configure Products for {insurer?.name}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Product Configurations</Label>
                <Button variant="outline" size="sm" onClick={handleAddRow}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {rows.map((row, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-end p-3 border rounded-md bg-muted/20"
                  >
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">Product</Label>
                      <Select
                        value={row.productId}
                        onValueChange={(val) => handleRowChange(index, 'productId', val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => {
                            const isSelectedInOtherRow =
                              selectedProductIds.has(p.id) && p.id !== row.productId;
                            if (isSelectedInOtherRow) return null;

                            return (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} ({p.currency})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-[150px] space-y-2">
                      <Label className="text-xs">Max Quote Limit</Label>
                      <Input
                        type="number"
                        min="0"
                        value={row.maxQuoteLimit || ''}
                        onChange={(e) => handleRowChange(index, 'maxQuoteLimit', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200 mb-0.5"
                      onClick={() => handleRemoveRow(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {rows.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-md">
                    No configurations added. Click "Add Product" to start.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Configurations
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


