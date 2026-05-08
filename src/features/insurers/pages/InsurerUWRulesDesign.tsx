import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Shield,
  GripVertical,
  X,
  Edit,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
  Upload,
  Download,
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  getUWRules,
  createUWRule,
  updateUWRule,
  deleteUWRule,
  UWRule as ApiUWRule,
  UWRulePayload,
  UWRuleCondition,
  UWRulesMeta,
} from '@/features/product-config/rating-configurator/api/uw-rules';
import { getProductRatingParameters, RatingParameter } from '@/features/product-config/api/products';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import UWRulesImportExport from '@/features/insurers/components/UWRulesImportExport';

const fmtCurrency = (n: number | null) => {
    if (n === null || n === undefined) return '';
    return new Intl.NumberFormat('en-AE', { style: 'decimal', maximumFractionDigits: 0 }).format(n);
};

/** Thousand separators (and decimals) for condition values in the table */
const formatConditionNumericDisplay = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '';
  const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat('en-US', {
    useGrouping: true,
    maximumFractionDigits: 20,
  }).format(n);
};

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
  value: string | number | string[] | null;
  sequenceNo?: number;
  logicalOp?: 'AND' | 'OR';
}

interface Props {
  productId?: string;
  productName?: string;
  isEmbedded?: boolean;
}

const quoteActions = [
  { label: 'Quote', value: 'quote' },
  { label: 'No Quote', value: 'no_quote' },
  { label: 'Refer to UW', value: 'referral' },
];

const InsurerUWRulesDesign = ({
  productId: propProductId,
  productName: propProductName,
  isEmbedded = false,
}: Props = {}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const productName = propProductName || searchParams.get('productName') || 'Product';
  const productVersion = searchParams.get('productVersion') || '';
  const productId = propProductId || searchParams.get('productId');
  const [ratingParameters, setRatingParameters] = useState<RatingParameter[]>([]);
  const [quoteOptions] = useState(quoteActions);
  const [rules, setRules] = useState<ApiUWRule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<UWRulesMeta | null>(null);
  const PAGE_SIZE = 10;
  const searchDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ApiUWRule | null>(null);
  const [isAddRuleDialogOpen, setIsAddRuleDialogOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDescription, setNewRuleDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [ruleBuilder, setRuleBuilder] = useState<{
    conditions: LocalCondition[];
    adjustmentType: 'PERCENTAGE' | 'FACTOR' | 'FIXED';
    adjustmentValue: number | null;
    quoteAction: 'quote' | 'no_quote' | 'referral';
    priority: number;
    isActive: boolean;
  }>({
    conditions: [],
    adjustmentType: 'FIXED',
    adjustmentValue: 0,
    quoteAction: 'quote',
    priority: 1,
    isActive: true,
  });
  const [draggedParameter, setDraggedParameter] = useState<string | null>(null);

  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    if (productId) {
      loadRatingParameters(productId);
      loadRules(productId, searchQuery, page);
    }
  }, [productId, searchQuery, page]);

  const loadRatingParameters = async (id: string) => {
    try {
      const data = await getProductRatingParameters(id);

      const defaultParams: RatingParameter[] = [
        {
          id: 'sum_insured',
          label: 'Sum Insured',
          name: 'sum_insured',
          type: 'number',
        },
        {
          id: 'base_premium',
          label: 'Base Premium',
          name: 'base_premium',
          type: 'number',
        },
      ];

      // Merge defaults with fetched data, avoiding duplicates if any
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

  const loadRules = async (id: string, search?: string, pageNum?: number) => {
    try {
      setIsLoading(true);
      const res = await getUWRules(id, { search, page: pageNum ?? page, limit: PAGE_SIZE });
      // Handle both paginated and plain array responses
      if (Array.isArray(res)) {
        setRules(res);
        setMeta(null);
      } else {
        setRules(res.data);
        setMeta(res.meta);
      }
    } catch (error) {
      console.error('Failed to load rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load UW rules. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRule = async () => {
    if (!newRuleName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a rule name.',
        variant: 'destructive',
      });
      return;
    }

    if (!ruleBuilder.conditions || ruleBuilder.conditions.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one condition.',
        variant: 'destructive',
      });
      return;
    }

    if (!ruleBuilder.quoteAction) {
      toast({
        title: 'Validation Error',
        description: 'Please select a quote action.',
        variant: 'destructive',
      });
      return;
    }

    // Ensure sequence numbers are correct and convert values to string for backend
    const conditions = ruleBuilder.conditions.map((c, index) => {
      const isNewCondition = c.id.startsWith('cond-');

      return {
        ...c,
        id: isNewCondition ? undefined : c.id,
        value: String(c.value ?? ''),
        sequenceNo: index + 1,
        logicalOp: c.logicalOp || 'AND',
      };
    });

    const payload: UWRulePayload = {
      name: newRuleName,
      description: newRuleDescription,
      conditions: conditions as UWRuleCondition[],
      adjustmentType: ruleBuilder.adjustmentType,
      adjustmentValue: ruleBuilder.adjustmentValue ?? 0,
      quoteAction: ruleBuilder.quoteAction,
      priority: ruleBuilder.priority ?? 1,
      isActive: ruleBuilder.isActive !== false,
    };

    try {
      setIsLoading(true);
      if (isEditing && selectedRule) {
        await updateUWRule(selectedRule.id, payload);
        toast({
          title: 'Rule Updated',
          description: `${newRuleName} has been updated.`,
        });
      } else {
        if (!productId) {
          toast({
            title: 'Error',
            description: 'Product ID is missing.',
            variant: 'destructive',
          });
          return;
        }
        await createUWRule(productId, payload);
        toast({
          title: 'Rule Created',
          description: `${newRuleName} has been created.`,
        });
      }

      // Reload rules
      if (productId) {
        await loadRules(productId, searchQuery, page);
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to save rule. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRule = async (rule: ApiUWRule) => {
    try {
      setIsLoading(true);
      await deleteUWRule(rule.id);
      toast({
        title: 'Rule Deleted',
        description: `${rule.name} has been deleted.`,
      });

      if (selectedRule?.id === rule.id) {
        setSelectedRule(null);
      }

      if (productId) {
        await loadRules(productId, searchQuery, page);
      }
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

  const handleCloseDialog = () => {
    setIsAddRuleDialogOpen(false);
    setNewRuleName('');
    setNewRuleDescription('');
    setRuleBuilder({
      conditions: [],
      adjustmentType: 'FIXED',
      adjustmentValue: 0,
      quoteAction: 'quote',
      priority: 1,
      isActive: true,
    });
    setSelectedRule(null);
    setIsEditing(false);
  };

  const handleStartEditing = (rule: ApiUWRule) => {
    setSelectedRule(rule);
    setNewRuleName(rule.name);
    setNewRuleDescription(rule.description || '');

    // Map API conditions to local conditions
    const localConditions: LocalCondition[] = rule.conditions.map((c) => {
      const param = ratingParameters.find((p) => p.id === c.parameterId);
      let value: string | number | string[] = c.value;

      // Try to parse number if parameter is number type
      if (param?.type === 'number' && typeof c.value === 'string') {
        const num = parseFloat(c.value);
        if (!isNaN(num)) {
          value = num;
        }
      }

      return {
        id: c.id || `cond-${Math.random().toString(36).substr(2, 9)}`,
        parameterId: c.parameterId,
        operator: c.operator,
        value: value,
        sequenceNo: c.sequenceNo,
        logicalOp: c.logicalOp || 'AND',
      };
    });

    setRuleBuilder({
      conditions: localConditions,
      adjustmentType: rule.adjustmentType || 'FIXED',
      adjustmentValue: rule.adjustmentValue || 0,
      quoteAction: rule.quoteAction || 'quote',
      priority: rule.priority,
      isActive: rule.isActive,
    });
    setIsEditing(true);
    setIsAddRuleDialogOpen(true);
  };

  const handleDragStart = (parameterId: string) => {
    setDraggedParameter(parameterId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropCondition = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedParameter) return;

    const param = ratingParameters.find((p) => p.id === draggedParameter);
    if (!param) return;

    const firstOpt = normalizeOptions(param.options)[0]?.value || '';

    const newCondition: LocalCondition = {
      id: `cond-${Date.now()}`,
      parameterId: draggedParameter,
      operator: param.type === 'number' ? 'greaterThan' : 'equals',
      value: param.type === 'number' ? 0 : firstOpt,
      sequenceNo: (ruleBuilder.conditions?.length || 0) + 1,
      logicalOp: 'AND',
    };

    setRuleBuilder({
      ...ruleBuilder,
      conditions: [...(ruleBuilder.conditions || []), newCondition],
    });
    setDraggedParameter(null);
  };

  const handleUpdateCondition = (conditionId: string, updates: Partial<LocalCondition>) => {
    setRuleBuilder({
      ...ruleBuilder,
      conditions: (ruleBuilder.conditions || []).map((c) =>
        c.id === conditionId ? { ...c, ...updates } : c,
      ),
    });
  };

  const handleRemoveCondition = (conditionId: string) => {
    setRuleBuilder({
      ...ruleBuilder,
      conditions: (ruleBuilder.conditions || []).filter((c) => c.id !== conditionId),
    });
  };

  const getConditionDisplay = (condition: LocalCondition | UWRuleCondition): string => {
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
      : param.type === 'number'
        ? formatConditionNumericDisplay(condition.value as string | number | null)
        : typeof condition.value === 'number'
          ? formatConditionNumericDisplay(condition.value)
          : formatConditionNumericDisplay(condition.value as string) || String(condition.value ?? '');

    return `${param.label} ${
      operatorLabels[condition.operator] || condition.operator
    } ${valueDisplay}`;
  };

  const filteredRules = rules; // search is handled server-side

  return (
    <div className={`flex flex-col ${isEmbedded ? 'h-full' : 'h-screen'} bg-background`}>
      {/* Header */}
      {!isEmbedded && (
        <div className="border-b bg-background px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">UW Rules</h1>
              <p className="text-sm text-muted-foreground">
                {productName} {productVersion ? `v${productVersion}` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col p-6">
        <div className="mb-4 shrink-0">
          {isEmbedded ? (
            <h1 className="text-2xl font-bold tracking-tight text-foreground">UW Rules Design</h1>
          ) : (
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Underwriting rules</h2>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            {productName}
            {productVersion ? ` · v${productVersion}` : ''}
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rules..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                  searchDebounceRef.current = setTimeout(() => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }, 400);
                }}
                className="pl-8 h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <UWRulesImportExport
              productId={productId!}
              productName={productName}
              onImportComplete={() => {
                if (productId) {
                  loadRules(productId, searchQuery, page);
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => {
                setSelectedRule(null);
                setNewRuleName('');
                setNewRuleDescription('');
                setRuleBuilder({
                  conditions: [],
                  adjustmentType: 'FIXED',
                  adjustmentValue: 0,
                  quoteAction: 'quote',
                  priority: 1,
                  isActive: true,
                });
                setIsEditing(false);
                setIsAddRuleDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create New Rule
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto rounded-lg border border-border">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading rules...</span>
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Shield className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium">{searchQuery ? 'No rules match your search.' : 'No underwriting rules configured.'}</p>
              {!searchQuery && <p className="text-sm mt-1">Create a new rule to get started.</p>}
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-8">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rule Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-28">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-64">Conditions</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Adjustment</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-28">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRules.map((rule, idx) => (
                  <tr
                    key={rule.id}
                    className={`hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-muted/10'}`}
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground font-medium">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-[180px]">
                      <div className="truncate" title={rule.name}>{rule.name}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px]">
                      <div className="truncate text-xs" title={rule.description || ''}>{rule.description || <span className="italic">—</span>}</div>
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      <Badge variant="outline" className="text-[10px] bg-muted/50">{rule.priority}</Badge>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <div className="flex flex-wrap gap-1">
                        {rule.conditions.slice(0, 2).map((c, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 gap-1.5 px-1.5">
                            <span className="bg-primary text-primary-foreground rounded px-1 py-0.5 font-bold tracking-wide">
                              {i === 0 ? 'IF' : 'AND'}
                            </span>
                            {getConditionDisplay(c)}
                          </Badge>
                        ))}
                        {rule.conditions.length > 2 && (
                          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">+{rule.conditions.length - 2}</Badge>
                        )}
                        {rule.conditions.length === 0 && <span className="text-xs text-muted-foreground italic">None</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] whitespace-nowrap ${
                          rule.quoteAction === 'quote'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : rule.quoteAction === 'no_quote'
                            ? 'bg-destructive/10 text-destructive border-destructive/20'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}
                      >
                        {rule.quoteAction === 'quote' ? 'Quote' : rule.quoteAction === 'no_quote' ? 'No Quote' : 'Referral'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums">
                      {rule.adjustmentValue !== 0 ? (
                        <Badge variant="outline" className="text-[10px] bg-muted/50">
                          {fmtCurrency(rule.adjustmentValue)}{rule.adjustmentType === 'PERCENTAGE' ? '%' : rule.adjustmentType === 'FACTOR' ? 'x' : ''}
                        </Badge>
                      ) : <span className="text-muted-foreground italic">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${rule.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-muted/50 text-muted-foreground border-border'}`}
                      >
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => { e.stopPropagation(); handleStartEditing(rule); }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            showConfirmDialog(
                              { title: 'Delete Rule', description: `Delete "${rule.name}"? This cannot be undone.`, confirmText: 'Delete', variant: 'destructive' },
                              () => handleDeleteRule(rule),
                            );
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-3 px-1">
            <p className="text-xs text-muted-foreground">
              Page {meta.page} of {meta.totalPages} · {meta.total} rule{meta.total !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
                  ) : (
                    <Button
                      key={p}
                      variant={page === p ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 w-7 p-0 text-xs"
                      onClick={() => setPage(p as number)}
                    >
                      {p}
                    </Button>
                  )
                )}
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
                              {/* Add/Edit Rule Dialog */}
      <Dialog open={isAddRuleDialogOpen} onOpenChange={setIsAddRuleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit UW Rule' : 'Create New UW Rule'}</DialogTitle>
            <DialogDescription>
              Define conditions and actions for underwriting rules.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Rule Name *</Label>
                <Input
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="e.g., High Risk Project Auto-Reject"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newRuleDescription}
                  onChange={(e) => setNewRuleDescription(e.target.value)}
                  placeholder="Rule description (optional)"
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            {/* Rating Parameters */}
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
            </div>

            <Separator />

            {/* Conditions */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Conditions</Label>
                <div
                  className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 min-h-[100px] bg-muted/5 mb-4"
                  onDragOver={handleDragOver}
                  onDrop={handleDropCondition}
                >
                  {ruleBuilder.conditions && ruleBuilder.conditions.length > 0 ? (
                    <div className="space-y-2">
                      {ruleBuilder.conditions.map((condition, index) => {
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
                                  handleUpdateCondition(condition.id as string, {
                                    parameterId: value,
                                    operator: newParam?.type === 'number' ? 'greaterThan' : 'equals',
                                    value: newParam?.type === 'number' ? null : normOpts[0]?.value || '',
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
                                handleUpdateCondition(condition.id as string, {
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
                                onValueChange={(value) =>
                                  handleUpdateCondition(condition.id as string, { value })
                                }
                              >
                                <SelectTrigger className="flex-1">
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
                            ) : param?.type === 'number' ? (
                                <FormattedNumberInput
                                    value={condition.value as number | null}
                                    onChange={(v) => handleUpdateCondition(condition.id as string, { value: v !== undefined && v < 0 ? 0 : v })}
                                    className="flex-1"
                                    placeholder="Value"
                                />
                            ) : (
                              <Input
                                type="text"
                                value={condition.value as string}
                                onChange={(e) =>
                                  handleUpdateCondition(condition.id as string, {
                                    value: e.target.value,
                                  })
                                }
                                className="flex-1"
                                placeholder="Value"
                              />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCondition(condition.id as string)}
                              className="ml-auto text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
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
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold mb-2 block">Actions</Label>
              </div>
              <div className="space-y-2 border rounded p-4 bg-muted/10">
                <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center">
                  <Select
                    value={ruleBuilder.adjustmentType}
                    onValueChange={(v: 'PERCENTAGE' | 'FACTOR' | 'FIXED') => {
                      let adj = ruleBuilder.adjustmentValue;
                      if (adj !== null && adj < 0) adj = 0;
                      if (v === 'PERCENTAGE' && adj !== null && adj > 100) adj = 100;
                      setRuleBuilder({
                        ...ruleBuilder,
                        adjustmentType: v,
                        adjustmentValue: adj,
                      });
                    }}
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
                  <FormattedNumberInput
                    value={ruleBuilder.adjustmentValue}
                    onChange={(v) => {
                      let n = v;
                      if (n !== undefined && n < 0) n = 0;
                      if (ruleBuilder.adjustmentType === 'PERCENTAGE' && n !== undefined && n > 100) n = 100;
                      setRuleBuilder({
                        ...ruleBuilder,
                        adjustmentValue: n,
                      });
                    }}
                    min={ruleBuilder.adjustmentType === 'PERCENTAGE' ? 0 : undefined}
                    max={ruleBuilder.adjustmentType === 'PERCENTAGE' ? 100 : undefined}
                    allowDecimals={ruleBuilder.adjustmentType !== 'PERCENTAGE'}
                    maxDecimals={ruleBuilder.adjustmentType === 'PERCENTAGE' ? 4 : undefined}
                    placeholder={ruleBuilder.adjustmentType === 'PERCENTAGE' ? '0 – 100' : 'Value'}
                    suffix={ruleBuilder.adjustmentType === 'PERCENTAGE' ? '%' : undefined}
                  />
                  <Select
                    value={ruleBuilder.quoteAction}
                    onValueChange={(v: 'quote' | 'no_quote' | 'referral') =>
                      setRuleBuilder({ ...ruleBuilder, quoteAction: v })
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
              </div>
            </div>

            <Separator />

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <FormattedNumberInput
                value={ruleBuilder.priority || 1}
                onChange={(v) =>
                  setRuleBuilder({
                    ...ruleBuilder,
                    priority: v === undefined || v < 1 ? 1 : Math.trunc(v),
                  })
                }
                min={1}
                allowDecimals={false}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Rules with lower priority numbers are evaluated first.
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={ruleBuilder.isActive !== false}
                onCheckedChange={(checked) =>
                  setRuleBuilder({
                    ...ruleBuilder,
                    isActive: checked === true,
                  })
                }
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Rule is active
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                handleCloseDialog();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddRule} disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Update Rule' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </div>
  );
};

export default InsurerUWRulesDesign;


