// Pure utility functions for Risk Categorisation — no side effects, no React, no API calls

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MasterValue {
  id: string;
  label: string;
  parentId?: string;
}

export interface RiskLevel {
  id: string;
  label: string;
  order: number;
}

export interface RiskCategory {
  id: string;
  name: string;
  riskLevels: RiskLevel[];
  assignments: Record<string, string>; // combinationKey → riskLevelId
  createdAt?: string;
}

export interface RiskCategorisation {
  id: string;
  name: string;
  updatedAt?: string;
  levelGlobalMasterKeys?: string[];
  titleLabelNames: string[]; // e.g. ["Project Type", "Sub Type"]
  levelValues: MasterValue[][]; // levelValues[i] = values for level i
  riskCategories: RiskCategory[];
}

export type SpreadsheetRow = string[];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function generateId(): string {
  return `rc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyRiskCategorisation(): Omit<RiskCategorisation, 'id'> {
  return {
    name: '',
    titleLabelNames: ['Level 1'],
    levelValues: [[]],
    riskCategories: [],
  };
}

// ─── Combination traversal ───────────────────────────────────────────────────

interface Combination {
  key: string; // pipe-delimited IDs: "id0|id1|...|leafId"
  path: string[]; // human-readable labels at each depth
}

/**
 * Depth-first traversal returning all leaf paths as { key, path }.
 * Results are sorted by the leaf node's array index in levelValues,
 * so later-added rows (appended via push) appear at the bottom.
 */
export function getCombinations(rc: RiskCategorisation): Combination[] {
  const { levelValues } = rc;
  if (!levelValues || levelValues.length === 0) return [];

  // Build a map of value id → array index for each depth level
  const indexById = new Map<string, number>();
  for (let d = 0; d < levelValues.length; d++) {
    (levelValues[d] ?? []).forEach((v, idx) => {
      indexById.set(v.id, idx);
    });
  }

  const results: Array<Combination & { leafIndex: number }> = [];

  function traverse(depth: number, keyParts: string[], labelParts: string[]): void {
    if (depth >= levelValues.length) {
      const leafId = keyParts[keyParts.length - 1] ?? '';
      results.push({
        key: keyParts.join('|'),
        path: [...labelParts],
        leafIndex: indexById.get(leafId) ?? 0,
      });
      return;
    }
    const values = levelValues[depth] ?? [];
    const parentId = depth === 0 ? undefined : keyParts[depth - 1];
    const filtered = depth === 0 ? values : values.filter((v) => v.parentId === parentId);

    if (filtered.length === 0) {
      // No children at this level — treat current path as a leaf
      const leafId = keyParts[keyParts.length - 1] ?? '';
      results.push({
        key: keyParts.join('|'),
        path: [...labelParts],
        leafIndex: indexById.get(leafId) ?? 0,
      });
      return;
    }

    for (const v of filtered) {
      traverse(depth + 1, [...keyParts, v.id], [...labelParts, v.label]);
    }
  }

  traverse(0, [], []);

  // Sort by leaf node's position in levelValues to respect insertion order
  results.sort((a, b) => a.leafIndex - b.leafIndex);

  return results.map(({ key, path }) => ({ key, path }));
}

// ─── Spreadsheet helpers ──────────────────────────────────────────────────────

/**
 * Immutably add a full path from a spreadsheet row to a RiskCategorisation.
 * Deduplicates by label (case-insensitive) at each depth.
 */
export function addRowFromSpreadsheet(
  rc: RiskCategorisation,
  row: SpreadsheetRow,
  generateIdFn: () => string = generateId,
): RiskCategorisation {
  const newLevelValues = rc.levelValues.map((lvl) => [...lvl]);
  // Ensure enough depth
  while (newLevelValues.length < row.length) {
    newLevelValues.push([]);
  }

  let parentId: string | undefined = undefined;

  for (let depth = 0; depth < row.length; depth++) {
    const label = row[depth]?.trim();
    if (!label) break;

    const existing = newLevelValues[depth].find(
      (v) =>
        v.label.toLowerCase() === label.toLowerCase() &&
        (depth === 0 ? !v.parentId : v.parentId === parentId),
    );

    if (existing) {
      parentId = existing.id;
    } else {
      const newVal: MasterValue = {
        id: generateIdFn(),
        label,
        ...(depth > 0 ? { parentId } : {}),
      };
      newLevelValues[depth].push(newVal);
      parentId = newVal.id;
    }
  }

  // Ensure titleLabelNames has enough entries
  const newTitles = [...rc.titleLabelNames];
  while (newTitles.length < row.length) {
    newTitles.push(`Level ${newTitles.length + 1}`);
  }

  return {
    ...rc,
    titleLabelNames: newTitles,
    levelValues: newLevelValues,
  };
}

/**
 * Remove only the leaf node identified by `key`. Parents are preserved.
 */
export function removeRowByKey(rc: RiskCategorisation, key: string): RiskCategorisation {
  const parts = key.split('|');
  const newLevelValues = rc.levelValues.map((lvl) => [...lvl]);

  for (let depth = parts.length - 1; depth >= 0; depth--) {
    const idToRemove = parts[depth];

    // Check if it has any children in the next level down
    const hasChildren = depth < newLevelValues.length - 1
      ? newLevelValues[depth + 1].some((v) => v.parentId === idToRemove)
      : false;

    if (hasChildren) {
      // Parent is shared by another path, stop deleting upwards
      break;
    }

    newLevelValues[depth] = newLevelValues[depth].filter((v) => v.id !== idToRemove);
  }

  return { ...rc, levelValues: newLevelValues };
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCSVField(field: string): string {
  if (/[",\r\n]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function exportCombinationsToCSV(
  rc: RiskCategorisation,
  combinations: Combination[],
): string {
  const header = rc.titleLabelNames.map(escapeCSVField).join(',');
  const rows = combinations.map((c) => c.path.map(escapeCSVField).join(','));
  return [header, ...rows].join('\r\n');
}

export function parseCSVForImport(csv: string): SpreadsheetRow[] {
  const lines = csv.split(/\r\n|\r|\n/);
  if (lines.length === 0) return [];

  const parse = (line: string): string[] => {
    const fields: string[] = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        let val = '';
        i++; // skip opening quote
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') {
            val += '"';
            i += 2;
          } else if (line[i] === '"') {
            i++;
            break;
          } else {
            val += line[i];
            i++;
          }
        }
        fields.push(val);
        if (line[i] === ',') i++;
      } else {
        const end = line.indexOf(',', i);
        if (end === -1) {
          fields.push(line.slice(i));
          break;
        } else {
          fields.push(line.slice(i, end));
          i = end + 1;
        }
      }
    }
    return fields;
  };

  // Discard header row (index 0)
  return lines
    .slice(1)
    .filter((l) => l.trim() !== '')
    .map(parse);
}

// ─── Legacy migration ─────────────────────────────────────────────────────────

/**
 * Converts any legacy flat-field format to the canonical titleLabelNames / levelValues shape.
 */
export function migrateRiskCategorisation(rc: any): RiskCategorisation {
  if (rc.titleLabelNames && rc.levelValues) return rc as RiskCategorisation;

  // Attempt to infer from a flat "levels" array (legacy shape)
  const levels: Array<{ name: string; values: string[] }> = rc.levels ?? [];
  const titleLabelNames = levels.map((l: any) => l.name ?? 'Level');
  const levelValues: MasterValue[][] = levels.map((l: any, depth: number) =>
    (l.values ?? []).map((label: string, idx: number) => ({
      id: generateId(),
      label,
      ...(depth > 0 ? { parentId: undefined } : {}),
    })),
  );

  return {
    id: rc.id ?? generateId(),
    name: rc.name ?? '',
    titleLabelNames,
    levelValues,
    riskCategories: rc.riskCategories ?? [],
  };
}

// ─── Risk level colors ───────────────────────────────────────────────────────

/**
 * Maps a risk level's position (0-indexed) to a Tailwind color class.
 * 12-stop gradient from green (safe) → red (critical).
 */
const RISK_COLOR_STOPS = [
  'bg-emerald-100 text-emerald-900',
  'bg-emerald-300 text-emerald-900',
  'bg-emerald-500 text-white',
  'bg-lime-400 text-lime-950',
  'bg-yellow-300 text-yellow-950',
  'bg-yellow-400 text-yellow-950',
  'bg-amber-400 text-amber-950',
  'bg-orange-400 text-orange-950',
  'bg-orange-500 text-white',
  'bg-red-500 text-white',
  'bg-red-600 text-white',
  'bg-red-700 text-white',
];

export function getRiskLevelShade(index: number, total: number): string {
    const idx = Math.min(
      Math.floor((index / Math.max(total - 1, 1)) * (RISK_COLOR_STOPS.length - 1)),
      RISK_COLOR_STOPS.length - 1,
    );
  return RISK_COLOR_STOPS[idx];
}

// ─── Assignment Import/Export ─────────────────────────────────────────────────

export const RISK_LEVEL_COLUMN_HEADER = 'Risk Level';

interface Combination {
  key: string;
  path: string[];
}

/**
 * Builds rows for Excel export of risk level assignments.
 * Each row = { [titleLabelName]: pathValue, ..., "Risk Level": assignedLabel || "" }
 */
export function buildAssignmentExportRows(
  rc: RiskCategorisation,
  category: RiskCategory,
  combinations: Combination[],
): Record<string, string>[] {
  const assignments = category.assignments ?? {};
  const levelMap = new Map(category.riskLevels.map((l) => [l.id, l.label]));

  return combinations.map((combo) => {
    const row: Record<string, string> = {};
    rc.titleLabelNames.forEach((name, i) => {
      row[name] = combo.path[i] ?? '';
    });
    const assignedLevelId = assignments[combo.key];
    row[RISK_LEVEL_COLUMN_HEADER] = assignedLevelId ? (levelMap.get(assignedLevelId) ?? '') : '';
    return row;
  });
}

interface AssignmentImportResult {
  assignments: Record<string, string>;
  errors: string[];
  skippedCount: number;
  assignedCount: number;
}

/**
 * Parses Excel rows and validates them against the risk categorisation structure.
 * Returns validated assignments + any errors found.
 */
export function parseAssignmentImportRows(
  rows: Record<string, string>[],
  rc: RiskCategorisation,
  category: RiskCategory,
  combinations: Combination[],
): AssignmentImportResult {
  const errors: string[] = [];
  const assignments: Record<string, string> = {};
  let skippedCount = 0;
  let assignedCount = 0;

  if (rows.length === 0) {
    errors.push('No data rows found in the uploaded file');
    return { assignments, errors, skippedCount, assignedCount };
  }

  // Validate column headers exist
  const firstRow = rows[0];
  const headerKeys = Object.keys(firstRow);
  const missingColumns = rc.titleLabelNames.filter(
    (name) => !headerKeys.some((h) => h.toLowerCase() === name.toLowerCase()),
  );
  if (missingColumns.length > 0) {
    errors.push(`Missing columns: ${missingColumns.join(', ')}`);
    return { assignments, errors, skippedCount, assignedCount };
  }
  if (!headerKeys.some((h) => h.toLowerCase() === RISK_LEVEL_COLUMN_HEADER.toLowerCase())) {
    errors.push(`Missing "${RISK_LEVEL_COLUMN_HEADER}" column`);
    return { assignments, errors, skippedCount, assignedCount };
  }

  // Build lookup: combo path (lowercased, pipe-joined) → combo key
  const comboLookup = new Map<string, string>();
  for (const combo of combinations) {
    const normalized = combo.path.map((p) => p.toLowerCase().trim()).join('|');
    comboLookup.set(normalized, combo.key);
  }

  // Build lookup: risk level label (lowercased) → risk level id
  const levelLabelToId = new Map<string, string>();
  for (const level of category.riskLevels) {
    levelLabelToId.set(level.label.toLowerCase().trim(), level.id);
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // Excel row number (1-indexed header + 1-indexed data)

    // Find the risk level value (case-insensitive key match)
    const riskLevelKey = headerKeys.find(
      (h) => h.toLowerCase() === RISK_LEVEL_COLUMN_HEADER.toLowerCase(),
    );
    const riskLevelValue = (row[riskLevelKey!] ?? '').toString().trim();

    // Blank risk level = skip
    if (!riskLevelValue) {
      skippedCount++;
      continue;
    }

    // Build combo path from row, trimming trailing empty cells (partial-depth rows)
    const pathParts = rc.titleLabelNames.map((name) => {
      const key = headerKeys.find((h) => h.toLowerCase() === name.toLowerCase());
      return (row[key!] ?? '').toString().toLowerCase().trim();
    });
    while (pathParts.length > 0 && pathParts[pathParts.length - 1] === '') {
      pathParts.pop();
    }
    const normalizedPath = pathParts.join('|');

    const comboKey = comboLookup.get(normalizedPath);
    if (!comboKey) {
      const displayPath = pathParts.filter(Boolean).join(' > ') || '(empty)';
      errors.push(`Row ${rowNum}: combination not found — ${displayPath}`);
      continue;
    }

    const levelId = levelLabelToId.get(riskLevelValue.toLowerCase());
    if (!levelId) {
      errors.push(`Row ${rowNum}: invalid risk level "${riskLevelValue}"`);
      continue;
    }

    assignments[comboKey] = levelId;
    assignedCount++;
  }

  return { assignments, errors, skippedCount, assignedCount };
}

