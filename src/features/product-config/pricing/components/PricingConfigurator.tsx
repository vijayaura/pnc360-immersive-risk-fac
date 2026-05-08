import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  Save,
  Download,
  Upload,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import { getInsurerCompanyId } from '@/lib/auth';
import { EndorsementFeesConfigurator } from '../../components/EndorsementFeesConfigurator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import {
  getMatrixRatingConfig,
  getGroupedRatingParameters,
  saveRatingValues,
  getPolicyLimits,
  savePolicyConfig,
  getFeeTypes,
  saveFeeTypes,
  getRiskCategories,
  getRiskCategorisationByRiskCategory,
  exportRiskCategorisationByRiskCategory,
  saveRiskCategorisations,
  saveMatrixRatingValues,
  getCombinationRatingConfig,
  saveCombinationRatingValues,
  exportRatingParameters,
  exportCombinationParameters,
  importRatingParameters,
  importCombinationParameters,
  type GroupedRatingParametersResponse,
  type FeeType,
  type Deductible,
  type ProductRiskCategory,
  type RiskCategorisationPayload,
  type MatrixRatingConfigResponse,
  type MatrixConfigItem,
  type MatrixAxisItem,
  type MatrixCellPayload,
  GroupedValuesPayload,
  type RangeConfig,
  type MasterOptionConfig,
  type RatingParameterItem,
  type CombinationConfigResponse,
  type CombinationRuleRowPayload,
} from '@/features/product-config/pricing/api/ratings';
import { type Product } from '@/features/product-config/api/products';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FormattedNumberInput } from '@/components/ui';
import { CombinationFieldCard } from '../../masters/components/CombinationFieldCard';
import { formatIfNumber } from '@/shared/utils';

type PricingConfiguratorProps = {
  productId: string;
  productInfo: {
    id: string;
    name: string;
    code?: string;
    category: string;
    currency: string;
    description: string;
    version: string;
    status: string;
    owner: string;
    organizationId: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  [key: string]: unknown;
};

const RISK_IMPORT_PREFIX = 'risk-categorisation:' as const;
type RiskImportCategoryKey = `risk-categorisation:${string}`;
const EQUAL_TABLE_CLASS = 'table-fixed min-w-full';
const FOUR_COLUMN_HEAD_CLASS = 'min-w-[180px] px-3 font-medium text-muted-foreground';
const FOUR_COLUMN_CELL_CLASS = 'min-w-[180px] py-4 px-3';
const RANGE_HEAD_SM_CLASS = 'min-w-[120px] px-3 font-medium text-muted-foreground';
const RANGE_HEAD_MD_CLASS = 'min-w-[180px] px-3 font-medium text-muted-foreground';
const ACTION_HEAD_CLASS = 'min-w-[96px] px-3 font-medium text-muted-foreground';
type GroupedParameterMeta = GroupedRatingParametersResponse['base'][number];
type CombinationChildParameterMeta = NonNullable<
  CombinationConfigResponse['combinations'][number]['childParameters']
>[number];
type CombinationChildConfigMeta = CombinationChildParameterMeta;
type CombinationChildMeta = GroupedParameterMeta | CombinationChildConfigMeta | null;

const PricingConfigurator: React.FC<PricingConfiguratorProps> = ({ productId, productInfo }) => {
  const extractArrayFromApi = <T,>(payload: unknown, keys: string[] = []): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (!payload || typeof payload !== 'object') return [];
    const obj = payload as Record<string, unknown>;
    const defaultKeys = ['data', 'items', 'results', 'rows', 'list'];
    const allKeys = [...keys, ...defaultKeys];
    for (const key of allKeys) {
      const val = obj[key];
      if (Array.isArray(val)) return val as T[];
    }
    return [];
  };

  const [activePricingTab, setActivePricingTab] = useState('');
  type ActiveTab = {
    category: 'base' | 'factor' | 'premiumLimit';
    ratingParameterId: string;
  };
  const [activeTab, setActiveTab] = useState<ActiveTab | null>(null);
  const [groupedParams, setGroupedParams] = useState<GroupedRatingParametersResponse | null>(null);
  type OptionConfig = {
    adjustmentType: 'percentage' | 'fixed';
    adjustmentValue: number;
    premiumAdjustmentType?: 'percentage' | 'fixed';
    minPremiumValue?: number;
    maxPremiumValue?: number;
    quoteAction: 'quote' | 'no_quote' | 'referral';
    subField?: string;
  };
  const [ratingSelections, setRatingSelections] = useState<
    Record<string, Record<string, OptionConfig>>
  >({});
  type FreeRow = {
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
  type CombinationRowValueState = {
    childDefinitionId?: string;
    childRatingParameterId?: string;
    valueType: 'DROPDOWN' | 'NUMBER_RANGE';
    masterValueId?: string;
    coverId?: string;
    rangeFrom?: number;
    rangeTo?: number;
  };
  type CombinationRowState = {
    id?: string;
    rowOrder: number;
    loading: number;
    premiumAdjustmentType?: 'PERCENTAGE' | 'FIXED';
    minPremiumValue?: number;
    maxPremiumValue?: number;
    adjustmentType: 'PERCENTAGE' | 'FIXED' | 'FACTOR';
    quoteAction: 'quote' | 'no_quote' | 'referral';
    values: CombinationRowValueState[];
  };
  const [combinationConfig, setCombinationConfig] = useState<CombinationConfigResponse | null>(
    null,
  );
  const [combinationRowsByParameter, setCombinationRowsByParameter] = useState<
    Record<string, CombinationRowState[]>
  >({});
  const combinationTableScrollRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const [combinationScrollState, setCombinationScrollState] = useState<
    Record<string, { canScrollLeft: boolean; canScrollRight: boolean }>
  >({});
  const createNewFreeRow = (rows: FreeRow[]): FreeRow => {
    const last = rows[rows.length - 1];
    const lastEnd = last ? Number(last.rangeEnd || 0) : 0;
    const rangeStart = rows.length > 0 ? lastEnd + 1 : 0;
    
    // Calculate rangeEnd based on previous row's range (TO - FROM)
    let rangeEnd = rangeStart;
    if (last) {
      const lastStart = Number(last.rangeStart || 0);
      const lastRangeSize = lastEnd - lastStart;
      
      // If last row has same FROM and TO (size = 0), use default size of 1000
      // Otherwise use the last row's range size
      const effectiveRangeSize = lastRangeSize > 0 ? lastRangeSize : 1000;
      rangeEnd = rangeStart + effectiveRangeSize;
    } else {
      // First row defaults to 0 - 1000
      rangeEnd = 1000;
    }
    
    return {
      id: Date.now(),
      rangeStart,
      rangeEnd,
      adjustmentType: 'percentage',
      adjustmentValue: 0,
      quoteAction: 'quote',
    };
  };

  const createNewMatrixRange = (rows: MatrixAxisItem[], axis: 'x' | 'y'): MatrixAxisItem => {
    const last = rows[rows.length - 1];
    const lastEnd = last && typeof last.rangeEnd === 'number' ? last.rangeEnd : 0;
    const rangeStart = rows.length > 0 ? lastEnd + 1 : 0;
    
    // Calculate rangeEnd based on previous row's range size
    let rangeEnd = rangeStart;
    if (last) {
      const lastStart = typeof last.rangeStart === 'number' ? last.rangeStart : 0;
      const lastRangeSize = lastEnd - lastStart;
      const effectiveRangeSize = lastRangeSize > 0 ? lastRangeSize : 1000;
      rangeEnd = rangeStart + effectiveRangeSize;
    } else {
      rangeEnd = 1000;
    }
    
    return {
      ...(last || {}),
      id: `${Date.now()}-${axis}`,
      rangeStart,
      rangeEnd,
    } as MatrixAxisItem;
  };
  const [ratingFreeConfigs, setRatingFreeConfigs] = useState<Record<string, FreeRow[]>>({});
  const [deletedRangeIds, setDeletedRangeIds] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  type ImportTarget = {
    category: string;
    ratingParameterId?: string;
    mode?: 'combination';
  };
  const [importTarget, setImportTarget] = useState<ImportTarget | null>(null);
  const normalizeImportText = (value: unknown): string =>
    String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ');

  const getRiskImportCategoryKey = (riskCategoryId: string): RiskImportCategoryKey =>
    `${RISK_IMPORT_PREFIX}${riskCategoryId}`;

  const getImportExportKey = (
    category: string,
    ratingParameterId?: string,
    mode?: 'combination',
  ) =>
    mode === 'combination' && ratingParameterId
      ? `combination:${category}:${ratingParameterId}`
      : ratingParameterId
        ? `${category}:${ratingParameterId}`
        : category;

  const isRiskImportCategory = (category: string | null): category is RiskImportCategoryKey =>
    Boolean(category && category.startsWith(RISK_IMPORT_PREFIX));

  const getRiskCategoryIdFromImportKey = (category: string): string =>
    category.slice(RISK_IMPORT_PREFIX.length);

  const getRiskCategoryRows = (riskCategoryId: string): RiskCategorisationRow[] =>
    pricingConfig.riskCategorisations.filter((entry) => entry.riskCategoryId === riskCategoryId);

  const getFilenameFromContentDisposition = (value: string | null | undefined): string | null => {
    if (!value) return null;

    const utf8Match = value.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      try {
        return decodeURIComponent(utf8Match[1].replace(/["']/g, '').trim());
      } catch {
        return utf8Match[1].replace(/["']/g, '').trim();
      }
    }

    const asciiMatch = value.match(/filename\s*=\s*("?)([^";]+)\1/i);
    return asciiMatch?.[2]?.trim() || null;
  };

  const downloadBlobFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const exportRiskCategorisation = async (riskCategoryId: string) => {
    const selectedCategory = riskCategories.find((category) => category.id === riskCategoryId);
    if (!selectedCategory) {
      toast.error('Export Failed', {
        description: 'Risk category not found.',
      });
      return;
    }

    const { blob, headers } = await exportRiskCategorisationByRiskCategory(
      productId,
      riskCategoryId,
    );
    const filenameFromHeader = getFilenameFromContentDisposition(
      headers['content-disposition'] ?? headers['Content-Disposition'],
    );
    const fallbackFilename = `${productInfo?.name || 'product'}_${selectedCategory.name.replace(/\s+/g, '_')}_risk_categorisation.xlsx`;
    downloadBlobFile(blob, filenameFromHeader || fallbackFilename);

    toast.success('Export Success', {
      description: `${selectedCategory.name} risk categorisation exported successfully.`,
    });
  };

  const importRiskCategorisation = async (file: File, categoryKey: string) => {
    const riskCategoryId = getRiskCategoryIdFromImportKey(categoryKey);
    const selectedCategory = riskCategories.find((category) => category.id === riskCategoryId);
    if (!selectedCategory) {
      throw new Error('Risk category not found.');
    }

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('The uploaded file does not contain any worksheet.');
    }

    const worksheet = workbook.Sheets[sheetName];
    const importedRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: '',
    });

    if (importedRows.length === 0) {
      throw new Error('The uploaded file does not contain any data rows.');
    }

    const currentRows = getRiskCategoryRows(riskCategoryId);
    const rowsByLevelId = new Map(
      currentRows.map((row) => [normalizeImportText(row.riskLevelId), row]),
    );
    const rowsByLevelLabel = new Map(
      selectedCategory.riskLevels.map((level) => [
        normalizeImportText(level.label),
        currentRows.find((row) => row.riskLevelId === level.id),
      ]),
    );

    const updatedRowIds = new Set<string | number>();
    let matchedCount = 0;

    setPricingConfig((prev) => {
      const nextRows = prev.riskCategorisations.map((entry) => {
        if (entry.riskCategoryId !== riskCategoryId) return entry;

        const importedRow = importedRows.find((row) => {
          const rawLevelId =
            row['Risk Level ID'] ??
            row['risk level id'] ??
            row['RiskLevelId'] ??
            row['riskLevelId'];
          const rawLevelLabel =
            row['Risk Level'] ?? row['risk level'] ?? row['RiskLevel'] ?? row['riskLevel'];

          const idMatch =
            normalizeImportText(rawLevelId) === normalizeImportText(entry.riskLevelId);
          const label = selectedCategory.riskLevels.find(
            (level) => level.id === entry.riskLevelId,
          )?.label;
          const labelMatch = normalizeImportText(rawLevelLabel) === normalizeImportText(label);
          return idMatch || labelMatch;
        });

        if (!importedRow) return entry;

        const rawAdjustmentType =
          importedRow['Adjustment Type'] ??
          importedRow['adjustment type'] ??
          importedRow['AdjustmentType'] ??
          importedRow['adjustmentType'];
        const normalizedAdjustmentType = normalizeImportText(rawAdjustmentType);
        const adjustmentType: RiskCategorisationRow['adjustmentType'] =
          normalizedAdjustmentType === 'fixed'
            ? 'fixed'
            : normalizedAdjustmentType === 'factor'
              ? 'factor'
              : 'percentage';

        const rawAdjustmentValue =
          importedRow['Loading/Discount'] ??
          importedRow['loading/discount'] ??
          importedRow['Loading Discount'] ??
          importedRow['loading discount'];
        const adjustmentValue = String(rawAdjustmentValue ?? entry.adjustmentValue).trim();

        const rawQuoteAction =
          importedRow['Quote Action'] ??
          importedRow['quote action'] ??
          importedRow['QuoteAction'] ??
          importedRow['quoteAction'];

        matchedCount += 1;
        updatedRowIds.add(entry.id);

        return {
          ...entry,
          adjustmentType,
          adjustmentValue: adjustmentValue === '' ? '0' : adjustmentValue,
          quoteAction: normalizeQuoteAction(String(rawQuoteAction || entry.quoteAction)),
        };
      });

      return {
        ...prev,
        riskCategorisations: nextRows,
      };
    });

    const unmatchedRows = importedRows.filter((row) => {
      const rawLevelId =
        row['Risk Level ID'] ?? row['risk level id'] ?? row['RiskLevelId'] ?? row['riskLevelId'];
      const rawLevelLabel =
        row['Risk Level'] ?? row['risk level'] ?? row['RiskLevel'] ?? row['riskLevel'];

      const matchedRow =
        rowsByLevelId.get(normalizeImportText(rawLevelId)) ||
        rowsByLevelLabel.get(normalizeImportText(rawLevelLabel));

      return !matchedRow || !updatedRowIds.has(matchedRow.id);
    });

    toast.success('Import Success', {
      description:
        unmatchedRows.length > 0
          ? `${matchedCount} row(s) imported. ${unmatchedRows.length} row(s) did not match this risk category.`
          : `${matchedCount} row(s) imported and table values were prefilled.`,
    });
  };

  const getBackendCategory = (cat: string) => {
    switch (cat) {
      case 'base':
        return 'base';
      case 'factors':
      case 'factor':
        return 'factor';
      case 'premiumLimit':
        return 'premiumLimit';
      case 'matrix':
        return 'matrix';
      default:
        return cat.toUpperCase();
    }
  };

  const handleExport = async (
    category: string,
    ratingParameterId?: string,
    mode?: 'combination',
  ) => {
    const loadingKey = getImportExportKey(category, ratingParameterId, mode);
    if (isRiskImportCategory(category)) {
      setIsExporting(loadingKey);
      try {
        await exportRiskCategorisation(getRiskCategoryIdFromImportKey(category));
      } catch (error) {
        console.error('Risk categorisation export error:', error);
        toast.error('Export Failed', {
          description: 'Failed to export risk categorisation. Please try again.',
        });
      } finally {
        setIsExporting(null);
      }
      return;
    }

    setIsExporting(loadingKey);
    try {
      const backendCat = getBackendCategory(category);
      const blob =
        mode === 'combination' && ratingParameterId
          ? await exportCombinationParameters(productId, backendCat, ratingParameterId)
          : await exportRatingParameters(productId, backendCat, ratingParameterId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `${productInfo?.name || 'product'}_${
          mode === 'combination'
            ? `combination_${category}_${ratingParameterId}`
            : `${category}_parameters`
        }.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export Success', {
        description:
          mode === 'combination'
            ? `${category.charAt(0).toUpperCase() + category.slice(1)} combination parameter exported successfully.`
            : `${category.charAt(0).toUpperCase() + category.slice(1)} parameters exported successfully.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export Failed', {
        description: 'Failed to export rating parameters. Please try again.',
      });
    } finally {
      setIsExporting(null);
    }
  };

  const handleImportClick = (
    category: string,
    ratingParameterId?: string,
    mode?: 'combination',
  ) => {
    setImportTarget({ category, ratingParameterId, mode });
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !importTarget) return;

    const { category, ratingParameterId, mode } = importTarget;
    const loadingKey = getImportExportKey(category, ratingParameterId, mode);
    setIsImporting(loadingKey);
    try {
      if (isRiskImportCategory(category)) {
        await importRiskCategorisation(file, category);
      } else {
        const backendCat = getBackendCategory(category);
        if (mode === 'combination' && ratingParameterId) {
          await importCombinationParameters(productId, file, backendCat, ratingParameterId);
        } else {
          await importRatingParameters(productId, file, backendCat, ratingParameterId);
        }
        toast.success('Import Success', {
          description:
            mode === 'combination'
              ? `${category.charAt(0).toUpperCase() + category.slice(1)} combination parameter imported successfully.`
              : `${category.charAt(0).toUpperCase() + category.slice(1)} parameters imported successfully.`,
        });
        // Refresh the data after successful import
        await load();
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import Failed', {
        description: isRiskImportCategory(category)
          ? error instanceof Error
            ? error.message
            : 'Failed to import risk categorisation. Please check the file format and try again.'
          : mode === 'combination'
            ? 'Failed to import combination parameter. Please check the file format and try again.'
            : 'Failed to import rating parameters. Please check the file format and try again.',
      });
    } finally {
      setIsImporting(null);
      setImportTarget(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const [matrixConfig, setMatrixConfig] = useState<MatrixRatingConfigResponse | null>(null);

  const [matrixAxisRanges, setMatrixAxisRanges] = useState<
    Record<string, { x: MatrixAxisItem[]; y: MatrixAxisItem[] }>
  >({});
  const [matrixCells, setMatrixCells] = useState<Record<string, MatrixCellPayload[]>>({});
  const [deletedMatrixRuleIds, setDeletedMatrixRuleIds] = useState<Record<string, string[]>>({});
  const [activeRiskCategoryId, setActiveRiskCategoryId] = useState('');
  const [rowToDelete, setRowToDelete] = useState<{
    paramId: string;
    rowId: number | string;
  } | null>(null);
  type RiskCategorisationRow = {
    id: string | number;
    riskCategoryId: string;
    riskLevelId: string;
    adjustmentType: 'percentage' | 'fixed' | 'factor';
    adjustmentValue: string;
    quoteAction: 'quote' | 'no_quote' | 'referral';
    isNew?: boolean;
  };

  const normalizeRiskCategories = (payload: unknown): ProductRiskCategory[] => {
    const raw = extractArrayFromApi<Record<string, unknown>>(payload, [
      'riskCategories',
      'categories',
      'risk_categories',
    ]);

    return raw
      .map((category, index) => {
        const rawLevels = Array.isArray(category.riskLevels)
          ? (category.riskLevels as Array<Record<string, unknown>>)
          : [];
        const levels = rawLevels
          .map((level, levelIndex) => ({
            id: String(level.id || level.value || ''),
            label: String(level.label || level.name || ''),
            order: Number(level.order ?? levelIndex),
          }))
          .filter((level) => level.id && level.label)
          .sort((a, b) => a.order - b.order);

        return {
          id: String(category.id || category.riskCategoryId || `risk-category-${index}`),
          riskCategorisationId: String(
            category.riskCategorisationId || category.riskCategorizationId || '',
          ),
          name: String(category.name || category.label || ''),
          riskLevels: levels,
        };
      })
      .filter((category) => category.id && category.name);
  };

  const mapDefaultRiskCategorisationRows = (
    categories: ProductRiskCategory[],
  ): RiskCategorisationRow[] => {
    return categories.flatMap((category) =>
      category.riskLevels
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((level) => ({
          id: `${category.id}-${level.id}`,
          riskCategoryId: category.id,
          riskLevelId: level.id,
          adjustmentType: 'percentage',
          adjustmentValue: '0',
          quoteAction: 'quote',
          isNew: false,
        })),
    );
  };

  const mapPricingRowsForCategory = (
    payload: unknown,
    category: ProductRiskCategory,
  ): RiskCategorisationRow[] => {
    const rawCategoryPayload =
      !Array.isArray(payload) && payload && typeof payload === 'object'
        ? (payload as Record<string, unknown>)
        : null;
    const categoryPricingEntries = Array.isArray(rawCategoryPayload?.pricing)
      ? (rawCategoryPayload.pricing as Array<Record<string, unknown>>)
      : [];
    const rawRows = extractArrayFromApi<Record<string, unknown>>(payload, [
      'riskCategorisations',
      'risk_categorisations',
      'rows',
      'data',
    ]);

    return category.riskLevels
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((level) => {
        const matchedRow =
          categoryPricingEntries.find((entry) => String(entry.riskLevelId || '') === level.id) ||
          rawRows.find(
            (row) =>
              String(row.riskCategoryId || row.categoryId || '') === category.id &&
              String(row.riskLevelId || row.levelId || '') === level.id,
          );

        const pricingParam = Array.isArray(matchedRow?.pricingParameters)
          ? ((matchedRow.pricingParameters as Array<Record<string, unknown>>)[0] ?? null)
          : null;

        const rawAdjustmentType = String(
          pricingParam?.adjustmentType || matchedRow?.adjustmentType || 'PERCENTAGE',
        ).toUpperCase();
        return {
          id: String(matchedRow?.id || `${category.id}-${level.id}`),
          riskCategoryId: category.id,
          riskLevelId: level.id,
          adjustmentType:
            rawAdjustmentType === 'PERCENTAGE'
              ? 'percentage'
              : rawAdjustmentType === 'FACTOR'
                ? 'factor'
                : 'fixed',
          adjustmentValue: String(
            pricingParam?.adjustmentValue ?? matchedRow?.adjustmentValue ?? 0,
          ),
          quoteAction: normalizeQuoteAction(
            String(pricingParam?.quoteAction || matchedRow?.quoteAction || 'quote'),
          ),
          isNew: false,
        };
      });
  };

  const isPersistedRiskRowId = (id: string | number): id is string => {
    if (typeof id !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  };

  const [riskCategories, setRiskCategories] = useState<ProductRiskCategory[]>([]);
  const [pricingConfig, setPricingConfig] = useState({
    feeTypes: [] as FeeType[],
    riskCategorisations: [] as RiskCategorisationRow[],
    limits: {
      maximumCoverValue: 0,
      maximumCoverType: 'currency' as 'currency' | 'percentage',
      minimumPremiumValue: 0,
      minimumPremiumType: 'currency' as 'currency' | 'percentage',
      brokerCommissionPercent: 0,
      brokerCommissionType: 'percentage' as 'currency' | 'percentage',
      maxBrokerCommissionPercent: 0,
      maxBrokerCommissionType: 'percentage' as 'currency' | 'percentage',
      minBrokerCommissionPercent: 0,
      minBrokerCommissionType: 'percentage' as 'currency' | 'percentage',
    },
    coverRequirements: {
      policyDeductibles: [] as Deductible[],
    },
  });

  const normalizeQuoteAction = React.useCallback((v: string): 'quote' | 'no_quote' | 'referral' => {
    const val = v.trim().toLowerCase();
    if (val === 'no_quote' || val === 'no-quote' || val === 'no quote') return 'no_quote';
    if (val === 'referral') return 'referral';
    return 'quote';
  }, []);

  const normalizeCommissionType = React.useCallback(
    (_value: unknown): 'percentage' => 'percentage',
    [],
  );

  const getRatingParameterTabId = (
    category: 'base' | 'factor' | 'premiumLimit',
    param: { ratingParameterId?: string | null; parameterType?: string | null },
  ): string => {
    if (!param.ratingParameterId) return '';
    const type = String(param.parameterType || '').toUpperCase();
    if (type === 'MATRIX') return `grp-matrix-${param.ratingParameterId}`;
    if (type === 'COMBINATION') return `grp-combination-${param.ratingParameterId}`;
    return `grp-${category}-${param.ratingParameterId}`;
  };

  const load = React.useCallback(async () => {
    try {
      const [grouped, matrix, combination] = await Promise.all([
        getGroupedRatingParameters(productId),
        getMatrixRatingConfig(productId),
        getCombinationRatingConfig(productId),
      ]);
      if (grouped) {
        setGroupedParams(grouped);
        setMatrixConfig(matrix);
        setCombinationConfig(combination);
        const nextCombinationRows: Record<string, CombinationRowState[]> = {};
        (combination?.combinations || []).forEach((entry) => {
          const children = entry.childParameters?.length
            ? entry.childParameters
            : entry.combinationItems?.length
              ? entry.combinationItems
              : [];
          const childKeys = children
            .map((child) =>
              String(
                child?.definitionId || child?.ratingParameterId || child?.formFieldId || '',
              ).trim(),
            )
            .filter(Boolean);

          nextCombinationRows[entry.ratingParameterId] = (entry.rows || []).map((row) => {
            const rawValues = row.values || [];
            const normalizedValues =
              childKeys.length > 0
                ? childKeys.map((childKey) => {
                    const childMeta =
                      children.find((child) => {
                        const definitionId = String(child?.definitionId || '').trim();
                        const ratingParameterId = String(child?.ratingParameterId || '').trim();
                        const formFieldId = String(child?.formFieldId || '').trim();
                        return (
                          definitionId === childKey ||
                          ratingParameterId === childKey ||
                          formFieldId === childKey
                        );
                      }) || null;
                    const childDefinitionId =
                      String(childMeta?.definitionId || '').trim() || undefined;
                    const childRatingParameterId =
                      String(childMeta?.ratingParameterId || '').trim() || undefined;
                    const isDropdown =
                      Array.isArray(childMeta?.options) && (childMeta?.options || []).length > 0;
                    const isCoverSelection = childMeta?.optionsSourceMode === 'coverSelection';
                    const existing =
                      rawValues.find((v) => {
                        const vDef = String(v.childDefinitionId || '').trim();
                        const vParam = String(v.childRatingParameterId || '').trim();
                        if (childDefinitionId && vDef === childDefinitionId) return true;
                        if (childRatingParameterId && vParam === childRatingParameterId)
                          return true;
                        return vDef === childKey || vParam === childKey;
                      }) || null;

                    const normalizedFrom =
                      typeof existing?.rangeFrom === 'number'
                        ? existing.rangeFrom
                        : existing?.rangeFrom
                          ? Number(existing.rangeFrom)
                          : 0;
                    const normalizedTo =
                      typeof existing?.rangeTo === 'number'
                        ? existing.rangeTo
                        : existing?.rangeTo
                          ? Number(existing.rangeTo)
                          : 0;

                    return {
                      childDefinitionId:
                        childDefinitionId || existing?.childDefinitionId || undefined,
                      childRatingParameterId:
                        childRatingParameterId || existing?.childRatingParameterId || undefined,
                      valueType: isDropdown ? 'DROPDOWN' : 'NUMBER_RANGE',
                      masterValueId:
                        isDropdown && !isCoverSelection ? existing?.masterValueId || '' : '',
                      coverId:
                        isDropdown && isCoverSelection
                          ? String(existing?.coverId || '').trim()
                          : '',
                      rangeFrom: isDropdown ? 0 : normalizedFrom,
                      rangeTo: isDropdown ? 0 : normalizedTo,
                    } satisfies CombinationRowValueState;
                  })
                : rawValues.map((v) => ({
                    childDefinitionId: v.childDefinitionId || undefined,
                    childRatingParameterId: v.childRatingParameterId || undefined,
                    valueType: v.valueType,
                    masterValueId: v.masterValueId || '',
                    coverId: v.coverId || '',
                    rangeFrom:
                      typeof v.rangeFrom === 'number'
                        ? v.rangeFrom
                        : v.rangeFrom
                          ? Number(v.rangeFrom)
                          : 0,
                    rangeTo:
                      typeof v.rangeTo === 'number' ? v.rangeTo : v.rangeTo ? Number(v.rangeTo) : 0,
                  }));

            return {
              id: row.id,
              rowOrder: Number(row.rowOrder || 0),
              loading: Number(row.loading || 0),
              premiumAdjustmentType: row.premiumAdjustmentType
                ? (String(row.premiumAdjustmentType).toUpperCase() as 'PERCENTAGE' | 'FIXED')
                : undefined,
              minPremiumValue:
                row.minPremiumValue === null || row.minPremiumValue === undefined
                  ? undefined
                  : Number(row.minPremiumValue),
              maxPremiumValue:
                row.maxPremiumValue === null || row.maxPremiumValue === undefined
                  ? undefined
                  : Number(row.maxPremiumValue),
              adjustmentType: row.adjustmentType || 'PERCENTAGE',
              quoteAction: normalizeQuoteAction(row.quoteAction || 'quote'),
              values: normalizedValues,
            };
          });
        });
        setCombinationRowsByParameter(nextCombinationRows);
        const baseFirst = (grouped.base || [])
          .slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)[0];
        const factorFirst = (grouped.factor || [])
          .slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)[0];
        const premiumLimitFirst = (grouped.premiumLimit || [])
          .slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)[0];
        setActiveTab((prev) => {
          if (prev || activePricingTab) return prev;
          if (baseFirst?.ratingParameterId) {
            return { category: 'base', ratingParameterId: baseFirst.ratingParameterId };
          }
          if (factorFirst?.ratingParameterId) {
            return { category: 'factor', ratingParameterId: factorFirst.ratingParameterId };
          }
          if (premiumLimitFirst?.ratingParameterId) {
            return {
              category: 'premiumLimit',
              ratingParameterId: premiumLimitFirst.ratingParameterId,
            };
          }
          return prev;
        });
        setActivePricingTab((prev) => {
          if (prev) return prev;
          if (baseFirst?.ratingParameterId) return getRatingParameterTabId('base', baseFirst);
          if (factorFirst?.ratingParameterId) return getRatingParameterTabId('factor', factorFirst);
          if (premiumLimitFirst?.ratingParameterId)
            return getRatingParameterTabId('premiumLimit', premiumLimitFirst);
          return prev;
        });

        const all = [
          ...(grouped.base || []),
          ...(grouped.factor || []),
          ...(grouped.premiumLimit || []),
        ];
        const newSelections: Record<string, Record<string, OptionConfig>> = {};
        const newFree: Record<string, FreeRow[]> = {};

        all.forEach((p, idx) => {
          // Handle Masters
          if (p.options && p.options.length > 0) {
            const paramSelections: Record<string, OptionConfig> = {};
            p.options.forEach((opt) => {
              if (opt.adjustmentType) {
                paramSelections[opt.value] = {
                  adjustmentType: (opt.adjustmentType as string).toLowerCase() as
                    | 'percentage'
                    | 'fixed',
                  adjustmentValue: Number(opt.adjustmentValue),
                  premiumAdjustmentType: opt.premiumAdjustmentType
                    ? (String(opt.premiumAdjustmentType).toLowerCase() as 'percentage' | 'fixed')
                    : ((opt.adjustmentType as string).toLowerCase() as 'percentage' | 'fixed'),
                  minPremiumValue:
                    opt.minPremiumValue !== undefined && opt.minPremiumValue !== null
                      ? Number(opt.minPremiumValue)
                      : Number(opt.adjustmentValue),
                  maxPremiumValue:
                    opt.maxPremiumValue !== undefined && opt.maxPremiumValue !== null
                      ? Number(opt.maxPremiumValue)
                      : undefined,
                  quoteAction: normalizeQuoteAction(opt.quoteAction || 'quote'),
                };
              }
            });
            if (Object.keys(paramSelections).length > 0) {
              newSelections[p.ratingParameterId] = paramSelections;
            }
          }

          // Handle Ranges
          if (p.ranges && p.ranges.length > 0) {
            p.ranges.forEach((r, i) => {
              const pid = r.ratingParameterId || p.ratingParameterId;

              if (!newFree[pid]) newFree[pid] = [];
              newFree[pid].push({
                id: r.id || Date.now() + idx * 1000 + i,
                rangeStart: r.rangeStart,
                rangeEnd: r.rangeEnd,
                adjustmentType: (r.adjustmentType as string).toLowerCase() as
                  | 'percentage'
                  | 'fixed',
                adjustmentValue: r.adjustmentValue,
                premiumAdjustmentType: r.premiumAdjustmentType
                  ? (String(r.premiumAdjustmentType).toLowerCase() as 'percentage' | 'fixed')
                  : ((r.adjustmentType as string).toLowerCase() as 'percentage' | 'fixed'),
                minPremiumValue:
                  r.minPremiumValue !== undefined && r.minPremiumValue !== null
                    ? Number(r.minPremiumValue)
                    : Number(r.adjustmentValue),
                maxPremiumValue:
                  r.maxPremiumValue !== undefined && r.maxPremiumValue !== null
                    ? Number(r.maxPremiumValue)
                    : undefined,
                quoteAction: normalizeQuoteAction(r.quoteAction),
                subField: (r as RangeConfig).subField,
              });
            });
          } else if (
            (!p.options || p.options.length === 0) &&
            !p.fieldType?.toLowerCase().includes('combination')
          ) {
            if (!newFree[p.ratingParameterId]) {
              newFree[p.ratingParameterId] = [
                {
                  id: Date.now() + idx,
                  rangeStart: 0,
                  rangeEnd: 0,
                  adjustmentType: 'percentage',
                  adjustmentValue: 0,
                  quoteAction: 'quote',
                },
              ];
            }
          }

          const pAny = p;
          if (pAny.masterRules && pAny.masterRules.length > 0) {
            const paramSelections = newSelections[p.ratingParameterId] || {};
            pAny.masterRules.forEach((rule) => {
              if (!rule.subField) return;
              const key = `${rule.subField}::${rule.masterValueId}`;
              paramSelections[key] = {
                adjustmentType: (rule.adjustmentType as string).toLowerCase() as
                  | 'percentage'
                  | 'fixed',
                adjustmentValue: Number(rule.adjustmentValue),
                premiumAdjustmentType: rule.premiumAdjustmentType
                  ? (String(rule.premiumAdjustmentType).toLowerCase() as 'percentage' | 'fixed')
                  : ((rule.adjustmentType as string).toLowerCase() as 'percentage' | 'fixed'),
                minPremiumValue:
                  rule.minPremiumValue !== undefined && rule.minPremiumValue !== null
                    ? Number(rule.minPremiumValue)
                    : Number(rule.adjustmentValue),
                maxPremiumValue:
                  rule.maxPremiumValue !== undefined && rule.maxPremiumValue !== null
                    ? Number(rule.maxPremiumValue)
                    : undefined,
                quoteAction: normalizeQuoteAction(rule.quoteAction || 'quote'),
                subField: rule.subField,
              };
            });
            newSelections[p.ratingParameterId] = paramSelections;
          }
        });

        setRatingSelections(newSelections);
        setRatingFreeConfigs(newFree);

        if (matrix && matrix.matrices) {
          const nextCells: Record<string, MatrixCellPayload[]> = {};
          const nextAxes: Record<string, { x: MatrixAxisItem[]; y: MatrixAxisItem[] }> = {};
          matrix.matrices.forEach((m) => {
            const cells: MatrixCellPayload[] = (m.rules || []).map((r) => ({
              id: r.id,
              xType: r.xRuleType,
              yType: r.yRuleType,
              xMasterValueId: r.xMasterValueId,
              yMasterValueId: r.yMasterValueId,
              xRangeRuleId: r.xRangeRuleId,
              yRangeRuleId: r.yRangeRuleId,
              adjustmentType: r.adjustmentType,
              adjustmentValue: r.adjustmentValue,
              premiumAdjustmentType: r.premiumAdjustmentType ?? undefined,
              minPremiumValue: r.minPremiumValue ?? undefined,
              maxPremiumValue: r.maxPremiumValue ?? undefined,
              quoteAction: r.quoteAction,
            }));
            nextCells[m.ratingParameterId] = cells;
            nextAxes[m.ratingParameterId] = {
              x: m.x.items || [],
              y: m.y.items || [],
            };
          });
          setMatrixCells(nextCells);
          setMatrixAxisRanges(nextAxes);
        }
      }
    } catch (error) {
      void 0;
    }
  }, [
    activePricingTab,
    productId,
    normalizeQuoteAction,
    setGroupedParams,
    setMatrixConfig,
    setRatingSelections,
    setRatingFreeConfigs,
    setMatrixCells,
    setMatrixAxisRanges,
  ]);

  useEffect(() => {
    async function loadTabContent() {
      if (activePricingTab === 'commission-structure') {
        try {
          const limitsData = await getPolicyLimits(productId);

          setPricingConfig((prev) => ({
            ...prev,
            limits: limitsData
              ? {
                  ...limitsData,
                  brokerCommissionType: normalizeCommissionType(limitsData.brokerCommissionType),
                  maxBrokerCommissionType: normalizeCommissionType(
                    limitsData.maxBrokerCommissionType,
                  ),
                  minBrokerCommissionType: normalizeCommissionType(
                    limitsData.minBrokerCommissionType,
                  ),
                }
              : prev.limits,
            coverRequirements: {
              ...prev.coverRequirements,
              policyDeductibles: [],
            },
          }));
        } catch (error) {
          console.error('Failed to load limits or deductibles', error);
        }
      } else if (activePricingTab === 'fee-types') {
        try {
          const data = await getFeeTypes(productId);
          if (data) {
            const mappedFeeTypes = (data || []).map((f) => ({
              id: f.id || Date.now(),
              label: f.label,
              pricingType:
                f.adjustmentType === 'PERCENTAGE'
                  ? ('percentage' as const)
                  : f.adjustmentType === 'FACTOR'
                    ? ('factor' as const)
                    : ('fixed' as const),
              value: String(f.adjustmentValue),
              status: (f.status === 'ACTIVE' ? 'active' : 'inactive') as 'active' | 'inactive',
              isEditable: f.isEditable,
              organizationId: f.organizationId,
              isNew: false,
            }));
            setPricingConfig((prev) => ({
              ...prev,
              // Always keep one empty default row for the Fee Types table
              feeTypes:
                mappedFeeTypes.length > 0
                  ? mappedFeeTypes
                  : [
                      {
                        id: Date.now(),
                        label: '',
                        pricingType: 'percentage' as const,
                        value: '0',
                        status: 'active' as const,
                        isEditable: true,
                        organizationId: null,
                        isNew: true,
                      },
                    ],
            }));
          }
        } catch (error) {
          console.error('Failed to load fee types', error);
        }
      }
    }
    loadTabContent();
  }, [activePricingTab, productId, normalizeCommissionType]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const loadRiskCategories = async () => {
      try {
        const categories = await getRiskCategories(productId);
        const normalizedCategories = normalizeRiskCategories(categories);
        const normalizedRows = mapDefaultRiskCategorisationRows(normalizedCategories);

        setRiskCategories(normalizedCategories);
        setActiveRiskCategoryId((prev) => {
          if (prev && normalizedCategories.some((category) => category.id === prev)) return prev;
          return normalizedCategories[0]?.id || '';
        });
        setPricingConfig((prev) => ({
          ...prev,
          riskCategorisations: normalizedRows,
        }));
      } catch (error) {
        console.error('Failed to load risk categories', error);
      }
    };

    void loadRiskCategories();
  }, [productId]);

  useEffect(() => {
    if (!activePricingTab.startsWith('risk-categorisation-')) return;
    const categoryId = activePricingTab.replace('risk-categorisation-', '');
    if (!categoryId) return;

    setActiveRiskCategoryId(categoryId);

    const selectedCategory = riskCategories.find((category) => category.id === categoryId);
    if (!selectedCategory) return;

    const loadSelectedRiskCategory = async () => {
      try {
        const riskData = await getRiskCategorisationByRiskCategory(productId, categoryId);
        const selectedCategoryRows = mapPricingRowsForCategory(riskData, selectedCategory);
        setPricingConfig((prev) => ({
          ...prev,
          riskCategorisations: [
            ...prev.riskCategorisations.filter((row) => row.riskCategoryId !== categoryId),
            ...selectedCategoryRows,
          ],
        }));
      } catch (error) {
        console.error('Failed to load selected risk category pricing', error);
      }
    };

    void loadSelectedRiskCategory();
  }, [activePricingTab, productId, riskCategories]);

  const handleAddRow = (paramId: string) => {
    setRatingFreeConfigs((prev) => {
      const rows = prev[paramId] || [];
      const newRow = createNewFreeRow(rows);
      return { ...prev, [paramId]: [...rows, newRow] };
    });
  };

  const handleRangeChange = (
    paramId: string,
    rowId: string | number,
    field: keyof FreeRow,
    value: FreeRow[keyof FreeRow],
  ) => {
    setRatingFreeConfigs((prev) => {
      const rows = prev[paramId] || [];
      const updated = rows.map((r) => (r.id === rowId ? { ...r, [field]: value } : r));
      return { ...prev, [paramId]: updated };
    });
  };

  const handleRemoveRow = (paramId: string, rowId: number | string) => {
    setRowToDelete({ paramId, rowId });
  };

  const confirmRemoveRow = () => {
    if (!rowToDelete) return;
    const { paramId, rowId } = rowToDelete;

    if (typeof rowId === 'string') {
      setDeletedRangeIds((prev) => ({
        ...prev,
        [paramId]: [...(prev[paramId] || []), rowId],
      }));
    }
    setRatingFreeConfigs((prev) => {
      const rows = prev[paramId] || [];
      const filtered = rows.filter((r) => r.id !== rowId);
      return { ...prev, [paramId]: filtered };
    });
    setRowToDelete(null);
  };

  const dedupeRanges = <
    T extends {
      id?: string | number;
      rangeStart: number;
      rangeEnd: number;
      adjustmentType: string;
      adjustmentValue: number;
      quoteAction: string;
      subField?: string;
    },
  >(
    ranges: T[],
  ): T[] => {
    const seen = new Set<string>();
    const result: T[] = [];
    ranges.forEach((r) => {
      const key = [
        r.subField || '',
        r.rangeStart,
        r.rangeEnd,
        r.adjustmentType.toLowerCase(),
        r.adjustmentValue,
        r.quoteAction,
      ].join('|');
      if (!seen.has(key)) {
        seen.add(key);
        result.push(r);
      }
    });
    return result;
  };

  const hasRangeConflicts = <
    T extends {
      rangeStart: number;
      rangeEnd: number;
      subField?: string;
    },
  >(
    ranges: T[],
  ): boolean => {
    const normalized = ranges.map((r) => {
      const start = Number(r.rangeStart ?? 0);
      const end = Number(r.rangeEnd ?? 0);
      const s = Number.isNaN(start) ? 0 : start;
      const e = Number.isNaN(end) ? 0 : end;
      const min = Math.min(s, e);
      const max = Math.max(s, e);
      return {
        ...r,
        rangeStart: min,
        rangeEnd: max,
      };
    });

    const groups = new Map<string, T[]>();
    normalized.forEach((r) => {
      const key = (r as T).subField || '__default';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(r as T);
    });

    for (const [, list] of groups) {
      if (list.length <= 1) continue;
      const sorted = [...list].sort((a, b) => {
        if (a.rangeStart !== b.rangeStart) return a.rangeStart - b.rangeStart;
        return a.rangeEnd - b.rangeEnd;
      });
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        if (curr.rangeStart <= prev.rangeEnd) {
          return true;
        }
      }
    }
    return false;
  };

  const dedupeMasters = <
    T extends {
      masterValueId: string;
      subField?: string;
    },
  >(
    masters: T[],
  ): T[] => {
    const map = new Map<string, T>();
    masters.forEach((m) => {
      const key = `${m.masterValueId}|${m.subField || ''}`;
      if (map.has(key)) map.delete(key);
      map.set(key, m);
    });
    return Array.from(map.values());
  };

  const resolveMasterValueId = (
    options: Array<{ value?: string; label?: string; masterValueId?: string }> | undefined,
    key: string,
  ): string | undefined => {
    const list = Array.isArray(options) ? options : [];
    const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (uuidV4.test(key)) return key;

    return (
      list.find((o) => o.value === key)?.masterValueId ||
      list.find((o) => o.label === key)?.masterValueId ||
      list.find((o) => o.masterValueId === key)?.masterValueId
    );
  };

  const hasChanges = (paramId: string, type: 'MASTER' | 'RANGE') => {
    if (!groupedParams) return false;
    const allParams = [
      ...(groupedParams.base || []),
      ...(groupedParams.factor || []),
      ...(groupedParams.premiumLimit || []),
    ];
    const param = allParams.find((p) => p.ratingParameterId === paramId);
    if (!param) return false;

    if (type === 'MASTER') {
      const currentSelections = ratingSelections[paramId] || {};
      return (param.options || []).some((opt) => {
        const current = currentSelections[opt.value];
        // Original values
        const origType = (opt.adjustmentType || '').toLowerCase();
        const origVal = Number(opt.adjustmentValue || 0);
        const origQuote = normalizeQuoteAction(opt.quoteAction || 'quote');

        // If current selection exists, compare
        if (current) {
          if (
            current.adjustmentType !== (origType || 'percentage') &&
            current.adjustmentType !== origType
          )
            return true;
          if (current.adjustmentValue !== origVal) return true;
          if (current.quoteAction !== origQuote) return true;
          if (current.subField !== (opt as unknown as { subField?: string }).subField) return true;
        } else if (opt.adjustmentType) {
          // If original had config but current doesn't? (Shouldn't happen as we init state)
          return true;
        }
        return false;
      });
    } else {
      const currentRows = ratingFreeConfigs[paramId] || [];
      const originalRows = param.ranges || [];
      const validCurrent = dedupeRanges(
        currentRows.filter((r) => !(r.rangeStart === 0 && r.rangeEnd === 0)),
      );
      if (validCurrent.length !== originalRows.length) return true;
      return validCurrent.some((row) => {
        if (typeof row.id === 'number') return true;
        const original = originalRows.find((r) => r.id === row.id);
        if (!original) return true;
        if (row.rangeStart !== original.rangeStart) return true;
        if (row.rangeEnd !== original.rangeEnd) return true;
        if (row.adjustmentType !== (original.adjustmentType || '').toLowerCase()) return true;
        if (row.adjustmentValue !== original.adjustmentValue) return true;
        if (row.quoteAction !== normalizeQuoteAction(original.quoteAction || '')) return true;
        if (row.subField !== (original as RangeConfig).subField) return true;
        return false;
      });
    }
  };

  const handleSaveMasters = async () => {
    if (!groupedParams) return;
    const parts = activePricingTab.split('-');
    const section = parts[1];
    const pid = parts.slice(2).join('-');
    const normalizedSection = section as 'base' | 'factor' | 'premiumLimit';
    const src =
      normalizedSection === 'base'
        ? groupedParams.base
        : normalizedSection === 'factor'
          ? groupedParams.factor
          : groupedParams.premiumLimit;
    const param = (src || []).find((p) => p.ratingParameterId === pid);
    if (!param) return;
    const masters = dedupeMasters(
      Object.entries(ratingSelections[param.ratingParameterId] || {})
        .map(([optionValue, cfg]) => {
          const mv = resolveMasterValueId(param.options, optionValue);

          return {
            optionValue:
              (param.options || []).find((o) => o.masterValueId === mv)?.value || optionValue,
            masterValueId: mv || '',
            adjustmentType: cfg.adjustmentType.toUpperCase() as 'PERCENTAGE' | 'FIXED',
            adjustmentValue: cfg.adjustmentValue,
            ...(normalizedSection === 'premiumLimit'
              ? {
                  premiumAdjustmentType: (
                    cfg.premiumAdjustmentType || cfg.adjustmentType
                  ).toUpperCase() as 'PERCENTAGE' | 'FIXED',
                  minPremiumValue: cfg.minPremiumValue ?? cfg.adjustmentValue,
                  maxPremiumValue: cfg.maxPremiumValue,
                }
              : {}),
            quoteAction: cfg.quoteAction as 'quote' | 'no_quote' | 'referral',
            subField: cfg.subField,
          };
        })
        .filter((m) => m.masterValueId),
    );
    if (masters.length === 0) return;
    setIsSaving(true);
    try {
      await saveRatingValues({
        ratingConfigId: groupedParams.ratingConfigId,
        category:
          normalizedSection === 'base'
            ? 'BASE'
            : normalizedSection === 'factor'
              ? 'FACTOR'
              : 'PREMIUM_LIMIT',
        parameters: [
          {
            formFieldId: param.formFieldId,
            ratingParameterId: param.ratingParameterId,
            type: 'MASTER',
            masters,
          },
        ],
      });
      toast.success('Saved', { description: 'Master values updated successfully' });
    } catch (error) {
      console.error('Failed to save masters', error);
      const msg = error instanceof Error ? error.message : 'Failed to save master values';
      toast.error('Error', { description: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFree = async () => {
    if (!groupedParams) return;
    const parts = activePricingTab.split('-');
    const section = parts[1];
    const pid = parts.slice(2).join('-');
    const normalizedSection = section as 'base' | 'factor' | 'premiumLimit';
    const src =
      normalizedSection === 'base'
        ? groupedParams.base
        : normalizedSection === 'factor'
          ? groupedParams.factor
          : groupedParams.premiumLimit;
    const param = (src || []).find((p) => p.ratingParameterId === pid);
    if (!param) return;
    
    // Filter out rows with same FROM and TO (invalid rows), save the rest
    const allRows = ratingFreeConfigs[param.ratingParameterId] || [];
    const sourceRows = allRows.filter((r) => Number(r.rangeStart) !== Number(r.rangeEnd));
    
    if (sourceRows.length > 1 && hasRangeConflicts(sourceRows)) {
      toast.error('Invalid ranges', {
        description: 'Ranges overlap or conflict. Please ensure ranges do not overlap.',
      });
      return;
    }
    const ranges = dedupeRanges(sourceRows).map((r) => ({
      id: typeof r.id === 'string' ? r.id : undefined,
      rangeStart: r.rangeStart,
      rangeEnd: r.rangeEnd,
      adjustmentType: r.adjustmentType.toUpperCase() as 'PERCENTAGE' | 'FIXED',
      adjustmentValue: r.adjustmentValue,
      ...(normalizedSection === 'premiumLimit'
        ? {
            premiumAdjustmentType: (r.premiumAdjustmentType || r.adjustmentType).toUpperCase() as
              | 'PERCENTAGE'
              | 'FIXED',
            minPremiumValue: r.minPremiumValue ?? r.adjustmentValue,
            maxPremiumValue: r.maxPremiumValue,
          }
        : {}),
      quoteAction: r.quoteAction as 'quote' | 'no_quote' | 'referral',
      subField: r.subField,
    }));
    if (
      ranges.length === 0 &&
      (!deletedRangeIds[param.ratingParameterId] ||
        deletedRangeIds[param.ratingParameterId].length === 0)
    )
      return;
    setIsSaving(true);
    try {
      await saveRatingValues({
        ratingConfigId: groupedParams.ratingConfigId,
        category:
          normalizedSection === 'base'
            ? 'BASE'
            : normalizedSection === 'factor'
              ? 'FACTOR'
              : 'PREMIUM_LIMIT',
        parameters: [
          {
            formFieldId: param.formFieldId,
            ratingParameterId: param.ratingParameterId,
            type: 'RANGE',
            ranges,
            deletedIds: deletedRangeIds[param.ratingParameterId],
          },
        ],
      });
      setDeletedRangeIds((prev) => {
        const next = { ...prev };
        delete next[param.ratingParameterId];
        return next;
      });
      toast.success('Saved', { description: 'Range values updated successfully' });
    } catch (error) {
      console.error('Failed to save ranges', error);
      const msg = error instanceof Error ? error.message : 'Failed to save range values';
      toast.error('Error', { description: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const validateRangesForCategory = (
    category: 'base' | 'factor' | 'premiumLimit',
    paramId?: string,
  ) => {
    if (!groupedParams) return true;

    const src =
      category === 'base'
        ? groupedParams.base
        : category === 'factor'
          ? groupedParams.factor
          : groupedParams.premiumLimit;

    const params = (src || []).filter((p) => (paramId ? p.ratingParameterId === paramId : true));

    for (const param of params) {
      const hasOptions = Array.isArray(param.options) && param.options.length > 0;
      const pAny = param as RatingParameterItem & { subFields?: unknown[] };
      const isCombination =
        param.fieldType?.toLowerCase().includes('combination') ||
        param.fieldType === 'combination';

      if (isCombination) {
        const withDerived = param as RatingParameterItem & {
          derivedParameters?: RatingParameterItem[];
        };
        const derived = withDerived.derivedParameters || [];
        if (derived.length > 0) {
          for (const dp of derived) {
            if (!dp.ratingParameterId) continue;
            const rows = (ratingFreeConfigs[dp.ratingParameterId] || []).filter(
              (r) => r.rangeStart !== r.rangeEnd,
            );
            if (rows.length > 1 && hasRangeConflicts(rows)) {
              toast.error('Invalid ranges', {
                description: `Ranges for ${dp.fieldLabel || param.fieldLabel} overlap. Please ensure ranges do not overlap.`,
              });
              return false;
            }
          }
        } else {
          const rows = (ratingFreeConfigs[param.ratingParameterId] || []).filter(
            (r) => r.rangeStart !== r.rangeEnd,
          );
          if (rows.length > 1 && hasRangeConflicts(rows)) {
            toast.error('Invalid ranges', {
              description: `Ranges for ${param.fieldLabel} overlap. Please ensure ranges do not overlap.`,
            });
            return false;
          }
        }
        continue;
      }

      if (!hasOptions) {
        const rows = (ratingFreeConfigs[param.ratingParameterId] || []).filter(
          (r) => r.rangeStart !== r.rangeEnd,
        );
        if (rows.length > 1 && hasRangeConflicts(rows)) {
          toast.error('Invalid ranges', {
            description: `Ranges for ${param.fieldLabel} overlap. Please ensure ranges do not overlap.`,
          });
          return false;
        }
      }
    }

    return true;
  };

  const handleSaveCategory = async (
    category: 'base' | 'factor' | 'premiumLimit',
    ratingParameterId?: string,
  ) => {
    if (!groupedParams) return;

    const src =
      category === 'base'
        ? groupedParams.base
        : category === 'factor'
          ? groupedParams.factor
          : groupedParams.premiumLimit;

    if (ratingParameterId) {
      if (!validateRangesForCategory(category, ratingParameterId)) return;

      const param = (src || []).find((p) => p.ratingParameterId === ratingParameterId);
      if (param) {
        const pAny = param;
        if (
          param.fieldType?.toLowerCase().includes('combination') ||
          param.fieldType === 'combination'
        ) {
          // Handle Combination Logic
          const masters: MasterOptionConfig[] = [];
          const ranges: RangeConfig[] = [];
          const result: GroupedValuesPayload['parameters'] = [];

          // 1. Collect Masters from selections
          const selections = ratingSelections[param.ratingParameterId] || {};
          Object.entries(selections).forEach(([key, cfg]) => {
            let mv = '';
            let optionValue = key;
            if (key.includes('::')) {
              const parts = key.split('::');
              // parts[0] is subField name, parts[1] is option.id
              optionValue = parts[1];
              const subFields = param.subFields || [];
              const subField = subFields.find(
                (sf: { valueCode?: string; name?: string; options?: unknown[] }) =>
                  (sf.valueCode || sf.name) === parts[0],
              );
              if (subField && Array.isArray(subField.options) && subField.options.length > 0) {
                const opt = subField.options.find(
                  (o: { id: string; masterValueId?: string }) =>
                    (o.masterValueId || o.id) === optionValue,
                );
                if (opt && opt.masterValueId) {
                  mv = opt.masterValueId;
                } else {
                  // Fallback to option ID if masterValueId is not found (assuming ID is UUID)
                  mv = optionValue;
                }
              } else {
                mv = parts[1];
              }
            } else {
              mv = key;
            }
            masters.push({
              optionValue,
              masterValueId: mv,
              adjustmentType: cfg.adjustmentType.toUpperCase() as 'PERCENTAGE' | 'FIXED',
              adjustmentValue: cfg.adjustmentValue,
              premiumAdjustmentType: (
                cfg.premiumAdjustmentType || cfg.adjustmentType
              ).toUpperCase() as 'PERCENTAGE' | 'FIXED',
              minPremiumValue: cfg.minPremiumValue ?? cfg.adjustmentValue,
              maxPremiumValue: cfg.maxPremiumValue,
              quoteAction: cfg.quoteAction,
              subField: cfg.subField,
            });
          });

          const dedupedMasters = dedupeMasters(masters).filter((m) => !!m.masterValueId);

          if (dedupedMasters.length > 0) {
            result.push({
              formFieldId: param.formFieldId,
              ratingParameterId: param.ratingParameterId,
              type: 'MASTER' as const,
              masters: dedupedMasters,
            });
          }

          // 2. Collect Ranges from derived parameters (for Combination fields)
          const derived = param.derivedParameters || [];
          if (derived.length > 0) {
            derived.forEach((dp: RatingParameterItem) => {
              if (!dp.ratingParameterId) return;
              const dpRanges = dedupeRanges(ratingFreeConfigs[dp.ratingParameterId] || []).map(
                (r) => ({
                  id: typeof r.id === 'string' ? r.id : undefined,
                  rangeStart: r.rangeStart,
                  rangeEnd: r.rangeEnd,
                  adjustmentType: r.adjustmentType.toUpperCase() as 'PERCENTAGE' | 'FIXED',
                  adjustmentValue: r.adjustmentValue,
                  premiumAdjustmentType: (
                    r.premiumAdjustmentType || r.adjustmentType
                  ).toUpperCase() as 'PERCENTAGE' | 'FIXED',
                  minPremiumValue: r.minPremiumValue ?? r.adjustmentValue,
                  maxPremiumValue: r.maxPremiumValue,
                  quoteAction: r.quoteAction as 'quote' | 'no_quote' | 'referral',
                  subField: r.subField,
                }),
              );

              const dpDeleted = deletedRangeIds[dp.ratingParameterId] || [];

              if (dpRanges.length > 0 || dpDeleted.length > 0) {
                result.push({
                  formFieldId: param.formFieldId,
                  ratingParameterId: dp.ratingParameterId,
                  type: 'RANGE' as const,
                  ranges: dpRanges,
                  deletedIds: dpDeleted,
                });
              }
            });
          } else {
            // Fallback for non-combination fields with subfields or legacy structure
            const configRows = ratingFreeConfigs[param.ratingParameterId] || [];
            configRows.forEach((r) => {
              ranges.push({
                id: typeof r.id === 'string' ? r.id : undefined,
                rangeStart: r.rangeStart,
                rangeEnd: r.rangeEnd,
                adjustmentType: r.adjustmentType.toUpperCase() as 'PERCENTAGE' | 'FIXED',
                adjustmentValue: r.adjustmentValue,
                premiumAdjustmentType: (
                  r.premiumAdjustmentType || r.adjustmentType
                ).toUpperCase() as 'PERCENTAGE' | 'FIXED',
                minPremiumValue: r.minPremiumValue ?? r.adjustmentValue,
                maxPremiumValue: r.maxPremiumValue,
                quoteAction: r.quoteAction,
                subField: r.subField,
              });
            });

            const deleted = deletedRangeIds[param.ratingParameterId] || [];

            if (ranges.length > 0 || deleted.length > 0) {
              result.push({
                formFieldId: param.formFieldId,
                ratingParameterId: param.ratingParameterId,
                type: 'RANGE' as const,
                ranges,
                deletedIds: deleted,
              });
            }
          }

          // Save specific parameter
          if (result.length > 0) {
            setIsSaving(true);
            try {
              const payload: GroupedValuesPayload = {
                ratingConfigId: groupedParams.ratingConfigId,
                category:
                  category === 'base' ? 'BASE' : category === 'factor' ? 'FACTOR' : 'PREMIUM_LIMIT',
                parameters: result,
              };

              await saveRatingValues(payload);
              setDeletedRangeIds((prev) => {
                const next = { ...prev };
                result.forEach((p) => {
                  const rp = p.ratingParameterId;
                  if (rp) delete next[rp];
                });
                return next;
              });
              toast.success('Configuration Saved', {
                description: `${param.fieldLabel} has been saved successfully.`,
              });
            } catch (error) {
              console.error('Save error:', error);
              toast.error('Error', {
                description: 'Failed to save configuration. Please try again.',
              });
            } finally {
              setIsSaving(false);
            }
            return;
          }
        }
      }
      const single = (src || []).find((p) => p.ratingParameterId === ratingParameterId);
      if (!single) return;
      const parameters = [single].flatMap((param): GroupedValuesPayload['parameters'] => {
        const hasOptions = Array.isArray(param.options) && param.options.length > 0;

        const pAny = param;
        if (
          param.fieldType?.toLowerCase().includes('combination') ||
          param.fieldType === 'combination'
        ) {
          const derived = param.derivedParameters || [];
          if (derived.length > 0) {
            return derived.flatMap((dp) => {
              const ranges = dedupeRanges(ratingFreeConfigs[dp.ratingParameterId] || []).map(
                (r) => ({
                  id: typeof r.id === 'string' ? r.id : undefined,
                  rangeStart: r.rangeStart,
                  rangeEnd: r.rangeEnd,
                  adjustmentType: r.adjustmentType.toUpperCase() as 'PERCENTAGE' | 'FIXED',
                  adjustmentValue: r.adjustmentValue,
                  quoteAction: r.quoteAction as 'quote' | 'no_quote' | 'referral',
                }),
              );

              const deleted = deletedRangeIds[dp.ratingParameterId] || [];

              if (ranges.length > 0 || deleted.length > 0) {
                return [
                  {
                    formFieldId: param.formFieldId,
                    ratingParameterId: dp.ratingParameterId,
                    type: 'RANGE' as const,
                    ranges,
                    deletedIds: deleted,
                  },
                ];
              }
              return [];
            });
          }
          return [];
        }

        if (hasOptions) {
          const masters = dedupeMasters(
            Object.entries(ratingSelections[param.ratingParameterId] || {})
              .map(([optionValue, cfg]) => {
                const mv = resolveMasterValueId(param.options, optionValue);

                return {
                  optionValue:
                    (param.options || []).find((o) => o.masterValueId === mv)?.value || optionValue,
                  ratingParameterId: param.ratingParameterId,
                  masterValueId: mv || '',
                  adjustmentType: cfg.adjustmentType.toUpperCase() as 'PERCENTAGE' | 'FIXED',
                  adjustmentValue: cfg.adjustmentValue,
                  premiumAdjustmentType: (
                    cfg.premiumAdjustmentType || cfg.adjustmentType
                  ).toUpperCase() as 'PERCENTAGE' | 'FIXED',
                  minPremiumValue: cfg.minPremiumValue ?? cfg.adjustmentValue,
                  maxPremiumValue: cfg.maxPremiumValue,
                  quoteAction: cfg.quoteAction as 'quote' | 'no_quote' | 'referral',
                  subField: cfg.subField,
                };
              })
              .filter((m) => m.masterValueId),
          );

          if (masters.length > 0) {
            return [
              {
                formFieldId: param.formFieldId,
                ratingParameterId: param.ratingParameterId,
                type: 'MASTER' as const,
                masters,
              },
            ];
          }
          return [];
        }

        const ranges = dedupeRanges(ratingFreeConfigs[param.ratingParameterId] || []).map((r) => ({
          id: typeof r.id === 'string' ? r.id : undefined,
          rangeStart: r.rangeStart,
          rangeEnd: r.rangeEnd,
          adjustmentType: r.adjustmentType.toUpperCase() as 'PERCENTAGE' | 'FIXED',
          adjustmentValue: r.adjustmentValue,
          premiumAdjustmentType: (r.premiumAdjustmentType || r.adjustmentType).toUpperCase() as
            | 'PERCENTAGE'
            | 'FIXED',
          minPremiumValue: r.minPremiumValue ?? r.adjustmentValue,
          maxPremiumValue: r.maxPremiumValue,
          quoteAction: r.quoteAction as 'quote' | 'no_quote' | 'referral',
        }));
        if (
          ranges.length > 0 ||
          (deletedRangeIds[param.ratingParameterId] &&
            deletedRangeIds[param.ratingParameterId].length > 0)
        ) {
          return [
            {
              formFieldId: param.formFieldId,
              ratingParameterId: param.ratingParameterId,
              type: 'RANGE' as const,
              ranges,
              deletedIds: deletedRangeIds[param.ratingParameterId],
            },
          ];
        }
        return [];
      });

      if (parameters.length === 0) return;
      setIsSaving(true);
      try {
        await saveRatingValues({
          ratingConfigId: groupedParams.ratingConfigId,
          category:
            category === 'base' ? 'BASE' : category === 'factor' ? 'FACTOR' : 'PREMIUM_LIMIT',
          parameters,
        });
        setDeletedRangeIds((prev) => {
          const next = { ...prev };
          parameters.forEach((p) => {
            const rp = p.ratingParameterId;
            if (rp) delete next[rp];
          });
          return next;
        });
        toast.success('Saved', { description: `${single.fieldLabel} updated successfully` });
      } catch (error) {
        console.error('Failed to save category', error);
        const msg = error instanceof Error ? error.message : 'Failed to save configuration';
        toast.error('Error', { description: msg });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (!validateRangesForCategory(category)) return;
    const parameters = (src || []).flatMap((param): GroupedValuesPayload['parameters'] => {
      const hasOptions = Array.isArray(param.options) && param.options.length > 0;

      const pAny = param;
      if (
        param.fieldType?.toLowerCase().includes('combination') ||
        param.fieldType === 'combination'
      ) {
        // Handle Combination Logic
        const derived = param.derivedParameters || [];
        if (derived.length > 0) {
          return derived.flatMap((dp) => {
            const ranges = dedupeRanges(ratingFreeConfigs[dp.ratingParameterId] || []).map((r) => ({
              id: typeof r.id === 'string' ? r.id : undefined,
              rangeStart: r.rangeStart,
              rangeEnd: r.rangeEnd,
              adjustmentType: r.adjustmentType.toUpperCase() as 'PERCENTAGE' | 'FIXED',
              adjustmentValue: r.adjustmentValue,
              quoteAction: r.quoteAction as 'quote' | 'no_quote' | 'referral',
            }));

            const deleted = deletedRangeIds[dp.ratingParameterId] || [];

            if (ranges.length > 0 || deleted.length > 0) {
              return [
                {
                  formFieldId: param.formFieldId,
                  ratingParameterId: dp.ratingParameterId, // Derived Param ID
                  type: 'RANGE' as const,
                  ranges,
                  deletedIds: deleted,
                },
              ];
            }
            return [];
          });
        }
        return [];
      }

      if (hasOptions) {
        const masters = dedupeMasters(
          Object.entries(ratingSelections[param.ratingParameterId] || {})
            .map(([optionValue, cfg]) => {
              const mv = resolveMasterValueId(param.options, optionValue);

              return {
                optionValue:
                  (param.options || []).find((o) => o.masterValueId === mv)?.value || optionValue,
                ratingParameterId: param.ratingParameterId,
                masterValueId: mv || '',
                adjustmentType: cfg.adjustmentType.toUpperCase() as 'PERCENTAGE' | 'FIXED',
                adjustmentValue: cfg.adjustmentValue,
                quoteAction: cfg.quoteAction as 'quote' | 'no_quote' | 'referral',
                subField: cfg.subField,
              };
            })
            .filter((m) => m.masterValueId),
        );

        if (masters.length > 0) {
          return [
            {
              formFieldId: param.formFieldId,
              ratingParameterId: param.ratingParameterId,
              type: 'MASTER' as const,
              masters,
            },
          ];
        }
        return [];
      }

      const ranges = dedupeRanges(ratingFreeConfigs[param.ratingParameterId] || []).map((r) => ({
        id: typeof r.id === 'string' ? r.id : undefined,
        rangeStart: r.rangeStart,
        rangeEnd: r.rangeEnd,
        adjustmentType: r.adjustmentType.toUpperCase() as 'PERCENTAGE' | 'FIXED',
        adjustmentValue: r.adjustmentValue,
        quoteAction: r.quoteAction as 'quote' | 'no_quote' | 'referral',
      }));
      if (
        ranges.length > 0 ||
        (deletedRangeIds[param.ratingParameterId] &&
          deletedRangeIds[param.ratingParameterId].length > 0)
      ) {
        return [
          {
            formFieldId: param.formFieldId,
            ratingParameterId: param.ratingParameterId,
            type: 'RANGE' as const,
            ranges,
            deletedIds: deletedRangeIds[param.ratingParameterId],
          },
        ];
      }
      return [];
    });

    if (parameters.length === 0) return;
    setIsSaving(true);
    try {
      await saveRatingValues({
        ratingConfigId: groupedParams.ratingConfigId,
        category: category === 'base' ? 'BASE' : category === 'factor' ? 'FACTOR' : 'PREMIUM_LIMIT',
        parameters,
      });
      setDeletedRangeIds((prev) => {
        const next = { ...prev };
        parameters.forEach((p) => {
          const rp = p.ratingParameterId;
          if (rp) delete next[rp];
        });
        return next;
      });
      const label =
        category === 'base' ? 'Base' : category === 'factor' ? 'Factors' : 'Premium Limit';
      toast.success('Saved', { description: `${label} updated successfully` });
    } catch (error) {
      console.error('Failed to save category', error);
      const msg = error instanceof Error ? error.message : 'Failed to save configuration';
      toast.error('Error', { description: msg });
    } finally {
      setIsSaving(false);
    }
  };

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

  const defaultPricingTabs = [
    { id: 'commission-structure', label: 'Commission Structure', category: 'commission' },
    { id: 'fee-types', label: 'Fee Types', category: 'fees' },
    { id: 'endorsement-fees', label: 'Endorsement Fees', category: 'fees' },
  ];

  const generalPricingTabs = defaultPricingTabs.filter(
    (p) => !p.category || p.category === 'default',
  );
  const commissionTabs = defaultPricingTabs.filter((p) => p.category === 'commission');
  const feeTabs = defaultPricingTabs.filter((p) => p.category === 'fees');

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      if (activePricingTab === 'commission-structure') {
        await savePolicyConfig(productId, {
          policyLimit: {
            maximumCoverValue: pricingConfig.limits.maximumCoverValue,
            maximumCoverType: pricingConfig.limits.maximumCoverType,
            minimumPremiumValue: pricingConfig.limits.minimumPremiumValue,
            minimumPremiumType: pricingConfig.limits.minimumPremiumType,
            brokerCommissionPercent: pricingConfig.limits.brokerCommissionPercent,
            brokerCommissionType: 'percentage',
            maxBrokerCommissionPercent: pricingConfig.limits.maxBrokerCommissionPercent,
            maxBrokerCommissionType: 'percentage',
            minBrokerCommissionPercent: pricingConfig.limits.minBrokerCommissionPercent,
            minBrokerCommissionType: 'percentage',
          },
          policyDeductibles: [],
        });
        toast.success('Configuration Saved', {
          description: 'Policy limits & policyDeductibles have been saved successfully.',
        });
      } else if (activePricingTab === 'fee-types') {
        await saveFeeTypes(
          productId,
          pricingConfig.feeTypes.map((f) => ({
            id: typeof f.id === 'string' ? f.id : undefined,
            label: f.label,
            adjustmentType:
              f.pricingType === 'percentage'
                ? 'PERCENTAGE'
                : f.pricingType === 'factor'
                  ? 'FACTOR'
                  : 'FIXED',
            adjustmentValue: Number(f.value),
            status: f.status === 'active' ? 'ACTIVE' : 'INACTIVE',
          })),
        );
        toast.success('Configuration Saved', {
          description: 'Fee types have been saved successfully.',
        });
      } else if (activePricingTab.startsWith('risk-categorisation-')) {
        const currentCategoryId =
          activePricingTab.replace('risk-categorisation-', '') || activeRiskCategoryId;
        const rowsToSave = pricingConfig.riskCategorisations.filter(
          (row) => row.riskCategoryId === currentCategoryId,
        );

        if (rowsToSave.length === 0) {
          toast.success('Configuration Saved', {
            description: 'No risk categorisation rows to save.',
          });
          return;
        }

        await saveRiskCategorisations(
          productId,
          rowsToSave.map((row) => {
            const payload: RiskCategorisationPayload = {
              ...(isPersistedRiskRowId(row.id) ? { id: row.id } : {}),
              riskCategoryId: row.riskCategoryId,
              riskLevelId: row.riskLevelId,
              adjustmentType:
                row.adjustmentType === 'percentage'
                  ? 'PERCENTAGE'
                  : row.adjustmentType === 'factor'
                    ? 'FACTOR'
                    : 'FIXED',
              adjustmentValue: Number(row.adjustmentValue) || 0,
              quoteAction: row.quoteAction,
            };

            return payload;
          }),
        );

        const selectedCategory = riskCategories.find(
          (category) => category.id === currentCategoryId,
        );
        if (selectedCategory) {
          const refreshedRows = await getRiskCategorisationByRiskCategory(
            productId,
            currentCategoryId,
          );
          const refreshedCategoryRows = mapPricingRowsForCategory(refreshedRows, selectedCategory);
          setPricingConfig((prev) => ({
            ...prev,
            riskCategorisations: [
              ...prev.riskCategorisations.filter((row) => row.riskCategoryId !== currentCategoryId),
              ...refreshedCategoryRows,
            ],
          }));
        }
        toast.success('Configuration Saved', {
          description: 'Risk categorisation rows have been saved successfully.',
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Error', {
        description: 'Failed to save configuration. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addCoverRequirementEntry = (category: string) => {
    const existingEntries =
      pricingConfig.coverRequirements[category as keyof typeof pricingConfig.coverRequirements] ||
      [];
    const newId = Date.now();

    const newEntry =
      category === 'subLimits'
        ? { id: newId, title: '', description: '', value: '0', pricingType: 'fixed' }
        : { id: newId, value: '0', quoteAction: 'quote', discount: '0' };

    setPricingConfig((prev) => ({
      ...prev,
      coverRequirements: {
        ...prev.coverRequirements,
        [category]: [...existingEntries, newEntry],
      },
    }));
  };

  const updateCoverRequirementEntry = (
    category: string,
    id: string | number,
    field: string,
    value: string | number,
  ) => {
    setPricingConfig((prev) => ({
      ...prev,
      coverRequirements: {
        ...prev.coverRequirements,
        [category]: (
          prev.coverRequirements[category as keyof typeof prev.coverRequirements] || []
        ).map((entry) =>
          (entry as { id: string | number }).id === id ? { ...entry, [field]: value } : entry,
        ),
      },
    }));
  };

  const removeCoverRequirementEntry = (category: string, id: string | number) => {
    setPricingConfig((prev) => ({
      ...prev,
      coverRequirements: {
        ...prev.coverRequirements,
        [category]: (
          prev.coverRequirements[category as keyof typeof prev.coverRequirements] || []
        ).filter((entry) => (entry as { id: string | number }).id !== id),
      },
    }));
  };

  const updateLimits = (key: string, value: number | string) => {
    setPricingConfig((prev) => ({
      ...prev,
      limits: { ...prev.limits, [key]: value },
    }));
  };

  // Fee Types helper functions
  const addFeeTypeEntry = () => {
    setPricingConfig((prev) => ({
      ...prev,
      feeTypes: [
        ...prev.feeTypes,
        {
          id: Date.now(),
          label: '',
          pricingType: 'percentage',
          value: '0',
          status: 'active',
          isEditable: true,
          isNew: true,
        },
      ],
    }));
  };

  const updateFeeTypeEntry = (
    id: string | number,
    field: string,
    value: string | number | boolean,
  ) => {
    setPricingConfig((prev) => ({
      ...prev,
      feeTypes: prev.feeTypes.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    }));
  };

  const removeFeeTypeEntry = (id: string | number) => {
    setPricingConfig((prev) => {
      // Keep at least one row; if it's the only row, deletion is disabled.
      if (prev.feeTypes.length <= 1) return prev;
      return {
        ...prev,
        feeTypes: prev.feeTypes.filter((entry) => entry.id !== id),
      };
    });
  };

  const updateRiskCategorisationEntry = (
    id: string | number,
    field: keyof RiskCategorisationRow,
    value: string,
  ) => {
    setPricingConfig((prev) => ({
      ...prev,
      riskCategorisations: prev.riskCategorisations.map((entry) => {
        if (entry.id !== id) return entry;
        return { ...entry, [field]: value };
      }),
    }));
  };

  /** When switching a free-range row's adjustmentType to percentage, reset value if > 100 */
  const updateFreeRowAdjustmentType = (
    ratingParameterId: string,
    rowId: number | string,
    newType: 'percentage' | 'fixed' | 'factor',
  ) => {
    setRatingFreeConfigs((prev:any) => {
      const rows = prev[ratingParameterId] || [];
      const updated = rows.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          adjustmentType: newType,
          adjustmentValue:
            newType === 'percentage' && Number(r.adjustmentValue) > 100 ? 0 : r.adjustmentValue,
        };
      });
      return { ...prev, [ratingParameterId]: updated };
    });
  };

  const allGroupedParams = React.useMemo(
    () => [
      ...(groupedParams?.base || []),
      ...(groupedParams?.factor || []),
      ...(groupedParams?.premiumLimit || []),
    ],
    [groupedParams?.base, groupedParams?.factor, groupedParams?.premiumLimit],
  );

  const combinationParams = React.useMemo(
    () =>
      allGroupedParams.filter((p) => String(p.parameterType || '').toUpperCase() === 'COMBINATION'),
    [allGroupedParams],
  );

  const getChildParameterMeta = (ratingParameterId: string): GroupedParameterMeta | null => {
    return allGroupedParams.find((p) => p.ratingParameterId === ratingParameterId) || null;
  };

  const getParameterMetaByFieldId = useCallback(
    (fieldId: string) =>
      allGroupedParams.find((param) => String(param.formFieldId || '') === String(fieldId)) || null,
    [allGroupedParams],
  );

  const getCombinationEntry = (ratingParameterId: string) =>
    combinationConfig?.combinations?.find(
      (entry) => entry.ratingParameterId === ratingParameterId,
    ) || null;

  const getCombinationChildren = (ratingParameterId: string): CombinationChildConfigMeta[] => {
    const entry = getCombinationEntry(ratingParameterId);
    if (!entry) return [];

    const dependencyOrderByKey = new Map<string, number>();
    (entry.dependencyMappings || []).forEach((mapping) => {
      const dependencyKey = String(
        mapping.childDefinitionId || mapping.ratingParameterId || '',
      ).trim();
      if (!dependencyKey) return;
      dependencyOrderByKey.set(dependencyKey, mapping.dependencyOrder ?? Number.MAX_SAFE_INTEGER);
    });

    const items = entry.childParameters?.length
      ? entry.childParameters
      : entry?.combinationItems?.length
        ? entry.combinationItems
        : [];

    return [...items]
      .filter((item): item is CombinationChildConfigMeta => Boolean(item))
      .sort((a, b) => {
        const orderA =
          a.dependencyOrder ??
          dependencyOrderByKey.get(String(a.definitionId || a.ratingParameterId || '').trim()) ??
          Number.MAX_SAFE_INTEGER;
        const orderB =
          b.dependencyOrder ??
          dependencyOrderByKey.get(String(b.definitionId || b.ratingParameterId || '').trim()) ??
          Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });
  };

  const getCombinationChildKey = (child: CombinationChildMeta | null): string =>
    String(child?.definitionId || child?.ratingParameterId || child?.formFieldId || '').trim();

  const getCombinationChildIdentifiers = (child: CombinationChildMeta | null) => {
    if (!child) {
      return {
        childDefinitionId: undefined,
        childRatingParameterId: undefined,
      };
    }

    return {
      childDefinitionId: String(child.definitionId || '').trim() || undefined,
      childRatingParameterId: String(child.ratingParameterId || '').trim() || undefined,
    };
  };

  const getCombinationChildIds = (ratingParameterId: string) => {
    const entry = getCombinationEntry(ratingParameterId);
    const childIdsFromConfig = getCombinationChildren(ratingParameterId)
      .map((child) => getCombinationChildKey(child))
      .filter(Boolean);

    if (childIdsFromConfig.length > 0) return childIdsFromConfig;

    const fromGrouped = allGroupedParams.find((p) => p.ratingParameterId === ratingParameterId);
    return (
      entry?.combinationParameterIds ||
      (fromGrouped as { combinationParameterIds?: string[] } | undefined)
        ?.combinationParameterIds ||
      []
    ).filter(Boolean);
  };

  const getCombinationChildMeta = (
    ratingParameterId: string,
    childKey: string,
  ): CombinationChildMeta => {
    const normalizedChildKey = String(childKey || '').trim();
    if (!normalizedChildKey) return null;

    const childFromCombination =
      getCombinationChildren(ratingParameterId).find((child) => {
        const definitionId = String(child.definitionId || '').trim();
        const childRatingParameterId = String(child.ratingParameterId || '').trim();
        const formFieldId = String(child.formFieldId || '').trim();
        return (
          definitionId === normalizedChildKey ||
          childRatingParameterId === normalizedChildKey ||
          formFieldId === normalizedChildKey
        );
      }) || null;

    if (childFromCombination) return childFromCombination;

    return (
      getChildParameterMeta(normalizedChildKey) ||
      getChildParameterMeta(
        String(
          getCombinationChildren(ratingParameterId).find(
            (child) => String(child.definitionId || '').trim() === normalizedChildKey,
          )?.ratingParameterId || '',
        ),
      )
    );
  };

  const matchesCombinationRowValue = (
    value: CombinationRowValueState,
    childKey: string,
    ids?: { childDefinitionId?: string; childRatingParameterId?: string },
  ) =>
    value.childDefinitionId === childKey ||
    value.childRatingParameterId === childKey ||
    (Boolean(ids?.childDefinitionId) && value.childDefinitionId === ids?.childDefinitionId) ||
    (Boolean(ids?.childRatingParameterId) &&
      value.childRatingParameterId === ids?.childRatingParameterId);

  const getCombinationChildLabel = (child: CombinationChildMeta, fallback = '') => {
    if (!child) return fallback;
    if ('label' in child && child.label) return String(child.label);
    if ('fieldLabel' in child && child.fieldLabel) return String(child.fieldLabel);
    if ('fieldName' in child && child.fieldName) return String(child.fieldName);
    if ('formFieldId' in child && child.formFieldId) return String(child.formFieldId);
    return fallback;
  };

  const isCombinationChildDropdown = (child: CombinationChildMeta | null) =>
    Array.isArray(child?.options) && child.options.length > 0;

  const isCombinationChildCoverSelection = (child: CombinationChildMeta | null) => {
    if (!child) return false;
    // Check if the child has optionsSourceMode property (only CombinationChildConfigMeta has it)
    const configChild = child as CombinationChildConfigMeta;
    return configChild.optionsSourceMode === 'coverSelection';
  };

  const getCombinationChildFieldDescriptor = (child: CombinationChildMeta | null) => {
    const tableName = String(
      (child && 'tableName' in child ? child.tableName : '') ||
        (child && 'masterDataTable' in child ? child.masterDataTable : '') ||
        '',
    ).trim();
    return tableName;
  };

  const getParameterTypeLabel = (param: {
    parameterType?: string | null;
    derivedType?: string | null;
  }) => {
    const derivedType = String(
      (param as { derivedType?: string | null }).derivedType || '',
    ).toUpperCase();
    if (derivedType && derivedType !== 'NONE') return 'Derived';
    const type = String(param.parameterType || '').toUpperCase();
    if (!type || type === 'FORM_FIELD') return 'Form Field';
    if (type === 'MATRIX') return 'Matrix';
    if (type === 'COMBINATION') return 'Combination';
    if (type === 'REFERENCE') return 'Reference';
    if (type === 'DERIVED') return 'Derived';
    return type;
  };

  const groupedParamLabels = React.useMemo(() => {
    const set = new Set<string>();
    allGroupedParams.forEach((p) => {
      const label = String(p.fieldLabel || p.fieldName || '').trim();
      if (label) set.add(label);
    });
    return set;
  }, [allGroupedParams]);

  const formatCombinationChildLabel = (rawLabel: string): string => {
    const label = String(rawLabel || '').trim();
    if (!label) return label;
    const parts = label
      .split(':')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 2 && groupedParamLabels.has(parts[1])) {
      return parts[0];
    }
    return label;
  };

  const getCombinationDisplayName = (
    param: { fieldLabel: string; ratingParameterId?: string } & {
      name?: string | null;
    },
  ) => {
    const childIds = param.ratingParameterId
      ? getCombinationChildIds(param.ratingParameterId)
      : ((param as { combinationParameterIds?: string[] }).combinationParameterIds || []).filter(
          Boolean,
        );
    if (!childIds.length) {
      return param.fieldLabel;
    }
    const labels = childIds.map((childId) => {
      const childMeta = getCombinationChildMeta(String(param.ratingParameterId || ''), childId);
      return formatCombinationChildLabel(getCombinationChildLabel(childMeta, childId));
    });
    return labels.join(' x ');
  };

  const addCombinationRow = (ratingParameterId: string) => {
    const childIds = getCombinationChildIds(ratingParameterId);
    if (childIds.length < 2) {
      toast.error('Invalid Combination', {
        description: 'Combination parameter does not have valid child parameters.',
      });
      return;
    }

    setCombinationRowsByParameter((prev) => {
      const existing = prev[ratingParameterId] || [];
      const row: CombinationRowState = {
        rowOrder: existing.length,
        loading: 0,
        adjustmentType: 'PERCENTAGE',
        quoteAction: 'quote',
        values: childIds.map((childId) => {
          const childMeta = getCombinationChildMeta(ratingParameterId, childId);
          const ids = getCombinationChildIdentifiers(childMeta);
          const isDropdown = isCombinationChildDropdown(childMeta);
          const isCoverSelection = isCombinationChildCoverSelection(childMeta);
          return {
            childDefinitionId: ids.childDefinitionId,
            childRatingParameterId: ids.childRatingParameterId || childId,
            valueType: isDropdown ? 'DROPDOWN' : 'NUMBER_RANGE',
            masterValueId: isDropdown && !isCoverSelection ? '' : '',
            coverId: isDropdown && isCoverSelection ? '' : '',
            rangeFrom: 0,
            rangeTo: 0,
          };
        }),
      };
      return {
        ...prev,
        [ratingParameterId]: [...existing, row],
      };
    });
  };

  const removeCombinationRow = (ratingParameterId: string, rowIndex: number) => {
    setCombinationRowsByParameter((prev) => {
      const existing = prev[ratingParameterId] || [];
      const next = existing
        .filter((_, idx) => idx !== rowIndex)
        .map((row, idx) => ({ ...row, rowOrder: idx }));
      return {
        ...prev,
        [ratingParameterId]: next,
      };
    });
  };

  const saveCombinationConfig = async (targetRatingParameterId?: string) => {
    if (!combinationConfig?.ratingConfigId) {
      toast.error('Save Failed', { description: 'Rating config is missing.' });
      return;
    }
    const resolvedTargetRatingParameterId =
      targetRatingParameterId ||
      (activePricingTab.startsWith('grp-combination-')
        ? activePricingTab.replace('grp-combination-', '')
        : '');
    if (!resolvedTargetRatingParameterId) {
      toast.error('Save Failed', {
        description: 'Could not determine which combination parameter to save.',
      });
      return;
    }
    setIsSaving(true);
    try {
      const validationErrors: string[] = [];
      const targetParam = (combinationConfig.combinations || []).find(
        (param) => param.ratingParameterId === resolvedTargetRatingParameterId,
      );
      if (!targetParam) {
        toast.error('Save Failed', {
          description: 'Selected combination parameter was not found.',
        });
        return;
      }
      const combinations = [targetParam].map((param) => {
        const childParams = param.childParameters || param.combinationItems || [];
        const rows = (combinationRowsByParameter[param.ratingParameterId] || []).map((row, idx) => {
          const values: CombinationRuleRowPayload['values'] = row.values.map((value) => {
            // Check if this child is a cover selection field by looking up metadata
            const childParam =
              childParams.find((c) => c.definitionId === value.childDefinitionId) ||
              childParams.find((c) => c.ratingParameterId === value.childRatingParameterId) ||
              null;
            const isCoverSelection = childParam?.optionsSourceMode === 'coverSelection';
            const masterValueId = String(value.masterValueId || '').trim();
            const coverId = String(value.coverId || '').trim();

            const dropdownPayload =
              value.valueType === 'DROPDOWN'
                ? isCoverSelection
                  ? {
                      masterValueId: undefined,
                      coverId: coverId || masterValueId || undefined,
                    }
                  : {
                      masterValueId: masterValueId || undefined,
                      coverId: coverId || undefined,
                    }
                : {
                    masterValueId: undefined,
                    coverId: undefined,
                  };

            if (value.valueType === 'DROPDOWN') {
              const hasAnyDropdownValue = Boolean(
                dropdownPayload.masterValueId || dropdownPayload.coverId,
              );
              if (!hasAnyDropdownValue) {
                const label = String(
                  childParam?.label ||
                    value.childDefinitionId ||
                    value.childRatingParameterId ||
                    'Unknown child',
                );
                validationErrors.push(
                  `${param.name || param.labelName || param.ratingParameterId} - Row ${idx + 1} - ${label}: please select a dropdown value`,
                );
              }
            }

            return {
              childDefinitionId: value.childDefinitionId || undefined,
              childRatingParameterId: value.childRatingParameterId || undefined,
              valueType: value.valueType,
              masterValueId: dropdownPayload.masterValueId,
              coverId: dropdownPayload.coverId,
              rangeFrom:
                value.valueType === 'NUMBER_RANGE' ? Number(value.rangeFrom ?? 0) : undefined,
              rangeTo: value.valueType === 'NUMBER_RANGE' ? Number(value.rangeTo ?? 0) : undefined,
            };
          });
          return {
            id: row.id,
            rowOrder: idx,
            loading: Number(row.loading || 0),
            adjustmentType: row.adjustmentType || 'PERCENTAGE',
            quoteAction: row.quoteAction || 'quote',
            values,
          };
        });
        return {
          ratingParameterId: param.ratingParameterId,
          rows,
        };
      });
      if (validationErrors.length) {
        toast.error('Save Failed', {
          description: validationErrors[0],
        });
        return;
      }
      await saveCombinationRatingValues(productId, {
        ratingConfigId: combinationConfig.ratingConfigId,
        combinations,
      });
      toast.success('Saved', { description: 'Combination parameters updated successfully.' });
      await load();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save combination settings';
      toast.error('Save Failed', { description: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const updateCombinationScrollState = useCallback((ratingParameterId: string) => {
    const el = combinationTableScrollRefs.current[ratingParameterId];
    if (!el) return;
    const maxLeft = Math.max(0, el.scrollWidth - el.clientWidth);
    const epsilon = 1;
    const canScrollLeft = el.scrollLeft > epsilon;
    const canScrollRight = maxLeft - el.scrollLeft > epsilon;
    setCombinationScrollState((prev) => {
      const current = prev[ratingParameterId];
      if (
        current &&
        current.canScrollLeft === canScrollLeft &&
        current.canScrollRight === canScrollRight
      ) {
        return prev;
      }
      return {
        ...prev,
        [ratingParameterId]: { canScrollLeft, canScrollRight },
      };
    });
  }, []);

  const scrollCombinationTable = useCallback(
    (ratingParameterId: string, direction: 'left' | 'right') => {
      const el = combinationTableScrollRefs.current[ratingParameterId];
      if (!el) return;
      el.scrollBy({
        left: direction === 'left' ? -320 : 320,
        behavior: 'smooth',
      });
      requestAnimationFrame(() => updateCombinationScrollState(ratingParameterId));
      window.setTimeout(() => updateCombinationScrollState(ratingParameterId), 180);
    },
    [updateCombinationScrollState],
  );

  useEffect(() => {
    if (!activePricingTab.startsWith('grp-combination-')) return;
    const ratingParameterId = activePricingTab.replace('grp-combination-', '');
    const run = () => {
      updateCombinationScrollState(ratingParameterId);
    };
    run();
    window.addEventListener('resize', run);
    return () => window.removeEventListener('resize', run);
  }, [activePricingTab, combinationRowsByParameter, updateCombinationScrollState]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 shrink-0">
              <Calculator className="w-5 h-5" />
              Pricing Configurator
            </CardTitle>
            <CardDescription>Configure rating algorithms and pricing factors</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6 h-[calc(100vh-16rem)] overflow-scroll custom-scrollbars">
          {/* Sidebar Navigation */}
          <div className="w-80 bg-muted/30 rounded-lg p-4 overflow-y-scroll custom-scrollbars">
            {/* <h3 className="font-semibold text-foreground mb-4">Pricing Configuration</h3> */}
            <div className="space-y-4">
              {(() => {
                const base = groupedParams?.base || [];
                const premiumLimit = groupedParams?.premiumLimit || [];
                const factor = groupedParams?.factor || [];

                const hasBase = base.length > 0;
                const hasPremiumLimit = premiumLimit.length > 0;
                const hasFactor = factor.length > 0;

                return (
                  <>
                    {hasBase && (
                      <div className="space-y-2">
                        <div className="px-1 text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wide">
                          Base Parameters
                        </div>
                        {base
                          .slice()
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .map((p) => {
                            const isActive =
                              activeTab?.category === 'base' &&
                              activeTab?.ratingParameterId === p.ratingParameterId;
                            return (
                              <button
                                key={`base:${p.ratingParameterId}`}
                                onClick={() => {
                                  setActiveTab({
                                    category: 'base',
                                    ratingParameterId: p.ratingParameterId,
                                  });
                                  setActivePricingTab(getRatingParameterTabId('base', p));
                                }}
                                className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between ${
                                  isActive
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'hover:bg-muted/50 text-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <Calculator className="w-4 h-4" />
                                  <div className="min-w-0">
                                    <div className="font-medium text-sm truncate">
                                      {p.fieldLabel}
                                    </div>
                                    <div
                                      className={`text-[10px] ${
                                        isActive
                                          ? 'text-primary-foreground/80'
                                          : 'text-muted-foreground'
                                      }`}
                                    >
                                      {getParameterTypeLabel(p)}
                                    </div>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </button>
                            );
                          })}
                      </div>
                    )}

                    {hasPremiumLimit && (
                      <div
                        className={`space-y-2 ${hasBase ? 'pt-2 border-t border-border/50' : ''}`}
                      >
                        <div className="px-1 text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wide">
                          Premium Limit
                        </div>
                        {premiumLimit
                          .slice()
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .map((p) => {
                            const isActive =
                              activeTab?.category === 'premiumLimit' &&
                              activeTab?.ratingParameterId === p.ratingParameterId;
                            return (
                              <button
                                key={`premiumLimit:${p.ratingParameterId}`}
                                onClick={() => {
                                  setActiveTab({
                                    category: 'premiumLimit',
                                    ratingParameterId: p.ratingParameterId,
                                  });
                                  setActivePricingTab(getRatingParameterTabId('premiumLimit', p));
                                }}
                                className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between ${
                                  isActive
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'hover:bg-muted/50 text-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <Calculator className="w-4 h-4" />
                                  <div className="min-w-0">
                                    <div className="font-medium text-sm truncate">
                                      {p.fieldLabel}
                                    </div>
                                    <div
                                      className={`text-[10px] ${
                                        isActive
                                          ? 'text-primary-foreground/80'
                                          : 'text-muted-foreground'
                                      }`}
                                    >
                                      {getParameterTypeLabel(p)}
                                    </div>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </button>
                            );
                          })}
                      </div>
                    )}

                    {hasFactor && (
                      <div
                        className={`space-y-2 ${
                          hasBase || hasPremiumLimit ? 'pt-2 border-t border-border/50' : ''
                        }`}
                      >
                        <div className="px-1 text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wide">
                          Loading/Discount Factors
                        </div>
                        {factor
                          .slice()
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .map((p) => {
                            const isActive =
                              activeTab?.category === 'factor' &&
                              activeTab?.ratingParameterId === p.ratingParameterId;
                            return (
                              <button
                                key={`factor:${p.ratingParameterId}`}
                                onClick={() => {
                                  setActiveTab({
                                    category: 'factor',
                                    ratingParameterId: p.ratingParameterId,
                                  });
                                  setActivePricingTab(getRatingParameterTabId('factor', p));
                                }}
                                className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between ${
                                  isActive
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'hover:bg-muted/50 text-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <Calculator className="w-4 h-4" />
                                  <div className="min-w-0">
                                    <div className="font-medium text-sm truncate">
                                      {p.fieldLabel}
                                    </div>
                                    <div
                                      className={`text-[10px] ${
                                        isActive
                                          ? 'text-primary-foreground/80'
                                          : 'text-muted-foreground'
                                      }`}
                                    >
                                      {getParameterTypeLabel(p)}
                                    </div>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </>
                );
              })()}

              {generalPricingTabs.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  {generalPricingTabs.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveTab(null);
                        setActivePricingTab(p.id);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between ${
                        activePricingTab === p.id
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Calculator className="w-4 h-4" />
                        <span className="font-medium text-sm">{p.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}

              {commissionTabs.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="px-1 text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wide">
                    Commission
                  </div>
                  {commissionTabs.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveTab(null);
                        setActivePricingTab(p.id);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between ${
                        activePricingTab === p.id
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Calculator className="w-4 h-4" />
                        <span className="font-medium text-sm">{p.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}

              {feeTabs.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="px-1 text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wide">
                    Fees
                  </div>
                  {feeTabs.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveTab(null);
                        setActivePricingTab(p.id);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between ${
                        activePricingTab === p.id
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Calculator className="w-4 h-4" />
                        <span className="font-medium text-sm">{p.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}

              {riskCategories.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="px-1 text-[11px] font-semibold text-muted-foreground/80 uppercase tracking-wide">
                    Risk Categorisation
                  </div>
                  {riskCategories.map((category) => {
                    const tabId = `risk-categorisation-${category.id}`;
                    return (
                      <button
                        key={tabId}
                        onClick={() => {
                          setActiveTab(null);
                          setActiveRiskCategoryId(category.id);
                          setActivePricingTab(tabId);
                        }}
                        className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between ${
                          activePricingTab === tabId
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'hover:bg-muted/50 text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Calculator className="w-4 h-4" />
                          <span className="font-medium text-sm">{category.name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-scroll custom-scrollbars">
            {activePricingTab === 'grp-base-all' && groupedParams && (
              <div className="space-y-6">
                {(() => {
                  const data = (groupedParams?.base || []).slice().sort((a, b) => {
                    const ao = Array.isArray(a.options) && a.options.length > 0 ? 0 : 1;
                    const bo = Array.isArray(b.options) && b.options.length > 0 ? 0 : 1;
                    if (ao !== bo) return ao - bo;
                    return a.displayOrder - b.displayOrder;
                  });
                  return (
                    <Card className="h-full">
                      <CardHeader>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <CardTitle className="text-base">Base Rate Parameters</CardTitle>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExport('base')}
                              disabled={!!isExporting}
                            >
                              {isExporting === 'base' ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Upload className="w-4 h-4 mr-2" />
                              )}
                              Export
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleImportClick('base')}
                              disabled={!!isImporting}
                            >
                              {isImporting === 'base' ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Download className="w-4 h-4 mr-2" />
                              )}
                              Import
                            </Button>
                            <Button
                              onClick={() => handleSaveCategory('base')}
                              size="sm"
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              Save Base Parameters
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {data.map((param) => {
                            const pAny = param;
                            if (
                              param.fieldType?.toLowerCase().includes('combination') ||
                              param.fieldType === 'combination'
                            ) {
                              return (
                                <CombinationFieldCard
                                  key={`comb-${param.ratingParameterId}`}
                                  param={param}
                                  subFields={pAny.subFields || []}
                                  ratingSelections={ratingSelections}
                                  setRatingSelections={setRatingSelections}
                                  ratingFreeConfigs={ratingFreeConfigs}
                                  setRatingFreeConfigs={setRatingFreeConfigs}
                                  handleRemoveRow={handleRemoveRow}
                                  onSave={() => handleSaveCategory('base')}
                                  isSaving={isSaving}
                                  onExport={handleExport}
                                  onImportClick={handleImportClick}
                                  isExporting={isExporting}
                                  isImporting={isImporting}
                                  category="base"
                                  ratingParameterId={param.ratingParameterId}
                                />
                              );
                            }

                            const hasOptions =
                              Array.isArray(param.options) && param.options.length > 0;
                            return hasOptions ? (
                              <Card key={`md-${param.ratingParameterId}`}>
                                <CardHeader>
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <CardTitle>{param.fieldLabel}</CardTitle>
                                      <CardDescription>
                                        Configure rates for different {param.fieldLabel} types
                                      </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleExport('base', param.ratingParameterId)
                                        }
                                        disabled={!!isExporting}
                                      >
                                        {isExporting ===
                                        getImportExportKey('base', param.ratingParameterId) ? (
                                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                          <Upload className="w-4 h-4 mr-2" />
                                        )}
                                        Export
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleImportClick('base', param.ratingParameterId)
                                        }
                                        disabled={!!isImporting}
                                      >
                                        {isImporting ===
                                        getImportExportKey('base', param.ratingParameterId) ? (
                                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                          <Download className="w-4 h-4 mr-2" />
                                        )}
                                        Import
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <Table className={EQUAL_TABLE_CLASS}>
                                    <TableHeader>
                                      <TableRow className="bg-muted/10">
                                        <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Option
                                        </TableHead>
                                        <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Pricing Type
                                        </TableHead>
                                        <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Base Rate
                                        </TableHead>
                                        <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Quote Option
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {(param.options || [])
                                        .slice()
                                        .sort((a, b) => a.sortOrder - b.sortOrder)
                                        .map((opt) => {
                                          const current = ratingSelections[
                                            param.ratingParameterId
                                          ]?.[opt.value] || {
                                            adjustmentType: 'percentage',
                                            adjustmentValue: 0,
                                            quoteAction: 'quote' as const,
                                          };
                                          return (
                                            <TableRow key={opt.value} className="hover:bg-muted/5">
                                              <TableCell
                                                className={`${FOUR_COLUMN_CELL_CLASS} font-medium`}
                                              >
                                                {formatIfNumber(opt.label)}
                                              </TableCell>
                                              <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                                <Select
                                                  value={current.adjustmentType}
                                                  onValueChange={(v) =>
                                                    setRatingSelections((prev) => {
                                                      const formCfg: Record<string, OptionConfig> =
                                                        prev[param.ratingParameterId] ||
                                                        ({} as Record<string, OptionConfig>);
                                                      const row = formCfg[opt.value] || current;
                                                      return {
                                                        ...prev,
                                                        [param.ratingParameterId]: {
                                                          ...formCfg,
                                                          [opt.value]: {
                                                            ...row,
                                                            adjustmentType: v as
                                                              | 'percentage'
                                                              | 'fixed',
                                                          },
                                                        },
                                                      };
                                                    })
                                                  }
                                                >
                                                  <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent className="z-50 bg-popover border border-border shadow-md">
                                                    <SelectItem value="percentage">
                                                      Percentage
                                                    </SelectItem>
                                                    <SelectItem value="fixed">
                                                      Fixed Amount
                                                    </SelectItem>
                                                    <SelectItem value="factor">Factor</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                                <FormattedNumberInput
                                                  min={0}
                                                  max={current.adjustmentType === 'percentage' ? 100 : undefined}
                                                  allowDecimals={true}
                                                  maxDecimals={current.adjustmentType === 'percentage' ? 2 : undefined}
                                                  value={current.adjustmentValue}
                                                  onChange={(val) =>
                                                    setRatingSelections((prev) => {
                                                      const formCfg: Record<string, OptionConfig> =
                                                        prev[param.ratingParameterId] ||
                                                        ({} as Record<string, OptionConfig>);
                                                      const row = formCfg[opt.value] || current;
                                                      return {
                                                        ...prev,
                                                        [param.ratingParameterId]: {
                                                          ...formCfg,
                                                          [opt.value]: {
                                                            ...row,
                                                            adjustmentValue: val,
                                                          },
                                                        },
                                                      };
                                                    })
                                                  }
                                                  className="w-full font-mono"
                                                  placeholder="0.00"
                                                />
                                              </TableCell>
                                              <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                                <Select
                                                  value={current.quoteAction}
                                                  onValueChange={(v) =>
                                                    setRatingSelections((prev) => {
                                                      const formCfg: Record<string, OptionConfig> =
                                                        prev[param.ratingParameterId] ||
                                                        ({} as Record<string, OptionConfig>);
                                                      const row = formCfg[opt.value] || current;
                                                      return {
                                                        ...prev,
                                                        [param.ratingParameterId]: {
                                                          ...formCfg,
                                                          [opt.value]: {
                                                            ...row,
                                                            quoteAction: v as
                                                              | 'quote'
                                                              | 'no_quote'
                                                              | 'referral',
                                                          },
                                                        },
                                                      };
                                                    })
                                                  }
                                                >
                                                  <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent className="z-50 bg-popover border border-border shadow-md">
                                                    <SelectItem value="quote">
                                                      <div className="flex items-center gap-2 shrink-0">
                                                        <div
                                                          className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                            'quote',
                                                          )}`}
                                                        ></div>
                                                        Auto Quote
                                                      </div>
                                                    </SelectItem>
                                                    <SelectItem value="no_quote">
                                                      <div className="flex items-center gap-2 shrink-0">
                                                        <div
                                                          className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                            'no_quote',
                                                          )}`}
                                                        ></div>
                                                        No Quote
                                                      </div>
                                                    </SelectItem>
                                                    <SelectItem value="referral">
                                                      <div className="flex items-center gap-2 shrink-0">
                                                        <div
                                                          className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                            'referral',
                                                          )}`}
                                                        ></div>
                                                        Referral
                                                      </div>
                                                    </SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>
                            ) : (
                              <Card key={`free-${param.ratingParameterId}`}>
                                <CardHeader>
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <CardTitle>{param.fieldLabel}</CardTitle>
                                      <CardDescription>
                                        Rate based on {param.fieldLabel} value ranges (Type:{' '}
                                        {param.fieldType})
                                      </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {/* <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleExport('base')}
                                        disabled={!!isExporting}
                                      >
                                        {isExporting === 'base' ? (
                                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                          <Upload className="w-4 h-4 mr-2" />
                                        )}
                                        Export
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleImportClick('base')}
                                        disabled={!!isImporting}
                                      >
                                        {isImporting === 'base' ? (
                                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                          <Download className="w-4 h-4 mr-2" />
                                        )}
                                        Import
                                      </Button> */}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          setRatingFreeConfigs((prev) => {
                                            const rows = prev[param.ratingParameterId] || [];
                                            const next = createNewFreeRow(rows);
                                            return {
                                              ...prev,
                                              [param.ratingParameterId]: [...rows, next],
                                            };
                                          })
                                        }
                                      >
                                        Add Row
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <Table className="min-w-max">
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className={RANGE_HEAD_SM_CLASS}>From</TableHead>
                                        <TableHead className={RANGE_HEAD_SM_CLASS}>To</TableHead>
                                        <TableHead className={RANGE_HEAD_MD_CLASS}>
                                          Adjustment Type
                                        </TableHead>
                                        <TableHead className={RANGE_HEAD_MD_CLASS}>
                                          Loading/Discount
                                        </TableHead>
                                        {/* <TableHead className={RANGE_HEAD_MD_CLASS}>
                                          Premium Adjustment Type
                                        </TableHead>
                                        <TableHead className={RANGE_HEAD_MD_CLASS}>
                                          Min Premium Value
                                        </TableHead>
                                        <TableHead className={RANGE_HEAD_MD_CLASS}>
                                          Max Premium Value
                                        </TableHead> */}
                                        <TableHead className={RANGE_HEAD_MD_CLASS}>
                                          Quote Action
                                        </TableHead>
                                        <TableHead className={ACTION_HEAD_CLASS}>Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {(ratingFreeConfigs[param.ratingParameterId] || []).map(
                                        (entry) => (
                                          <TableRow key={entry.id}>
                                            <TableCell>
                                              <FormattedNumberInput
                                                value={entry.rangeStart}
                                                step="1"
                                                min="0"
                                                onChange={(val) =>
                                                  setRatingFreeConfigs((prev) => {
                                                    const rows =
                                                      prev[param.ratingParameterId] || [];
                                                    const updated = rows.map((r) =>
                                                      r.id === entry.id
                                                        ? {
                                                            ...r,
                                                            rangeStart: val,
                                                          }
                                                        : r,
                                                    );
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: updated,
                                                    };
                                                  })
                                                }
                                                className="w-full"
                                              />
                                            </TableCell>
                                            <TableCell>
                                              <FormattedNumberInput
                                                value={entry.rangeEnd}
                                                step="1"
                                                min="0"
                                                onChange={(val) =>
                                                  setRatingFreeConfigs((prev) => {
                                                    const rows =
                                                      prev[param.ratingParameterId] || [];
                                                    const updated = rows.map((r) =>
                                                      r.id === entry.id
                                                        ? {
                                                            ...r,
                                                            rangeEnd: val,
                                                          }
                                                        : r,
                                                    );
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: updated,
                                                    };
                                                  })
                                                }
                                                className="w-full"
                                              />
                                            </TableCell>
                                            <TableCell>
                                              <Select
                                                value={entry.adjustmentType}
                                                onValueChange={(value) =>
                                                  updateFreeRowAdjustmentType(
                                                    param.ratingParameterId,
                                                    entry.id,
                                                    value as 'percentage' | 'fixed',
                                                  )
                                                }
                                              >
                                                <SelectTrigger className="w-full">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="percentage">
                                                    Percentage
                                                  </SelectItem>
                                                  <SelectItem value="fixed">
                                                    Fixed Amount
                                                  </SelectItem>
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
                                                  setRatingFreeConfigs((prev) => {
                                                    const rows =
                                                      prev[param.ratingParameterId] || [];
                                                    const updated = rows.map((r) =>
                                                      r.id === entry.id
                                                        ? {
                                                            ...r,
                                                            adjustmentValue: val,
                                                          }
                                                        : r,
                                                    );
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: updated,
                                                    };
                                                  })
                                                }
                                                className="w-full"
                                              />
                                            </TableCell>
                                            {/* <TableCell>
                                              <Select
                                                value={
                                                  entry.premiumAdjustmentType ??
                                                  entry.adjustmentType
                                                }
                                                onValueChange={(value) =>
                                                  setRatingFreeConfigs((prev) => {
                                                    const rows =
                                                      prev[param.ratingParameterId] || [];
                                                    const updated = rows.map((r) =>
                                                      r.id === entry.id
                                                        ? {
                                                            ...r,
                                                            premiumAdjustmentType: value as
                                                              | 'percentage'
                                                              | 'fixed',
                                                          }
                                                        : r,
                                                    );
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: updated,
                                                    };
                                                  })
                                                }
                                              >
                                                <SelectTrigger className="w-full">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="percentage">
                                                    Percentage
                                                  </SelectItem>
                                                  <SelectItem value="fixed">
                                                    Fixed Amount
                                                  </SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <FormattedNumberInput
                                                value={entry.minPremiumValue ?? 0}
                                                onChange={(val) =>
                                                  setRatingFreeConfigs((prev) => {
                                                    const rows =
                                                      prev[param.ratingParameterId] || [];
                                                    const updated = rows.map((r) =>
                                                      r.id === entry.id
                                                        ? {
                                                            ...r,
                                                            minPremiumValue: val,
                                                          }
                                                        : r,
                                                    );
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: updated,
                                                    };
                                                  })
                                                }
                                                className="w-full"
                                                placeholder="0.00"
                                              />
                                            </TableCell>
                                            <TableCell>
                                              <FormattedNumberInput
                                                value={entry.maxPremiumValue ?? 0}
                                                onChange={(val) =>
                                                  setRatingFreeConfigs((prev) => {
                                                    const rows =
                                                      prev[param.ratingParameterId] || [];
                                                    const updated = rows.map((r) =>
                                                      r.id === entry.id
                                                        ? {
                                                            ...r,
                                                            maxPremiumValue: val,
                                                          }
                                                        : r,
                                                    );
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: updated,
                                                    };
                                                  })
                                                }
                                                className="w-full"
                                                placeholder="0.00"
                                              />
                                            </TableCell> */}
                                            <TableCell>
                                              <Select
                                                value={entry.quoteAction}
                                                onValueChange={(value) =>
                                                  setRatingFreeConfigs((prev) => {
                                                    const rows =
                                                      prev[param.ratingParameterId] || [];
                                                    const updated = rows.map((r) =>
                                                      r.id === entry.id
                                                        ? {
                                                            ...r,
                                                            quoteAction: value as
                                                              | 'quote'
                                                              | 'no_quote'
                                                              | 'referral',
                                                          }
                                                        : r,
                                                    );
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: updated,
                                                    };
                                                  })
                                                }
                                              >
                                                <SelectTrigger className="w-full">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="quote">
                                                    <div className="flex items-center gap-2 shrink-0">
                                                      <div
                                                        className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                          'quote',
                                                        )}`}
                                                      ></div>
                                                      Auto Quote
                                                    </div>
                                                  </SelectItem>
                                                  <SelectItem value="no_quote">
                                                    <div className="flex items-center gap-2 shrink-0">
                                                      <div
                                                        className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                          'no_quote',
                                                        )}`}
                                                      ></div>
                                                      No Quote
                                                    </div>
                                                  </SelectItem>
                                                  <SelectItem value="referral">
                                                    <div className="flex items-center gap-2 shrink-0">
                                                      <div
                                                        className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                          'referral',
                                                        )}`}
                                                      ></div>
                                                      Referral
                                                    </div>
                                                  </SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  handleRemoveRow(param.ratingParameterId, entry.id)
                                                }
                                              >
                                                Remove
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ),
                                      )}
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>
            )}

            {activePricingTab.startsWith('grp-matrix-') &&
              matrixConfig &&
              (() => {
                const ratingParameterId = activePricingTab.replace('grp-matrix-', '');
                const activeMatrix =
                  matrixConfig.matrices.find((m) => m.ratingParameterId === ratingParameterId) ||
                  null;
                if (!activeMatrix) return null;
                const isPremiumLimitMatrix = !!groupedParams?.premiumLimit?.some(
                  (p) => p.ratingParameterId === ratingParameterId,
                );
                const cells = matrixCells[activeMatrix.ratingParameterId] || [];

                const axis = matrixAxisRanges[activeMatrix.ratingParameterId];
                const getEffectiveAxisType = (direction: 'x' | 'y'): 'MASTER' | 'RANGE' => {
                  const axisConfig = activeMatrix[direction];
                  const parameterMeta = getParameterMetaByFieldId(axisConfig.fieldId);
                  const hasOptions =
                    Array.isArray(parameterMeta?.options) && parameterMeta.options.length > 0;
                  if (hasOptions) return 'MASTER';

                  const hasRangeItems = (axisConfig.items || []).some(
                    (item) =>
                      typeof item.rangeStart === 'number' || typeof item.rangeEnd === 'number',
                  );
                  if (hasRangeItems) return 'RANGE';

                  const ruleTypes = new Set(
                    (activeMatrix.rules || []).map((rule) =>
                      direction === 'x' ? rule.xRuleType : rule.yRuleType,
                    ),
                  );
                  if (ruleTypes.has('MASTER')) return 'MASTER';
                  if (ruleTypes.has('RANGE')) return 'RANGE';

                  return axisConfig.type === 'MASTER' ? 'MASTER' : 'RANGE';
                };

                const xAxisType = getEffectiveAxisType('x');
                const yAxisType = getEffectiveAxisType('y');

                const getEffectiveAxisItems = (direction: 'x' | 'y'): MatrixAxisItem[] => {
                  const axisConfig = activeMatrix[direction];
                  const axisType = direction === 'x' ? xAxisType : yAxisType;

                  if (axisType === 'MASTER') {
                    const parameterMeta = getParameterMetaByFieldId(axisConfig.fieldId);
                    if (Array.isArray(parameterMeta?.options) && parameterMeta.options.length > 0) {
                      return parameterMeta.options
                        .slice()
                        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                        .map((option, index) => ({
                          id: option.masterValueId,
                          label: option.label,
                          code: option.value,
                          sortOrder: option.sortOrder ?? index + 1,
                          displayOrder: option.sortOrder ?? index + 1,
                        }));
                    }
                  }

                  const localAxis = axis?.[direction];
                  return localAxis && localAxis.length > 0 ? localAxis : axisConfig.items || [];
                };

                const xItems = getEffectiveAxisItems('x');
                const yItems = getEffectiveAxisItems('y');

                const getAxisLabel = (item: MatrixAxisItem, type: string) => {
                  if (type === 'MASTER') return item.label || item.code || '';
                  if (type === 'RANGE') {
                    const fmtRange = (v: number | undefined | null) =>
                      v != null ? v.toLocaleString('en-US') : '?';
                    return `${fmtRange(item.rangeStart)} - ${fmtRange(item.rangeEnd)}`;
                  }
                  return '';
                };

                const findCellFor = (xItem: MatrixAxisItem, yItem: MatrixAxisItem) => {
                  const xType = xAxisType;
                  const yType = yAxisType;
                  return cells.find((c) => {
                    if (c.xType !== xType || c.yType !== yType) return false;
                    const xIdMatch =
                      xType === 'MASTER'
                        ? c.xMasterValueId === xItem.id
                        : c.xRangeRuleId === xItem.id;
                    const yIdMatch =
                      yType === 'MASTER'
                        ? c.yMasterValueId === yItem.id
                        : c.yRangeRuleId === yItem.id;
                    return xIdMatch && yIdMatch;
                  });
                };

                const upsertCell = (
                  xItem: MatrixAxisItem,
                  yItem: MatrixAxisItem,
                  updater: (prev: MatrixCellPayload | null) => MatrixCellPayload,
                ) => {
                  setMatrixCells((prev) => {
                    const current = prev[activeMatrix.ratingParameterId] || [];
                    const xType = xAxisType;
                    const yType = yAxisType;
                    let foundIndex = -1;
                    for (let i = 0; i < current.length; i++) {
                      const c = current[i];
                      if (c.xType !== xType || c.yType !== yType) continue;
                      const xIdMatch =
                        xType === 'MASTER'
                          ? c.xMasterValueId === xItem.id
                          : c.xRangeRuleId === xItem.id;
                      const yIdMatch =
                        yType === 'MASTER'
                          ? c.yMasterValueId === yItem.id
                          : c.yRangeRuleId === yItem.id;
                      if (xIdMatch && yIdMatch) {
                        foundIndex = i;
                        break;
                      }
                    }

                    if (foundIndex >= 0) {
                      const updated = [...current];
                      updated[foundIndex] = updater(current[foundIndex]);
                      return {
                        ...prev,
                        [activeMatrix.ratingParameterId]: updated,
                      };
                    }

                    const base: MatrixCellPayload = {
                      xType,
                      yType,
                      adjustmentType: 'PERCENTAGE',
                      adjustmentValue: 0,
                      quoteAction: 'quote',
                    };
                    if (xType === 'MASTER') base.xMasterValueId = xItem.id;
                    else base.xRangeRuleId = xItem.id;
                    if (yType === 'MASTER') base.yMasterValueId = yItem.id;
                    else base.yRangeRuleId = yItem.id;

                    return {
                      ...prev,
                      [activeMatrix.ratingParameterId]: [...current, updater(base)],
                    };
                  });
                };

                const handleSaveMatrix = async () => {
                  if (!matrixConfig) return;
                  setIsSaving(true);
                  try {
                    const ratingConfigId = matrixConfig.ratingConfigId;
                    if (!ratingConfigId) {
                      toast.error('Error', {
                        description: 'Rating configuration not initialized for this product.',
                      });
                      return;
                    }
                    const localAxis = matrixAxisRanges[activeMatrix.ratingParameterId];
                    const rawX =
                      xAxisType === 'RANGE'
                        ? localAxis && localAxis.x && localAxis.x.length > 0
                          ? localAxis.x
                          : activeMatrix.x.items || []
                        : xItems;
                    const rawY =
                      yAxisType === 'RANGE'
                        ? localAxis && localAxis.y && localAxis.y.length > 0
                          ? localAxis.y
                          : activeMatrix.y.items || []
                        : yItems;

                    const xItemsToSave =
                      xAxisType === 'RANGE'
                        ? rawX.filter((r) => Number(r.rangeStart ?? 0) !== Number(r.rangeEnd ?? 0))
                        : rawX;
                    const yItemsToSave =
                      yAxisType === 'RANGE'
                        ? rawY.filter((r) => Number(r.rangeStart ?? 0) !== Number(r.rangeEnd ?? 0))
                        : rawY;

                    const hasInvalidX =
                      xAxisType === 'RANGE' &&
                      rawX.some((r) => Number(r.rangeStart ?? 0) === Number(r.rangeEnd ?? 0));
                    const hasInvalidY =
                      yAxisType === 'RANGE' &&
                      rawY.some((r) => Number(r.rangeStart ?? 0) === Number(r.rangeEnd ?? 0));
                    if (hasInvalidX || hasInvalidY) {
                      toast.error('Invalid range', {
                        description: 'From and To values cannot be the same. Please fix before saving.',
                      });
                      return;
                    }

                    // Validate overlaps - collect all conflict messages and show once
                    const overlapErrors: string[] = [];
                    if (xAxisType === 'RANGE') {
                      const normalizedX = xItemsToSave.map((r) => ({
                        ...r,
                        rangeStart: Number(r.rangeStart ?? 0),
                        rangeEnd: Number(r.rangeEnd ?? 0),
                      }));
                      if (normalizedX.length > 1 && hasRangeConflicts(normalizedX)) {
                        overlapErrors.push(activeMatrix.x.fieldLabel);
                      }
                    }
                    if (yAxisType === 'RANGE') {
                      const normalizedY = yItemsToSave.map((r) => ({
                        ...r,
                        rangeStart: Number(r.rangeStart ?? 0),
                        rangeEnd: Number(r.rangeEnd ?? 0),
                      }));
                      if (normalizedY.length > 1 && hasRangeConflicts(normalizedY)) {
                        overlapErrors.push(activeMatrix.y.fieldLabel);
                      }
                    }
                    if (overlapErrors.length > 0) {
                      toast.error('Invalid ranges', {
                        description: `Ranges for ${overlapErrors.join(' and ')} overlap. Please ensure ranges do not overlap.`,
                      });
                      return;
                    }

                    const payload = {
                      ratingConfigId,
                      matrices: [
                        {
                          ratingParameterId: activeMatrix.ratingParameterId,
                          xFieldId: activeMatrix.x.fieldId,
                          yFieldId: activeMatrix.y.fieldId,
                          xRanges:
                            xAxisType === 'RANGE'
                              ? (xItemsToSave || []).map((r, index) => ({
                                  id: r.id,
                                  rangeStart: r.rangeStart ?? 0,
                                  rangeEnd: r.rangeEnd ?? 0,
                                  displayOrder: r.displayOrder ?? index + 1,
                                }))
                              : undefined,
                          yRanges:
                            yAxisType === 'RANGE'
                              ? (yItemsToSave || []).map((r, index) => ({
                                  id: r.id,
                                  rangeStart: r.rangeStart ?? 0,
                                  rangeEnd: r.rangeEnd ?? 0,
                                  displayOrder: r.displayOrder ?? index + 1,
                                }))
                              : undefined,
                          cells: (matrixCells[activeMatrix.ratingParameterId] ||
                            []) as MatrixCellPayload[],
                          deletedIds: deletedMatrixRuleIds[activeMatrix.ratingParameterId] || [],
                        },
                      ],
                    };
                    const res = await saveMatrixRatingValues(productId, payload);
                    setMatrixConfig((prev) =>
                      prev
                        ? {
                            ...prev,
                            ratingConfigId: res.ratingConfigId,
                          }
                        : prev,
                    );
                    setDeletedMatrixRuleIds((prev) => {
                      const next = { ...prev };
                      delete next[activeMatrix.ratingParameterId];
                      return next;
                    });
                    toast.success('Saved', {
                      description: 'Matrix configuration updated successfully',
                    });
                  } catch (error) {
                    console.error('Failed to save matrix configuration', error);
                    const msg =
                      error instanceof Error
                        ? error.message
                        : 'Failed to save matrix configuration';
                    toast.error('Error', { description: msg });
                  } finally {
                    setIsSaving(false);
                  }
                };

                return (
                  <div className="space-y-6">
                    <Card className="h-full">
                      <CardHeader>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-base">
                              {activeMatrix.name ||
                                `${activeMatrix.x.fieldLabel} × ${activeMatrix.y.fieldLabel}`}
                            </CardTitle>
                            <CardDescription>
                              Configure pricing for each combination of {activeMatrix.x.fieldLabel}{' '}
                              and {activeMatrix.y.fieldLabel}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExport('matrix', activeMatrix.ratingParameterId)}
                              disabled={!!isExporting}
                            >
                              {isExporting ===
                              getImportExportKey('matrix', activeMatrix.ratingParameterId) ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Upload className="w-4 h-4 mr-2" />
                              )}
                              Export
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleImportClick('matrix', activeMatrix.ratingParameterId)
                              }
                              disabled={!!isImporting}
                            >
                              {isImporting ===
                              getImportExportKey('matrix', activeMatrix.ratingParameterId) ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Download className="w-4 h-4 mr-2" />
                              )}
                              Import
                            </Button>
                            <Button onClick={handleSaveMatrix} size="sm" disabled={isSaving}>
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              Save Matrix
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="h-full flex flex-col">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm font-medium flex items-center justify-between">
                                <span>
                                  {activeMatrix.x.fieldLabel}{' '}
                                  {xAxisType === 'RANGE' ? 'Ranges' : 'Values'}
                                </span>
                                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                  {xAxisType === 'RANGE' ? 'Range Input' : 'Master List'}
                                </span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 min-h-0">
                              {xAxisType === 'RANGE' ? (
                                <div className="flex flex-col h-full">
                                  <div className="flex justify-end mb-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setMatrixAxisRanges((prev) => {
                                          const current = prev[activeMatrix.ratingParameterId] || {
                                            x: activeMatrix.x.items || [],
                                            y: activeMatrix.y.items || [],
                                          };
                                          const rows = current.x || [];
                                          // Use only valid rows (FROM !== TO) to calculate next range
                                          const validRows = rows.filter((r) => Number(r.rangeStart ?? 0) !== Number(r.rangeEnd ?? 0));
                                          const nextX = [...rows, createNewMatrixRange(validRows, 'x')];
                                          return {
                                            ...prev,
                                            [activeMatrix.ratingParameterId]: {
                                              ...current,
                                              x: nextX,
                                            },
                                          };
                                        })
                                      }
                                    >
                                      Add {activeMatrix.x.fieldLabel} Range
                                    </Button>
                                  </div>
                                  <div className="h-[240px] overflow-y-auto pr-2">
                                    <div className="space-y-2">
                                      {(xItems || []).map((entry, idx) => (
                                        <div
                                          key={entry.id}
                                          className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center"
                                        >
                                          <FormattedNumberInput
                                            value={entry.rangeStart ?? 0}
                                            step="1"
                                            min="0"
                                            onChange={(val) =>
                                              setMatrixAxisRanges((prev) => {
                                                const current = prev[
                                                  activeMatrix.ratingParameterId
                                                ] || {
                                                  x: activeMatrix.x.items || [],
                                                  y: activeMatrix.y.items || [],
                                                };
                                                const updatedX = (current.x || []).map((r, i) =>
                                                  i === idx
                                                    ? {
                                                        ...r,
                                                        rangeStart: val,
                                                      }
                                                    : r,
                                                );
                                                return {
                                                  ...prev,
                                                  [activeMatrix.ratingParameterId]: {
                                                    ...current,
                                                    x: updatedX,
                                                  },
                                                };
                                              })
                                            }
                                            className="w-full"
                                          />
                                          <FormattedNumberInput
                                            value={entry.rangeEnd ?? 0}
                                            step="1"
                                            min="0"
                                            onChange={(val) =>
                                              setMatrixAxisRanges((prev) => {
                                                const current = prev[
                                                  activeMatrix.ratingParameterId
                                                ] || {
                                                  x: activeMatrix.x.items || [],
                                                  y: activeMatrix.y.items || [],
                                                };
                                                const updatedX = (current.x || []).map((r, i) =>
                                                  i === idx
                                                    ? {
                                                        ...r,
                                                        rangeEnd: val,
                                                      }
                                                    : r,
                                                );
                                                return {
                                                  ...prev,
                                                  [activeMatrix.ratingParameterId]: {
                                                    ...current,
                                                    x: updatedX,
                                                  },
                                                };
                                              })
                                            }
                                            className="w-full"
                                          />
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() =>
                                              setMatrixAxisRanges((prev) => {
                                                const current = prev[
                                                  activeMatrix.ratingParameterId
                                                ] || {
                                                  x: activeMatrix.x.items || [],
                                                  y: activeMatrix.y.items || [],
                                                };
                                                const updatedX = (current.x || []).filter(
                                                  (_, i) => i !== idx,
                                                );
                                                return {
                                                  ...prev,
                                                  [activeMatrix.ratingParameterId]: {
                                                    ...current,
                                                    x: updatedX,
                                                  },
                                                };
                                              })
                                            }
                                          >
                                            <X className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="h-[240px] overflow-y-auto rounded-md border bg-muted/5 p-1">
                                  {xItems.length > 0 ? (
                                    xItems.map((item, i) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between py-2 px-3 border-b last:border-0 text-sm hover:bg-muted/20 rounded-sm bg-background mb-1 last:mb-0"
                                      >
                                        <span className="font-medium">
                                          {getAxisLabel(item, 'MASTER')}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                          #{i + 1}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-4 text-center">
                                      <span>No values available</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          <Card className="h-full flex flex-col">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm font-medium flex items-center justify-between">
                                <span>
                                  {activeMatrix.y.fieldLabel}{' '}
                                  {yAxisType === 'RANGE' ? 'Ranges' : 'Values'}
                                </span>
                                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                  {yAxisType === 'RANGE' ? 'Range Input' : 'Master List'}
                                </span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 min-h-0">
                              {yAxisType === 'RANGE' ? (
                                <div className="flex flex-col h-full">
                                  <div className="flex justify-end mb-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setMatrixAxisRanges((prev) => {
                                          const current = prev[activeMatrix.ratingParameterId] || {
                                            x: activeMatrix.x.items || [],
                                            y: activeMatrix.y.items || [],
                                          };
                                          const rows = current.y || [];
                                          // Use only valid rows (FROM !== TO) to calculate next range
                                          const validRows = rows.filter((r) => Number(r.rangeStart ?? 0) !== Number(r.rangeEnd ?? 0));
                                          const nextY = [...rows, createNewMatrixRange(validRows, 'y')];
                                          return {
                                            ...prev,
                                            [activeMatrix.ratingParameterId]: {
                                              ...current,
                                              y: nextY,
                                            },
                                          };
                                        })
                                      }
                                    >
                                      Add {activeMatrix.y.fieldLabel} Range
                                    </Button>
                                  </div>
                                  <div className="h-[240px] overflow-y-auto pr-2">
                                    <div className="space-y-2">
                                      {(yItems || []).map((entry, idx) => (
                                        <div
                                          key={entry.id}
                                          className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center"
                                        >
                                          <FormattedNumberInput
                                            value={entry.rangeStart ?? 0}
                                            step="1"
                                            min="0"
                                            onChange={(val) =>
                                              setMatrixAxisRanges((prev) => {
                                                const current = prev[
                                                  activeMatrix.ratingParameterId
                                                ] || {
                                                  x: activeMatrix.x.items || [],
                                                  y: activeMatrix.y.items || [],
                                                };
                                                const updatedY = (current.y || []).map((r, i) =>
                                                  i === idx
                                                    ? {
                                                        ...r,
                                                        rangeStart: val,
                                                      }
                                                    : r,
                                                );
                                                return {
                                                  ...prev,
                                                  [activeMatrix.ratingParameterId]: {
                                                    ...current,
                                                    y: updatedY,
                                                  },
                                                };
                                              })
                                            }
                                            className="w-full"
                                            allowDecimals={false}
                                          />
                                          <FormattedNumberInput
                                            value={entry.rangeEnd ?? 0}
                                            step="1"
                                            min="0"
                                            onChange={(val) =>
                                              setMatrixAxisRanges((prev) => {
                                                const current = prev[
                                                  activeMatrix.ratingParameterId
                                                ] || {
                                                  x: activeMatrix.x.items || [],
                                                  y: activeMatrix.y.items || [],
                                                };
                                                const updatedY = (current.y || []).map((r, i) =>
                                                  i === idx
                                                    ? {
                                                        ...r,
                                                        rangeEnd: val,
                                                      }
                                                    : r,
                                                );
                                                return {
                                                  ...prev,
                                                  [activeMatrix.ratingParameterId]: {
                                                    ...current,
                                                    y: updatedY,
                                                  },
                                                };
                                              })
                                            }
                                            className="w-full"
                                            allowDecimals={false}
                                          />
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() =>
                                              setMatrixAxisRanges((prev) => {
                                                const current = prev[
                                                  activeMatrix.ratingParameterId
                                                ] || {
                                                  x: activeMatrix.x.items || [],
                                                  y: activeMatrix.y.items || [],
                                                };
                                                const updatedY = (current.y || []).filter(
                                                  (_, i) => i !== idx,
                                                );
                                                return {
                                                  ...prev,
                                                  [activeMatrix.ratingParameterId]: {
                                                    ...current,
                                                    y: updatedY,
                                                  },
                                                };
                                              })
                                            }
                                          >
                                            <X className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="h-[240px] overflow-y-auto rounded-md border bg-muted/5 p-1">
                                  {yItems.length > 0 ? (
                                    yItems.map((item, i) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between py-2 px-3 border-b last:border-0 text-sm hover:bg-muted/20 rounded-sm bg-background mb-1 last:mb-0"
                                      >
                                        <span className="font-medium">
                                          {getAxisLabel(item, 'MASTER')}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                          #{i + 1}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-4 text-center">
                                      <span>No values available</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>

                        <div className="flex items-center gap-6 mb-4 px-1">
                          <div className="flex items-center gap-2 shrink-0">
                            <div
                              className={`w-3 h-3 rounded-full ${getQuoteOptionColor('quote')}`}
                            ></div>
                            <span className="text-sm text-muted-foreground">Auto Quote</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div
                              className={`w-3 h-3 rounded-full ${getQuoteOptionColor('no_quote')}`}
                            ></div>
                            <span className="text-sm text-muted-foreground">No Quote</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div
                              className={`w-3 h-3 rounded-full ${getQuoteOptionColor('referral')}`}
                            ></div>
                            <span className="text-sm text-muted-foreground">Referral</span>
                          </div>
                        </div>

                        {/* Matrix table: first row & first column frozen; header sticks inside this scroll area */}
                        <div className="relative max-h-[480px] overflow-auto">
                          <Table className="min-w-max border-separate border">
                            <TableHeader className="sticky top-0 z-40 border">
                              <TableRow className="border">
                                <TableHead
                                  freeze={true}
                                  freezeLeft={true}
                                  className="min-w-[220px] border bg-muted text-center border-r"
                                >
                                  {activeMatrix.x.fieldLabel} \ {activeMatrix.y.fieldLabel}
                                </TableHead>
                                {yItems.map((y) => (
                                  <TableHead
                                    key={y.id}
                                    freeze={true}
                                    className="min-w-[220px] text-center bg-muted border border-l-0"
                                  >
                                    {getAxisLabel(y, yAxisType)}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {xItems.map((x) => (
                                <TableRow key={x.id}>
                                  <TableCell
                                    className="min-w-[220px] border bg-muted/5 px-4 font-medium"
                                    freezeLeft={true}
                                  >
                                    {getAxisLabel(x, xAxisType)}
                                  </TableCell>
                                  {yItems.map((y) => {
                                    const existing = findCellFor(x, y);
                                    const local: MatrixCellPayload = existing || {
                                      xType: xAxisType,
                                      yType: yAxisType,
                                      adjustmentType: 'PERCENTAGE',
                                      adjustmentValue: 0,
                                      quoteAction: 'quote',
                                    };
                                    return (
                                      <TableCell key={y.id} className="border p-2 min-w-[200px] ">
                                        <div className="flex items-center gap-2 shrink-0">
                                          <FormattedNumberInput
                                            min={0}
                                            max={local.adjustmentType === 'PERCENTAGE' ? 100 : undefined}
                                            allowDecimals={true}
                                            maxDecimals={local.adjustmentType === 'PERCENTAGE' ? 2 : 5}
                                            value={local.adjustmentValue}
                                            onChange={(val) =>
                                              upsertCell(x, y, (prevCell) => ({
                                                ...(prevCell || local),
                                                adjustmentValue: val,
                                              }))
                                            }
                                            className="min-w-[80px] w-full font-mono"
                                            placeholder="0.00"
                                          />
                                          <Select
                                            value={
                                              local.adjustmentType === 'PERCENTAGE'
                                                ? 'percentage'
                                                : local.adjustmentType === 'FIXED'
                                                  ? 'fixed'
                                                  : 'factor'
                                            }
                                            onValueChange={(val) =>
                                              upsertCell(x, y, (prevCell) => {
                                                const prev = prevCell || local;
                                                const newType =
                                                  val === 'percentage'
                                                    ? 'PERCENTAGE'
                                                    : val === 'fixed'
                                                      ? 'FIXED'
                                                      : 'FACTOR';
                                                return {
                                                  ...prev,
                                                  adjustmentType: newType,
                                                  adjustmentValue:
                                                    newType === 'PERCENTAGE' &&
                                                    Number(prev.adjustmentValue) > 100
                                                      ? 0
                                                      : prev.adjustmentValue,
                                                };
                                              })
                                            }
                                          >
                                            <SelectTrigger style={{ width: '130px', minWidth: '130px', maxWidth: '130px' }}>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="percentage">Percentage</SelectItem>
                                              <SelectItem value="fixed">
                                                {productInfo.currency}
                                              </SelectItem>
                                              <SelectItem value="factor">Factor</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          {isPremiumLimitMatrix ? (
                                            <>
                                              <Select
                                                value={
                                                  (local.premiumAdjustmentType ||
                                                    (local.adjustmentType === 'PERCENTAGE' ||
                                                    local.adjustmentType === 'FIXED'
                                                      ? local.adjustmentType
                                                      : 'PERCENTAGE')) === 'PERCENTAGE'
                                                    ? 'percentage'
                                                    : 'fixed'
                                                }
                                                onValueChange={(val) =>
                                                  upsertCell(x, y, (prevCell) => ({
                                                    ...(prevCell || local),
                                                    premiumAdjustmentType:
                                                      val === 'percentage' ? 'PERCENTAGE' : 'FIXED',
                                                  }))
                                                }
                                              >
                                                <SelectTrigger className="w-[130px]">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="percentage">
                                                    Percentage
                                                  </SelectItem>
                                                  <SelectItem value="fixed">
                                                    Fixed Amount
                                                  </SelectItem>
                                                </SelectContent>
                                              </Select>
                                              <FormattedNumberInput
                                                value={local.minPremiumValue ?? 0}
                                                onChange={(val) =>
                                                  upsertCell(x, y, (prevCell) => ({
                                                    ...(prevCell || local),
                                                    minPremiumValue: val,
                                                  }))
                                                }
                                                className="min-w-[80px] w-full font-mono"
                                                placeholder="Min"
                                              />
                                              <FormattedNumberInput
                                                value={local.maxPremiumValue ?? 0}
                                                onChange={(val) =>
                                                  upsertCell(x, y, (prevCell) => ({
                                                    ...(prevCell || local),
                                                    maxPremiumValue: val,
                                                  }))
                                                }
                                                className="min-w-[80px] w-full font-mono"
                                                placeholder="Max"
                                              />
                                            </>
                                          ) : null}
                                          <Select
                                            value={local.quoteAction}
                                            onValueChange={(val) =>
                                              upsertCell(x, y, (prevCell) => ({
                                                ...(prevCell || local),
                                                quoteAction: val as
                                                  | 'quote'
                                                  | 'no_quote'
                                                  | 'referral',
                                              }))
                                            }
                                          >
                                            <SelectTrigger className="w-[80px] px-0 flex justify-center">
                                              <div
                                                className={`w-3 h-3 rounded-full ${getQuoteOptionColor(
                                                  local.quoteAction,
                                                )}`}
                                              ></div>
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="quote">
                                                <div className="flex items-center gap-2 shrink-0">
                                                  <div
                                                    className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                      'quote',
                                                    )}`}
                                                  ></div>
                                                  Auto Quote
                                                </div>
                                              </SelectItem>
                                              <SelectItem value="no_quote">
                                                <div className="flex items-center gap-2 shrink-0">
                                                  <div
                                                    className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                      'no_quote',
                                                    )}`}
                                                  ></div>
                                                  No Quote
                                                </div>
                                              </SelectItem>
                                              <SelectItem value="referral">
                                                <div className="flex items-center gap-2 shrink-0">
                                                  <div
                                                    className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                      'referral',
                                                    )}`}
                                                  ></div>
                                                  Referral
                                                </div>
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {/* </div> */}
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}

            {activePricingTab === 'grp-factor-all' && groupedParams && (
              <div className="space-y-6">
                {(() => {
                  const data = (groupedParams.factor || []).slice().sort((a, b) => {
                    const ao = Array.isArray(a.options) && a.options.length > 0 ? 0 : 1;
                    const bo = Array.isArray(b.options) && b.options.length > 0 ? 0 : 1;
                    if (ao !== bo) return ao - bo;
                    return a.displayOrder - b.displayOrder;
                  });
                  return (
                    <Card className="h-full">
                      <CardHeader>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <CardTitle className="text-base">Factors</CardTitle>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExport('factors')}
                              disabled={!!isExporting}
                            >
                              {isExporting === 'factors' ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Upload className="w-4 h-4 mr-2" />
                              )}
                              Export
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleImportClick('factors')}
                              disabled={!!isImporting}
                            >
                              {isImporting === 'factors' ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Download className="w-4 h-4 mr-2" />
                              )}
                              Import
                            </Button>
                            <Button
                              onClick={() => handleSaveCategory('factor')}
                              size="sm"
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              Save Factors
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {data.map((param) => {
                            const pAny = param;
                            if (
                              param.fieldType?.toLowerCase().includes('combination') ||
                              param.fieldType === 'combination'
                            ) {
                              return (
                                <CombinationFieldCard
                                  key={`comb-${param.ratingParameterId}`}
                                  param={param}
                                  subFields={pAny.subFields || []}
                                  ratingSelections={ratingSelections}
                                  setRatingSelections={setRatingSelections}
                                  ratingFreeConfigs={ratingFreeConfigs}
                                  setRatingFreeConfigs={setRatingFreeConfigs}
                                  handleRemoveRow={handleRemoveRow}
                                  onSave={() => handleSaveCategory('factor')}
                                  isSaving={isSaving}
                                  onExport={handleExport}
                                  onImportClick={handleImportClick}
                                  isExporting={isExporting}
                                  isImporting={isImporting}
                                  category="factors"
                                  ratingParameterId={param.ratingParameterId}
                                />
                              );
                            }
                            const hasOptions =
                              Array.isArray(param.options) && param.options.length > 0;
                            return hasOptions ? (
                              <Card key={`md-${param.ratingParameterId}`}>
                                <CardHeader>
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <CardTitle>{param.fieldLabel}</CardTitle>
                                      <CardDescription>
                                        Configure rates for different {param.fieldLabel} types
                                      </CardDescription>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <Table className={EQUAL_TABLE_CLASS}>
                                    <TableHeader>
                                      <TableRow className="bg-muted/10">
                                        <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Option
                                        </TableHead>
                                        <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Adjustment Type
                                        </TableHead>
                                        <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Loading/Discount
                                        </TableHead>
                                        {/* <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Premium Adjustment Type
                                        </TableHead>
                                        <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Min Premium Value
                                        </TableHead>
                                        <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Max Premium Value
                                        </TableHead> */}
                                        <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Quote Action
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {(param.options || [])
                                        .slice()
                                        .sort((a, b) => a.sortOrder - b.sortOrder)
                                        .map((opt) => {
                                          const current = ratingSelections[
                                            param.ratingParameterId
                                          ]?.[opt.value] || {
                                            adjustmentType: 'percentage',
                                            adjustmentValue: 0,
                                            quoteAction: 'quote' as const,
                                          };
                                          return (
                                            <TableRow key={opt.value} className="hover:bg-muted/5">
                                              <TableCell
                                                className={`${FOUR_COLUMN_CELL_CLASS} font-medium`}
                                              >
                                                {formatIfNumber(opt.label)}
                                              </TableCell>
                                              <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                                <Select
                                                  value={current.adjustmentType}
                                                  onValueChange={(v) =>
                                                    setRatingSelections((prev) => {
                                                      const formCfg: Record<string, OptionConfig> =
                                                        prev[param.ratingParameterId] ||
                                                        ({} as Record<string, OptionConfig>);
                                                      const row = formCfg[opt.value] || current;
                                                      return {
                                                        ...prev,
                                                        [param.ratingParameterId]: {
                                                          ...formCfg,
                                                          [opt.value]: {
                                                            ...row,
                                                            adjustmentType: v as
                                                              | 'percentage'
                                                              | 'fixed',
                                                          },
                                                        },
                                                      };
                                                    })
                                                  }
                                                >
                                                  <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent className="z-50 bg-popover border border-border shadow-md">
                                                    <SelectItem value="percentage">
                                                      Percentage
                                                    </SelectItem>
                                                    <SelectItem value="fixed">
                                                      Fixed Amount
                                                    </SelectItem>
                                                    <SelectItem value="factor">Factor</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                                <FormattedNumberInput
                                                  min={0}
                                                  max={current.adjustmentType === 'percentage' ? 100 : undefined}
                                                  allowDecimals={true}
                                                  maxDecimals={current.adjustmentType === 'percentage' ? 2 : undefined}
                                                  value={current.adjustmentValue}
                                                  onChange={(val) =>
                                                    setRatingSelections((prev) => {
                                                      const formCfg: Record<string, OptionConfig> =
                                                        prev[param.ratingParameterId] ||
                                                        ({} as Record<string, OptionConfig>);
                                                      const row = formCfg[opt.value] || current;
                                                      return {
                                                        ...prev,
                                                        [param.ratingParameterId]: {
                                                          ...formCfg,
                                                          [opt.value]: {
                                                            ...row,
                                                            adjustmentValue: val,
                                                          },
                                                        },
                                                      };
                                                    })
                                                  }
                                                  className="w-full font-mono"
                                                  placeholder="0.00"
                                                />
                                              </TableCell>
                                              {/* <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                                <Select
                                                  value={
                                                    current.premiumAdjustmentType ??
                                                    current.adjustmentType
                                                  }
                                                  onValueChange={(v) =>
                                                    setRatingSelections((prev) => {
                                                      const formCfg: Record<string, OptionConfig> =
                                                        prev[param.ratingParameterId] ||
                                                        ({} as Record<string, OptionConfig>);
                                                      const row = formCfg[opt.value] || current;
                                                      return {
                                                        ...prev,
                                                        [param.ratingParameterId]: {
                                                          ...formCfg,
                                                          [opt.value]: {
                                                            ...row,
                                                            premiumAdjustmentType: v as
                                                              | 'percentage'
                                                              | 'fixed',
                                                          },
                                                        },
                                                      };
                                                    })
                                                  }
                                                >
                                                  <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent className="z-50 bg-popover border border-border shadow-md">
                                                    <SelectItem value="percentage">
                                                      Percentage
                                                    </SelectItem>
                                                    <SelectItem value="fixed">
                                                      Fixed Amount
                                                    </SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                                <FormattedNumberInput
                                                  value={current.minPremiumValue ?? 0}
                                                  onChange={(val) =>
                                                    setRatingSelections((prev) => {
                                                      const formCfg: Record<string, OptionConfig> =
                                                        prev[param.ratingParameterId] ||
                                                        ({} as Record<string, OptionConfig>);
                                                      const row = formCfg[opt.value] || current;
                                                      return {
                                                        ...prev,
                                                        [param.ratingParameterId]: {
                                                          ...formCfg,
                                                          [opt.value]: {
                                                            ...row,
                                                            minPremiumValue: val,
                                                          },
                                                        },
                                                      };
                                                    })
                                                  }
                                                  className="w-full font-mono"
                                                  placeholder="0.00"
                                                />
                                              </TableCell>
                                              <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                                <FormattedNumberInput
                                                  value={current.maxPremiumValue ?? 0}
                                                  onChange={(val) =>
                                                    setRatingSelections((prev) => {
                                                      const formCfg: Record<string, OptionConfig> =
                                                        prev[param.ratingParameterId] ||
                                                        ({} as Record<string, OptionConfig>);
                                                      const row = formCfg[opt.value] || current;
                                                      return {
                                                        ...prev,
                                                        [param.ratingParameterId]: {
                                                          ...formCfg,
                                                          [opt.value]: {
                                                            ...row,
                                                            maxPremiumValue: val,
                                                          },
                                                        },
                                                      };
                                                    })
                                                  }
                                                  className="w-full font-mono"
                                                  placeholder="0.00"
                                                />
                                              </TableCell> */}
                                              <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                                <Select
                                                  value={current.quoteAction}
                                                  onValueChange={(v) =>
                                                    setRatingSelections((prev) => {
                                                      const formCfg: Record<string, OptionConfig> =
                                                        prev[param.ratingParameterId] ||
                                                        ({} as Record<string, OptionConfig>);
                                                      const row = formCfg[opt.value] || current;
                                                      return {
                                                        ...prev,
                                                        [param.ratingParameterId]: {
                                                          ...formCfg,
                                                          [opt.value]: {
                                                            ...row,
                                                            quoteAction: v as
                                                              | 'quote'
                                                              | 'no_quote'
                                                              | 'referral',
                                                          },
                                                        },
                                                      };
                                                    })
                                                  }
                                                >
                                                  <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent className="z-50 bg-popover border border-border shadow-md">
                                                    <SelectItem value="quote">
                                                      <div className="flex items-center gap-2 shrink-0">
                                                        <div
                                                          className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                            'quote',
                                                          )}`}
                                                        ></div>
                                                        Auto Quote
                                                      </div>
                                                    </SelectItem>
                                                    <SelectItem value="no_quote">
                                                      <div className="flex items-center gap-2 shrink-0">
                                                        <div
                                                          className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                            'no_quote',
                                                          )}`}
                                                        ></div>
                                                        No Quote
                                                      </div>
                                                    </SelectItem>
                                                    <SelectItem value="referral">
                                                      <div className="flex items-center gap-2 shrink-0">
                                                        <div
                                                          className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                            'referral',
                                                          )}`}
                                                        ></div>
                                                        Referral
                                                      </div>
                                                    </SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>
                            ) : (
                              <Card key={`free-${param.ratingParameterId}`}>
                                <CardHeader>
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <CardTitle>{param.fieldLabel}</CardTitle>
                                      <CardDescription>
                                        Rate based on {param.fieldLabel} value ranges
                                      </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          setRatingFreeConfigs((prev) => {
                                            const rows = prev[param.ratingParameterId] || [];
                                            const next = createNewFreeRow(rows);
                                            return {
                                              ...prev,
                                              [param.ratingParameterId]: [...rows, next],
                                            };
                                          })
                                        }
                                      >
                                        Add Row
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <Table className="min-w-max">
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className={RANGE_HEAD_SM_CLASS}>From</TableHead>
                                        <TableHead className={RANGE_HEAD_SM_CLASS}>To</TableHead>
                                        <TableHead className={RANGE_HEAD_MD_CLASS}>
                                          Adjustment Type
                                        </TableHead>
                                        <TableHead className={RANGE_HEAD_MD_CLASS}>
                                          Loading/Discount
                                        </TableHead>
                                        <TableHead className={RANGE_HEAD_MD_CLASS}>
                                          Quote Action
                                        </TableHead>
                                        <TableHead className={ACTION_HEAD_CLASS}>Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {(ratingFreeConfigs[param.ratingParameterId] || []).map(
                                        (entry) => (
                                          <TableRow key={entry.id}>
                                            <TableCell>
                                              <FormattedNumberInput
                                                value={entry.rangeStart}
                                                step="1"
                                                min="0"
                                                onChange={(val) =>
                                                  setRatingFreeConfigs((prev) => {
                                                    const rows =
                                                      prev[param.ratingParameterId] || [];
                                                    const updated = rows.map((r) =>
                                                      r.id === entry.id
                                                        ? {
                                                            ...r,
                                                            rangeStart: val,
                                                          }
                                                        : r,
                                                    );
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: updated,
                                                    };
                                                  })
                                                }
                                                className="w-full"
                                              />
                                            </TableCell>
                                            <TableCell>
                                              <FormattedNumberInput
                                                value={entry.rangeEnd}
                                                step="1"
                                                min="0"
                                                onChange={(val) =>
                                                  setRatingFreeConfigs((prev) => {
                                                    const rows =
                                                      prev[param.ratingParameterId] || [];
                                                    const updated = rows.map((r) =>
                                                      r.id === entry.id
                                                        ? {
                                                            ...r,
                                                            rangeEnd: val,
                                                          }
                                                        : r,
                                                    );
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: updated,
                                                    };
                                                  })
                                                }
                                                className="w-full"
                                              />
                                            </TableCell>
                                            <TableCell>
                                              <Select
                                                value={entry.adjustmentType}
                                                onValueChange={(value) =>
                                                  setRatingFreeConfigs((prev) => {
                                                    const rows =
                                                      prev[param.ratingParameterId] || [];
                                                    const updated = rows.map((r) =>
                                                      r.id === entry.id
                                                        ? {
                                                            ...r,
                                                            adjustmentType: value as
                                                              | 'percentage'
                                                              | 'fixed',
                                                          }
                                                        : r,
                                                    );
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: updated,
                                                    };
                                                  })
                                                }
                                              >
                                                <SelectTrigger className="w-full">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="percentage">
                                                    Percentage
                                                  </SelectItem>
                                                  <SelectItem value="fixed">
                                                    Fixed Amount
                                                  </SelectItem>
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
                                                  setRatingFreeConfigs((prev) => {
                                                    const rows =
                                                      prev[param.ratingParameterId] || [];
                                                    const updated = rows.map((r) =>
                                                      r.id === entry.id
                                                        ? {
                                                            ...r,
                                                            adjustmentValue: val,
                                                          }
                                                        : r,
                                                    );
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: updated,
                                                    };
                                                  })
                                                }
                                                className="w-full"
                                              />
                                            </TableCell>
                                            <TableCell>
                                              <Select
                                                value={entry.quoteAction}
                                                onValueChange={(value) =>
                                                  setRatingFreeConfigs((prev) => {
                                                    const rows =
                                                      prev[param.ratingParameterId] || [];
                                                    const updated = rows.map((r) =>
                                                      r.id === entry.id
                                                        ? {
                                                            ...r,
                                                            quoteAction: value as
                                                              | 'quote'
                                                              | 'no_quote'
                                                              | 'referral',
                                                          }
                                                        : r,
                                                    );
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: updated,
                                                    };
                                                  })
                                                }
                                              >
                                                <SelectTrigger className="w-full">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="quote">
                                                    <div className="flex items-center gap-2 shrink-0">
                                                      <div
                                                        className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                          'quote',
                                                        )}`}
                                                      ></div>
                                                      Auto Quote
                                                    </div>
                                                  </SelectItem>
                                                  <SelectItem value="no_quote">
                                                    <div className="flex items-center gap-2 shrink-0">
                                                      <div
                                                        className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                          'no_quote',
                                                        )}`}
                                                      ></div>
                                                      No Quote
                                                    </div>
                                                  </SelectItem>
                                                  <SelectItem value="referral">
                                                    <div className="flex items-center gap-2 shrink-0">
                                                      <div
                                                        className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                          'referral',
                                                        )}`}
                                                      ></div>
                                                      Referral
                                                    </div>
                                                  </SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  handleRemoveRow(param.ratingParameterId, entry.id)
                                                }
                                              >
                                                Remove
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ),
                                      )}
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>
            )}

            {activePricingTab.startsWith('grp-combination-') && groupedParams && (
              <div className="space-y-6">
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <CardTitle className="text-base">Combination Parameters</CardTitle>
                      <Button
                        onClick={() => {
                          saveCombinationConfig(activePricingTab.replace('grp-combination-', ''));
                        }}
                        size="sm"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Combinations
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {combinationParams.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        No combination parameters configured.
                      </div>
                    ) : (
                      combinationParams
                        .filter(
                          (param) =>
                            activePricingTab === `grp-combination-${param.ratingParameterId}`,
                        )
                        .map((param) => {
                          const rows = combinationRowsByParameter[param.ratingParameterId] || [];
                          const combinationEntry = getCombinationEntry(param.ratingParameterId);
                          const childIds = (
                            getCombinationChildIds(param.ratingParameterId).length > 0
                              ? getCombinationChildIds(param.ratingParameterId)
                              : rows.flatMap((row) =>
                                  (row.values || [])
                                    .map(
                                      (value) =>
                                        value.childDefinitionId || value.childRatingParameterId,
                                    )
                                    .filter(Boolean),
                                ) || []
                          )
                            .filter(Boolean)
                            .filter((id, index, self) => self.indexOf(id) === index);
                          const scrollState = combinationScrollState[param.ratingParameterId] || {
                            canScrollLeft: false,
                            canScrollRight: false,
                          };

                          const displayParam = param;
                          const combinationCategory =
                            combinationEntry?.category === 'PREMIUM_LIMIT'
                              ? 'premiumLimit'
                              : combinationEntry?.category === 'BASE'
                                ? 'base'
                                : combinationEntry?.category === 'FACTOR'
                                  ? 'factor'
                                  : groupedParams?.premiumLimit?.some(
                                        (p) => p.ratingParameterId === param.ratingParameterId,
                                      )
                                    ? 'premiumLimit'
                                    : groupedParams?.base?.some(
                                          (p) => p.ratingParameterId === param.ratingParameterId,
                                        )
                                      ? 'base'
                                      : 'factor';
                          const isPremiumLimitCombination = combinationCategory === 'premiumLimit';
                          const combinationImportExportKey = getImportExportKey(
                            combinationCategory,
                            param.ratingParameterId,
                            'combination',
                          );

                          return (
                            <Card key={`comb-card-${param.ratingParameterId}`}>
                              <CardHeader>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <CardTitle className="text-base">
                                      {combinationEntry?.labelName ||
                                        combinationEntry?.name ||
                                        displayParam.fieldLabel}
                                    </CardTitle>
                                    <CardDescription>
                                      <div className="text-sm text-muted-foreground">
                                        {getCombinationDisplayName(displayParam)}
                                      </div>
                                      <div>Configure row rules and loading values</div>
                                    </CardDescription>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleExport(
                                          combinationCategory,
                                          param.ratingParameterId,
                                          'combination',
                                        )
                                      }
                                      disabled={!!isExporting}
                                    >
                                      {isExporting === combinationImportExportKey ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                      ) : (
                                        <Upload className="w-4 h-4 mr-2" />
                                      )}
                                      Export
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleImportClick(
                                          combinationCategory,
                                          param.ratingParameterId,
                                          'combination',
                                        )
                                      }
                                      disabled={!!isImporting}
                                    >
                                      {isImporting === combinationImportExportKey ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                      ) : (
                                        <Download className="w-4 h-4 mr-2" />
                                      )}
                                      Import
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addCombinationRow(param.ratingParameterId)}
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      Add Row
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="relative">
                                  {scrollState.canScrollLeft ? (
                                    <button
                                      type="button"
                                      className="absolute inset-y-[1px] left-[1px] z-20 flex w-12 items-center justify-start rounded-l-md bg-gradient-to-r from-primary/20 via-primary/10 to-transparent pl-1 text-primary transition-opacity hover:opacity-100"
                                      onClick={() =>
                                        scrollCombinationTable(param.ratingParameterId, 'left')
                                      }
                                      aria-label="Scroll combination table left"
                                    >
                                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent opacity-75 transition-opacity hover:opacity-100">
                                        <ChevronLeft className="h-5 w-5 stroke-[3.25]" />
                                      </span>
                                    </button>
                                  ) : null}

                                  {scrollState.canScrollRight ? (
                                    <button
                                      type="button"
                                      className="absolute inset-y-[1px] right-[1px] z-20 flex w-12 items-center justify-end rounded-r-md bg-gradient-to-l from-primary/20 via-primary/10 to-transparent pr-1 text-primary transition-opacity hover:opacity-100"
                                      onClick={() =>
                                        scrollCombinationTable(param.ratingParameterId, 'right')
                                      }
                                      aria-label="Scroll combination table right"
                                    >
                                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent opacity-75 transition-opacity hover:opacity-100">
                                        <ChevronRight className="h-5 w-5 stroke-[3.25]" />
                                      </span>
                                    </button>
                                  ) : null}

                                  <div
                                    ref={(node) => {
                                      combinationTableScrollRefs.current[param.ratingParameterId] =
                                        node;
                                    }}
                                    onScroll={() =>
                                      updateCombinationScrollState(param.ratingParameterId)
                                    }
                                    className="overflow-x-scroll custom-scrollbars rounded-md border border-border"
                                  >
                                    <Table className="min-w-max">
                                      <TableHeader>
                                        <TableRow>
                                          {childIds.map((childId) => {
                                            const childMeta = getCombinationChildMeta(
                                              param.ratingParameterId,
                                              childId,
                                            );
                                            const isDropdown =
                                              isCombinationChildDropdown(childMeta);
                                            const fieldDescriptor =
                                              getCombinationChildFieldDescriptor(childMeta);
                                            return (
                                              <TableHead
                                                key={`${param.ratingParameterId}-${childId}`}
                                                className={
                                                  isDropdown ? 'min-w-[180px]' : 'min-w-[260px]'
                                                }
                                              >
                                                <div className="space-y-0.5">
                                                  <div>
                                                    {formatCombinationChildLabel(
                                                      getCombinationChildLabel(childMeta, childId),
                                                    )}
                                                    {!isDropdown ? ' (From/To)' : ''}
                                                  </div>
                                                  {fieldDescriptor ? (
                                                    <div className="text-[11px] font-normal text-muted-foreground">
                                                      {fieldDescriptor}
                                                    </div>
                                                  ) : null}
                                                </div>
                                              </TableHead>
                                            );
                                          })}
                                          <TableHead className="min-w-[180px]">
                                            Adjustment Type
                                          </TableHead>
                                          <TableHead className="min-w-[180px]">
                                            Loading/Discount
                                          </TableHead>
                                          {/* {isPremiumLimitCombination ? (
                                            <>
                                              <TableHead className="min-w-[180px]">
                                                Premium Adjustment Type
                                              </TableHead>
                                              <TableHead className="min-w-[180px]">
                                                Min Premium Value
                                              </TableHead>
                                              <TableHead className="min-w-[180px]">
                                                Max Premium Value
                                              </TableHead>
                                            </>
                                          ) : null} */}
                                          <TableHead className="min-w-[180px]">
                                            Quote Action
                                          </TableHead>
                                          <TableHead className="min-w-[96px]">Action</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {rows.length === 0 && (
                                          <TableRow>
                                            <TableCell
                                              colSpan={
                                                childIds.length +
                                                (isPremiumLimitCombination ? 7 : 4)
                                              }
                                              className="text-muted-foreground"
                                            >
                                              No rows added yet.
                                            </TableCell>
                                          </TableRow>
                                        )}
                                        {rows.map((row, rowIndex) => (
                                          <TableRow
                                            key={`${param.ratingParameterId}-row-${rowIndex}`}
                                          >
                                            {childIds.map((childId) => {
                                              const childMeta = getCombinationChildMeta(
                                                param.ratingParameterId,
                                                childId,
                                              );
                                              const childIds = childMeta
                                                ? getCombinationChildIdentifiers(childMeta)
                                                : {
                                                    childDefinitionId: undefined,
                                                    childRatingParameterId: undefined,
                                                  };
                                              const isDropdown =
                                                isCombinationChildDropdown(childMeta);
                                              const isCoverSelection =
                                                isCombinationChildCoverSelection(childMeta);
                                              const value =
                                                row.values.find((v) =>
                                                  matchesCombinationRowValue(v, childId, childIds),
                                                ) || null;
                                              if (isDropdown) {
                                                return (
                                                  <TableCell
                                                    key={`${param.ratingParameterId}-${rowIndex}-${childId}`}
                                                    className="min-w-[180px]"
                                                  >
                                                    <Select
                                                      value={
                                                        isCoverSelection
                                                          ? value?.coverId || ''
                                                          : value?.masterValueId || ''
                                                      }
                                                      onValueChange={(next) =>
                                                        setCombinationRowsByParameter((prev) => {
                                                          const nextRows = [
                                                            ...(prev[param.ratingParameterId] ||
                                                              []),
                                                          ];
                                                          const targetRow = {
                                                            ...nextRows[rowIndex],
                                                          };
                                                          const matchIndex =
                                                            targetRow.values.findIndex((v) =>
                                                              matchesCombinationRowValue(
                                                                v,
                                                                childId,
                                                                childIds,
                                                              ),
                                                            );
                                                          if (matchIndex === -1) {
                                                            targetRow.values = [
                                                              ...targetRow.values,
                                                              {
                                                                childDefinitionId:
                                                                  childIds.childDefinitionId,
                                                                childRatingParameterId:
                                                                  childIds.childRatingParameterId,
                                                                valueType: 'DROPDOWN',
                                                                ...(isCoverSelection
                                                                  ? { coverId: next }
                                                                  : { masterValueId: next }),
                                                              },
                                                            ];
                                                          } else {
                                                            targetRow.values = targetRow.values.map(
                                                              (v) =>
                                                                matchesCombinationRowValue(
                                                                  v,
                                                                  childId,
                                                                  childIds,
                                                                )
                                                                  ? {
                                                                      ...v,
                                                                      childDefinitionId:
                                                                        childIds.childDefinitionId,
                                                                      childRatingParameterId:
                                                                        childIds.childRatingParameterId ||
                                                                        v.childRatingParameterId,
                                                                      ...(isCoverSelection
                                                                        ? {
                                                                            coverId: next,
                                                                            masterValueId:
                                                                              undefined,
                                                                          }
                                                                        : {
                                                                            masterValueId: next,
                                                                            coverId: undefined,
                                                                          }),
                                                                      valueType: 'DROPDOWN',
                                                                    }
                                                                  : v,
                                                            );
                                                          }
                                                          nextRows[rowIndex] = targetRow;
                                                          return {
                                                            ...prev,
                                                            [param.ratingParameterId]: nextRows,
                                                          };
                                                        })
                                                      }
                                                    >
                                                      <SelectTrigger>
                                                        <SelectValue placeholder="Select option" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        {(childMeta?.options || [])
                                                          .filter((opt) =>
                                                            isCoverSelection
                                                              ? (opt as { coverId?: string })
                                                                  .coverId
                                                              : true,
                                                          )
                                                          .map((opt) => {
                                                            const optionValue = isCoverSelection
                                                              ? (opt as { coverId?: string })
                                                                  .coverId
                                                              : (opt as { masterValueId?: string })
                                                                  .masterValueId || opt.value;
                                                            return (
                                                              <SelectItem
                                                                key={`${optionValue}-${opt.label}`}
                                                                value={optionValue || ''}
                                                              >
                                                                {formatIfNumber(opt.label)}
                                                              </SelectItem>
                                                            );
                                                          })}
                                                      </SelectContent>
                                                    </Select>
                                                  </TableCell>
                                                );
                                              }

                                              return (
                                                <TableCell
                                                  key={`${param.ratingParameterId}-${rowIndex}-${childId}`}
                                                  className="min-w-[220px]"
                                                >
                                                  <div className="grid min-w-[260px] grid-cols-2 gap-2">
                                                    <FormattedNumberInput
                                                      value={Number(value?.rangeFrom || 0)}
                                                      onChange={(next) =>
                                                        setCombinationRowsByParameter((prev) => {
                                                          const nextRows = [
                                                            ...(prev[param.ratingParameterId] ||
                                                              []),
                                                          ];
                                                          const targetRow = {
                                                            ...nextRows[rowIndex],
                                                          };
                                                          const matchIndex =
                                                            targetRow.values.findIndex((v) =>
                                                              matchesCombinationRowValue(
                                                                v,
                                                                childId,
                                                                childIds,
                                                              ),
                                                            );
                                                          if (matchIndex === -1) {
                                                            targetRow.values = [
                                                              ...targetRow.values,
                                                              {
                                                                childDefinitionId:
                                                                  childIds.childDefinitionId,
                                                                childRatingParameterId:
                                                                  childIds.childRatingParameterId,
                                                                valueType: 'NUMBER_RANGE',
                                                                rangeFrom: next,
                                                                rangeTo: 0,
                                                              },
                                                            ];
                                                          } else {
                                                            targetRow.values = targetRow.values.map(
                                                              (v) =>
                                                                matchesCombinationRowValue(
                                                                  v,
                                                                  childId,
                                                                  childIds,
                                                                )
                                                                  ? {
                                                                      ...v,
                                                                      childDefinitionId:
                                                                        childIds.childDefinitionId,
                                                                      childRatingParameterId:
                                                                        childIds.childRatingParameterId ||
                                                                        v.childRatingParameterId,
                                                                      rangeFrom: next,
                                                                      valueType: 'NUMBER_RANGE',
                                                                    }
                                                                  : v,
                                                            );
                                                          }
                                                          nextRows[rowIndex] = targetRow;
                                                          return {
                                                            ...prev,
                                                            [param.ratingParameterId]: nextRows,
                                                          };
                                                        })
                                                      }
                                                      className="w-full min-w-[120px]"
                                                      placeholder="From"
                                                    />
                                                    <FormattedNumberInput
                                                      value={Number(value?.rangeTo || 0)}
                                                      onChange={(next) =>
                                                        setCombinationRowsByParameter((prev) => {
                                                          const nextRows = [
                                                            ...(prev[param.ratingParameterId] ||
                                                              []),
                                                          ];
                                                          const targetRow = {
                                                            ...nextRows[rowIndex],
                                                          };
                                                          const matchIndex =
                                                            targetRow.values.findIndex((v) =>
                                                              matchesCombinationRowValue(
                                                                v,
                                                                childId,
                                                                childIds,
                                                              ),
                                                            );
                                                          if (matchIndex === -1) {
                                                            targetRow.values = [
                                                              ...targetRow.values,
                                                              {
                                                                childDefinitionId:
                                                                  childIds.childDefinitionId,
                                                                childRatingParameterId:
                                                                  childIds.childRatingParameterId,
                                                                valueType: 'NUMBER_RANGE',
                                                                rangeFrom: 0,
                                                                rangeTo: next,
                                                              },
                                                            ];
                                                          } else {
                                                            targetRow.values = targetRow.values.map(
                                                              (v) =>
                                                                matchesCombinationRowValue(
                                                                  v,
                                                                  childId,
                                                                  childIds,
                                                                )
                                                                  ? {
                                                                      ...v,
                                                                      childDefinitionId:
                                                                        childIds.childDefinitionId,
                                                                      childRatingParameterId:
                                                                        childIds.childRatingParameterId ||
                                                                        v.childRatingParameterId,
                                                                      rangeTo: next,
                                                                      valueType: 'NUMBER_RANGE',
                                                                    }
                                                                  : v,
                                                            );
                                                          }
                                                          nextRows[rowIndex] = targetRow;
                                                          return {
                                                            ...prev,
                                                            [param.ratingParameterId]: nextRows,
                                                          };
                                                        })
                                                      }
                                                      className="w-full min-w-[120px]"
                                                      placeholder="To"
                                                    />
                                                  </div>
                                                </TableCell>
                                              );
                                            })}
                                            <TableCell>
                                              <Select
                                                value={row.adjustmentType || 'PERCENTAGE'}
                                                onValueChange={(next) =>
                                                  setCombinationRowsByParameter((prev) => {
                                                    const nextRows = [
                                                      ...(prev[param.ratingParameterId] || []),
                                                    ];
                                                    const currentRow = nextRows[rowIndex];
                                                    nextRows[rowIndex] = {
                                                      ...currentRow,
                                                      adjustmentType: next as
                                                        | 'PERCENTAGE'
                                                        | 'FIXED'
                                                        | 'FACTOR',
                                                      loading:
                                                        next === 'PERCENTAGE' &&
                                                        Number(currentRow.loading) > 100
                                                          ? 0
                                                          : currentRow.loading,
                                                    };
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: nextRows,
                                                    };
                                                  })
                                                }
                                              >
                                                <SelectTrigger className="w-full">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="PERCENTAGE">
                                                    Percentage
                                                  </SelectItem>
                                                  <SelectItem value="FIXED">
                                                    Fixed Amount
                                                  </SelectItem>
                                                  <SelectItem value="FACTOR">Factor</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <FormattedNumberInput
                                                min={0}
                                                max={row.adjustmentType === 'PERCENTAGE' ? 100 : undefined}
                                                allowDecimals={true}
                                                maxDecimals={row.adjustmentType === 'PERCENTAGE' ? 2 : undefined}
                                                value={Number(row.loading || 0)}
                                                onChange={(next) =>
                                                  setCombinationRowsByParameter((prev) => {
                                                    const nextRows = [
                                                      ...(prev[param.ratingParameterId] || []),
                                                    ];
                                                    nextRows[rowIndex] = {
                                                      ...nextRows[rowIndex],
                                                      loading: next,
                                                    };
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: nextRows,
                                                    };
                                                  })
                                                }
                                                className="w-full font-mono"
                                                placeholder="0.00"
                                              />
                                            </TableCell>
                                            {/* {isPremiumLimitCombination ? (
                                              <>
                                                <TableCell>
                                                  <Select
                                                    value={
                                                      (row.premiumAdjustmentType ??
                                                        (row.adjustmentType === 'FIXED'
                                                          ? 'FIXED'
                                                          : 'PERCENTAGE')) as 'PERCENTAGE' | 'FIXED'
                                                    }
                                                    onValueChange={(next) =>
                                                      setCombinationRowsByParameter((prev) => {
                                                        const nextRows = [
                                                          ...(prev[param.ratingParameterId] || []),
                                                        ];
                                                        nextRows[rowIndex] = {
                                                          ...nextRows[rowIndex],
                                                          premiumAdjustmentType: next as
                                                            | 'PERCENTAGE'
                                                            | 'FIXED',
                                                        };
                                                        return {
                                                          ...prev,
                                                          [param.ratingParameterId]: nextRows,
                                                        };
                                                      })
                                                    }
                                                  >
                                                    <SelectTrigger className="w-full">
                                                      <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      <SelectItem value="PERCENTAGE">
                                                        Percentage
                                                      </SelectItem>
                                                      <SelectItem value="FIXED">
                                                        Fixed Amount
                                                      </SelectItem>
                                                    </SelectContent>
                                                  </Select>
                                                </TableCell>
                                                <TableCell>
                                                  <FormattedNumberInput
                                                    value={Number(row.minPremiumValue ?? 0)}
                                                    onChange={(next) =>
                                                      setCombinationRowsByParameter((prev) => {
                                                        const nextRows = [
                                                          ...(prev[param.ratingParameterId] || []),
                                                        ];
                                                        nextRows[rowIndex] = {
                                                          ...nextRows[rowIndex],
                                                          minPremiumValue: next,
                                                        };
                                                        return {
                                                          ...prev,
                                                          [param.ratingParameterId]: nextRows,
                                                        };
                                                      })
                                                    }
                                                    className="w-full font-mono"
                                                    placeholder="0.00"
                                                  />
                                                </TableCell>
                                                <TableCell>
                                                  <FormattedNumberInput
                                                    value={Number(row.maxPremiumValue ?? 0)}
                                                    onChange={(next) =>
                                                      setCombinationRowsByParameter((prev) => {
                                                        const nextRows = [
                                                          ...(prev[param.ratingParameterId] || []),
                                                        ];
                                                        nextRows[rowIndex] = {
                                                          ...nextRows[rowIndex],
                                                          maxPremiumValue: next,
                                                        };
                                                        return {
                                                          ...prev,
                                                          [param.ratingParameterId]: nextRows,
                                                        };
                                                      })
                                                    }
                                                    className="w-full font-mono"
                                                    placeholder="0.00"
                                                  />
                                                </TableCell>
                                              </>
                                            ) : null} */}
                                            <TableCell>
                                              <Select
                                                value={row.quoteAction || 'quote'}
                                                onValueChange={(next) =>
                                                  setCombinationRowsByParameter((prev) => {
                                                    const nextRows = [
                                                      ...(prev[param.ratingParameterId] || []),
                                                    ];
                                                    nextRows[rowIndex] = {
                                                      ...nextRows[rowIndex],
                                                      quoteAction: next as
                                                        | 'quote'
                                                        | 'no_quote'
                                                        | 'referral',
                                                    };
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: nextRows,
                                                    };
                                                  })
                                                }
                                              >
                                                <SelectTrigger className="w-full">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="z-50 bg-popover border border-border shadow-md">
                                                  <SelectItem value="quote">
                                                    <div className="flex items-center gap-2 shrink-0">
                                                      <div
                                                        className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                          'quote',
                                                        )}`}
                                                      ></div>
                                                      Auto Quote
                                                    </div>
                                                  </SelectItem>
                                                  <SelectItem value="no_quote">
                                                    <div className="flex items-center gap-2 shrink-0">
                                                      <div
                                                        className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                          'no_quote',
                                                        )}`}
                                                      ></div>
                                                      No Quote
                                                    </div>
                                                  </SelectItem>
                                                  <SelectItem value="referral">
                                                    <div className="flex items-center gap-2 shrink-0">
                                                      <div
                                                        className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                          'referral',
                                                        )}`}
                                                      ></div>
                                                      Referral
                                                    </div>
                                                  </SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                  removeCombinationRow(
                                                    param.ratingParameterId,
                                                    rowIndex,
                                                  )
                                                }
                                              >
                                                <X className="w-4 h-4 text-red-500" />
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
                          );
                        })
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activePricingTab === 'grp-premiumLimit-all' && groupedParams && (
              <div className="space-y-6">
                {(() => {
                  const data = (groupedParams?.premiumLimit || []).slice().sort((a, b) => {
                    const ao = Array.isArray(a.options) && a.options.length > 0 ? 0 : 1;
                    const bo = Array.isArray(b.options) && b.options.length > 0 ? 0 : 1;
                    if (ao !== bo) return ao - bo;
                    return a.displayOrder - b.displayOrder;
                  });
                  return (
                    <Card className="h-full">
                      <CardHeader>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <CardTitle className="text-base">Premium Limit Parameters</CardTitle>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExport('premiumLimit')}
                              disabled={!!isExporting}
                            >
                              {isExporting === 'premiumLimit' ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Upload className="w-4 h-4 mr-2" />
                              )}
                              Export
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleImportClick('premiumLimit')}
                              disabled={!!isImporting}
                            >
                              {isImporting === 'premiumLimit' ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Download className="w-4 h-4 mr-2" />
                              )}
                              Import
                            </Button>
                            <Button
                              onClick={() => handleSaveCategory('premiumLimit')}
                              size="sm"
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              Save Premium Limit
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {data.map((param) => {
                            const pAny = param;
                            if (
                              param.fieldType?.toLowerCase().includes('combination') ||
                              param.fieldType === 'combination'
                            ) {
                              return (
                                <CombinationFieldCard
                                  key={`comb-${param.formFieldId}`}
                                  param={param}
                                  subFields={pAny.subFields || []}
                                  ratingSelections={ratingSelections}
                                  setRatingSelections={setRatingSelections}
                                  ratingFreeConfigs={ratingFreeConfigs}
                                  setRatingFreeConfigs={setRatingFreeConfigs}
                                  handleRemoveRow={handleRemoveRow}
                                  onSave={() => handleSaveCategory('premiumLimit')}
                                  isSaving={isSaving}
                                  onExport={handleExport}
                                  onImportClick={handleImportClick}
                                  isExporting={isExporting}
                                  isImporting={isImporting}
                                  category="premiumLimit"
                                  ratingParameterId={param.ratingParameterId}
                                />
                              );
                            }
                            const hasOptions =
                              Array.isArray(param.options) && param.options.length > 0;
                            return hasOptions ? (
                              <Card key={`md-${param.ratingParameterId}`}>
                                <CardHeader>
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <CardTitle>{param.fieldLabel}</CardTitle>
                                      <CardDescription>
                                        Configure rates for different {param.fieldLabel} types
                                      </CardDescription>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <Table className={EQUAL_TABLE_CLASS}>
                                    <TableHeader>
                                      <TableRow className="bg-muted/10">
                                        <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Option
                                        </TableHead>
                                        <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Adjustment Type
                                        </TableHead>
                                        <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Loading/Discount
                                        </TableHead>
                                        {/* <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Premium Adjustment Type
                                        </TableHead>
                                        <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Min Premium Value
                                        </TableHead>
                                        <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Max Premium Value
                                        </TableHead> */}
                                        <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Quote Action
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {(param.options || [])
                                        .slice()
                                        .sort((a, b) => a.sortOrder - b.sortOrder)
                                        .map((opt) => {
                                          const current = ratingSelections[
                                            param.ratingParameterId
                                          ]?.[opt.value] || {
                                            adjustmentType: 'percentage',
                                            adjustmentValue: 0,
                                            quoteAction: 'quote' as const,
                                          };
                                          return (
                                            <TableRow key={opt.value} className="hover:bg-muted/5">
                                              <TableCell
                                                className={`${FOUR_COLUMN_CELL_CLASS} font-medium`}
                                              >
                                                {formatIfNumber(opt.label)}
                                              </TableCell>
                                              <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                                <Select
                                                  value={current.adjustmentType}
                                                  onValueChange={(v) =>
                                                    setRatingSelections((prev) => {
                                                      const formCfg: Record<string, OptionConfig> =
                                                        prev[param.ratingParameterId] ||
                                                        ({} as Record<string, OptionConfig>);
                                                      const row = formCfg[opt.value] || current;
                                                      return {
                                                        ...prev,
                                                        [param.ratingParameterId]: {
                                                          ...formCfg,
                                                          [opt.value]: {
                                                            ...row,
                                                            adjustmentType: v as
                                                              | 'percentage'
                                                              | 'fixed',
                                                          },
                                                        },
                                                      };
                                                    })
                                                  }
                                                >
                                                  <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent className="z-50 bg-popover border border-border shadow-md">
                                                    <SelectItem value="percentage">
                                                      Percentage
                                                    </SelectItem>
                                                    <SelectItem value="fixed">
                                                      Fixed Amount
                                                    </SelectItem>
                                                    <SelectItem value="factor">Factor</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                                <FormattedNumberInput
                                                  min={0}
                                                  max={current.adjustmentType === 'percentage' ? 100 : undefined}
                                                  allowDecimals={true}
                                                  maxDecimals={current.adjustmentType === 'percentage' ? 2 : undefined}
                                                  value={current.adjustmentValue}
                                                  onChange={(val) =>
                                                    setRatingSelections((prev) => {
                                                      const formCfg: Record<string, OptionConfig> =
                                                        prev[param.ratingParameterId] ||
                                                        ({} as Record<string, OptionConfig>);
                                                      const row = formCfg[opt.value] || current;
                                                      return {
                                                        ...prev,
                                                        [param.ratingParameterId]: {
                                                          ...formCfg,
                                                          [opt.value]: {
                                                            ...row,
                                                            adjustmentValue: val,
                                                          },
                                                        },
                                                      };
                                                    })
                                                  }
                                                  className="w-full font-mono"
                                                  placeholder="0.00"
                                                />
                                              </TableCell>
                                              <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                                <Select
                                                  value={current.quoteAction}
                                                  onValueChange={(v) =>
                                                    setRatingSelections((prev) => {
                                                      const formCfg: Record<string, OptionConfig> =
                                                        prev[param.ratingParameterId] ||
                                                        ({} as Record<string, OptionConfig>);
                                                      const row = formCfg[opt.value] || current;
                                                      return {
                                                        ...prev,
                                                        [param.ratingParameterId]: {
                                                          ...formCfg,
                                                          [opt.value]: {
                                                            ...row,
                                                            quoteAction: v as
                                                              | 'quote'
                                                              | 'no_quote'
                                                              | 'referral',
                                                          },
                                                        },
                                                      };
                                                    })
                                                  }
                                                >
                                                  <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent className="z-50 bg-popover border border-border shadow-md">
                                                    <SelectItem value="quote">
                                                      <div className="flex items-center gap-2 shrink-0">
                                                        <div
                                                          className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                            'quote',
                                                          )}`}
                                                        ></div>
                                                        Auto Quote
                                                      </div>
                                                    </SelectItem>
                                                    <SelectItem value="no_quote">
                                                      <div className="flex items-center gap-2 shrink-0">
                                                        <div
                                                          className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                            'no_quote',
                                                          )}`}
                                                        ></div>
                                                        No Quote
                                                      </div>
                                                    </SelectItem>
                                                    <SelectItem value="referral">
                                                      <div className="flex items-center gap-2 shrink-0">
                                                        <div
                                                          className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                            'referral',
                                                          )}`}
                                                        ></div>
                                                        Referral
                                                      </div>
                                                    </SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>
                            ) : (
                              <Card key={`free-${param.ratingParameterId}`}>
                                <CardHeader>
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <CardTitle>{param.fieldLabel}</CardTitle>
                                      <CardDescription>
                                        Rate based on {param.fieldLabel} value ranges
                                      </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          setRatingFreeConfigs((prev) => {
                                            const rows = prev[param.ratingParameterId] || [];
                                            const next: FreeRow = {
                                              id: Date.now(),
                                              rangeStart: 0,
                                              rangeEnd: 0,
                                              adjustmentType: 'percentage',
                                              adjustmentValue: 0,
                                              quoteAction: 'quote',
                                            };
                                            return {
                                              ...prev,
                                              [param.ratingParameterId]: [...rows, next],
                                            };
                                          })
                                        }
                                      >
                                        Add Row
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <Table className="min-w-max">
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className={RANGE_HEAD_SM_CLASS}>From</TableHead>
                                        <TableHead className={RANGE_HEAD_SM_CLASS}>To</TableHead>
                                        <TableHead className={RANGE_HEAD_MD_CLASS}>
                                          Adjustment Type
                                        </TableHead>
                                        <TableHead className={RANGE_HEAD_MD_CLASS}>
                                          Loading/Discount
                                        </TableHead>
                                        <TableHead className={RANGE_HEAD_MD_CLASS}>
                                          Quote Action
                                        </TableHead>
                                        <TableHead className={ACTION_HEAD_CLASS}>Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {(ratingFreeConfigs[param.ratingParameterId] || []).map(
                                        (entry) => (
                                          <TableRow key={entry.id}>
                                            <TableCell>
                                              <FormattedNumberInput
                                                value={entry.rangeStart}
                                                step="1"
                                                min="0"
                                                onChange={(val) =>
                                                  setRatingFreeConfigs((prev) => {
                                                    const rows =
                                                      prev[param.ratingParameterId] || [];
                                                    const updated = rows.map((r) =>
                                                      r.id === entry.id
                                                        ? {
                                                            ...r,
                                                            rangeStart: val,
                                                          }
                                                        : r,
                                                    );
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: updated,
                                                    };
                                                  })
                                                }
                                                className="w-full"
                                              />
                                            </TableCell>
                                            <TableCell>
                                              <FormattedNumberInput
                                                value={entry.rangeEnd}
                                                step="1"
                                                min="0"
                                                onChange={(val) =>
                                                  setRatingFreeConfigs((prev) => {
                                                    const rows =
                                                      prev[param.ratingParameterId] || [];
                                                    const updated = rows.map((r) =>
                                                      r.id === entry.id
                                                        ? {
                                                            ...r,
                                                            rangeEnd: val,
                                                          }
                                                        : r,
                                                    );
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: updated,
                                                    };
                                                  })
                                                }
                                                className="w-full"
                                              />
                                            </TableCell>
                                            <TableCell>
                                              <Select
                                                value={entry.adjustmentType}
                                                onValueChange={(value) =>
                                                  updateFreeRowAdjustmentType(
                                                    param.ratingParameterId,
                                                    entry.id,
                                                    value as 'percentage' | 'fixed' | 'factor',
                                                  )
                                                }
                                              >
                                                <SelectTrigger className="w-full">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="percentage">
                                                    Percentage
                                                  </SelectItem>
                                                  <SelectItem value="fixed">
                                                    Fixed Amount
                                                  </SelectItem>
                                                  <SelectItem value="factor">Factor</SelectItem>
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
                                                  setRatingFreeConfigs((prev) => {
                                                    const rows =
                                                      prev[param.ratingParameterId] || [];
                                                    const updated = rows.map((r) =>
                                                      r.id === entry.id
                                                        ? {
                                                            ...r,
                                                            adjustmentValue: val,
                                                          }
                                                        : r,
                                                    );
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: updated,
                                                    };
                                                  })
                                                }
                                                className="w-full"
                                              />
                                            </TableCell>
                                            <TableCell>
                                              <Select
                                                value={entry.quoteAction}
                                                onValueChange={(value) =>
                                                  setRatingFreeConfigs((prev) => {
                                                    const rows =
                                                      prev[param.ratingParameterId] || [];
                                                    const updated = rows.map((r) =>
                                                      r.id === entry.id
                                                        ? {
                                                            ...r,
                                                            quoteAction: value as
                                                              | 'quote'
                                                              | 'no_quote'
                                                              | 'referral',
                                                          }
                                                        : r,
                                                    );
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: updated,
                                                    };
                                                  })
                                                }
                                              >
                                                <SelectTrigger className="w-full">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="quote">
                                                    <div className="flex items-center gap-2 shrink-0">
                                                      <div
                                                        className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                          'quote',
                                                        )}`}
                                                      ></div>
                                                      Auto Quote
                                                    </div>
                                                  </SelectItem>
                                                  <SelectItem value="no_quote">
                                                    <div className="flex items-center gap-2 shrink-0">
                                                      <div
                                                        className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                          'no_quote',
                                                        )}`}
                                                      ></div>
                                                      No Quote
                                                    </div>
                                                  </SelectItem>
                                                  <SelectItem value="referral">
                                                    <div className="flex items-center gap-2 shrink-0">
                                                      <div
                                                        className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                          'referral',
                                                        )}`}
                                                      ></div>
                                                      Referral
                                                    </div>
                                                  </SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  handleRemoveRow(param.ratingParameterId, entry.id)
                                                }
                                              >
                                                Remove
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ),
                                      )}
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>
            )}

            {activePricingTab === '__removed__' && groupedParams && (
              <div className="space-y-6">
                {(() => {
                  const data = (groupedParams?.premiumLimit || []).slice().sort((a, b) => {
                    const ao = Array.isArray(a.options) && a.options.length > 0 ? 0 : 1;
                    const bo = Array.isArray(b.options) && b.options.length > 0 ? 0 : 1;
                    if (ao !== bo) return ao - bo;
                    return a.displayOrder - b.displayOrder;
                  });
                  return (
                    <Card className="h-full">
                      <CardHeader>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <CardTitle className="text-base">Premium Limit Parameters</CardTitle>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExport('premiumLimit')}
                              disabled={!!isExporting}
                            >
                              {isExporting === 'premiumLimit' ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Upload className="w-4 h-4 mr-2" />
                              )}
                              Export
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleImportClick('premiumLimit')}
                              disabled={!!isImporting}
                            >
                              {isImporting === 'premiumLimit' ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Download className="w-4 h-4 mr-2" />
                              )}
                              Import
                            </Button>
                            <Button
                              onClick={() => handleSaveCategory('premiumLimit')}
                              size="sm"
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              Save Premium Limit
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {data.map((param) => {
                            const pAny = param;
                            if (
                              param.fieldType?.toLowerCase().includes('combination') ||
                              param.fieldType === 'combination'
                            ) {
                              return (
                                <CombinationFieldCard
                                  key={`comb-${param.formFieldId}`}
                                  param={param}
                                  subFields={pAny.subFields || []}
                                  ratingSelections={ratingSelections}
                                  setRatingSelections={setRatingSelections}
                                  ratingFreeConfigs={ratingFreeConfigs}
                                  setRatingFreeConfigs={setRatingFreeConfigs}
                                  handleRemoveRow={handleRemoveRow}
                                  onSave={() => handleSaveCategory('premiumLimit')}
                                  isSaving={isSaving}
                                  onExport={handleExport}
                                  onImportClick={handleImportClick}
                                  isExporting={isExporting}
                                  isImporting={isImporting}
                                  category="premiumLimit"
                                  ratingParameterId={param.ratingParameterId}
                                />
                              );
                            }
                            const hasOptions =
                              Array.isArray(param.options) && param.options.length > 0;
                            return hasOptions ? (
                              <Card key={`md-${param.ratingParameterId}`}>
                                <CardHeader>
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <CardTitle>{param.fieldLabel}</CardTitle>
                                      <CardDescription>
                                        Configure rates for different {param.fieldLabel} types
                                      </CardDescription>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <Table className={EQUAL_TABLE_CLASS}>
                                    <TableHeader>
                                      <TableRow className="bg-muted/10">
                                        <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Option
                                        </TableHead>
                                        <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Adjustment Type
                                        </TableHead>
                                        <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Loading/Discount
                                        </TableHead>
                                        <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                          Quote Action
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {(param.options || [])
                                        .slice()
                                        .sort((a, b) => a.sortOrder - b.sortOrder)
                                        .map((opt) => {
                                          const current = ratingSelections[
                                            param.ratingParameterId
                                          ]?.[opt.value] || {
                                            adjustmentType: 'percentage',
                                            adjustmentValue: 0,
                                            quoteAction: 'quote' as const,
                                          };
                                          return (
                                            <TableRow key={opt.value} className="hover:bg-muted/5">
                                              <TableCell
                                                className={`${FOUR_COLUMN_CELL_CLASS} font-medium`}
                                              >
                                                <div className="flex items-center gap-2 shrink-0">
                                                  <span>{opt.label}</span>
                                                </div>
                                              </TableCell>
                                              <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                                <Select
                                                  value={current.adjustmentType}
                                                  onValueChange={(value) =>
                                                    setRatingSelections((prev) => {
                                                      const formCfg = prev[param.ratingParameterId] || {};
                                                      const existing = formCfg[opt.value] || current;
                                                      const newType = value as 'percentage' | 'fixed';
                                                      return {
                                                        ...prev,
                                                        [param.ratingParameterId]: {
                                                          ...formCfg,
                                                          [opt.value]: {
                                                            ...existing,
                                                            adjustmentType: newType,
                                                            adjustmentValue:
                                                              newType === 'percentage' &&
                                                              Number(existing.adjustmentValue) > 100
                                                                ? 0
                                                                : existing.adjustmentValue,
                                                          },
                                                        },
                                                      };
                                                    })
                                                  }
                                                >
                                                  <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="percentage">
                                                      Percentage
                                                    </SelectItem>
                                                    <SelectItem value="fixed">
                                                      Fixed Amount
                                                    </SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                                <FormattedNumberInput
                                                  min={0}
                                                  max={current.adjustmentType === 'percentage' ? 100 : undefined}
                                                  allowDecimals={true}
                                                  maxDecimals={current.adjustmentType === 'percentage' ? 2 : undefined}
                                                  value={current.adjustmentValue}
                                                  onChange={(val) =>
                                                    setRatingSelections((prev) => {
                                                      const formCfg: Record<string, OptionConfig> =
                                                        prev[param.ratingParameterId] ||
                                                        ({} as Record<string, OptionConfig>);
                                                      const row = formCfg[opt.value] || current;
                                                      return {
                                                        ...prev,
                                                        [param.ratingParameterId]: {
                                                          ...formCfg,
                                                          [opt.value]: {
                                                            ...row,
                                                            adjustmentValue: val,
                                                          },
                                                        },
                                                      };
                                                    })
                                                  }
                                                  className="w-full font-mono"
                                                  placeholder="0.00"
                                                />
                                              </TableCell>
                                              <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                                <Select
                                                  value={
                                                    current.premiumAdjustmentType ??
                                                    current.adjustmentType
                                                  }
                                                  onValueChange={(value) =>
                                                    setRatingSelections((prev) => {
                                                      const formCfg: Record<string, OptionConfig> =
                                                        prev[param.ratingParameterId] ||
                                                        ({} as Record<string, OptionConfig>);
                                                      const row = formCfg[opt.value] || current;
                                                      return {
                                                        ...prev,
                                                        [param.ratingParameterId]: {
                                                          ...formCfg,
                                                          [opt.value]: {
                                                            ...row,
                                                            premiumAdjustmentType: value as
                                                              | 'percentage'
                                                              | 'fixed',
                                                          },
                                                        },
                                                      };
                                                    })
                                                  }
                                                >
                                                  <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="percentage">
                                                      Percentage
                                                    </SelectItem>
                                                    <SelectItem value="fixed">
                                                      Fixed Amount
                                                    </SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                                <FormattedNumberInput
                                                  value={current.minPremiumValue ?? 0}
                                                  onChange={(val) =>
                                                    setRatingSelections((prev) => {
                                                      const formCfg: Record<string, OptionConfig> =
                                                        prev[param.ratingParameterId] ||
                                                        ({} as Record<string, OptionConfig>);
                                                      const row = formCfg[opt.value] || current;
                                                      return {
                                                        ...prev,
                                                        [param.ratingParameterId]: {
                                                          ...formCfg,
                                                          [opt.value]: {
                                                            ...row,
                                                            minPremiumValue: val,
                                                          },
                                                        },
                                                      };
                                                    })
                                                  }
                                                  className="w-full font-mono"
                                                  placeholder="0.00"
                                                />
                                              </TableCell>
                                              <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                                <FormattedNumberInput
                                                  value={current.maxPremiumValue ?? 0}
                                                  onChange={(val) =>
                                                    setRatingSelections((prev) => {
                                                      const formCfg: Record<string, OptionConfig> =
                                                        prev[param.ratingParameterId] ||
                                                        ({} as Record<string, OptionConfig>);
                                                      const row = formCfg[opt.value] || current;
                                                      return {
                                                        ...prev,
                                                        [param.ratingParameterId]: {
                                                          ...formCfg,
                                                          [opt.value]: {
                                                            ...row,
                                                            maxPremiumValue: val,
                                                          },
                                                        },
                                                      };
                                                    })
                                                  }
                                                  className="w-full font-mono"
                                                  placeholder="0.00"
                                                />
                                              </TableCell>
                                              <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                                <Select
                                                  value={current.quoteAction}
                                                  onValueChange={(value) =>
                                                    setRatingSelections((prev) => ({
                                                      ...prev,
                                                      [param.ratingParameterId]: {
                                                        ...(prev[param.ratingParameterId] || {}),
                                                        [opt.value]: {
                                                          ...(prev[param.ratingParameterId]?.[
                                                            opt.value
                                                          ] || current),
                                                          quoteAction: value as
                                                            | 'quote'
                                                            | 'no_quote'
                                                            | 'referral',
                                                        },
                                                      },
                                                    }))
                                                  }
                                                >
                                                  <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="quote">
                                                      <div className="flex items-center gap-2 shrink-0">
                                                        <div
                                                          className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                            'quote',
                                                          )}`}
                                                        ></div>
                                                        Auto Quote
                                                      </div>
                                                    </SelectItem>
                                                    <SelectItem value="no_quote">
                                                      <div className="flex items-center gap-2 shrink-0">
                                                        <div
                                                          className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                            'no_quote',
                                                          )}`}
                                                        ></div>
                                                        No Quote
                                                      </div>
                                                    </SelectItem>
                                                    <SelectItem value="referral">
                                                      <div className="flex items-center gap-2 shrink-0">
                                                        <div
                                                          className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                            'referral',
                                                          )}`}
                                                        ></div>
                                                        Referral
                                                      </div>
                                                    </SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                    </TableBody>
                                  </Table>
                                </CardContent>
                              </Card>
                            ) : (
                              <Card key={`free-${param.ratingParameterId}`}>
                                <CardHeader>
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <CardTitle>{param.fieldLabel}</CardTitle>
                                      <CardDescription>
                                        Configure adjustment ranges for {param.fieldLabel}
                                      </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAddRow(param.ratingParameterId)}
                                      >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Range
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <Table className="min-w-max">
                                    <TableHeader>
                                      <TableRow className="bg-muted/10">
                                        <TableHead className={RANGE_HEAD_SM_CLASS}>From</TableHead>
                                        <TableHead className={RANGE_HEAD_SM_CLASS}>To</TableHead>
                                        <TableHead className={RANGE_HEAD_MD_CLASS}>
                                          Adjustment Type
                                        </TableHead>
                                        <TableHead className={RANGE_HEAD_MD_CLASS}>
                                          Loading/Discount
                                        </TableHead>
                                        {/* <TableHead className={RANGE_HEAD_MD_CLASS}>
                                          Premium Adjustment Type
                                        </TableHead>
                                        <TableHead className={RANGE_HEAD_MD_CLASS}>
                                          Min Premium Value
                                        </TableHead>
                                        <TableHead className={RANGE_HEAD_MD_CLASS}>
                                          Max Premium Value
                                        </TableHead> */}
                                        <TableHead className={RANGE_HEAD_MD_CLASS}>
                                          Quote Action
                                        </TableHead>
                                        <TableHead className={ACTION_HEAD_CLASS}>Action</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {(
                                        ratingFreeConfigs[param.ratingParameterId] || [
                                          {
                                            id: Date.now(),
                                            rangeStart: 0,
                                            rangeEnd: 0,
                                            adjustmentType: 'percentage',
                                            adjustmentValue: 0,
                                            quoteAction: 'quote',
                                          },
                                        ]
                                      ).map((entry) => (
                                        <TableRow key={entry.id} className="hover:bg-muted/5">
                                          <TableCell className="py-4 px-3">
                                            <FormattedNumberInput
                                              value={entry.rangeStart}
                                              step="1"
                                              min="0"
                                              onChange={(val) =>
                                                handleRangeChange(
                                                  param.ratingParameterId,
                                                  entry.id,
                                                  'rangeStart',
                                                  val,
                                                )
                                              }
                                              className="w-full"
                                            />
                                          </TableCell>
                                          <TableCell className="py-4 px-3">
                                            <FormattedNumberInput
                                              value={entry.rangeEnd}
                                              step="1"
                                              min="0"
                                              onChange={(val) =>
                                                handleRangeChange(
                                                  param.ratingParameterId,
                                                  entry.id,
                                                  'rangeEnd',
                                                  val,
                                                )
                                              }
                                              className="w-full"
                                            />
                                          </TableCell>
                                          <TableCell className="py-4 px-3">
                                            <Select
                                              value={entry.adjustmentType}
                                              onValueChange={(value) =>
                                                handleRangeChange(
                                                  param.ratingParameterId,
                                                  entry.id,
                                                  'adjustmentType',
                                                  value,
                                                )
                                              }
                                            >
                                              <SelectTrigger className="w-full">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="percentage">
                                                  Percentage
                                                </SelectItem>
                                                <SelectItem value="fixed">Fixed</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </TableCell>
                                          <TableCell className="py-4 px-3">
                                            <FormattedNumberInput
                                                  min={0}
                                                  max={entry.adjustmentType === 'percentage' ? 100 : undefined}
                                                  allowDecimals={true}
                                                  maxDecimals={entry.adjustmentType === 'percentage' ? 2 : undefined}
                                                  value={entry.adjustmentValue}
                                              onChange={(val) =>
                                                handleRangeChange(
                                                  param.ratingParameterId,
                                                  entry.id,
                                                  'adjustmentValue',
                                                  val,
                                                )
                                              }
                                              className="w-full font-mono"
                                            />
                                          </TableCell>
                                          {/* <TableCell className="py-4 px-3">
                                            <Select
                                              value={
                                                entry.premiumAdjustmentType ?? entry.adjustmentType
                                              }
                                              onValueChange={(value) =>
                                                handleRangeChange(
                                                  param.ratingParameterId,
                                                  entry.id,
                                                  'premiumAdjustmentType',
                                                  value as 'percentage' | 'fixed',
                                                )
                                              }
                                            >
                                              <SelectTrigger className="w-full">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="percentage">
                                                  Percentage
                                                </SelectItem>
                                                <SelectItem value="fixed">Fixed</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </TableCell>
                                          <TableCell className="py-4 px-3">
                                            <FormattedNumberInput
                                              value={entry.minPremiumValue ?? 0}
                                              onChange={(val) =>
                                                handleRangeChange(
                                                  param.ratingParameterId,
                                                  entry.id,
                                                  'minPremiumValue',
                                                  val,
                                                )
                                              }
                                              className="w-full font-mono"
                                            />
                                          </TableCell>
                                          <TableCell className="py-4 px-3">
                                            <FormattedNumberInput
                                              value={entry.maxPremiumValue ?? 0}
                                              onChange={(val) =>
                                                handleRangeChange(
                                                  param.ratingParameterId,
                                                  entry.id,
                                                  'maxPremiumValue',
                                                  val,
                                                )
                                              }
                                              className="w-full font-mono"
                                            />
                                          </TableCell> */}
                                          <TableCell className="py-4 px-3">
                                            <Select
                                              value={entry.quoteAction}
                                              onValueChange={(value) =>
                                                setRatingFreeConfigs((prev) => {
                                                  const rows = prev[param.ratingParameterId] || [];
                                                  const updated = rows.map((r) =>
                                                    r.id === entry.id
                                                      ? {
                                                          ...r,
                                                          quoteAction: value as
                                                            | 'quote'
                                                            | 'no_quote'
                                                            | 'referral',
                                                        }
                                                      : r,
                                                  );
                                                  return {
                                                    ...prev,
                                                    [param.ratingParameterId]: updated,
                                                  };
                                                })
                                              }
                                            >
                                              <SelectTrigger className="w-full">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="quote">
                                                  <div className="flex items-center gap-2 shrink-0">
                                                    <div
                                                      className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                        'quote',
                                                      )}`}
                                                    ></div>
                                                    Auto Quote
                                                  </div>
                                                </SelectItem>
                                                <SelectItem value="no_quote">
                                                  <div className="flex items-center gap-2 shrink-0">
                                                    <div
                                                      className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                        'no_quote',
                                                      )}`}
                                                    ></div>
                                                    No Quote
                                                  </div>
                                                </SelectItem>
                                                <SelectItem value="referral">
                                                  <div className="flex items-center gap-2 shrink-0">
                                                    <div
                                                      className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                        'referral',
                                                      )}`}
                                                    ></div>
                                                    Referral
                                                  </div>
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </TableCell>
                                          <TableCell>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                handleRemoveRow(param.ratingParameterId, entry.id)
                                              }
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
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>
            )}

            {activePricingTab.startsWith('grp-') &&
              !activePricingTab.endsWith('-all') &&
              groupedParams &&
              (() => {
                const parts = activePricingTab.split('-');
                const section = parts[1];
                if (section === 'combination') return null;
                const normalizedSection = section as 'base' | 'factor' | 'premiumLimit';
                const pid = parts.slice(2).join('-');
                const src =
                  normalizedSection === 'base'
                    ? groupedParams.base
                    : normalizedSection === 'factor'
                      ? groupedParams.factor
                      : groupedParams.premiumLimit;
                const param = (src || []).find((p) => p.ratingParameterId === pid);
                if (!param) return null;

                const pAny = param;
                if (
                  param.fieldType?.toLowerCase().includes('combination') ||
                  param.fieldType === 'combination'
                ) {
                  return (
                    <CombinationFieldCard
                      key={`comb-${param.ratingParameterId}`}
                      param={param}
                      subFields={pAny.subFields || []}
                      ratingSelections={ratingSelections}
                      setRatingSelections={setRatingSelections}
                      ratingFreeConfigs={ratingFreeConfigs}
                      setRatingFreeConfigs={setRatingFreeConfigs}
                      handleRemoveRow={handleRemoveRow}
                      onSave={() =>
                        handleSaveCategory(
                          normalizedSection as 'base' | 'factor' | 'premiumLimit',
                          pid,
                        )
                      }
                      isSaving={isSaving}
                      onExport={handleExport}
                      onImportClick={handleImportClick}
                      isExporting={isExporting}
                      isImporting={isImporting}
                      category={normalizedSection}
                      ratingParameterId={param.ratingParameterId}
                    />
                  );
                }

                const hasOptions = Array.isArray(param.options) && param.options.length > 0;
                return hasOptions
                  ? (() => {
                      return (
                        <Card key={activePricingTab} className="h-full">
                          <CardHeader>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <CardTitle>{param.fieldLabel}</CardTitle>
                                <CardDescription>
                                  Configure rates for different {param.fieldLabel} types
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleExport(normalizedSection, param.ratingParameterId)
                                  }
                                  disabled={!!isExporting}
                                >
                                  {isExporting ===
                                  getImportExportKey(normalizedSection, param.ratingParameterId) ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                  )}
                                  Export
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleImportClick(normalizedSection, param.ratingParameterId)
                                  }
                                  disabled={!!isImporting}
                                >
                                  {isImporting ===
                                  getImportExportKey(normalizedSection, param.ratingParameterId) ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  ) : (
                                    <Download className="w-4 h-4 mr-2" />
                                  )}
                                  Import
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleSaveCategory(
                                      normalizedSection as 'base' | 'factor' | 'premiumLimit',
                                      pid,
                                    )
                                  }
                                  size="sm"
                                  disabled={isSaving}
                                >
                                  {isSaving ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                  )}
                                  {`Save ${param.fieldLabel}`}
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <Table className={EQUAL_TABLE_CLASS}>
                              <TableHeader>
                                <TableRow className="bg-muted/10">
                                  <TableHead className={FOUR_COLUMN_HEAD_CLASS}>Option</TableHead>
                                  <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                    Adjustment Type
                                  </TableHead>
                                  <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                    Loading/Discount
                                  </TableHead>
                                  {/* {normalizedSection === 'premiumLimit' ? (
                                    <>
                                      <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                        Premium Adjustment Type
                                      </TableHead>
                                      <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                        Min Premium Value
                                      </TableHead>
                                      <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                        Max Premium Value
                                      </TableHead>
                                    </>
                                  ) : null} */}
                                  <TableHead className={FOUR_COLUMN_HEAD_CLASS}>
                                    Quote Action
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(param.options || [])
                                  .slice()
                                  .sort((a, b) => a.sortOrder - b.sortOrder)
                                  .filter(
                                    (opt, index, self) =>
                                      index === self.findIndex((t) => t.value === opt.value),
                                  )
                                  .map((opt) => {
                                    const current = ratingSelections[param.ratingParameterId]?.[
                                      opt.value
                                    ] || {
                                      adjustmentType: 'percentage',
                                      adjustmentValue: 0,
                                      quoteAction: 'quote' as const,
                                    };
                                    return (
                                      <TableRow key={opt.value} className="hover:bg-muted/5">
                                        <TableCell
                                          className={`${FOUR_COLUMN_CELL_CLASS} font-medium`}
                                        >
                                          {opt.label}
                                        </TableCell>
                                        <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                          <Select
                                            value={current.adjustmentType}
                                            onValueChange={(v) =>
                                              setRatingSelections((prev) => {
                                                const formCfg: Record<string, OptionConfig> =
                                                  prev[param.ratingParameterId] ||
                                                  ({} as Record<string, OptionConfig>);
                                                const row = formCfg[opt.value] || current;
                                                return {
                                                  ...prev,
                                                  [param.ratingParameterId]: {
                                                    ...formCfg,
                                                    [opt.value]: {
                                                      ...row,
                                                      adjustmentType: v as 'percentage' | 'fixed',
                                                    },
                                                  },
                                                };
                                              })
                                            }
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="z-50 bg-popover border border-border shadow-md">
                                              <SelectItem value="percentage">Percentage</SelectItem>
                                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                                              <SelectItem value="factor">Factor</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </TableCell>
                                        <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                          <FormattedNumberInput
                                                  min={0}
                                                  max={current.adjustmentType === 'percentage' ? 100 : undefined}
                                                  allowDecimals={true}
                                                  maxDecimals={current.adjustmentType === 'percentage' ? 2 : undefined}
                                                  value={current.adjustmentValue}
                                            onChange={(val) =>
                                              setRatingSelections((prev) => {
                                                const formCfg: Record<string, OptionConfig> =
                                                  prev[param.ratingParameterId] ||
                                                  ({} as Record<string, OptionConfig>);
                                                const row = formCfg[opt.value] || current;
                                                return {
                                                  ...prev,
                                                  [param.ratingParameterId]: {
                                                    ...formCfg,
                                                    [opt.value]: {
                                                      ...row,
                                                      adjustmentValue: val,
                                                    },
                                                  },
                                                };
                                              })
                                            }
                                            className="w-full font-mono"
                                            placeholder="0.00"
                                          />
                                        </TableCell>
                                        {/* {normalizedSection === 'premiumLimit' ? (
                                          <>
                                            <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                              <Select
                                                value={
                                                  current.premiumAdjustmentType ??
                                                  current.adjustmentType
                                                }
                                                onValueChange={(v) =>
                                                  setRatingSelections((prev) => {
                                                    const formCfg: Record<string, OptionConfig> =
                                                      prev[param.ratingParameterId] ||
                                                      ({} as Record<string, OptionConfig>);
                                                    const row = formCfg[opt.value] || current;
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: {
                                                        ...formCfg,
                                                        [opt.value]: {
                                                          ...row,
                                                          premiumAdjustmentType: v as
                                                            | 'percentage'
                                                            | 'fixed',
                                                        },
                                                      },
                                                    };
                                                  })
                                                }
                                              >
                                                <SelectTrigger className="w-full">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="z-50 bg-popover border border-border shadow-md">
                                                  <SelectItem value="percentage">
                                                    Percentage
                                                  </SelectItem>
                                                  <SelectItem value="fixed">
                                                    Fixed Amount
                                                  </SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                              <FormattedNumberInput
                                                value={current.minPremiumValue ?? 0}
                                                onChange={(val) =>
                                                  setRatingSelections((prev) => {
                                                    const formCfg: Record<string, OptionConfig> =
                                                      prev[param.ratingParameterId] ||
                                                      ({} as Record<string, OptionConfig>);
                                                    const row = formCfg[opt.value] || current;
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: {
                                                        ...formCfg,
                                                        [opt.value]: {
                                                          ...row,
                                                          minPremiumValue: val,
                                                        },
                                                      },
                                                    };
                                                  })
                                                }
                                                className="w-full font-mono"
                                                placeholder="0.00"
                                              />
                                            </TableCell>
                                            <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                              <FormattedNumberInput
                                                value={current.maxPremiumValue ?? 0}
                                                onChange={(val) =>
                                                  setRatingSelections((prev) => {
                                                    const formCfg: Record<string, OptionConfig> =
                                                      prev[param.ratingParameterId] ||
                                                      ({} as Record<string, OptionConfig>);
                                                    const row = formCfg[opt.value] || current;
                                                    return {
                                                      ...prev,
                                                      [param.ratingParameterId]: {
                                                        ...formCfg,
                                                        [opt.value]: {
                                                          ...row,
                                                          maxPremiumValue: val,
                                                        },
                                                      },
                                                    };
                                                  })
                                                }
                                                className="w-full font-mono"
                                                placeholder="0.00"
                                              />
                                            </TableCell>
                                          </>
                                        ) : null} */}
                                        <TableCell className={FOUR_COLUMN_CELL_CLASS}>
                                          <Select
                                            value={current.quoteAction}
                                            onValueChange={(v) =>
                                              setRatingSelections((prev) => {
                                                const formCfg: Record<string, OptionConfig> =
                                                  prev[param.ratingParameterId] ||
                                                  ({} as Record<string, OptionConfig>);
                                                const row = formCfg[opt.value] || current;
                                                return {
                                                  ...prev,
                                                  [param.ratingParameterId]: {
                                                    ...formCfg,
                                                    [opt.value]: {
                                                      ...row,
                                                      quoteAction: v as
                                                        | 'quote'
                                                        | 'no_quote'
                                                        | 'referral',
                                                    },
                                                  },
                                                };
                                              })
                                            }
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="z-50 bg-popover border border-border shadow-md">
                                              <SelectItem value="quote">
                                                <div className="flex items-center gap-2 shrink-0">
                                                  <div
                                                    className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                      'quote',
                                                    )}`}
                                                  ></div>
                                                  Auto Quote
                                                </div>
                                              </SelectItem>
                                              <SelectItem value="no_quote">
                                                <div className="flex items-center gap-2 shrink-0">
                                                  <div
                                                    className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                      'no_quote',
                                                    )}`}
                                                  ></div>
                                                  No Quote
                                                </div>
                                              </SelectItem>
                                              <SelectItem value="referral">
                                                <div className="flex items-center gap-2 shrink-0">
                                                  <div
                                                    className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                      'referral',
                                                    )}`}
                                                  ></div>
                                                  Referral
                                                </div>
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      );
                    })()
                  : (() => {
                      return (
                        <Card key={activePricingTab} className="h-full">
                          <CardHeader>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <CardTitle>{param.fieldLabel}</CardTitle>
                                <CardDescription>
                                  Rate based on {param.fieldLabel} value ranges
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleExport(normalizedSection, param.ratingParameterId)
                                  }
                                  disabled={!!isExporting}
                                >
                                  {isExporting ===
                                  getImportExportKey(normalizedSection, param.ratingParameterId) ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                  )}
                                  Export
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleImportClick(normalizedSection, param.ratingParameterId)
                                  }
                                  disabled={!!isImporting}
                                >
                                  {isImporting ===
                                  getImportExportKey(normalizedSection, param.ratingParameterId) ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  ) : (
                                    <Download className="w-4 h-4 mr-2" />
                                  )}
                                  Import
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setRatingFreeConfigs((prev) => {
                                      const rows = prev[param.ratingParameterId] || [];
                                      const next = createNewFreeRow(rows);
                                      return {
                                        ...prev,
                                        [param.ratingParameterId]: [...rows, next],
                                      };
                                    })
                                  }
                                >
                                  Add Row
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleSaveCategory(
                                      normalizedSection as 'base' | 'factor' | 'premiumLimit',
                                      pid,
                                    )
                                  }
                                  size="sm"
                                  disabled={isSaving}
                                >
                                  {isSaving ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                  )}
                                  {`Save ${param.fieldLabel} Ranges`}
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <Table className="min-w-max">
                              <TableHeader>
                                <TableRow>
                                  <TableHead className={RANGE_HEAD_SM_CLASS}>From</TableHead>
                                  <TableHead className={RANGE_HEAD_SM_CLASS}>To</TableHead>
                                  <TableHead className={RANGE_HEAD_MD_CLASS}>
                                    Adjustment Type
                                  </TableHead>
                                  <TableHead className={RANGE_HEAD_MD_CLASS}>
                                    Loading/Discount
                                  </TableHead>
                                  {/* {normalizedSection === 'premiumLimit' ? (
                                    <>
                                      <TableHead className={RANGE_HEAD_MD_CLASS}>
                                        Premium Adjustment Type
                                      </TableHead>
                                      <TableHead className={RANGE_HEAD_MD_CLASS}>
                                        Min Premium Value
                                      </TableHead>
                                      <TableHead className={RANGE_HEAD_MD_CLASS}>
                                        Max Premium Value
                                      </TableHead>
                                    </>
                                  ) : null} */}
                                  <TableHead className={RANGE_HEAD_MD_CLASS}>
                                    Quote Action
                                  </TableHead>
                                  <TableHead className={ACTION_HEAD_CLASS}>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(ratingFreeConfigs[param.ratingParameterId] || []).map((entry) => (
                                  <TableRow key={entry.id}>
                                    <TableCell>
                                      <FormattedNumberInput
                                        value={entry.rangeStart}
                                        step="1"
                                        min="0"
                                        onChange={(val) =>
                                          setRatingFreeConfigs((prev) => {
                                            const rows = prev[param.ratingParameterId] || [];
                                            const updated = rows.map((r) =>
                                              r.id === entry.id
                                                ? {
                                                    ...r,
                                                    rangeStart: val,
                                                  }
                                                : r,
                                            );
                                            return { ...prev, [param.ratingParameterId]: updated };
                                          })
                                        }
                                        className="w-full"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <FormattedNumberInput
                                        value={entry.rangeEnd}
                                        step="1"
                                        min="0"
                                        onChange={(val) =>
                                          setRatingFreeConfigs((prev) => {
                                            const rows = prev[param.ratingParameterId] || [];
                                            const updated = rows.map((r) =>
                                              r.id === entry.id
                                                ? {
                                                    ...r,
                                                    rangeEnd: val,
                                                  }
                                                : r,
                                            );
                                            return { ...prev, [param.ratingParameterId]: updated };
                                          })
                                        }
                                        className="w-full"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Select
                                        value={entry.adjustmentType}
                                        onValueChange={(value) =>
                                          updateFreeRowAdjustmentType(
                                            param.ratingParameterId,
                                            entry.id,
                                            value as 'percentage' | 'fixed' | 'factor',
                                          )
                                        }
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="percentage">Percentage</SelectItem>
                                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                                          <SelectItem value="factor">Factor</SelectItem>
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
                                          setRatingFreeConfigs((prev) => {
                                            const rows = prev[param.ratingParameterId] || [];
                                            const updated = rows.map((r) =>
                                              r.id === entry.id
                                                ? {
                                                    ...r,
                                                    adjustmentValue: val,
                                                  }
                                                : r,
                                            );
                                            return { ...prev, [param.ratingParameterId]: updated };
                                          })
                                        }
                                        className="w-full"
                                      />
                                    </TableCell>
                                    {/* {normalizedSection === 'premiumLimit' ? (
                                      <>
                                        <TableCell>
                                          <Select
                                            value={
                                              entry.premiumAdjustmentType ?? entry.adjustmentType
                                            }
                                            onValueChange={(value) =>
                                              setRatingFreeConfigs((prev) => {
                                                const rows = prev[param.ratingParameterId] || [];
                                                const updated = rows.map((r) =>
                                                  r.id === entry.id
                                                    ? {
                                                        ...r,
                                                        premiumAdjustmentType: value as
                                                          | 'percentage'
                                                          | 'fixed',
                                                      }
                                                    : r,
                                                );
                                                return {
                                                  ...prev,
                                                  [param.ratingParameterId]: updated,
                                                };
                                              })
                                            }
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
                                          <FormattedNumberInput
                                            value={entry.minPremiumValue ?? 0}
                                            onChange={(val) =>
                                              setRatingFreeConfigs((prev) => {
                                                const rows = prev[param.ratingParameterId] || [];
                                                const updated = rows.map((r) =>
                                                  r.id === entry.id
                                                    ? {
                                                        ...r,
                                                        minPremiumValue: val,
                                                      }
                                                    : r,
                                                );
                                                return {
                                                  ...prev,
                                                  [param.ratingParameterId]: updated,
                                                };
                                              })
                                            }
                                            className="w-full"
                                            placeholder="0.00"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <FormattedNumberInput
                                            value={entry.maxPremiumValue ?? 0}
                                            onChange={(val) =>
                                              setRatingFreeConfigs((prev) => {
                                                const rows = prev[param.ratingParameterId] || [];
                                                const updated = rows.map((r) =>
                                                  r.id === entry.id
                                                    ? {
                                                        ...r,
                                                        maxPremiumValue: val,
                                                      }
                                                    : r,
                                                );
                                                return {
                                                  ...prev,
                                                  [param.ratingParameterId]: updated,
                                                };
                                              })
                                            }
                                            className="w-full"
                                            placeholder="0.00"
                                          />
                                        </TableCell>
                                      </>
                                    ) : null} */}
                                    <TableCell>
                                      <Select
                                        value={entry.quoteAction}
                                        onValueChange={(value) =>
                                          setRatingFreeConfigs((prev) => {
                                            const rows = prev[param.ratingParameterId] || [];
                                            const updated = rows.map((r) =>
                                              r.id === entry.id
                                                ? {
                                                    ...r,
                                                    quoteAction: value as
                                                      | 'quote'
                                                      | 'no_quote'
                                                      | 'referral',
                                                  }
                                                : r,
                                            );
                                            return { ...prev, [param.ratingParameterId]: updated };
                                          })
                                        }
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="quote">
                                            <div className="flex items-center gap-2 shrink-0">
                                              <div
                                                className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                  'quote',
                                                )}`}
                                              ></div>
                                              Auto Quote
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="no_quote">
                                            <div className="flex items-center gap-2 shrink-0">
                                              <div
                                                className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                  'no_quote',
                                                )}`}
                                              ></div>
                                              No Quote
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="referral">
                                            <div className="flex items-center gap-2 shrink-0">
                                              <div
                                                className={`w-2 h-2 rounded-full ${getQuoteOptionColor(
                                                  'referral',
                                                )}`}
                                              ></div>
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
                                        onClick={() =>
                                          handleRemoveRow(param.ratingParameterId, entry.id)
                                        }
                                        className="text-destructive hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      );
                    })();
              })()}

            {/* Commission Structure Tab */}
            {activePricingTab === 'commission-structure' && (
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>Commission Structure</CardTitle>
                      <CardDescription>
                        Configure commission structure for the product
                      </CardDescription>
                    </div>
                    <Button onClick={saveConfiguration} disabled={isSaving} size="sm">
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Commission Structure
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!pricingConfig.limits?.minimumPremiumType && (
                    <div className="rounded-md border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 mb-6">
                      <p className="font-medium">Yet to configure this section</p>
                      <p className="text-sm mt-1">Configure policy limits below.</p>
                    </div>
                  )}

                  {/* Commission Structure */}
                  <div className="space-y-4">
                    {/* <h3 className="text-lg font-semibold">Policy Limits</h3> */}
                    <div className="overflow-x-auto">
                      <Table className="table-fixed min-w-[520px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[260px] min-w-[260px] px-4">
                              Commission List
                            </TableHead>
                            <TableHead className="w-[260px] min-w-[260px] px-4">Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* <TableRow>
                          <TableCell className="font-medium">Maximum Cover</TableCell>
                          <TableCell>
                            <Select
                              value={pricingConfig.limits.maximumCoverType}
                              onValueChange={(value) => updateLimits("maximumCoverType", value)}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="currency">{productInfo.currency}</SelectItem>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="factor">Factor</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={pricingConfig.limits.maximumCoverValue}
                              onChange={(e) =>
                                updateLimits("maximumCoverValue", Number(e.target.value))
                              }
                              className="max-w-xs"
                            />
                          </TableCell>
                        </TableRow> */}
                          {/* <TableRow>
                          <TableCell className="font-medium">Minimum Premium</TableCell>
                          <TableCell>
                            <Select
                              value={pricingConfig.limits.minimumPremiumType}
                              onValueChange={(value) => updateLimits("minimumPremiumType", value)}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="currency">{productInfo.currency}</SelectItem>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="factor">Factor</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={pricingConfig.limits.minimumPremiumValue}
                              onChange={(e) =>
                                updateLimits("minimumPremiumValue", Number(e.target.value))
                              }
                              className="max-w-xs"
                            />
                          </TableCell>
                        </TableRow> */}
                          <TableRow>
                            <TableCell className="font-medium w-[260px] min-w-[260px]">
                              Base Broker Commission
                            </TableCell>
                            <TableCell className="w-[260px] min-w-[260px]">
                              <div className="flex items-center gap-2 min-w-[220px]">
                                <FormattedNumberInput
                                  value={pricingConfig.limits?.brokerCommissionPercent || 0}
                                  onChange={(val) => updateLimits('brokerCommissionPercent', val)}
                                  min={0}
                                  max={100}
                                  allowDecimals={true}
                                  maxDecimals={2}
                                  className="w-[180px] min-w-[180px]"
                                />
                                <span className="text-sm text-muted-foreground font-medium">%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium w-[260px] min-w-[260px]">
                              Maximum Broker Commission
                            </TableCell>
                            <TableCell className="w-[260px] min-w-[260px]">
                              <div className="flex items-center gap-2 min-w-[220px]">
                                <FormattedNumberInput
                                  value={pricingConfig.limits?.maxBrokerCommissionPercent || 0}
                                  onChange={(val) =>
                                    updateLimits('maxBrokerCommissionPercent', val)
                                  }
                                  min={0}
                                  max={100}
                                  allowDecimals={true}
                                  maxDecimals={2}
                                  className="w-[180px] min-w-[180px]"
                                />
                                <span className="text-sm text-muted-foreground font-medium">%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium w-[260px] min-w-[260px]">
                              Minimum Broker Commission
                            </TableCell>
                            <TableCell className="w-[260px] min-w-[260px]">
                              <div className="flex items-center gap-2 min-w-[220px]">
                                <FormattedNumberInput
                                  value={pricingConfig.limits?.minBrokerCommissionPercent || 0}
                                  onChange={(val) =>
                                    updateLimits('minBrokerCommissionPercent', val)
                                  }
                                  min={0}
                                  max={100}
                                  allowDecimals={true}
                                  maxDecimals={2}
                                  className="w-[180px] min-w-[180px]"
                                />
                                <span className="text-sm text-muted-foreground font-medium">%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fee Types Tab */}
            {activePricingTab === 'fee-types' && (
              <Card className="border border-border bg-card">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Fee Types</CardTitle>
                    <CardDescription>
                      Configure fee types and their values (VAT, GST, etc.)
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={addFeeTypeEntry}>
                      Add Row
                    </Button>
                    <Button onClick={saveConfiguration} disabled={isSaving} size="sm">
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Fee Types
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table className="table-fixed min-w-[960px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[240px] min-w-[240px]">Label</TableHead>
                          <TableHead className="w-[220px] min-w-[220px]">Pricing Type</TableHead>
                          <TableHead className="w-[220px] min-w-[220px]">Value</TableHead>
                          <TableHead className="w-[180px] min-w-[180px]">Status</TableHead>
                          <TableHead className="w-[100px] min-w-[100px] text-center">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pricingConfig.feeTypes.map((fee, rowIndex) => {
                          const isOrgNull = fee.organizationId === null;
                          const isApiRow = !fee.isNew;
                          const disableAll = isApiRow && isOrgNull && fee.isEditable === false;
                          const partialEdit = isApiRow && isOrgNull && fee.isEditable === true;
                          const disableDelete =
                            pricingConfig.feeTypes.length === 1 && rowIndex === 0;

                          return (
                            <TableRow key={fee.id} className={disableAll ? 'opacity-60' : ''}>
                              <TableCell className="w-[240px] min-w-[240px]">
                                <Input
                                  type="text"
                                  value={fee.label}
                                  disabled={disableAll || partialEdit}
                                  onChange={(e) =>
                                    updateFeeTypeEntry(fee.id, 'label', e.target.value)
                                  }
                                  className="w-full"
                                  placeholder="Enter fee type name"
                                />
                              </TableCell>
                              <TableCell className="w-[220px] min-w-[220px]">
                                <Select
                                  value={fee.pricingType}
                                  disabled={disableAll}
                                  onValueChange={(value) =>
                                    updateFeeTypeEntry(fee.id, 'pricingType', value)
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="percentage">Percentage</SelectItem>
                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                    <SelectItem value="factor">Factor</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="w-[220px] min-w-[220px]">
                                <div className="flex items-center gap-2 min-w-[180px]">
                                  <FormattedNumberInput
                                    value={parseFloat(fee.value) || 0}
                                    disabled={disableAll}
                                    min={0}
                                    max={fee.pricingType === 'percentage' ? 100 : undefined}
                                    allowDecimals={true}
                                    maxDecimals={fee.pricingType === 'percentage' ? 2 : undefined}
                                    onChange={(val) =>
                                      updateFeeTypeEntry(fee.id, 'value', String(val))
                                    }
                                    className="w-[140px] min-w-[140px]"
                                  />
                                  <span className="min-w-[28px] text-sm text-muted-foreground whitespace-nowrap">
                                    {fee.pricingType === 'percentage'
                                      ? '%'
                                      : fee.pricingType === 'factor'
                                        ? 'x'
                                        : 'AED'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="w-[180px] min-w-[180px]">
                                <Select
                                  value={fee.status}
                                  disabled={disableAll || partialEdit}
                                  onValueChange={(value) =>
                                    updateFeeTypeEntry(fee.id, 'status', value)
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="w-[100px] min-w-[100px] text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={disableAll || partialEdit || disableDelete}
                                  onClick={() => removeFeeTypeEntry(fee.id)}
                                  className="text-destructive hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Endorsement Fees Content */}
            {activePricingTab === 'endorsement-fees' && (
              <EndorsementFeesConfigurator
                insurerId={getInsurerCompanyId() || productInfo?.organizationId || null}
                productId={productId || productInfo?.id || null}
              />
            )}

            {activePricingTab.startsWith('risk-categorisation-') && (
              <Card className="border border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle>
                      {riskCategories.find((c) => c.id === activeRiskCategoryId)?.name ||
                        'Risk Categorisation'}
                    </CardTitle>
                    <CardDescription>
                      Configure risk category level adjustments and quote actions.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(getRiskImportCategoryKey(activeRiskCategoryId))}
                      disabled={!activeRiskCategoryId || !!isExporting}
                    >
                      {isExporting === getRiskImportCategoryKey(activeRiskCategoryId) ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleImportClick(getRiskImportCategoryKey(activeRiskCategoryId))
                      }
                      disabled={!activeRiskCategoryId || !!isImporting}
                    >
                      {isImporting === getRiskImportCategoryKey(activeRiskCategoryId) ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Import
                    </Button>
                    <Button onClick={saveConfiguration} disabled={isSaving} size="sm">
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Risk Categorisation
                    </Button>
                  </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table className="table-fixed min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/4 px-4">Risk Level</TableHead>
                        <TableHead className="w-1/4 px-4">Adjustment Type</TableHead>
                        <TableHead className="w-1/4 px-4">Loading/Discount</TableHead>
                        <TableHead className="w-1/4 px-4">Quote Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {riskCategories.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="py-6 text-center text-sm text-muted-foreground"
                          >
                            No risk categories available. Configure risk categories first.
                          </TableCell>
                        </TableRow>
                      )}
                      {pricingConfig.riskCategorisations
                        .filter((entry) => entry.riskCategoryId === activeRiskCategoryId)
                        .map((entry) => {
                          const selectedCategory = riskCategories.find(
                            (category) => category.id === entry.riskCategoryId,
                          );
                          const levelLabel =
                            selectedCategory?.riskLevels.find(
                              (level) => level.id === entry.riskLevelId,
                            )?.label || entry.riskLevelId;

                          return (
                            <TableRow key={entry.id}>
                              <TableCell>
                                <Input value={levelLabel} readOnly />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={entry.adjustmentType}
                                  onValueChange={(value) => {
                                    updateRiskCategorisationEntry(entry.id, 'adjustmentType', value);
                                    if (value === 'percentage' && parseFloat(entry.adjustmentValue) > 100) {
                                      updateRiskCategorisationEntry(entry.id, 'adjustmentValue', '0');
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="percentage">Percentage</SelectItem>
                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                    <SelectItem value="factor">Factor</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <FormattedNumberInput
                                    value={parseFloat(entry.adjustmentValue) || 0}
                                    min={0}
                                    max={entry.adjustmentType === 'percentage' ? 100 : undefined}
                                    allowDecimals={true}
                                    maxDecimals={entry.adjustmentType === 'percentage' ? 2 : undefined}
                                    onChange={(val) =>
                                      updateRiskCategorisationEntry(
                                        entry.id,
                                        'adjustmentValue',
                                        String(val),
                                      )
                                    }
                                    className="flex-1 min-w-0"
                                  />
                                  <span className="text-sm text-muted-foreground w-8 text-left shrink-0">
                                    {entry.adjustmentType === 'percentage'
                                      ? '%'
                                      : entry.adjustmentType === 'factor'
                                        ? 'x'
                                        : 'AED'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={entry.quoteAction}
                                  onValueChange={(value) =>
                                    updateRiskCategorisationEntry(entry.id, 'quoteAction', value)
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="quote">
                                      <div className="flex items-center gap-2 shrink-0">
                                        <div
                                          className={`w-2 h-2 rounded-full ${getQuoteOptionColor('quote')}`}
                                        ></div>
                                        Auto Quote
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="no_quote">
                                      <div className="flex items-center gap-2 shrink-0">
                                        <div
                                          className={`w-2 h-2 rounded-full ${getQuoteOptionColor('no_quote')}`}
                                        ></div>
                                        No Quote
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="referral">
                                      <div className="flex items-center gap-2 shrink-0">
                                        <div
                                          className={`w-2 h-2 rounded-full ${getQuoteOptionColor('referral')}`}
                                        ></div>
                                        Referral
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </CardContent>

      <AlertDialog open={!!rowToDelete} onOpenChange={(open) => !open && setRowToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the parameter row.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveRow}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        className="hidden"
        accept=".xlsx,.xls,.csv"
      />
    </Card>
  );
};

export default PricingConfigurator;
