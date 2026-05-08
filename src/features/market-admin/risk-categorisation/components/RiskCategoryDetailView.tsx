import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Trash2, Download, Upload, Save } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InsertLevelPopover } from './InsertLevelPopover';
import {
  getRiskLevelShade,
  generateId,
  buildAssignmentExportRows,
  parseAssignmentImportRows,
  RISK_LEVEL_COLUMN_HEADER,
} from '../utils/riskCategorisation';
import type { RiskCategory, RiskLevel, RiskCategorisation } from '../utils/riskCategorisation';

interface Combination {
  key: string;
  path: string[];
}

interface RiskCategoryDetailViewProps {
  rc: RiskCategorisation;
  category: RiskCategory;
  combinations: Combination[];
  onSaveRiskLevels: (riskLevels: RiskLevel[]) => void;
  onSaveAssignments: (assignments: Record<string, string>) => void;
  isSaving?: boolean;
}

export function RiskCategoryDetailView({
  rc,
  category,
  combinations,
  onSaveRiskLevels,
  onSaveAssignments,
  isSaving,
}: RiskCategoryDetailViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Tracks whether there are pending imported assignments that haven't been saved yet.
   *  Prevents background query refetch from overwriting the imported data. */
  const hasUnsavedImportRef = useRef(false);
  const [localLevels, setLocalLevels] = useState<RiskLevel[]>(category.riskLevels);
  const [localAssignments, setLocalAssignments] = useState<Record<string, string>>(
    category.assignments ?? {},
  );
  const [search, setSearch] = useState('');

  // Keep local levels in sync when category changes (e.g. after save)
  const categoryLevelsKey = category.riskLevels
    .map((l) => l.id + l.label + String(l.order))
    .join(',');
  useMemo(() => {
    setLocalLevels([...category.riskLevels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryLevelsKey]);

  // Keep local assignments in sync when category changes (e.g. after save),
  // but don't overwrite pending imported assignments from Excel upload
  const categoryAssignmentsKey = JSON.stringify(category.assignments ?? {});
  useMemo(() => {
    if (!hasUnsavedImportRef.current) {
      setLocalAssignments(category.assignments ?? {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryAssignmentsKey]);

  const updateLocalLevels = (next: RiskLevel[]) => {
    setLocalLevels(next.map((l, i) => ({ ...l, order: i })));
  };

  const isDirty = useMemo(() => {
    if (localLevels.length !== category.riskLevels.length) return true;
    const sorted = [...category.riskLevels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return localLevels.some((l, i) => l.id !== sorted[i]?.id || l.label !== sorted[i]?.label);
  }, [localLevels, category.riskLevels]);

  const isAssignmentsDirty = useMemo(() => {
    const serverAssignments = category.assignments ?? {};
    const localKeys = Object.keys(localAssignments);
    const serverKeys = Object.keys(serverAssignments);
    if (localKeys.length !== serverKeys.length) return true;
    return localKeys.some((k) => localAssignments[k] !== serverAssignments[k]);
  }, [localAssignments, category.assignments]);

  // Clear unsaved-import flag once assignments are saved (dirty becomes false)
  useEffect(() => {
    if (!isAssignmentsDirty) {
      hasUnsavedImportRef.current = false;
    }
  }, [isAssignmentsDirty]);

  const isDuplicateLevel = (label: string) =>
    localLevels.some((l) => l.label.toLowerCase() === label.toLowerCase());

  const handleInsertLevel = (label: string) => {
    if (isDuplicateLevel(label)) {
      toast.error(`Risk level "${label}" already exists`);
      return;
    }
    updateLocalLevels([...localLevels, { id: generateId(), label, order: localLevels.length }]);
  };

  const handleInsertLevelBefore = (label: string, index: number) => {
    if (isDuplicateLevel(label)) {
      toast.error(`Risk level "${label}" already exists`);
      return;
    }
    const next = [...localLevels];
    next.splice(index, 0, { id: generateId(), label, order: index });
    updateLocalLevels(next);
  };

  const handleRemoveLevel = (id: string) => {
    updateLocalLevels(localLevels.filter((l) => l.id !== id));
  };

  const filteredCombinations = useMemo(() => {
    if (!search.trim()) return combinations;
    const q = search.toLowerCase();
    return combinations.filter((c) => c.path.some((p) => p.toLowerCase().includes(q)));
  }, [combinations, search]);

  const showAssignmentTable = combinations.length > 0 && localLevels.length > 0;

  const handleDownloadTemplate = useCallback(() => {
    const rows = buildAssignmentExportRows(rc, category, combinations);
    const wsAssignments = XLSX.utils.json_to_sheet(rows);
    const wsLevels = XLSX.utils.json_to_sheet(
      category.riskLevels.map((l) => ({ [RISK_LEVEL_COLUMN_HEADER]: l.label })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsAssignments, 'Assignments');
    XLSX.utils.book_append_sheet(wb, wsLevels, 'Valid Risk Levels');
    const safeName = category.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    XLSX.writeFile(wb, `${safeName}_assignments.xlsx`);
  }, [rc, category, combinations]);

  const handleImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Reset input so same file can be re-uploaded
      e.target.value = '';

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          if (!sheet) {
            toast.error('No data sheet found in the uploaded file');
            return;
          }
          const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
          // Use localLevels so locally-added (unsaved) risk levels are also recognized
          const categoryWithLocalLevels: RiskCategory = { ...category, riskLevels: localLevels };
          const result = parseAssignmentImportRows(rows, rc, categoryWithLocalLevels, combinations);

          if (result.assignedCount > 0) {
            hasUnsavedImportRef.current = true;
            setLocalAssignments((prev) => ({ ...prev, ...result.assignments }));
          }

          // Show a single, clear summary toast
          const totalRows = result.assignedCount + result.skippedCount + result.errors.length;

          if (result.errors.length === 0 && result.assignedCount > 0) {
            // All rows imported successfully
            const parts = [`${result.assignedCount} assignment(s) imported`];
            if (result.skippedCount > 0) {
              parts.push(`${result.skippedCount} skipped (blank)`);
            }
            toast.success(`${parts.join(', ')} — click Save to persist`);
          } else if (result.errors.length > 0 && result.assignedCount > 0) {
            // Partial success — some imported, some failed
            toast.warning(
              `${result.assignedCount} of ${totalRows} row(s) imported — click Save to persist. ${result.errors.length} row(s) had errors.`,
              {
                description:
                  result.errors.slice(0, 5).join('; ') +
                  (result.errors.length > 5 ? ` ...and ${result.errors.length - 5} more` : ''),
                duration: 8000,
              },
            );
          } else if (result.errors.length > 0 && result.assignedCount === 0) {
            // All rows failed
            toast.error(`No assignments could be imported (${result.errors.length} error(s))`, {
              description:
                result.errors.slice(0, 5).join('; ') +
                (result.errors.length > 5 ? ` ...and ${result.errors.length - 5} more` : ''),
              duration: 8000,
            });
          } else {
            toast.info('No assignments found in the uploaded file');
          }
        } catch {
          toast.error('Failed to read the uploaded file');
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [rc, category, combinations, localLevels],
  );

  return (
    <div className="space-y-6">
      {/* Risk Levels Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Risk Levels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Define levels from lowest to highest risk. Order matters.
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            {localLevels.map((level, i) => (
              <div key={level.id} className="inline-flex items-center gap-1.5">
                <InsertLevelPopover
                  onInsert={(label) => handleInsertLevelBefore(label, i)}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      title="Insert level before"
                      disabled={Boolean(isSaving)}
                    >
                      +
                    </Button>
                  }
                  placeholder="Enter risk level name"
                />
                <div
                  className={`${getRiskLevelShade(i, localLevels.length)} inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-sm`}
                >
                  <span>{level.label}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-70 hover:opacity-100 hover:bg-black/10"
                    onClick={() => handleRemoveLevel(level.id)}
                    disabled={Boolean(isSaving)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            {localLevels.length === 0 && (
              <span className="text-xs text-muted-foreground italic">No levels defined</span>
            )}
            <div className="flex items-center gap-3">
              <InsertLevelPopover
                onInsert={handleInsertLevel}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 mx-4 text-muted-foreground"
                    disabled={Boolean(isSaving)}
                  >
                    + Add level
                  </Button>
                }
                placeholder="Enter risk level name"
              />
              {isDirty && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => onSaveRiskLevels(localLevels)}
                  disabled={Boolean(isSaving)}
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </Button>
              )}
              {isSaving && <span className="text-xs text-muted-foreground">Saving...</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Combination Assignment Table */}
      {showAssignmentTable && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">Assign Risk Levels to Combinations</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {combinations.length} combination{combinations.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={handleDownloadTemplate}
                  disabled={Boolean(isSaving)}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={Boolean(isSaving)}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Template
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImportFile}
                />
                {isAssignmentsDirty && (
                  <Button
                    variant="default"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => onSaveAssignments(localAssignments)}
                    disabled={Boolean(isSaving)}
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Search combinations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs h-8 text-sm"
            />
            <div className="overflow-auto max-h-96 rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                  <tr>
                    {rc.titleLabelNames.map((name, i) => (
                      <th key={i} className="px-3 py-2 text-left font-medium text-xs">
                        {name}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left font-medium text-xs">Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCombinations.map((combo) => (
                    <tr key={combo.key} className="border-t hover:bg-muted/30 transition-colors">
                      {combo.path.map((label, i) => (
                        <td key={i} className="px-3 py-2 text-xs">
                          {label}
                        </td>
                      ))}
                      {/* Fill empty cells if path shorter than titleLabelNames */}
                      {Array.from({
                        length: Math.max(0, rc.titleLabelNames.length - combo.path.length),
                      }).map((_, i) => (
                        <td key={`empty-${i}`} className="px-3 py-2" />
                      ))}
                      <td className="px-3 py-2">
                        <Select
                          value={localAssignments[combo.key] ?? ''}
                          onValueChange={(v) =>
                            setLocalAssignments((prev) => ({ ...prev, [combo.key]: v }))
                          }
                        >
                          <SelectTrigger className="h-7 text-xs w-40">
                            <SelectValue placeholder="Assign level..." />
                          </SelectTrigger>
                          <SelectContent>
                            {localLevels.map((level, i) => (
                              <SelectItem key={level.id} value={level.id}>
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${getRiskLevelShade(i, localLevels.length)}`}
                                >
                                  {level.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                  {filteredCombinations.length === 0 && (
                    <tr>
                      <td
                        colSpan={rc.titleLabelNames.length + 1}
                        className="px-3 py-6 text-center text-xs text-muted-foreground"
                      >
                        No combinations match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {!showAssignmentTable && localLevels.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Add risk levels above to start assigning combinations.
        </p>
      )}

      {!showAssignmentTable && localLevels.length > 0 && combinations.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No master value combinations defined yet. Add values in the Masters tab.
        </p>
      )}
    </div>
  );
}
