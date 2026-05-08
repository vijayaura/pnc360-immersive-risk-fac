import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Plus, ChevronUp, ChevronDown, Shield, FileText, Info, ListCheck, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { QuotesComparisonInsurerConfig } from '@/features/quotes/api/quotes';
import * as LibUtils from '@/shared/utils/lib-utils';
import { ProductSection, ProductCover } from '@/features/product-config/api/products';

export interface CEWOption {
  id: string;
  label: string;
  description: string;
  limits: string;
  type: 'percentage' | 'fixed';
  value: number;
  recommended?: boolean;
}

export interface CEWItem {
  id: string;
  code: string;
  name: string;
  type: 'condition' | 'extension' | 'warranty';
  category: string;
  description: string;
  isMandatory: boolean;
  isSelected: boolean;
  isPremium?: boolean;
  pricingType: 'percentage' | 'fixed';
  originalPricingType?: string;
  options: CEWOption[];
  selectedOptionId?: string;
  selectedOption?: CEWOption | null;
  impact: {
    coverage: string;
    premium: 'increase' | 'decrease' | 'neutral';
    premiumAmount: number;
  };
  defaultValue: number;
  premiumAmount?: number;
  selected_covers?: any[];
  /** Normalized cover ids extracted from `selected_covers` (or other shapes). */
  selectedCoverIds?: string[];
  /** When a clause applies to multiple covers, each cover gets its own row; this is that cover's id. */
  scopeCoverId?: string;
  /** Clause id from config before per-cover row expansion (for restore / outbound). */
  sourceClauseId?: string;
}

export interface TPLOption {
  id: number;
  label: string;
  value: number;
  description: string;
  premiumAdjustment: number;
  pricingType: 'percentage' | 'fixed';
  recommended?: boolean;
}

export interface DeductibleOption {
  id: number;
  label: string;
  value: number;
  description: string;
  discount: number;
  premiumAdjustment: number;
  pricingType: 'percentage' | 'fixed';
}

interface ScrollHintContainerProps {
  children: React.ReactNode;
}

const ScrollHintContainer = ({ children }: ScrollHintContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftHint, setShowLeftHint] = useState(false);
  const [showRightHint, setShowRightHint] = useState(false);

  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    // Show left hint if we scrolled away from start
    setShowLeftHint(scrollLeft > 20);
    // Show right hint if we are not at the end
    setShowRightHint(scrollLeft < scrollWidth - clientWidth - 20);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    // Initial check might be wrong if content hasn't rendered yet
    const timeoutId = setTimeout(checkScroll, 100);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timeoutId);
    };
  }, [checkScroll, children]);

  return (
    <div className="relative group/scroll">
      {/* Right hint — only shown when scrollable right */}
      {showRightHint && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-background to-transparent z-10 flex items-center justify-end pr-0.5">
          <ChevronRight className="w-4 h-4 text-primary/50" />
        </div>
      )}

      {/* Left hint — only shown when scrollable left */}
      {showLeftHint && (
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-background to-transparent z-10 flex items-center justify-start pl-0.5">
          <ChevronLeft className="w-4 h-4 text-primary/50" />
        </div>
      )}

      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto pb-1 pr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
};

interface CEWSelectionProps {
  currency: string;
  onSelectionChange?: (selectedItems: CEWItem[]) => void;
  onPremiumChange?: (totalAdjustment: number) => void;
  onTPLAdjustmentChange?: (percentage: number, fixed: number) => void;
  onCEWAdjustmentChange?: (percentage: number, fixed: number) => void;
  onMandatoryCEWAdjustmentChange?: (percentage: number, fixed: number) => void;
  onTPLSelectionChange?: (tplOption: TPLOption | null) => void;
  onDeductibleAdjustmentChange?: (percentage: number, fixed: number) => void;
  onDeductibleSelectionChange?: (deductibleOption: DeductibleOption | null) => void;
  productConfigBundle?: QuotesComparisonInsurerConfig;
  isLoadingProductConfig?: boolean;
  storedSelections?: CEWItem[];
  storedBrokerCommission?: number;
  quoteId?: number | string;
  storedTPLSelectionValue?: number;
  storedDeductibleSelectionValue?: number;
  productType?: string;
  productSections?: ProductSection[];
  isCartLikeCoverSelection?: boolean;
  coverSelectionContent?: React.ReactNode;
  /** When false, hide the cover/cart block at the bottom (Add on tab). Default true. */
  showCoverSelectionSlot?: boolean;
}

export const CEWSelection = ({
  currency,
  onSelectionChange,
  onPremiumChange,
  onTPLAdjustmentChange,
  onCEWAdjustmentChange,
  onMandatoryCEWAdjustmentChange,
  onTPLSelectionChange,
  onDeductibleAdjustmentChange,
  onDeductibleSelectionChange,
  productConfigBundle,
  isLoadingProductConfig,
  storedSelections,
  storedBrokerCommission,
  quoteId,
  storedTPLSelectionValue,
  storedDeductibleSelectionValue,
  productType,
  productSections,
  isCartLikeCoverSelection,
  coverSelectionContent,
  showCoverSelectionSlot = true,
}: CEWSelectionProps) => {
  const GLOBAL_COVER_ID = '__GLOBAL__';

  const toIdString = useCallback((v: unknown): string | null => {
    if (v == null) return null;
    const s = String(v).trim();
    return s.length > 0 && s !== 'undefined' && s !== 'null' ? s : null;
  }, []);

  const normalizeString = useCallback((str: string | null | undefined): string => {
    if (!str) return '';
    return str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '');
  }, []);

  const isPercentagePricingType = useCallback(
    (pricingType: string | null | undefined): boolean =>
      normalizeString(pricingType).includes('percent'),
    [normalizeString],
  );

  const getDisplayPricingType = useCallback(
    (pricingType: string | null | undefined): 'percentage' | 'fixed' =>
      isPercentagePricingType(pricingType) ? 'percentage' : 'fixed',
    [isPercentagePricingType],
  );

  const extractCoverId = useCallback(
    (sc: any): string | null => {
      if (sc == null) return null;
      if (typeof sc !== 'object') return toIdString(sc);

      // Common shapes from APIs / older UI payloads
      return (
        toIdString(sc.id) ||
        toIdString(sc.coverId) ||
        toIdString(sc.cover_id) ||
        toIdString(sc.cover?.id) ||
        toIdString(sc.cover?.coverId) ||
        toIdString(sc.cover?.cover_id)
      );
    },
    [toIdString],
  );

  const normalizeSelectedCoverIds = useCallback(
    (selectedCovers: any): string[] => {
      if (!Array.isArray(selectedCovers)) return [];
      const ids = selectedCovers.map(extractCoverId).filter((v): v is string => !!v);
      return Array.from(new Set(ids));
    },
    [extractCoverId],
  );

  // Multi-Cover UI State
  const [activeCoverId, setActiveCoverId] = useState<string | null>(null);

  const allCoversFromSections: ProductCover[] = useMemo(() => {
    return (productSections ?? []).flatMap((s) => s.covers ?? []);
  }, [productSections]);

  const coverIdSetFromConfig = useMemo(() => {
    const clauses = (productConfigBundle as any)?.clause_pricing_config;
    if (!Array.isArray(clauses)) return null;

    const ids: string[] = [];
    for (const c of clauses) {
      const raw =
        (c as any)?.selected_covers ??
        (c as any)?.selectedCovers ??
        (c as any)?.selectedCoverIds ??
        (c as any)?.covers ??
        [];
      ids.push(...normalizeSelectedCoverIds(raw));
    }

    const uniq = Array.from(new Set(ids));
    return uniq.length > 0 ? new Set(uniq) : null;
  }, [productConfigBundle, normalizeSelectedCoverIds]);

  const availableCovers: ProductCover[] = useMemo(() => {
    if (!coverIdSetFromConfig) return allCoversFromSections;
    return allCoversFromSections.filter((c) => coverIdSetFromConfig.has(String(c.id)));
  }, [allCoversFromSections, coverIdSetFromConfig]);

  // State for expanded/collapsed clauses - auto-expand mandatory clauses
  const [expandedClauses, setExpandedClauses] = useState<Set<string>>(new Set());

  // CEW items state
  const [cewItems, setCEWItems] = useState<CEWItem[]>([]);

  // TPL and Deductible States
  const [selectedTPLLimit, setSelectedTPLLimit] = useState<number | null>(null);
  const [selectedDeductible, setSelectedDeductible] = useState<number | null>(null);

  const resolvePreferredCoverId = useCallback(
    (items: CEWItem[]): string | null => {
      const availableCoverIds = new Set(
        availableCovers
          .map((cover) => String(cover.id || '').trim())
          .filter(Boolean),
      );
      if (availableCoverIds.size === 0) return null;

      const selectedScopedItem = items.find((item) => {
        if (!item.isSelected) return false;

        const scopeCoverId = String(item.scopeCoverId || '').trim();
        if (scopeCoverId) return availableCoverIds.has(scopeCoverId);

        const selectedCoverIds =
          item.selectedCoverIds && item.selectedCoverIds.length > 0
            ? item.selectedCoverIds
            : normalizeSelectedCoverIds(item.selected_covers);

        return selectedCoverIds.some((coverId) =>
          availableCoverIds.has(String(coverId || '').trim()),
        );
      });

      if (!selectedScopedItem) {
        return availableCovers[0]?.id ? String(availableCovers[0].id) : null;
      }

      const scopedId = String(selectedScopedItem.scopeCoverId || '').trim();
      if (scopedId) return scopedId;

      const selectedCoverIds =
        selectedScopedItem.selectedCoverIds && selectedScopedItem.selectedCoverIds.length > 0
          ? selectedScopedItem.selectedCoverIds
          : normalizeSelectedCoverIds(selectedScopedItem.selected_covers);

      const matchedCoverId = selectedCoverIds.find((coverId) =>
        availableCoverIds.has(String(coverId || '').trim()),
      );

      return matchedCoverId ? String(matchedCoverId).trim() : String(availableCovers[0]?.id || '');
    },
    [availableCovers, normalizeSelectedCoverIds],
  );

  // --- Auto-select cover for Multi Cover flow, preferring stored selected_covers ---
  useEffect(() => {
    if (
      productType?.toLowerCase() !== 'multi cover' &&
      productType?.toLowerCase() !== 'multi_cover'
    ) {
      return;
    }

    if (availableCovers.length === 0 || activeCoverId) return;

    const preferredCoverId = resolvePreferredCoverId(cewItems);
    if (preferredCoverId) {
      setActiveCoverId(preferredCoverId);
    }
  }, [productType, availableCovers, activeCoverId, cewItems, resolvePreferredCoverId]);

  // Initialization Flags
  const [isInitialized, setIsInitialized] = useState(false);

  const getNextSingleSelection = useCallback(
    <T,>(currentSelection: T | null, clickedSelection: T): T | null => {
      return currentSelection === clickedSelection ? null : clickedSelection;
    },
    [],
  );

  // --- Helper: Calculate Premium Impact for a Single CEW Item ---
  const calculateItemPremiumImpact = useCallback(
    (item: CEWItem): { value: number; type: 'percentage' | 'fixed' } => {
      // Rule 4: If card is not selected, no impact
      if (!item.isSelected) return { value: 0, type: 'percentage' };

      const selectedOption = item.options.find((opt) => opt.id === item.selectedOptionId);

      if (selectedOption) {
        // Rule 2: Card selected + option selected
        if (item.isMandatory) {
          // For mandatory clauses: calculate difference between selected option and base price
          const baseValue = item.defaultValue;
          const selectedValue = selectedOption.value;
          const difference = selectedValue - baseValue;

          return {
            value: difference,
            type: selectedOption.type === 'percentage' ? 'percentage' : 'fixed',
          };
        } else {
          // For optional clauses: use full selected option value
          return {
            value: selectedOption.value,
            type: selectedOption.type === 'percentage' ? 'percentage' : 'fixed',
          };
        }
      } else {
        // Rule 1: Card selected + no option selected = use base rate
        if (item.isMandatory) {
          // Mandatory clauses with no option selected = 0 adjustment (base already included)
          return { value: 0, type: 'percentage' };
        } else {
          // Optional clauses with no option selected = use base rate
          return {
            value: item.defaultValue,
            type: item.pricingType === 'percentage' ? 'percentage' : 'fixed',
          };
        }
      }
    },
    [],
  );

  // --- Transformations ---
  const transformProductConfigToCEWItems = useCallback(
    (configBundle: QuotesComparisonInsurerConfig): CEWItem[] => {
      if (!configBundle?.clause_pricing_config) return [];

      return configBundle.clause_pricing_config.map((clause, index: number) => {
        const isMandatory =
          Number((clause as any).is_mandatory) === 1 || (clause as any).is_mandatory === true;
        const isSelected = isMandatory; // Only mandatory clauses start selected; optional stay off until user opts in
        const clauseId = String(clause.id || clause.clause_code || `clause-${index}`);
        
        // Determine pricing type from config
        const pricingTypeStr = String(clause.pricing_type || '').toLowerCase();
        const pricingType: 'percentage' | 'fixed' = 
          pricingTypeStr === 'fixed' || pricingTypeStr === 'currency' 
            ? 'fixed' 
            : 'percentage';

        const selectedCoversRaw =
          (clause as any).selected_covers ??
          (clause as any).selectedCovers ??
          (clause as any).selectedCoverIds ??
          (clause as any).covers ??
          [];

        const selectedCoverIds = normalizeSelectedCoverIds(selectedCoversRaw);

        return {
          id: clauseId,
          code: clause.clause_code,
          name: clause.title || clause.clause_code,
          type:
            clause.meta?.clause_type &&
            typeof clause.meta.clause_type === 'string' &&
            clause.meta.clause_type.toLowerCase() === 'warranty'
              ? 'warranty'
              : clause.meta?.clause_type &&
                  typeof clause.meta.clause_type === 'string' &&
                  clause.meta.clause_type.toLowerCase() === 'exclusion'
                ? 'condition'
                : 'extension',
          category: (clause.meta?.clause_type as string) || 'Extension',
          description:
            (clause.meta?.purpose_description as string) ||
            (clause.meta?.clause_wording as string) ||
            'No description available',
          isMandatory: isMandatory,
          isSelected: isSelected,
          isPremium: false,
          pricingType: pricingType,
          originalPricingType: clause.pricing_type || '',
          options:
            clause.options?.map((option, optIndex: number) => ({
              id: String(option.id || `${clauseId}-option-${optIndex + 1}`),
              label: option.label,
              description: option.limit,
              limits: option.limit,
              type:
                option.type &&
                typeof option.type === 'string' &&
                option.type.toLowerCase() === 'percentage'
                  ? 'percentage'
                  : 'fixed',
              value: option.value,
              recommended: optIndex === 0,
            })) || [],
          selectedOptionId: undefined,
          impact: {
            coverage: (clause.meta?.clause_wording as string) || 'Standard coverage',
            premium:
              clause.pricing_value > 0
                ? 'increase'
                : clause.pricing_value < 0
                  ? 'decrease'
                  : 'neutral',
            premiumAmount: Math.abs(clause.pricing_value || 0),
          },
          defaultValue: clause.pricing_value || 0,
          selected_covers: Array.isArray(selectedCoversRaw) ? selectedCoversRaw : [],
          selectedCoverIds,
        };
      });
    },
    [normalizeSelectedCoverIds],
  );

  /**
   * One config row linked to multiple covers shares a single React/state entry today, so toggling
   * on cover A appears on cover B. Expand into one CEWItem per cover with a composite `id`.
   */
  const expandCewItemsPerCover = useCallback(
    (items: CEWItem[]): CEWItem[] => {
      const out: CEWItem[] = [];
      for (const item of items) {
        const sourceClauseId = String(item.id);
        const idsRaw =
          item.selectedCoverIds && item.selectedCoverIds.length > 0
            ? item.selectedCoverIds
            : normalizeSelectedCoverIds(item.selected_covers);
        const coverIds = Array.from(new Set(idsRaw.map(String).filter(Boolean)));
        if (coverIds.length <= 1) {
          out.push({
            ...item,
            scopeCoverId: coverIds[0],
            sourceClauseId,
          });
          continue;
        }
        for (const cid of coverIds) {
          out.push({
            ...item,
            id: `${sourceClauseId}__COVER__${cid}`,
            scopeCoverId: cid,
            sourceClauseId,
          });
        }
      }
      return out;
    },
    [normalizeSelectedCoverIds],
  );

  const mergeStoredIntoExpandedItems = useCallback(
    (expanded: CEWItem[], storedSelections: CEWItem[]): CEWItem[] => {
      const getStoredCoverIds = (storedItem: CEWItem): string[] => {
        const scopeCoverId =
          (storedItem as CEWItem & { scopeCoverId?: string }).scopeCoverId ?? null;
        if (scopeCoverId != null && String(scopeCoverId).trim() !== '') {
          return [String(scopeCoverId).trim()];
        }

        const rawSelectedCovers =
          (storedItem as CEWItem & { selectedCoverIds?: string[] }).selectedCoverIds?.length
            ? (storedItem as CEWItem & { selectedCoverIds?: string[] }).selectedCoverIds
            : storedItem.selected_covers;

        return normalizeSelectedCoverIds(rawSelectedCovers);
      };

      const storedMatchesScope = (storedItem: CEWItem, item: CEWItem): boolean => {
        const itemScope = String(item.scopeCoverId || '').trim();
        if (!itemScope) return true;

        const storedCoverIds = getStoredCoverIds(storedItem);
        if (storedCoverIds.length === 0) return false;

        return storedCoverIds.some((coverId) => String(coverId).trim() === itemScope);
      };

      return expanded.map((item) => {
        const scopeFromStored = (s: CEWItem) => (s as CEWItem & { scopeCoverId?: string }).scopeCoverId;
        const normalizeKey = (value: string | null | undefined) =>
          String(value || '')
            .trim()
            .toLowerCase();

        let stored = storedSelections.find((s) => String(s.id) === String(item.id));
        if (!stored) {
          stored = storedSelections.find(
            (s) =>
              item.sourceClauseId != null &&
              String(s.id) === String(item.sourceClauseId) &&
              scopeFromStored(s) != null &&
              item.scopeCoverId != null &&
              String(scopeFromStored(s)) === String(item.scopeCoverId),
          );
        }
        if (!stored) {
          stored = storedSelections.find(
            (s) =>
              item.sourceClauseId != null &&
              String(s.id) === String(item.sourceClauseId) &&
              scopeFromStored(s) == null,
          );
        }
        if (!stored) {
          stored = storedSelections.find(
            (s) =>
              normalizeKey(s.code) !== '' &&
              normalizeKey(s.code) === normalizeKey(item.code) &&
              storedMatchesScope(s, item),
          );
        }
        if (!stored) {
          stored = storedSelections.find(
            (s) =>
              normalizeKey(s.name) !== '' &&
              normalizeKey(s.name) === normalizeKey(item.name) &&
              storedMatchesScope(s, item),
          );
        }

        if (!stored) return item;

        let matchedOptionId = stored.selectedOptionId;
        if (matchedOptionId !== undefined && item.options.length > 0) {
          const exists = item.options.some((o) => o.id === matchedOptionId);
          if (!exists) matchedOptionId = undefined;
        }

        return {
          ...item,
          isSelected: stored.isSelected,
          selectedOptionId: matchedOptionId,
          selectedOption: matchedOptionId
            ? item.options.find((o) => o.id === matchedOptionId) ?? null
            : null,
        };
      });
    },
    [normalizeSelectedCoverIds],
  );

  const itemAppliesToCoverTab = useCallback(
    (item: CEWItem, activeCov: string): boolean => {
      if (item.scopeCoverId != null && String(item.scopeCoverId) !== '') {
        return String(item.scopeCoverId) === String(activeCov);
      }
      const ids =
        item.selectedCoverIds && item.selectedCoverIds.length > 0
          ? item.selectedCoverIds
          : normalizeSelectedCoverIds(item.selected_covers);
      return ids.map(String).includes(String(activeCov));
    },
    [normalizeSelectedCoverIds],
  );

  const transformGlobalCewsToItems = useCallback((configBundle: QuotesComparisonInsurerConfig): CEWItem[] => {
    const list = Array.isArray((configBundle as any)?.globalCews)
      ? (((configBundle as any).globalCews as any[]) ?? [])
      : [];
    if (list.length === 0) return [];

    return list.map((clause: any, index: number) => {
      const isMandatory =
        Number(clause?.is_mandatory ?? clause?.isMandatory ?? 0) === 1 ||
        clause?.is_mandatory === true ||
        clause?.isMandatory === true;
      const clauseId = String(clause?.id || clause?.clause_code || clause?.code || `global-cew-${index}`);

      const pricingTypeStr = String(clause?.pricing_type || clause?.pricingType || '').toLowerCase();
      const pricingType: 'percentage' | 'fixed' =
        pricingTypeStr === 'fixed' || pricingTypeStr === 'currency' ? 'fixed' : 'percentage';

      const optionsRaw = Array.isArray(clause?.options) ? clause.options : [];

      return {
        id: clauseId,
        code: String(clause?.clause_code || clause?.code || clauseId),
        name: String(clause?.title || clause?.name || clause?.clause_code || clause?.code || clauseId),
        type:
          typeof clause?.meta?.clause_type === 'string' && clause.meta.clause_type.toLowerCase() === 'warranty'
            ? 'warranty'
            : typeof clause?.meta?.clause_type === 'string' &&
                clause.meta.clause_type.toLowerCase() === 'exclusion'
              ? 'condition'
              : 'extension',
        category: (clause?.meta?.clause_type as string) || 'Global',
        description:
          (clause?.meta?.purpose_description as string) ||
          (clause?.meta?.clause_wording as string) ||
          (clause?.description as string) ||
          'No description available',
        isMandatory: isMandatory,
        isSelected: isMandatory,
        isPremium: false,
        pricingType,
        originalPricingType: String(clause?.pricing_type || clause?.pricingType || ''),
        options:
          optionsRaw.map((option: any, optIndex: number) => ({
            id: String(option.id || `${clauseId}-option-${optIndex + 1}`),
            label: String(option.label || option.name || `Option ${optIndex + 1}`),
            description: String(option.limit || option.description || ''),
            limits: String(option.limit || ''),
            type:
              typeof option.type === 'string' && option.type.toLowerCase() === 'percentage'
                ? 'percentage'
                : 'fixed',
            value: Number(option.value || 0),
            recommended: optIndex === 0,
          })) || [],
        selectedOptionId: undefined,
        impact: {
          coverage: (clause?.meta?.clause_wording as string) || 'Standard coverage',
          premium:
            Number(clause?.pricing_value || clause?.pricingValue || 0) > 0
              ? 'increase'
              : Number(clause?.pricing_value || clause?.pricingValue || 0) < 0
                ? 'decrease'
                : 'neutral',
          premiumAmount: Math.abs(Number(clause?.pricing_value || clause?.pricingValue || 0)),
        },
        defaultValue: Number(clause?.pricing_value || clause?.pricingValue || 0),
        selected_covers: [],
        selectedCoverIds: [],
      };
    });
  },
  [getDisplayPricingType],
);

  // --- State ---
  const transformTPLExtensions = useCallback(
    (configBundle: QuotesComparisonInsurerConfig): TPLOption[] => {
      if (!configBundle?.tpl_extensions) return [];
      return configBundle.tpl_extensions.map((extension, index: number) => {
        // Determine pricing type from config
        const pricingTypeStr = String(extension.pricing_type || '').toLowerCase();
        const pricingType: 'percentage' | 'fixed' = 
          pricingTypeStr === 'fixed' || pricingTypeStr === 'currency' 
            ? 'fixed' 
            : 'percentage';
            
        return {
          id: parseInt(extension.id) || index + 1,
          label: `${currency} ${(parseFloat(extension.limit_value) / 1000000).toFixed(1)}M`,
          value: parseFloat(extension.limit_value),
          description: extension.description || extension.title,
          premiumAdjustment: extension.pricing_value || 0,
          pricingType: pricingType,
          recommended: index === 0,
        };
      });
    },
    [currency],
  );

  const transformDeductibles = useCallback(
    (configBundle: QuotesComparisonInsurerConfig): DeductibleOption[] => {
      if (!configBundle?.deductibles) return [];
      return configBundle.deductibles
        .map((deductible, index) => {
          // Determine pricing type from config if available, default to percentage for discount
          // Assuming deductible discount is usually a percentage unless specified otherwise
          const pricingTypeStr = String((deductible as unknown as { pricing_type?: string }).pricing_type || '').toLowerCase();
          const pricingType: 'percentage' | 'fixed' = 
            pricingTypeStr === 'fixed' || pricingTypeStr === 'currency' 
              ? 'fixed' 
              : 'percentage';

          return {
            id: parseInt(deductible.id?.toString()) || index + 100000,
            label: LibUtils.formatCurrency(deductible.value, currency),
            value: deductible.value,
            description: `Deductible of ${LibUtils.formatCurrency(deductible.value, currency)}`,
            discount: deductible.discount,
            premiumAdjustment: -Math.abs(deductible.discount),
            pricingType: pricingType,
          };
        })
        .sort((a, b) => a.value - b.value);
    },
    [currency],
  );

  // --- Derived Options ---
  const tplLimitOptions = React.useMemo(
    () => (productConfigBundle ? transformTPLExtensions(productConfigBundle) : []),
    [productConfigBundle, transformTPLExtensions],
  );

  const deductibleOptions = React.useMemo(
    () => (productConfigBundle ? transformDeductibles(productConfigBundle) : []),
    [productConfigBundle, transformDeductibles],
  );

  // --- Unified Premium Calculation ---
  const notifyParentOfUpdates = useCallback(
    (currentItems: CEWItem[], currentTPLId: number | null, currentDeductibleId: number | null) => {
      // 1. CEW Adjustments
      let mandatoryPercentage = 0;
      let mandatoryFixed = 0;
      let optionalPercentage = 0;
      let optionalFixed = 0;

      currentItems.forEach((item) => {
        const impact = calculateItemPremiumImpact(item);
        if (item.isSelected) {
          if (item.isMandatory) {
            if (impact.type === 'percentage') mandatoryPercentage += impact.value;
            else mandatoryFixed += impact.value;
          } else {
            if (impact.type === 'percentage') optionalPercentage += impact.value;
            else optionalFixed += impact.value;
          }
        }
      });

      // 2. TPL Adjustment
      const tplOption = tplLimitOptions.find((opt) => opt.id === currentTPLId);
      const tplAdj = tplOption?.premiumAdjustment || 0;
      const tplType = tplOption?.pricingType || 'percentage';
      const tplPercentage = tplType === 'percentage' ? tplAdj : 0;
      const tplFixed = tplType === 'fixed' ? tplAdj : 0;

      // 3. Deductible Adjustment
      const dedOption = deductibleOptions.find((opt) => opt.id === currentDeductibleId);
      const dedAdj = dedOption?.premiumAdjustment || 0;
      const dedType = dedOption?.pricingType || 'percentage';
      const dedPercentage = dedType === 'percentage' ? dedAdj : 0;
      const dedFixed = dedType === 'fixed' ? dedAdj : 0;

      // 4. Notify Parent
      onMandatoryCEWAdjustmentChange?.(mandatoryPercentage, mandatoryFixed);
      onCEWAdjustmentChange?.(optionalPercentage, optionalFixed);
      onTPLAdjustmentChange?.(tplPercentage, tplFixed);
      onDeductibleAdjustmentChange?.(dedPercentage, dedFixed);
      onTPLSelectionChange?.(tplOption || null);
      onDeductibleSelectionChange?.(dedOption || null);

      // Total Premium - Note: This total is just a scalar sum, which might be misleading if mixing % and fixed.
      // The parent component should recalculate the actual premium amount.
      // We'll just pass 0 or a flag, or keep it as is but it's not strictly correct to sum them.
      // However, onPremiumChange seems to be used for display? 
      // Actually, let's keep it summing for now but rely on the specific callbacks for accurate calc.
      const total =
        mandatoryPercentage + mandatoryFixed + optionalPercentage + optionalFixed + tplAdj + dedAdj;
      onPremiumChange?.(total);

      // Also update parent with selected items list
      onSelectionChange?.(currentItems);
    },
    [
      tplLimitOptions,
      deductibleOptions,
      calculateItemPremiumImpact,
      onMandatoryCEWAdjustmentChange,
      onCEWAdjustmentChange,
      onTPLAdjustmentChange,
      onDeductibleAdjustmentChange,
      onTPLSelectionChange,
      onDeductibleSelectionChange,
      onPremiumChange,
      onSelectionChange,
    ],
  );

  // Identify global items from the state for UI purposes
  const globalItemsInState = useMemo(() => {
    const normKey = (item: CEWItem) =>
      String(item.code || item.id || item.name || '')
        .trim()
        .toLowerCase();

    // If backend provides explicit `globalCews`, Global tab should show ONLY those.
    // Fallback: if no explicit global items exist, treat truly-unscoped clauses as global.
    const explicitGlobals = cewItems.filter((i) => i.category === 'Global');
    const candidates =
      explicitGlobals.length > 0
        ? explicitGlobals
        : cewItems.filter((item) => {
            const hasCoverScope =
              (item.selectedCoverIds && item.selectedCoverIds.length > 0) ||
              (item.scopeCoverId != null && String(item.scopeCoverId) !== '');
            return !hasCoverScope;
          });

    const byKey = new Map<string, CEWItem>();
    for (const item of candidates) {
      const key = normKey(item);
      if (!key) continue;
      if (!byKey.has(key)) byKey.set(key, item);
    }
    return Array.from(byKey.values());
  }, [cewItems]);

  // --- Initialization Effect ---
  useEffect(() => {
    if (productConfigBundle && !isInitialized) {
      let initialItems = transformProductConfigToCEWItems(productConfigBundle);
      initialItems = expandCewItemsPerCover(initialItems);

      // Include Global CEW items in the unified state.
      // Important: backend can also include the same clause inside `clause_pricing_config` with `selected_covers: []`.
      // If we keep both, they share ids/codes and selection toggles can desync with "Selected Extensions".
      const normKey = (item: CEWItem) =>
        String(item.code || item.id || item.name || '')
          .trim()
          .toLowerCase();

      const rawGlobalItems = transformGlobalCewsToItems(productConfigBundle);
      const globalByKey = new Map<string, CEWItem>();
      for (const gi of rawGlobalItems) {
        const k = normKey(gi);
        if (!k) continue;
        if (!globalByKey.has(k)) globalByKey.set(k, gi);
      }
      const globalItems = Array.from(globalByKey.values());

      if (globalItems.length > 0) {
        const globalKeys = new Set(Array.from(globalByKey.keys()));
        initialItems = initialItems.filter((item) => {
          const hasCoverScope =
            (item.selectedCoverIds && item.selectedCoverIds.length > 0) ||
            normalizeSelectedCoverIds(item.selected_covers).length > 0 ||
            (item.scopeCoverId != null && String(item.scopeCoverId) !== '');
          if (hasCoverScope) return true;
          const k = normKey(item);
          return !k || !globalKeys.has(k);
        });
      }

      initialItems = [...initialItems, ...globalItems];

      if (storedSelections && storedSelections.length > 0) {
        initialItems = mergeStoredIntoExpandedItems(initialItems, storedSelections);
        const expanded = new Set<string>();
        initialItems.forEach((it) => {
          if (it.isSelected && it.options.length > 0) expanded.add(it.id);
        });
        setExpandedClauses(expanded);
      }

      let initialTPL = null;
      let initialDeductible = null;

      // Apply Stored TPL
      if (storedTPLSelectionValue !== undefined && tplLimitOptions.length > 0) {
        const found = tplLimitOptions.find(
          (opt) => Number(opt.value) === Number(storedTPLSelectionValue),
        );
        if (found) initialTPL = found.id;
      }

      // Apply Stored Deductible
      if (storedDeductibleSelectionValue !== undefined && deductibleOptions.length > 0) {
        const found = deductibleOptions.find(
          (opt) => Number(opt.value) === Number(storedDeductibleSelectionValue),
        );
        if (found) initialDeductible = found.id;
      }

      // Set State
      setCEWItems(initialItems);
      setSelectedTPLLimit(initialTPL);
      setSelectedDeductible(initialDeductible);
      if (
        productType?.toLowerCase() === 'multi cover' ||
        productType?.toLowerCase() === 'multi_cover'
      ) {
        const preferredCoverId = resolvePreferredCoverId(initialItems);
        if (preferredCoverId) {
          setActiveCoverId(preferredCoverId);
        }
      }

      // Calculate initial premiums and notify parent
      notifyParentOfUpdates(initialItems, initialTPL, initialDeductible);

      setIsInitialized(true);
    }
  }, [
    productConfigBundle,
    isInitialized,
    storedSelections,
    storedTPLSelectionValue,
    storedDeductibleSelectionValue,
    transformProductConfigToCEWItems,
    expandCewItemsPerCover,
    mergeStoredIntoExpandedItems,
    productType,
    resolvePreferredCoverId,
    tplLimitOptions,
    deductibleOptions,
    notifyParentOfUpdates,
  ]);

  // --- Handlers ---

  const handleTPLLimitChange = (idStr: string) => {
    const id = parseInt(idStr);
    const newId = getNextSingleSelection(selectedTPLLimit, id);

    setSelectedTPLLimit(newId);
    notifyParentOfUpdates(cewItems, newId, selectedDeductible);
  };

  const handleDeductibleChange = (id: number) => {
    const newId = getNextSingleSelection(selectedDeductible, id);

    setSelectedDeductible(newId);
    notifyParentOfUpdates(cewItems, selectedTPLLimit, newId);
  };

  const toggleSelection = (itemId: string) => {
    const updatedItems = cewItems.map((item) => {
      if (item.id !== itemId) return item;

      // Prevent unselecting mandatory items
      if (item.isMandatory && item.isSelected) return item;

      return { ...item, isSelected: !item.isSelected };
    });

    setCEWItems(updatedItems);
    notifyParentOfUpdates(updatedItems, selectedTPLLimit, selectedDeductible);
  };

  const updateSelection = (itemId: string, optionId: string) => {
    const updatedItems = cewItems.map((item) => {
      if (item.id !== itemId) return item;

      const isSameOption = item.selectedOptionId === optionId;

      if (isSameOption) {
        // Deselecting the option
        const shouldRemainSelected = item.isMandatory;
        return {
          ...item,
          isSelected: shouldRemainSelected, // Mandatory stays selected, Optional gets deselected
          selectedOptionId: undefined,
          selectedOption: null,
        };
      } else {
        // Selecting a new option
        const selectedOption = item.options.find((opt) => opt.id === optionId);
        return {
          ...item,
          isSelected: true, // Always select card when option is clicked
          selectedOptionId: optionId,
          selectedOption: selectedOption || null,
        };
      }
    });

    setCEWItems(updatedItems);
    notifyParentOfUpdates(updatedItems, selectedTPLLimit, selectedDeductible);
  };

  // --- UI Helpers ---
  const toggleClauseExpansion = (itemId: string) => {
    setExpandedClauses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      return newSet;
    });
  };

  const getPotentialImpact = (item: CEWItem): number => {
    if (!item.isSelected) return 0;
    const selectedOption = item.options.find((opt) => opt.id === item.selectedOptionId);
    if (selectedOption) {
      return selectedOption.type === 'percentage'
        ? selectedOption.value
        : selectedOption.value / 1000;
    } else {
      return item.defaultValue;
    }
  };

  const formatPotentialImpact = (item: CEWItem) => {
    if (!item.isSelected) {
      return 'Not selected';
    }
    if (item.selectedOptionId) {
      const selectedOption = item.options.find((opt) => opt.id === item.selectedOptionId);
      if (selectedOption) {
        const sign = selectedOption.value > 0 ? '+' : '';
        if (selectedOption.type === 'percentage') return `Selected ${sign}${LibUtils.formatNumber(selectedOption.value)}%`;
        return `Selected ${sign}${LibUtils.formatCurrency(selectedOption.value, currency)}`;
      }
    }

    const baseRate = item.defaultValue;
    if (baseRate === 0) return 'No impact';

    const isPercentage = item.pricingType === 'percentage';
    const sign = baseRate > 0 ? '+' : '';

    if (isPercentage) return `${sign}${LibUtils.formatNumber(baseRate)}%`;
    return `${sign}${LibUtils.formatCurrency(baseRate, currency)}`;
  };

  const renderCEWCard = (item: CEWItem) => (
    <div
      key={item.id}
      className={`p-4 border rounded-xl transition-all ${
        item.isMandatory
          ? 'bg-emerald-50 border-emerald-200'
          : item.isSelected
            ? 'bg-emerald-50/60 border-emerald-200'
            : 'bg-card border-border hover:border-emerald-200/60'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox/Status */}
        <div className="relative mt-0.5">
          <input
            type="checkbox"
            checked={item.isSelected}
            onChange={() => toggleSelection(item.id)}
            disabled={item.isMandatory && item.isSelected}
            className="sr-only"
            id={`checkbox-${item.id}`}
          />
          <label
            htmlFor={`checkbox-${item.id}`}
            className={`w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
              item.isMandatory && item.isSelected
                ? 'bg-emerald-500 border-emerald-500 text-white cursor-not-allowed'
                : item.isSelected
                  ? 'bg-emerald-500 border-emerald-500 text-white cursor-pointer'
                  : 'bg-background border-gray-300 hover:border-emerald-400/60 hover:bg-emerald-50/40 cursor-pointer'
            }`}
          >
            {item.isSelected && <CheckCircle2 className="w-3 h-3" />}
          </label>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-semibold leading-snug ${item.isMandatory ? 'text-emerald-900' : 'text-foreground'}`}>
                {item.name}
              </span>
            </div>
            {/* Right side: impact + view options */}
            <div className="flex items-center gap-2 shrink-0">
              {item.isSelected && (
                <span
                  className={`text-xs font-semibold ${
                    getPotentialImpact(item) > 0
                      ? 'text-emerald-600'
                      : getPotentialImpact(item) < 0
                        ? 'text-success'
                        : 'text-muted-foreground'
                  }`}
                >
                  {formatPotentialImpact(item)}
                </span>
              )}
              {!item.isSelected && (
                <span className="text-xs text-muted-foreground">Not selected</span>
              )}
              {item.options.length > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => toggleClauseExpansion(item.id)}
                  className="text-xs h-6 px-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0 gap-1"
                >
                  {expandedClauses.has(item.id) ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                  View Options
                </Button>
              )}
            </div>
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono text-muted-foreground border-border/60">
              {item.code}
            </Badge>
            <Badge
              className={`text-[10px] px-1.5 py-0 h-4 font-medium ${
                item.type === 'extension'
                  ? 'bg-emerald-500 hover:bg-emerald-500 text-white'
                  : item.type === 'condition'
                    ? 'bg-slate-500 hover:bg-slate-500 text-white'
                    : 'bg-amber-500 hover:bg-amber-500 text-white'
              }`}
            >
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Badge>
            {item.isMandatory && (
              <Badge className="text-[10px] px-1.5 py-0 h-4 font-medium bg-red-500 hover:bg-red-500 text-white">
                Mandatory
              </Badge>
            )}
          </div>

          {/* Available Options Grid - Only show when expanded */}
          {expandedClauses.has(item.id) && (
            <div className="space-y-2 mt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {item.options.map((option) => {
                  const isSelected = option.id === item.selectedOptionId;
                  return (
                    <Card
                      key={option.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                          : 'border-border hover:border-emerald-300'
                      }`}
                      onClick={() => updateSelection(item.id, option.id)}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">
                              {option.label}
                            </h3>
                          </div>
                          <p className="text-xs text-muted-foreground leading-tight">
                            {(() => {
                              const raw = option.description;
                              if (raw != null && raw !== '' && !isNaN(Number(raw)) && String(raw).trim() !== '') {
                                return option.type === 'fixed'
                                  ? LibUtils.formatCurrency(Number(raw), currency)
                                  : `${LibUtils.formatNumber(Number(raw))}`;
                              }
                              return raw;
                            })()}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-muted-foreground">
                              Premium Impact
                            </span>
                            <span
                              className={`text-xs font-medium ${
                                option.value > 0
                                  ? 'text-warning'
                                  : option.value < 0
                                    ? 'text-success'
                                    : 'text-muted-foreground'
                              }`}
                            >
                              {option.type === 'percentage'
                                ? `${option.value > 0 ? '+' : ''}${LibUtils.formatNumber(option.value)}%`
                                : `${
                                    option.value > 0 ? '+' : ''
                                  }${LibUtils.formatCurrency(option.value, currency).replace(currency + ' ', '')}`}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-1 pt-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span className="text-xs text-emerald-600">Selected</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoadingProductConfig) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading product configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-2 space-y-8 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* TPL Limit Extensions - only show when there are options */}
      {tplLimitOptions.length > 0 && (
        <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">TPL Limit Extensions</h2>
            {productConfigBundle?.tpl_limits?.default_limit && (
              <div className="text-sm text-muted-foreground">
                Default: {currency}{' '}
                {LibUtils.formatNumber(parseFloat(productConfigBundle.tpl_limits.default_limit))}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Select your Third Party Liability coverage limit
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {tplLimitOptions.map((option) => {
            const isSelected = selectedTPLLimit === option.id;
            return (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleTPLLimitChange(option.id.toString())}
              >
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">{option.label}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {option.description}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">Premium Impact</span>
                      <span
                        className={`text-xs font-medium ${
                          option.premiumAdjustment > 0
                            ? 'text-warning'
                            : option.premiumAdjustment < 0
                              ? 'text-success'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {option.premiumAdjustment > 0 && '+'}
                        {option.pricingType === 'percentage'
                          ? `${LibUtils.formatNumber(option.premiumAdjustment)}%`
                          : LibUtils.formatCurrency(option.premiumAdjustment, currency)}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1 pt-1">
                        <CheckCircle2 className="w-3 h-3 text-primary" />
                        <span className="text-xs text-primary">Selected</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        </div>
      )}

      {/* Deductibles */}
      {deductibleOptions.length > 0 && (
        <div className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Deductibles</h2>
            <p className="text-xs text-muted-foreground">Select your deductible amount</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {deductibleOptions.map((option) => {
              const isSelected = selectedDeductible === option.id;
              return (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleDeductibleChange(option.id)}
                >
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">{option.label}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-tight">
                        {option.description}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-muted-foreground">Premium Impact</span>
                        <span
                          className={`text-xs font-medium ${
                            option.premiumAdjustment > 0
                              ? 'text-warning'
                              : option.premiumAdjustment < 0
                                ? 'text-success'
                                : 'text-muted-foreground'
                          }`}
                        >
                          {option.premiumAdjustment > 0 && '+'}
                          {option.pricingType === 'percentage'
                            ? `${LibUtils.formatNumber(option.premiumAdjustment)}%`
                            : LibUtils.formatCurrency(option.premiumAdjustment, currency)}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1 pt-1">
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                          <span className="text-xs text-primary">Selected</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Policy Extensions & Conditions */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Policy Extensions & Conditions</h2>
          <p className="text-xs text-muted-foreground">
            Customize your coverage with additional protections and specific terms
          </p>
        </div>

        {(productType?.toLowerCase() === 'multi cover' || productType?.toLowerCase() === 'multi_cover') ? (
          <div className="space-y-6 mt-4">
            {((productSections && productSections.length > 0) || globalItemsInState.length > 0) && (
              <ScrollHintContainer>
                {globalItemsInState.length > 0 && (
                  <Card
                    key={GLOBAL_COVER_ID}
                    onClick={(e) => {
                      setActiveCoverId(GLOBAL_COVER_ID);
                      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }}
                    className={`cursor-pointer transition-all duration-300 border-2 min-w-[200px] grow-0 shrink-0 relative overflow-hidden group hover:shadow-md active:scale-[0.98] ${
                      String(activeCoverId) === GLOBAL_COVER_ID
                        ? 'bg-emerald-50 border-[#10b981] shadow-sm shadow-emerald-500/10'
                        : 'bg-white border-slate-100 hover:border-[#10b981]/30 text-slate-600'
                    }`}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shadow-sm ${String(activeCoverId) === GLOBAL_COVER_ID ? 'bg-[#10b981] text-white' : 'bg-slate-50 text-[#10b981] group-hover:bg-emerald-50'}`}>
                        <Shield className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold transition-colors mb-0.5 ${String(activeCoverId) === GLOBAL_COVER_ID ? 'text-emerald-900' : 'text-slate-700'}`}>
                          Global Covers
                        </span>
                        <Badge
                          variant={String(activeCoverId) === GLOBAL_COVER_ID ? 'default' : 'outline'}
                          className={`w-fit text-[9px] px-1.5 py-0 rounded-md font-medium tracking-tight ${String(activeCoverId) === GLOBAL_COVER_ID ? 'bg-[#10b981] hover:bg-[#10b981]' : 'border-emerald-500/20 text-emerald-700/70 bg-emerald-50/30'}`}
                        >
                          {globalItemsInState.length} Items Available
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {availableCovers
                  .filter((cover) => {
                    // Only show covers that have at least one CEW item
                    const cId = String(cover.id || '');
                    return cewItems.some((i) => itemAppliesToCoverTab(i, cId));
                  })
                  .map((cover) => {
                  const cId = String(cover.id || '');
                  const isActive = String(activeCoverId) === cId;
                  const relevantExtensions = cewItems.filter((i) => itemAppliesToCoverTab(i, cId));
                  const selectedCount = relevantExtensions.filter((i) => i.isSelected).length;
                  return (
                    <Card
                      key={cover.id}
                      onClick={(e) => {
                        setActiveCoverId(cId);
                        e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                      }}
                      className={`cursor-pointer transition-all duration-300 border-2 min-w-[200px] grow-0 shrink-0 relative overflow-hidden group hover:shadow-md active:scale-[0.98] ${
                        isActive
                          ? 'bg-emerald-50 border-[#10b981] shadow-sm shadow-emerald-500/10'
                          : 'bg-white border-slate-100 hover:border-[#10b981]/30 text-slate-600'
                      }`}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shadow-sm ${isActive ? 'bg-[#10b981] text-white' : 'bg-slate-50 text-[#10b981] group-hover:bg-emerald-50'}`}>
                          <Shield className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className={`text-xs font-bold transition-colors truncate max-w-[130px] mb-0.5 ${isActive ? 'text-emerald-900' : 'text-slate-700'}`}>
                            {cover.name}
                          </span>
                          {relevantExtensions.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant={isActive ? 'default' : 'outline'}
                                className={`text-[9px] px-1.5 py-0 rounded-md font-bold ${isActive ? 'bg-emerald-500' : selectedCount > 0 ? 'border-emerald-500/30 text-emerald-600 bg-emerald-50/50' : 'border-slate-200 text-slate-400'}`}
                              >
                                {selectedCount > 0 ? `${selectedCount} / ${relevantExtensions.length}` : `${relevantExtensions.length} Available`}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-[9px] text-muted-foreground opacity-50 italic">Standard</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </ScrollHintContainer>
            )}
            <div className="relative pt-4 border-t border-dashed border-border/80 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {activeCoverId ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {(String(activeCoverId) === GLOBAL_COVER_ID ? globalItemsInState : cewItems)
                      .filter((item) => {
                        if (String(activeCoverId) === GLOBAL_COVER_ID) return true;
                        return itemAppliesToCoverTab(item, String(activeCoverId));
                      })
                      .sort((a, b) => {
                        if (a.isMandatory && !b.isMandatory) return -1;
                        if (!a.isMandatory && b.isMandatory) return 1;
                        return a.name.localeCompare(b.name);
                      })
                      .map((item) => renderCEWCard(item))}
                    {(String(activeCoverId) === GLOBAL_COVER_ID ? globalItemsInState : cewItems).filter((item) => {
                      if (String(activeCoverId) === GLOBAL_COVER_ID) return true;
                      return itemAppliesToCoverTab(item, String(activeCoverId));
                    }).length === 0 && (
                      <div className="flex flex-col items-center justify-center py-24 bg-muted/5 rounded-2xl border-2 border-dashed border-border/40">
                        <div className="relative mb-4">
                          <div className="w-16 h-16 rounded-3xl bg-background flex items-center justify-center shadow-sm">
                            <FileText className="w-8 h-8 opacity-10" />
                          </div>
                        </div>
                        <h5 className="font-bold text-base text-foreground tracking-tight">Standard Coverage</h5>
                        <p className="text-xs text-muted-foreground text-center max-w-[280px] mt-1 opacity-70">
                          Governed by standard policy conditions.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 bg-muted/5 rounded-3xl border border-dashed border-border/50">
                  <div className="w-20 h-20 rounded-3xl bg-card shadow-lg border border-border/50 flex items-center justify-center mb-6">
                    <Shield className="w-10 h-10 text-primary opacity-10" />
                  </div>
                  <h4 className="text-lg font-bold text-foreground tracking-tight uppercase">Selection Required</h4>
                  <p className="text-xs text-muted-foreground text-center max-w-[300px] mt-2 px-6 opacity-70">
                    Select a risk cover above to manage its policy extensions.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {((productSections && productSections.length > 0) || globalItemsInState.length > 0) && (
              <ScrollHintContainer>
                {globalItemsInState.length > 0 && (
                  <Card
                    key={GLOBAL_COVER_ID}
                    onClick={() => setActiveCoverId(GLOBAL_COVER_ID)}
                    className={`cursor-pointer transition-all duration-300 border-2 min-w-[200px] grow-0 shrink-0 relative overflow-hidden group hover:shadow-md active:scale-[0.98] ${
                      String(activeCoverId) === GLOBAL_COVER_ID
                        ? 'bg-emerald-50 border-[#10b981] shadow-sm shadow-emerald-500/10'
                        : 'bg-white border-slate-100 hover:border-[#10b981]/30 text-slate-600'
                    }`}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shadow-sm ${String(activeCoverId) === GLOBAL_COVER_ID ? 'bg-[#10b981] text-white' : 'bg-slate-50 text-[#10b981] group-hover:bg-emerald-50'}`}>
                        <Shield className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold transition-colors mb-0.5 ${String(activeCoverId) === GLOBAL_COVER_ID ? 'text-emerald-900' : 'text-slate-700'}`}>
                          Global Covers
                        </span>
                        <Badge
                          variant={String(activeCoverId) === GLOBAL_COVER_ID ? 'default' : 'outline'}
                          className={`w-fit text-[9px] px-1.5 py-0 rounded-md font-medium tracking-tight ${String(activeCoverId) === GLOBAL_COVER_ID ? 'bg-[#10b981] hover:bg-[#10b981]' : 'border-emerald-500/20 text-emerald-700/70 bg-emerald-50/30'}`}
                        >
                          {globalItemsInState.length} Items Available
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {availableCovers
                  .filter((cover) => {
                    const cId = String(cover.id || '');
                    return cewItems.some((i) => itemAppliesToCoverTab(i, cId));
                  })
                  .map((cover) => {
                  const cId = String(cover.id || '');
                  const isActive = String(activeCoverId) === cId;
                  const relevantExtensions = cewItems.filter((i) => itemAppliesToCoverTab(i, cId));
                  const selectedCount = relevantExtensions.filter((i) => i.isSelected).length;
                  return (
                    <Card
                      key={cover.id}
                      onClick={() => setActiveCoverId(cId)}
                      className={`cursor-pointer transition-all duration-300 border-2 min-w-[200px] grow-0 shrink-0 relative overflow-hidden group hover:shadow-md active:scale-[0.98] ${
                        isActive
                          ? 'bg-emerald-50 border-[#10b981] shadow-sm shadow-emerald-500/10'
                          : 'bg-white border-slate-100 hover:border-[#10b981]/30 text-slate-600'
                      }`}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shadow-sm ${isActive ? 'bg-[#10b981] text-white' : 'bg-slate-50 text-[#10b981] group-hover:bg-emerald-50'}`}>
                          <Shield className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className={`text-xs font-bold transition-colors truncate max-w-[130px] mb-0.5 ${isActive ? 'text-emerald-900' : 'text-slate-700'}`}>
                            {cover.name}
                          </span>
                          {relevantExtensions.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant={isActive ? 'default' : 'outline'}
                                className={`text-[9px] px-1.5 py-0 rounded-md font-bold ${isActive ? 'bg-emerald-500' : selectedCount > 0 ? 'border-emerald-500/30 text-emerald-600 bg-emerald-50/50' : 'border-slate-200 text-slate-400'}`}
                              >
                                {selectedCount > 0 ? `${selectedCount} / ${relevantExtensions.length}` : `${relevantExtensions.length} Available`}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-[9px] text-muted-foreground opacity-50 italic">Standard</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </ScrollHintContainer>
            )}
            <div className="relative pt-4 border-t border-dashed border-border/80">
              {activeCoverId ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="space-y-3 min-h-[200px]">
                    {(String(activeCoverId) === GLOBAL_COVER_ID ? globalItemsInState : cewItems)
                      .filter((item) => {
                        if (String(activeCoverId) === GLOBAL_COVER_ID) return true;
                        return itemAppliesToCoverTab(item, String(activeCoverId));
                      })
                      .sort((a, b) => {
                        if (a.isMandatory && !b.isMandatory) return -1;
                        if (!a.isMandatory && b.isMandatory) return 1;
                        return a.name.localeCompare(b.name);
                      })
                      .map((item) => renderCEWCard(item))}
                    {(String(activeCoverId) === GLOBAL_COVER_ID ? globalItemsInState : cewItems).filter((item) => {
                      if (String(activeCoverId) === GLOBAL_COVER_ID) return true;
                      return itemAppliesToCoverTab(item, String(activeCoverId));
                    }).length === 0 && (
                      <div className="flex flex-col items-center justify-center py-24 bg-muted/5 rounded-2xl border-2 border-dashed border-border/40">
                        <div className="relative mb-4">
                          <div className="w-16 h-16 rounded-3xl bg-background flex items-center justify-center shadow-sm">
                            <FileText className="w-8 h-8 opacity-10" />
                          </div>
                        </div>
                        <h5 className="font-bold text-base text-foreground tracking-tight">Standard Coverage</h5>
                        <p className="text-xs text-muted-foreground text-center max-w-[280px] mt-1 opacity-70">
                          Governed by standard policy conditions.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-muted/5 rounded-3xl border border-dashed border-border/50">
                  <div className="w-20 h-20 rounded-3xl bg-card shadow-lg border border-border/50 flex items-center justify-center mb-6">
                    <Shield className="w-10 h-10 text-primary opacity-10" />
                  </div>
                  <h4 className="text-lg font-bold text-foreground tracking-tight uppercase">Selection Required</h4>
                  <p className="text-xs text-muted-foreground text-center max-w-[300px] mt-2 px-6 opacity-70">
                    Select a cover above to view its policy extensions.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showCoverSelectionSlot !== false ? coverSelectionContent : null}
    </div>
  );
};
