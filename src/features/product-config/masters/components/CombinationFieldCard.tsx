import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Trash2, Download, Upload, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';

export type OptionConfig = {
  adjustmentType: 'percentage' | 'fixed';
  adjustmentValue: number;
  premiumAdjustmentType?: 'percentage' | 'fixed';
  minPremiumValue?: number;
  maxPremiumValue?: number;
  quoteAction: 'quote' | 'no_quote' | 'referral';
  subField?: string;
};

export type FreeRow = {
  id: number | string;
  rangeStart: number;
  rangeEnd: number;
  adjustmentType: 'percentage' | 'fixed';
  adjustmentValue: number;
  premiumAdjustmentType?: 'percentage' | 'fixed';
  minPremiumValue?: number;
  maxPremiumValue?: number;
  quoteAction: 'quote' | 'no_quote' | 'referral';
  subField?: string;
};

interface CombinationFieldCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  param: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subFields: any[];
  ratingSelections: Record<string, Record<string, OptionConfig>>;
  setRatingSelections: React.Dispatch<
    React.SetStateAction<Record<string, Record<string, OptionConfig>>>
  >;
  ratingFreeConfigs: Record<string, FreeRow[]>;
  setRatingFreeConfigs: React.Dispatch<React.SetStateAction<Record<string, FreeRow[]>>>;
  handleRemoveRow: (paramId: string, rowId: number | string) => void;
  onSave: () => void;
  isSaving: boolean;
  onExport?: (category: string, ratingParameterId?: string, mode?: 'combination') => void;
  onImportClick?: (category: string, ratingParameterId?: string, mode?: 'combination') => void;
  isExporting?: string | null;
  isImporting?: string | null;
  category?: string;
  ratingParameterId?: string;
}

const getQuoteOptionColor = (option: string) => {
  switch (option) {
    case 'quote':
      return 'bg-green-500';
    case 'no-quote':
    case 'no_quote':
      return 'bg-red-500';
    case 'referral':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-400';
  }
};

const makeDefaultRow = (): FreeRow => ({
  id: Date.now(),
  rangeStart: 0,
  rangeEnd: 0,
  adjustmentType: 'percentage',
  adjustmentValue: 0,
  quoteAction: 'quote',
});

export const CombinationFieldCard: React.FC<CombinationFieldCardProps> = ({
  param,
  subFields,
  ratingFreeConfigs,
  setRatingFreeConfigs,
  handleRemoveRow,
  onSave,
  isSaving,
  onExport,
  onImportClick,
  isExporting,
  isImporting,
  category,
  ratingParameterId,
}) => {
  const derivedParams = param.derivedParameters || [];
  const importExportKey =
    category && ratingParameterId ? `combination:${category}:${ratingParameterId}` : category || '';

  const renderRows = (paramId: string, derivedType?: string) => {
    const rows = ratingFreeConfigs[paramId];
    if (!rows || rows.length === 0) {
      const defaultRow = makeDefaultRow();
      // Schedule state update outside render cycle
      setTimeout(() => {
        setRatingFreeConfigs((prev) => {
          if (!prev[paramId] || prev[paramId].length === 0) {
            return { ...prev, [paramId]: [defaultRow] };
          }
          return prev;
        });
      }, 0);
      return [defaultRow].map((entry) => renderRow(paramId, entry, derivedType));
    }
    return rows.map((entry) => renderRow(paramId, entry, derivedType));
  };

  const renderRow = (paramId: string, entry: FreeRow, derivedType?: string) => (
      <TableRow key={entry.id}>
        <TableCell>
          <FormattedNumberInput
            value={entry.rangeStart}
            step="1"
            min="0"
            allowDecimals={derivedType !== 'COUNT'}
            onChange={(val) =>
              setRatingFreeConfigs((prev) => ({
                ...prev,
                [paramId]: prev[paramId].map((r) =>
                  r.id === entry.id ? { ...r, rangeStart: val } : r,
                ),
              }))
            }
            className="w-full"
          />
        </TableCell>
        <TableCell>
          <FormattedNumberInput
            value={entry.rangeEnd}
            step="1"
            min="0"
            allowDecimals={derivedType !== 'COUNT'}
            onChange={(val) =>
              setRatingFreeConfigs((prev) => ({
                ...prev,
                [paramId]: prev[paramId].map((r) =>
                  r.id === entry.id ? { ...r, rangeEnd: val } : r,
                ),
              }))
            }
            className="w-full"
          />
        </TableCell>
        <TableCell>
          <Select
            value={entry.adjustmentType}
            onValueChange={(val) =>
              setRatingFreeConfigs((prev) => ({
                ...prev,
                [paramId]: prev[paramId].map((r) =>
                  r.id === entry.id
                    ? {
                        ...r,
                        adjustmentType: val as 'percentage' | 'fixed',
                        adjustmentValue:
                          val === 'percentage' && Number(r.adjustmentValue) > 100
                            ? 0
                            : r.adjustmentValue,
                      }
                    : r,
                ),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50 bg-popover border border-border shadow-md">
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed Amount</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <FormattedNumberInput
            min={0}
            max={entry.adjustmentType === 'percentage' ? 100 : undefined}
            allowDecimals={true}
            maxDecimals={entry.adjustmentType === 'percentage' ? 2 : undefined}
            value={entry.adjustmentValue}
            onChange={(val) =>
              setRatingFreeConfigs((prev) => ({
                ...prev,
                [paramId]: prev[paramId].map((r) =>
                  r.id === entry.id ? { ...r, adjustmentValue: val } : r,
                ),
              }))
            }
            className="w-full"
            placeholder="0"
          />
        </TableCell>
        <TableCell>
          <Select
            value={entry.quoteAction}
            onValueChange={(val) =>
              setRatingFreeConfigs((prev) => ({
                ...prev,
                [paramId]: prev[paramId].map((r) =>
                  r.id === entry.id
                    ? { ...r, quoteAction: val as 'quote' | 'no_quote' | 'referral' }
                    : r,
                ),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50 bg-popover border border-border shadow-md">
              <SelectItem value="quote">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getQuoteOptionColor('quote')}`}></div>
                  Auto Quote
                </div>
              </SelectItem>
              <SelectItem value="no_quote">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getQuoteOptionColor('no_quote')}`}></div>
                  No Quote
                </div>
              </SelectItem>
              <SelectItem value="referral">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getQuoteOptionColor('referral')}`}></div>
                  Referral
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveRow(paramId, entry.id)}
            className="text-destructive hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </TableCell>
      </TableRow>
  );

  return (
    <Card key={`comb-${param.ratingParameterId}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{param.fieldLabel}</CardTitle>
            <CardDescription>Configure rules for {param.fieldLabel}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onExport && category && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport(category, ratingParameterId, 'combination')}
                disabled={isExporting === importExportKey}
              >
                {isExporting === importExportKey ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Export
              </Button>
            )}
            {onImportClick && category && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onImportClick(category, ratingParameterId, 'combination')}
                disabled={isImporting === importExportKey}
              >
                {isImporting === importExportKey ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Import
              </Button>
            )}
            <Button onClick={onSave} size="sm" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save {param.fieldLabel}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {derivedParams.length > 0 ? (
          derivedParams.map(
            (dp: { ratingParameterId: string; label?: string; derivedType?: string }) => (
              <div key={dp.ratingParameterId} className="border p-4 rounded-md">
                <h4 className="font-semibold mb-2">
                  {dp.label ||
                    (dp.derivedType === 'COUNT'
                      ? 'Total Count'
                      : dp.derivedType === 'SUM'
                        ? 'Total Sum'
                        : 'Standard Rule')}
                </h4>
                <div className="flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRatingFreeConfigs((prev) => {
                        const rows = prev[dp.ratingParameterId] || [];
                        return { ...prev, [dp.ratingParameterId]: [...rows, makeDefaultRow()] };
                      })
                    }
                  >
                    Add Row
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/6">From</TableHead>
                      <TableHead className="w-1/6">To</TableHead>
                      <TableHead className="w-1/5">Adjustment Type</TableHead>
                      <TableHead className="w-1/5">Loading/Discount</TableHead>
                      <TableHead className="w-1/5">Quote Action</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {renderRows(dp.ratingParameterId, dp.derivedType)}
                  </TableBody>
                </Table>
              </div>
            ),
          )
        ) : subFields && subFields.length > 0 ? (
          <div key={param.ratingParameterId} className="border p-4 rounded-md">
            <h4 className="font-semibold mb-2">
              {param.fieldLabel || 'Parameter Configuration'}
            </h4>
            <div className="flex justify-end mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setRatingFreeConfigs((prev) => {
                    const rows = prev[param.ratingParameterId] || [];
                    return { ...prev, [param.ratingParameterId]: [...rows, makeDefaultRow()] };
                  })
                }
              >
                Add Row
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/6">From</TableHead>
                  <TableHead className="w-1/6">To</TableHead>
                  <TableHead className="w-1/5">Adjustment Type</TableHead>
                  <TableHead className="w-1/5">Loading/Discount</TableHead>
                  <TableHead className="w-1/5">Quote Action</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderRows(param.ratingParameterId)}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-4 border rounded-md bg-yellow-50 text-yellow-800">
            <p>
              No derived rating parameters found. Please configure them in the Rating Configurator
              first.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
