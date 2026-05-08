import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollableTabs } from '@/components/ui/ScrollableTabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Calculator,
  Search,
  Trash2,
  X,
  Undo,
  Redo,
  Save,
  RotateCcw,
} from 'lucide-react';
import { reindexFormula } from './formulaUtils';
import { isCombinationField } from './parameterUtils';
import type {
  FormulaParameterSection,
  FormulaStep,
  MatrixParameter,
  RatingParameter,
} from './types';

type Props = {
  selectedCalculation: 'sumInsured' | 'premium';
  ratingParameters: RatingParameter[];
  allAvailableParameters: RatingParameter[];
  selectedRelativeParameters?: RatingParameter[];
  matrixParameters: MatrixParameter[];
  riskCategoryTokens?: { value: string; label: string; disabled?: boolean }[];
  hasCombinationPremium?: boolean;
  isCombinationPremiumEnabled?: boolean;
  onChangeCombinationPremiumEnabled?: (value: boolean) => void;
  multiUnitCombinationFieldId?: string;
  onChangeMultiUnitCombinationFieldId?: (value: string | undefined) => void;
  multiUnitCombinationFieldOptions?: { id: string; label: string }[];
  formula: FormulaStep[];
  onChangeFormula: (next: FormulaStep[]) => void;
  insertionIndex: number | null;
  setInsertionIndex: (next: number | null) => void;
  toast: (args: unknown) => void;
  onSave?: () => void;
  onRestore?: () => void;
};

interface FormulaPayload {
  type: FormulaStep['type'];
  value: string;
  fieldId?: string;
  ratingParameterId?: string;
  label?: string;
  parameterSection?: FormulaParameterSection;
}

interface DraggableTokenProps {
  label: React.ReactNode;
  count?: number;
  payload: FormulaPayload;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
  disabled?: boolean;
}

const DraggableToken = ({
  label,
  count,
  payload,
  onClick,
  variant = 'outline',
  className = '',
  disabled = false,
}: DraggableTokenProps) => {
  return (
    <Badge
      variant={variant}
      className={`transition-all text-xs px-2 py-1 shadow-sm select-none ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-move'
      } ${className}`}
      draggable={!disabled}
      onDragStart={(e) => {
        if (disabled) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData('application/json', JSON.stringify(payload));
      }}
      onClick={() => {
        if (disabled) return;
        onClick();
      }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-1.5 inline-flex items-center justify-center bg-primary text-primary-foreground text-[9px] font-bold h-4 w-4 rounded-full">
          {count}
        </span>
      )}
    </Badge>
  );
};

export function InlineFormulaBuilder({
  selectedCalculation,
  ratingParameters,
  allAvailableParameters,
  selectedRelativeParameters,
  matrixParameters,
  riskCategoryTokens = [],
  hasCombinationPremium = false,
  isCombinationPremiumEnabled,
  onChangeCombinationPremiumEnabled,
  multiUnitCombinationFieldId,
  onChangeMultiUnitCombinationFieldId,
  multiUnitCombinationFieldOptions = [],
  formula,
  onChangeFormula,
  insertionIndex,
  setInsertionIndex,
  toast,
  onSave,
  onRestore,
}: Props) {
  const [history, setHistory] = React.useState<FormulaStep[][]>([formula]);
  const [historyIndex, setHistoryIndex] = React.useState(0);
  const [searchTerm, setSearchTerm] = React.useState('');
  const isInternalChange = React.useRef(false);
  const multiUnitPremiumEnabled = isCombinationPremiumEnabled ?? false;
  const showMultiUnitPremiumToggle =
    hasCombinationPremium || multiUnitPremiumEnabled || multiUnitCombinationFieldOptions.length > 0;
  /** Parameter Selection step only — do not fall back to the full catalog */
  const relativeParameters = selectedRelativeParameters ?? [];

  const directProposalRatingParameters = React.useMemo(() => {
    return allAvailableParameters.filter((p) => {
      if (!p.isRatingParameter) return false;

      // Exclude matrix, reference, and combination parameter types
      const dpt = String(p.parameterType || '').toUpperCase();
      if (dpt === 'MATRIX' || dpt === 'COMBINATION' || dpt === 'REFERENCE') {
        return false;
      }

      // Exclude actual combination fields (not their derived children)
      if (isCombinationField(p.type, p.parameterType)) {
        return false;
      }

      // For derived parameters (from combination fields), include all except from rating combination parameters
      const id = String(p.id || '');
      if (id.startsWith('derived|')) {
        // Parse parent ID from derived ID: derived|{parentId}|COUNT or derived|{parentId}|SUM|{childId}
        const parts = id.split('|');
        const parentId = parts[1];
        if (parentId) {
          const parent = allAvailableParameters.find(
            (ap) => ap.id === parentId || ap.formFieldId === parentId,
          );
          // Include derived parameters from proposal form fields
          // Exclude derived parameters from rating combination parameters (parameterType: 'COMBINATION')
          if (parent && String(parent.parameterType || '').toUpperCase() !== 'COMBINATION') {
            return true;
          }
        }
        return false;
      }

      // For non-derived parameters, only show number type fields from proposal form
      const type = String(p.type || '').toLowerCase();
      return type === 'number' || type === 'currency';
    });
  }, [allAvailableParameters]);

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isUuid = React.useCallback(
    (value: string) => uuidRegex.test(String(value || '').trim()),
    [],
  );

  const getNonUuidText = React.useCallback(
    (candidates: Array<string | null | undefined>) => {
      for (const c of candidates) {
        const v = String(c || '').trim();
        if (!v) continue;
        if (isUuid(v)) continue;
        return v;
      }
      return null;
    },
    [isUuid],
  );

  const getDisplayLabelForFieldId = React.useCallback(
    (fieldId: string) => {
      const raw = String(fieldId || '').trim();
      if (!raw) return 'Unknown Field';

      const byExact =
        allAvailableParameters.find((p) => p.id === raw || p.definitionId === raw) ||
        ratingParameters.find((p) => p.id === raw || p.definitionId === raw);
      if (byExact) {
        const fromExact = getNonUuidText([byExact.label, byExact.formFieldLabel, byExact.name]);
        if (fromExact) return fromExact;
      }

      const direct = ratingParameters.find(
        (p) =>
          (p.formFieldId || p.id) === raw &&
          (String(p.parameterType || '').toUpperCase() === 'FORM_FIELD' || !p.parameterType),
      );
      const fromDirect = getNonUuidText([direct?.label, direct?.formFieldLabel, direct?.name]);
      if (fromDirect) return fromDirect;

      const byAny = allAvailableParameters.find(
        (p) => p.id === raw || p.formFieldId === raw || p.definitionId === raw,
      );
      const fromAny = getNonUuidText([byAny?.label, byAny?.formFieldLabel, byAny?.name]);
      if (fromAny) return fromAny;

      return isUuid(raw) ? 'Unknown Field' : raw;
    },
    [allAvailableParameters, getNonUuidText, isUuid, ratingParameters],
  );

  const getDisplayLabelForParam = React.useCallback(
    (param: RatingParameter) => {
      const fromSelf = getNonUuidText([param.label, param.formFieldLabel, param.name]);
      if (fromSelf) return fromSelf;
      return getDisplayLabelForFieldId(param.formFieldId || param.id);
    },
    [getDisplayLabelForFieldId, getNonUuidText],
  );

  const isMatrixToken = React.useCallback((step: Pick<FormulaStep, 'type' | 'value'>) => {
    if (step.type !== 'field') return false;
    if (typeof step.value !== 'string') return false;
    if (!step.value.startsWith('matrix:')) return false;
    if (step.value.startsWith('matrix:each:')) return false;
    if (step.value.startsWith('matrixType:')) return false;
    return true;
  }, []);

  const isMatrixParameterToken = React.useCallback(
    (step: Pick<FormulaStep, 'type' | 'value'>) => {
      if (!isMatrixToken(step)) return false;
      const parts = String(step.value).split(':');
      if (parts.length !== 2) return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(parts[1]);
    },
    [isMatrixToken],
  );

  const getCombinationParentIdForColumn = React.useCallback(
    (fieldId: string): string | null => {
      const candidates = [...ratingParameters, ...allAvailableParameters];
      const direct = candidates.find((p) => p.id === fieldId || p.formFieldId === fieldId);
      const parentFieldId = direct?.parentFieldId ?? null;
      if (parentFieldId) {
        const parent = candidates.find((p) => p.id === parentFieldId);
        if (parent) {
          if (isCombinationField(parent.type, parent.parameterType)) {
            return parent.id;
          }
          return null;
        }
        return parentFieldId;
      }

      const parent = candidates.find(
        (p) =>
          isCombinationField(p.type, p.parameterType) &&
          (p.childFields?.some((c) => c.id === fieldId || c.formFieldId === fieldId) ||
            (Array.isArray((p as unknown as { subFields?: RatingParameter[] }).subFields)
              ? (p as unknown as { subFields?: RatingParameter[] }).subFields?.some(
                  (c) => c.id === fieldId || c.formFieldId === fieldId,
                )
              : false)),
      );
      return parent?.id ?? null;
    },
    [allAvailableParameters, ratingParameters],
  );

  /** Disambiguate combination subfields in the Direct tab: "Subfield (Parent combination)" */
  const getDirectTabChipLabel = React.useCallback(
    (param: RatingParameter) => {
      const base = getDisplayLabelForParam(param);
      const columnId = String(param.formFieldId || param.id || '').trim();
      if (!columnId) return base;

      // Exclude Matrix, Combination, and Referenced parameter types from parent field naming
      const paramType = String(param.parameterType || '').toUpperCase();
      if (paramType === 'MATRIX' || paramType === 'COMBINATION' || paramType === 'REFERENCE') {
        return base;
      }

      let parentId = getCombinationParentIdForColumn(columnId);
      if (!parentId) {
        const row =
          ratingParameters.find((p) => p.id === columnId || p.formFieldId === columnId) ||
          allAvailableParameters.find((p) => p.id === columnId || p.formFieldId === columnId);
        const cand = String(row?.parentFieldId || '').trim();
        if (cand) {
          const parentRow =
            ratingParameters.find((p) => p.id === cand) ||
            allAvailableParameters.find((p) => p.id === cand);
          if (parentRow && isCombinationField(parentRow.type, parentRow.parameterType)) {
            parentId = parentRow.id;
          }
        }
      }
      if (!parentId) return base;

      const parent =
        ratingParameters.find((p) => p.id === parentId) ||
        allAvailableParameters.find((p) => p.id === parentId || p.definitionId === parentId);
      if (!parent || !isCombinationField(parent.type, parent.parameterType)) return base;

      const parentLabel = getNonUuidText([parent.label, parent.formFieldLabel, parent.name]);
      if (!parentLabel || parentLabel === 'Unknown Field') return base;
      if (parentLabel === base) return base;
      if (base.includes(`(${parentLabel})`)) return base;
      // Skip if base already starts with the parent label (e.g., "Vehicle Details - Sum of...")
      if (base.toLowerCase().startsWith(parentLabel.toLowerCase())) return base;
      return `${base} (${parentLabel})`;
    },
    [
      allAvailableParameters,
      getCombinationParentIdForColumn,
      getDisplayLabelForParam,
      getNonUuidText,
      ratingParameters,
    ],
  );

  const isEachEligibleMatrixParameterToken = React.useCallback(
    (step: Pick<FormulaStep, 'type' | 'value'>) => {
      if (!isMatrixToken(step)) return false;

      const parts = String(step.value).split(':');
      let axis1: string | null = null;
      let axis2: string | null = null;

      if (parts.length === 2) {
        const [, matrixRatingParameterId] = parts;
        const mp = matrixParameters.find(
          (item) => item.ratingParameterId === matrixRatingParameterId,
        );
        if (!mp) return false;
        axis1 = mp.formFieldId;
        axis2 = mp.formFieldId2;
      } else if (parts.length === 3) {
        const [, fieldId1, fieldId2] = parts;
        const mp = matrixParameters.find(
          (item) => item.formFieldId === fieldId1 && item.formFieldId2 === fieldId2,
        );
        axis1 = mp?.formFieldId ?? fieldId1;
        axis2 = mp?.formFieldId2 ?? fieldId2;
      } else {
        return false;
      }

      if (!axis1 || !axis2) return false;

      const parent1 = getCombinationParentIdForColumn(axis1);
      const parent2 = getCombinationParentIdForColumn(axis2);
      return Boolean(parent1 && parent2 && parent1 === parent2);
    },
    [getCombinationParentIdForColumn, isMatrixToken, matrixParameters],
  );

  const getEachFunctionValidationError = React.useCallback(
    (steps: FormulaStep[]): string | null => {
      const eachFnNames = new Set(['SUM_PRODUCT_EACH', 'PRODUCT_EACH']);
      for (let i = 0; i < steps.length; i += 1) {
        const step = steps[i];
        if (step?.type !== 'function' || typeof step.value !== 'string') continue;
        if (!eachFnNames.has(step.value)) continue;

        const open = steps[i + 1];
        if (!open || open.type !== 'operator' || open.value !== '(') {
          return 'SUM/PRODUCT Each() must be followed by parentheses containing exactly one matrix parameter.';
        }

        let depth = 1;
        let closeIndex = -1;
        for (let j = i + 2; j < steps.length; j += 1) {
          const s = steps[j];
          if (s.type === 'operator' && s.value === '(') depth += 1;
          else if (s.type === 'operator' && s.value === ')') depth -= 1;
          if (depth === 0) {
            closeIndex = j;
            break;
          }
        }

        if (closeIndex === -1) {
          return 'SUM/PRODUCT Each() must have a closing parenthesis.';
        }

        const args = steps.slice(i + 2, closeIndex).filter((s) => s.type !== 'operator');
        if (args.length !== 1) {
          return 'SUM/PRODUCT Each() accepts exactly one matrix parameter.';
        }

        if (!isEachEligibleMatrixParameterToken(args[0])) {
          return "SUM/PRODUCT Each() only works with matrix parameters built from the same Combination field's columns.";
        }
      }
      return null;
    },
    [isEachEligibleMatrixParameterToken],
  );

  const getEnclosingFunctionCall = React.useCallback(
    (cursorIndex: number) => {
      const index = Math.max(0, Math.min(cursorIndex, formula.length));
      for (let i = index - 1; i >= 0; i -= 1) {
        const step = formula[i];
        if (step?.type === 'operator' && step.value === '(') {
          const prev = formula[i - 1];
          if (!prev || prev.type !== 'function') continue;

          let depth = 1;
          let closeIndex = -1;
          for (let j = i + 1; j < formula.length; j += 1) {
            const s = formula[j];
            if (s.type === 'operator' && s.value === '(') depth += 1;
            else if (s.type === 'operator' && s.value === ')') depth -= 1;

            if (depth === 0) {
              closeIndex = j;
              break;
            }
          }

          const effectiveCloseIndex = closeIndex !== -1 ? closeIndex : formula.length;
          if (index > i && index <= effectiveCloseIndex) {
            return {
              functionIndex: i - 1,
              openIndex: i,
              closeIndex: effectiveCloseIndex,
              isBroken: closeIndex === -1,
            };
          }
        }
      }
      return null;
    },
    [formula],
  );

  const isInsideEachFunctionArgs = React.useMemo(() => {
    if (insertionIndex === null) return false;
    const fnCtx = getEnclosingFunctionCall(insertionIndex);
    if (!fnCtx) return false;
    const fnStep = formula[fnCtx.functionIndex];
    if (!fnStep || fnStep.type !== 'function') return false;
    if (fnStep.value !== 'SUM_PRODUCT_EACH' && fnStep.value !== 'PRODUCT_EACH') return false;
    return insertionIndex >= fnCtx.openIndex + 1 && insertionIndex <= fnCtx.closeIndex;
  }, [formula, getEnclosingFunctionCall, insertionIndex]);

  const isInsideMultiArgFunctionArgs = React.useMemo(() => {
    if (insertionIndex === null) return false;
    const fnCtx = getEnclosingFunctionCall(insertionIndex);
    if (!fnCtx) return false;
    const fnStep = formula[fnCtx.functionIndex];
    if (!fnStep || fnStep.type !== 'function') return false;
    if (fnStep.value !== 'MIN' && fnStep.value !== 'MAX') return false;
    return insertionIndex >= fnCtx.openIndex + 1 && insertionIndex <= fnCtx.closeIndex;
  }, [formula, getEnclosingFunctionCall, insertionIndex]);

  // Reset history when the component mounts or when selectedCalculation changes (via key prop)
  // Also sync if formula is loaded externally (e.g. initial empty -> loaded data)
  React.useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }

    // If history is just the initial state [[], index=0] but formula has content,
    // it means we loaded data. Sync history.
    if (history.length === 1 && history[0].length === 0 && formula.length > 0) {
      setHistory([formula]);
      setHistoryIndex(0);
      return;
    }

    // If formula matches history tip, do nothing.
    // If formula does NOT match history tip, it's an external change.
    // We should probably reset history to this new state to avoid conflicts.
    const currentHistoryStep = history[historyIndex];
    if (JSON.stringify(currentHistoryStep) !== JSON.stringify(formula)) {
      // External change detected
      setHistory([formula]);
      setHistoryIndex(0);
    }
  }, [formula]); // We depend on formula to detect external changes

  const handleFormulaChange = (newFormula: FormulaStep[]) => {
    isInternalChange.current = true;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newFormula);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onChangeFormula(newFormula);
  };

  const insertStep = (newStep: FormulaStep) => {
    const cursor = insertionIndex ?? formula.length;
    const fnCtx = getEnclosingFunctionCall(cursor);
    if (newStep.type === 'operator' && newStep.value === ',') {
      const isInsideFnArgs = fnCtx
        ? cursor >= fnCtx.openIndex + 1 && cursor <= fnCtx.closeIndex
        : false;
      const fnStep = fnCtx ? formula[fnCtx.functionIndex] : undefined;
      const enclosingFn =
        fnStep?.type === 'function' && typeof fnStep.value === 'string' ? fnStep.value : null;
      const isAllowed = isInsideFnArgs && (enclosingFn === 'MIN' || enclosingFn === 'MAX');
      if (!isAllowed) {
        toast({
          title: 'Invalid Input',
          description: 'Commas can only be used inside MIN()/MAX() arguments.',
          variant: 'destructive',
        });
        return;
      }
    }
    if (fnCtx) {
      const isInsideFnArgs = cursor >= fnCtx.openIndex + 1 && cursor <= fnCtx.closeIndex;
      const fnStep = formula[fnCtx.functionIndex];
      const enclosingFn =
        fnStep?.type === 'function' && typeof fnStep.value === 'string' ? fnStep.value : null;
      const isEachFn = enclosingFn === 'SUM_PRODUCT_EACH' || enclosingFn === 'PRODUCT_EACH';
      const isMultiArgFn = enclosingFn === 'MIN' || enclosingFn === 'MAX';
      if (isInsideFnArgs) {
        if (newStep.type === 'operator' && newStep.value === ',' && !isMultiArgFn) {
          toast({
            title: 'Invalid Input',
            description: 'Commas can only be used inside MIN()/MAX() arguments.',
            variant: 'destructive',
          });
          return;
        }

        if (isEachFn) {
          if (newStep.type === 'operator' && (newStep.value === '(' || newStep.value === ')')) {
            handleFormulaChange(insertAtCursor(formula, newStep));
            return;
          }

          if (!isEachEligibleMatrixParameterToken(newStep)) {
            toast({
              title: 'Invalid Input',
              description:
                "Only matrix parameters built from the same Combination field's columns can be used inside SUM PRODUCT/PRODUCT Each().",
              variant: 'destructive',
            });
            return;
          }

          const existingArgs = formula
            .slice(fnCtx.openIndex + 1, fnCtx.closeIndex)
            .filter((s) => s.type !== 'operator');
          if (existingArgs.length > 0) {
            toast({
              title: 'Invalid Input',
              description: 'SUM/PRODUCT Each() accepts exactly one matrix parameter.',
              variant: 'destructive',
            });
            return;
          }

          const targetIndex = fnCtx.openIndex + 1;
          const next = reindexFormula([
            ...formula.slice(0, targetIndex),
            { ...newStep, order: targetIndex },
            ...formula.slice(targetIndex),
          ]);
          handleFormulaChange(next);
          setInsertionIndex(targetIndex + 1);
          return;
        }
      }
    }

    handleFormulaChange(insertAtCursor(formula, newStep));
  };

  const insertFunctionCall = (fn: 'SUM_PRODUCT_EACH' | 'PRODUCT_EACH' | 'MIN' | 'MAX') => {
    const cursor = insertionIndex ?? formula.length;
    const fnCtx = getEnclosingFunctionCall(cursor);
    if (fnCtx) {
      const isInsideFnArgs = cursor >= fnCtx.openIndex + 1 && cursor <= fnCtx.closeIndex;
      const enclosingFn = formula[fnCtx.functionIndex];
      const isEnclosingEach =
        enclosingFn?.type === 'function' &&
        (enclosingFn.value === 'SUM_PRODUCT_EACH' || enclosingFn.value === 'PRODUCT_EACH');
      if (isInsideFnArgs) {
        if (isEnclosingEach) {
          toast({
            title: 'Invalid Input',
            description:
              "SUM PRODUCT/PRODUCT Each() accepts only a matrix parameter built from the same Combination field's columns.",
            variant: 'destructive',
          });
          return;
        }
      }
    }

    const steps: FormulaStep[] = [
      { id: `step_${Date.now()}_${Math.random()}`, type: 'function', value: fn },
      { id: `step_${Date.now()}_${Math.random()}`, type: 'operator', value: '(' },
      { id: `step_${Date.now()}_${Math.random()}`, type: 'operator', value: ')' },
    ];

    const before = formula.slice(0, cursor);
    const after = formula.slice(cursor);
    const next = reindexFormula([...before, ...steps, ...after]);
    handleFormulaChange(next);
    setInsertionIndex(cursor + 2);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      isInternalChange.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChangeFormula(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isInternalChange.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChangeFormula(history[newIndex]);
    }
  };

  const getStepFieldId = React.useCallback((param: RatingParameter): string | undefined => {
    const pt = String(param.parameterType || '').toUpperCase();
    if (pt === 'MATRIX' || pt === 'REFERENCE') return undefined;
    // For DERIVED parameters, using parent formFieldId can incorrectly resolve direct values.
    // Keep resolution keyed by ratingParameterId instead.
    if (pt === 'DERIVED') return undefined;
    const byFormField =
      typeof param.formFieldId === 'string' && param.formFieldId.trim()
        ? param.formFieldId.trim()
        : undefined;
    if (byFormField) return byFormField;

    if (
      String(param.parameterType || '').toUpperCase() === 'FORM_FIELD' &&
      typeof param.id === 'string' &&
      param.id.trim()
    ) {
      return param.id.trim();
    }

    const formFieldSource = Array.isArray(param.sources)
      ? param.sources.find((s) => s.type === 'FORM_FIELD' && String(s.id || '').trim())
      : undefined;
    if (formFieldSource?.id) return String(formFieldSource.id).trim();

    return undefined;
  }, []);

  const getStepRatingParameterId = React.useCallback(
    (param: RatingParameter) => {
      const explicit =
        typeof param.ratingParameterId === 'string' && param.ratingParameterId.trim()
          ? param.ratingParameterId.trim()
          : undefined;
      if (explicit) return explicit;

      const pt = String(param.parameterType || '').toUpperCase();
      if (pt === 'DERIVED') {
        // Derived parameters must resolve by canonical rating-parameter id first.
        if (typeof param.id === 'string' && param.id.trim()) return param.id.trim();
        const defId =
          typeof param.definitionId === 'string' && param.definitionId.trim()
            ? param.definitionId.trim()
            : undefined;
        if (defId) return defId;
      }
      if (pt === 'REFERENCE' || pt === 'MATRIX' || pt === 'COMBINATION') {
        const defId =
          typeof param.definitionId === 'string' && param.definitionId.trim()
            ? param.definitionId.trim()
            : undefined;
        if (defId) return defId;
        if (typeof param.id === 'string' && param.id.trim()) return param.id.trim();
      }

      const fromActiveCategory = Array.isArray(param.activeCategories)
        ? param.activeCategories.find(
            (ac) => typeof ac.ratingParameterId === 'string' && ac.ratingParameterId.trim(),
          )?.ratingParameterId
        : undefined;
      if (fromActiveCategory && fromActiveCategory.trim()) {
        return fromActiveCategory.trim();
      }

      const definitionSource = Array.isArray(param.sources)
        ? param.sources.find((s) => s.type === 'DEFINITION' && String(s.id || '').trim())
        : undefined;
      const candidateDefinitionId =
        (typeof param.definitionId === 'string' && param.definitionId.trim()
          ? param.definitionId.trim()
          : undefined) || (definitionSource?.id ? String(definitionSource.id).trim() : undefined);

      const canonicalFieldId = getStepFieldId(param);
      const matched = allAvailableParameters.find((p) => {
        if (
          canonicalFieldId &&
          (p.ratingParameterId === canonicalFieldId ||
            p.id === canonicalFieldId ||
            p.formFieldId === canonicalFieldId ||
            p.definitionId === canonicalFieldId)
        ) {
          return true;
        }
        if (
          candidateDefinitionId &&
          (p.definitionId === candidateDefinitionId || p.id === candidateDefinitionId)
        ) {
          return true;
        }
        if (
          typeof param.id === 'string' &&
          param.id.trim() &&
          (p.definitionId === param.id || p.id === param.id)
        ) {
          return true;
        }
        return false;
      });
      if (matched) {
        const matchedId =
          typeof matched.ratingParameterId === 'string' && matched.ratingParameterId.trim()
            ? matched.ratingParameterId.trim()
            : typeof matched.id === 'string' && matched.id.trim()
              ? matched.id.trim()
              : undefined;
        if (matchedId) return matchedId;
      }

      if (
        typeof param.id === 'string' &&
        param.id.trim() &&
        (!candidateDefinitionId || param.id.trim() !== candidateDefinitionId)
      ) {
        return param.id.trim();
      }
      return undefined;
    },
    [allAvailableParameters, getStepFieldId],
  );

  const doesStepMatchParameter = React.useCallback(
    (step: FormulaStep, param: RatingParameter) => {
      const canonicalFieldId = getStepFieldId(param);
      const canonicalRatingParameterId = getStepRatingParameterId(param);
      const stepFieldId = String(step.fieldId || '').trim();
      const stepRatingParameterId = String(step.ratingParameterId || '').trim();
      const stepValue = String(step.value || '').trim();

      const pt = String(param.parameterType || '').toUpperCase();
      if (pt === 'MATRIX' && canonicalRatingParameterId) {
        if (
          (stepValue.startsWith('matrix:') &&
            stepValue.split(':')[1] === canonicalRatingParameterId) ||
          stepRatingParameterId === canonicalRatingParameterId
        ) {
          return true;
        }
      }

      if (canonicalRatingParameterId) {
        if (
          stepRatingParameterId === canonicalRatingParameterId ||
          stepFieldId === canonicalRatingParameterId ||
          stepValue === canonicalRatingParameterId
        ) {
          return true;
        }
      }

      if (canonicalFieldId) {
        if (
          stepFieldId === canonicalFieldId ||
          stepValue === canonicalFieldId ||
          stepRatingParameterId === canonicalFieldId
        ) {
          return true;
        }
      }

      return false;
    },
    [getStepFieldId, getStepRatingParameterId],
  );

  const buildParameterStep = React.useCallback(
    (
      param: RatingParameter,
      section: FormulaParameterSection,
      displayLabel?: string,
    ): FormulaStep => {
      const safeLabel = displayLabel ?? getDisplayLabelForParam(param);
      const pt = String(param.parameterType || '').toUpperCase();
      if (pt === 'MATRIX') {
        const matrixId = getStepRatingParameterId(param) || param.definitionId || param.id;
        return {
          id: `step_${Date.now()}_${Math.random()}`,
          type: 'field',
          value: `matrix:${matrixId}`,
          fieldId: undefined,
          ratingParameterId: matrixId,
          order: insertionIndex ?? formula.length,
          label: safeLabel,
          parameterSection: section,
        };
      }
      return {
        id: `step_${Date.now()}_${Math.random()}`,
        type: 'field',
        value: param.name,
        fieldId: getStepFieldId(param),
        ratingParameterId: getStepRatingParameterId(param),
        order: insertionIndex ?? formula.length,
        label: safeLabel,
        parameterSection: section,
      };
    },
    [
      formula.length,
      getDisplayLabelForParam,
      getStepFieldId,
      getStepRatingParameterId,
      insertionIndex,
    ],
  );

  const getFieldStepLabel = (step: FormulaStep) => {
    const labelFromStep = typeof step.label === 'string' ? getNonUuidText([step.label]) : null;
    if (labelFromStep) return labelFromStep;
    if (step.value === 'sumOfSelectedCEWs') return 'Sum of Selected CEWs';
    if (step.type === 'variable') {
      if (step.value === 'sumInsured') return 'Sum Insured';
      if (step.value === 'baseRate') return 'Base Rate';
    }

    if (typeof step.value === 'string' && step.value.startsWith('matrix:')) {
      const parts = step.value.split(':');
      if (parts.length === 2) {
        const [, matrixRatingParameterId] = parts;
        const mp = matrixParameters.find(
          (item) => item.ratingParameterId === matrixRatingParameterId,
        );
        if (mp) {
          const matrixName = getNonUuidText([mp.name]);
          if (matrixName) return matrixName;
          return `${getDisplayLabelForFieldId(mp.formFieldId)} × ${getDisplayLabelForFieldId(
            mp.formFieldId2,
          )}`;
        }
        const matrixDef = allAvailableParameters.find(
          (p) =>
            (p.id === matrixRatingParameterId || p.definitionId === matrixRatingParameterId) &&
            String(p.parameterType || '').toUpperCase() === 'MATRIX',
        );
        if (matrixDef) {
          const fromDef = getNonUuidText([
            matrixDef.label,
            matrixDef.formFieldLabel,
            matrixDef.name,
          ]);
          if (fromDef) return fromDef;
        }
      } else if (parts.length === 3) {
        const [, fieldId1, fieldId2] = parts;
        const mp = matrixParameters.find(
          (item) => item.formFieldId === fieldId1 && item.formFieldId2 === fieldId2,
        );
        if (mp) {
          const matrixName = getNonUuidText([mp.name]);
          if (matrixName) return matrixName;
          return `${getDisplayLabelForFieldId(mp.formFieldId)} × ${getDisplayLabelForFieldId(
            mp.formFieldId2,
          )}`;
        }
        return `${getDisplayLabelForFieldId(fieldId1)} × ${getDisplayLabelForFieldId(fieldId2)}`;
      } else if (parts.length === 4 && parts[1] === 'each') {
        const [, , matrixId, type] = parts;
        const mp = matrixParameters.find((item) => item.ratingParameterId === matrixId);
        if (mp) {
          const matrixName =
            getNonUuidText([mp.name]) ||
            `${getDisplayLabelForFieldId(mp.formFieldId)} × ${getDisplayLabelForFieldId(
              mp.formFieldId2,
            )}`;
          const displayType = type === 'SUMPRODUCT' ? 'SUM PRODUCT' : type;
          return `${displayType} For Each (${matrixName})`;
        }
        const matrixDef = allAvailableParameters.find(
          (p) =>
            (p.id === matrixId || p.definitionId === matrixId) &&
            String(p.parameterType || '').toUpperCase() === 'MATRIX',
        );
        if (matrixDef) {
          const matrixName =
            getNonUuidText([matrixDef.label, matrixDef.formFieldLabel, matrixDef.name]) ||
            `${getDisplayLabelForFieldId(matrixDef.formFieldId || '')} × ${getDisplayLabelForFieldId(
              (matrixDef as { formFieldId2?: string }).formFieldId2 || '',
            )}`;
          const displayType = type === 'SUMPRODUCT' ? 'SUM PRODUCT' : type;
          return `${displayType} For Each (${matrixName})`;
        }
      }
    }

    const byRatingParameterId = step.ratingParameterId
      ? allAvailableParameters.find(
          (p) =>
            p.id === step.ratingParameterId ||
            p.definitionId === step.ratingParameterId ||
            p.ratingParameterId === step.ratingParameterId,
        )
      : undefined;
    const byRatingParamLabel = getNonUuidText([
      byRatingParameterId?.label,
      byRatingParameterId?.formFieldLabel,
      byRatingParameterId?.name,
    ]);
    if (byRatingParamLabel) return byRatingParamLabel;

    const byFieldId = step.fieldId
      ? allAvailableParameters.find((p) => p.id === step.fieldId || p.formFieldId === step.fieldId)
      : undefined;
    const byFieldIdLabel = getNonUuidText([
      byFieldId?.label,
      byFieldId?.formFieldLabel,
      byFieldId?.name,
    ]);
    if (byFieldIdLabel) return byFieldIdLabel;

    const byName = allAvailableParameters.find((p) => p.name === step.value);
    const byNameLabel = getNonUuidText([byName?.label, byName?.formFieldLabel, byName?.name]);
    if (byNameLabel) return byNameLabel;

    const raw = String(step.fieldId || step.value || '').trim();
    if (raw && !isUuid(raw)) return raw;
    return 'Unknown Field';
  };

  const isStepMissingParameter = (step: FormulaStep) => {
    if (step.type !== 'field' && step.type !== 'variable') return false;
    if (step.type === 'variable') {
      if (step.value === 'sumInsured' || step.value === 'baseRate') return false;
      if (typeof step.value === 'string' && step.value.startsWith('risk:')) return false;
    }
    if (typeof step.value === 'string' && step.value.startsWith('matrix:')) {
      const parts = step.value.split(':');
      if (parts.length === 2) {
        const id = parts[1];
        const inMatrixList = matrixParameters.some((item) => item.ratingParameterId === id);
        if (inMatrixList) return false;
        const inDefs = allAvailableParameters.some(
          (p) =>
            (p.id === id || p.definitionId === id) &&
            String(p.parameterType || '').toUpperCase() === 'MATRIX',
        );
        return !inDefs;
      }
      if (parts.length === 3) {
        const [, fieldId1, fieldId2] = parts;
        return !matrixParameters.some(
          (item) => item.formFieldId === fieldId1 && item.formFieldId2 === fieldId2,
        );
      }
      if (parts.length === 4 && parts[1] === 'each') {
        const id = parts[2];
        const inMatrixList = matrixParameters.some((item) => item.ratingParameterId === id);
        if (inMatrixList) return false;
        return !allAvailableParameters.some(
          (p) =>
            (p.id === id || p.definitionId === id) &&
            String(p.parameterType || '').toUpperCase() === 'MATRIX',
        );
      }
      return false;
    }
    const byRatingParameterId = step.ratingParameterId
      ? allAvailableParameters.find(
          (p) =>
            p.id === step.ratingParameterId ||
            p.definitionId === step.ratingParameterId ||
            p.ratingParameterId === step.ratingParameterId,
        )
      : undefined;
    if (byRatingParameterId) return false;
    const byFieldId = step.fieldId
      ? allAvailableParameters.find((p) => p.id === step.fieldId || p.formFieldId === step.fieldId)
      : undefined;
    if (byFieldId) return false;
    const byName = allAvailableParameters.find((p) => p.name === step.value);
    if (byName) return false;
    return true;
  };

  const insertAtCursor = (current: FormulaStep[], newStep: FormulaStep) => {
    const wasEmpty = current.length === 0;
    const index = insertionIndex !== null ? insertionIndex : current.length;
    const newFormula = reindexFormula([
      ...current.slice(0, index),
      newStep,
      ...current.slice(index),
    ]);
    if (wasEmpty) {
      setInsertionIndex(1);
    } else {
      setInsertionIndex(index + 1);
    }
    return newFormula;
  };

  const removeAtIndex = (index: number) => {
    const newFormula = reindexFormula(formula.filter((_, i) => i !== index));
    handleFormulaChange(newFormula);
    if (newFormula.length === 0) {
      setInsertionIndex(null);
      return;
    }
    setInsertionIndex(Math.min(index, newFormula.length));
  };

  const updateAtIndex = (index: number, patch: Partial<FormulaStep>) => {
    const updated = formula.map((s, i) => (i === index ? { ...s, ...patch } : s));
    handleFormulaChange(updated);
  };

  const normalizeFormulaPayloadReference = React.useCallback(
    (payload: FormulaPayload) => {
      const payloadFieldId = String(payload.fieldId || '').trim();
      const payloadRatingParameterId = String(payload.ratingParameterId || '').trim();
      const payloadValue = String(payload.value || '').trim();

      if (payload.type === 'field' && payloadValue.startsWith('matrix:')) {
        const [, matrixId] = payloadValue.split(':');
        const trimmedMatrixId = String(matrixId || '').trim();
        return {
          fieldId: undefined,
          ratingParameterId: trimmedMatrixId || payloadRatingParameterId || undefined,
          value: payloadValue,
          label: payload.label,
        };
      }

      const byRatingParam = payloadRatingParameterId
        ? allAvailableParameters.find(
            (p) =>
              p.id === payloadRatingParameterId || p.ratingParameterId === payloadRatingParameterId,
          )
        : undefined;

      const byField = payloadFieldId
        ? allAvailableParameters.find(
            (p) => p.id === payloadFieldId || p.formFieldId === payloadFieldId,
          )
        : undefined;

      const byName = payloadValue
        ? allAvailableParameters.find((p) => p.name === payloadValue || p.label === payloadValue)
        : undefined;

      const matched = byRatingParam || byField || byName;
      if (!matched) {
        const isRelative = payload.parameterSection === 'RELATIVE_LOADING';
        const fallbackRatingParameterId =
          payload.ratingParameterId || (isRelative && payloadFieldId ? payloadFieldId : undefined);
        return {
          fieldId: payload.fieldId,
          ratingParameterId: fallbackRatingParameterId,
          value: payload.value,
          label: payload.label,
        };
      }

      const label = getDisplayLabelForParam(matched);
      const isRelative = payload.parameterSection === 'RELATIVE_LOADING';
      const canonicalRatingParameterId = getStepRatingParameterId(matched);
      return {
        fieldId: getStepFieldId(matched),
        ratingParameterId:
          canonicalRatingParameterId ||
          payload.ratingParameterId ||
          (isRelative && payloadFieldId ? payloadFieldId : undefined),
        value: matched.name || payload.value,
        label: label === 'Unknown Field' ? payload.label : label,
      };
    },
    [allAvailableParameters, getDisplayLabelForParam, getStepFieldId, getStepRatingParameterId],
  );

  const handleCustomNumberAdd = (value: string) => {
    if (value && !Number.isNaN(Number(value))) {
      const newStep: FormulaStep = {
        id: `step_${Date.now()}_${Math.random()}`,
        type: 'number',
        value,
      };
      insertStep(newStep);
      return true;
    }
    return false;
  };

  return (
    <div className="flex gap-3 h-[calc(100vh-200px)] min-h-[500px] w-full items-stretch">
      {/* Left Column: Parameters */}
      <div className="w-[520px] flex flex-col gap-2 border rounded-md bg-background/50">
        <div className="p-2 border-b bg-muted/20 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">
              Parameters
            </Label>
            {selectedCalculation === 'premium' && (
              <Badge variant="secondary" className="text-[10px] px-1 h-5">
                Premium
              </Badge>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-7 h-8 text-xs bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-4">
            {selectedCalculation === 'premium' && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-muted-foreground">Base</Label>
                <div className="flex flex-wrap gap-1.5">
                  <DraggableToken
                    label="Sum Insured"
                    count={formula.filter((step) => step.value === 'sumInsured').length}
                    variant="outline"
                    className="hover:bg-primary/10 hover:border-primary hover:text-primary bg-primary/5 border-primary/30"
                    disabled={isInsideEachFunctionArgs}
                    payload={{
                      type: 'variable',
                      value: 'sumInsured',
                      fieldId: 'sumInsured',
                      label: 'Sum Insured',
                    }}
                    onClick={() => {
                      const newStep: FormulaStep = {
                        id: `step_${Date.now()}_${Math.random()}`,
                        type: 'variable',
                        value: 'sumInsured',
                        fieldId: 'sumInsured',
                        order: insertionIndex ?? formula.length,
                        label: 'Sum Insured',
                      };
                      insertStep(newStep);
                    }}
                  />
                  {riskCategoryTokens.map((token) => (
                    <DraggableToken
                      key={token.value}
                      label={token.label}
                      count={formula.filter((step) => step.value === token.value).length}
                      variant="outline"
                      className="hover:bg-sky-100 hover:border-sky-400 hover:text-sky-900 bg-sky-50 border-sky-200 text-sky-900"
                      disabled={isInsideEachFunctionArgs || token.disabled === true}
                      payload={{
                        type: 'variable',
                        value: token.value,
                        fieldId: token.value,
                        label: token.label,
                      }}
                      onClick={() => {
                        const newStep: FormulaStep = {
                          id: `step_${Date.now()}_${Math.random()}`,
                          type: 'variable',
                          value: token.value,
                          fieldId: token.value,
                          order: insertionIndex ?? formula.length,
                          label: token.label,
                        };
                        insertStep(newStep);
                      }}
                    />
                  ))}
                  <DraggableToken
                    label="Base Rate"
                    count={formula.filter((step) => step.value === 'baseRate').length}
                    variant="outline"
                    className="hover:bg-primary/10 hover:border-primary hover:text-primary bg-primary/5 border-primary/30"
                    disabled={isInsideEachFunctionArgs}
                    payload={{
                      type: 'variable',
                      value: 'baseRate',
                      fieldId: 'baseRate',
                      label: 'Base Rate',
                    }}
                    onClick={() => {
                      const newStep: FormulaStep = {
                        id: `step_${Date.now()}_${Math.random()}`,
                        type: 'variable',
                        value: 'baseRate',
                        fieldId: 'baseRate',
                        order: insertionIndex ?? formula.length,
                        label: 'Base Rate',
                      };
                      insertStep(newStep);
                    }}
                  />
                </div>
              </div>
            )}

            <Tabs defaultValue="relative" className="w-full">
              <ScrollableTabs>
                <TabsList className="grid w-full grid-cols-2 mb-2">
                  <TabsTrigger value="relative" className="text-[10px] h-6">
                    Relative
                  </TabsTrigger>
                  <TabsTrigger value="direct" className="text-[10px] h-6">
                    Direct
                  </TabsTrigger>
                </TabsList>
              </ScrollableTabs>

              <TabsContent value="relative" className="mt-0 space-y-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {relativeParameters
                    .map((param) => ({ param, safeLabel: getDirectTabChipLabel(param) }))
                    .filter(
                      ({ safeLabel }) =>
                        !searchTerm || safeLabel.toLowerCase().includes(searchTerm.toLowerCase()),
                    )
                    .filter(({ safeLabel }) => safeLabel !== 'Unknown Field')
                    .map(({ param, safeLabel }) => {
                      const count = formula.filter(
                        (step) =>
                          step.type === 'field' &&
                          doesStepMatchParameter(step, param) &&
                          step.parameterSection !== 'DIRECT_VALUE',
                      ).length;
                      const seedStep = buildParameterStep(param, 'RELATIVE_LOADING', safeLabel);
                      return (
                        <DraggableToken
                          key={param.id}
                          label={safeLabel}
                          count={count}
                          variant="outline"
                          className="hover:bg-primary/10 hover:border-primary hover:text-primary"
                          disabled={isInsideEachFunctionArgs}
                          payload={{
                            type: 'field',
                            value: seedStep.value,
                            fieldId: seedStep.fieldId,
                            ratingParameterId: seedStep.ratingParameterId,
                            label: safeLabel,
                            parameterSection: 'RELATIVE_LOADING' as FormulaParameterSection,
                          }}
                          onClick={() => {
                            const newStep = buildParameterStep(param, 'RELATIVE_LOADING', safeLabel);
                            insertStep(newStep);
                          }}
                        />
                      );
                    })}
                </div>
              </TabsContent>

              <TabsContent value="direct" className="mt-0">
                <div className="flex flex-wrap gap-1.5">
                  {directProposalRatingParameters
                    .map((param) => ({ param, safeLabel: getDirectTabChipLabel(param) }))
                    .filter(
                      ({ safeLabel }) =>
                        !searchTerm || safeLabel.toLowerCase().includes(searchTerm.toLowerCase()),
                    )
                    .filter(({ safeLabel }) => safeLabel !== 'Unknown Field')
                    .map(({ param, safeLabel }) => {
                      const count = formula.filter(
                        (step) =>
                          step.type === 'field' &&
                          doesStepMatchParameter(step, param) &&
                          step.parameterSection === 'DIRECT_VALUE',
                      ).length;
                      const seedStep = buildParameterStep(param, 'DIRECT_VALUE', safeLabel);
                      return (
                        <DraggableToken
                          key={`direct-${param.id}`}
                          label={safeLabel}
                          count={count}
                          variant="outline"
                          className="bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 hover:text-emerald-950"
                          disabled={isInsideEachFunctionArgs}
                          payload={{
                            type: 'field',
                            value: seedStep.value,
                            fieldId: seedStep.fieldId,
                            ratingParameterId: seedStep.ratingParameterId,
                            label: safeLabel,
                            parameterSection: 'DIRECT_VALUE' as FormulaParameterSection,
                          }}
                          onClick={() => {
                            const newStep = buildParameterStep(param, 'DIRECT_VALUE', safeLabel);
                            insertStep(newStep);
                          }}
                        />
                      );
                    })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Middle Column: Formula Canvas */}
      <div className="flex-1 flex flex-col border rounded-md shadow-sm bg-background">
        <div className="h-9 px-3 border-b flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">Canvas</span>
            <Badge
              variant="outline"
              className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground"
            >
              {formula.length} steps
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {onSave && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  const error = getEachFunctionValidationError(formula);
                  if (error) {
                    toast({ title: 'Invalid Formula', description: error, variant: 'destructive' });
                    return;
                  }
                  onSave();
                }}
                title="Save Formula"
              >
                <Save className="h-3.5 w-3.5" />
              </Button>
            )}
            {onRestore && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onRestore}
                title="Restore Saved Formula"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
            <Separator orientation="vertical" className="h-4 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo"
            >
              <Undo className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo"
            >
              <Redo className="h-3.5 w-3.5" />
            </Button>
            <Separator orientation="vertical" className="h-4 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] text-muted-foreground hover:text-destructive px-2"
              onClick={() => {
                if (confirm('Clear formula?')) {
                  handleFormulaChange([]);
                  setInsertionIndex(null);
                }
              }}
              disabled={formula.length === 0}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        <div
          className="flex-1 p-4 bg-slate-50/50 dark:bg-slate-900/20 outline-none focus:outline-none"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('bg-primary/5');
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('bg-primary/5');
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setInsertionIndex(formula.length);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') {
              e.preventDefault();
              if (insertionIndex !== null && insertionIndex < formula.length) {
                setInsertionIndex(insertionIndex + 1);
              }
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault();
              if (insertionIndex !== null && insertionIndex > 0) {
                setInsertionIndex(insertionIndex - 1);
              }
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
              e.preventDefault();
              if (insertionIndex !== null && formula.length > 0) {
                let indexToDelete = insertionIndex;
                if (e.key === 'Backspace' && insertionIndex > 0) {
                  indexToDelete = insertionIndex - 1;
                } else if (e.key === 'Delete' && insertionIndex >= formula.length) {
                  return;
                }
                if (indexToDelete >= 0 && indexToDelete < formula.length) {
                  const newFormula = reindexFormula(formula.filter((_, i) => i !== indexToDelete));
                  handleFormulaChange(newFormula);
                  if (indexToDelete < newFormula.length) {
                    setInsertionIndex(indexToDelete);
                  } else if (newFormula.length > 0) {
                    setInsertionIndex(newFormula.length);
                  } else {
                    setInsertionIndex(null);
                  }
                }
              }
            }
          }}
          tabIndex={0}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('bg-primary/5');
            try {
              const data = JSON.parse(e.dataTransfer.getData('application/json')) as FormulaPayload;
              if (
                data.type === 'function' &&
                (data.value === 'SUM_PRODUCT_EACH' ||
                  data.value === 'PRODUCT_EACH' ||
                  data.value === 'MIN' ||
                  data.value === 'MAX')
              ) {
                insertFunctionCall(
                  data.value as 'SUM_PRODUCT_EACH' | 'PRODUCT_EACH' | 'MIN' | 'MAX',
                );
                return;
              }

              const normalizedRef = normalizeFormulaPayloadReference(data);
              const newStep: FormulaStep = {
                id: `step_${Date.now()}_${Math.random()}`,
                type: data.type,
                value: normalizedRef.value,
                fieldId: normalizedRef.fieldId,
                ratingParameterId: normalizedRef.ratingParameterId,
                order: formula.length,
                label: normalizedRef.label,
                parameterSection: data.parameterSection,
              };
              insertStep(newStep);
            } catch {
              toast({
                title: 'Drag Failed',
                description: 'Could not parse dragged item.',
                variant: 'destructive',
              });
            }
          }}
        >
          {formula.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-full text-center text-muted-foreground cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
              onClick={() => setInsertionIndex(null)}
            >
              <Calculator className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs font-medium">Drag items here to build formula</p>
            </div>
          ) : (
            <div className="flex items-center gap-1 flex-wrap content-start">
              {insertionIndex === 0 && (
                <div className="w-0.5 h-6 bg-primary animate-pulse mx-0.5" />
              )}
              <div
                className="h-6 w-1 hover:bg-primary/20 rounded cursor-text transition-colors"
                onClick={() => setInsertionIndex(0)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setInsertionIndex(0);
                }}
                title="Insert at start"
              />
              {formula.map((step, index) => (
                <React.Fragment key={step.id}>
                  {(() => {
                    const isMissingParameter = isStepMissingParameter(step);
                    return (
                      <>
                        {step.type === 'function' && (
                          <Badge
                            variant="outline"
                            className="group cursor-default transition-all text-xs px-2 py-1 shadow-sm"
                          >
                            {step.value === 'SUM_PRODUCT_EACH'
                              ? 'SUM PRODUCT Each'
                              : step.value === 'PRODUCT_EACH'
                                ? 'PRODUCT Each'
                                : step.value}
                            <X
                              className="w-3 h-3 ml-1 hidden group-hover:inline-block cursor-pointer text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAtIndex(index);
                              }}
                            />
                          </Badge>
                        )}
                        {step.type === 'field' && (
                          <Badge
                            variant="default"
                            className={`group cursor-default transition-all text-xs px-2 py-1 shadow-sm ${
                              isMissingParameter
                                ? 'bg-red-100 text-red-900 border border-red-300'
                                : step.parameterSection === 'DIRECT_VALUE'
                                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                                  : ''
                            }`}
                          >
                            {isMissingParameter ? <AlertTriangle className="w-3 h-3 mr-1" /> : null}
                            {getFieldStepLabel(step)}
                            <X
                              className="w-3 h-3 ml-1 hidden group-hover:inline-block cursor-pointer text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAtIndex(index);
                              }}
                            />
                          </Badge>
                        )}
                        {step.type === 'variable' && (
                          <Badge
                            variant="default"
                            className={`group cursor-default transition-all text-xs px-2 py-1 shadow-sm ${
                              isMissingParameter
                                ? 'bg-red-100 text-red-900 border border-red-300'
                                : String(step.value).startsWith('risk:')
                                  ? 'bg-sky-100 text-sky-900 border border-sky-200'
                                  : 'bg-purple-100 text-purple-900 border border-purple-200'
                            }`}
                          >
                            {isMissingParameter ? <AlertTriangle className="w-3 h-3 mr-1" /> : null}
                            {step.label ||
                              (step.value === 'sumInsured'
                                ? 'Sum Insured'
                                : step.value === 'baseRate'
                                  ? 'Base Rate'
                                  : step.value)}
                            <X
                              className="w-3 h-3 ml-1 hidden group-hover:inline-block cursor-pointer text-purple-700 hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAtIndex(index);
                              }}
                            />
                          </Badge>
                        )}
                        {step.type === 'operator' && (
                          <div className="group relative inline-flex items-center justify-center">
                            <span className="font-mono text-lg text-foreground font-bold px-0.5 select-none">
                              {step.value}
                            </span>
                            <div
                              className="absolute -top-2 -right-2 hidden group-hover:flex bg-destructive text-destructive-foreground rounded-full p-0.5 cursor-pointer shadow-sm z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAtIndex(index);
                              }}
                            >
                              <X className="w-2 h-2" />
                            </div>
                          </div>
                        )}
                        {step.type === 'number' && (
                          <Badge
                            variant="secondary"
                            className="group cursor-default transition-all font-mono text-xs px-1.5 py-0.5 bg-muted border border-border"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              const newValue = prompt('Enter new number value:', step.value);
                              if (newValue === null) return;
                              const numValue = parseFloat(newValue);
                              if (Number.isNaN(numValue)) {
                                toast({
                                  title: 'Invalid Input',
                                  description: 'Please enter a valid number.',
                                  variant: 'destructive',
                                });
                                return;
                              }
                              updateAtIndex(index, { value: String(numValue) });
                            }}
                          >
                            {step.value}
                            <X
                              className="w-3 h-3 ml-1 hidden group-hover:inline-block cursor-pointer text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAtIndex(index);
                              }}
                            />
                          </Badge>
                        )}
                        {step.type === 'percentage' && (
                          <Badge
                            variant="default"
                            className="group cursor-default transition-all font-mono text-xs px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 shadow-sm"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              const newValue = prompt(
                                'Enter new percentage value (e.g., 30 for 30%):',
                                step.value,
                              );
                              if (newValue === null) return;
                              const numValue = parseFloat(newValue);
                              if (Number.isNaN(numValue)) {
                                toast({
                                  title: 'Invalid Input',
                                  description: 'Please enter a valid number for percentage.',
                                  variant: 'destructive',
                                });
                                return;
                              }
                              updateAtIndex(index, { value: String(numValue) });
                            }}
                          >
                            {step.value}%
                            <X
                              className="w-3 h-3 ml-1 hidden group-hover:inline-block cursor-pointer text-amber-800 hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAtIndex(index);
                              }}
                            />
                          </Badge>
                        )}
                        {insertionIndex === index + 1 && (
                          <div className="w-0.5 h-6 bg-primary animate-pulse mx-0.5" />
                        )}
                        <div
                          className="h-6 w-1 hover:bg-primary/20 rounded cursor-text transition-colors"
                          onClick={() => setInsertionIndex(index + 1)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setInsertionIndex(index + 1);
                          }}
                          title="Insert here"
                        />
                      </>
                    );
                  })()}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Toolbox */}
      <div className="w-[200px] flex flex-col gap-2 border rounded-md bg-background/50">
        {showMultiUnitPremiumToggle && (
          <div className="px-2 pt-2 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="multi-unit-premium-toggle"
                className="h-5 w-5"
                checked={multiUnitPremiumEnabled}
                onCheckedChange={(checked) => {
                  const enabled = checked === true;
                  onChangeCombinationPremiumEnabled?.(enabled);
                  if (
                    enabled &&
                    !multiUnitCombinationFieldId &&
                    multiUnitCombinationFieldOptions.length > 0
                  ) {
                    onChangeMultiUnitCombinationFieldId?.(multiUnitCombinationFieldOptions[0]?.id);
                  }
                }}
              />
              <Label
                htmlFor="multi-unit-premium-toggle"
                className="text-[10px] font-medium text-muted-foreground"
              >
                Enable Multi Unit Premium Calculation
              </Label>
            </div>
            {multiUnitPremiumEnabled && multiUnitCombinationFieldOptions.length > 0 && (
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] font-medium text-muted-foreground">
                  Combination Field
                </Label>
                <Select
                  value={multiUnitCombinationFieldId ?? ''}
                  onValueChange={(value) =>
                    onChangeMultiUnitCombinationFieldId?.(value || undefined)
                  }
                >
                  <SelectTrigger className="h-7 px-2 text-[11px]">
                    <SelectValue placeholder="Select combination field" />
                  </SelectTrigger>
                  <SelectContent>
                    {multiUnitCombinationFieldOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {getNonUuidText([opt.label]) || 'Combination Field'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
        <div className="p-2 border-b bg-muted/20">
          <Label className="text-xs font-semibold text-muted-foreground uppercase">Toolbox</Label>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-medium text-muted-foreground">Functions</Label>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { label: 'SUM PRODUCT Each', value: 'SUM_PRODUCT_EACH' as const },
                  { label: 'PRODUCT Each', value: 'PRODUCT_EACH' as const },
                  { label: 'MIN', value: 'MIN' as const },
                  { label: 'MAX', value: 'MAX' as const },
                ].map((fn) => (
                  <DraggableToken
                    key={fn.value}
                    label={fn.label}
                    variant="outline"
                    className="justify-center hover:bg-primary/10 hover:border-primary hover:text-primary py-1"
                    disabled={isInsideEachFunctionArgs}
                    payload={{
                      type: 'function',
                      value: fn.value,
                    }}
                    onClick={() => {
                      insertFunctionCall(fn.value);
                    }}
                  />
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label className="text-[10px] font-medium text-muted-foreground">Operators</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {['+', '-', '*', '/', '(', ')', ','].map((op) => (
                  <DraggableToken
                    key={op}
                    label={<span className="font-mono text-base font-bold">{op}</span>}
                    variant="outline"
                    className="justify-center hover:bg-primary/10 hover:border-primary hover:text-primary py-1"
                    disabled={
                      isInsideEachFunctionArgs || (op === ',' && !isInsideMultiArgFunctionArgs)
                    }
                    payload={{
                      type: 'operator',
                      value: op,
                    }}
                    onClick={() => {
                      const newStep: FormulaStep = {
                        id: `step_${Date.now()}_${Math.random()}`,
                        type: 'operator',
                        value: op,
                      };
                      insertStep(newStep);
                    }}
                  />
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label className="text-[10px] font-medium text-muted-foreground">Numbers</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, '.', '%'].map((num) => (
                  <DraggableToken
                    key={num}
                    label={num}
                    variant="outline"
                    className="justify-center font-mono hover:bg-primary/10 hover:border-primary hover:text-primary"
                    payload={
                      num === '%'
                        ? {
                            type: 'percentage',
                            value: '0',
                          }
                        : {
                            type: 'number',
                            value: String(num),
                          }
                    }
                    onClick={() => {
                      if (num === '%') {
                        const percentValue = prompt(
                          'Enter percentage value (e.g., 30 for 30%):',
                          '0',
                        );
                        if (percentValue === null) return;
                        const numValue = parseFloat(percentValue);
                        if (Number.isNaN(numValue)) {
                          toast({
                            title: 'Invalid Input',
                            description: 'Please enter a valid number for percentage.',
                            variant: 'destructive',
                          });
                          return;
                        }
                        const newStep: FormulaStep = {
                          id: `step_${Date.now()}_${Math.random()}`,
                          type: 'percentage',
                          value: String(numValue),
                        };
                        insertStep(newStep);
                      } else {
                        const newStep: FormulaStep = {
                          id: `step_${Date.now()}_${Math.random()}`,
                          type: 'number',
                          value: String(num),
                        };
                        insertStep(newStep);
                      }
                    }}
                  />
                ))}
              </div>

              <div className="pt-2">
                <div className="flex gap-1.5">
                  <Input
                    type="number"
                    step="any"
                    placeholder="Custom..."
                    className="h-7 text-xs flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (handleCustomNumberAdd(e.currentTarget.value)) {
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-8 px-0"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (handleCustomNumberAdd(input?.value)) {
                        input.value = '';
                      }
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
