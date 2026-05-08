import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { forwardRef, useCallback, useEffect, useState, useRef, useLayoutEffect } from 'react';
import { Input } from './input';
import { cn } from '@/shared/utils/lib-utils';

/* ================== utils ================== */

const DEFAULT_MAX_DECIMALS = 20;
const SAFE_DECIMALS_FOR_ROUNDING = 15;

const countDecimals = (value: number) => {
  if (!isFinite(value)) return 0;
  const str = String(value);
  if (str.includes('e') || str.includes('E')) {
    const [coefficient, exponentRaw] = str.split(/e/i);
    const exponent = Number(exponentRaw);
    const coefficientDecimals = (coefficient.split('.')[1] ?? '').length;
    return Math.max(0, coefficientDecimals - exponent);
  }
  const decimals = str.split('.')[1];
  return decimals ? decimals.length : 0;
};

const roundToDecimals = (value: number, decimals: number) => {
  if (!isFinite(value)) return value;
  if (decimals <= 0) return Math.round(value);
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const safeDecimalsForMagnitude = (value: number) => {
  const magnitude = Math.abs(value) + 1e-15;
  const integerDigits = magnitude >= 1 ? Math.floor(Math.log10(magnitude)) + 1 : 0;
  return Math.max(0, 14 - integerDigits);
};

/** Format a number for display — no forced trailing zeros */
const formatNumber = (
  value?: number | null,
  allowDecimals: boolean = true,
  maxDecimals: number = allowDecimals ? DEFAULT_MAX_DECIMALS : 0,
  useGrouping: boolean = true,
) => {
  if (value === undefined || value === null || isNaN(Number(value))) return '';
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: allowDecimals ? maxDecimals : 0,
    useGrouping: useGrouping ? Math.abs(Number(value)) >= 1000 : false,
  });
};

const parseFormattedNumber = (
  raw: string,
  allowDecimals: boolean,
  maxDecimals: number = allowDecimals ? DEFAULT_MAX_DECIMALS : 0,
): number | null => {
  const regex = allowDecimals ? /^-?[\d,.]*$/ : /^-?[\d,]*$/;
  if (!regex.test(raw)) return null;

  const clean = raw.replace(/,/g, '');
  const sign = clean.startsWith('-') ? '-' : '';
  const unsigned = sign ? clean.slice(1) : clean;

  if (allowDecimals && (unsigned.match(/\./g) || []).length > 1) return null;
  if (!allowDecimals && unsigned.includes('.')) return null;

  let cappedClean = clean;
  if (allowDecimals && maxDecimals >= 0) {
    const [intPart, decPart] = clean.split('.');
    if (decPart && decPart.length > maxDecimals) {
      cappedClean = `${intPart}.${decPart.slice(0, maxDecimals)}`;
    }
  }

  const parsed = parseFloat(cappedClean);
  return isNaN(parsed) ? null : parsed;
};

/** Format raw input during typing — preserve decimal point and digits as typed */
const formatRawInput = (
  raw: string,
  allowDecimals: boolean,
  maxDecimals: number = DEFAULT_MAX_DECIMALS,
  useGrouping: boolean = true,
) => {
  const clean = raw.replace(/,/g, '');
  const sign = clean.startsWith('-') ? '-' : '';
  const unsigned = sign ? clean.slice(1) : clean;

  const [int, dec] = unsigned.split('.');
  const formattedInt =
    useGrouping && int.length > 3 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : int;

  if (!allowDecimals) return `${sign}${formattedInt}`;
  if (dec === undefined) return `${sign}${formattedInt}`;
  const cappedDec = maxDecimals >= 0 && dec.length > maxDecimals ? dec.slice(0, maxDecimals) : dec;
  return `${sign}${formattedInt}.${cappedDec}`;
};

/* ================== component ================== */

const toNumericBound = (bound: string | number | undefined): number | undefined => {
  if (bound === undefined || bound === '') return undefined;
  const n = typeof bound === 'number' ? bound : Number(bound);
  return Number.isFinite(n) ? n : undefined;
};

const clampToBounds = (n: number, minB?: number, maxB?: number) => {
  let x = n;
  if (minB !== undefined) x = Math.max(minB, x);
  if (maxB !== undefined) x = Math.min(maxB, x);
  return x;
};

export const FormattedNumberInput = forwardRef<
  HTMLInputElement,
  {
    value?: number;
    onChange: (value: number | undefined) => void;
    allowDecimals?: boolean;
    allowEmpty?: boolean;
    maxDecimals?: number;
    minFractionDigits?: number;
    useGrouping?: boolean;
    suffix?: string;
    className?: string;
  } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>
>(
  (
    {
      value,
      onChange,
      allowDecimals = true,
      allowEmpty = false,
      maxDecimals: maxDecimalsProp,
      minFractionDigits: minFractionDigitsProp,
      useGrouping = true,
      onBlur,
      onFocus,
      className,
      step,
      suffix,
      min,
      max,
      ...props
    },
    ref,
  ) => {
    const stepperWidth = props.disabled ? 0 : 32;
    const suffixWidth = suffix ? Math.min(Math.max(suffix.length * 7, 90), 170) : 0;
    const inputPaddingRight = suffix ? stepperWidth + suffixWidth + 14 : stepperWidth + 8;

    const minBound = toNumericBound(min);
    const maxBound = toNumericBound(max);

    const effectiveMaxDecimals = allowDecimals ? (maxDecimalsProp ?? DEFAULT_MAX_DECIMALS) : 0;

    const valueForDisplay =
      typeof value === 'number' && allowDecimals
        ? roundToDecimals(value, Math.min(effectiveMaxDecimals, safeDecimalsForMagnitude(value)))
        : value;

    const [inputValue, setInputValue] = useState(() =>
      formatNumber(valueForDisplay ?? null, allowDecimals, effectiveMaxDecimals, useGrouping),
    );
    const [isFocused, setIsFocused] = useState(false);
    const lastSelectionRef = useRef<{ input: HTMLInputElement; pos: number } | null>(null);

    useLayoutEffect(() => {
      if (lastSelectionRef.current) {
        const { input, pos } = lastSelectionRef.current;
        input.setSelectionRange(pos, pos);
        lastSelectionRef.current = null;
      }
    });

    /* sync external value when not editing */
    useEffect(() => {
      if (!isFocused) {
        setInputValue(
          formatNumber(valueForDisplay ?? null, allowDecimals, effectiveMaxDecimals, useGrouping),
        );
      }
    }, [valueForDisplay, isFocused, allowDecimals, effectiveMaxDecimals, useGrouping]);

    /* ---------------- handlers ---------------- */

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        let raw = e.target.value;
        const selectionStart = e.target.selectionStart;

        // Strip leading zeros unless followed by a decimal point
        if (!raw.includes('.')) {
          if (/^0\d/.test(raw)) raw = raw.replace(/^0+/, '');
          else if (/^-0\d/.test(raw)) raw = raw.replace(/^-0+/, '-');
        }

        if (raw === '') {
          setInputValue('');
          onChange(allowEmpty ? undefined : 0);
          return;
        }

        if (raw === '-') {
          setInputValue(raw);
          return;
        }

        const parsed = parseFormattedNumber(raw, allowDecimals, DEFAULT_MAX_DECIMALS);
        if (parsed === null) return;

        const nextValue = allowDecimals ? parsed : Math.trunc(parsed);
        const clamped = clampToBounds(nextValue, minBound, maxBound);
        const wasClamped = clamped !== nextValue;

        // When clamped, show the clamped value cleanly (no trailing zeros)
        // When not clamped, preserve what the user typed (allows "5.", "5.0" mid-typing)
        const newFormatted = wasClamped
          ? formatNumber(clamped, allowDecimals, effectiveMaxDecimals, useGrouping)
          : formatRawInput(raw, allowDecimals, effectiveMaxDecimals, useGrouping);

        if (selectionStart !== null) {
          if (wasClamped) {
            lastSelectionRef.current = { input: e.target, pos: newFormatted.length };
          } else {
            const significantCharsBeforeCursor = raw
              .slice(0, selectionStart)
              .replace(/,/g, '').length;
            let newCursorPos = newFormatted.length;
            let charsCount = 0;

            if (significantCharsBeforeCursor > 0) {
              for (let i = 0; i < newFormatted.length; i++) {
                if (newFormatted.charAt(i) !== ',') charsCount++;
                if (charsCount === significantCharsBeforeCursor) {
                  newCursorPos = i + 1;
                  break;
                }
              }
            } else {
              newCursorPos = 0;
            }
            lastSelectionRef.current = { input: e.target, pos: newCursorPos };
          }
        }

        setInputValue(newFormatted);
        onChange(clamped);
      },
      [onChange, allowDecimals, effectiveMaxDecimals, useGrouping, minBound, maxBound, allowEmpty],
    );

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        if (value === 0) e.target.select();
        onFocus?.(e);
      },
      [onFocus, value],
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        const raw = e.target.value;

        const parsed =
          raw === '' || raw === '-'
            ? null
            : parseFormattedNumber(raw, allowDecimals, DEFAULT_MAX_DECIMALS);

        if (parsed === null) {
          if (raw === '-') onChange(allowEmpty ? undefined : 0);
          setInputValue(
            raw === ''
              ? ''
              : formatNumber(
                  raw === '-' ? 0 : (value ?? null),
                  allowDecimals,
                  effectiveMaxDecimals,
                  useGrouping,
                ),
          );
          onBlur?.(e);
          return;
        }

        const nextValueUnclamped = allowDecimals ? parsed : Math.trunc(parsed);
        const rounded = allowDecimals
          ? roundToDecimals(
              nextValueUnclamped,
              Math.min(effectiveMaxDecimals, safeDecimalsForMagnitude(nextValueUnclamped)),
            )
          : Math.trunc(nextValueUnclamped);
        const nextValue = clampToBounds(rounded, minBound, maxBound);

        if (!Object.is(nextValue, value)) onChange(nextValue);

        // Always normalize on blur — strip trailing zeros, clean up "5." etc.
        setInputValue(formatNumber(nextValue, allowDecimals, effectiveMaxDecimals, useGrouping));
        onBlur?.(e);
      },
      [
        allowEmpty,
        onBlur,
        onChange,
        value,
        allowDecimals,
        effectiveMaxDecimals,
        useGrouping,
        minBound,
        maxBound,
      ],
    );

    const applyStep = useCallback(
      (direction: 1 | -1) => {
        const stepValue = 1;
        const next = (value || 0) + stepValue * direction;

        const stepDecimals = countDecimals(stepValue);
        const maxSafeDecimals = safeDecimalsForMagnitude(next);
        const decimalsForRound = Math.min(
          effectiveMaxDecimals,
          stepDecimals > 0 ? stepDecimals : SAFE_DECIMALS_FOR_ROUNDING,
          maxSafeDecimals,
        );
        const stepped = allowDecimals ? roundToDecimals(next, decimalsForRound) : Math.trunc(next);
        const finalValue = clampToBounds(stepped, minBound, maxBound);

        onChange(finalValue);
        setInputValue(formatNumber(finalValue, allowDecimals, effectiveMaxDecimals, useGrouping));
      },
      [value, onChange, allowDecimals, effectiveMaxDecimals, useGrouping, minBound, maxBound],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          applyStep(1);
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          applyStep(-1);
        }
        props.onKeyDown?.(e);
      },
      [applyStep, props],
    );

    /* ---------------- render ---------------- */

    return (
      <div className={`relative ${className ?? ''}`}>
        <Input
          {...props}
          ref={ref}
          min={min}
          max={max}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{ paddingRight: `${inputPaddingRight}px` }}
          className={cn('w-full', suffix ? 'pr-[75px]' : 'pr-10', className)}
          inputMode={allowDecimals ? 'decimal' : 'numeric'}
        />

        {suffix && (
          <div
            className="absolute top-0 bottom-0 flex items-center justify-end pr-1 pointer-events-none"
            style={{ right: `${stepperWidth}px`, width: `${suffixWidth}px` }}
          >
            <span className="truncate whitespace-nowrap text-xs font-medium text-muted-foreground uppercase text-right">
              {suffix}
            </span>
          </div>
        )}

        {!props.disabled && (
          <div className="absolute right-0 top-0 bottom-0 flex flex-col border-l">
            <button
              type="button"
              tabIndex={-1}
              className="flex-1 px-2 hover:bg-accent hover:text-accent-foreground flex items-center justify-center rounded-tr-md"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyStep(1)}
            >
              <ChevronUp className="h-3 w-3" />
            </button>

            <button
              type="button"
              tabIndex={-1}
              className="flex-1 px-2 hover:bg-accent hover:text-accent-foreground flex items-center justify-center border-t rounded-br-md"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyStep(-1)}
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    );
  },
);

FormattedNumberInput.displayName = 'FormattedNumberInput';
