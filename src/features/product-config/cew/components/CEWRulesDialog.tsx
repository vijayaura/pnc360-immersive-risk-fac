import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Trash2,
  Shield,
  GripVertical,
  X,
  Loader2,
  Edit,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  getCEWRules,
  createCEWRule,
  updateCEWRule,
  deleteCEWRule,
  CEWRule as ApiCEWRule,
  CreateCEWRulePayload,
  UpdateCEWRulePayload,
  CEWRuleCondition,
} from '@/features/product-config/cew/api/product-cew-rules';
import { getProductRatingParameters, RatingParameter } from '@/features/product-config/api/products';
import { formatNumberWithCommas, removeCommasFromNumber } from '@/shared/utils/numberFormat';

const normalizeOptions = (
  options?: RatingParameter['options'],
): Array<{ label: string; value: string }> => {
  if (!options || options.length === 0) return [];
  return options.map((o) =>
    typeof o === 'string' ? { label: o, value: o } : { label: o.label, value: o.value },
  );
};

interface LocalCondition {
  id: string;
  parameterId: string;
  operator:
    | 'equals'
    | 'notEquals'
    | 'greaterThan'
    | 'lessThan'
    | 'greaterThanOrEqual'
    | 'lessThanOrEqual'
    | 'contains'
    | 'in';
  value: string | number | string[];
  sequenceNo?: number;
  logicalOp?: 'AND' | 'OR';
}

export interface CewListItem {
  id: string;
  title: string;
}

interface CEWRulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | undefined;
  cewsList: CewListItem[];
  onOpenAddClause?: () => void;
  onRulesChanged?: () => void;
}

type RuleBuilderState = {
  conditions: LocalCondition[];
  selectedCews: string[];
  isActive: boolean;
};

type DraftRule = { id: string } & RuleBuilderState;

export const CEWRulesDialog: React.FC<CEWRulesDialogProps> = ({
  open,
  onOpenChange,
  productId,
  cewsList = [],
  onOpenAddClause,
  onRulesChanged,
}) => {
  const { toast } = useToast();
  const [ratingParameters, setRatingParameters] = useState<RatingParameter[]>([]);
  const [rules, setRules] = useState<ApiCEWRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [draftRules, setDraftRules] = useState<DraftRule[]>([]);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [editingRuleState, setEditingRuleState] = useState<RuleBuilderState | null>(null);
  const [savingRuleId, setSavingRuleId] = useState<string | null>(null);
  const [draggedParameter, setDraggedParameter] = useState<string | null>(null);
  const newDraftCardRef = useRef<HTMLDivElement | null>(null);
  const prevDraftCountRef = useRef(0);

  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    const count = draftRules.length;
    if (count > prevDraftCountRef.current && newDraftCardRef.current) {
      prevDraftCountRef.current = count;
      const el = newDraftCardRef.current;
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else {
      prevDraftCountRef.current = count;
    }
  }, [draftRules.length]);

  const loadRatingParameters = async (id: string) => {
    try {
      const data = await getProductRatingParameters(id);
      const defaultParams: RatingParameter[] = [
        { id: 'sum_insured', label: 'Sum Insured', name: 'sum_insured', type: 'number' },
        { id: 'base_premium', label: 'Base Premium', name: 'base_premium', type: 'number' },
      ];
      const uniqueData = data.filter(
        (p) => !defaultParams.some((d) => d.id === p.id || d.name === p.name),
      );
      setRatingParameters([...defaultParams, ...uniqueData]);
    } catch (error) {
      console.error('Failed to load rating parameters:', error);
      toast({
        title: 'Error',
        description: 'Failed to load rating parameters.',
        variant: 'destructive',
      });
    }
  };

  const loadRules = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await getCEWRules(id);
      setRules(data);
    } catch (error) {
      console.error('Failed to load CEW rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load CEW rules. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && productId) {
      loadRatingParameters(productId);
      loadRules(productId);
    }
  }, [open, productId]);

  const buildConditionsPayload = (
    conditions: LocalCondition[],
    isEdit: boolean,
  ): CEWRuleCondition[] =>
    conditions.map((c, index) => {
      const isNewCondition = c.id.startsWith('cond-');
      const base = {
        parameterId: c.parameterId,
        operator: c.operator,
        value: String(c.value),
        sequenceNo: index + 1,
        logicalOp: (c.logicalOp || 'AND') as 'AND' | 'OR',
      };
      if (isEdit && !isNewCondition && c.id) {
        return { ...base, id: c.id };
      }
      return base;
    });

  const handleSaveDraft = async (draftId: string) => {
    const draft = draftRules.find((d) => d.id === draftId);
    if (!draft) return;
    if (!draft.conditions?.length) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one condition.',
        variant: 'destructive',
      });
      return;
    }
    if (!productId) {
      toast({
        title: 'Error',
        description: 'Product ID is missing.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setSavingRuleId(draftId);
      const payload: CreateCEWRulePayload = {
        isActive: draft.isActive,
        conditions: buildConditionsPayload(draft.conditions, false) as CEWRuleCondition[],
        selectedCews: draft.selectedCews,
      };
      await createCEWRule(productId, payload);
      toast({ title: 'Rule Created', description: 'CEW rule has been created.' });
      if (productId) await loadRules(productId);
      setDraftRules((prev) => prev.filter((d) => d.id !== draftId));
    } catch (error: unknown) {
      console.error('[handleSaveDraft] Failed to save rule:', error);
      const msg = error instanceof Error ? error.message
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({
        title: 'Error',
        description: 'Failed to save rule. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingRuleId(null);
    }
  };

  const handleUpdateRule = async () => {
    if (!expandedRuleId || !editingRuleState) return;
    if (!editingRuleState.conditions?.length) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one condition.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setSavingRuleId(expandedRuleId);
      const payload: UpdateCEWRulePayload = {
        isActive: editingRuleState.isActive,
        conditions: buildConditionsPayload(
          editingRuleState.conditions,
          true,
        ) as CEWRuleCondition[],
        selectedCews: editingRuleState.selectedCews,
      };
      await updateCEWRule(expandedRuleId, payload);
      toast({ title: 'Rule Updated', description: 'CEW rule has been updated.' });
      if (productId) await loadRules(productId);
      setExpandedRuleId(null);
      setEditingRuleState(null);
    } catch (error: unknown) {
      console.error('[handleUpdateRule] Failed to update rule:', error);
      const msg = error instanceof Error ? error.message
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({
        title: 'Error',
        description: msg || 'Failed to update rule. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingRuleId(null);
    }
  };

  const handleDeleteRule = async (rule: ApiCEWRule) => {
    try {
      setIsLoading(true);
      await deleteCEWRule(rule.id);
      toast({ title: 'Rule Deleted', description: 'CEW rule has been deleted.' });
      if (expandedRuleId === rule.id) {
        setExpandedRuleId(null);
        setEditingRuleState(null);
      }
      if (productId) await loadRules(productId);
      onRulesChanged?.();
    } catch (error) {
      console.error('Failed to delete rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete rule. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDraft = (draftId: string) => {
    setDraftRules((prev) => prev.filter((d) => d.id !== draftId));
  };

  const handleCancelEdit = () => {
    setExpandedRuleId(null);
    setEditingRuleState(null);
  };

  const handleStartEditing = (rule: ApiCEWRule) => {
    const localConditions: LocalCondition[] = (rule.conditions || []).map((c) => {
      const param = ratingParameters.find((p) => p.id === c.parameterId);
      let value: string | number | string[] = c.value;
      if (param?.type === 'number' && typeof c.value === 'string') {
        const num = parseFloat(c.value);
        if (!isNaN(num)) value = num;
      }
      return {
        id: c.id || `cond-${Math.random().toString(36).substr(2, 9)}`,
        parameterId: c.parameterId,
        operator: c.operator,
        value,
        sequenceNo: c.sequenceNo,
        logicalOp: (c.logicalOp || 'AND') as 'AND' | 'OR',
      };
    });
    setExpandedRuleId(rule.id);
    setEditingRuleState({
      conditions: localConditions,
      selectedCews: rule.selectedCews || [],
      isActive: rule.isActive,
    });
  };

  const handleCreateNew = () => {
    setDraftRules((prev) => [
      ...prev,
      {
        id: `draft-${Date.now()}`,
        conditions: [],
        selectedCews: [],
        isActive: true,
      },
    ]);
  };

  const handleDragStart = (parameterId: string) => setDraggedParameter(parameterId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const createAddCondition =
    (addCondition: (condition: LocalCondition) => void) => (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedParameter) return;
      const param = ratingParameters.find((p) => p.id === draggedParameter);
      if (!param) return;
      const firstOpt = normalizeOptions(param.options)[0]?.value || '';
      const newCondition: LocalCondition = {
        id: `cond-${Date.now()}`,
        parameterId: draggedParameter,
        operator: param.type === 'number' ? 'greaterThan' : 'equals',
        value: param.type === 'number' ? '' : firstOpt,
        sequenceNo: 1,
        logicalOp: 'AND',
      };
      addCondition(newCondition);
      setDraggedParameter(null);
    };

  const updateDraft = (draftId: string, updates: Partial<RuleBuilderState>) => {
    setDraftRules((prev) =>
      prev.map((d) => (d.id === draftId ? { ...d, ...updates } : d)),
    );
  };

  const updateDraftCondition = (draftId: string, conditionId: string, updates: Partial<LocalCondition>) => {
    setDraftRules((prev) =>
      prev.map((d) =>
        d.id === draftId
          ? {
              ...d,
              conditions: d.conditions.map((c) =>
                c.id === conditionId ? { ...c, ...updates } : c,
              ),
            }
          : d,
      ),
    );
  };

  const removeDraftCondition = (draftId: string, conditionId: string) => {
    setDraftRules((prev) =>
      prev.map((d) =>
        d.id === draftId
          ? { ...d, conditions: d.conditions.filter((c) => c.id !== conditionId) }
          : d,
      ),
    );
  };

  const getConditionDisplay = (condition: LocalCondition | CEWRuleCondition): string => {
    const param = ratingParameters.find((p) => p.id === condition.parameterId);
    if (!param) return 'Unknown';
    const operatorLabels: Record<string, string> = {
      equals: '=',
      notEquals: '≠',
      greaterThan: '>',
      lessThan: '<',
      greaterThanOrEqual: '≥',
      lessThanOrEqual: '≤',
      contains: 'contains',
      in: 'in',
    };
    const valueDisplay = Array.isArray(condition.value)
      ? condition.value.join(', ')
      : condition.value;
    return `${param.label} ${operatorLabels[condition.operator] || condition.operator} ${valueDisplay}`;
  };

  const getCewTitle = (cewId: string) => cewsList.find((c) => c.id === cewId)?.title || cewId;

  const renderRuleForm = (
    builder: RuleBuilderState,
    onUpdateCondition: (id: string, u: Partial<LocalCondition>) => void,
    onRemoveCondition: (id: string) => void,
    onToggleCew: (cewId: string) => void,
    onIsActiveChange: (checked: boolean) => void,
    onDropCondition: (e: React.DragEvent) => void,
    formId: string,
    openAddClause?: () => void,
  ) => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold mb-2 block">Rating Parameters</Label>
        <p className="text-xs text-muted-foreground mb-3">
          Drag and drop rating parameters to create conditions
        </p>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
          {ratingParameters.map((param) => (
            <Badge
              key={param.id}
              variant="outline"
              className="w-full justify-start p-2 cursor-move hover:bg-primary/10"
              draggable
              onDragStart={() => handleDragStart(param.id)}
            >
              <GripVertical className="w-4 h-4 mr-2" />
              {param.label}
            </Badge>
          ))}
        </div>
      </div>
      <Separator />
      <div>
        <Label className="text-sm font-semibold mb-2 block">Conditions <span className="text-destructive">*</span></Label>
        <div
          className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 min-h-[100px] bg-muted/5"
          onDragOver={handleDragOver}
          onDrop={onDropCondition}
        >
          {builder.conditions?.length ? (
            <div className="space-y-2">
              {builder.conditions.map((condition, index) => {
                const param = ratingParameters.find((p) => p.id === condition.parameterId);
                return (
                  <div
                    key={condition.id}
                    className="flex items-center gap-2 p-3 border rounded bg-background"
                  >
                    <span className="text-sm font-medium text-muted-foreground min-w-[40px]">
                      {index === 0 ? 'IF' : 'AND'}
                    </span>
                    <Select
                      value={condition.parameterId}
                      onValueChange={(value) => {
                        const newParam = ratingParameters.find((p) => p.id === value);
                        const normOpts = normalizeOptions(newParam?.options);
                        onUpdateCondition(condition.id, {
                          parameterId: value,
                          operator: newParam?.type === 'number' ? 'greaterThan' : 'equals',
                          value: newParam?.type === 'number' ? 0 : normOpts[0]?.value || '',
                        });
                      }}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ratingParameters.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) =>
                        onUpdateCondition(condition.id, {
                          operator: value as LocalCondition['operator'],
                        })
                      }
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">=</SelectItem>
                        <SelectItem value="notEquals">≠</SelectItem>
                        <SelectItem value="greaterThan">&gt;</SelectItem>
                        <SelectItem value="lessThan">&lt;</SelectItem>
                        <SelectItem value="greaterThanOrEqual">≥</SelectItem>
                        <SelectItem value="lessThanOrEqual">≤</SelectItem>
                      </SelectContent>
                    </Select>
                    {param?.type === 'dropdown' && param?.options ? (
                      <Select
                        value={condition.value as string}
                        onValueChange={(value) => onUpdateCondition(condition.id, { value })}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {normalizeOptions(param.options).map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type="text"
                        inputMode={param?.type === 'number' ? 'decimal' : undefined}
                        value={
                          param?.type === 'number'
                            ? formatNumberWithCommas(String(condition.value ?? ''))
                            : String(condition.value ?? '')
                        }
                        onChange={(e) =>
                          onUpdateCondition(condition.id, {
                            value:
                              param?.type === 'number'
                                ? removeCommasFromNumber(e.target.value).replace(/[^0-9.]/g, '')
                                : e.target.value,
                          })
                        }
                        className="w-[150px]"
                        placeholder={param?.type === 'number' ? '0' : 'Value'}
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveCondition(condition.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-4">
              Drag and drop rating parameters here to create conditions
            </div>
          )}
        </div>
      </div>
      <Separator />
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <Label className="text-sm font-semibold block">
            CEW&apos;s (Clauses, Exclusions, and Warranties Section)
          </Label>
          {openAddClause && (
            <Button type="button" size="sm" variant="outline" onClick={openAddClause}>
              <Plus className="w-4 h-4 mr-2" />
              Add Clause
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Select the CEWs to associate with this rule.
        </p>
        <div className="border rounded-lg p-4 max-h-48 overflow-y-auto flex flex-wrap gap-x-4 gap-y-2 bg-muted/5">
          {cewsList.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No clauses, exclusions or warranties configured.
            </p>
          ) : (
            cewsList.map((cew) => (
              <div key={cew.id} className="flex items-center space-x-2 shrink-0">
                <Checkbox
                  id={`${formId}-cew-${cew.id}`}
                  checked={builder.selectedCews.includes(cew.id)}
                  onCheckedChange={() => onToggleCew(cew.id)}
                />
                <Label
                  htmlFor={`${formId}-cew-${cew.id}`}
                  className="cursor-pointer text-sm font-normal whitespace-nowrap"
                >
                  {cew.title || cew.id}
                </Label>
              </div>
            ))
          )}
        </div>
      </div>
      <Separator />
      <div className="flex items-center space-x-2">
        <Label htmlFor={`${formId}-isActive`} className="cursor-pointer">
          Rule is active
        </Label>
        <Switch
          id={`${formId}-isActive`}
          checked={builder.isActive !== false}
          onCheckedChange={(checked) => onIsActiveChange(checked)}
          role="switch"
          data-interactive="true"
        />
      </div>
    </div>
  );

  const hasAnyRules = rules.length > 0 || draftRules.length > 0;
  const isEmpty = !isLoading && rules.length === 0 && draftRules.length === 0;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            setExpandedRuleId(null);
            setEditingRuleState(null);
            setDraftRules([]);
          }
          onOpenChange(next);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="p-6">
            <DialogTitle>CEW Rules</DialogTitle>
            <DialogDescription>
              View and manage CEW (Clauses, Exclusions, Warranties) rules.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 border-y">
            <div className="space-y-6">
              <Button onClick={handleCreateNew} className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create new Rule
              </Button>

              {isLoading && !hasAnyRules ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : isEmpty ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  No CEW rules added yet. Click &quot;Create new Rule&quot; to add a rule.
                </div>
              ) : (
                <div className="space-y-4">
                  {rules.map((rule) => {
                    const isExpanded = expandedRuleId === rule.id;
                    const formState = isExpanded ? editingRuleState : null;
                    return (
                      <Card key={rule.id} className="p-4 bg-muted/20">
                        {isExpanded && formState ? (
                          <>
                            <div className="space-y-4">
                              {renderRuleForm(
                                formState,
                                (id, u) => {
                                  if (!id) return;
                                  setEditingRuleState((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          conditions: prev.conditions.map((c) =>
                                            c.id === id ? { ...c, ...u } : c,
                                          ),
                                        }
                                      : null,
                                  );
                                },
                                (id) =>
                                  setEditingRuleState((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          conditions: prev.conditions.filter((c) => c.id !== id),
                                        }
                                      : null,
                                  ),
                                (cewId) =>
                                  setEditingRuleState((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          selectedCews: prev.selectedCews.includes(cewId)
                                            ? prev.selectedCews.filter((i) => i !== cewId)
                                            : [...prev.selectedCews, cewId],
                                        }
                                      : null,
                                  ),
                                (checked) =>
                                  setEditingRuleState((prev) =>
                                    prev ? { ...prev, isActive: checked } : null,
                                  ),
                                createAddCondition((cond) =>
                                  setEditingRuleState((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          conditions: [...prev.conditions, cond],
                                        }
                                      : null,
                                  ),
                                ),
                                `edit-${rule.id}`,
                                onOpenAddClause,
                              )}
                            </div>
                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                              <Button variant="outline" onClick={handleCancelEdit}>
                                Cancel
                              </Button>
                              <Button
                                onClick={handleUpdateRule}
                                disabled={savingRuleId === rule.id}
                              >
                                {savingRuleId === rule.id && (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                )}
                                Update Rule
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-start justify-between gap-4">
                            <div
                              className="flex-1 cursor-pointer min-w-0"
                              onClick={() => handleStartEditing(rule)}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <CardTitle className="text-base">
                                  Rule ({rule.conditions?.length || 0} conditions)
                                </CardTitle>
                                <Badge
                                  variant={rule.isActive ? 'default' : 'secondary'}
                                  className="text-[10px]"
                                >
                                  {rule.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              {(rule.selectedCews?.length ?? 0) > 0 && (
                                <CardDescription className="mt-1 line-clamp-2">
                                  CEWs: {rule.selectedCews.map(getCewTitle).join(', ')}
                                </CardDescription>
                              )}
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {(rule.conditions || []).slice(0, 2).map((condition, idx) => (
                                  <Badge
                                    key={condition.id || idx}
                                    variant="secondary"
                                    className="text-[10px] max-w-full truncate"
                                  >
                                    {getConditionDisplay(condition)}
                                  </Badge>
                                ))}
                                {(rule.conditions?.length ?? 0) > 2 && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    +{(rule.conditions?.length ?? 0) - 2} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEditing(rule);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showConfirmDialog(
                                    {
                                      title: 'Delete Rule',
                                      description:
                                        'Are you sure you want to delete this CEW rule? This action cannot be undone.',
                                      confirmText: 'Delete',
                                      variant: 'destructive',
                                    },
                                    () => handleDeleteRule(rule),
                                  );
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}

                  {draftRules.map((draft, draftIndex) => (
                    <Card key={draft.id} ref={draftIndex === draftRules.length - 1 ? newDraftCardRef : undefined} className="p-4 bg-muted/20" style={{ scrollMarginTop: '25px' }}>
                      <div className="space-y-4">
                        {renderRuleForm(
                          draft,
                          (id, u) => {
                            if (id) updateDraftCondition(draft.id, id, u);
                          },
                          (id) => removeDraftCondition(draft.id, id),
                          (cewId) => {
                            const next = draft.selectedCews.includes(cewId)
                              ? draft.selectedCews.filter((i) => i !== cewId)
                              : [...draft.selectedCews, cewId];
                            updateDraft(draft.id, { selectedCews: next });
                          },
                          (checked) => updateDraft(draft.id, { isActive: checked }),
                          createAddCondition((cond) =>
                            setDraftRules((prev) =>
                              prev.map((d) =>
                                d.id === draft.id
                                  ? { ...d, conditions: [...d.conditions, cond] }
                                  : d,
                              ),
                            ),
                          ),
                          draft.id,
                          onOpenAddClause,
                        )}
                      </div>
                      <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                        <Button variant="outline" onClick={() => handleCancelDraft(draft.id)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleSaveDraft(draft.id)}
                          disabled={savingRuleId === draft.id}
                        >
                          {savingRuleId === draft.id && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          )}
                          Save Rule
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
          <ConfirmDialog />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CEWRulesDialog;
