import { type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ChevronRight,
  Edit,
  FileText,
  LayoutTemplate,
  Loader2,
  Lock,
  LockOpen,
  Plus,
  PlusIcon,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/shared/utils/lib-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/shared/hooks/use-toast';
import {
  createCustomerProfileTemplateCategory,
  deleteCustomerProfileTemplate,
  deleteGeneralTemplate,
  getCustomerProfileTemplateCategories,
  getCustomerProfileTemplates,
  getCustomerProfileTemplatesByCategory,
  getGeneralTemplates,
  type CustomerProfileTemplateCategory,
  type CustomerProfileTemplateListItem,
  type GeneralTemplateListItem,
} from '@/features/product-config/proposal-form/api/proposalFormDesign';

function formatDate(date?: string): string {
  if (!date) return '-';

  try {
    return format(new Date(date), 'dd-MM-yyyy');
  } catch {
    return date;
  }
}

function formatTemplateFieldLabel(value?: string): string {
  if (!value) return '-';

  return value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getCategoryBadgeStyle(category?: string) {
  const normalizedCategory = (category || '').trim().toLowerCase();

  let hash = 0;
  for (let index = 0; index < normalizedCategory.length; index += 1) {
    hash = normalizedCategory.charCodeAt(index) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;

  return {
    backgroundColor: `hsl(${hue} 85% 92%)`,
    color: `hsl(${hue} 55% 32%)`,
    borderColor: `hsl(${hue} 65% 78%)`,
  };
}

const BLANK_TEMPLATE_VALUE = '__blank__';
const BADGE_GAP_PX = 8;
const MORE_BUTTON_WIDTH_PX = 88;

type ExpandableBadgeListProps<T> = {
  items: T[];
  getKey: (item: T, index: number) => string;
  renderBadge: (item: T, index: number) => ReactNode;
  emptyState?: ReactNode;
  className?: string;
};

function ExpandableBadgeList<T>({
  items,
  getKey,
  renderBadge,
  emptyState,
  className,
}: ExpandableBadgeListProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const badgeMeasureRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
  }, [items.length]);

  useLayoutEffect(() => {
    const recalculateVisibleBadges = () => {
      const container = containerRef.current;
      if (!container || items.length === 0 || isExpanded) {
        setVisibleCount(items.length);
        return;
      }

      const badgeWidths = items.map((_, index) => badgeMeasureRefs.current[index]?.offsetWidth || 0);
      if (badgeWidths.some((width) => width === 0)) {
        setVisibleCount(items.length);
        return;
      }

      let consumedWidth = 0;
      let nextVisibleCount = 0;

      for (let index = 0; index < badgeWidths.length; index += 1) {
        const widthWithGap = badgeWidths[index] + (nextVisibleCount > 0 ? BADGE_GAP_PX : 0);
        const remainingItems = items.length - (index + 1);
        const reserveForMoreButton = remainingItems > 0 ? BADGE_GAP_PX + MORE_BUTTON_WIDTH_PX : 0;

        if (consumedWidth + widthWithGap + reserveForMoreButton > container.clientWidth) {
          break;
        }

        consumedWidth += widthWithGap;
        nextVisibleCount += 1;
      }

      setVisibleCount(Math.max(1, nextVisibleCount));
    };

    recalculateVisibleBadges();

    if (!containerRef.current || typeof ResizeObserver === 'undefined') {
      return;
    }

    const resizeObserver = new ResizeObserver(recalculateVisibleBadges);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isExpanded, items]);

  if (items.length === 0) {
    return <>{emptyState}</>;
  }

  const shouldCollapse = !isExpanded && visibleCount < items.length;
  const visibleItems = shouldCollapse ? items.slice(0, visibleCount) : items;
  const hiddenCount = items.length - visibleItems.length;

  return (
    <>
      <div className="fixed left-[-9999px] top-0 -z-10 flex gap-2 opacity-0 pointer-events-none">
        {items.map((item, index) => (
          <div
            key={`measure-${getKey(item, index)}`}
            ref={(element) => {
              badgeMeasureRefs.current[index] = element;
            }}
            className="shrink-0"
          >
            {renderBadge(item, index)}
          </div>
        ))}
      </div>

      <div ref={containerRef} className={cn('flex flex-wrap gap-2', className)}>
        {visibleItems.map((item, index) => (
          <div key={getKey(item, index)} className="shrink-0">
            {renderBadge(item, index)}
          </div>
        ))}
        {shouldCollapse ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-auto rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-primary/5 hover:text-primary"
            onClick={() => setIsExpanded(true)}
          >
            +{hiddenCount} more
          </Button>
        ) : null}
      </div>
    </>
  );
}

const CustomerTemplateManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'customer' | 'general'>('customer');

  const [customerTemplates, setCustomerTemplates] = useState<CustomerProfileTemplateListItem[]>([]);
  const [generalTemplates, setGeneralTemplates] = useState<GeneralTemplateListItem[]>([]);
  const [categories, setCategories] = useState<CustomerProfileTemplateCategory[]>([]);
  const [templatesForSelectedCategory, setTemplatesForSelectedCategory] = useState<
    CustomerProfileTemplateListItem[]
  >([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategoryTemplates, setIsLoadingCategoryTemplates] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [templateTitle, setTemplateTitle] = useState('');
  const [selectedSourceTemplateId, setSelectedSourceTemplateId] = useState(BLANK_TEMPLATE_VALUE);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [customerTemplateToView, setCustomerTemplateToView] =
    useState<CustomerProfileTemplateListItem | null>(null);
  const [generalTemplateToView, setGeneralTemplateToView] =
    useState<GeneralTemplateListItem | null>(null);
  const [customerTemplateToDelete, setCustomerTemplateToDelete] =
    useState<CustomerProfileTemplateListItem | null>(null);
  const [generalTemplateToDelete, setGeneralTemplateToDelete] =
    useState<GeneralTemplateListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [createTemplateErrors, setCreateTemplateErrors] = useState<{
    category?: string;
    sourceTemplate?: string;
    title?: string;
  }>({});

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [customerTemplatesResponse, categoriesResponse, generalTemplatesResponse] =
          await Promise.all([
            getCustomerProfileTemplates(),
            getCustomerProfileTemplateCategories(),
            getGeneralTemplates(),
          ]);

        if (!mounted) return;

        setCustomerTemplates(Array.isArray(customerTemplatesResponse) ? customerTemplatesResponse : []);
        setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : []);
        setGeneralTemplates(Array.isArray(generalTemplatesResponse) ? generalTemplatesResponse : []);
      } catch (error: any) {
        if (!mounted) return;
        toast({
          title: 'Error loading templates',
          description: error.message || 'Failed to load templates',
          variant: 'destructive',
        });
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [toast]);

  useEffect(() => {
    if (categories.length > 0 && !isInitialized) {
      setExpandedCategories([categories[0].id]);
      setIsInitialized(true);
    }
  }, [categories, isInitialized]);

  useEffect(() => {
    if (!isCreateDialogOpen) return;

    if (activeTab === 'general') {
      setTemplatesForSelectedCategory([]);
      if (!selectedSourceTemplateId) {
        setSelectedSourceTemplateId(BLANK_TEMPLATE_VALUE);
      }
      return;
    }

    if (!selectedCategoryId) {
      setTemplatesForSelectedCategory([]);
      setSelectedSourceTemplateId('');
      return;
    }

    let mounted = true;

    const loadTemplatesForCategory = async () => {
      try {
        setIsLoadingCategoryTemplates(true);
        const response = await getCustomerProfileTemplatesByCategory(selectedCategoryId);
        if (!mounted) return;

        const nextTemplates = Array.isArray(response) ? response : [];
        setTemplatesForSelectedCategory(nextTemplates);
        setSelectedSourceTemplateId(nextTemplates.length === 0 ? BLANK_TEMPLATE_VALUE : '');
      } catch (error: any) {
        if (!mounted) return;
        toast({
          title: 'Error loading category templates',
          description: error.message || 'Failed to fetch templates for the selected category',
          variant: 'destructive',
        });
      } finally {
        if (mounted) setIsLoadingCategoryTemplates(false);
      }
    };

    loadTemplatesForCategory();
    return () => {
      mounted = false;
    };
  }, [activeTab, isCreateDialogOpen, selectedCategoryId, toast]);

  const generalTemplateOptions = useMemo(
    () => generalTemplates.filter((template) => template.id !== generalTemplateToDelete?.id),
    [generalTemplateToDelete?.id, generalTemplates],
  );

  const resetCreateDialog = () => {
    setSelectedCategoryId('');
    setTemplateTitle('');
    setSelectedSourceTemplateId(BLANK_TEMPLATE_VALUE);
    setTemplatesForSelectedCategory([]);
    setCreateTemplateErrors({});
    setIsCreateDialogOpen(false);
  };

  const handleCreateTemplate = (tab: 'customer' | 'general') => {
    setActiveTab(tab);
    setCreateTemplateErrors({});
    setSelectedSourceTemplateId(BLANK_TEMPLATE_VALUE);
    setIsCreateDialogOpen(true);
  };

  const handleEditCustomerTemplate = (template: CustomerProfileTemplateListItem) => {
    const params = new URLSearchParams({
      mode: 'customer-template',
      templateId: template.id,
      templateName: template.name,
      customerCategory: template.customerCategory,
    });

    navigate(`/market-admin/customer-template-management/proposal-form-design?${params.toString()}`);
  };

  const handleEditGeneralTemplate = (template: GeneralTemplateListItem) => {
    const params = new URLSearchParams({
      mode: 'general-template',
      templateId: template.id,
      templateName: template.name,
    });

    navigate(`/market-admin/customer-template-management/proposal-form-design?${params.toString()}`);
  };

  const handleContinueToDesigner = () => {
    const trimmedTitle = templateTitle.trim();
    const nextErrors: {
      category?: string;
      sourceTemplate?: string;
      title?: string;
    } = {};

    if (activeTab === 'customer' && !selectedCategoryId) {
      nextErrors.category = 'Category is required.';
    }

    if (!selectedSourceTemplateId) {
      nextErrors.sourceTemplate = 'Template selection is required.';
    }

    if (!trimmedTitle) {
      nextErrors.title = 'Title is required.';
    }

    if (nextErrors.category || nextErrors.sourceTemplate || nextErrors.title) {
      setCreateTemplateErrors(nextErrors);
      toast({
        title: 'Required fields missing',
        description:
          activeTab === 'customer'
            ? 'Please fill in Category, Select Template, and Title before continuing.'
            : 'Please fill in Select Template and Title before continuing.',
        variant: 'destructive',
      });
      return;
    }

    setCreateTemplateErrors({});

    const params = new URLSearchParams({
      mode: activeTab === 'customer' ? 'customer-template' : 'general-template',
      templateName: trimmedTitle,
    });

    if (activeTab === 'customer') {
      params.set('customerCategory', selectedCategoryId);
    }

    if (selectedSourceTemplateId && selectedSourceTemplateId !== BLANK_TEMPLATE_VALUE) {
      params.set('sourceTemplateId', selectedSourceTemplateId);
    }

    setIsCreateDialogOpen(false);
    navigate(`/market-admin/customer-template-management/proposal-form-design?${params.toString()}`);
  };

  const handleCreateCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      toast({
        title: 'Category name required',
        description: 'Please enter a category name.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreatingCategory(true);
      const createdCategory = await createCustomerProfileTemplateCategory({ name: trimmedName });

      setCategories((current) => {
        const next = [...current, createdCategory];
        next.sort((a, b) => a.name.localeCompare(b.name));
        return next;
      });
      setExpandedCategories((current) => Array.from(new Set([...current, createdCategory.id])));
      setSelectedCategoryId(createdCategory.id);
      setNewCategoryName('');
      setIsCategoryDialogOpen(false);
      toast({
        title: 'Category created',
        description: `${createdCategory.name} has been created successfully.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error creating category',
        description: error.message || 'Failed to create category',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleDeleteCustomerTemplate = async () => {
    if (!customerTemplateToDelete) return;

    try {
      setIsDeleting(customerTemplateToDelete.id);
      await deleteCustomerProfileTemplate(customerTemplateToDelete.id);
      setCustomerTemplates((current) =>
        current.filter((template) => template.id !== customerTemplateToDelete.id),
      );
      setTemplatesForSelectedCategory((current) =>
        current.filter((template) => template.id !== customerTemplateToDelete.id),
      );
      toast({
        title: 'Template deleted',
        description: `${customerTemplateToDelete.name} has been deleted successfully.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting template',
        description: error.message || 'Failed to delete customer template',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
      setCustomerTemplateToDelete(null);
    }
  };

  const handleDeleteGeneralTemplate = async () => {
    if (!generalTemplateToDelete) return;

    try {
      setIsDeleting(generalTemplateToDelete.id);
      await deleteGeneralTemplate(generalTemplateToDelete.id);
      setGeneralTemplates((current) =>
        current.filter((template) => template.id !== generalTemplateToDelete.id),
      );
      toast({
        title: 'Template deleted',
        description: `${generalTemplateToDelete.name} has been deleted successfully.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting template',
        description: error.message || 'Failed to delete general template',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
      setGeneralTemplateToDelete(null);
    }
  };

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-auto p-6">
          <div className="w-full">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Template Management</h1>
                <p className="mt-1 text-muted-foreground">
                  Manage customer templates and reusable general templates.
                </p>
              </div>
              <Button
                onClick={() => handleCreateTemplate(activeTab)}
                className="h-10 gap-2 font-bold shadow-sm"
              >
                <Plus className="h-4 w-4" />
                {activeTab === 'customer' ? 'Create Customer Template' : 'Create General Template'}
              </Button>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'customer' | 'general')}
              className="space-y-6"
            >
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-primary/5 p-1">
                <TabsTrigger value="customer">Customer Template</TabsTrigger>
                <TabsTrigger value="general">General Template</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-5">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : generalTemplates.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      No general templates found. Create a general template to get started.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-5">
                    {generalTemplates.map((template) => (
                      <Card key={template.id} className="border-border/50 shadow-sm">
                        <CardContent className="p-7">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="rounded-lg bg-primary/10 p-3 text-primary">
                                    <LayoutTemplate className="h-5 w-5" />
                                  </span>
                                  <div className="min-w-0">
                                    <h3 className="text-base font-bold text-foreground">
                                      {template.name}
                                    </h3>
                                    {template.updatedAt ? (
                                      <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                                        Updated {formatDate(template.updatedAt)}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                              {template.description ? (
                                <p className="mb-3 text-sm text-muted-foreground">
                                  {template.description}
                                </p>
                              ) : null}
                              {template.fields?.length ? (
                                <ExpandableBadgeList
                                  items={template.fields}
                                  getKey={(field, index) => `${template.id}-${field.name}-${index}`}
                                  renderBadge={(field) => (
                                    <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-xs font-semibold text-muted-foreground">
                                      <span>{formatTemplateFieldLabel(field.name)}</span>
                                    </div>
                                  )}
                                />
                              ) : (
                                <p className="text-sm italic text-muted-foreground">
                                  No fields configured.
                                </p>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-full border-primary/20 text-xs font-bold hover:bg-primary/5 hover:text-primary"
                                onClick={() => handleEditGeneralTemplate(template)}
                              >
                                <Edit className="mr-2 h-3.5 w-3.5" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-full border-red-200 text-xs font-bold text-red-600 hover:bg-red-500/10 hover:text-red-700"
                                disabled={isDeleting === template.id}
                                onClick={() => setGeneralTemplateToDelete(template)}
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="customer" className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : categories.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      No categories found. Create a category to get started.
                    </CardContent>
                  </Card>
                ) : (
                  <Accordion
                    type="multiple"
                    value={expandedCategories}
                    onValueChange={setExpandedCategories}
                    className="w-full space-y-4"
                  >
                    {categories.map((category) => {
                      const categoryTemplates = customerTemplates.filter(
                        (template) => template.customerCategory === category.id,
                      );
                      const isExpanded = expandedCategories.includes(category.id);

                      return (
                        <AccordionItem
                          key={category.id}
                          value={category.id}
                          className="rounded-xl border border-border/50 bg-card/40 shadow-sm transition-all duration-200 data-[state=open]:bg-card"
                        >
                          <AccordionTrigger className="px-6 py-4 transition-all hover:bg-muted/50 hover:no-underline data-[state=open]:rounded-t-xl">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <div
                                className={cn(
                                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform',
                                  isExpanded && 'scale-110',
                                )}
                              >
                                <FileText className="h-4 w-4" />
                              </div>
                              <span className="text-lg font-bold tracking-tight">
                                {category.name}
                              </span>
                              <span className="ml-auto mr-2 shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                {categoryTemplates.length}{' '}
                                {categoryTemplates.length === 1 ? 'Template' : 'Templates'}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="border-t border-border/40 px-5 py-5">
                            {categoryTemplates.length > 0 ? (
                              <div className="space-y-4">
                                {categoryTemplates.map((template) => (
                                  <div
                                    key={template.id}
                                    className="rounded-xl border border-border/40 bg-muted/25 p-6 shadow-sm transition-colors hover:bg-muted/45"
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="min-w-0 flex-1">
                                        <div className="mb-3 flex flex-wrap items-center gap-2">
                                          <h3 className="text-base font-bold text-foreground">
                                            {template.name}
                                          </h3>
                                          <Badge
                                            variant="outline"
                                            className="rounded-full border text-[10px] font-bold uppercase tracking-wider"
                                            style={getCategoryBadgeStyle(category.name)}
                                          >
                                            {category.name}
                                          </Badge>
                                          {template.createdAt ? (
                                            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                                              Updated {formatDate(template.createdAt)}
                                            </span>
                                          ) : null}
                                        </div>
                                        {template.fields?.length ? (
                                          <ExpandableBadgeList
                                            items={template.fields}
                                            getKey={(field, index) =>
                                              `${template.id}-${field.name}-${index}`
                                            }
                                            renderBadge={(field) => (
                                              <div className="inline-flex cursor-default items-center gap-2 rounded-full border border-border/60 bg-muted/20 px-3 py-1 text-xs font-semibold text-muted-foreground">
                                                {field.isLocked ? (
                                                  <Lock className="h-3 w-3 text-amber-600" />
                                                ) : (
                                                  <LockOpen className="h-3 w-3 text-emerald-600" />
                                                )}
                                                <span>{formatTemplateFieldLabel(field.name)}</span>
                                              </div>
                                            )}
                                          />
                                        ) : (
                                          <p className="text-sm italic text-muted-foreground">
                                            No fields configured.
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex shrink-0 items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 rounded-full border-primary/20 text-xs font-bold hover:bg-primary/5 hover:text-primary"
                                          onClick={() => handleEditCustomerTemplate(template)}
                                        >
                                          <Edit className="mr-2 h-3.5 w-3.5" />
                                          Edit
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 rounded-full border-red-200 text-xs font-bold text-red-600 hover:bg-red-500/10 hover:text-red-700"
                                          disabled={isDeleting === template.id}
                                          onClick={() => setCustomerTemplateToDelete(template)}
                                        >
                                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                                          Delete
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center rounded-xl bg-muted/10 px-6 py-12 text-center">
                                <div className="mb-4 rounded-full bg-muted p-4">
                                  <FileText className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                                <p className="max-w-[200px] text-sm font-medium text-muted-foreground">
                                  No customer templates found for this category.
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCategoryId(category.id);
                                    handleCreateTemplate('customer');
                                  }}
                                  className="mt-4 font-bold text-primary"
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Create First Template
                                </Button>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetCreateDialog();
            return;
          }
          setIsCreateDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'customer' ? 'Create Customer Template' : 'Create General Template'}
            </DialogTitle>
            <DialogDescription>
              Enter the mandatory fields before opening the designer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {activeTab === 'customer' ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category-select">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Button variant="default" size="sm" onClick={() => setIsCategoryDialogOpen(true)}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create Category
                  </Button>
                </div>
                <Select
                  value={selectedCategoryId}
                  onValueChange={(value) => {
                    setSelectedCategoryId(value);
                    setCreateTemplateErrors((current) => ({ ...current, category: undefined }));
                  }}
                >
                  <SelectTrigger
                    id="category-select"
                    className={createTemplateErrors.category ? 'border-destructive focus:ring-destructive' : ''}
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createTemplateErrors.category ? (
                  <p className="text-sm text-destructive">{createTemplateErrors.category}</p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-1">
              <Label htmlFor="template-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="template-title"
                value={templateTitle}
                onChange={(event) => {
                  setTemplateTitle(event.target.value);
                  setCreateTemplateErrors((current) => ({ ...current, title: undefined }));
                }}
                placeholder="Enter template title"
                className={createTemplateErrors.title ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {createTemplateErrors.title ? (
                <p className="text-sm text-destructive">{createTemplateErrors.title}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="source-template-select">
                Select Template <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedSourceTemplateId}
                onValueChange={(value) => {
                  setSelectedSourceTemplateId(value);
                  setCreateTemplateErrors((current) => ({
                    ...current,
                    sourceTemplate: undefined,
                  }));
                }}
                disabled={activeTab === 'customer' && (!selectedCategoryId || isLoadingCategoryTemplates)}
              >
                <SelectTrigger
                  id="source-template-select"
                  className={createTemplateErrors.sourceTemplate ? 'border-destructive focus:ring-destructive' : ''}
                >
                  <SelectValue placeholder="Select Template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BLANK_TEMPLATE_VALUE}>Blank Template</SelectItem>
                  {(activeTab === 'customer' ? templatesForSelectedCategory : generalTemplateOptions).map(
                    (template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              {createTemplateErrors.sourceTemplate ? (
                <p className="text-sm text-destructive">{createTemplateErrors.sourceTemplate}</p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetCreateDialog}>
              Cancel
            </Button>
            <Button onClick={handleContinueToDesigner}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
            <DialogDescription>Create a new customer template category.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="new-category-name">Category Name</Label>
            <Input
              id="new-category-name"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="Enter category name"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory} disabled={isCreatingCategory}>
              {isCreatingCategory ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!customerTemplateToView} onOpenChange={(open) => !open && setCustomerTemplateToView(null)}>
        <DialogContent showClose={false} className="max-w-4xl border-primary/10 bg-background p-0">
          <DialogHeader className="border-b bg-primary/5 p-6">
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-primary/10 p-2 text-primary">
                <FileText className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <DialogTitle className="text-xl">
                  {customerTemplateToView?.name || 'Template Details'}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Review the fields configured for this customer template.
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto p-6">
            {customerTemplateToView?.fields?.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {customerTemplateToView.fields.map((field, index) => (
                  <div
                    key={`${customerTemplateToView.id}-${field.name}-${index}`}
                    className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {formatTemplateFieldLabel(field.name)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Field Type: {formatTemplateFieldLabel(field.type)}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                          field.isLocked ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
                        )}
                      >
                        {field.isLocked ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
                        {field.isLocked ? 'Locked' : 'Unlocked'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
                No fields configured for this template.
              </div>
            )}
          </div>
          <DialogFooter className="px-6 py-4">
            <Button variant="outline" onClick={() => setCustomerTemplateToView(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!generalTemplateToView} onOpenChange={(open) => !open && setGeneralTemplateToView(null)}>
        <DialogContent showClose={false} className="max-w-4xl border-primary/10 bg-background p-0">
          <DialogHeader className="border-b bg-primary/5 p-6">
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-primary/10 p-2 text-primary">
                <LayoutTemplate className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <DialogTitle className="text-xl">
                  {generalTemplateToView?.name || 'Template Details'}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Review the fields configured for this general template.
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto p-6">
            {generalTemplateToView?.fields?.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {generalTemplateToView.fields.map((field, index) => (
                  <div
                    key={`${generalTemplateToView.id}-${field.name}-${index}`}
                    className="rounded-xl border border-border/70 bg-card p-4 shadow-sm"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {formatTemplateFieldLabel(field.name)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Field Type: {formatTemplateFieldLabel(field.type)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
                No fields configured for this template.
              </div>
            )}
          </div>
          <DialogFooter className="px-6 py-4">
            <Button variant="outline" onClick={() => setGeneralTemplateToView(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!customerTemplateToDelete}
        onOpenChange={(open) => !open && setCustomerTemplateToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              {customerTemplateToDelete
                ? `This will permanently delete ${customerTemplateToDelete.name}. This action cannot be undone.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomerTemplate}
              disabled={!!isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!generalTemplateToDelete}
        onOpenChange={(open) => !open && setGeneralTemplateToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              {generalTemplateToDelete
                ? `This will permanently delete ${generalTemplateToDelete.name}. This action cannot be undone.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGeneralTemplate}
              disabled={!!isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CustomerTemplateManagement;
