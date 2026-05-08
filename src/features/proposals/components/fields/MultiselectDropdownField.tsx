import * as React from 'react';
import { ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/shared/utils/lib-utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { getMultiselectValidationConstraints } from '../../utils/multiselectValidationConstraints';
import { resolveMasterDependentOptions } from '@/features/proposals/utils/masterDataDependencies';

export function MultiselectDropdownField({
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

  const masterDependentState = React.useMemo(
    () => resolveMasterDependentOptions(field, pages, formData),
    [field, pages, formData],
  );

  let optionsToRender = normalizeOptions(field.options || []);
  let isDisabled = Boolean(disabled);
  let placeholderText = field.placeholder || 'Select options';

  if (masterDependentState.isDependent) {
    optionsToRender = masterDependentState.options || [];

    if (masterDependentState.parentValueMissing) {
      isDisabled = true;
      optionsToRender = [];
      placeholderText = `Select ${masterDependentState.parentField?.label || masterDependentState.parentField?.name || 'parent'} first`;
    }
  } else if (field.dependentOn) {
    const parentValue = formData?.[field.dependentOn];

    if (!parentValue) {
      isDisabled = true;
      optionsToRender = [];
      placeholderText = `Select ${field.dependentOn} first`;
    } else if (field.dependentOptions) {
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
        const opts = field.dependentOptions![pv] || [];
        opts.forEach((opt: unknown) => allDependentOpts.add(String(opt)));
      });

      optionsToRender = Array.from(allDependentOpts).map((opt: string) => ({
        label: formatIfNumber(opt),
        value: opt,
      }));
    }
  }

  const selectedValues = Array.isArray(value)
    ? value.map((v) => String(v)).filter((v) => v)
    : typeof value === 'string'
      ? value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v)
      : [];

  const constraints = getMultiselectValidationConstraints(field);
  const isMaxReached =
    constraints.maxSelections !== undefined &&
    selectedValues.length >= constraints.maxSelections;

  const selectedLabelMap = new Map(
    optionsToRender.map((opt) => [opt.value, formatIfNumber(opt.label)]),
  );

  React.useEffect(() => {
    if (!masterDependentState.isDependent || selectedValues.length === 0) {
      return;
    }

    if (masterDependentState.parentValueMissing) {
      onChange(field.name, []);
      return;
    }

    const allowedValues = new Set(optionsToRender.map((option) => option.value));
    const nextSelectedValues = selectedValues.filter((selected) => allowedValues.has(selected));

    if (nextSelectedValues.length !== selectedValues.length) {
      onChange(field.name, nextSelectedValues);
    }
  }, [
    field.name,
    masterDependentState.isDependent,
    masterDependentState.parentValueMissing,
    onChange,
    optionsToRender,
    selectedValues,
  ]);

  const toggleOption = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(
        field.name,
        selectedValues.filter((v) => v !== optionValue),
      );
      return;
    }

    if (isMaxReached) return;
    onChange(field.name, [...selectedValues, optionValue]);
  };

  const removeSelection = (optionValue: string) => {
    onChange(
      field.name,
      selectedValues.filter((v) => v !== optionValue),
    );
  };

  const buttonLabel =
    selectedValues.length === 0
      ? placeholderText
      : `${selectedValues.length} item${selectedValues.length > 1 ? 's' : ''} selected`;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-2">
        <FieldLabelWithNote
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
                'w-full min-h-10 h-auto justify-between font-normal px-3 py-1.5 transition-all text-left bg-background border-input hover:bg-background hover:text-foreground ring-offset-background',
                selectedValues.length === 0 && 'text-muted-foreground',
                error && 'border-destructive',
              )}
            >
              <div className="flex flex-wrap gap-1 items-center flex-1 pr-2">
                {selectedValues.length === 0 ? (
                  <span className="truncate">{placeholderText}</span>
                ) : (
                  selectedValues.map((selected) => (
                    <Badge
                      key={selected}
                      variant="secondary"
                      className={cn(
                        'max-w-[200px] gap-1 px-2 py-0.5 text-[11px] font-medium transition-colors bg-primary/5 text-primary border-primary/20 hover:bg-primary/10',
                        isDisabled && 'opacity-70'
                      )}
                    >
                      <span className="truncate">
                        {selectedLabelMap.get(selected) ?? selected}
                      </span>
                      {!isDisabled && (
                        <button
                          type="button"
                          className="rounded-full hover:bg-primary/20 p-0.5 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelection(selected);
                          }}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </Badge>
                  ))
                )}
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-lg border-gray-200" align="start">
            <Command className="border-0">
              <CommandInput placeholder={`Search ${field.label.toLowerCase()}...`} className="h-9" />
              <CommandList className="max-h-[300px]">
                <CommandEmpty>No option found.</CommandEmpty>
                <CommandGroup>
                  {optionsToRender.map((option) => {
                    const isSelected = selectedValues.includes(option.value);
                    const shouldDisable = !isSelected && isMaxReached;

                    return (
                      <CommandItem
                        key={option.value}
                        value={`${option.label} ${option.value}`}
                        disabled={shouldDisable}
                        onSelect={() => toggleOption(option.value)}
                        className="gap-2 py-2 px-3"
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={shouldDisable}
                          className="h-4 w-4 border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <span className="text-sm font-normal">
                          {formatIfNumber(option.label)}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        {!error && <p className="text-xs text-transparent">&nbsp;</p>}
      </div>
    </div>
  );
}
