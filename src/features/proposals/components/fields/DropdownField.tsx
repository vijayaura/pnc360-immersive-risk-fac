import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/shared/utils/lib-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BaseFieldProps } from '../../types/form';
import { FieldLabelWithNote } from './FieldLabelWithNote';
import { normalizeOptions } from '@/shared/utils/form-helpers';
import { formatIfNumber } from '@/shared/utils';
import {
  evaluateDropdownConditionalCalculation,
  isDropdownConditionalCalculationConfig,
} from '@/features/proposals/utils/calculation';
import type { Field } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import {
  resolveConditionalLogicFieldOptions,
  resolveConditionalLogicFieldValue,
} from '@/features/proposals/utils/conditionalLogic';
import { resolveMasterDependentOptions } from '@/features/proposals/utils/masterDataDependencies';

export function DropdownField({
  field,
  value,
  error,
  onChange,
  isFieldRequired,
  formData,
  disabled,
  pages,
}: BaseFieldProps) {
  const [open, setOpen] = React.useState(false);
  const otherValueCode = 'Other';
  const allowOther = String(field?.metadata?.allowOther).toLowerCase() === 'true';
  const otherInputRef = React.useRef<HTMLInputElement | null>(null);
  const allFields = React.useMemo(
    () =>
      (pages || [])
        .flatMap((page) => page.sections || [])
        .flatMap((section) => section.fields || []),
    [pages],
  );
  const masterDependentState = React.useMemo(
    () => resolveMasterDependentOptions(field, pages, formData),
    [field, pages, formData],
  );

  // Handle dependent dropdown logic
  const baseOptions = React.useMemo(() => {
    let options = normalizeOptions(field.options || []);

    if (masterDependentState.isDependent) {
      options = masterDependentState.options || [];
    }

    if (!masterDependentState.isDependent && field.dependentOn) {
      const parentValue = formData?.[field.dependentOn];

      if (!parentValue) {
        return [];
      }

      if (field.dependentOptions) {
        const parentValues =
          typeof parentValue === 'string'
            ? parentValue
                .split(',')
                .map((v) => v.trim())
                .filter((v) => v)
            : Array.isArray(parentValue)
              ? parentValue
              : [parentValue];

        const allDependentOpts = new Set<string>();
        parentValues.forEach((pv) => {
          const opts = field.dependentOptions?.[String(pv)] || [];
          opts.forEach((opt: unknown) => allDependentOpts.add(String(opt)));
        });

        options = Array.from(allDependentOpts).map((opt: string) => ({
          label: formatIfNumber(opt),
          value: opt,
        }));
      } else {
        return [];
      }
    }

    // For referenceGlobalMaster, filter options to only show the selected subset
    const selectedMasterVals = field.metadata?.selectedMasterValues;
    if (
      String(field.metadata?.optionsSourceMode) === 'referenceGlobalMaster' &&
      Array.isArray(selectedMasterVals) &&
      selectedMasterVals.length > 0
    ) {
      const allowedLabels = new Set(selectedMasterVals.map(String));
      options = options.filter(
        (opt) => allowedLabels.has(opt.label) || allowedLabels.has(opt.value),
      );

      // Preserve master sequence order using selectedMasterValues array index
      const orderMap = new Map(selectedMasterVals.map((v, i) => [String(v), i]));
      options.sort((a, b) => {
        const orderA = orderMap.get(a.label) ?? orderMap.get(a.value) ?? Infinity;
        const orderB = orderMap.get(b.label) ?? orderMap.get(b.value) ?? Infinity;
        return orderA - orderB;
      });
    }

    return options;
  }, [field, formData, masterDependentState]);

  const dropdownState = React.useMemo(() => {
    if (!isDropdownConditionalCalculationConfig(field.metadata?.calculation)) {
      return {
        options: baseOptions,
        defaultValue:
          typeof field.metadata?.defaultValue === 'string' ? field.metadata.defaultValue : undefined,
      };
    }

    return (
      evaluateDropdownConditionalCalculation(
        field.metadata.calculation,
        (ref) =>
          resolveConditionalLogicFieldValue(
            allFields,
            formData || {},
            ref.replace(/^PAGE__/, ''),
          ),
        (ref) => resolveConditionalLogicFieldOptions(allFields, ref.replace(/^PAGE__/, '')),
        baseOptions,
      ) || {
        options: baseOptions,
        defaultValue:
          typeof field.metadata?.defaultValue === 'string' ? field.metadata.defaultValue : undefined,
      }
    );
  }, [allFields, baseOptions, field.metadata?.calculation, field.metadata?.defaultValue, formData]);

  let optionsToRender = dropdownState.options;
  let isDisabled = Boolean(disabled);
  let placeholderText = field.placeholder || 'Select an option';

  // Check if this is a dependent dropdown
  if (masterDependentState.isDependent) {
    if (masterDependentState.parentValueMissing) {
      isDisabled = true;
      optionsToRender = [];
      placeholderText = `Select ${masterDependentState.parentField?.label || masterDependentState.parentField?.name || 'parent'} first`;
    }
  } else if (field.dependentOn) {
    const parentValue = formData?.[field.dependentOn];

    if (!parentValue) {
      // Parent has no value - disable this dropdown
      isDisabled = true;
      optionsToRender = [];
      placeholderText = `Select ${field.dependentOn} first`;
    }
  }

  if (allowOther && !optionsToRender.some((opt) => opt.value === otherValueCode)) {
    optionsToRender = [...optionsToRender, { label: otherValueCode, value: otherValueCode }];
  }

  // Find the label for the current selected value
  const selectedValue =
    value && typeof value === 'object'
      ? String((value as Record<string, unknown>)?.value ?? '')
      : value
        ? String(value)
        : '';

  const selectedLabel = selectedValue
    ? optionsToRender.find((opt) => opt.value === selectedValue)?.label || selectedValue
    : null;
  const hasOtherOption = allowOther || optionsToRender.some((opt) => opt.value === otherValueCode);
  const otherTextValue =
    value && typeof value === 'object'
      ? String((value as Record<string, unknown>)?.otherText ?? '')
      : '';

  const buttonLabel =
    selectedValue === otherValueCode
      ? otherTextValue
        ? `Other: ${otherTextValue}`
        : otherValueCode
      : selectedLabel
        ? formatIfNumber(selectedLabel)
        : placeholderText;

  React.useEffect(() => {
    if (selectedValue === otherValueCode) {
      const t = setTimeout(() => otherInputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
    return;
  }, [selectedValue, otherValueCode]);

  React.useEffect(() => {
    if (!isDropdownConditionalCalculationConfig(field.metadata?.calculation)) return;

    if (dropdownState.options.length === 0) {
      return;
    }

    const allowedValues = new Set(dropdownState.options.map((option) => option.value));
    const nextValue =
      selectedValue && allowedValues.has(selectedValue)
        ? selectedValue
        : dropdownState.defaultValue && allowedValues.has(dropdownState.defaultValue)
          ? dropdownState.defaultValue
          : selectedValue && !allowedValues.has(selectedValue)
            ? ''
            : selectedValue;

    if (selectedValue !== nextValue) {
      onChange(field.name, nextValue);
    }
  }, [
    dropdownState.defaultValue,
    dropdownState.options,
    field.metadata?.calculation,
    field.name,
    onChange,
    selectedValue,
  ]);

  React.useEffect(() => {
    if (!masterDependentState.isDependent || !selectedValue) {
      return;
    }

    if (masterDependentState.parentValueMissing) {
      onChange(field.name, '');
      return;
    }

    const allowedValues = new Set(optionsToRender.map((option) => option.value));
    if (!allowedValues.has(selectedValue)) {
      onChange(field.name, '');
    }
  }, [
    field.name,
    masterDependentState.isDependent,
    masterDependentState.parentValueMissing,
    onChange,
    optionsToRender,
    selectedValue,
  ]);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-2"><FieldLabelWithNote
          label={field.label}
          required={isFieldRequired(field)}
          note={field.metadata?.note}
        />
      </div>

      <div className="space-y-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={isDisabled}
              className={cn(
                'w-full justify-between font-normal px-3',
                !value && 'text-muted-foreground',
                error && 'border-destructive',
              )}
            >
              <span className="truncate text-left">{buttonLabel}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder={`Search ${field.label.toLowerCase()}...`} />
              <CommandList>
                <CommandEmpty>No option found.</CommandEmpty>
                <CommandGroup>
                  {optionsToRender.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        if (option.value === otherValueCode) {
                          onChange(field.name, {
                            value: otherValueCode,
                            otherText: otherTextValue,
                          });
                          setOpen(true);
                        } else {
                          onChange(field.name, option.value);
                          setOpen(false);
                        }
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedValue === option.value ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {formatIfNumber(option.label)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>

            {hasOtherOption && selectedValue === otherValueCode && !isDisabled && (
              <div className="p-2 border-t">
                <Input
                  ref={otherInputRef}
                  value={otherTextValue}
                  onChange={(e) =>
                    onChange(field.name, { value: otherValueCode, otherText: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setOpen(false);
                  }}
                  placeholder="Please specify"
                />
              </div>
            )}
          </PopoverContent>
        </Popover>

        {error && <p className="text-xs text-destructive">{error}</p>}
        {!error && <p className="text-xs text-transparent">&nbsp;</p>}
      </div>
    </div>
  );
}
