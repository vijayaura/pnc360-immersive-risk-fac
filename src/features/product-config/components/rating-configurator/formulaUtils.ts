import type { FormulaStep } from './types';

export function sortByOrder(steps: FormulaStep[]): FormulaStep[] {
  return steps
    .map((s, i) => (s.order === undefined ? { ...s, order: i } : s))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function reindexFormula(steps: FormulaStep[]): FormulaStep[] {
  return steps.map((s, i) => ({ ...s, order: i }));
}

export function buildFormulaTokens(steps: FormulaStep[]) {
  const ordered = reindexFormula(sortByOrder(steps));
  return ordered.map((s) => ({
    type: s.type === 'percentage' ? ('PERCENTAGE' as const) : s.type,
    value: s.value,
    fieldId: s.fieldId || '',
    ratingParameterId: s.ratingParameterId,
    order: s.order ?? 0,
    label: s.label,
    parameterSection: s.parameterSection,
  }));
}

export function evaluateFormula(
  formula: FormulaStep[],
  testValues: Record<string, unknown>,
): number | null {
  try {
    if (formula.length === 0) return null;
    const ordered = sortByOrder(formula);

    let expression = '';
    for (let i = 0; i < ordered.length; i += 1) {
      const step = ordered[i];
      if (step.type === 'field' || step.type === 'variable') {
        const key = step.fieldId ?? step.value;
        const value = testValues[key];
        if (value === undefined || value === null || value === '') {
          return null;
        }
        const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
        expression += numValue;
      } else if (step.type === 'operator') {
        expression += ' ' + step.value + ' ';
      } else if (step.type === 'number') {
        expression += step.value;
      } else if (step.type === 'percentage') {
        const percentValue = parseFloat(step.value.replace('%', '').replace(' ', ''));
        if (Number.isNaN(percentValue)) return null;
        expression += (percentValue / 100).toString();
      } else if (step.type === 'function') {
        if (step.value === 'MIN') {
          expression += 'Math.min';
          continue;
        }
        if (step.value === 'MAX') {
          expression += 'Math.max';
          continue;
        }

        const open = ordered[i + 1];
        const arg = ordered[i + 2];
        const close = ordered[i + 3];
        if (
          !open ||
          open.type !== 'operator' ||
          open.value !== '(' ||
          !arg ||
          (arg.type !== 'field' && arg.type !== 'variable') ||
          !close ||
          close.type !== 'operator' ||
          close.value !== ')'
        ) {
          return null;
        }

        const argValue = String(arg.value);
        const matrixId = argValue.startsWith('matrix:') ? argValue.split(':')[1] : argValue;
        if (!matrixId) return null;

        let key: string | null = null;
        if (step.value === 'SUM_PRODUCT_EACH') {
          const sumProductKey = `matrix:each:${matrixId}:SUMPRODUCT`;
          if (testValues[sumProductKey] !== undefined) key = sumProductKey;
          else key = `matrix:each:${matrixId}:SUM`;
        } else if (step.value === 'PRODUCT_EACH') {
          key = `matrix:each:${matrixId}:PRODUCT`;
        }
        if (!key) return null;

        const raw = testValues[key];
        if (raw === undefined || raw === null || raw === '') return null;
        const numValue = typeof raw === 'number' ? raw : parseFloat(String(raw)) || 0;
        expression += numValue;
        i += 3;
      }
    }

    expression = expression.trim().replace(/\s+/g, ' ');

    const result = Function(`"use strict"; return (${expression})`)();
    return typeof result === 'number' && !Number.isNaN(result) ? result : null;
  } catch {
    return null;
  }
}
