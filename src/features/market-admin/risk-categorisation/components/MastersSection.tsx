import { useEffect, useMemo, useState, useRef } from 'react';
import { X, Download, Upload, Plus, Save, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getCombinations,
  addRowFromSpreadsheet,
  removeRowByKey,
  exportCombinationsToCSV,
  parseCSVForImport,
  generateId,
} from '../utils/riskCategorisation';
import type { RiskCategorisation } from '../utils/riskCategorisation';
import { useUpdateRiskCategorisation } from '../api/riskCategorisation';

interface MastersSectionProps {
  rc: RiskCategorisation;
}

export function MastersSection({ rc }: MastersSectionProps) {
  const updateMutation = useUpdateRiskCategorisation();

  // Local editable copy of the RC
  const [localRc, setLocalRc] = useState<RiskCategorisation>(rc);
  const [removeTarget, setRemoveTarget] = useState<{
    key: string;
    label: string;
  } | null>(null);
  const [removeLevelIdx, setRemoveLevelIdx] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [draftRows, setDraftRows] = useState<Array<{ id: string; cells: string[] }>>([]);
  const [bulkEditStates, setBulkEditStates] = useState<Record<string, string[]>>({});

  const [addMultipleOpen, setAddMultipleOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const rowOrderRef = useRef<string[]>([]);

  useEffect(() => {
    setLocalRc(rc);
    rowOrderRef.current = [];
    setDraftRows([]);
    setBulkEditStates({});
    setBulkText('');
    setIsDirty(false);
  }, [rc.id]);

  const combinations = useMemo(
    () => getCombinations(localRc).filter((c) => c.path.length > 0),
    [localRc],
  );

  const sortedCombinations = useMemo(() => {
    const currentKeys = new Set(combinations.map((c) => c.key));

    // Remove stale keys
    const kept = rowOrderRef.current.filter((k) => currentKeys.has(k));

    // Append any new keys at the end (preserving insertion order)
    const existing = new Set(kept);
    for (const c of combinations) {
      if (!existing.has(c.key)) kept.push(c.key);
    }
    rowOrderRef.current = kept;

    // Sort combinations by this explicit order
    const orderMap = new Map(kept.map((k, i) => [k, i]));
    return [...combinations].sort(
      (a, b) => (orderMap.get(a.key) ?? Infinity) - (orderMap.get(b.key) ?? Infinity),
    );
  }, [combinations]);

  const existingCount = combinations.length;
  const maxDepth = localRc.titleLabelNames.length;

  // ─── Title label helpers ──────────────────────────────────────────────────

  const updateTitleLabel = (idx: number, value: string) => {
    setLocalRc((prev) => {
      const newTitles = [...prev.titleLabelNames];
      newTitles[idx] = value;
      return { ...prev, titleLabelNames: newTitles };
    });
    setIsDirty(true);
  };

  const addLevel = () => {
    setLocalRc((prev) => {
      const nextRc = {
        ...prev,
        titleLabelNames: [...prev.titleLabelNames, `Level ${prev.titleLabelNames.length + 1}`],
        levelValues: [...prev.levelValues, []],
      };
      
      const combs = getCombinations(nextRc).filter(c => c.path.length > 0);
      const newMaxDepth = nextRc.titleLabelNames.length;
      
      setBulkEditStates((prevEdit) => {
        const nextEdit = { ...prevEdit };
        for (const c of combs) {
          nextEdit[c.key] = Array.from({ length: newMaxDepth }).map((_, i) => c.path[i] ?? '');
        }
        return nextEdit;
      });

      return nextRc;
    });
    setIsDirty(true);
  };

  const removeLevel = (idx: number) => {
    setLocalRc((prev) => {
      const nextLevelValues = prev.levelValues.map(lvl => [...lvl]);
      
      // Re-parent any direct children of the level being removed.
      // Children of (idx + 1) pointing to (idx) must now point to parents at (idx - 1).
      const removedLevel = nextLevelValues[idx];
      const childLevel = nextLevelValues[idx + 1];

      if (childLevel) {
        // Map: child -> deleted parent -> grandparent
        const parentToGrandParent = new Map<string, string | undefined>();
        removedLevel.forEach(v => {
          parentToGrandParent.set(v.id, v.parentId);
        });

        nextLevelValues[idx + 1] = childLevel.map(v => ({
          ...v,
          parentId: parentToGrandParent.get(v.parentId)
        }));
      }

      return {
        ...prev,
        titleLabelNames: prev.titleLabelNames.filter((_, i) => i !== idx),
        levelValues: nextLevelValues.filter((_, i) => i !== idx),
      };
    });

    setDraftRows((prev) =>
      prev.map((r) => ({
        ...r,
        cells: r.cells.filter((_, i) => i !== idx),
      })),
    );
    setIsDirty(true);
    setRemoveLevelIdx(null);
  };

  const parsedBulkRows = useMemo(() => {
    const lines = bulkText
      .split(/\r?\n/g)
      .map((l) => l.trim())
      .filter(Boolean);
    const rows: string[][] = [];
    for (const line of lines) {
      const cols = line
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      const normalized = cols.slice(0, maxDepth);
      if (normalized.length > 0) rows.push(normalized);
    }
    return rows;
  }, [bulkText, maxDepth]);

  const addMultipleRows = () => {
    if (parsedBulkRows.length === 0) return;

    // Build set of existing keys for duplicate detection
    const existingKeys = new Set(combinations.map((c) => normalizePathKey(c.path)));
    let skippedCount = 0;

    setLocalRc((prev) => {
      let updated = prev;
      for (const row of parsedBulkRows) {
        const combined = row.map((c) => String(c ?? '').trim()).filter(Boolean);
        if (combined.length === 0) continue;
        const key = combined.map((p) => p.toLowerCase()).join('|');
        if (existingKeys.has(key)) {
          skippedCount++;
          continue;
        }
        existingKeys.add(key);
        updated = addRowFromSpreadsheet(updated, combined, generateId);
      }
      return updated;
    });

    if (skippedCount > 0) {
      toast.error(`${skippedCount} duplicate row(s) skipped`);
    }

    setBulkText('');
    setIsDirty(true);
    setAddMultipleOpen(false);
  };

  const valuesByParentAndDepth = useMemo(() => {
    const byParent: Array<Map<string, Array<{ id: string; label: string }>>> = [];
    const idByLabel: Array<Map<string, Map<string, string>>> = [];

    for (let depth = 0; depth < maxDepth; depth++) {
      const map = new Map<string, Array<{ id: string; label: string }>>();
      const mapIdByLabel = new Map<string, Map<string, string>>();
      for (const v of localRc.levelValues?.[depth] ?? []) {
        const parentKey = depth === 0 ? '__root__' : String(v.parentId ?? '');
        if (!map.has(parentKey)) map.set(parentKey, []);
        map.get(parentKey)!.push({ id: v.id, label: v.label });

        if (!mapIdByLabel.has(parentKey)) mapIdByLabel.set(parentKey, new Map());
        mapIdByLabel.get(parentKey)!.set(String(v.label ?? '').toLowerCase(), v.id);
      }
      byParent.push(map);
      idByLabel.push(mapIdByLabel);
    }
    return { byParent, idByLabel };
  }, [localRc.levelValues, maxDepth]);

  const ensureDraftRow = () => {
    setDraftRows((prev) => {
      if (prev.length > 0) return prev;
      return [{ id: generateId(), cells: Array(maxDepth).fill('') }];
    });
  };

  const addDraftRow = () => {
    setDraftRows((prev) => [...prev, { id: generateId(), cells: Array(maxDepth).fill('') }]);
  };

  const updateDraftCell = (rowId: string, col: number, value: string) => {
    setDraftRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const nextCells = [...r.cells];
        nextCells[col] = value;
        for (let i = col + 1; i < nextCells.length; i++) {
          if (!String(nextCells[col] ?? '').trim()) nextCells[i] = '';
        }
        return { ...r, cells: nextCells };
      }),
    );
  };

  const buildRowParts = (cells: string[]): string[] => {
    const out: string[] = [];
    for (let i = 0; i < maxDepth; i++) {
      const v = String(cells[i] ?? '').trim();
      if (!v) break;
      out.push(v);
    }
    return out;
  };

  const commitDraftRow = (rowId: string) => {
    const row = draftRows.find((r) => r.id === rowId);
    if (!row) return;
    const parts = buildRowParts(row.cells);
    if (parts.length === 0) return;

    // Check for duplicate row against existing combinations
    const newKey = parts.map((p) => p.toLowerCase()).join('|');
    const existingKeys = combinations.map((c) => normalizePathKey(c.path));
    if (existingKeys.includes(newKey)) {
      toast.error('Duplicate row detected. Please choose a unique combination.');
      return;
    }

    setLocalRc((rcPrev) => addRowFromSpreadsheet(rcPrev, parts, generateId));
    setIsDirty(true);
    setDraftRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const startEditRow = (key: string, path: string[]) => {
    setBulkEditStates((prev) => ({
      ...prev,
      [key]: Array.from({ length: maxDepth }).map((_, i) => path[i] ?? ''),
    }));
  };

  const updateEditingCell = (key: string, col: number, value: string) => {
    setBulkEditStates((prev) => {
      const current = prev[key];
      if (!current) return prev;
      const nextCells = [...current];
      nextCells[col] = value;
      return { ...prev, [key]: nextCells };
    });
  };

  const cancelEditRow = (key: string) => {
    setBulkEditStates((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const commitEditRow = (key: string) => {
    const cells = bulkEditStates[key];
    if (!cells) return;
    
    const idParts = key.split('|').filter(Boolean);
    const originalDepth = idParts.length;
    
    // Compute effective depth
    let effectiveDepth = originalDepth;
    for (let d = originalDepth; d < maxDepth; d++) {
      if (String(cells[d] ?? '').trim()) effectiveDepth = d + 1;
      else break;
    }
    if (effectiveDepth === 0) return;

    // Validation
    for (let d = 0; d < effectiveDepth; d++) {
      const nextLabel = String(cells[d] ?? '').trim();
      if (!nextLabel) {
        toast.error('Row values cannot be empty.');
        return;
      }
      const parentId = d === 0 ? undefined : d < originalDepth ? idParts[d - 1] : undefined;
      const siblings = localRc.levelValues?.[d] ?? [];
      const currentId = d < originalDepth ? idParts[d] : undefined;
      const dup = siblings.find(
        (v) =>
          v.id !== currentId &&
          v.label.toLowerCase() === nextLabel.toLowerCase() &&
          (d === 0 ? !v.parentId : v.parentId === parentId),
      );
      if (dup) {
        toast.error('Duplicate row detected.');
        return;
      }
    }

    setLocalRc((prev) => {
      let updated = prev;
      const nextLevelValues = updated.levelValues.map((lvl) => [...lvl]);
      for (let d = 0; d < Math.min(originalDepth, maxDepth); d++) {
        const nextLabel = String(cells[d] ?? '').trim();
        const idx = nextLevelValues[d].findIndex((v) => v.id === idParts[d]);
        if (idx >= 0) {
          nextLevelValues[d][idx] = { ...nextLevelValues[d][idx], label: nextLabel };
        }
      }
      updated = { ...updated, levelValues: nextLevelValues };
      if (effectiveDepth > originalDepth) {
        updated = addRowFromSpreadsheet(updated, cells.slice(0, effectiveDepth), generateId);
      }
      return updated;
    });
    
    setIsDirty(true);
    cancelEditRow(key);
  };

  const resolveParentIdForDatalist = (path: string[], depth: number): string | null => {
    if (depth === 0) return '__root__';
    let parentId = '__root__';
    for (let d = 0; d < depth; d++) {
      const label = String(path[d] ?? '').trim();
      if (!label) return null;
      const id = valuesByParentAndDepth.idByLabel[d]?.get(parentId)?.get(label.toLowerCase());
      if (!id) return null;
      parentId = id;
    }
    return parentId;
  };

  // ─── Remove combination ───────────────────────────────────────────────────

  const confirmRemoveRow = () => {
    if (!removeTarget) return;
    const label = removeTarget.label;
    setLocalRc((prev) => removeRowByKey(prev, removeTarget.key));
    setRemoveTarget(null);
    setIsDirty(true);
    toast.success(`Row "${label}" removed`);
  };

  const normalizePathKey = (parts: string[]): string =>
    parts
      .map((p) =>
        String(p ?? '')
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean)
      .join('|');

  const hasDuplicateRows = (combos: Array<{ key: string; path: string[] }>): boolean => {
    const seen = new Map<string, number>();
    for (const c of combos) {
      const k = normalizePathKey(c.path);
      if (!k) continue;
      seen.set(k, (seen.get(k) ?? 0) + 1);
    }
    for (const [, count] of seen) {
      if (count > 1) return true;
    }
    return false;
  };

  // ─── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (hasDuplicateRows(getCombinations(localRc))) {
      toast.error('Duplicate rows detected. Please remove duplicates before saving.');
      return;
    }
    try {
      const saved = await updateMutation.mutateAsync({
        rcId: localRc.id,
        payload: {
          name: localRc.name,
          titleLabelNames: localRc.titleLabelNames,
          levelValues: localRc.levelValues,
        },
      });
      setLocalRc(saved);
      setDraftRows([]);
      setBulkEditStates({});
      setBulkText('');
      setIsDirty(false);
      toast.success('Masters saved');
    } catch {
      toast.error('Failed to save masters');
    }
  };

  // ─── CSV Export ───────────────────────────────────────────────────────────

  const handleExport = () => {
    const csv = exportCombinationsToCSV(localRc, combinations);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${localRc.name || 'masters'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── CSV Import ───────────────────────────────────────────────────────────

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const csv = ev.target?.result as string;
        const rows = parseCSVForImport(csv);

        const lines = csv.split(/\r\n|\r|\n/).filter((l) => l.trim() !== '');
        const parseLine = (line: string): string[] => {
          const fields: string[] = [];
          let i = 0;
          while (i < line.length) {
            if (line[i] === '"') {
              let val = '';
              i++;
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
          return fields.map((f) => f.trim()).filter((f) => f !== '');
        };

        const headerFields = lines.length > 0 ? parseLine(lines[0]) : [];
        const titles =
          headerFields.length > 0
            ? headerFields
            : localRc.titleLabelNames.length > 0
              ? localRc.titleLabelNames
              : ['Level 1'];

        setLocalRc((prev) => {
          const base: RiskCategorisation = {
            ...prev,
            titleLabelNames: titles,
            levelValues: Array.from({ length: titles.length }, () => []),
          };
          let updated = base;
          for (const row of rows) {
            updated = addRowFromSpreadsheet(updated, row.slice(0, titles.length), generateId);
          }
          return updated;
        });
        setDraftRows([]);
        setBulkEditStates({});
        setIsDirty(true);
        toast.success(`Imported ${rows.length} row(s)`);
      } catch {
        toast.error('Failed to parse CSV');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Title Hierarchies */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Title Hierarchies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Define the hierarchy column names for your master values.
          </p>
          <div className="flex flex-wrap gap-2 items-end">
            {localRc.titleLabelNames.map((title, i) => (
              <div key={i} className="flex items-center gap-1">
                <Input
                  value={title}
                  onChange={(e) => updateTitleLabel(i, e.target.value)}
                  className="h-8 w-36 text-sm"
                  placeholder={`Level ${i + 1}`}
                />
                {i > 0 && (
                  <button
                    onClick={() => setRemoveLevelIdx(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={addLevel}>
              <Plus className="w-3 h-3" />
              Add Level
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Master Values Spreadsheet */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Master Values</CardTitle>
              <span className="text-xs text-muted-foreground">
                {existingCount} row{existingCount === 1 ? '' : 's'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => {
                  addDraftRow();
                }}
                disabled={Object.keys(bulkEditStates).length > 0}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Row
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => {
                  setBulkText('');
                  setAddMultipleOpen(true);
                }}
                disabled={Object.keys(bulkEditStates).length > 0}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Multiple Rows
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleExport}
                disabled={combinations.length === 0}
              >
                <Upload className="w-3.5 h-3.5" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <Download className="w-3.5 h-3.5" />
                Import CSV
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImport}
              />
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={handleSave}
                disabled={!isDirty || updateMutation.isPending}
              >
                <Save className="w-3.5 h-3.5" />
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Add values left-to-right. Child columns stay disabled until the parent is filled.
            </div>

            {combinations.length === 0 && draftRows.length === 0 ? (
              <div className="text-center py-10 border rounded-md bg-muted/10">
                <div className="text-sm font-medium">No rows yet</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Add a row manually or paste multiple rows.
                </div>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={ensureDraftRow}>
                    <Plus className="w-4 h-4" />
                    Add Row
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBulkText('');
                      setAddMultipleOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Multiple Rows
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-auto rounded-md border bg-background">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 sticky top-0 z-10">
                    <tr>
                      {localRc.titleLabelNames.map((name, i) => (
                        <th
                          key={i}
                          className="px-3 py-2 text-left font-medium text-xs whitespace-nowrap"
                        >
                          {name}
                        </th>
                      ))}
                      <th className="px-3 py-2 w-36 text-center font-medium text-xs whitespace-nowrap sticky right-0 bg-muted/95 z-20 shadow-[-1px_0_0_0_rgba(0,0,0,0.1)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCombinations.map((c) => {
                      const editCells = bulkEditStates[c.key];
                      const isEditing = !!editCells;
                      
                      if (isEditing) {
                        const originalDepth = c.key.split('|').filter(Boolean).length;
                        return (
                          <tr key={c.key} className="border-t bg-muted/10">
                            {Array.from({ length: maxDepth }).map((_, col) => {
                              const prevVal = col === 0 ? 'root' : String(editCells[col - 1] ?? '').trim();
                              const currentVal = String(editCells[col] ?? '').trim();
                              const isDisabled = col > 0 && !prevVal && !currentVal;
                              const parentId = resolveParentIdForDatalist(editCells, col);
                              const opts = parentId ? (valuesByParentAndDepth.byParent[col]?.get(parentId) ?? []) : [];
                              const datalistId = `edit-dl-${c.key}-${col}`;
                              const isNewColumn = col >= originalDepth;

                              return (
                                <td key={col} className="px-1.5 py-1 min-w-[140px]">
                                  <Input
                                    value={editCells[col] ?? ''}
                                    onChange={(e) => updateEditingCell(c.key, col, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') commitEditRow(c.key);
                                      if (e.key === 'Escape') cancelEditRow(c.key);
                                    }}
                                    disabled={isDisabled}
                                    placeholder={isDisabled ? '' : isNewColumn ? 'Add value…' : 'Edit…'}
                                    className={`h-8 text-xs transition-all ${
                                      isNewColumn && !isDisabled ? "border-blue-400 border-dashed bg-blue-50/30" : ""
                                    }`}
                                    list={opts.length > 0 ? datalistId : undefined}
                                  />
                                  {opts.length > 0 && (
                                    <datalist id={datalistId}>
                                      {opts.map((o) => (
                                        <option key={o.id} value={o.label} />
                                      ))}
                                    </datalist>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-3 py-1.5 sticky right-0 bg-muted/10 z-20 shadow-[-1px_0_0_0_rgba(0,0,0,0.1)]">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={() => commitEditRow(c.key)}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-destructive hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                  onClick={() => cancelEditRow(c.key)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr
                          key={c.key}
                          className="border-t hover:bg-muted/30"
                        >
                          {Array.from({ length: maxDepth }).map((_, i) => {
                            const val = c.path[i] ?? '';
                            const prevVal = i === 0 ? 'root' : String(c.path[i - 1] ?? '').trim();
                            const isNextToFill = !val && prevVal;
                            return (
                              <td
                                key={i}
                                className={`px-3 py-2 text-xs whitespace-nowrap group relative min-w-[100px] ${
                                  isNextToFill ? "cursor-pointer" : ""
                                }`}
                                onClick={() => { if (isNextToFill) startEditRow(c.key, c.path); }}
                              >
                                <span className={!val && isNextToFill ? "text-blue-500/50 italic" : ""}>
                                  {val || (isNextToFill ? "Click to add..." : "")}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 sticky right-0 bg-inherit shadow-[-1px_0_0_0_rgba(0,0,0,0.1)] z-10 group-hover:bg-muted/20">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => startEditRow(c.key, c.path)}
                                disabled={Object.keys(bulkEditStates).length > 0}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-destructive hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                onClick={() =>
                                  setRemoveTarget({ key: c.key, label: c.path.join(' / ') })
                                }
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {draftRows.map((r) => (
                      <tr key={r.id} className="border-t bg-muted/5">
                        {Array.from({ length: maxDepth }).map((_, col) => {
                          const prev = col === 0 ? 'x' : String(r.cells[col - 1] ?? '').trim();
                          const disabled = col > 0 && !prev;
                          const parentId = resolveParentIdForDatalist(r.cells, col);
                          const opts = parentId
                            ? (valuesByParentAndDepth.byParent[col]?.get(parentId) ?? [])
                            : [];
                          const datalistId = `dl-${r.id}-${col}`;

                          return (
                            <td key={col} className="px-2 py-1.5">
                              <Input
                                value={r.cells[col] ?? ''}
                                disabled={disabled || Object.keys(bulkEditStates).length > 0}
                                onChange={(e) => updateDraftCell(r.id, col, e.target.value)}
                                placeholder={disabled ? '' : 'Enter…'}
                                className="h-8 text-xs"
                                list={opts.length > 0 ? datalistId : undefined}
                              />
                              {opts.length > 0 && (
                                <datalist id={datalistId}>
                                  {opts
                                    .slice()
                                    .sort((a, b) => a.label.localeCompare(b.label))
                                    .map((o) => (
                                      <option key={o.id} value={o.label} />
                                    ))}
                                </datalist>
                              )}
                            </td>
                          );
                        })}
                         <td className="px-3 py-1.5 sticky right-0 bg-muted/5 z-10 shadow-[-1px_0_0_0_rgba(0,0,0,0.1)]">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => commitDraftRow(r.id)}
                              disabled={buildRowParts(r.cells).length === 0 || Object.keys(bulkEditStates).length > 0}
                            >
                              Add
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-destructive hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                              onClick={() =>
                                setDraftRows((prev) => prev.filter((x) => x.id !== r.id))
                              }
                              disabled={Object.keys(bulkEditStates).length > 0}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={addMultipleOpen} onOpenChange={setAddMultipleOpen}>
        <DialogContent className="sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle>Add Multiple Rows</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              Enter one row per line (comma-separated). Example:{' '}
              {localRc.titleLabelNames.slice(0, 2).join(', ') || 'Level 1, Level 2'}
            </div>
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={localRc.titleLabelNames.join(', ')}
              className="min-h-[160px]"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {parsedBulkRows.length} line{parsedBulkRows.length === 1 ? '' : 's'} detected
              </span>
              <span>Max depth: {localRc.titleLabelNames.length}</span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setBulkText('');
                setAddMultipleOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={addMultipleRows} disabled={parsedBulkRows.length === 0}>
              Add {parsedBulkRows.length}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Row Dialog */}
      <AlertDialog open={!!removeTarget} onOpenChange={(v) => !v && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove row?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{removeTarget?.label ?? ''}". This action will take effect when you
              save.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveRow}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Level Dialog */}
      <AlertDialog
        open={removeLevelIdx !== null}
        onOpenChange={(v) => !v && setRemoveLevelIdx(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove level?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the "{localRc.titleLabelNames[removeLevelIdx ?? 0]}" level and all
              its values. This action will take effect when you save.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => removeLevel(removeLevelIdx!)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


