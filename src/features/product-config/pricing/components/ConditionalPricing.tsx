import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Badge,
  Separator,
  Textarea,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import {
  Plus,
  Trash2,
  Edit,
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  GripVertical,
  X,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import {
  getConditionalPricingRules,
  createConditionalPricingRule,
  updateConditionalPricingRule,
  deleteConditionalPricingRule,
  ConditionalPricingRule,
  CreateConditionalPricingRulePayload,
  ConditionalPricingRuleCondition,
  ConditionalPricingRuleAction,
} from '@/features/product-config/pricing/api/conditional-pricing';
import { getGroupedRatingParameters, RatingParameterItem } from '@/features/product-config/pricing/api/ratings';
import { getProductRatingParameters, RatingParameter } from '@/features/product-config/api/products';

interface LocalCondition {
  id: string;
  parameterId: string;
  operator: string;
  value: string | number | string[];
  sequenceNo?: number;
  logicalOp?: string;
}

interface LocalAction {
  id: string;
  adjustmentType: 'PERCENTAGE' | 'FACTOR' | 'FIXED';
  adjustmentValue: number;
  quoteAction: 'quote' | 'no_quote' | 'referral';
}

interface Props {
  productId: string;
  productName?: string;
}

const normalizeOptions = (
  options?: RatingParameter['options'],
): Array<{ label: string; value: string }> => {
  if (!options || options.length === 0) return [];
  return options.map((o) =>
    typeof o === 'string' ? { label: o, value: o } : { label: o.label, value: o.value },
  );
};

const ConditionalPricing = ({ productId, productName }: Props) => {
  const { toast } = useToast();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  const [rules, setRules] = useState<ConditionalPricingRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ConditionalPricingRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Data for conditions and actions
  const [ratingParameters, setRatingParameters] = useState<RatingParameter[]>([]);
  const [actionableParameters, setActionableParameters] = useState<RatingParameterItem[]>([]);

  // Form State
  const [ruleName, setRuleName] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [conditions, setConditions] = useState<LocalCondition[]>([]);
  const [actions, setActions] = useState<LocalAction[]>([]);
  const [priority, setPriority] = useState(1);
  const [isActive, setIsActive] = useState(true);

  const [draggedParameter, setDraggedParameter] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      loadData();
    }
  }, [productId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [rulesData, paramsData, groupedParams] = await Promise.all([
        getConditionalPricingRules(productId),
        getProductRatingParameters(productId),
        getGroupedRatingParameters(productId),
      ]);

      setRules(rulesData);
      setRatingParameters(paramsData);

      // Flatten grouped params for actions
      const allActionable: RatingParameterItem[] = [
        ...(groupedParams.base || []),
        ...(groupedParams.factor || []),
        ...(groupedParams.premiumLimit || []),
      ];
      console.log('allActionable', allActionable);
      setActionableParameters(allActionable);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load configuration data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRule = async () => {
    if (!ruleName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a rule name.',
        variant: 'destructive',
      });
      return;
    }

    if (conditions.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one condition.',
        variant: 'destructive',
      });
      return;
    }

    if (actions.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one action.',
        variant: 'destructive',
      });
      return;
    }

    const payload: CreateConditionalPricingRulePayload = {
      name: ruleName,
      description: ruleDescription,
      conditions: conditions.map((c, i) => ({
        parameterId: c.parameterId,
        operator: c.operator,
        value: c.value,
        sequenceNo: i + 1,
        logicalOp: c.logicalOp || 'AND',
      })),
      actions: actions.map((a) => ({
        targetParameterId: '',
        adjustmentType: a.adjustmentType,
        adjustmentValue: a.adjustmentValue,
        quoteAction: a.quoteAction,
      })),
      priority,
      isActive,
    };

    try {
      setIsLoading(true);
      if (isEditing && selectedRule) {
        await updateConditionalPricingRule(selectedRule.id, payload);
        toast({ title: 'Success', description: 'Rule updated successfully.' });
      } else {
        await createConditionalPricingRule(productId, payload);
        toast({ title: 'Success', description: 'Rule created successfully.' });
      }
      await loadData(); // Reload rules
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to save rule.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRule = (rule: ConditionalPricingRule) => {
    showConfirmDialog(
      {
        title: 'Delete Rule',
        description: `Are you sure you want to delete "${rule.name}"?`,
        confirmText: 'Delete',
        variant: 'destructive',
      },
      async () => {
        try {
          setIsLoading(true);
          await deleteConditionalPricingRule(rule.id);
          toast({
            title: 'Success',
            description: 'Rule deleted successfully.',
          });
          if (selectedRule?.id === rule.id) setSelectedRule(null);
          await loadData();
        } catch (error) {
          console.error('Failed to delete rule:', error);
          toast({
            title: 'Error',
            description: 'Failed to delete rule.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      },
    );
  };

  const handleOpenDialog = (rule?: ConditionalPricingRule) => {
    if (rule) {
      setIsEditing(true);
      setSelectedRule(rule);
      setRuleName(rule.name);
      setRuleDescription(rule.description || '');
      setPriority(rule.priority);
      setIsActive(rule.isActive);
      setConditions(
        rule.conditions.map((c) => ({
          ...c,
          id: Math.random().toString(36).substr(2, 9),
        })),
      );
      setActions(
        rule.actions.map((a) => ({
          ...a,
          id: Math.random().toString(36).substr(2, 9),
          adjustmentType: a.adjustmentType as 'PERCENTAGE' | 'FIXED' | 'FACTOR',
        })),
      );
    } else {
      setIsEditing(false);
      setSelectedRule(null);
      setRuleName('');
      setRuleDescription('');
      setPriority(1);
      setIsActive(true);
      setConditions([]);
      setActions([
        {
          id: Math.random().toString(36).substr(2, 9),
          adjustmentType: 'FIXED',
          adjustmentValue: 0,
          quoteAction: 'quote',
        },
      ]);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedRule(null);
  };

  // Condition Logic
  const handleDragStart = (parameterId: string) => {
    setDraggedParameter(parameterId);
  };

  const handleDropCondition = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedParameter) return;

    const param = ratingParameters.find((p) => p.id === draggedParameter);
    if (!param) return;

    const newCondition: LocalCondition = {
      id: Math.random().toString(36).substr(2, 9),
      parameterId: draggedParameter,
      operator: param.type === 'number' ? 'greaterThan' : 'equals',
      value: '',
      logicalOp: 'AND',
    };

    setConditions([...conditions, newCondition]);
    setDraggedParameter(null);
  };

  const updateCondition = (id: string, updates: Partial<LocalCondition>) => {
    setConditions(conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  // Action Logic
  const updateAction = (id: string, updates: Partial<LocalAction>) => {
    setActions(actions.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const getConditionDisplay = (condition: LocalCondition) => {
    const param = ratingParameters.find((p) => p.id === condition.parameterId);
    return `${param?.label || condition.parameterId} ${condition.operator} ${condition.value}`;
  };

  const getActionDisplay = (action: LocalAction) => {
    const typeMap = { PERCENTAGE: '%', FIXED: '', FACTOR: 'x' };
    const quoteMap = {
      quote: 'Quote',
      no_quote: 'No Quote',
      referral: 'Referral',
    };
    return `${typeMap[action.adjustmentType]} ${
      action.adjustmentValue
    } (${quoteMap[action.quoteAction]})`;
  };

  return (
    <div className="flex h-[800px] border rounded-md overflow-hidden bg-background">
      {/* Sidebar List */}
      <div className="w-1/3 border-r bg-muted/20 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Rules</h2>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-3 border rounded cursor-pointer transition-colors ${
                selectedRule?.id === rule.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedRule(rule)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium truncate">{rule.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {rule.conditions.length} conditions • {rule.actions.length} actions
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDialog(rule);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRule(rule);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {selectedRule ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{selectedRule.name}</h2>
                <p className="text-muted-foreground">{selectedRule.description}</p>
              </div>
              <Badge variant={selectedRule.isActive ? 'default' : 'secondary'}>
                {selectedRule.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedRule.conditions.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border rounded">
                    <span className="font-mono text-sm text-muted-foreground w-10">
                      {i === 0 ? 'IF' : 'AND'}
                    </span>
                    <Badge variant="outline">
                      {getConditionDisplay({ ...c, id: '' } as LocalCondition)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedRule.actions.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border rounded">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="secondary">
                      {getActionDisplay({ ...a, id: '' } as LocalAction)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Shield className="w-16 h-16 mb-4 opacity-20" />
            <p>Select a rule to view details</p>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Rule' : 'Create Conditional Pricing Rule'}</DialogTitle>
            <DialogDescription>
              Define conditions and the pricing actions to apply when they match.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. High Risk Surcharge"
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={ruleDescription}
                onChange={(e) => setRuleDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={isActive} onCheckedChange={(c) => setIsActive(!!c)} />
              <Label>Active</Label>
            </div>

            <Separator />

            {/* Conditions Builder */}
            <div className="space-y-4">
              <Label>Conditions</Label>
              <div className="flex gap-4">
                <div className="w-1/3 border rounded p-2 h-48 overflow-y-auto">
                  <div className="text-xs font-semibold mb-2">Available Parameters</div>
                  {ratingParameters.map((param) => (
                    <div
                      key={param.id}
                      draggable
                      onDragStart={() => handleDragStart(param.id)}
                      className="p-1 mb-1 bg-secondary rounded text-xs cursor-move flex items-center gap-2"
                    >
                      <GripVertical className="w-3 h-3" />
                      {param.label}
                    </div>
                  ))}
                </div>
                <div
                  className="flex-1 border-2 border-dashed rounded p-4 min-h-[12rem]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropCondition}
                >
                  {conditions.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm pt-10">
                      Drag parameters here to create conditions
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conditions.map((c, i) => (
                        <div key={c.id} className="flex items-center gap-2">
                          <span className="text-xs font-mono w-8">{i === 0 ? 'IF' : 'AND'}</span>
                          <Select
                            value={c.parameterId}
                            onValueChange={(v) => updateCondition(c.id, { parameterId: v })}
                          >
                            <SelectTrigger className="w-40">
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
                            value={c.operator}
                            onValueChange={(v) => updateCondition(c.id, { operator: v })}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">=</SelectItem>
                              <SelectItem value="notEquals">≠</SelectItem>
                              <SelectItem value="greaterThan">&gt;</SelectItem>
                              <SelectItem value="lessThan">&lt;</SelectItem>
                              <SelectItem value="contains">contains</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={c.value as string}
                            onChange={(e) => updateCondition(c.id, { value: e.target.value })}
                            className="w-32"
                            placeholder="Value"
                          />
                          <Button variant="ghost" size="sm" onClick={() => removeCondition(c.id)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Actions Builder */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Actions (Apply if conditions match)</Label>
              </div>
              <div className="space-y-2 border rounded p-4 bg-muted/10">
                {actions.map((a) => (
                  <div key={a.id} className="grid grid-cols-3 gap-4 items-center">
                    <Select
                      value={a.adjustmentType}
                      onValueChange={(v: 'PERCENTAGE' | 'FACTOR' | 'FIXED') =>
                        updateAction(a.id, { adjustmentType: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                        <SelectItem value="FACTOR">Factor</SelectItem>
                        <SelectItem value="FIXED">Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={a.adjustmentValue}
                      onChange={(e) =>
                        updateAction(a.id, { adjustmentValue: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="Value"
                    />
                    <Select
                      value={a.quoteAction}
                      onValueChange={(v: 'quote' | 'no_quote' | 'referral') =>
                        updateAction(a.id, { quoteAction: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quote">Quote</SelectItem>
                        <SelectItem value="no_quote">No Quote</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSaveRule} disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </div>
  );
};

export default ConditionalPricing;
