import { Input } from '@/components/ui/input';
import { BaseFieldProps } from '../../types/form';
import { FieldLabelWithNote } from './FieldLabelWithNote';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Field, Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import {
  calculateConfiguredValue,
  isDateCalculationConfig,
} from '@/features/proposals/utils/calculation';

const NUMBER_UNIT_MULTIPLIER: Record<string, number> = {
  millions: 1_000_000,
  hundredThousand: 100_000,
  thousand: 1_000,
};

export function NumberField({
  field,
  value,
  error,
  onChange,
  formData,
  currency: productCurrency,
  numberUnit,
  isFieldRequired,
  pages,
  disabled,
}: BaseFieldProps) {
  const fieldCurrency =
    field.currencyField && formData[field.currencyField] ? formData[field.currencyField] : '';

  // Determine format type from metadata or heuristic
  const formatType =
    field.metadata?.numberFormat ||
    (/mobile|phone|contact/i.test(field.label || '') ||
    /mobile|phone|contact/i.test(field.name || '')
      ? 'phoneNumber'
      : 'none');

  const isPhoneField = formatType === 'phoneNumber';
  const isDistanceField = formatType === 'distance';
  const isCurrencyField = formatType === 'currency';
  const isPercentageField = formatType === 'percentage';
  const calculation = field.metadata?.calculation;
  const calculatedDateUnit = isDateCalculationConfig(calculation) ? calculation.unit : '';

  const hasIntegerRule = field.validations?.some((v) => v.type === 'integer');
  const decimalPlacesRule = field.validations?.find((v) => v.type === 'decimalPlaces');
  const maxLengthRule = field.validations?.find((v) => v.type === 'maxLength');

  const validationMax = maxLengthRule ? Number(maxLengthRule.value) : undefined;
  const effectiveMaxLength =
    isPhoneField && validationMax === undefined
      ? 10
      : Number.isFinite(validationMax)
        ? validationMax
        : undefined;

  let maxDecimals: number;
  let allowDecimals: boolean;

  if (hasIntegerRule) {
    maxDecimals = 0;
    allowDecimals = false;
  } else if (decimalPlacesRule) {
    maxDecimals = Number(decimalPlacesRule.value);
    allowDecimals = maxDecimals > 0;
  } else {
    maxDecimals = 0;
    allowDecimals = false;
  }

  const useNumberUnit = isCurrencyField && numberUnit && NUMBER_UNIT_MULTIPLIER[numberUnit];
  const multiplier = useNumberUnit ? NUMBER_UNIT_MULTIPLIER[numberUnit] : 1;

  // When number unit is active, allow decimals so e.g. 34 in millions shows as 0.000034
  const displayMaxDecimals = useNumberUnit
    ? numberUnit === 'millions'
      ? 6
      : numberUnit === 'hundredThousand'
        ? 5
        : 3
    : maxDecimals;
  const displayAllowDecimals = useNumberUnit ? true : allowDecimals;

  const format = useCallback(
    (val: number | string | null | undefined): string => {
      if (val === '' || val === null || val === undefined) return '';
      if (isPhoneField) return String(val); // No commas for phone numbers
      const n = Number(String(val).replace(/,/g, ''));
      if (isNaN(n)) return '';

      return n.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: displayMaxDecimals,
        useGrouping: isCurrencyField,
      });
    },
    [isPhoneField, displayMaxDecimals],
  );

  const parse = useCallback(
    (val: string): string | number => {
      if (isPhoneField) return val;

      const cleaned = val.replace(/,/g, '');
      if (cleaned === '' || cleaned === '-' || cleaned === '.') return cleaned;

      const n = Number(cleaned);
      return isNaN(n) ? '' : n;
    },
    [isPhoneField],
  );

  const valueForDisplay = useMemo(() => {
    if (!useNumberUnit) return value;
    const raw = Number(String(value).replace(/,/g, ''));
    if (raw === 0 || isNaN(raw)) return raw;
    return raw / multiplier;
  }, [value, useNumberUnit, multiplier]);

  const [displayValue, setDisplayValue] = useState<string>(() => format(valueForDisplay));

  useEffect(() => {
    setDisplayValue(format(valueForDisplay));
  }, [valueForDisplay, format]);

  // Calculation Logic
  useEffect(() => {
    if (calculation?.initialField) {
      const allFields: Field[] =
        pages?.flatMap((p: Page) => p.sections || []).flatMap((s) => s.fields || []) || [];
      const normalizeFieldRef = (fieldRef: string) => fieldRef.replace(/^PAGE__/, '');

      const getValue = (fieldRef: string) => {
        const resolvedFieldRef = normalizeFieldRef(fieldRef);
        if (!formData) return undefined;

        if (resolvedFieldRef.startsWith('SUM__')) {
          const parts = resolvedFieldRef.split('__');
          if (parts.length === 3) {
            const parentKey = parts[1];
            const subKey = parts[2];

            const parentField =
              allFields.find((f) => f.id === parentKey || f.name === parentKey) || null;

            const parentName = parentField?.name || parentKey;
            const parentData = formData[parentName];

            if (Array.isArray(parentData)) {
              let hasNumericValue = false;
              const sum = parentData.reduce((sum, row) => {
                let cellKey = subKey;
                if (parentField?.subFields) {
                  const sub =
                    parentField.subFields.find((sf) => sf.id === subKey || sf.name === subKey) ||
                    null;
                  if (sub) cellKey = sub.name;
                }
                const rawValue = row?.[cellKey];
                if (rawValue === undefined || rawValue === null || rawValue === '') {
                  return sum;
                }
                const val = parseFloat(String(rawValue));
                if (!isNaN(val)) {
                  hasNumericValue = true;
                }
                return sum + (isNaN(val) ? 0 : val);
              }, 0);
              return hasNumericValue ? sum : undefined;
            }
            return undefined;
          }
        }

        const byId = allFields.find((f) => f.id === resolvedFieldRef);
        if (byId) {
          return formData[byId.name];
        }

        return formData[resolvedFieldRef];
      };

      const result = calculateConfiguredValue(calculation, getValue);
      if (result === null) {
        if (value !== '' && value !== null && value !== undefined) {
          onChange(field.name, '');
        }
        return;
      }

      const currentValue =
        value === '' || value === null || value === undefined ? null : Number(value);
      const shouldUpdate =
        currentValue === null ||
        Number.isNaN(currentValue) ||
        Math.abs(currentValue - result) > 0.0001;

      // Avoid infinite loop if value matches (handling float precision loosely)
      if (shouldUpdate) {
        onChange(field.name, result);
      }
    }
  }, [calculation, formData, onChange, field.name, value, pages]);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-2"><FieldLabelWithNote
          label={field.label}
          required={isFieldRequired(field)}
          note={field.metadata?.note}
        />
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Input
            value={displayValue}
            inputMode={isPhoneField ? 'tel' : displayAllowDecimals ? 'decimal' : 'numeric'}
            maxLength={effectiveMaxLength}
            disabled={!!field.metadata?.calculation || disabled}
            onChange={(e) => {
              const raw = e.target.value;
              // For phone fields, allow only digits (exactly 10)
              if (isPhoneField) {
                if (raw === '' || /^[\d\s+\-()]+$/.test(raw)) {
                  setDisplayValue(raw);
                  onChange(field.name, raw);
                }
                return;
              }
              if (!displayAllowDecimals && raw.includes('.')) {
                return;
              }
              // Standard number behavior (detects decimals too)
              if (raw === '' || /^[\d.,-]*$/.test(raw)) {
                // Allow intermediate states like "12." by not parsing immediately
                const cleaned = raw.replace(/[^0-9.,-]/g, '');

                const decimalPart = cleaned.split('.')[1] || '';
                if (decimalPart.length > displayMaxDecimals) return;

                setDisplayValue(cleaned);

                if (cleaned === '') {
                  onChange(field.name, '');
                  return;
                }

                const parsed = parse(cleaned);
                const valueToStore = useNumberUnit
                  ? typeof parsed === 'number'
                    ? parsed * multiplier
                    : ''
                  : parsed;
                onChange(field.name, valueToStore);
              }
            }}
            onBlur={() => {
              if (isPhoneField) return;

              if (displayValue.trim() === '') {
                setDisplayValue('');
                onChange(field.name, '');
                return;
              }

              const parsed = parse(displayValue);
              let finalDisplay = typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0;

              finalDisplay = Number(finalDisplay.toFixed(displayMaxDecimals));
              const valueToStore = useNumberUnit ? finalDisplay * multiplier : finalDisplay;

              const formatted = format(finalDisplay);
              setDisplayValue(formatted);
              onChange(field.name, valueToStore);
            }}
            className={error ? 'border-destructive pr-24' : 'pr-24'}
            placeholder={field.placeholder}
          />

          {(calculatedDateUnit ||
            (isCurrencyField && (productCurrency || 'AED')) ||
            fieldCurrency ||
            isDistanceField ||
            isPercentageField) && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground bg-background pl-1">
              {calculatedDateUnit
                ? calculatedDateUnit
                : isCurrencyField
                ? `${productCurrency || 'AED'}${useNumberUnit ? ` (${numberUnit === 'hundredThousand' ? 'Hundred Thousands' : numberUnit === 'millions' ? 'Millions' : 'Thousands'})` : ''}`
                : fieldCurrency || (isDistanceField ? 'km' : '') || (isPercentageField ? '%' : '')}
            </span>
          )}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
        {!error && <p className="text-xs text-transparent">&nbsp;</p>}
      </div>
    </div>
  );
}
