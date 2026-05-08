import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  Save,
  FileText,
  Settings,
  Shield,
  BarChart3,
  CheckCircle2,
  Key,
  BadgePercent,
  Building2,
  Bell,
  Edit,
  Database,
  Network,
  TrendingUp,
  Target,
  ShoppingCart,
  MapPin,
  Plus,
  Upload,
  Folder,
  Clock,
  X,
  Trash2,
  ShieldIcon,
  GripVertical,
  LayoutTemplate,
  Loader2,
  ChevronRight,
  Lock,
  Download,
} from 'lucide-react';
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
import { useToast } from '@/shared/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { cn } from '@/shared/utils/lib-utils';
import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';
import {
  createProduct,
  updateProduct,
  getProduct,
  getProducts,
  deleteCover,
  type Product,
  type InsuranceProduct,
  type ProductCategory,
  type ProductOwner,
  type ProductSection,
} from '@/features/product-config/api/products';
import {
  type ProductStructureMode,
  type UiProductStructureSection,
  mapProductToUiStructure,
  buildSectionsPayloadFromUi,
  uiModeToBackendProductType,
  createDefaultSingleCoverStructure,
  inferStructureModeFromSections,
} from '@/features/product-config/utils/productMapping';
import { getRatingFormulas } from '@/features/product-config/pricing/api/ratings';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { deriveProductCode } from '@/shared/utils/common-methods';
import { useAccessMatrix } from '@/shared/hooks/useAccessMatrix';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import GeographicCoverage from '@/components/shared/GeographicCoverage';
import {
  listMasterCountries,
  listMasterRegions,
  listMasterZones,
  getCurrencyMasterOptions,
  getProductCategoryMasterOptions,
  type Country,
  type Region,
  type Zone,
  type CurrencyOption,
  type ProductCategoryOption,
} from '@/features/product-config/masters/api/masters';
import { ENV_CHECKS } from '@/config/env-constants';
import { ENV } from '@/config/env';
import { useRiskCategorisations } from '@/features/market-admin/risk-categorisation/api/riskCategorisation';
import { getInsurerCompanyId } from '@/lib/auth';
import {
  getCustomerProfileTemplateCategories,
  getCustomerProfileTemplates,
  getCustomerProfileTemplatesByCategory,
  type CustomerProfileTemplateCategory,
  type CustomerProfileTemplateListItem,
} from '@/features/product-config/proposal-form/api/proposalFormDesign';

function normalizeToSingleCoverSections(
  prev: UiProductStructureSection[],
): UiProductStructureSection[] {
  if (prev.length === 0) return createDefaultSingleCoverStructure();
  const first = prev[0];
  const c0 = first.covers[0];
  if (!c0) {
    const templateCover = createDefaultSingleCoverStructure()[0].covers[0];
    return [
      {
        ...first,
        covers: [{ ...templateCover, id: `cover-${Date.now()}` }],
      },
    ];
  }
  return [{ ...first, covers: [{ ...c0 }] }];
}

function cloneProductStructureSections(
  sections: UiProductStructureSection[],
): UiProductStructureSection[] {
  try {
    return structuredClone(sections);
  } catch {
    return JSON.parse(JSON.stringify(sections)) as UiProductStructureSection[];
  }
}

const PRODUCT_VALIDITY_UNITS = ['days', 'months', 'years'] as const;

interface SortableCoverRowProps {
  id: string;
  disabled: boolean;
  children: (attributes: any, listeners: any) => React.ReactNode;
}

const SortableCoverRow = ({ id, disabled, children }: SortableCoverRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as React.CSSProperties['position'],
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children(attributes, listeners)}
    </div>
  );
};

const normalizeCustomerTemplateCategory = (value?: string | null): string => {
  if (!value) return '';

  const categoryMap: Record<string, string> = {
    INDIVIDUAL: 'Individual',
    CORPORATE: 'Corporate',
    GOVERNMENT: 'Government',
    Individual: 'Individual',
    Corporate: 'Corporate',
    Government: 'Government',
  };

  return categoryMap[value] || value;
};

const resolveCustomerTemplateCategoryId = (
  value: string | undefined | null,
  categories: CustomerProfileTemplateCategory[],
): string => {
  const normalizedValue = normalizeCustomerTemplateCategory(value);
  if (!normalizedValue) return categories[0]?.id || '';

  const matchedCategory = categories.find(
    (category) =>
      category.id === normalizedValue ||
      category.name.toLowerCase() === normalizedValue.toLowerCase(),
  );

  return matchedCategory?.id || normalizedValue;
};

const formatTemplateFieldName = (value?: string): string => {
  if (!value) return '';

  return value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const createProductSchema = z
  .object({
    productName: z.string().nonempty('Product Name is required'),
    category: z.string().nonempty('Category is required'),
    currency: z.string().optional(),
    owner: z.string().nonempty('Owner is required'),
    description: z.string().optional(),
    productCode: z.string().optional(),
    validityStartDate: z.date({
      required_error: 'Validity Start Date is required.',
    }),
    validityEndDate: z.date({
      required_error: 'Validity End Date is required.',
    }),
    validityPeriod: z.coerce.number().min(1, 'Quote Coverage duration must be at least 1'),
    validityPeriodUnit: z.enum(PRODUCT_VALIDITY_UNITS),
    policyValidityPeriod: z.coerce.number().min(1, 'Policy Duration must be at least 1'),
    policyValidityPeriodUnit: z.enum(PRODUCT_VALIDITY_UNITS),
    autoActivation: z.boolean().default(true),
    cartLikeCoverSelection: z.boolean().default(false),
    countries: z.array(z.string()).min(1, 'At least one country is required'),
    regions: z.array(z.string()).min(1, 'At least one region is required'),
    zones: z.array(z.string()).min(1, 'At least one zone is required'),
  })
  .refine(
    (data) => {
      if (data.validityStartDate && data.validityEndDate) {
        return data.validityEndDate >= data.validityStartDate;
      }
      return true;
    },
    {
      message: 'Validity End Date must be after or equal to Validity Start Date',
      path: ['validityEndDate'],
    },
  );

type CreateProductForm = z.infer<typeof createProductSchema>;

const CreateProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  // Check if we're in edit mode from URL params
  const isEditMode = searchParams.get('edit') === 'true';
  const productIdFromUrl = searchParams.get('productId');
  const productNameFromUrl = searchParams.get('productName');
  const productCategoryFromUrl = searchParams.get('category');
  const productOwnerFromUrl = searchParams.get('owner');
  const [isLoading, setIsLoading] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(productIdFromUrl || null);
  const [currentProductOrgId, setCurrentProductOrgId] = useState<string>('');
  const [openStartDate, setOpenStartDate] = useState(false);
  const [openEndDate, setOpenEndDate] = useState(false);
  const [isCustomerTemplateDialogOpen, setIsCustomerTemplateDialogOpen] = useState(false);
  const [customerTemplateCategories, setCustomerTemplateCategories] = useState<
    CustomerProfileTemplateCategory[]
  >([]);
  const [selectedCustomerTemplateCategory, setSelectedCustomerTemplateCategory] =
    useState<string>('');
  const [selectedCustomerTemplateId, setSelectedCustomerTemplateId] = useState<string | null>(null);
  const [selectedCustomerTemplateName, setSelectedCustomerTemplateName] = useState<string>('');
  const [initialCustomerTemplateId, setInitialCustomerTemplateId] = useState<string | null>(null);
  const [initialCustomerTemplateCategory, setInitialCustomerTemplateCategory] =
    useState<string>('');
  const [selectedCustomerTemplateForDialog, setSelectedCustomerTemplateForDialog] =
    useState<CustomerProfileTemplateListItem | null>(null);
  const [customerTemplates, setCustomerTemplates] = useState<CustomerProfileTemplateListItem[]>([]);
  const [isCustomerTemplatesLoading, setIsCustomerTemplatesLoading] = useState(false);
  const customerTemplateCategoryMap = useMemo(
    () =>
      customerTemplateCategories.reduce<Record<string, string>>((acc, category) => {
        acc[category.id] = category.name;
        return acc;
      }, {}),
    [customerTemplateCategories],
  );

  const form = useForm<CreateProductForm>({
    resolver: zodResolver(createProductSchema),
    mode: 'onSubmit',
    defaultValues: {
      productName: productNameFromUrl || '',
      category: (productCategoryFromUrl as ProductCategory) || '',
      currency: 'AED',
      owner: (productOwnerFromUrl as ProductOwner) || '',
      description: '',
      productCode: '',
      validityStartDate: new Date(),
      validityEndDate: undefined,
      validityPeriod: 30,
      validityPeriodUnit: 'days',
      policyValidityPeriod: 365,
      policyValidityPeriodUnit: 'days',
      autoActivation: true,
      cartLikeCoverSelection: false,
      countries: [],
      regions: [],
      zones: [],
    },
  });
  const access = useAccessMatrix('marketAdmin');
  const isProductAuthorityAllowed = access.hasPermission('productAuthorityMatrix');
  const isMastersManagementAllowed = access.hasPermission('mastersManagement');
  const isProposalFormDesignAllowed = access.hasPermission('proposalFormDesign');
  const isAdditionalInformationDesignAllowed = access.hasPermission('additionalInformationDesign');
  const isRatingConfigDesignAllowed = access.hasPermission('ratingConfigDesign');
  const isDocumentDesignAllowed = access.hasPermission('documentDesign');

  const isUwRulesDesignAllowed = access.hasPermission('uwRulesDesign');
  const isReinsuranceSetupAllowed = access.hasPermission('reinsuranceSetup');
  const isCoverReinsuranceSetupAllowed = access.hasPermission('coverreinsurancesetup');

  const [hasNameEdited, setHasNameEdited] = useState(!isEditMode);
  const watchedName = form.watch('productName');
  const watchedStartDate = form.watch('validityStartDate');
  useEffect(() => {
    if (hasNameEdited) {
      form.setValue('productCode', deriveProductCode(watchedName || ''), {
        shouldDirty: true,
      });
    }
  }, [watchedName, hasNameEdited, form]);

  // Load product data if in edit mode
  useEffect(() => {
    const loadProduct = async () => {
      if (isEditMode && productIdFromUrl) {
        try {
          setIsLoading(true);
          const product = await getProduct(productIdFromUrl);
          const customerProfileTemplateId =
            (product as any).customerProfileTemplateId ?? (product as any).templateId;
          const customerCategory =
            (product as any).customerCategory ?? (product as any).templateCategory;
          let resolvedTemplateName =
            (product as any).templateName ??
            (product as any).customerTemplateName ??
            (product as any).template?.name;

          if (customerProfileTemplateId) {
            try {
              const customerTemplates = await getCustomerProfileTemplates();
              const matchedTemplate = customerTemplates.find(
                (template) => template.id === customerProfileTemplateId,
              );

              if (matchedTemplate) {
                resolvedTemplateName = matchedTemplate.name;
              }
            } catch {
              // Keep edit form usable even if template lookup fails.
            }
          }

          setCurrentProductId(product.id);
          if (product.organizationId) setCurrentProductOrgId(product.organizationId);

          // Restore product type and sections/covers from API
          let coverIdsWithFormula = new Set<string>();
          try {
            const formulas = await getRatingFormulas(product.id);
            coverIdsWithFormula = new Set(
              formulas.filter((f) => f.name === 'PREMIUM' && f.coverId).map((f) => f.coverId!),
            );
          } catch {
            // ignore — ratingStructureDone will just show as pending
          }
          let { mode: apiMode, sections: loadedSections } = mapProductToUiStructure(product, {
            coverIdsWithFormula,
          });
          if (apiMode === 'single' && loadedSections.length === 0) {
            loadedSections = createDefaultSingleCoverStructure();
          }
          const uiMode = inferStructureModeFromSections(loadedSections);
          setProductStructureMode(uiMode);
          setProductStructureSections(loadedSections);
          if (uiMode === 'multi') {
            multiCoverSectionsBackupRef.current = cloneProductStructureSections(loadedSections);
          } else {
            multiCoverSectionsBackupRef.current = null;
          }
          const toIdArray = (v: any): string[] =>
            Array.isArray(v)
              ? v
                  .map((x) =>
                    String(
                      typeof x === 'object'
                        ? (x?.id ?? x?.value ?? x?.name ?? x?.label ?? '')
                        : (x ?? ''),
                    ),
                  )
                  .filter((s) => s.length > 0)
              : [];
          const toLabelArray = (v: any): string[] =>
            Array.isArray(v)
              ? v
                  .map((x) =>
                    String(
                      typeof x === 'object' ? (x?.label ?? x?.name ?? x?.value ?? '') : (x ?? ''),
                    ),
                  )
                  .filter((s) => s.length > 0)
              : [];
          const normalizeDurationValue = (value: unknown, fallback = 30) => {
            const parsed = Number(value);
            return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
          };
          const normalizeDurationUnit = (value: unknown) =>
            PRODUCT_VALIDITY_UNITS.includes(value as (typeof PRODUCT_VALIDITY_UNITS)[number])
              ? (value as (typeof PRODUCT_VALIDITY_UNITS)[number])
              : 'days';
          setPendingCoverage({
            countryIds: toIdArray(
              (product as any).operatingCountries ??
                (product as any).operatingCountryIds ??
                (product as any).countryIds,
            ),
            regionIds: toIdArray(
              (product as any).operatingRegions ??
                (product as any).operatingRegionIds ??
                (product as any).regionIds,
            ),
            zoneIds: toIdArray(
              (product as any).operatingZones ??
                (product as any).operatingZoneIds ??
                (product as any).zoneIds,
            ),
            countryLabels: toLabelArray(
              (product as any).operatingCountriesLabels ??
                (product as any).operatingCountries ??
                (product as any).countryNames,
            ),
            regionLabels: toLabelArray(
              (product as any).operatingRegionsLabels ??
                (product as any).operatingRegions ??
                (product as any).regionNames,
            ),
            zoneLabels: toLabelArray(
              (product as any).operatingZonesLabels ??
                (product as any).operatingZones ??
                (product as any).zoneNames,
            ),
          });
          // Store product data for deferred form reset (waits for masters to load)
          const pendingData = {
            productName: product.name,
            category: product.category,
            currency: product.currency,
            owner: product.owner,
            description: product.description || '',
            productCode: product.code || '',
            validityStartDate: product.validityStartDate
              ? new Date(product.validityStartDate)
              : undefined,
            validityEndDate: product.validityEndDate
              ? new Date(product.validityEndDate)
              : undefined,
            validityPeriod: normalizeDurationValue(
              (product as any).validityPeriod ?? (product as any).validity_period,
            ),
            validityPeriodUnit: normalizeDurationUnit(
              (product as any).validityPeriodUnit ?? (product as any).validity_period_unit,
            ),
            policyValidityPeriod: normalizeDurationValue(
              (product as any).policyValidityPeriod ?? (product as any).policy_validity_period,
            ),
            policyValidityPeriodUnit: normalizeDurationUnit(
              (product as any).policyValidityPeriodUnit ??
                (product as any).policy_validity_period_unit,
            ),
            autoActivation: product.autoActivation ?? true,
            cartLikeCoverSelection:
              product.cartLikeCoverSelection ?? (product as any).cart_like_cover_selection ?? false,
            customerProfileTemplateId,
            customerCategory,
            templateName: resolvedTemplateName,
          };
          setPendingProductData(pendingData);
          setIsBasicInfoSaved(true);
        } catch (err: unknown) {
          const error = err as { status?: number; message?: string };
          // If 404 or network error, use URL params as fallback (for development)
          if (error.status === 404 || error.status === 0 || error.message?.includes('Network')) {
            if (productNameFromUrl) {
              let inferredCategory: ProductCategory | '' = '';
              let inferredOwner: ProductOwner | '' = '';

              if (
                productNameFromUrl.includes('Contractors All Risk') ||
                productNameFromUrl.includes('CAR')
              ) {
                inferredCategory = 'ENGINEERING';
                inferredOwner = 'insurer';
              } else if (
                productNameFromUrl.includes('Professional Indemnity') ||
                productNameFromUrl.includes('PI')
              ) {
                inferredCategory = 'LIABILITY';
                inferredOwner = 'broker';
              } else if (
                productNameFromUrl.includes('Directors & Officers') ||
                productNameFromUrl.includes('D&O')
              ) {
                inferredCategory = 'LIABILITY';
                inferredOwner = 'insurer';
              }

              form.reset({
                productName: productNameFromUrl,
                category: inferredCategory,
                currency: 'AED',
                owner: inferredOwner,
                validityPeriod: 30,
                validityPeriodUnit: 'days',
                policyValidityPeriod: 30,
                policyValidityPeriodUnit: 'days',
              });
              setIsBasicInfoSaved(true);
            }
            // Don't show error toast for 404/network errors in development
            if (!ENV_CHECKS.isLocal(ENV.APP_ENV)) {
              // Product not found in API, using URL params as fallback
            }
          } else {
            // Show error for other types of errors
            toast({
              title: 'Error',
              description: error.message || 'Failed to load product',
              variant: 'destructive',
            });
          }
        } finally {
          setIsLoading(false);
        }
      } else if (isEditMode && productNameFromUrl) {
        // Fallback: if no productId but have name/version, use them and assume saved

        form.reset({
          productName: productNameFromUrl,
          category: (productCategoryFromUrl as ProductCategory) || '',
          currency: 'AED',
          owner: (productOwnerFromUrl as ProductOwner) || '',
          description: '',
          productCode: '',
          validityStartDate: undefined,
          validityEndDate: undefined,
          validityPeriod: 30,
          validityPeriodUnit: 'days',
          policyValidityPeriod: 30,
          policyValidityPeriodUnit: 'days',
          autoActivation: true,
          cartLikeCoverSelection: false,
        });
        setIsBasicInfoSaved(true);
      }
    };
    loadProduct();
  }, [isEditMode, productIdFromUrl, productNameFromUrl, toast]);

  // Fallback hardcoded values (used if API fails)
  const fallbackCategories = [
    { value: 'CASUALTY', label: 'Casualty' },
    { value: 'ENGINEERING', label: 'Engineering' },
    { value: 'GENERAL_ACCIDENT', label: 'General Accident' },
    { value: 'GROUP_LIFE', label: 'Group Life' },
    { value: 'LIABILITY', label: 'Liability' },
    { value: 'MARINE_CARGO', label: 'Marine Cargo' },
    { value: 'MARINE_HULL', label: 'Marine Hull' },
    { value: 'MEDICAL', label: 'Medical' },
    { value: 'MOTOR', label: 'Motor' },
    { value: 'PROPERTY', label: 'Property' },
    { value: 'WORKMENS_COMPENSATION', label: "Workmen's Compensation (WC)" },
  ];

  const fallbackCurrencies = [
    { value: 'AED', label: 'AED - UAE Dirham' },
    { value: 'SAR', label: 'SAR - Saudi Riyal' },
    { value: 'KWD', label: 'KWD - Kuwaiti Dinar' },
    { value: 'BHD', label: 'BHD - Bahraini Dinar' },
    { value: 'OMR', label: 'OMR - Omani Rial' },
    { value: 'QAR', label: 'QAR - Qatari Riyal' },
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'INR', label: 'INR - Indian Rupee' },
  ];

  const owners = [
    { value: 'insurer', label: 'Insurer' },
    { value: 'reinsurer', label: 'Reinsurer' },
    { value: 'broker', label: 'Broker' },
  ];

  const [isBasicInfoSaved, setIsBasicInfoSaved] = useState(false);
  const [coversDirty, setCoversDirty] = useState(false);
  const isSavingRef = useRef(false);
  const syncGeographicFormField = (
    field: 'countries' | 'regions' | 'zones',
    ids: string[],
  ) => {
    form.setValue(field, ids, {
      shouldDirty: true,
      shouldValidate: false,
    });

    if (ids.length > 0) {
      form.clearErrors(field);
    } else if (form.formState.isSubmitted) {
      void form.trigger(field);
    }
  };
  
  // Helper function to set coversDirty only when not saving
  const markCoversDirty = () => {
    if (!isSavingRef.current) {
      setCoversDirty(true);
    }
  };
  
  const [mastersLoading, setMastersLoading] = useState(false);
  const [mastersError, setMastersError] = useState<string | null>(null);

  // Geographic masters
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);

  // Global masters
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<ProductCategoryOption[]>([]);

  // Pending product data for deferred form reset (waits for masters to load)
  const [pendingProductData, setPendingProductData] = useState<{
    productName: string;
    category: string;
    currency?: string;
    owner: string;
    description?: string;
    productCode?: string;
    validityStartDate?: Date;
    validityEndDate?: Date;
    validityPeriod?: number;
    validityPeriodUnit?: (typeof PRODUCT_VALIDITY_UNITS)[number];
    policyValidityPeriod?: number;
    policyValidityPeriodUnit?: (typeof PRODUCT_VALIDITY_UNITS)[number];
    autoActivation?: boolean;
    cartLikeCoverSelection?: boolean;
    customerProfileTemplateId?: string;
    customerCategory?: string;
    templateName?: string;
  } | null>(null);

  // Derived lists
  const categories = categoryOptions.length > 0 ? categoryOptions : fallbackCategories;
  const currencies = currencyOptions.length > 0 ? currencyOptions : fallbackCurrencies;

  const [selectedCountryIds, setSelectedCountryIds] = useState<string[]>([]);
  const [selectedRegionIds, setSelectedRegionIds] = useState<string[]>([]);
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);

  // Track initial geographic coverage for edit mode validation
  const [initialCountryIds, setInitialCountryIds] = useState<string[]>([]);
  const [initialRegionIds, setInitialRegionIds] = useState<string[]>([]);
  const [initialZoneIds, setInitialZoneIds] = useState<string[]>([]);
  const [pendingCoverage, setPendingCoverage] = useState<{
    countryIds?: string[];
    regionIds?: string[];
    zoneIds?: string[];
    countryLabels?: string[];
    regionLabels?: string[];
    zoneLabels?: string[];
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setMastersLoading(true);
        setMastersError(null);
        const [c, r, z, cur, cat] = await Promise.all([
          listMasterCountries(),
          listMasterRegions(),
          listMasterZones(),
          getCurrencyMasterOptions(),
          getProductCategoryMasterOptions(),
        ]);
        if (!mounted) return;
        setCountries(c || []);
        setRegions(r || []);
        setZones(z || []);
        setCurrencyOptions(cur || []);
        setCategoryOptions(cat || []);
      } catch (e: any) {
        if (!mounted) return;
        setMastersError(e?.message || 'Failed to load masters data');
        // Set empty arrays to trigger fallback usage
        setCurrencyOptions([]);
        setCategoryOptions([]);
      } finally {
        if (mounted) setMastersLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadCustomerTemplateCategories = async () => {
      try {
        const response = await getCustomerProfileTemplateCategories();
        if (!mounted) return;

        const nextCategories = Array.isArray(response) ? response : [];
        setCustomerTemplateCategories(nextCategories);
        setSelectedCustomerTemplateCategory((current) => {
          if (current) return current;
          return nextCategories[0]?.id || '';
        });
      } catch (error: any) {
        if (!mounted) return;
        toast({
          title: 'Error loading customer template categories',
          description: error.message || 'Failed to load customer template categories',
          variant: 'destructive',
        });
      }
    };

    loadCustomerTemplateCategories();
    return () => {
      mounted = false;
    };
  }, [toast]);
  useEffect(() => {
    if (!pendingCoverage) return;
    const resolveCountryId = (value: string) =>
      countries.find((c) => c.id === value || c.label === value)?.id || '';
    const resolveRegionId = (value: string) =>
      regions.find((r) => r.id === value || r.label === value)?.id || '';
    const resolveZoneId = (value: string) =>
      zones.find((z) => z.id === value || z.label === value)?.id || '';
    const rawZoneIds = (
      pendingCoverage.zoneIds && pendingCoverage.zoneIds.length > 0
        ? pendingCoverage.zoneIds.map(resolveZoneId)
        : (pendingCoverage.zoneLabels || []).map(resolveZoneId)
    ).filter((id) => id && zones.some((z) => z.id === id));
    const derivedFromZones = { countryIds: new Set<string>(), regionIds: new Set<string>() };
    rawZoneIds.forEach((zoneId) => {
      const zone = zones.find((z) => z.id === zoneId);
      if (zone) {
        derivedFromZones.regionIds.add(zone.regionId);
        const region = regions.find((r) => r.id === zone.regionId);
        if (region) derivedFromZones.countryIds.add(region.countryId);
      }
    });
    const resolvedCountryIds = (
      pendingCoverage.countryIds && pendingCoverage.countryIds.length > 0
        ? pendingCoverage.countryIds.map(resolveCountryId)
        : (pendingCoverage.countryLabels || []).length > 0
          ? (pendingCoverage.countryLabels || []).map(resolveCountryId)
          : Array.from(derivedFromZones.countryIds)
    ).filter((id) => id && countries.some((c) => c.id === id));
    const uniqueCountryIds = Array.from(new Set(resolvedCountryIds));
    const resolvedRegionIds = (
      pendingCoverage.regionIds && pendingCoverage.regionIds.length > 0
        ? pendingCoverage.regionIds.map(resolveRegionId)
        : (pendingCoverage.regionLabels || []).length > 0
          ? (pendingCoverage.regionLabels || []).map(resolveRegionId)
          : Array.from(derivedFromZones.regionIds)
    ).filter((id) => {
      if (!id) return false;
      const reg = regions.find((r) => r.id === id);
      return !!reg && uniqueCountryIds.includes(reg.countryId);
    });
    const uniqueRegionIds = Array.from(new Set(resolvedRegionIds));
    const uniqueZoneIds = rawZoneIds.filter((id) => {
      const zn = zones.find((z) => z.id === id);
      return !!zn && uniqueRegionIds.includes(zn.regionId);
    });
    if (uniqueCountryIds.length > 0) {
      setSelectedCountryIds(uniqueCountryIds);
      // Store initial values for edit mode validation
      if (isEditMode && initialCountryIds.length === 0) {
        setInitialCountryIds(uniqueCountryIds);
      }
    }
    if (uniqueRegionIds.length > 0) {
      setSelectedRegionIds(uniqueRegionIds);
      if (isEditMode && initialRegionIds.length === 0) {
        setInitialRegionIds(uniqueRegionIds);
      }
    }
    if (uniqueZoneIds.length > 0) {
      setSelectedZoneIds(uniqueZoneIds);
      if (isEditMode && initialZoneIds.length === 0) {
        setInitialZoneIds(uniqueZoneIds);
      }
    }
    if (uniqueCountryIds.length > 0 || uniqueRegionIds.length > 0 || uniqueZoneIds.length > 0) {
      form.setValue('countries', uniqueCountryIds, { shouldDirty: false, shouldValidate: true });
      form.setValue('regions', uniqueRegionIds, { shouldDirty: false, shouldValidate: true });
      form.setValue('zones', uniqueZoneIds, { shouldDirty: false, shouldValidate: true });
    }
  }, [pendingCoverage, countries, regions, zones, form]);

  // Apply pending product data once masters are loaded (fixes race condition)
  useEffect(() => {
    // Wait for masters loading to complete (fallback categories will be used if API fails)
    if (
      pendingProductData &&
      !mastersLoading &&
      categories.length > 0 &&
      (!pendingProductData.customerCategory || customerTemplateCategories.length > 0)
    ) {
      const formData = {
        productName: pendingProductData.productName,
        category: pendingProductData.category as ProductCategory,
        currency: pendingProductData.currency,
        owner: pendingProductData.owner as ProductOwner,
        description: pendingProductData.description || '',
        productCode: pendingProductData.productCode || '',
        validityStartDate: pendingProductData.validityStartDate,
        validityEndDate: pendingProductData.validityEndDate,
        validityPeriod: pendingProductData.validityPeriod ?? 30,
        validityPeriodUnit: pendingProductData.validityPeriodUnit ?? 'days',
        policyValidityPeriod: pendingProductData.policyValidityPeriod ?? 30,
        policyValidityPeriodUnit: pendingProductData.policyValidityPeriodUnit ?? 'days',
        autoActivation: pendingProductData.autoActivation ?? true,
        cartLikeCoverSelection: pendingProductData.cartLikeCoverSelection ?? false,
        countries: selectedCountryIds,
        regions: selectedRegionIds,
        zones: selectedZoneIds,
      };
      
      // Reset form with all values at once
      form.reset(formData, { keepDefaultValues: false });
      
      // Force trigger validation to ensure UI updates
      setTimeout(() => {
        form.trigger();
      }, 50);

      setSelectedCustomerTemplateId(pendingProductData.customerProfileTemplateId || null);
      setSelectedCustomerTemplateCategory(
        resolveCustomerTemplateCategoryId(
          pendingProductData.customerCategory,
          customerTemplateCategories,
        ),
      );
      setSelectedCustomerTemplateName(pendingProductData.templateName || '');
      setInitialCustomerTemplateId(pendingProductData.customerProfileTemplateId || null);
      setInitialCustomerTemplateCategory(
        resolveCustomerTemplateCategoryId(
          pendingProductData.customerCategory,
          customerTemplateCategories,
        ),
      );

      // Clear pending data immediately after setting
      setPendingProductData(null);

      // Ensure isBasicInfoSaved is true after loading product in edit mode
      if (isEditMode) {
        setIsBasicInfoSaved(true);
      }
    }
  }, [
    pendingProductData,
    mastersLoading,
    categories,
    form,
    selectedCountryIds,
    selectedRegionIds,
    selectedZoneIds,
    isEditMode,
    customerTemplateCategories,
  ]);

  useEffect(() => {
    let mounted = true;

    const loadCustomerTemplates = async () => {
      try {
        setIsCustomerTemplatesLoading(true);
        const response = await getCustomerProfileTemplatesByCategory(
          selectedCustomerTemplateCategory,
        );
        if (!mounted) return;
        setCustomerTemplates(Array.isArray(response) ? response : []);
      } catch (error: any) {
        if (!mounted) return;
        setCustomerTemplates([]);
        toast({
          title: 'Error loading templates',
          description: error.message || 'Failed to load customer templates',
          variant: 'destructive',
        });
      } finally {
        if (mounted) setIsCustomerTemplatesLoading(false);
      }
    };

    if (isCustomerTemplateDialogOpen && selectedCustomerTemplateCategory) {
      loadCustomerTemplates();
    }

    return () => {
      mounted = false;
    };
  }, [isCustomerTemplateDialogOpen, selectedCustomerTemplateCategory, toast]);

  useEffect(() => {
    if (!selectedCustomerTemplateId) {
      setSelectedCustomerTemplateName('');
      return;
    }

    const matchedTemplate = customerTemplates.find(
      (template) => template.id === selectedCustomerTemplateId,
    );
    if (matchedTemplate) {
      setSelectedCustomerTemplateName(matchedTemplate.name);
    }
  }, [customerTemplates, selectedCustomerTemplateId]);

  useEffect(() => {
    if (customerTemplateCategories.length === 0) return;

    setSelectedCustomerTemplateCategory((current) =>
      resolveCustomerTemplateCategoryId(current, customerTemplateCategories),
    );
    setInitialCustomerTemplateCategory((current) =>
      resolveCustomerTemplateCategoryId(current, customerTemplateCategories),
    );
  }, [customerTemplateCategories]);

  const [provisions, setProvisions] = useState({
    reinsuranceSetup: false,
    coverreinsurancesetup: false,
    authorityMatrix: false,
    proposalFormDesign: false,
    additionalInformationDesign: false,
    workflowManagement: false,
    ratingConfiguratorDesign: false,
    uwRulesDesign: false,
    documentDesign: false,
    kpisDesign: false,
    apiIntegrations: false,
    notifications: false,
    distributionChannel: false,
    rateManagement: false,
    marketability: false,
    b2cHandling: false,
    mastersManagement: false,
  });

  const [productStructureMode, setProductStructureMode] = useState<ProductStructureMode>('single');
  const [productStructureSections, setProductStructureSections] = useState<
    UiProductStructureSection[]
  >([]);
  /** Snapshot taken when leaving Multi Cover for Single Cover; restored when switching back. */
  const multiCoverSectionsBackupRef = useRef<UiProductStructureSection[] | null>(null);
  const [isAddCoverDialogOpen, setIsAddCoverDialogOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [newCoverTitle, setNewCoverTitle] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');
  const [editingCoverId, setEditingCoverId] = useState<string | null>(null);
  const [editingCoverTitle, setEditingCoverTitle] = useState('');
  const [deleteSectionConfirm, setDeleteSectionConfirm] = useState<{
    open: boolean;
    sectionId: string | null;
  }>({ open: false, sectionId: null });
  const [deleteCoverConfirm, setDeleteCoverConfirm] = useState<{
    open: boolean;
    sectionId: string | null;
    coverId: string | null;
  }>({ open: false, sectionId: null, coverId: null });
  const [isImportProductStructureDialogOpen, setIsImportProductStructureDialogOpen] =
    useState(false);
  const [importProductStructureSearch, setImportProductStructureSearch] = useState('');
  const [importProductList, setImportProductList] = useState<InsuranceProduct[]>([]);
  const [importProductLoading, setImportProductLoading] = useState(false);
  const [selectedImportProductId, setSelectedImportProductId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Create flow: single-cover layout starts with one editable section + cover (no Add buttons).
  useEffect(() => {
    if (isEditMode) return;
    if (productStructureMode !== 'single') return;
    if (productStructureSections.length > 0) return;
    setProductStructureSections(createDefaultSingleCoverStructure());
    markCoversDirty();
  }, [isEditMode, productStructureMode, productStructureSections.length]);

  // ─── Risk Category assignment per cover ────────────────────────────────────
  const { data: riskCategorisations = [] } = useRiskCategorisations();
  const [assignRcDialogCoverId, setAssignRcDialogCoverId] = useState<string | null>(null);
  const [assignRcStep1, setAssignRcStep1] = useState<string>('');
  const [assignRcStep2, setAssignRcStep2] = useState<string>('');

  const openAssignRcDialog = (coverId: string) => {
    setAssignRcDialogCoverId(coverId);
    const cover = productStructureSections.flatMap((s) => s.covers).find((c) => c.id === coverId);
    const derivedCategorisationId = cover?.riskCategoryId
      ? riskCategorisations.find((rc) =>
          (rc.riskCategories ?? []).some((cat) => cat.id === cover.riskCategoryId),
        )?.id
      : undefined;
    setAssignRcStep1(derivedCategorisationId ?? cover?.riskCategorisationId ?? '');
    setAssignRcStep2(cover?.riskCategoryId ?? '');
  };

  const closeAssignRcDialog = () => {
    setAssignRcDialogCoverId(null);
    setAssignRcStep1('');
    setAssignRcStep2('');
  };

  const sanitizeRiskCategoryAssignments = (sections: UiProductStructureSection[]) => {
    if (!riskCategorisations.length) return sections;

    const categoryToCategorisation = new Map<string, string>();
    for (const rc of riskCategorisations) {
      for (const cat of rc.riskCategories ?? []) {
        categoryToCategorisation.set(cat.id, rc.id);
      }
    }

    return sections.map((s) => ({
      ...s,
      covers: s.covers.map((c) => {
        if (!c.riskCategoryId) return c;

        const categorisationId = categoryToCategorisation.get(c.riskCategoryId);
        if (!categorisationId) {
          return {
            ...c,
            riskCategorisationId: undefined,
            riskCategoryId: undefined,
          };
        }

        if (c.riskCategorisationId !== categorisationId) {
          return {
            ...c,
            riskCategorisationId: categorisationId,
          };
        }

        return c;
      }),
    }));
  };

  const handleSaveRcAssignment = async () => {
    if (!assignRcDialogCoverId) return;

    const updatedSections = sanitizeRiskCategoryAssignments(
      productStructureSections.map((s) => ({
        ...s,
        covers: s.covers.map((c) =>
          c.id === assignRcDialogCoverId
            ? {
                ...c,
                riskCategorisationId: assignRcStep1 || undefined,
                riskCategoryId: assignRcStep2 || undefined,
              }
            : c,
        ),
      })),
    );

    setProductStructureSections(updatedSections);
    markCoversDirty();
    closeAssignRcDialog();

    // Persist immediately if the product already exists
    if (currentProductId) {
      const sections = buildSectionsPayloadFromUi(productStructureMode, updatedSections);
      if (sections) {
        try {
          await updateProduct(currentProductId, { sections });
        } catch {
          // Non-critical — assignment is saved in local state; will persist on next full save
        }
      }
    }
  };

  const handleClearCoverRiskCategory = async (coverId: string) => {
    const updatedSections = sanitizeRiskCategoryAssignments(
      productStructureSections.map((s) => ({
        ...s,
        covers: s.covers.map((c) =>
          c.id === coverId
            ? {
                ...c,
                riskCategorisationId: undefined,
                riskCategoryId: undefined,
              }
            : c,
        ),
      })),
    );

    setProductStructureSections(updatedSections);
    markCoversDirty();

    if (currentProductId) {
      const sections = buildSectionsPayloadFromUi(productStructureMode, updatedSections);
      if (sections) {
        try {
          await updateProduct(currentProductId, { sections });
        } catch {
          // Non-critical — assignment is saved in local state; will persist on next full save
        }
      }
    }
  };

  const getAssignedRcLabel = (cover: {
    riskCategorisationId?: string;
    riskCategoryId?: string;
  }) => {
    if (!cover.riskCategoryId) return null;
    for (const rc of riskCategorisations) {
      const cat = (rc.riskCategories ?? []).find((c) => c.id === cover.riskCategoryId);
      if (cat) return `${rc.name} / ${cat.name}`;
    }
    return null;
  };

  const step1SelectedRc = riskCategorisations.find((r) => r.id === assignRcStep1);

  const handleAddProductStructureSection = () => {
    const newSection: UiProductStructureSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      covers: [],
      createdBy: 'Current User',
      createdAt: new Date().toISOString(),
    };
    setProductStructureSections((prev) => [...prev, newSection]);
    markCoversDirty();
    setEditingSectionId(newSection.id);
    setEditingSectionTitle('New Section');
  };

  const handleUpdateSectionTitle = (sectionId: string, title: string) => {
    setProductStructureSections((prev) =>
      prev.map((section) => (section.id === sectionId ? { ...section, title } : section)),
    );
    markCoversDirty();
  };

  const handleUpdateCoverTitle = (sectionId: string, coverId: string, title: string) => {
    setProductStructureSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              covers: section.covers.map((c) => (c.id === coverId ? { ...c, title } : c)),
            }
          : section,
      ),
    );
    markCoversDirty();
  };

  const coverDragSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleProductStructureDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeCoverId = String(active.id);
    const overCoverId = String(over.id);
    const sourceSection = productStructureSections.find((section) =>
      section.covers.some((cover) => cover.id === activeCoverId),
    );
    const targetSection = productStructureSections.find((section) =>
      section.covers.some((cover) => cover.id === overCoverId),
    );
    if (!sourceSection || sourceSection.id !== targetSection?.id) return;

    setProductStructureSections((prev) =>
      prev.map((section) => {
        if (section.id !== sourceSection.id) return section;
        const oldIndex = section.covers.findIndex((cover) => cover.id === activeCoverId);
        const newIndex = section.covers.findIndex((cover) => cover.id === overCoverId);
        if (oldIndex === -1 || newIndex === -1) return section;
        return { ...section, covers: arrayMove(section.covers, oldIndex, newIndex) };
      }),
    );
    markCoversDirty();
  };

  const handleConfirmDeleteSection = () => {
    if (deleteSectionConfirm.sectionId) {
      handleDeleteSection(deleteSectionConfirm.sectionId);
    }
    setDeleteSectionConfirm({ open: false, sectionId: null });
  };

  const handleConfirmDeleteCover = () => {
    if (deleteCoverConfirm.sectionId && deleteCoverConfirm.coverId) {
      handleDeleteCover(deleteCoverConfirm.sectionId, deleteCoverConfirm.coverId);
    }
    setDeleteCoverConfirm({ open: false, sectionId: null, coverId: null });
  };

  const handleDeleteSection = async (sectionId: string) => {
    // Optimistic UI update — remove section and all its covers immediately
    const sectionToDelete = productStructureSections.find((s) => s.id === sectionId);
    setProductStructureSections((prev) => prev.filter((section) => section.id !== sectionId));
    markCoversDirty();

    // Delete each DB-persisted cover via API (backend auto-deletes section on last cover removal)
    if (currentProductId && sectionToDelete) {
      const dbCoverIds = sectionToDelete.covers
        .map((c) => c.id)
        .filter((id) => !id.startsWith('cover-'));

      for (const coverId of dbCoverIds) {
        try {
          await deleteCover(currentProductId, coverId);
        } catch (err) {
          // Failed to delete cover
        }
      }
    }
  };

  const handleOpenAddCoverDialog = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setNewCoverTitle('');
    setIsAddCoverDialogOpen(true);
  };

  const handleCloseAddCoverDialog = (open: boolean) => {
    setIsAddCoverDialogOpen(open);
    if (!open) {
      setActiveSectionId(null);
      setNewCoverTitle('');
    }
  };

  const handleAddCoverToSection = () => {
    if (!activeSectionId || !newCoverTitle.trim()) return;
    const title = newCoverTitle.trim();
    setProductStructureSections((prev) =>
      prev.map((section) =>
        section.id === activeSectionId
          ? {
              ...section,
              covers: [
                ...section.covers,
                {
                  id: `cover-${Date.now()}`,
                  title,
                  createdAt: new Date().toISOString(),
                  ratingStructureDone: false,
                  reinsuranceSetupDone: false,
                },
              ],
            }
          : section,
      ),
    );
    markCoversDirty();
    setIsAddCoverDialogOpen(false);
    setNewCoverTitle('');
    setActiveSectionId(null);
  };

  const handleDeleteCover = async (sectionId: string, coverId: string) => {
    // 1. Optimistic UI update — remove cover, and section if it becomes empty
    setProductStructureSections((prev) => {
      const updated = prev.map((section) =>
        section.id === sectionId
          ? { ...section, covers: section.covers.filter((c) => c.id !== coverId) }
          : section,
      );
      return updated.filter((section) => section.id !== sectionId || section.covers.length > 0);
    });
    markCoversDirty();

    // 2. Call API only for DB-persisted covers (temp IDs like "cover-1710000000000" are not in DB)
    if (currentProductId && !coverId.startsWith('cover-')) {
      try {
        await deleteCover(currentProductId, coverId);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to delete cover. Please save manually.',
          variant: 'destructive',
        });
      }
    }
    // Cover deletion skipped - no product ID available
  };

  const handleOpenImportDialog = async () => {
    setIsImportProductStructureDialogOpen(true);
    setSelectedImportProductId(null);
    setImportProductStructureSearch('');
    try {
      setImportProductLoading(true);
      const res = await getProducts({ limit: 100 });
      // Exclude the current product from the list
      const filtered = (res.items ?? []).filter((p) => p.id !== currentProductId);
      setImportProductList(filtered);
    } catch {
      setImportProductList([]);
    } finally {
      setImportProductLoading(false);
    }
  };

  const handleImportProductStructure = async () => {
    if (!selectedImportProductId) return;
    try {
      setIsImporting(true);
      const product = await getProduct(selectedImportProductId);
      const { mode, sections } = mapProductToUiStructure(product);
      if (mode === 'multi' && sections.length > 0) {
        // Multi-cover: import all its sections and their covers
        setProductStructureSections((prev) => [...prev, ...sections]);
      } else {
        // Single-cover: create one section named after the product with one cover
        const newSection: UiProductStructureSection = {
          id: `section-${Date.now()}`,
          title: product.name,
          createdBy: '',
          createdAt: new Date().toISOString(),
          covers: [
            {
              id: `cover-${Date.now()}`,
              title: product.name,
              createdAt: new Date().toISOString(),
              ratingStructureDone: false,
              reinsuranceSetupDone: false,
            },
          ],
        };
        setProductStructureSections((prev) => [...prev, newSection]);
      }
      markCoversDirty();
      setIsImportProductStructureDialogOpen(false);
      setSelectedImportProductId(null);
      toast({
        title: 'Product Imported',
        description: `"${product.name}" has been added to the product structure.`,
      });
    } catch {
      toast({
        title: 'Import Failed',
        description: 'Could not import the selected product. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const renderConfigButton = (item: (typeof configItems)[number]) => (
    <Button
      key={item.provisionKey}
      type="button"
      variant="outline"
      disabled={item.isDisabled}
      className={
        item.isEnabled
          ? 'h-10 px-3 justify-between items-center hover:bg-primary/5 hover:text-foreground relative'
          : 'h-10 px-3 justify-between items-center opacity-50 cursor-not-allowed relative'
      }
      onClick={item.onClick}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <item.icon
            className={item.isEnabled ? 'w-4 h-4 text-primary' : 'w-4 h-4 text-muted-foreground'}
          />
          <span
            className={cn(
              'text-sm font-medium leading-snug break-words whitespace-normal text-left',
              item.isEnabled ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {item.label}
          </span>
        </div>
        {provisions[item.provisionKey] ? (
          <CheckCircle2
            className={item.isEnabled ? 'w-4 h-4 text-green-500' : 'w-4 h-4 text-muted-foreground'}
          />
        ) : (
          <Edit className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
    </Button>
  );

  const buildSectionsPayload = (): ProductSection[] | undefined =>
    buildSectionsPayloadFromUi(
      productStructureMode,
      sanitizeRiskCategoryAssignments(productStructureSections),
    );

  const handleSubmit = async (data: CreateProductForm) => {
    try {
      setIsLoading(true);

      // Geographic coverage validation is now handled by Zod schema

      if (isEditMode && currentProductId) {
        await updateProduct(currentProductId, {
          name: data.productName,
          category: (data.category as ProductCategory) || undefined,
          currency: data.currency,
          owner: (data.owner as ProductOwner) || undefined,
          description: data.description || undefined,
          code: data.productCode || deriveProductCode(data.productName || ''),
          validityStartDate: data.validityStartDate
            ? format(data.validityStartDate, 'yyyy-MM-dd')
            : undefined,
          validityEndDate: data.validityEndDate
            ? format(data.validityEndDate, 'yyyy-MM-dd')
            : undefined,
          validityPeriod: data.validityPeriod,
          validityPeriodUnit: data.validityPeriodUnit,
          policyValidityPeriod: data.policyValidityPeriod,
          policyValidityPeriodUnit: data.policyValidityPeriodUnit,
          customerProfileTemplateId: selectedCustomerTemplateId || null,
          oldCustomerProfileTemplateId,
          customerCategory: selectedCustomerTemplateId ? selectedCustomerTemplateCategory : null,
          autoActivation: data.autoActivation,
          cartLikeCoverSelection: data.cartLikeCoverSelection,
          productType: uiModeToBackendProductType(productStructureMode),
          sections: buildSectionsPayload(),
          operatingCountries: selectedCountryIds,
          operatingRegions: selectedRegionIds,
          operatingZones: selectedZoneIds,
        });
        toast({
          title: 'Product Updated',
          description: `Product ${data.productName} has been updated successfully.`,
        });
      } else {
        await createProduct({
          name: data.productName,
          category: data.category as ProductCategory,
          currency: data.currency,
          owner: data.owner as ProductOwner,
          status: 'Draft',
          description: data.description || undefined,
          code: data.productCode || deriveProductCode(data.productName),
          validityStartDate: data.validityStartDate
            ? format(data.validityStartDate, 'yyyy-MM-dd')
            : undefined,
          validityEndDate: data.validityEndDate
            ? format(data.validityEndDate, 'yyyy-MM-dd')
            : undefined,
          validityPeriod: data.validityPeriod,
          validityPeriodUnit: data.validityPeriodUnit,
          policyValidityPeriod: data.policyValidityPeriod,
          policyValidityPeriodUnit: data.policyValidityPeriodUnit,
          customerProfileTemplateId: selectedCustomerTemplateId || null,
          customerCategory: selectedCustomerTemplateId ? selectedCustomerTemplateCategory : null,
          autoActivation: data.autoActivation,
          cartLikeCoverSelection: data.cartLikeCoverSelection,
          productType: uiModeToBackendProductType(productStructureMode),
          sections: buildSectionsPayload(),
          operatingCountries: selectedCountryIds,
          operatingRegions: selectedRegionIds,
          operatingZones: selectedZoneIds,
        });
        toast({
          title: 'Product Created',
          description: `Product ${data.productName} has been created successfully.`,
        });
      }
      navigate('/market-admin/product-management');
    } catch (err: unknown) {
      const message =
        (err as Error)?.message ||
        (isEditMode ? 'Failed to update product' : 'Failed to create product');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBasicInfo = form.handleSubmit(
    async (data) => {
      try {
        setIsLoading(true);
        isSavingRef.current = true;
        let freshProductId: string | null = null;

        // Geographic coverage validation is now handled by Zod schema

        if (isEditMode && currentProductId) {
          await updateProduct(currentProductId, {
            name: data.productName,
            category: data.category as ProductCategory,
            currency: data.currency,
            owner: data.owner as ProductOwner,
            description: data.description || undefined,
            code: data.productCode || deriveProductCode(data.productName || ''),
            validityStartDate: data.validityStartDate
              ? format(data.validityStartDate, 'yyyy-MM-dd')
              : undefined,
            validityEndDate: data.validityEndDate
              ? format(data.validityEndDate, 'yyyy-MM-dd')
              : undefined,
            validityPeriod: data.validityPeriod,
            validityPeriodUnit: data.validityPeriodUnit,
            policyValidityPeriod: data.policyValidityPeriod,
            policyValidityPeriodUnit: data.policyValidityPeriodUnit,
            customerProfileTemplateId: selectedCustomerTemplateId || null,
            customerCategory: selectedCustomerTemplateId ? selectedCustomerTemplateCategory : null,
            autoActivation: data.autoActivation,
            cartLikeCoverSelection: data.cartLikeCoverSelection,

            productType: uiModeToBackendProductType(productStructureMode),
            sections: buildSectionsPayload(),
            operatingCountries: selectedCountryIds,
            operatingRegions: selectedRegionIds,
            operatingZones: selectedZoneIds,
          });
        } else {
          const newProduct = await createProduct({
            name: data.productName,
            category: data.category as ProductCategory,
            currency: data.currency,
            owner: data.owner as ProductOwner,
            status: 'Draft',
            description: data.description || undefined,
            code: data.productCode || deriveProductCode(data.productName || ''),
            validityStartDate: data.validityStartDate
              ? format(data.validityStartDate, 'yyyy-MM-dd')
              : undefined,
            validityEndDate: data.validityEndDate
              ? format(data.validityEndDate, 'yyyy-MM-dd')
              : undefined,
            validityPeriod: data.validityPeriod,
            validityPeriodUnit: data.validityPeriodUnit,
            policyValidityPeriod: data.policyValidityPeriod,
            policyValidityPeriodUnit: data.policyValidityPeriodUnit,
            customerProfileTemplateId: selectedCustomerTemplateId || null,
            oldCustomerProfileTemplateId,
            customerCategory: selectedCustomerTemplateId ? selectedCustomerTemplateCategory : null,
            autoActivation: data.autoActivation,
            cartLikeCoverSelection: data.cartLikeCoverSelection,

            productType: uiModeToBackendProductType(productStructureMode),
            sections: buildSectionsPayload(),
            operatingCountries: selectedCountryIds,
            operatingRegions: selectedRegionIds,
            operatingZones: selectedZoneIds,
          });
          setCurrentProductId(newProduct.id);
          if (newProduct.organizationId) setCurrentProductOrgId(newProduct.organizationId);
          freshProductId = newProduct.id;
        }

        // Re-fetch product to sync real section/cover IDs (including risk category fields) from backend
        const savedId = freshProductId ?? currentProductId ?? '';
        if (savedId) {
          try {
            const refreshed = await getProduct(savedId);
            const { sections: uiSections } = mapProductToUiStructure(refreshed);
            if (uiSections.length > 0) {
              setProductStructureSections(uiSections);
              const refreshedMode = inferStructureModeFromSections(uiSections);
              setProductStructureMode(refreshedMode);
              if (refreshedMode === 'multi') {
                multiCoverSectionsBackupRef.current = cloneProductStructureSections(uiSections);
              } else {
                multiCoverSectionsBackupRef.current = null;
              }
            }
          } catch {
            // Non-critical — sections are still in local state, just with temp IDs
          }
        }

        // Reset form to mark it as clean (not dirty) after successful save
        form.reset(
          {
            ...form.getValues(),
            countries: selectedCountryIds,
            regions: selectedRegionIds,
            zones: selectedZoneIds,
          },
          { keepDefaultValues: false },
        );
        
        setInitialCustomerTemplateId(selectedCustomerTemplateId);
        setInitialCustomerTemplateCategory(selectedCustomerTemplateCategory);
        
        // Use setTimeout to ensure these are set after all React state updates complete
        setTimeout(() => {
          setIsBasicInfoSaved(true);
          setCoversDirty(false);
          isSavingRef.current = false;
        }, 100);
        
        toast({
          title: 'Basic Information Saved',
          description:
            'Product basic information has been saved. You can now configure product provisions.',
        });
      } catch (err: unknown) {
        const message = (err as Error)?.message || 'Failed to save basic information';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    // Error callback - validation failed (likely geographic coverage missing)
    async (errors) => {
      // Check if essential fields have errors
      const hasEssentialErrors =
        errors.productName ||
        errors.category ||
        errors.owner ||
        errors.validityStartDate ||
        errors.validityEndDate ||
        errors.validityPeriod ||
        errors.policyValidityPeriod;

      if (hasEssentialErrors) {
        // Don't allow save if essential fields are invalid
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields before saving.',
          variant: 'destructive',
        });
        return;
      }

      // Only geographic validation failed - allow save as draft
      try {
        setIsLoading(true);
        const data = form.getValues();

        if (isEditMode && currentProductId) {
          await updateProduct(currentProductId, {
            name: data.productName,
            category: data.category as ProductCategory,
            currency: data.currency,
            owner: data.owner as ProductOwner,
            description: data.description || undefined,
            code: data.productCode || deriveProductCode(data.productName || ''),
            validityStartDate: data.validityStartDate
              ? format(data.validityStartDate, 'yyyy-MM-dd')
              : undefined,
            validityEndDate: data.validityEndDate
              ? format(data.validityEndDate, 'yyyy-MM-dd')
              : undefined,
            validityPeriod: data.validityPeriod,
            validityPeriodUnit: data.validityPeriodUnit,
            policyValidityPeriod: data.policyValidityPeriod,
            policyValidityPeriodUnit: data.policyValidityPeriodUnit,
            customerProfileTemplateId: selectedCustomerTemplateId || null,
            oldCustomerProfileTemplateId,
            customerCategory: selectedCustomerTemplateId ? selectedCustomerTemplateCategory : null,
            autoActivation: data.autoActivation,
            cartLikeCoverSelection: data.cartLikeCoverSelection,

            productType: uiModeToBackendProductType(productStructureMode),
            sections: buildSectionsPayload(),
            operatingCountries: selectedCountryIds,
            operatingRegions: selectedRegionIds,
            operatingZones: selectedZoneIds,
          });
        } else {
          const newProduct = await createProduct({
            name: data.productName,
            category: data.category as ProductCategory,
            currency: data.currency,
            owner: data.owner as ProductOwner,
            status: 'Draft',
            description: data.description || undefined,
            code: data.productCode || deriveProductCode(data.productName || ''),
            validityStartDate: data.validityStartDate
              ? format(data.validityStartDate, 'yyyy-MM-dd')
              : undefined,
            validityEndDate: data.validityEndDate
              ? format(data.validityEndDate, 'yyyy-MM-dd')
              : undefined,
            validityPeriod: data.validityPeriod,
            validityPeriodUnit: data.validityPeriodUnit,
            policyValidityPeriod: data.policyValidityPeriod,
            policyValidityPeriodUnit: data.policyValidityPeriodUnit,
            customerProfileTemplateId: selectedCustomerTemplateId || null,
            customerCategory: selectedCustomerTemplateId ? selectedCustomerTemplateCategory : null,
            autoActivation: data.autoActivation,
            cartLikeCoverSelection: data.cartLikeCoverSelection,

            productType: uiModeToBackendProductType(productStructureMode),
            sections: buildSectionsPayload(),
            operatingCountries: selectedCountryIds,
            operatingRegions: selectedRegionIds,
            operatingZones: selectedZoneIds,
          });
          setCurrentProductId(newProduct.id);
          if (newProduct.organizationId) setCurrentProductOrgId(newProduct.organizationId);
        }
        setIsBasicInfoSaved(true);
        form.reset(
          {
            ...form.getValues(),
            countries: selectedCountryIds,
            regions: selectedRegionIds,
            zones: selectedZoneIds,
          },
          { keepDefaultValues: false },
        );
        setInitialCustomerTemplateId(selectedCustomerTemplateId);
        setInitialCustomerTemplateCategory(selectedCustomerTemplateCategory);
        toast({
          title: 'Saved as Draft',
          description: 'Product saved. Please configure Geographic Coverage before activating.',
        });
      } catch (err: unknown) {
        const message = (err as Error)?.message || 'Failed to save basic information';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
  );
  const handleCreateDesign = (path: string[]) => {
    if (!isBasicInfoSaved) {
      toast({
        title: 'Save Required',
        description: 'Please save the Basic Product Information before configuring provisions.',
        variant: 'destructive',
      });
      return;
    }

    const designName = path[path.length - 1];

    const params = new URLSearchParams({
      productName: form.getValues('productName') || '',
    });
    if (currentProductId) {
      params.set('productId', currentProductId);
    }
    if (currentProductOrgId) {
      params.set('organizationId', currentProductOrgId);
    }
    // Add currency to URL parameters
    const currency = form.getValues('currency');
    if (currency) {
      params.set('currency', currency);
    }
    const queryString = params.toString();

    // Navigate to Proposal Form Design if it's proposalFormDesign
    if (designName === 'proposalFormDesign') {
      navigate(`/market-admin/product-management/proposal-form-design?${queryString}`);
      return;
    }

    if (designName === 'additionalInformationDesign' || designName === 'additionalInformation') {
      navigate(
        `/market-admin/product-management/proposal-form-design?${queryString}&designType=additional-information`,
      );
      return;
    }

    // Navigate to Workflow Management
    if (designName === 'workflowManagement') {
      navigate(`/market-admin/product-management/workflow-management?${queryString}`);
      return;
    }

    //Navigate to premium additives
    if (designName === 'premiumAdditives') {
      navigate(`/market-admin/product-management/premium-additives?${queryString}`);
      return;
    }

    // Navigate to Rating Structure Design
    if (designName === 'ratingConfiguratorDesign') {
      navigate(
        `/market-admin/product-management/rating-configurator/${currentProductId}?${queryString}`,
      );
      return;
    }

    // Navigate to Document Design
    if (designName === 'documentDesign') {
      navigate(`/market-admin/product-management/document-configurator?${queryString}`);
      return;
    }

    // Navigate to KPI Design
    if (designName === 'kpisDesign') {
      navigate(`/market-admin/product-management/kpi-design?${queryString}`);
      return;
    }

    // Navigate to UW Rules Design
    if (designName === 'uwRulesDesign') {
      navigate(`/market-admin/product-management/uw-rules-design?${queryString}`);
      return;
    }
    //navigate to cover reinsurance Design
    if (designName === 'coverreinsurancesetup') {
      navigate(`/market-admin/product-management/cover-reinsurance-setup?${queryString}`);
      return;
    }

    // TODO: Navigate to other design pages
    toast({
      title: 'Create Design',
      description: `Creating ${designName}... Design creation functionality will be implemented in the next step.`,
    });
  };

  const handleOpenCustomerTemplateDialog = () => {
    if (!selectedCustomerTemplateCategory && customerTemplateCategories[0]?.id) {
      setSelectedCustomerTemplateCategory(customerTemplateCategories[0].id);
    }
    setSelectedCustomerTemplateForDialog(
      selectedCustomerTemplateId
        ? {
            id: selectedCustomerTemplateId,
            name: selectedCustomerTemplateName || 'Selected Template',
            customerCategory: selectedCustomerTemplateCategory,
            createdAt: '',
          }
        : null,
    );
    setIsCustomerTemplateDialogOpen(true);
  };

  const handleSelectCustomerTemplate = () => {
    if (!selectedCustomerTemplateForDialog) return;

    setSelectedCustomerTemplateId(selectedCustomerTemplateForDialog.id);
    setSelectedCustomerTemplateName(selectedCustomerTemplateForDialog.name);
    setSelectedCustomerTemplateCategory(selectedCustomerTemplateForDialog.customerCategory);
    setIsCustomerTemplateDialogOpen(false);
  };

  const handleClearCustomerTemplate = () => {
    setSelectedCustomerTemplateId(null);
    setSelectedCustomerTemplateName('');
  };

  const handleConfigureAuthorityMatrix = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isBasicInfoSaved) {
      toast({
        title: 'Save Required',
        description: 'Please save the Basic Product Information before configuring provisions.',
        variant: 'destructive',
      });
      return;
    }

    const params = new URLSearchParams({
      productName: form.getValues('productName') || '',
    });
    if (currentProductId) {
      params.set('productId', currentProductId);
    }
    // Add currency to URL parameters
    const currency = form.getValues('currency');
    if (currency) {
      params.set('currency', currency);
    }
    navigate(`/market-admin/product-management/authority-matrix?${params.toString()}`);
  };

  const handleMastersManagementClick = (e: React.MouseEvent) => {
    if (!isMastersManagementAllowed) return;
    e.preventDefault();

    navigate(`/market-admin/masters-management/product/${currentProductId}`);
  };

  const configItems = [
    {
      label: 'Proposal Form Design',
      icon: FileText,
      provisionKey: 'proposalFormDesign' as const,
      isEnabled: isProposalFormDesignAllowed,
      isDisabled: !isProposalFormDesignAllowed,
      onClick: () => handleCreateDesign(['formsAndTemplates', 'proposalFormDesign']),
    },
    {
      label: 'Additional Information',
      icon: FileText,
      provisionKey: 'additionalInformationDesign' as const,
      isEnabled: isAdditionalInformationDesignAllowed,
      isDisabled: !isAdditionalInformationDesignAllowed,
      onClick: () => handleCreateDesign(['formsAndTemplates', 'additionalInformationDesign']),
    },
    {
      label: 'Masters Management',
      icon: Database,
      provisionKey: 'mastersManagement' as const,
      isEnabled: isMastersManagementAllowed,
      isDisabled: !isMastersManagementAllowed,
      onClick: handleMastersManagementClick,
    },
    {
      label: 'Workflow Management',
      icon: TrendingUp,
      provisionKey: 'workflowManagement' as const,
      isEnabled: true,
      isDisabled: false,
      onClick: () => handleCreateDesign(['formsAndTemplates', 'workflowManagement']),
    },
    {
      label: 'Rating Structure Design',
      icon: Settings,
      provisionKey: 'ratingConfiguratorDesign' as const,
      isEnabled: isRatingConfigDesignAllowed,
      isDisabled: !isRatingConfigDesignAllowed,
      onClick: () => handleCreateDesign(['ratingAndUnderwriting', 'ratingConfiguratorDesign']),
    },
    // {
    //   label: 'UW Rules Design',
    //   icon: Shield,
    //   provisionKey: 'uwRulesDesign' as const,
    //   isEnabled: isUwRulesDesignAllowed,
    //   isDisabled: false,
    //   onClick: () => handleCreateDesign(['uwRulesDesign']),
    // },
    {
      label: 'Premium Additives',
      icon: BadgePercent,
      provisionKey: 'premiumAdditives' as const,
      isEnabled: true,
      isDisabled: false,
      onClick: () => handleCreateDesign(['formsAndTemplates', 'premiumAdditives']),
    },
    {
      label: 'Authority Matrix',
      icon: Key,
      provisionKey: 'authorityMatrix' as const,
      isEnabled: isProductAuthorityAllowed,
      isDisabled: !isProductAuthorityAllowed,
      onClick: handleConfigureAuthorityMatrix,
    },
    {
      label: 'Document Design',
      icon: FileText,
      provisionKey: 'documentDesign' as const,
      isEnabled: isDocumentDesignAllowed,
      isDisabled: !isDocumentDesignAllowed,
      onClick: () => handleCreateDesign(['ratingAndUnderwriting', 'documentDesign']),
    },
    {
      label: 'Reinsurance Setup',
      icon: Building2,
      provisionKey: 'reinsuranceSetup' as const,
      isEnabled: isReinsuranceSetupAllowed,
      isDisabled: false,
      onClick: (e: React.MouseEvent) => {
        if (!isReinsuranceSetupAllowed) return;
        e.preventDefault();
        navigate('/market-admin/product-management/reinsurance-setup');
      },
    },
    {
      label: 'Cover Reinsurance Setup',
      icon: ShieldIcon,
      provisionKey: 'coverreinsurancesetup' as const,
      isEnabled: true,
      isDisabled: false,
      onClick: () => handleCreateDesign(['pricingEngine', 'coverreinsurancesetup']),
    },
    {
      label: 'KPIs Design',
      icon: BarChart3,
      provisionKey: 'kpisDesign' as const,
      isEnabled: true,
      isDisabled: false,
    },
    {
      label: 'Distribution channels',
      icon: Network,
      provisionKey: 'distributionChannel' as const,
      isEnabled: true,
      isDisabled: false,
    },
    {
      label: 'Rate Management',
      icon: TrendingUp,
      provisionKey: 'rateManagement' as const,
      isEnabled: true,
      isDisabled: false,
    },
    {
      label: 'Commission Structuring',
      icon: Target,
      provisionKey: 'marketability' as const,
      isEnabled: true,
      isDisabled: false,
    },
    {
      label: 'B2C Handling',
      icon: ShoppingCart,
      provisionKey: 'b2cHandling' as const,
      isEnabled: true,
      isDisabled: false,
    },
    {
      label: 'Notifications',
      icon: Bell,
      provisionKey: 'notifications' as const,
      isEnabled: true,
      isDisabled: false,
    },
  ];

  // Validation: Check if geographic coverage was removed in edit mode
  const hadInitialGeographic =
    isEditMode &&
    (initialCountryIds.length > 0 || initialRegionIds.length > 0 || initialZoneIds.length > 0);
  const geographicCoverageRemoved =
    hadInitialGeographic &&
    ((initialCountryIds.length > 0 && selectedCountryIds.length === 0) ||
      (initialRegionIds.length > 0 && selectedRegionIds.length === 0) ||
      (initialZoneIds.length > 0 && selectedZoneIds.length === 0));
  const hasCustomerTemplateChanged =
    selectedCustomerTemplateId !== initialCustomerTemplateId ||
    selectedCustomerTemplateCategory !== initialCustomerTemplateCategory;
  const oldCustomerProfileTemplateId =
    hasCustomerTemplateChanged && initialCustomerTemplateId !== selectedCustomerTemplateId
      ? initialCustomerTemplateId
      : null;

  // Compute button disabled state
  const hasEssentialFields = Boolean(
    form.watch('productName') &&
    form.watch('category') &&
    form.watch('owner') &&
    form.watch('validityStartDate') &&
    form.watch('validityEndDate'),
  );
  const hasGeographicCoverage =
    selectedCountryIds.length > 0 && selectedRegionIds.length > 0 && selectedZoneIds.length > 0;

  const hasValidProductStructure =
    productStructureSections.length > 0 &&
    productStructureSections.some((section) => section.covers.length > 0);
  const hasUnsavedBasicInfoChanges =
    form.formState.isDirty || coversDirty || hasCustomerTemplateChanged;
  
  const shouldShowSavedState =
    !hasUnsavedBasicInfoChanges && (isBasicInfoSaved || (isEditMode && !!currentProductId));

  const shouldDisableButton =
    isLoading ||
    !hasEssentialFields ||
    !hasValidProductStructure ||
    // CREATE mode: require geographic coverage
    (isEditMode === false && !hasGeographicCoverage) ||
    // EDIT mode: disable if geographic coverage was removed
    (isEditMode === true && geographicCoverageRemoved) ||
    // EDIT mode: disable if no changes (button should be enabled when there ARE changes)
    (isEditMode === true && !hasUnsavedBasicInfoChanges);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-auto">
        <div className="w-full px-4 py-6">
          {/* Simplified Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isEditMode ? 'Edit Product' : 'Create Product'}
              </h1>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              {/* Simplified Basic Information */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                    <Button
                      type="button"
                      onClick={handleSaveBasicInfo}
                      className="gap-2"
                      disabled={shouldDisableButton}
                      variant={shouldShowSavedState ? 'outline' : 'default'}
                      size="sm"
                    >
                      <Save className="w-4 h-4" />
                      {isLoading ? 'Saving...' : shouldShowSavedState ? 'Saved' : 'Save'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="productName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Product Name <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Contractors All Risk Insurance"
                                value={field.value || ''}
                                onChange={(e) => {
                                  setHasNameEdited(true);
                                  field.onChange(e);
                                  // setIsBasicInfoSaved(false); // Removed to prevent hiding Product Configuration in edit mode
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="productCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Product Code</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Auto-generated from name (editable)"
                                value={field.value || ''}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Category <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  // setFormData((prev) => ({ ...prev, category: value }));
                                  // setIsBasicInfoSaved(false); // Removed to prevent hiding Product Configuration in edit mode
                                }}
                                value={field.value || ''}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                      {cat.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Currency</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  // setFormData((prev) => ({ ...prev, currency: value }));
                                  // setIsBasicInfoSaved(false); // Removed to prevent hiding Product Configuration in edit mode
                                }}
                                value={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                  {currencies.map((curr) => (
                                    <SelectItem key={curr.value} value={curr.value}>
                                      {curr.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-2 mt-2">
                      <FormField
                        control={form.control}
                        name="owner"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Owner <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  // setFormData((prev) => ({ ...prev, owner: value }));
                                  // setIsBasicInfoSaved(false); // Removed to prevent hiding Product Configuration in edit mode
                                }}
                                value={field.value || ''}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select owner" />
                                </SelectTrigger>
                                <SelectContent>
                                  {owners.map((owner) => (
                                    <SelectItem key={owner.value} value={owner.value}>
                                      {owner.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-2 mt-2">
                      <FormField
                        control={form.control}
                        name="validityStartDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Validity Start Date <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value ? format(field.value, 'yyyy-MM-dd') : undefined}
                                onChange={(dateString) => {
                                  if (dateString) {
                                    field.onChange(new Date(dateString));
                                    // setIsBasicInfoSaved(false); // Removed to prevent hiding Product Configuration in edit mode
                                  }
                                }}
                                min={format(new Date(), 'yyyy-MM-dd')}
                                placeholder="Pick a date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-2 mt-2">
                      <FormField
                        control={form.control}
                        name="validityEndDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Validity End Date <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value ? format(field.value, 'yyyy-MM-dd') : undefined}
                                onChange={(dateString) => {
                                  if (dateString) {
                                    field.onChange(new Date(dateString));
                                    // setIsBasicInfoSaved(false); // Removed to prevent hiding Product Configuration in edit mode
                                  }
                                }}
                                min={
                                  watchedStartDate
                                    ? format(
                                        new Date(watchedStartDate.getTime() + 86400000),
                                        'yyyy-MM-dd',
                                      )
                                    : undefined
                                }
                                disabled={!watchedStartDate}
                                placeholder="Pick a date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-2 mt-2">
                      <FormField
                        control={form.control}
                        name="autoActivation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Auto Activation</FormLabel>
                            <FormControl>
                              <div className="flex flex-row items-center justify-between rounded-md border border-input bg-transparent px-3 shadow-sm h-10 w-full">
                                <span className="text-sm text-muted-foreground">
                                  {field.value ? 'Active' : 'Inactive'}
                                </span>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-2 mt-2">
                      <FormField
                        control={form.control}
                        name="cartLikeCoverSelection"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Cart Like Coverage</FormLabel>
                            <FormControl>
                              <div className="flex flex-row items-center justify-between rounded-md border border-input bg-transparent px-3 shadow-sm h-10 w-full">
                                <span className="text-sm text-muted-foreground">
                                  {field.value ? 'Enabled' : 'Disabled'}
                                </span>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-2 mt-2">
                      <FormLabel className="text-gray-700">
                        Quote Validity <span className="text-destructive">*</span>
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormField
                          control={form.control}
                          name="validityPeriod"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const { value } = e.target;
                                    field.onChange(value === '' ? '' : Number(value));
                                  }}
                                  onKeyDown={(e) => {
                                    if (
                                      e.key === '-' ||
                                      e.key === '+' ||
                                      e.key === 'e' ||
                                      e.key === 'E'
                                    ) {
                                      e.preventDefault();
                                    }
                                  }}
                                  placeholder="Duration"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="validityPeriodUnit"
                          render={({ field }) => (
                            <FormItem className="w-[140px]">
                              <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Unit" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="days">Days</SelectItem>
                                    <SelectItem value="months">Months</SelectItem>
                                    <SelectItem value="years">Years</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 mt-2">
                      <FormLabel className="text-gray-700">
                        Policy Duration <span className="text-destructive">*</span>
                      </FormLabel>
                      <div className="flex gap-2">
                        <FormField
                          control={form.control}
                          name="policyValidityPeriod"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const { value } = e.target;
                                    field.onChange(value === '' ? '' : Number(value));
                                  }}
                                  onKeyDown={(e) => {
                                    if (
                                      e.key === '-' ||
                                      e.key === '+' ||
                                      e.key === 'e' ||
                                      e.key === 'E'
                                    ) {
                                      e.preventDefault();
                                    }
                                  }}
                                  placeholder="Duration"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="policyValidityPeriodUnit"
                          render={({ field }) => (
                            <FormItem className="w-[140px]">
                              <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Unit" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="days">Days</SelectItem>
                                    <SelectItem value="months">Months</SelectItem>
                                    <SelectItem value="years">Years</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 mt-2">
                      <FormLabel className="text-gray-700">Customer Template</FormLabel>
                      <div className="flex flex-col gap-2">
                        {selectedCustomerTemplateId ? (
                          <div className="flex items-center justify-between gap-3 rounded-md border border-input bg-muted/20 px-3 py-2">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <LayoutTemplate className="h-4 w-4 flex-shrink-0 text-primary" />
                              <div className="min-w-0 flex-1">
                                <div className="flex min-w-0 items-center gap-2">
                                  <TooltipProvider delayDuration={200}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                                          {selectedCustomerTemplateName}
                                        </p>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs break-words">
                                        {selectedCustomerTemplateName}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                    {customerTemplateCategoryMap[
                                      selectedCustomerTemplateCategory
                                    ] || selectedCustomerTemplateCategory}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 shrink-0 px-2 text-muted-foreground"
                              onClick={handleClearCustomerTemplate}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-fit gap-2"
                            onClick={handleOpenCustomerTemplateDialog}
                          >
                            <LayoutTemplate className="h-4 w-4" />
                            Customer Template
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2 lg:col-span-3 xl:col-span-4">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">
                              Description of the product
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the product, coverage scope, audience, or notes"
                                value={field.value || ''}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // setIsBasicInfoSaved(false); // Removed to prevent hiding Product Configuration in edit mode
                                }}
                                className="min-h-24"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Product Structure moved into Basic Information */}
                  <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 mt-6">
                    <div className="flex gap-4 py-3 px-4 rounded-lg border border-border bg-card">
                      <div className="w-48 flex-shrink-0 flex items-center">
                        <h3 className="text-sm font-semibold text-foreground">Product Structure</h3>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={productStructureMode === 'single' ? 'default' : 'outline'}
                              onClick={() => {
                                if (productStructureMode === 'multi') {
                                  multiCoverSectionsBackupRef.current =
                                    cloneProductStructureSections(productStructureSections);
                                }
                                setProductStructureMode('single');
                                markCoversDirty();
                                setProductStructureSections((prev) =>
                                  normalizeToSingleCoverSections(prev),
                                );
                              }}
                            >
                              Single Cover
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={productStructureMode === 'multi' ? 'default' : 'outline'}
                              onClick={() => {
                                setProductStructureMode('multi');
                                markCoversDirty();
                                const backup = multiCoverSectionsBackupRef.current;
                                if (backup != null && backup.length > 0) {
                                  setProductStructureSections(
                                    cloneProductStructureSections(backup),
                                  );
                                }
                              }}
                            >
                              Multi Cover
                            </Button>
                          </div>
                          {productStructureMode === 'multi' && (
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddProductStructureSection}
                                className="gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add Section
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleOpenImportDialog}
                                className="gap-1.5"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Import Product
                              </Button>
                            </div>
                          )}
                        </div>

                        <>
                          {productStructureSections.length === 0 ? (
                            productStructureMode === 'multi' ? (
                              <div className="text-center py-6 border-2 border-dashed rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                  No sections created yet. Use the buttons above to get started.
                                </p>
                              </div>
                            ) : (
                              <div className="text-center py-6 border-2 border-dashed rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                  Preparing default section and cover…
                                </p>
                              </div>
                            )
                          ) : (
                            <DndContext
                              sensors={coverDragSensors}
                              collisionDetection={closestCenter}
                              onDragEnd={handleProductStructureDragEnd}
                            >
                              <div className="space-y-3">
                                {productStructureSections.map((section) => (
                                  <div
                                    key={section.id}
                                    className="border rounded-lg p-4 bg-muted/30"
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2 flex-1">
                                        {editingSectionId === section.id ? (
                                          <Input
                                            value={editingSectionTitle}
                                            onChange={(e) => setEditingSectionTitle(e.target.value)}
                                            onBlur={() => {
                                              if (editingSectionTitle.trim()) {
                                                handleUpdateSectionTitle(
                                                  section.id,
                                                  editingSectionTitle.trim(),
                                                );
                                              }
                                              setEditingSectionId(null);
                                              setEditingSectionTitle('');
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.currentTarget.blur();
                                              }
                                              if (e.key === 'Escape') {
                                                setEditingSectionId(null);
                                                setEditingSectionTitle('');
                                              }
                                            }}
                                            className="h-8 font-semibold"
                                            autoFocus
                                          />
                                        ) : (
                                          <>
                                            <Folder className="w-4 h-4 text-primary" />
                                            <h4 className="font-semibold text-base">
                                              {section.title}
                                            </h4>
                                          </>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setEditingSectionId(section.id);
                                            setEditingSectionTitle(section.title);
                                          }}
                                          className="h-7 w-7 p-0 text-muted-foreground hover:bg-primary hover:text-white"
                                          aria-label="Edit section name"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </Button>
                                        {productStructureMode === 'multi' && (
                                          <>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleOpenAddCoverDialog(section.id)}
                                              className="gap-1 text-xs"
                                            >
                                              <Plus className="w-3 h-3" />
                                              Add Cover
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                setDeleteSectionConfirm({
                                                  open: true,
                                                  sectionId: section.id,
                                                })
                                              }
                                              className="text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {section.covers.length > 0 ? (
                                      <SortableContext
                                        items={section.covers.map((cover) => cover.id)}
                                        strategy={verticalListSortingStrategy}
                                      >
                                        <div className="space-y-1.5 mt-3">
                                          {section.covers.map((cover) => (
                                            <SortableCoverRow
                                              key={cover.id}
                                              id={cover.id}
                                              disabled={section.covers.length < 2}
                                            >
                                              {(dragAttributes, dragListeners) => (
                                                  <div
                                                    className="group flex items-center justify-between w-full px-3 py-2 rounded-lg border bg-background hover:bg-accent/30 transition-colors"
                                                  >
                                                    <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                                                      {section.covers.length > 1 && (
                                                        <div
                                                          {...dragAttributes}
                                                          {...dragListeners}
                                                          className="cursor-grab active:cursor-grabbing flex-shrink-0"
                                                        >
                                                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                                                        </div>
                                                      )}
                                                      <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                                                      {editingCoverId === cover.id ? (
                                                        <Input
                                                          value={editingCoverTitle}
                                                          onChange={(e) =>
                                                            setEditingCoverTitle(e.target.value)
                                                          }
                                                          onBlur={() => {
                                                            if (editingCoverTitle.trim()) {
                                                              handleUpdateCoverTitle(
                                                                section.id,
                                                                cover.id,
                                                                editingCoverTitle.trim(),
                                                              );
                                                            }
                                                            setEditingCoverId(null);
                                                            setEditingCoverTitle('');
                                                          }}
                                                          onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                              e.currentTarget.blur();
                                                            }
                                                            if (e.key === 'Escape') {
                                                              setEditingCoverId(null);
                                                              setEditingCoverTitle('');
                                                            }
                                                          }}
                                                          className="h-7 text-sm font-medium w-48"
                                                          autoFocus
                                                        />
                                                      ) : (
                                                        <>
                                                          <span className="text-sm font-medium text-foreground truncate">
                                                            {cover.title}
                                                          </span>
                                                          <button
                                                            type="button"
                                                            className="p-1 rounded-md hover:bg-primary text-muted-foreground hover:text-white transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                                                            onClick={() => {
                                                              setEditingCoverId(cover.id);
                                                              setEditingCoverTitle(cover.title);
                                                            }}
                                                            aria-label="Edit cover name"
                                                          >
                                                            <Edit className="w-3.5 h-3.5" />
                                                          </button>
                                                          {/* {cover.createdAt && (
                                                    <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
                                                      {new Date(cover.createdAt).toLocaleDateString()}
                                                    </span>
                                                  )} */}
                                                        </>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center gap-4 flex-shrink-0">
                                                      <div className="flex items-center gap-1.5">
                                                        {cover.ratingStructureDone ? (
                                                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                        ) : (
                                                          <Clock className="w-3.5 h-3.5 text-yellow-500" />
                                                        )}
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                          Rating Structure
                                                        </span>
                                                      </div>
                                                      <div className="flex items-center gap-1.5">
                                                        {cover.reinsuranceSetupDone ? (
                                                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                        ) : (
                                                          <Clock className="w-3.5 h-3.5 text-yellow-500" />
                                                        )}
                                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                          Reinsurance Setup
                                                        </span>
                                                      </div>
                                                      {(() => {
                                                        const assignedRcLabel =
                                                          getAssignedRcLabel(cover);
                                                        const hasStaleAssignment = Boolean(
                                                          cover.riskCategorisationId ||
                                                          cover.riskCategoryId,
                                                        );
                                                        if (
                                                          !assignedRcLabel &&
                                                          !hasStaleAssignment
                                                        ) {
                                                          return (
                                                            <button
                                                              type="button"
                                                              className="text-xs text-muted-foreground hover:text-primary underline transition-colors whitespace-nowrap"
                                                              onClick={() =>
                                                                openAssignRcDialog(cover.id)
                                                              }
                                                            >
                                                              Assign Risk Category
                                                            </button>
                                                          );
                                                        }

                                                        const chipLabel =
                                                          assignedRcLabel ??
                                                          'Risk Category Deleted';

                                                        return (
                                                          <div className="inline-flex items-center rounded-full border bg-muted/40 px-2 py-0.5 text-xs text-foreground">
                                                            <button
                                                              type="button"
                                                              className="whitespace-nowrap hover:text-primary transition-colors"
                                                              onClick={() =>
                                                                openAssignRcDialog(cover.id)
                                                              }
                                                            >
                                                              {chipLabel}
                                                            </button>
                                                            <button
                                                              type="button"
                                                              className="ml-1 rounded-full p-0.5 text-muted-foreground hover:text-destructive hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200 transition-colors"
                                                              onClick={() =>
                                                                handleClearCoverRiskCategory(
                                                                  cover.id,
                                                                )
                                                              }
                                                              aria-label="Remove risk category"
                                                            >
                                                              <X className="w-3 h-3" />
                                                            </button>
                                                          </div>
                                                        );
                                                      })()}

                                                      {productStructureMode === 'multi' && (
                                                        <button
                                                          type="button"
                                                          className="p-1 rounded-md hover:bg-red-500/10 hover:backdrop-blur-sm hover:text-red-500 transition-all duration-200 text-muted-foreground hover:text-destructive transition-colors"
                                                          onClick={() =>
                                                            setDeleteCoverConfirm({
                                                              open: true,
                                                              sectionId: section.id,
                                                              coverId: cover.id,
                                                            })
                                                          }
                                                        >
                                                          <X className="w-3.5 h-3.5" />
                                                        </button>
                                                      )}
                                                    </div>
                                                  </div>
                                              )}
                                            </SortableCoverRow>
                                          ))}
                                        </div>
                                      </SortableContext>
                                    ) : (
                                      <div className="text-xs text-muted-foreground text-center py-2">
                                        No covers in this section
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </DndContext>
                          )}
                        </>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
                    <div className="border-t pt-6">
                      <Accordion
                        type="single"
                        collapsible
                        defaultValue={isEditMode ? undefined : 'geographic-coverage'}
                        className="w-full"
                      >
                        <AccordionItem value="geographic-coverage">
                          <AccordionTrigger className="text-lg font-semibold">
                            <span className="text-lg font-semibold mb-4 flex items-center gap-2">
                              <MapPin className="w-5 h-5" />
                              Geographic Coverage
                            </span>
                          </AccordionTrigger>

                          <AccordionContent className="pt-4">
                            {mastersError && (
                              <div className="text-sm rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2 mb-4">
                                {mastersError}
                              </div>
                            )}

                            {mastersLoading ? (
                              <div className="space-y-2">
                                <div className="h-8 bg-muted rounded w-full animate-pulse" />
                                <div className="h-8 bg-muted rounded w-full animate-pulse" />
                                <div className="h-8 bg-muted rounded w-full animate-pulse" />
                              </div>
                            ) : (
                              <GeographicCoverage
                                countries={countries}
                                regions={regions}
                                zones={zones}
                                selectedCountries={selectedCountryIds}
                                selectedRegions={selectedRegionIds}
                                selectedZones={selectedZoneIds}
                                onCountriesChange={(ids) => {
                                  setSelectedCountryIds(ids);
                                  syncGeographicFormField('countries', ids);
                                }}
                                onRegionsChange={(ids) => {
                                  setSelectedRegionIds(ids);
                                  syncGeographicFormField('regions', ids);
                                }}
                                onZonesChange={(ids) => {
                                  setSelectedZoneIds(ids);
                                  syncGeographicFormField('zones', ids);
                                }}
                                required
                                showTitle={false}
                                countriesError={
                                  selectedCountryIds.length === 0
                                    ? form.formState.errors.countries?.message
                                    : undefined
                                }
                                regionsError={
                                  selectedCountryIds.length > 0 &&
                                  selectedRegionIds.length === 0 &&
                                  !form.formState.errors.countries
                                    ? form.formState.errors.regions?.message
                                    : undefined
                                }
                                zonesError={
                                  selectedCountryIds.length > 0 &&
                                  selectedRegionIds.length > 0 &&
                                  selectedZoneIds.length === 0 &&
                                  !form.formState.errors.countries &&
                                  !form.formState.errors.regions
                                    ? form.formState.errors.zones?.message
                                    : undefined
                                }
                              />
                            )}

                            {/* Edit mode: Show error if geographic coverage was removed */}
                            {isEditMode && geographicCoverageRemoved && (
                              <div className="text-sm text-destructive space-y-1 mt-4 p-3 border border-destructive/20 bg-destructive/10 rounded-md">
                                <p className="font-semibold">
                                  Geographic coverage cannot be removed
                                </p>
                                {initialCountryIds.length > 0 &&
                                  selectedCountryIds.length === 0 && (
                                    <p>
                                      • Please select at least one country (previously had{' '}
                                      {initialCountryIds.length} selected)
                                    </p>
                                  )}
                                {initialRegionIds.length > 0 && selectedRegionIds.length === 0 && (
                                  <p>
                                    • Please select at least one region (previously had{' '}
                                    {initialRegionIds.length} selected)
                                  </p>
                                )}
                                {initialZoneIds.length > 0 && selectedZoneIds.length === 0 && (
                                  <p>
                                    • Please select at least one zone (previously had{' '}
                                    {initialZoneIds.length} selected)
                                  </p>
                                )}
                              </div>
                            )}

                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Simplified Provisions Section */}
              {!isBasicInfoSaved && (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <p>Please save Basic Information first to configure product provisions</p>
                  </CardContent>
                </Card>
              )}
              {isBasicInfoSaved && (
                <>
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Product Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Forms & Data */}
                        <div className="flex gap-4 py-3 px-4 rounded-lg border border-border bg-card">
                          <div className="w-48 flex-shrink-0 flex items-center">
                            <h3 className="text-sm font-semibold text-foreground">
                              Forms &amp; Data
                            </h3>
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {configItems
                              .filter((item) =>
                                [
                                  'proposalFormDesign',
                                  'additionalInformationDesign',
                                  'mastersManagement',
                                  'workflowManagement',
                                  'authorityMatrix',
                                  'premiumAdditives',
                                ].includes(item.provisionKey),
                              )
                              .map((item) => renderConfigButton(item))}
                          </div>
                        </div>

                        {/* Pricing Engine */}
                        <div className="flex gap-4 py-3 px-4 rounded-lg border border-border bg-card">
                          <div className="w-48 flex-shrink-0 flex items-center">
                            <h3 className="text-sm font-semibold text-foreground">
                              Pricing Engine
                            </h3>
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {configItems
                              .filter((item) =>
                                ['ratingConfiguratorDesign', 'coverreinsurancesetup'].includes(
                                  item.provisionKey,
                                ),
                              )
                              .map((item) => renderConfigButton(item))}
                          </div>
                        </div>

                        {/* Channels & Commissions */}
                        <div className="flex gap-4 py-3 px-4 rounded-lg border border-border bg-card">
                          <div className="w-48 flex-shrink-0 flex items-center">
                            <h3 className="text-sm font-semibold text-foreground">
                              Channels &amp; Commissions
                            </h3>
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {configItems
                              .filter((item) =>
                                ['distributionChannel', 'rateManagement', 'marketability'].includes(
                                  item.provisionKey,
                                ),
                              )
                              .map((item) => renderConfigButton(item))}
                          </div>
                        </div>

                        {/* Reports and Integrations */}
                        <div className="flex gap-4 py-3 px-4 rounded-lg border border-border bg-card">
                          <div className="w-48 flex-shrink-0 flex items-center">
                            <h3 className="text-sm font-semibold text-foreground">
                              Reports and Integrations
                            </h3>
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {configItems
                              .filter((item) =>
                                ['documentDesign', 'notifications', 'b2cHandling'].includes(
                                  item.provisionKey,
                                ),
                              )
                              .map((item) => renderConfigButton(item))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Dialog open={isAddCoverDialogOpen} onOpenChange={handleCloseAddCoverDialog}>
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>Add Cover to Section</DialogTitle>
                        <DialogDescription>
                          Enter a title for the new cover in this section.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <FormLabel className="text-gray-700">Cover Title</FormLabel>
                          <Input
                            autoFocus
                            placeholder="Enter cover title (e.g., Fire & Theft, Third Party Liability)"
                            value={newCoverTitle}
                            onChange={(e) => setNewCoverTitle(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => handleCloseAddCoverDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={handleAddCoverToSection}
                          disabled={!newCoverTitle.trim()}
                        >
                          + Add Cover
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog
                    open={isImportProductStructureDialogOpen}
                    onOpenChange={(open) => {
                      setIsImportProductStructureDialogOpen(open);
                      if (!open) {
                        setImportProductStructureSearch('');
                      }
                    }}
                  >
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Import Product Structure</DialogTitle>
                        <DialogDescription>
                          Select a product to import its sections and covers structure
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-foreground">Search Products</div>
                          <Input
                            placeholder="Search by product name, category, or version..."
                            value={importProductStructureSearch}
                            onChange={(e) => setImportProductStructureSearch(e.target.value)}
                          />
                        </div>
                        {importProductLoading ? (
                          <div className="py-8 text-center text-sm text-muted-foreground">
                            Loading products...
                          </div>
                        ) : (
                          (() => {
                            const filtered = importProductList.filter((p) => {
                              const q = importProductStructureSearch.toLowerCase();
                              return (
                                !q ||
                                p.name.toLowerCase().includes(q) ||
                                p.category.toLowerCase().includes(q) ||
                                String(p.version).toLowerCase().includes(q)
                              );
                            });
                            return filtered.length === 0 ? (
                              <div className="py-8 text-center text-sm text-muted-foreground">
                                No products found
                              </div>
                            ) : (
                              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                                {filtered.map((p) => {
                                  const isSelected = selectedImportProductId === p.id;
                                  return (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() =>
                                        setSelectedImportProductId(isSelected ? null : p.id)
                                      }
                                      className={[
                                        'w-full text-left px-4 py-3 rounded-lg border transition-colors',
                                        isSelected
                                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                          : 'border-border hover:bg-muted/50',
                                      ].join(' ')}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          {isSelected ? (
                                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                                          ) : (
                                            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                                          )}
                                          <div>
                                            <p className="text-sm font-medium text-foreground">
                                              {p.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {p.category} · v{p.version}
                                            </p>
                                          </div>
                                        </div>
                                        <span
                                          className={[
                                            'text-xs px-2 py-0.5 rounded-full font-medium',
                                            p.status === 'Active'
                                              ? 'bg-green-100 text-green-700'
                                              : p.status === 'Draft'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-muted text-muted-foreground',
                                          ].join(' ')}
                                        >
                                          {p.status}
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })()
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => setIsImportProductStructureDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={handleImportProductStructure}
                          disabled={!selectedImportProductId || isImporting}
                          className="gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          {isImporting ? 'Importing...' : 'Import Structure'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              {/* Product Structure dialogs (always mounted so buttons work before save) */}
              <Dialog open={isAddCoverDialogOpen} onOpenChange={handleCloseAddCoverDialog}>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Add Cover to Section</DialogTitle>
                    <DialogDescription>
                      Enter a title for the new cover in this section.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <FormLabel className="text-gray-700">Cover Title</FormLabel>
                      <Input
                        autoFocus
                        placeholder="Enter cover title (e.g., Fire & Theft, Third Party Liability)"
                        value={newCoverTitle}
                        onChange={(e) => setNewCoverTitle(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => handleCloseAddCoverDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleAddCoverToSection}
                      disabled={!newCoverTitle.trim()}
                    >
                      + Add Cover
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog
                open={isCustomerTemplateDialogOpen}
                onOpenChange={(open) => {
                  setIsCustomerTemplateDialogOpen(open);
                  if (!open) {
                    setSelectedCustomerTemplateForDialog(
                      selectedCustomerTemplateId
                        ? {
                            id: selectedCustomerTemplateId,
                            name: selectedCustomerTemplateName || 'Selected Template',
                            customerCategory: selectedCustomerTemplateCategory,
                            createdAt: '',
                          }
                        : null,
                    );
                  }
                }}
              >
                <DialogContent className="max-w-5xl">
                  <DialogHeader>
                    <DialogTitle>Customer Template</DialogTitle>
                    <DialogDescription>
                      Choose a category from the left and then select a customer template.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
                    <div className="rounded-lg bg-muted/30 p-4">
                      <div className="space-y-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          Categories
                        </span>
                        {customerTemplateCategories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            className={cn(
                              'w-full rounded-lg p-3 text-left transition-all flex items-center justify-between',
                              selectedCustomerTemplateCategory === category.id
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'text-foreground hover:bg-muted/50',
                            )}
                            onClick={() => {
                              setSelectedCustomerTemplateCategory(category.id);
                              setSelectedCustomerTemplateForDialog(null);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-sm">{category.name}</span>
                            </div>
                            <ChevronRight
                              className={cn(
                                'w-4 h-4',
                                selectedCustomerTemplateCategory === category.id
                                  ? 'text-primary-foreground/80'
                                  : 'text-muted-foreground',
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="min-h-[360px] space-y-3">
                      <span className="text-sm font-medium text-muted-foreground">Templates</span>
                      {customerTemplateCategories.length === 0 ? (
                        <Card>
                          <CardContent className="p-10 text-center text-muted-foreground">
                            No customer template categories found.
                          </CardContent>
                        </Card>
                      ) : isCustomerTemplatesLoading ? (
                        <div className="flex h-full items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : customerTemplates.length === 0 ? (
                        <Card>
                          <CardContent className="p-10 text-center text-muted-foreground">
                            No templates found for this category.
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {customerTemplates.map((template) => {
                            const isSelected =
                              selectedCustomerTemplateForDialog?.id === template.id;
                            return (
                              <Card
                                key={template.id}
                                className={cn(
                                  'w-full cursor-pointer border-border/60 transition-all hover:shadow-md',
                                  isSelected &&
                                    'border-primary/40 bg-primary/5 shadow-lg ring-2 ring-primary/30',
                                )}
                                onClick={() => setSelectedCustomerTemplateForDialog(template)}
                              >
                                <CardContent className="p-4">
                                  <div className="mb-3 flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-2">
                                      <LayoutTemplate className="h-4 w-4 shrink-0 text-primary" />
                                      <h4 className="truncate font-semibold text-foreground">
                                        {template.name}
                                      </h4>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {template.fields?.length ? (
                                      template.fields.map((field, index) => (
                                        <div
                                          key={`${template.id}-${field.name}-${index}`}
                                          className="inline-flex max-w-full items-center gap-1 rounded-full border bg-muted/40 px-2.5 py-1 text-xs text-foreground"
                                        >
                                          {field.isLocked ? (
                                            <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                                          ) : null}
                                          <span className="truncate">
                                            {formatTemplateFieldName(field.name)}
                                          </span>
                                        </div>
                                      ))
                                    ) : (
                                      <span className="text-sm text-muted-foreground">
                                        No fields configured.
                                      </span>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCustomerTemplateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSelectCustomerTemplate}
                      disabled={!selectedCustomerTemplateForDialog}
                    >
                      Select Template
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Assign Risk Category Dialog */}
              <Dialog
                open={!!assignRcDialogCoverId}
                onOpenChange={(v) => !v && closeAssignRcDialog()}
              >
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Assign Risk Category</DialogTitle>
                    <DialogDescription>
                      Link this cover to a risk categorisation and category.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <FormLabel>Risk Categorisation</FormLabel>
                      <Select
                        value={assignRcStep1}
                        onValueChange={(value) => {
                          setAssignRcStep1(value);
                          setAssignRcStep2('');
                        }}
                      >
                        <SelectTrigger id="risk-categorisation" className="col-span-3">
                          <SelectValue placeholder="Select a categorisation" />
                        </SelectTrigger>
                        <SelectContent>
                          {riskCategorisations.map((rc) => (
                            <SelectItem key={rc.id} value={rc.id}>
                              {rc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {step1SelectedRc && (
                      <div className="space-y-2">
                        <FormLabel>Risk Category</FormLabel>
                        <Select value={assignRcStep2} onValueChange={setAssignRcStep2}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(step1SelectedRc.riskCategories ?? []).map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={closeAssignRcDialog}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSaveRcAssignment}
                      disabled={!assignRcStep1 || !assignRcStep2}
                    >
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog
                open={isImportProductStructureDialogOpen}
                onOpenChange={(open) => {
                  setIsImportProductStructureDialogOpen(open);
                  if (!open) {
                    setImportProductStructureSearch('');
                  }
                }}
              >
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Import Product Structure</DialogTitle>
                    <DialogDescription>
                      Select a product to import its sections and covers structure
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">Search Products</div>
                      <Input
                        placeholder="Search by product name, category, or version..."
                        value={importProductStructureSearch}
                        onChange={(e) => setImportProductStructureSearch(e.target.value)}
                      />
                    </div>
                    {importProductLoading ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        Loading products...
                      </div>
                    ) : (
                      (() => {
                        const filtered = importProductList.filter((p) => {
                          const q = importProductStructureSearch.toLowerCase();
                          return (
                            !q ||
                            p.name.toLowerCase().includes(q) ||
                            p.category.toLowerCase().includes(q) ||
                            String(p.version).toLowerCase().includes(q)
                          );
                        });
                        return filtered.length === 0 ? (
                          <div className="py-8 text-center text-sm text-muted-foreground">
                            No products found
                          </div>
                        ) : (
                          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                            {filtered.map((p) => {
                              const isSelected = selectedImportProductId === p.id;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedImportProductId(isSelected ? null : p.id)
                                  }
                                  className={[
                                    'w-full text-left px-4 py-3 rounded-lg border transition-colors',
                                    isSelected
                                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                      : 'border-border hover:bg-muted/50',
                                  ].join(' ')}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {isSelected ? (
                                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                                      ) : (
                                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                                      )}
                                      <div>
                                        <p className="text-sm font-medium text-foreground">
                                          {p.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {p.category} · v{p.version}
                                        </p>
                                      </div>
                                    </div>
                                    <span
                                      className={[
                                        'text-xs px-2 py-0.5 rounded-full font-medium',
                                        p.status === 'Active'
                                          ? 'bg-green-100 text-green-700'
                                          : p.status === 'Draft'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-muted text-muted-foreground',
                                      ].join(' ')}
                                    >
                                      {p.status}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setIsImportProductStructureDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleImportProductStructure}
                      disabled={!selectedImportProductId || isImporting}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {isImporting ? 'Importing...' : 'Import Structure'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Delete Section Confirmation */}
              <AlertDialog
                open={deleteSectionConfirm.open}
                onOpenChange={(open) => {
                  if (!open) setDeleteSectionConfirm({ open: false, sectionId: null });
                }}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Section</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this section? All covers within this section
                      will also be deleted. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleConfirmDeleteSection}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Delete Cover Confirmation */}
              <AlertDialog
                open={deleteCoverConfirm.open}
                onOpenChange={(open) => {
                  if (!open) setDeleteCoverConfirm({ open: false, sectionId: null, coverId: null });
                }}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Cover</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this cover? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleConfirmDeleteCover}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default CreateProduct;
