import React from 'react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, X } from 'lucide-react';
import type {
  ArithmeticCalculationConfig,
  CalculationConfig,
  CalculationOperation,
  DropdownCalculationCondition,
  DropdownCalculationResult,
  DropdownConditionalCalculationConfig,
  Field,
  Page,
  SubField,
} from '@/features/product-config/proposal-form/api/proposalFormDesign';
import { normalizeOptions, type NormalizedOption } from '@/shared/utils/form-helpers';
import {
  isDateCalculationConfig,
  isDropdownConditionalCalculationConfig,
} from '@/features/proposals/utils/calculation';
import {
  createConditionalLogicCombinationSubFieldAliases,
  createConditionalLogicCombinationSubFieldRef,
} from '@/features/proposals/utils/conditionalLogic';

const DEFAULT_ARITHMETIC_CALCULATION: ArithmeticCalculationConfig = {
  type: 'arithmetic',
  initialField: '',
  operations: [],
};

const DEFAULT_ARITHMETIC_OPERATION: CalculationOperation = {
  operator: '+',
  operandType: 'field',
  field: '',
  manualValue: '',
};

const DEFAULT_DROPDOWN_RESULT: DropdownCalculationResult = {
  selectionMode: 'single',
  selectedValues: [],
  defaultValue: undefined,
};

const DEFAULT_DROPDOWN_CONDITION = (): DropdownCalculationCondition => ({
  id: crypto.randomUUID(),
  field: '',
  operator: 'equals',
  numberMode: 'comparison',
  value: '',
  rangeFrom: undefined,
  rangeTo: undefined,
  selectedValues: [],
  selectionMode: 'single',
  defaultValue: undefined,
});

const DEFAULT_DROPDOWN_CALCULATION: DropdownConditionalCalculationConfig = {
  type: 'dropdownConditional',
  rules: [
    {
      id: crypto.randomUUID(),
      conditionMode: 'and',
      conditions: [DEFAULT_DROPDOWN_CONDITION()],
      result: { ...DEFAULT_DROPDOWN_RESULT },
    },
  ],
};

const parseManualNumberValue = (value?: string | number): number | undefined => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value !== 'string') return undefined;

  const normalizedValue = value.replace(/,/g, '').trim();
  if (!normalizedValue) return undefined;

  const parsedValue = Number(normalizedValue);
  return Number.isNaN(parsedValue) ? undefined : parsedValue;
};

interface CalculationDialogProps {
  isCalculationDialogOpen: boolean;
  setIsCalculationDialogOpen: (open: boolean) => void;
  currentCalculationSubFieldIndex: number | null;
  setCurrentCalculationSubFieldIndex: (index: number | null) => void;
  currentCalculationFieldId: string | null;
  setCurrentCalculationFieldId: (id: string | null) => void;
  currentCalculationSectionId: string | null;
  setCurrentCalculationSectionId: (id: string | null) => void;
  currentCalculationPageId: string | null;
  setCurrentCalculationPageId: (id: string | null) => void;
  tempCalculationConfig: CalculationConfig;
  setTempCalculationConfig: (config: CalculationConfig) => void;
  pages: Page[];
  selectedPageId: string;
  subFieldsConfig: SubField[];
  setSubFieldsConfig: (subFields: SubField[]) => void;
  updatePages: (pages: Page[] | ((pages: Page[]) => Page[])) => void;
}

type SupportedCalculationType = 'arithmetic' | 'date' | 'dropdownConditional' | '';

type FieldOption = {
  label: string;
  value: string;
  aliases: string[];
  fieldType: string;
  options?: NormalizedOption[];
};

const TEMP_COMBINATION_SUBFIELD_ID_PATTERN = /^subfield\d+$/;

const isPersistedCombinationSubFieldId = (subFieldId?: string | null): boolean =>
  Boolean(subFieldId && !TEMP_COMBINATION_SUBFIELD_ID_PATTERN.test(subFieldId));

export const CalculationDialog: React.FC<CalculationDialogProps> = ({
  isCalculationDialogOpen,
  setIsCalculationDialogOpen,
  currentCalculationSubFieldIndex,
  setCurrentCalculationSubFieldIndex,
  currentCalculationFieldId,
  setCurrentCalculationFieldId,
  currentCalculationSectionId,
  setCurrentCalculationSectionId,
  currentCalculationPageId,
  setCurrentCalculationPageId,
  tempCalculationConfig,
  setTempCalculationConfig,
  pages,
  selectedPageId,
  subFieldsConfig,
  setSubFieldsConfig,
  updatePages,
}) => {
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const operationRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const pendingOperationFocusIndex = React.useRef<number | null>(null);
  const pendingDropdownFocus = React.useRef<
    | {
        type: 'condition' | 'rule';
        ruleId: string;
        conditionId?: string;
      }
    | null
  >(null);
  const [selectedCalculationType, setSelectedCalculationType] =
    React.useState<SupportedCalculationType>('');

  const matchesRef = React.useCallback(
    (aliases: string[], ref?: string | null) => !!ref && aliases.some((alias) => alias === ref),
    [],
  );

  const resolveSelectValue = React.useCallback(
    (options: FieldOption[], ref?: string) => {
      if (!ref) return '';
      return options.find((option) => matchesRef(option.aliases, ref))?.value || ref;
    },
    [matchesRef],
  );

  const buildPageFieldRef = (valueRef?: string | null, nameRef?: string | null) => {
    const rawRef = (valueRef as string) || (nameRef as string);
    return rawRef ? `PAGE__${rawRef}` : rawRef;
  };

  const getCanonicalCombinationSubFieldRef = React.useCallback((subField: SubField) => {
    const subFieldId = typeof subField.id === 'string' ? subField.id : '';
    if (isPersistedCombinationSubFieldId(subFieldId)) {
      return subFieldId;
    }

    return subField.name || subFieldId;
  }, []);

  const createOption = React.useCallback(
    (
      label: string,
      fieldType: string,
      valueRef?: string | null,
      nameRef?: string | null,
      contextLabel?: string,
      scope: 'page' | 'local' = 'local',
      options?: Array<string | { label: string; value: string }>,
      extraAliases: string[] = [],
    ): FieldOption => ({
      label: contextLabel ? `${label} (${contextLabel})` : label,
      fieldType,
      value:
        scope === 'page'
          ? buildPageFieldRef(valueRef, nameRef)
          : (valueRef as string) || (nameRef as string),
      aliases:
        scope === 'page'
          ? Array.from(
              new Set([
                buildPageFieldRef(valueRef, nameRef),
                valueRef,
                nameRef,
                ...extraAliases,
              ].filter(Boolean) as string[]),
            )
          : Array.from(
              new Set([valueRef, nameRef, ...extraAliases].filter(Boolean) as string[]),
            ),
      options: normalizeOptions(options),
    }),
    [],
  );

  const dedupeFieldOptions = React.useCallback(
    (options: FieldOption[]) =>
      options.filter(
        (option, index, allOptions) =>
          index === allOptions.findIndex((candidate) => candidate.value === option.value),
      ),
    [],
  );

  const currentTargetField = React.useMemo(() => {
    if (currentCalculationSubFieldIndex !== null) {
      return subFieldsConfig[currentCalculationSubFieldIndex] || null;
    }

    if (!currentCalculationFieldId) return null;

    for (const page of pages) {
      for (const section of page.sections || []) {
        const field = section.fields.find((candidate) => {
          const fieldRef = (candidate.id as string) || candidate.name;
          return fieldRef === currentCalculationFieldId || candidate.name === currentCalculationFieldId;
        });

        if (field) return field;
      }
    }

    return null;
  }, [currentCalculationFieldId, currentCalculationSubFieldIndex, pages, subFieldsConfig]);

  const targetFieldType = currentTargetField?.type || '';

  const supportedCalculationTypes = React.useMemo(() => {
    if (targetFieldType === 'number') return ['arithmetic', 'date'] as SupportedCalculationType[];
    if (targetFieldType === 'date') return ['date'] as SupportedCalculationType[];
    if (targetFieldType === 'dropdown') return ['dropdownConditional'] as SupportedCalculationType[];
    return ['arithmetic', 'date'] as SupportedCalculationType[];
  }, [targetFieldType]);

  let arithmeticFields: FieldOption[] = [];
  let dateFields: FieldOption[] = [];
  let initialDateFields: FieldOption[] = [];
  let dropdownConditionFields: FieldOption[] = [];
  let targetDropdownOptions: NormalizedOption[] = [];

  if (currentCalculationSubFieldIndex !== null) {
    const page = pages.find((p) => p.id === selectedPageId);
    const numericFieldsOnPage =
      page?.sections?.flatMap((section) =>
        (section.fields || [])
          .filter((f) => f.type === 'number')
          .map((f) =>
            createOption(
              f.label,
              f.type,
              f.id,
              f.name,
              section.title ? `Section: ${section.title}` : undefined,
              'page',
              f.options,
            ),
          ),
      ) ?? [];
    const numericSubFields = subFieldsConfig
      .filter((sf, idx) => sf.type === 'number' && idx !== currentCalculationSubFieldIndex)
      .map((sf) =>
        createOption(
          sf.label,
          sf.type,
          getCanonicalCombinationSubFieldRef(sf),
          sf.id === getCanonicalCombinationSubFieldRef(sf) ? sf.name : sf.id,
          undefined,
          'local',
          sf.options,
        ),
      );
    const dateFieldsAcrossProposal =
      pages.flatMap((proposalPage) =>
        proposalPage.sections?.flatMap((section) =>
          (section.fields || [])
            .filter((f) => f.type === 'date')
            .map((f) =>
              createOption(
                f.label,
                f.type,
                f.id,
                f.name,
                [proposalPage.title || proposalPage.id || 'Page', section.title || '']
                  .filter(Boolean)
                  .join(' - '),
                'page',
                f.options,
              ),
            ),
        ) ?? [],
      ) ?? [];
    const dateFieldsOnPage =
      page?.sections?.flatMap((section) =>
        (section.fields || [])
          .filter((f) => f.type === 'date')
          .map((f) =>
            createOption(
              f.label,
              f.type,
              f.id,
              f.name,
              section.title ? `Section: ${section.title}` : undefined,
              'page',
              f.options,
            ),
          ),
      ) ?? [];
    const combinationDateSubFieldsOnPage =
      page?.sections?.flatMap((section) =>
        (section.fields || [])
          .filter((field) => field.type === 'combination' && field.subFields?.length)
          .flatMap(
            (field) =>
              field.subFields
                ?.filter((sf) => sf.type === 'date')
                .map((sf) =>
                  createOption(
                    sf.label,
                    sf.type,
                    sf.id,
                    sf.name,
                    [field.label, section.title ? `Section: ${section.title}` : '']
                      .filter(Boolean)
                      .join(' - '),
                  ),
                ) ?? [],
          ),
      ) ?? [];
    const currentCombinationDateSubFields = subFieldsConfig
      .filter((sf, idx) => sf.type === 'date' && idx !== currentCalculationSubFieldIndex)
      .map((sf) =>
        createOption(
          sf.label,
          sf.type,
          getCanonicalCombinationSubFieldRef(sf),
          sf.id === getCanonicalCombinationSubFieldRef(sf) ? sf.name : sf.id,
        ),
      );
    const currentCombinationConditionFields = subFieldsConfig
      .filter(
        (sf, idx) =>
          idx !== currentCalculationSubFieldIndex &&
          ['text', 'textarea', 'number', 'date', 'dropdown'].includes(sf.type),
      )
      .map((sf) =>
        createOption(
          sf.label,
          sf.type,
          getCanonicalCombinationSubFieldRef(sf),
          sf.id === getCanonicalCombinationSubFieldRef(sf) ? sf.name : sf.id,
          'Same combination row',
          'local',
          sf.options,
        ),
      );
    const pageConditionFields =
      page?.sections?.flatMap((section) =>
        (section.fields || [])
          .filter((f) => ['text', 'textarea', 'number', 'date', 'dropdown'].includes(f.type))
          .map((f) =>
            createOption(
              f.label,
              f.type,
              f.id,
              f.name,
              section.title ? `Section: ${section.title}` : undefined,
              'page',
              f.options,
            ),
          ),
      ) ?? [];

    arithmeticFields = [...numericFieldsOnPage, ...numericSubFields];
    initialDateFields = dedupeFieldOptions([
      ...dateFieldsAcrossProposal,
      ...currentCombinationDateSubFields,
      ...combinationDateSubFieldsOnPage,
    ]);
    dateFields = dedupeFieldOptions([
      ...dateFieldsOnPage,
      ...currentCombinationDateSubFields,
      ...combinationDateSubFieldsOnPage,
    ]);
    dropdownConditionFields = dedupeFieldOptions([
      ...pageConditionFields,
      ...currentCombinationConditionFields,
    ]);
    targetDropdownOptions = normalizeOptions(subFieldsConfig[currentCalculationSubFieldIndex]?.options);
  } else if (currentCalculationFieldId !== null) {
    const page = pages.find((p) => p.id === currentCalculationPageId);
    const numericFieldsOnPage =
      page?.sections?.flatMap((section) =>
        (section.fields || [])
          .filter(
            (f) =>
              f.type === 'number' &&
              !matchesRef([f.id, f.name].filter(Boolean) as string[], currentCalculationFieldId),
          )
          .map((f) =>
            createOption(
              f.label,
              f.type,
              f.id,
              f.name,
              section.title ? `Section: ${section.title}` : undefined,
              'local',
              f.options,
            ),
          ),
      ) ?? [];
    const combinationAggregations =
      page?.sections?.flatMap((section) =>
        (section.fields || [])
          .filter((f) => f.type === 'combination' && f.subFields)
          .flatMap(
            (f) =>
              f.subFields
                ?.filter((sf) => sf.type === 'number')
                .map((sf) =>
                  createOption(
                    section.title
                      ? `Sum of ${sf.label} (${f.label} - Section: ${section.title})`
                      : `Sum of ${sf.label} (${f.label})`,
                    'number',
                    `SUM__${(f.id as string) || f.name}__${(sf.id as string) || sf.name}`,
                    undefined,
                  ),
                ) ?? [],
          ),
      ) ?? [];
    const dateFieldsOnPage =
      page?.sections?.flatMap((section) =>
        (section.fields || [])
          .filter(
            (f) =>
              f.type === 'date' &&
              !matchesRef([f.id, f.name].filter(Boolean) as string[], currentCalculationFieldId),
          )
          .map((f) =>
            createOption(
              f.label,
              f.type,
              f.id,
              f.name,
              section.title ? `Section: ${section.title}` : undefined,
              'local',
              f.options,
            ),
          ),
      ) ?? [];
    const conditionFieldsOnPage =
      page?.sections?.flatMap((section) =>
        (section.fields || [])
          .filter(
            (f) =>
              ['text', 'textarea', 'number', 'date', 'dropdown'].includes(f.type) &&
              !matchesRef([f.id, f.name].filter(Boolean) as string[], currentCalculationFieldId),
          )
          .map((f) =>
            createOption(
              f.label,
              f.type,
              f.id,
              f.name,
              section.title ? `Section: ${section.title}` : undefined,
              'local',
              f.options,
            ),
          ),
      ) ?? [];
    const combinationConditionFieldsOnPage =
      page?.sections?.flatMap((section) =>
        (section.fields || [])
          .filter((f) => f.type === 'combination' && f.subFields?.length)
          .flatMap(
            (f) =>
              f.subFields
                ?.filter((sf) => ['text', 'textarea', 'number', 'date', 'dropdown'].includes(sf.type))
                .map((sf) => {
                  const combinationAliases = createConditionalLogicCombinationSubFieldAliases(
                    [f.id as string, f.name],
                    [sf.id as string, sf.name],
                  );

                  return createOption(
                    `${sf.label} (${f.label})`,
                    sf.type,
                    createConditionalLogicCombinationSubFieldRef(
                      (f.id as string) || f.name,
                      (sf.id as string) || sf.name,
                    ),
                    undefined,
                    section.title ? `Section: ${section.title}` : undefined,
                    'page',
                    sf.options,
                    combinationAliases,
                  );
                }) ?? [],
          ),
      ) ?? [];

    arithmeticFields = [...numericFieldsOnPage, ...combinationAggregations];
    dateFields = dateFieldsOnPage;
    initialDateFields = dateFieldsOnPage;
    dropdownConditionFields = dedupeFieldOptions([
      ...conditionFieldsOnPage,
      ...combinationConditionFieldsOnPage,
    ]);
    targetDropdownOptions = normalizeOptions((currentTargetField as Field | null)?.options);
  }

  const getConditionFieldMeta = React.useCallback(
    (fieldRef?: string) =>
      dropdownConditionFields.find((option) => matchesRef(option.aliases, fieldRef)) || null,
    [dropdownConditionFields, matchesRef],
  );

  const hasArithmeticConfig =
    tempCalculationConfig.type !== 'date' &&
    tempCalculationConfig.type !== 'dropdownConditional' &&
    (Boolean(tempCalculationConfig.initialField) || Boolean(tempCalculationConfig.operations?.length));
  const hasConfiguredDropdownRules =
    isDropdownConditionalCalculationConfig(tempCalculationConfig) &&
    tempCalculationConfig.rules.some((rule) =>
      rule.conditions.some((condition) => Boolean(condition.field)),
    );
  const hasDropdownConfig =
    isDropdownConditionalCalculationConfig(tempCalculationConfig) &&
    (hasConfiguredDropdownRules || Boolean(tempCalculationConfig.fallbackResult));
  const nonDropdownInitialField =
    tempCalculationConfig.type !== 'dropdownConditional' ? tempCalculationConfig.initialField : '';
  const calculationType: SupportedCalculationType =
    selectedCalculationType ||
    (targetFieldType === 'dropdown'
      ? 'dropdownConditional'
      : '')
    ||
    (tempCalculationConfig.type === 'date'
      ? 'date'
      : tempCalculationConfig.type === 'dropdownConditional'
        ? 'dropdownConditional'
        : hasArithmeticConfig
          ? 'arithmetic'
          : '');
  const initialFieldOptions =
    calculationType === 'date' ? initialDateFields || dateFields : arithmeticFields;
  const comparisonFieldOptions = (calculationType === 'date' ? initialDateFields : dateFields).filter(
    (option) => !matchesRef(option.aliases, nonDropdownInitialField),
  );
  const isDateCalculation = isDateCalculationConfig(tempCalculationConfig);
  const isDropdownCalculation = isDropdownConditionalCalculationConfig(tempCalculationConfig);
  const arithmeticCalculation =
    !isDateCalculation && !isDropdownCalculation ? tempCalculationConfig : null;
  const dropdownCalculation = isDropdownCalculation ? tempCalculationConfig : null;
  const getArithmeticOperandType = React.useCallback(
    (operation: CalculationOperation): 'field' | 'manual' =>
      operation.operandType ||
      (operation.field ? 'field' : operation.manualValue !== undefined ? 'manual' : 'field'),
    [],
  );
  const isArithmeticOperationComplete = React.useCallback(
    (operation: CalculationOperation) => {
      const operandType = getArithmeticOperandType(operation);
      if (operandType === 'manual') {
        return String(operation.manualValue ?? '').trim() !== '';
      }

      return Boolean(operation.field);
    },
    [getArithmeticOperandType],
  );
  const updateArithmeticOperation = React.useCallback(
    (index: number, nextOperation: CalculationOperation) => {
      const nextOperations = [...(arithmeticCalculation?.operations || [])];
      nextOperations[index] = nextOperation;
      setTempCalculationConfig({
        ...(arithmeticCalculation || DEFAULT_ARITHMETIC_CALCULATION),
        type: 'arithmetic',
        operations: nextOperations,
      });
    },
    [arithmeticCalculation, setTempCalculationConfig],
  );
  const arithmeticInitialFieldOptions = React.useMemo(() => {
    if (!arithmeticCalculation) return initialFieldOptions;

    const selectedOperationFields = new Set(
      (arithmeticCalculation.operations || [])
        .filter((operation) => getArithmeticOperandType(operation) === 'field' && operation.field)
        .map((operation) => operation.field as string),
    );

    return initialFieldOptions.filter(
      (option) =>
        matchesRef(option.aliases, arithmeticCalculation.initialField) ||
        !option.aliases.some((alias) => selectedOperationFields.has(alias)),
    );
  }, [arithmeticCalculation, getArithmeticOperandType, initialFieldOptions, matchesRef]);
  const getArithmeticOperationFieldOptions = React.useCallback(
    (currentIndex: number) => {
      const currentOperation = arithmeticCalculation?.operations?.[currentIndex];
      const selectedByOtherOperations = new Set(
        (arithmeticCalculation?.operations || [])
          .filter(
            (operation, index) =>
              index !== currentIndex &&
              getArithmeticOperandType(operation) === 'field' &&
              operation.field,
          )
          .map((operation) => operation.field as string),
      );

      return arithmeticFields.filter((option) => {
        const isCurrentSelection = matchesRef(option.aliases, currentOperation?.field);
        const matchesInitialField = matchesRef(option.aliases, nonDropdownInitialField);
        const selectedElsewhere = option.aliases.some((alias) =>
          selectedByOtherOperations.has(alias),
        );

        if (isCurrentSelection) return true;
        if (matchesInitialField) return false;
        if (selectedElsewhere) return false;
        return true;
      });
    },
    [
      arithmeticCalculation?.operations,
      arithmeticFields,
      getArithmeticOperandType,
      matchesRef,
      nonDropdownInitialField,
    ],
  );
  const selectedInitialFieldValue = resolveSelectValue(
    arithmeticCalculation ? arithmeticInitialFieldOptions : initialFieldOptions,
    nonDropdownInitialField,
  );
  const selectedComparisonFieldValue = isDateCalculation
    ? resolveSelectValue(comparisonFieldOptions, tempCalculationConfig.comparisonField)
    : '';

  const isDropdownCalculationComplete = React.useMemo(() => {
    if (!dropdownCalculation) return true;

    const hasConfiguredRules = dropdownCalculation.rules.some((rule) =>
      rule.conditions.some((condition) => Boolean(condition.field)),
    );

    if (!hasConfiguredRules && !dropdownCalculation.fallbackResult) {
      return true;
    }

    const isResultValid = (result?: DropdownCalculationResult) => {
      if (!result) return true;
      if (result.selectionMode === 'all') return true;
      if (result.selectionMode === 'single') return result.selectedValues.length === 1;
      return result.selectedValues.length > 0;
    };

    return dropdownCalculation.rules.every((rule) => {
      if (!isResultValid(rule.result)) return false;

      const conditionMatches = rule.conditions.map((condition) => {
        if (!condition.field) return false;

        const fieldMeta = getConditionFieldMeta(condition.field);
        if (fieldMeta?.fieldType === 'number' && condition.numberMode === 'range') {
          return (
            typeof condition.rangeFrom === 'number' ||
            typeof condition.rangeTo === 'number'
          );
        }

        if (fieldMeta?.fieldType === 'dropdown') {
          if (condition.selectionMode === 'single') {
            return (condition.selectedValues || []).length === 1;
          }

          return (condition.selectedValues || []).length > 0;
        }

        return String(condition.value ?? '').trim() !== '';
      });

      return (rule.conditionMode || 'and') === 'or'
        ? conditionMatches.some(Boolean)
        : conditionMatches.every(Boolean);
    }) && isResultValid(dropdownCalculation.fallbackResult);
  }, [dropdownCalculation, getConditionFieldMeta]);

  const isCalculationComplete = React.useMemo(() => {
    if (!tempCalculationConfig || !calculationType) return true;

    if (isDropdownCalculation) return isDropdownCalculationComplete;

    if (!nonDropdownInitialField) return true;
    if (!isDateCalculation) {
      return (arithmeticCalculation?.operations || []).every(isArithmeticOperationComplete);
    }

    if (tempCalculationConfig.comparisonMode === 'differentDateField') {
      return Boolean(tempCalculationConfig.comparisonField);
    }

    if (tempCalculationConfig.comparisonMode === 'customDate') {
      return Boolean(tempCalculationConfig.customDate);
    }

    return true;
  }, [
    calculationType,
    arithmeticCalculation?.operations,
    isDateCalculation,
    isArithmeticOperationComplete,
    isDropdownCalculation,
    isDropdownCalculationComplete,
    tempCalculationConfig,
  ]);

  const hasCalculation = React.useMemo(() => {
    if (isDropdownCalculation) {
      return hasDropdownConfig;
    }

    return Boolean(nonDropdownInitialField && isCalculationComplete);
  }, [hasDropdownConfig, isCalculationComplete, isDropdownCalculation, nonDropdownInitialField]);

  React.useEffect(() => {
    if (targetFieldType === 'dropdown') {
      setSelectedCalculationType('dropdownConditional');
      if (tempCalculationConfig.type !== 'dropdownConditional') {
        setTempCalculationConfig({
          ...DEFAULT_DROPDOWN_CALCULATION,
          rules: [
            {
              id: crypto.randomUUID(),
              conditionMode: 'and',
              conditions: [DEFAULT_DROPDOWN_CONDITION()],
              result: { ...DEFAULT_DROPDOWN_RESULT },
            },
          ],
        });
      }
      return;
    }

    if (tempCalculationConfig.type === 'date') {
      setSelectedCalculationType('date');
      return;
    }

    if (tempCalculationConfig.type === 'dropdownConditional') {
      setSelectedCalculationType('dropdownConditional');
      return;
    }

    if (tempCalculationConfig.type === 'arithmetic') {
      setSelectedCalculationType('arithmetic');
      return;
    }

    if (hasArithmeticConfig) {
      setSelectedCalculationType('arithmetic');
      return;
    }

    setSelectedCalculationType('');
  }, [tempCalculationConfig.type, hasArithmeticConfig, targetFieldType, setTempCalculationConfig]);

  React.useEffect(() => {
    if (pendingOperationFocusIndex.current === null || isDateCalculation || isDropdownCalculation) {
      return;
    }

    const row = operationRefs.current[pendingOperationFocusIndex.current];
    const container = scrollContainerRef.current;

    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }

    if (!row) return;

    window.setTimeout(() => {
      row.scrollIntoView({ behavior: 'smooth', block: 'end' });
      const trigger = row.querySelector('button');
      if (trigger instanceof HTMLButtonElement) {
        trigger.focus();
      }
      pendingOperationFocusIndex.current = null;
    }, 120);
  }, [arithmeticCalculation?.operations?.length, isDateCalculation, isDropdownCalculation]);

  React.useEffect(() => {
    if (!dropdownCalculation || !pendingDropdownFocus.current) return;

    const container = scrollContainerRef.current;
    const pendingTarget = pendingDropdownFocus.current;
    const selector =
      pendingTarget.type === 'condition'
        ? `[data-dropdown-condition-id="${pendingTarget.conditionId}"]`
        : `[data-dropdown-rule-id="${pendingTarget.ruleId}"]`;
    const element = container?.querySelector<HTMLElement>(selector);

    if (!container || !element) return;

    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });

    window.setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      element.focus();
      pendingDropdownFocus.current = null;
    }, 140);
  }, [dropdownCalculation]);

  const addOperation = () => {
    const nextIndex = arithmeticCalculation?.operations?.length || 0;
    pendingOperationFocusIndex.current = nextIndex;
    setTempCalculationConfig({
      ...(arithmeticCalculation || DEFAULT_ARITHMETIC_CALCULATION),
      type: 'arithmetic',
      operations: [...(arithmeticCalculation?.operations || []), { ...DEFAULT_ARITHMETIC_OPERATION }],
    });
  };

  const updateDropdownCalculation = (
    updater: (current: DropdownConditionalCalculationConfig) => DropdownConditionalCalculationConfig,
  ) => {
    const current = dropdownCalculation || DEFAULT_DROPDOWN_CALCULATION;
    setTempCalculationConfig(updater(current));
  };

  const getReservedConditionOptionValues = React.useCallback(
    (fieldRef: string, ruleIndex: number, conditionIndex: number) => {
      if (!dropdownCalculation || !fieldRef) return new Set<string>();

      const reservedValues = new Set<string>();
      const currentRule = dropdownCalculation.rules[ruleIndex];
      if (!currentRule) return reservedValues;

      currentRule.conditions.forEach((condition, currentConditionIndex) => {
        if (currentConditionIndex === conditionIndex) return;
        if (condition.field !== fieldRef) return;

        (condition.selectedValues || []).forEach((value) => reservedValues.add(value));
      });

      return reservedValues;
    },
    [dropdownCalculation],
  );

  const normalizeCombinationSubFieldCalculationRefs = React.useCallback(
    (config: CalculationConfig): CalculationConfig => {
      if (currentCalculationSubFieldIndex === null) return config;

      const refMap = new Map<string, string>();
      subFieldsConfig.forEach((subField, idx) => {
        if (idx === currentCalculationSubFieldIndex) return;

        const canonicalRef = getCanonicalCombinationSubFieldRef(subField);
        if (!canonicalRef) return;

        if (subField.id) refMap.set(subField.id, canonicalRef);
        if (subField.name) refMap.set(subField.name, canonicalRef);
      });

      const normalizeFieldRef = (fieldRef?: string) =>
        fieldRef ? refMap.get(fieldRef) || fieldRef : fieldRef;

      if (config.type === 'dropdownConditional') {
        return {
          ...config,
          rules: (config.rules || []).map((rule) => ({
            ...rule,
            conditions: (rule.conditions || []).map((condition) => ({
              ...condition,
              field: normalizeFieldRef(condition.field) || '',
            })),
          })),
          fallbackResult: config.fallbackResult,
        };
      }

      if (config.type === 'date') {
        return {
          ...config,
          initialField: normalizeFieldRef(config.initialField) || '',
          comparisonField: normalizeFieldRef(config.comparisonField),
        };
      }

      return {
        ...config,
        initialField: normalizeFieldRef(config.initialField) || '',
        operations: (config.operations || []).map((operation) => ({
          ...operation,
          field: normalizeFieldRef(operation.field),
        })),
      };
    },
    [
      currentCalculationSubFieldIndex,
      getCanonicalCombinationSubFieldRef,
      subFieldsConfig,
    ],
  );

  React.useEffect(() => {
    if (!dropdownCalculation) return;

    let hasChanges = false;
    const nextRules = dropdownCalculation.rules.map((rule, ruleIndex) => ({
      ...rule,
      conditions: rule.conditions.map((condition, conditionIndex) => {
        if (condition.selectionMode !== 'remaining' || !condition.field) {
          return condition;
        }

        const fieldMeta = getConditionFieldMeta(condition.field);
        if (fieldMeta?.fieldType !== 'dropdown') {
          return condition;
        }

        const reservedValues = getReservedConditionOptionValues(
          condition.field,
          ruleIndex,
          conditionIndex,
        );
        const autoSelectedValues = (fieldMeta.options || [])
          .map((option) => option.value)
          .filter((value) => !reservedValues.has(value));
        const nextDefaultValue =
          condition.defaultValue && autoSelectedValues.includes(condition.defaultValue)
            ? condition.defaultValue
            : undefined;
        const isSelectionSame =
          autoSelectedValues.length === (condition.selectedValues || []).length &&
          autoSelectedValues.every((value, index) => value === (condition.selectedValues || [])[index]);

        if (isSelectionSame && nextDefaultValue === condition.defaultValue) {
          return condition;
        }

        hasChanges = true;
        return {
          ...condition,
          selectedValues: autoSelectedValues,
          defaultValue: nextDefaultValue,
        };
      }),
    }));

    if (hasChanges) {
      setTempCalculationConfig({
        ...dropdownCalculation,
        rules: nextRules,
      });
    }
  }, [
    dropdownCalculation,
    getConditionFieldMeta,
    getReservedConditionOptionValues,
    setTempCalculationConfig,
  ]);

  const renderSelectionEditor = (
    title: string,
    selection: DropdownCalculationResult | DropdownCalculationCondition,
    availableOptions: NormalizedOption[],
    onChange: (next: DropdownCalculationResult | DropdownCalculationCondition) => void,
    options?: {
      autoSelectRemaining?: boolean;
      allowSelectAll?: boolean;
      helperText?: string;
      showDefaultOption?: boolean;
    },
  ) => {
    const currentSelectionMode = selection.selectionMode || 'single';
    const selectedValues =
      currentSelectionMode === 'all'
        ? availableOptions.map((option) => option.value)
        : currentSelectionMode === 'remaining' && options?.autoSelectRemaining
        ? availableOptions.map((option) => option.value)
        : selection.selectedValues || [];
    const selectedOptionItems = availableOptions.filter((option) =>
      selectedValues.includes(option.value),
    );
    const effectiveDefaultOptions =
      availableOptions.filter((option) => selectedValues.includes(option.value));

    return (
      <div className="space-y-3 rounded-lg border bg-muted/10 p-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{title}</Label>
          <Select
            value={currentSelectionMode}
            onValueChange={(value: 'single' | 'multiple' | 'remaining' | 'all') => {
              const nextSelectedValues =
                value === 'all'
                  ? []
                  : value === 'remaining' && options?.autoSelectRemaining
                  ? []
                  : value === 'single'
                    ? []
                    : [];
              onChange({
                ...selection,
                selectionMode: value,
                selectedValues: nextSelectedValues,
                defaultValue: undefined,
              });
            }}
          >
            <SelectTrigger className="h-10 bg-background">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single option</SelectItem>
              <SelectItem value="multiple">Multiple options</SelectItem>
              {options?.autoSelectRemaining ? (
                <SelectItem value="remaining">Select remaining options</SelectItem>
              ) : null}
              {options?.allowSelectAll ? (
                <SelectItem value="all">Select all options</SelectItem>
              ) : null}
            </SelectContent>
          </Select>
          {options?.helperText ? (
            <p className="text-xs text-muted-foreground">{options.helperText}</p>
          ) : null}
        </div>

        {(currentSelectionMode === 'remaining' && options?.autoSelectRemaining) ||
        currentSelectionMode === 'all' ? (
          <div className="rounded-md border bg-background p-3 text-sm text-muted-foreground">
            {selectedValues.length > 0
              ? `${
                  currentSelectionMode === 'all'
                    ? 'Auto-selected all options'
                    : 'Auto-selected remaining options'
                }: ${availableOptions
                  .filter((option) => selectedValues.includes(option.value))
                  .map((option) => option.label)
                  .join(', ')}`
              : currentSelectionMode === 'all'
                ? 'No options available.'
                : 'No remaining options available.'}
          </div>
        ) : (
          <div className="space-y-3">
            {selectedOptionItems.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedOptionItems.map((option) => (
                  <Badge key={option.value} variant="secondary" className="flex items-center gap-1">
                    <span>{option.label}</span>
                    <button
                      type="button"
                      className="rounded-sm hover:text-destructive"
                      onClick={() => {
                        const nextSelectedValues = selectedValues.filter(
                          (value) => value !== option.value,
                        );

                        onChange({
                          ...selection,
                          selectedValues: nextSelectedValues,
                          defaultValue:
                            selection.defaultValue &&
                            nextSelectedValues.includes(selection.defaultValue)
                              ? selection.defaultValue
                              : undefined,
                        });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border bg-background p-3">
              {availableOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No options available.</p>
              ) : (
                availableOptions.map((option) => {
                  const checked = selectedValues.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(isChecked) => {
                          const nextSelectedValues =
                            currentSelectionMode === 'single'
                              ? isChecked
                                ? [option.value]
                                : []
                              : isChecked
                                ? [...selectedValues, option.value]
                                : selectedValues.filter((value) => value !== option.value);

                          onChange({
                            ...selection,
                            selectedValues: Array.from(new Set(nextSelectedValues)),
                            defaultValue:
                              selection.defaultValue &&
                              Array.from(new Set(nextSelectedValues)).includes(selection.defaultValue)
                                ? selection.defaultValue
                                : undefined,
                          });
                        }}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}

        {options?.showDefaultOption !== false && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Default option</Label>
            <Select
              value={selection.defaultValue || 'none'}
              onValueChange={(value) =>
                onChange({
                  ...selection,
                  defaultValue: value === 'none' ? undefined : value,
                })
              }
            >
              <SelectTrigger className="h-10 bg-background">
                <SelectValue placeholder="Select default option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No default option</SelectItem>
                {effectiveDefaultOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  };

  const renderConditionEditor = (
    condition: DropdownCalculationCondition,
    ruleIndex: number,
    conditionIndex: number,
  ) => {
    const fieldMeta = getConditionFieldMeta(condition.field);
    const fieldType = fieldMeta?.fieldType || '';
    const sourceOptions = fieldMeta?.options || [];
    const reservedSourceValues = getReservedConditionOptionValues(
      condition.field,
      ruleIndex,
      conditionIndex,
    );
    const selectableSourceOptions = sourceOptions.filter(
      (option) =>
        !reservedSourceValues.has(option.value) ||
        (condition.selectedValues || []).includes(option.value),
    );

    const updateCondition = (nextCondition: DropdownCalculationCondition) => {
      updateDropdownCalculation((current) => ({
        ...current,
        rules: current.rules.map((rule, idx) =>
          idx === ruleIndex
            ? {
                ...rule,
                conditions: rule.conditions.map((candidateCondition, candidateIndex) =>
                  candidateIndex === conditionIndex ? nextCondition : candidateCondition,
                ),
              }
            : rule,
        ),
      }));
    };

    const operatorOptions =
      fieldType === 'number'
        ? [
            ['equals', 'Equal'],
            ['not_equals', 'Not Equal'],
            ['greater_than', 'Greater Than'],
            ['less_than', 'Less Than'],
            ['greater_than_or_equal', 'Greater Than or Equal'],
            ['less_than_or_equal', 'Less Than or Equal'],
          ]
        : fieldType === 'dropdown'
          ? [
              ['equals', 'Equal'],
              ['not_equals', 'Not Equal'],
              ['contains', 'Contains'],
              ['not_contains', 'Not Contains'],
            ]
          : [
              ['equals', 'Equal'],
              ['not_equals', 'Not Equal'],
              ['contains', 'Contains'],
              ['not_contains', 'Not Contains'],
            ];

    return (
      <div
        className="space-y-3 rounded-lg border bg-background p-3"
        data-dropdown-condition-id={condition.id}
        tabIndex={-1}
      >
        <div className="grid gap-3 md:grid-cols-[1.35fr_1fr_auto]">
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Field
            </Label>
            <Select
              value={resolveSelectValue(dropdownConditionFields, condition.field)}
              onValueChange={(value) => {
                const nextFieldMeta =
                  dropdownConditionFields.find((option) => option.value === value) || null;
                updateCondition({
                  ...DEFAULT_DROPDOWN_CONDITION(),
                  id: condition.id,
                  field: value,
                  operator:
                    nextFieldMeta?.fieldType === 'number' ? 'equals' : 'equals',
                });
              }}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {dropdownConditionFields.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {fieldType === 'number' ? (
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Mode
              </Label>
              <Select
                value={condition.numberMode || 'comparison'}
                onValueChange={(value: 'comparison' | 'range') =>
                  updateCondition({
                    ...condition,
                    numberMode: value,
                    operator: value === 'range' ? 'greater_than_or_equal' : 'equals',
                    value: '',
                    rangeFrom: undefined,
                    rangeTo: undefined,
                  })
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comparison">Condition based</SelectItem>
                  <SelectItem value="range">Range based</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Operator
              </Label>
              <Select
                value={condition.operator}
                onValueChange={(value: DropdownCalculationCondition['operator']) =>
                  updateCondition({
                    ...condition,
                    operator: value,
                  })
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operatorOptions.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-end justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-destructive"
              onClick={() =>
                updateDropdownCalculation((current) => ({
                  ...current,
                  rules: current.rules.map((rule, idx) =>
                    idx === ruleIndex
                      ? {
                          ...rule,
                          conditions:
                            rule.conditions.length > 1
                              ? rule.conditions.filter((_, idx2) => idx2 !== conditionIndex)
                              : [DEFAULT_DROPDOWN_CONDITION()],
                        }
                      : rule,
                  ),
                }))
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {fieldType === 'number' && (
          <>
            {(condition.numberMode || 'comparison') === 'comparison' ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Operator
                  </Label>
                  <Select
                    value={condition.operator}
                    onValueChange={(value: DropdownCalculationCondition['operator']) =>
                      updateCondition({ ...condition, operator: value })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorOptions.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Value
                  </Label>
                  <FormattedNumberInput
                    value={typeof condition.value === 'number' ? condition.value : undefined}
                    allowEmpty
                    className="max-w-[15rem]"
                    onChange={(value) =>
                      updateCondition({
                        ...condition,
                        value: value ?? '',
                      })
                    }
                    placeholder="Enter value"
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    From
                  </Label>
                  <FormattedNumberInput
                    value={condition.rangeFrom}
                    allowEmpty
                    onChange={(value) =>
                      updateCondition({
                        ...condition,
                        rangeFrom: value,
                      })
                    }
                    placeholder="Minimum value"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    To
                  </Label>
                  <FormattedNumberInput
                    value={condition.rangeTo}
                    allowEmpty
                    onChange={(value) =>
                      updateCondition({
                        ...condition,
                        rangeTo: value,
                      })
                    }
                    placeholder="Maximum value"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {fieldType === 'dropdown' &&
          renderSelectionEditor(
            'Input dropdown options',
            condition,
            selectableSourceOptions,
            (nextSelection) =>
              updateCondition(nextSelection as DropdownCalculationCondition),
            {
              autoSelectRemaining: true,
              helperText:
                reservedSourceValues.size > 0
                  ? 'Options already used in other conditions inside this same rule are hidden here to avoid conflicts.'
                  : undefined,
              showDefaultOption: false,
            },
          )}

        {fieldType !== 'number' &&
          fieldType !== 'dropdown' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Value
              </Label>
              {fieldType === 'date' ? (
                <DatePicker
                  value={typeof condition.value === 'string' ? condition.value : ''}
                  className="max-w-[15rem]"
                  onChange={(value) =>
                    updateCondition({
                      ...condition,
                      value: value || '',
                    })
                  }
                  placeholder="Select date"
                />
              ) : (
                <Input
                  value={condition.value ?? ''}
                  className="max-w-[15rem]"
                  onChange={(event) =>
                    updateCondition({
                      ...condition,
                      value: event.target.value,
                    })
                  }
                  placeholder="Enter value"
                />
              )}
            </div>
          )}
      </div>
    );
  };

  const closeDialog = () => {
    setIsCalculationDialogOpen(false);
    setTempCalculationConfig(DEFAULT_ARITHMETIC_CALCULATION);
    setSelectedCalculationType('');
    setCurrentCalculationSubFieldIndex(null);
    setCurrentCalculationFieldId(null);
    setCurrentCalculationSectionId(null);
    setCurrentCalculationPageId(null);
  };

  return (
    <Dialog
      open={isCalculationDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeDialog();
        }
      }}
    >
      <DialogContent
        className="sm:max-w-[980px]"
      >
        <DialogHeader>
          <DialogTitle>Configure Calculation</DialogTitle>
          <DialogDescription>
            {targetFieldType === 'dropdown'
              ? 'Create ordered if / else if rules to filter the dropdown options.'
              : 'Choose a calculation type, then configure the relevant fields.'}
          </DialogDescription>
        </DialogHeader>

        <div ref={scrollContainerRef} className="grid max-h-[70vh] gap-4 overflow-y-auto py-4">
          <div className="space-y-4">
            {targetFieldType !== 'dropdown' && (
              <div className="rounded-xl border bg-muted/20 p-4">
                <Label className="mb-2 block text-sm font-semibold">Calculation</Label>
                <Select
                  value={calculationType}
                  onValueChange={(value: SupportedCalculationType) => {
                    setSelectedCalculationType(value);

                    if (value === 'date') {
                      setTempCalculationConfig({
                        type: 'date',
                        initialField: '',
                        comparisonMode: 'currentDate',
                        comparisonField: '',
                        customDate: '',
                        unit: 'days',
                      });
                      return;
                    }

                    if (value === 'dropdownConditional') {
                      setTempCalculationConfig({
                        ...DEFAULT_DROPDOWN_CALCULATION,
                        rules: [
                          {
                            id: crypto.randomUUID(),
                            conditionMode: 'and',
                            conditions: [DEFAULT_DROPDOWN_CONDITION()],
                            result: { ...DEFAULT_DROPDOWN_RESULT },
                          },
                        ],
                      });
                      return;
                    }

                    setTempCalculationConfig(DEFAULT_ARITHMETIC_CALCULATION);
                  }}
                >
                  <SelectTrigger className="h-11 bg-background">
                    <SelectValue placeholder="Select calculation type" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedCalculationTypes.includes('arithmetic') && (
                      <SelectItem value="arithmetic">Arithmetic Calculation</SelectItem>
                    )}
                    {supportedCalculationTypes.includes('date') && (
                      <SelectItem value="date">Date Calculation</SelectItem>
                    )}
                    {supportedCalculationTypes.includes('dropdownConditional') && (
                      <SelectItem value="dropdownConditional">Conditional Dropdown</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {calculationType === 'dropdownConditional' && dropdownCalculation && (
              <div className="space-y-5 rounded-2xl border border-primary/10 bg-gradient-to-b from-primary/[0.03] via-background to-background p-5 shadow-sm">
                <div className="space-y-4">
                  {dropdownCalculation.rules.map((rule, ruleIndex) => (
                    <div
                      key={rule.id}
                      data-dropdown-rule-id={rule.id}
                      tabIndex={-1}
                      className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
                    >
                      <div className="border-b border-primary/10 bg-gradient-to-r from-primary/[0.08] via-primary/[0.04] to-transparent px-5 py-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground shadow-sm">
                                {ruleIndex === 0 ? 'IF' : `ELSE IF ${ruleIndex}`}
                              </span>
                              <span className="text-sm font-medium text-muted-foreground">
                                Rule {ruleIndex + 1}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Configure the matching conditions, then choose the dropdown options to
                              show when this rule matches.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0 text-destructive"
                            onClick={() =>
                              updateDropdownCalculation((current) => ({
                                ...current,
                                rules:
                                  current.rules.length > 1
                                    ? current.rules.filter((_, idx) => idx !== ruleIndex)
                                    : [
                                        {
                                          id: crypto.randomUUID(),
                                          conditionMode: 'and',
                                          conditions: [DEFAULT_DROPDOWN_CONDITION()],
                                          result: { ...DEFAULT_DROPDOWN_RESULT },
                                        },
                                      ],
                              }))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-5 p-5">
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
                          <div className="space-y-4">
                            <div className="rounded-xl border border-primary/10 bg-background p-4 shadow-sm">
                              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-semibold">Conditions</h4>
                                  <p className="text-xs text-muted-foreground">
                                    Choose whether all conditions must match or any single one can
                                    match.
                                  </p>
                                </div>
                                <div className="w-full md:max-w-[220px] space-y-2">
                                  <Select
                                    value={rule.conditionMode || 'and'}
                                    onValueChange={(value: 'and' | 'or') =>
                                      updateDropdownCalculation((current) => ({
                                        ...current,
                                        rules: current.rules.map((candidateRule, idx) =>
                                          idx === ruleIndex
                                            ? { ...candidateRule, conditionMode: value }
                                            : candidateRule,
                                        ),
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="h-10 bg-muted/30">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="and">AND</SelectItem>
                                      <SelectItem value="or">OR</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {rule.conditions.map((condition, conditionIndex) =>
                                renderConditionEditor(condition, ruleIndex, conditionIndex),
                              )}
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const nextCondition = DEFAULT_DROPDOWN_CONDITION();
                                pendingDropdownFocus.current = {
                                  type: 'condition',
                                  ruleId: rule.id,
                                  conditionId: nextCondition.id,
                                };
                                updateDropdownCalculation((current) => ({
                                  ...current,
                                  rules: current.rules.map((candidateRule, idx) =>
                                    idx === ruleIndex
                                      ? {
                                          ...candidateRule,
                                          conditions: [...candidateRule.conditions, nextCondition],
                                        }
                                      : candidateRule,
                                  ),
                                }));
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Condition
                            </Button>
                          </div>

                          <div className="space-y-3 rounded-xl border border-primary/10 bg-gradient-to-b from-primary/[0.04] to-background p-4">
                            <div className="space-y-1">
                              <h4 className="text-sm font-semibold">Then Show</h4>
                              <p className="text-xs text-muted-foreground">
                                Pick the dropdown options that should remain available when this
                                rule matches.
                              </p>
                            </div>

                            {renderSelectionEditor(
                              'Result dropdown options',
                              rule.result,
                              targetDropdownOptions,
                              (nextResult) =>
                                updateDropdownCalculation((current) => ({
                                  ...current,
                                  rules: current.rules.map((candidateRule, idx) =>
                                    idx === ruleIndex
                                      ? {
                                          ...candidateRule,
                                          result: nextResult as DropdownCalculationResult,
                                        }
                                      : candidateRule,
                                  ),
                                })),
                              {
                                autoSelectRemaining: true,
                              },
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const nextRule = {
                        id: crypto.randomUUID(),
                        conditionMode: 'and' as const,
                        conditions: [DEFAULT_DROPDOWN_CONDITION()],
                        result: { ...DEFAULT_DROPDOWN_RESULT },
                      };
                      pendingDropdownFocus.current = {
                        type: 'rule',
                        ruleId: nextRule.id,
                      };
                      updateDropdownCalculation((current) => ({
                        ...current,
                        rules: [...current.rules, nextRule],
                      }));
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Else If Rule
                  </Button>
                </div>

                <div className="rounded-2xl border border-dashed border-primary/20 bg-gradient-to-r from-muted/40 via-background to-background p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-primary/20 bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                          ELSE
                        </span>
                        <h4 className="text-sm font-semibold">Fallback Result</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Used when no earlier rule matches.
                      </p>
                    </div>
                    {dropdownCalculation.fallbackResult ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() =>
                          updateDropdownCalculation((current) => ({
                            ...current,
                            fallbackResult: undefined,
                          }))
                        }
                      >
                        Remove Else
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateDropdownCalculation((current) => ({
                            ...current,
                            fallbackResult: { ...DEFAULT_DROPDOWN_RESULT },
                          }))
                        }
                      >
                        Add Else
                      </Button>
                    )}
                  </div>

                  {dropdownCalculation.fallbackResult && (
                    <div className="mt-4">
                      {renderSelectionEditor(
                        'Fallback dropdown options',
                        dropdownCalculation.fallbackResult,
                        targetDropdownOptions,
                        (nextResult) =>
                          updateDropdownCalculation((current) => ({
                            ...current,
                            fallbackResult: nextResult as DropdownCalculationResult,
                          })),
                        {
                          allowSelectAll: true,
                        },
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {calculationType && calculationType !== 'dropdownConditional' && (
              <div className="rounded-xl border bg-background p-4 shadow-sm">
                <div className="mb-4 grid gap-2">
                  <Label className="text-sm font-semibold">Initial Field</Label>
                  <Select
                    value={selectedInitialFieldValue}
                    onValueChange={(value) => {
                      if (isDropdownCalculation) return;
                      setTempCalculationConfig({ ...tempCalculationConfig, initialField: value });
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue
                        placeholder={
                          calculationType === 'date'
                            ? 'Select the first date field'
                            : 'Select the starting field'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(arithmeticCalculation ? arithmeticInitialFieldOptions : initialFieldOptions).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isDateCalculation ? (
                  <>
                    <div className="grid gap-4 rounded-lg border bg-muted/10 p-4">
                      <Label className="text-sm font-semibold">Date Comparison</Label>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                          {tempCalculationConfig.initialField
                            ? initialFieldOptions.find((option) =>
                                matchesRef(option.aliases, tempCalculationConfig.initialField),
                              )?.label || 'Selected date field'
                            : 'Select initial field'}
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">vs</span>
                        <Select
                          value={tempCalculationConfig.comparisonMode}
                          onValueChange={(value: 'currentDate' | 'differentDateField' | 'customDate') =>
                            setTempCalculationConfig({
                              ...tempCalculationConfig,
                              comparisonMode: value,
                              comparisonField: '',
                              customDate: '',
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select comparison" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="currentDate">Current Date</SelectItem>
                            <SelectItem value="differentDateField">Different Date Field</SelectItem>
                            <SelectItem value="customDate">Custom Date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {tempCalculationConfig.comparisonMode === 'differentDateField' && (
                      <div className="grid gap-2 pt-2">
                        <Label className="text-sm font-semibold">Other Date Field</Label>
                        <Select
                          value={selectedComparisonFieldValue}
                          onValueChange={(value) =>
                            setTempCalculationConfig({
                              ...tempCalculationConfig,
                              comparisonField: value,
                            })
                          }
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select comparison date field" />
                          </SelectTrigger>
                          <SelectContent>
                            {comparisonFieldOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {tempCalculationConfig.comparisonMode === 'customDate' && (
                      <div className="grid gap-2 pt-2">
                        <Label className="text-sm font-semibold">Custom Date</Label>
                        <DatePicker
                          value={tempCalculationConfig.customDate || ''}
                          onChange={(date) =>
                            setTempCalculationConfig({
                              ...tempCalculationConfig,
                              customDate: date || '',
                            })
                          }
                          placeholder="Select custom date"
                        />
                      </div>
                    )}

                    <div className="grid gap-2 pt-2">
                      <Label className="text-sm font-semibold">Difference Unit</Label>
                      <Select
                        value={tempCalculationConfig.unit}
                        onValueChange={(value: 'days' | 'months' | 'years') =>
                          setTempCalculationConfig({
                            ...tempCalculationConfig,
                            unit: value,
                          })
                        }
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                          <SelectItem value="years">Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3 rounded-lg border bg-muted/10 p-4">
                    <Label className="text-sm font-semibold">Operations</Label>
                    {arithmeticCalculation?.operations?.length ? (
                      arithmeticCalculation.operations.map((operation, idx) => (
                        <div
                          key={idx}
                          ref={(element) => {
                            operationRefs.current[idx] = element;
                          }}
                          className="grid grid-cols-[90px_130px_1fr_auto] items-center gap-2 rounded-lg border bg-background p-3"
                        >
                          <Select
                            value={operation.operator}
                            onValueChange={(value: '+' | '-' | '*' | '/' | '%' | 'percentageOf') => {
                              updateArithmeticOperation(idx, { ...operation, operator: value });
                            }}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Op" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="+">+</SelectItem>
                              <SelectItem value="-">-</SelectItem>
                              <SelectItem value="*">×</SelectItem>
                              <SelectItem value="/">÷</SelectItem>
                              <SelectItem value="%">%</SelectItem>
                              <SelectItem value="percentageOf">% Of</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select
                            value={getArithmeticOperandType(operation)}
                            onValueChange={(value: 'field' | 'manual') =>
                              updateArithmeticOperation(idx, {
                                ...operation,
                                operandType: value,
                                field: value === 'field' ? operation.field || '' : '',
                                manualValue: value === 'manual' ? operation.manualValue ?? '' : '',
                              })
                            }
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="field">Form field</SelectItem>
                              <SelectItem value="manual">Custom Value</SelectItem>
                            </SelectContent>
                          </Select>

                          {getArithmeticOperandType(operation) === 'manual' ? (
                            <FormattedNumberInput
                              value={parseManualNumberValue(operation.manualValue)}
                              allowEmpty
                              onChange={(value) =>
                                updateArithmeticOperation(idx, {
                                  ...operation,
                                  operandType: 'manual',
                                  field: '',
                                  manualValue: value ?? '',
                                })
                              }
                              placeholder="Enter number"
                              className="h-10"
                            />
                          ) : (
                            <Select
                              value={resolveSelectValue(arithmeticFields, operation.field)}
                              onValueChange={(value) =>
                                updateArithmeticOperation(idx, {
                                  ...operation,
                                  operandType: 'field',
                                  field: value,
                                  manualValue: '',
                                })
                              }
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                {getArithmeticOperationFieldOptions(idx).map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              const nextOperations = (arithmeticCalculation?.operations || []).filter(
                                (_, operationIndex) => operationIndex !== idx,
                              );
                              setTempCalculationConfig({
                                ...(arithmeticCalculation || DEFAULT_ARITHMETIC_CALCULATION),
                                type: 'arithmetic',
                                operations: nextOperations,
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Add one or more operations. Each operation can use another field or a
                        manual numeric value.
                      </p>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 w-full"
                      onClick={addOperation}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Operation
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => {
              if (targetFieldType === 'dropdown') {
                setSelectedCalculationType('dropdownConditional');
                setTempCalculationConfig({
                  ...DEFAULT_DROPDOWN_CALCULATION,
                  rules: [DEFAULT_DROPDOWN_CONDITION()].map((condition) => ({
                    id: crypto.randomUUID(),
                    conditionMode: 'and',
                    conditions: [condition],
                    result: { ...DEFAULT_DROPDOWN_RESULT },
                  })),
                });
                return;
              }

              setSelectedCalculationType('');
              setTempCalculationConfig(DEFAULT_ARITHMETIC_CALCULATION);
            }}
          >
            Clear Calculation
          </Button>
          <Button
            disabled={!isCalculationComplete}
            onClick={() => {
              const normalizedCalculationConfig =
                normalizeCombinationSubFieldCalculationRefs(tempCalculationConfig);

              if (currentCalculationSubFieldIndex !== null) {
                const updated = [...subFieldsConfig];
                if (!hasCalculation) {
                  const currentMetadata = updated[currentCalculationSubFieldIndex].metadata || {};
                  const { calculation, ...restMetadata } = currentMetadata;
                  updated[currentCalculationSubFieldIndex] = {
                    ...updated[currentCalculationSubFieldIndex],
                    metadata: Object.keys(restMetadata).length > 0 ? restMetadata : {},
                  };
                } else {
                  updated[currentCalculationSubFieldIndex] = {
                    ...updated[currentCalculationSubFieldIndex],
                    metadata: {
                      ...updated[currentCalculationSubFieldIndex].metadata,
                      calculation: normalizedCalculationConfig,
                    },
                  };
                }
                setSubFieldsConfig(updated);
              } else if (
                currentCalculationFieldId !== null &&
                currentCalculationPageId &&
                currentCalculationSectionId
              ) {
                const updatedPages = pages.map((page) => {
                  if (page.id !== currentCalculationPageId) return page;
                  return {
                    ...page,
                    sections: page.sections?.map((section) => {
                      if (section.id !== currentCalculationSectionId) return section;
                      return {
                        ...section,
                        fields: section.fields.map((field) => {
                          const fieldRef = (field.id as string) || field.name;
                          if (
                            fieldRef !== currentCalculationFieldId &&
                            field.name !== currentCalculationFieldId
                          ) {
                            return field;
                          }

                          if (!hasCalculation) {
                            const currentMetadata = field.metadata || {};
                            const { calculation, ...restMetadata } = currentMetadata;
                            return {
                              ...field,
                              metadata: Object.keys(restMetadata).length > 0 ? restMetadata : {},
                            };
                          }

                          return {
                            ...field,
                            metadata: {
                              ...field.metadata,
                              calculation: normalizedCalculationConfig,
                            },
                          };
                        }),
                      };
                    }),
                  };
                });
                updatePages(updatedPages);
              }

              closeDialog();
            }}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
