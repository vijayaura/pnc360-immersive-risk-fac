import React, {
  useState,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
  useLayoutEffect,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigationHistory } from '@/shared/hooks/use-navigation-history';
import * as LibUtils from '@/shared/utils/lib-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building,
  Calculator,
  Download,
  Eye,
  FileText,
  Loader2,
  MessageSquareWarning,
  Shield,
  X,
} from 'lucide-react';
import { CEWSelection, DeductibleOption } from './CEWSelection';
import { useToast } from '@/shared/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@tanstack/react-query';
import { createManualReferral } from '@/features/proposals/api/referrals';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { generateQuotePDF } from '@/shared/utils/pdfGenerator';
import { getProduct, type ProductSection } from '@/features/product-config/api/products';
import { type BrokerInsurersResponse, type BrokerInsurer } from '@/features/brokers/api/brokers';
import {
  type ProposalBundleResponse,
  type InsurerPricingConfigResponse,
  getInsurerPricingConfig,
  type PlanSelectionRequest,
  type QuotesComparisonAPIResponse,
  calculateQuoteRating,
  type QuotesComparisonInsurerConfig,
  type PremiumBreakdown,
  type CoverPremiumItem,
  type FeeType,
  createPricingSelections,
  acceptQuote,
} from '@/features/quotes/api/quotes';
import { getQuoteFormat } from '@/features/insurers/api/insurers';
import {
  calculateEndorsementPremium,
  selectEndorsementPremium,
  getEndorsementSelectedPremium,
  type SelectPremiumRequest,
  type EndorsementPremiumBreakdown,
  type SelectedPremiumSnapshot,
} from '@/lib/api/endorsements';
import { api } from '@/lib/api/client';
import { useQuoteSelectionStore } from '@/shared/stores/useQuoteSelectionStore';
import { usePlanSelectionStore } from '@/shared/stores/usePlanSelectionStore';
import { buildPremiumCalculationSummaryHtml } from '@/features/quotes/utils/premium-calculation-summary';

import {
  type RatingBreakdownItem,
  type InsurerValidationResult,
  type QuoteRow,
  type QuotesComparisonProps,
  type QuotesComparisonRef,
} from './QuotesComparison.types';
import {
  normalizeToQuotesComparisonConfig,
  generateRealQuotes,
  resolveBrokerCommissionMeta,
  resolveBrokerCommissionMetaFromPrefill,
} from './QuotesComparison.utils';
import { PremiumCalculationSummaryContent } from './PremiumCalculationSummaryContent';

const QuotesComparison = forwardRef<QuotesComparisonRef, QuotesComparisonProps>(
  function QuotesComparison(
    {
      assignedInsurers,
      currentProposal,
      insurerPricingConfigs,
      isLoadingPricingConfigs,
      onLoadPricingConfigs,
      onQuotesLoaded,
      productId,
      responseId,
      endorsementId,
      setSelectedQuoteId,
    },
    ref,
  ) {
    const searchParams = new URLSearchParams(location.search);
    const resumeParam = searchParams.get('resume');
    const isBrokerEndorsementProposalForm = window.location.pathname.startsWith(
      '/broker/endorsements/proposal/',
    );
    const handleSelectPlanWithAPIRef = useRef<
      ((quoteId: number, quoteOverride?: any) => Promise<void>) | null
    >(null);

    const [comparisonData, setComparisonData] = useState<QuotesComparisonAPIResponse | null>(null);
    const [internalAssignedInsurers, setInternalAssignedInsurers] =
      useState<BrokerInsurersResponse | null>(null);
    const [internalInsurerPricingConfigs, setInternalInsurerPricingConfigs] = useState<
      Record<number, any>
    >({});
    const [isLoadingComparison, setIsLoadingComparison] = useState(false);
    const [selectedQuotes, setSelectedQuotes] = useState<number[]>([]);
    const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false);
    const [showCEWDialog, setShowCEWDialog] = useState(false);
    const [extensionsDialogTab, setExtensionsDialogTab] = useState<'coverage' | 'addons'>(
      'coverage',
    );
    const [selectedQuoteForCEW, setSelectedQuoteForCEW] = useState<QuoteRow | null>(null);
    const [isPremiumSummaryDialogOpen, setIsPremiumSummaryDialogOpen] = useState(false);
    const [selectedQuoteForPremiumSummary, setSelectedQuoteForPremiumSummary] =
      useState<QuoteRow | null>(null);
    const [showPremiumSummaryFormulas, setShowPremiumSummaryFormulas] = useState(false);
    const [premiumAdjustment, setPremiumAdjustment] = useState(0);
    const [selectedDeductibleOption, setSelectedDeductibleOption] =
      useState<DeductibleOption | null>(null);
    const [currency, setCurrency] = useState('');
    const [productSections, setProductSections] = useState<ProductSection[]>([]);
    const [productType, setProductType] = useState<string>('');
    const [isDownloadingQuote, setIsDownloadingQuote] = useState(false);
    /** Endorsement revised-quote only: original vs revised premium breakdown from API */
    const [endorsementBreakdown, setEndorsementBreakdown] =
      useState<EndorsementPremiumBreakdown | null>(null);
    /** Endorsement: prefill for Extensions dialog from GET selected-premium (same shape as stored_plan_requests entry) */
    const [endorsementPrefill, setEndorsementPrefill] = useState<Record<string, unknown> | null>(
      null,
    );
    const [isCoverBreakdownDialogOpen, setIsCoverBreakdownDialogOpen] = useState(false);
    const [selectedQuoteForCoverBreakdown, setSelectedQuoteForCoverBreakdown] =
      useState<QuoteRow | null>(null);
    const [isCartLikeCoverSelection, setIsCartLikeCoverSelection] = useState(false);
    const [selectedCoversByQuote, setSelectedCoversByQuote] = useState<Record<number, Set<string>>>(
      {},
    );
    const [selectedUnitsByQuoteCover, setSelectedUnitsByQuoteCover] = useState<
      Record<number, Record<string, Set<string>>>
    >({});

    // Manual referral dialog state (broker-initiated referral for an auto-quoted plan)
    const [showRequestReferralDialog, setShowRequestReferralDialog] = useState(false);
    const [referralTargetQuote, setReferralTargetQuote] = useState<QuoteRow | null>(null);
    const [referralNote, setReferralNote] = useState('');
    // Optimistic set of quote ids whose manual referral POST has succeeded but
    // whose refreshed server-side status has not yet landed. Used to flip the
    // insurer card to "Referred to Underwriter" immediately on submit success,
    // avoiding a stale "Extensions" flash during the refetch round-trip.
    const [pendingReferralQuoteIds, setPendingReferralQuoteIds] = useState<Set<number>>(
      () => new Set<number>(),
    );
    // Version counter bumped on successful manual referral creation — drives a
    // re-fetch of the comparison data so quote.status flips to "referral"
    // server-side instead of being tracked in local state.
    const [comparisonVersion, setComparisonVersion] = useState(0);
    const isBrokerUser = useAuthStore((s) => s.isBroker());

    const closeReferralDialog = () => {
      setShowRequestReferralDialog(false);
      setReferralNote('');
      setReferralTargetQuote(null);
    };

    const requestReferralMutation = useMutation({
      mutationFn: createManualReferral,
      onSuccess: (res) => {
        // Capture the target quote id BEFORE closeReferralDialog() clears it,
        // so we can optimistically flip the card to "Referred to Underwriter"
        // while the comparison refetch is in flight.
        const submittedQuoteId = referralTargetQuote?.id;
        if (typeof submittedQuoteId === 'number') {
          setPendingReferralQuoteIds((prev) => {
            const next = new Set(prev);
            next.add(submittedQuoteId);
            return next;
          });
        }
        toast({
          title: 'Referral requested',
          description: `Referral ${res.referralId} has been sent to the underwriter.`,
        });
        closeReferralDialog();
        // Refetch comparison data so the row reflects the new REFERRAL status from the server
        setComparisonVersion((v) => v + 1);
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to request referral';
        console.error(
          '[requestReferralMutation] failed for quoteEvaluationId:',
          referralTargetQuote?.quoteEvaluationId,
          err,
        );
        toast({
          title: 'Error',
          description: msg,
          variant: 'destructive',
        });
      },
    });

    const handleOpenRequestReferralDialog = (quote: QuoteRow) => {
      setReferralTargetQuote(quote);
      setReferralNote('');
      setShowRequestReferralDialog(true);
    };

    const handleSubmitManualReferral = () => {
      if (!referralTargetQuote) return;
      const trimmedNote = referralNote.trim();
      if (!trimmedNote) return;
      const evaluationId = referralTargetQuote.quoteEvaluationId;
      const insurerOrgId = referralTargetQuote.insurerId
        ? String(referralTargetQuote.insurerId)
        : '';
      if (!evaluationId || !insurerOrgId) {
        toast({
          title: 'Cannot request referral',
          description: 'Missing identifiers on the selected plan.',
          variant: 'destructive',
        });
        console.error(
          '[handleSubmitManualReferral] Missing identifiers for quote id:',
          referralTargetQuote.id,
          { evaluationId, insurerOrgId },
        );
        return;
      }
      requestReferralMutation.mutate({
        quoteEvaluationId: evaluationId,
        insurerOrgId,
        note: trimmedNote,
        selectedCoverIds: isCartLikeCoverSelection
          ? Array.from(selectedCoversByQuote[referralTargetQuote.id] ?? [])
          : undefined,
      });
    };

    useEffect(() => {
      if (productId) {
        getProduct(String(productId))
          .then((product) => {
            setCurrency(product.currency || '');
            setProductSections(Array.isArray(product.sections) ? product.sections : []);
            setProductType((product as any)?.product_type || product.productType || '');
            setIsCartLikeCoverSelection(
              product.cartLikeCoverSelection ?? (product as any).cart_like_cover_selection ?? false,
            );
          })
          .catch((error) => {
            console.error('Error fetching product details:', error);
          });
      }
    }, [productId]);

    // Fetch comparison data from backend when responseId or endorsementId is available
    const fetchId = endorsementId ?? responseId;
    useEffect(() => {
      const resolvedProductId = typeof productId !== 'undefined' ? productId : 1;
      if (!fetchId) {
        return;
      }

      setIsLoadingComparison(true);
      const fetchRating = endorsementId
        ? calculateEndorsementPremium(endorsementId)
        : calculateQuoteRating(String(responseId!));
      fetchRating
        .then((data) => {
          const sourceInsurers = (data as any)?.insurers ?? (data as any)?.results ?? data;
          const insurersArray = Array.isArray(sourceInsurers)
            ? sourceInsurers
            : Object.values(sourceInsurers || {});
          const endorsementSnapshot = endorsementId
            ? ((data as { premiumSnapshot?: SelectedPremiumSnapshot }).premiumSnapshot ?? null)
            : null;
          const resolveEndorsementPremium = (item: any) => {
            if (!endorsementId) return item?.premium || null;
            const snapshotPremium =
              item?.premiumSnapshot?.premium ?? endorsementSnapshot?.premium ?? null;
            return Array.isArray(snapshotPremium?.covers) && snapshotPremium.covers.length > 0
              ? snapshotPremium
              : item?.premium || null;
          };
          const resolveEndorsementCoverageAmount = (item: any) => {
            if (!endorsementId) {
              return Number(item.coverage_amount || item.premium?.sumInsured || item.sumInsured || 0);
            }
            const snapshot = item?.premiumSnapshot || endorsementSnapshot || {};
            const snapshotPremium = snapshot?.premium || {};
            return Number(
              item.coverage_amount ||
                snapshot.sumInsured ||
                snapshotPremium.sumInsured ||
                item.premium?.sumInsured ||
                item.sumInsured ||
                0,
            );
          };
          const resolveEndorsementAnnualPremium = (item: any) => {
            if (!endorsementId) {
              return Number(item.annual_premium || item.premium?.total || item.totalPremium || 0);
            }
            const snapshot = item?.premiumSnapshot || endorsementSnapshot || {};
            const snapshotPremium = snapshot?.premium || {};
            return Number(
              item.annual_premium ||
                snapshot.totalPremium ||
                snapshotPremium.totalPremium ||
                snapshotPremium.total ||
                item.premium?.total ||
                item.totalPremium ||
                0,
            );
          };
          const mappedData: QuotesComparisonAPIResponse = {
            quote_id: data.quote_id || data.quoteId || '',
            product_id: data.product_id || data.productId || String(resolvedProductId),
            insurers: insurersArray.map((item: any) => ({
              insurer_id: String(item.insurer_id || item.insurerId),
              insurer_name: item.insurer_name || item.insurerName,
              status: item.status || 'quoted',
              annual_premium: resolveEndorsementAnnualPremium(item),
              coverage_amount: resolveEndorsementCoverageAmount(item),
              sum_insured: Number(
                item.sum_insured || resolveEndorsementCoverageAmount(item) || item.sumInsured || 0,
              ),
              premium: resolveEndorsementPremium(item),
              feeTypes: item.feeTypes || [],
              commissions: item.commissions || {},
              config: item.config || {
                tpl_limits: null,
                tpl_extensions: [],
                clause_pricing_config: [],
              },
              product_assigned_details: item.product_assigned_details || [],
              ratingBreakdown: item.ratingBreakdown || [],
              quoteEvaluationId: item.quoteEvaluationId || item.quote_evaluation_id || null,
            })),
          };

          setComparisonData(mappedData);
          if (endorsementId) {
            const firstInsurer = mappedData.insurers?.[0];
            const derivedOrgId =
              (firstInsurer as any)?.organizationId ??
              (firstInsurer as any)?.insurerOrganizationId ??
              firstInsurer?.insurer_id ??
              null;
            const normalizedOrgId =
              derivedOrgId == null
                ? null
                : typeof derivedOrgId === 'number'
                  ? derivedOrgId
                  : String(derivedOrgId);

            if (normalizedOrgId != null) {
              useQuoteSelectionStore.getState().setSelection({
                insurerId: normalizedOrgId,
                insurerOrganizationId: normalizedOrgId,
                productId: (productId as any) ?? null,
                responseId: (responseId as any) || null,
              });
              localStorage.setItem('selected_insurer_org_id', String(normalizedOrgId));
              localStorage.setItem('selected_insurer_id', String(normalizedOrgId));
            }
          }
          if (endorsementId && (data as any).breakdown) {
            setEndorsementBreakdown((data as any).breakdown as EndorsementPremiumBreakdown);
          } else {
            setEndorsementBreakdown(null);
          }

          // Map validation results from API
          const newValidationResults: Record<string, any> = {};
          mappedData.insurers.forEach((insurer) => {
            if (insurer.ratingBreakdown && insurer.ratingBreakdown.length > 0) {
              newValidationResults[String(insurer.insurer_id)] = {
                overallDecision:
                  insurer.status === 'auto_quote'
                    ? 'Auto Quote'
                    : insurer.status === 'referral'
                      ? 'Referral'
                      : 'No Quote',
                isEligible: insurer.status === 'auto_quote' || insurer.status === 'referral',
                basePremium: insurer.annual_premium,
                pricingDetails: null, // Initialize with null as we don't have this from API yet or need to map it
                premium: insurer.premium,
                feeTypes: insurer.feeTypes,
                commissions: insurer.commissions || {},
                ratingBreakdown: insurer.ratingBreakdown.map((vr) => ({
                  fieldId: vr.fieldId || Math.random().toString(36).substring(7),
                  fieldLabel: vr.fieldLabel,
                  category: vr.category,
                  proposalValue: vr.proposalValue,
                  configMatch: vr.configMatch || 'N/A',
                  pricingEffect: vr.pricingEffect,
                  decision: vr.decision,
                  componentType: vr.componentType || 'base',
                  sourceType: vr.sourceType || 'range_rule',
                  calculatedValue: vr.calculatedValue || 0,
                  amount: vr.amount || 0,
                  formula: vr.formula || '',
                })),
              };
              // Mark as validated to prevent client-side validation
              validationCompleted.current.add(String(insurer.insurer_id));
            }
          });

          if (Object.keys(newValidationResults).length > 0) {
            setInsurerValidationResults(newValidationResults);
          }

          // Notify parent that quotes are loaded
          if (onQuotesLoaded && mappedData.insurers && mappedData.insurers.length > 0) {
            onQuotesLoaded(true);
          }

          // Build internal assigned insurers structure
          const mappedInsurers = (mappedData.insurers || []).map((item) => ({
            insurer_id: item.insurer_id, // Keep as string or number
            insurer_name: item.insurer_name,
            status: item.status,
            products_assigned: 1,
            product_assigned_details: item.product_assigned_details.map((pad) => ({
              product_id: pad.product_id,
              product_name: 'CAR',
              product_type: 'CAR',
              description: 'Construction All Risks',
              is_assigned: true,
              quote_config: {
                backdate_days: pad.quote_config.backdate_days,
                operating_countries: pad.quote_config.operating_countries,
                operating_regions: pad.quote_config.operating_regions,
                operating_zones: pad.quote_config.operating_zones,
              },
            })),
          })) as any[];
          setInternalAssignedInsurers({
            broker: { id: 0, name: '' },
            insurers: mappedInsurers as any,
          });
          // Build internal pricing configs per insurer
          const pricingMap: Record<string, any> = {};
          (mappedData.insurers || []).forEach((item) => {
            pricingMap[String(item.insurer_id)] = {
              tpl_limits: item.config.tpl_limits,
              tpl_extensions: item.config.tpl_extensions,
              clause_pricing_config: item.config.clause_pricing_config,
            };
          });
          setInternalInsurerPricingConfigs(pricingMap);
        })
        .catch((error) => {
          console.error('❌ Failed to load comparison data:', error);
        })
        .finally(() => setIsLoadingComparison(false));
    }, [productId, responseId, endorsementId, fetchId, comparisonVersion]);

    // Helper function to download quote with format data
    const downloadQuoteWithFormat = async (proposal: ProposalBundleResponse) => {
      try {
        // Get insurer ID from the proposal bundle
        const insurerId = proposal.quote_meta?.insurer_id;
        if (!insurerId) {
          console.error('No insurer ID found in proposal bundle');
          generateQuotePDF(proposal); // Fallback to without format
          return;
        }

        // Fetch quote format data
        const quoteFormat = await getQuoteFormat(insurerId, 1); // Product ID is always 1

        // Generate PDF with quote format
        await generateQuotePDF(proposal, quoteFormat);
      } catch (error) {
        console.error('Error fetching quote format:', error);
        // Fallback to generate PDF without format
        generateQuotePDF(proposal);
      }
    };

    // Helper function to normalize geographic strings for comparison
    const normalizeGeographicString = (
      str: string | null | undefined | { name?: string; [key: string]: unknown },
    ): string => {
      // Handle null/undefined
      if (!str) return '';

      // Handle objects (e.g., { name: "Riyadh", country: "Saudi Arabia" })
      if (typeof str === 'object') {
        const name = str.name || str.label || str.value || '';
        str = String(name);
      }

      // Ensure it's a string
      const strValue = String(str);

      return strValue
        .toLowerCase() // Convert to lowercase
        .replace(/\s+/g, '') // Remove all spaces
        .replace(/[^a-z0-9]/g, '') // Remove special characters, keep only letters and numbers
        .trim(); // Remove any remaining whitespace
    };

    // Normalization helper functions
    const normalizeString = (str: string | null | undefined): string => {
      if (!str) return '';
      return str
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '');
    };

    const normalizeNumber = (value: unknown): number => {
      if (value === null || value === undefined || value === '') return 0;
      const num = parseFloat(String(value));
      return isNaN(num) ? 0 : num;
    };

    const normalizeBoolean = (value: unknown): boolean => {
      if (value === 0 || value === '0' || value === false || value === 'false') return false;
      if (value === 1 || value === '1' || value === true || value === 'true') return true;
      return Boolean(value);
    };

    const normalizePricingType = (pricingType: string | null | undefined): string => {
      if (!pricingType) return 'Percentage';
      const normalized = normalizeString(pricingType);
      if (['percentage', 'percentage%', 'loading', 'discount'].includes(normalized)) {
        return 'Percentage';
      }
      if (normalized === 'currency') {
        return 'currency';
      }
      if (['fixedamount', 'fixed_amount'].includes(normalized)) {
        return 'Fixed_Amount';
      }
      return 'Percentage'; // Default fallback
    };

    const isPercentagePricingType = (pricingType: string | null | undefined): boolean =>
      normalizeString(pricingType).includes('percent');

    const getDisplayPricingType = (
      pricingType: string | null | undefined,
    ): 'percentage' | 'fixed' => (isPercentagePricingType(pricingType) ? 'percentage' : 'fixed');

    const getOutboundPricingType = (pricingType: string | null | undefined): string => {
      const normalized = normalizeString(pricingType);
      if (normalized === 'currency') return 'currency';
      if (normalized === 'fixed' || normalized === 'fixedamount' || normalized === 'fixed_amount') {
        return 'fixed';
      }
      return 'percentage';
    };

    const isWithinRange = (value: number, from: number | null, to: number | null): boolean => {
      const fromValue = from === null ? -Infinity : from;
      const toValue = to === null ? Infinity : to;
      return value >= fromValue && value <= toValue;
    };

    // Calculate base premium from validation results
    const calculateBasePremium = (
      ratingBreakdown: RatingBreakdownItem[],
      proposal: any,
      insurerPricingConfig: any,
    ) => {
      const excludedFields = [
        'project_type',
        'project_value',
        'contract_works',
        'plant_and_equipment',
        'sum_insured',
        'temporary_works',
        'other_materials',
        'principals_property',
      ];

      // Filter out excluded fields and get pricing data
      const pricingFields = ratingBreakdown.filter(
        (result) => !excludedFields.includes(result.fieldLabel) && result.decision === 'Auto Quote',
      );

      // Group by pricing type
      const percentageFields = pricingFields.filter(
        (field) =>
          field.pricingEffect &&
          (field.pricingEffect.split(':')[0].trim().toLowerCase().includes('percentage') ||
            field.pricingEffect.split(':')[0].trim().toLowerCase().includes('percent')),
      );

      const fixedAmountFields = pricingFields.filter(
        (field) =>
          field.pricingEffect &&
          (field.pricingEffect.split(':')[0].trim().toLowerCase().includes('fixed') ||
            field.pricingEffect.split(':')[0].trim().toLowerCase().includes('amount')),
      );

      // Find the base rate from Sub Project Type
      const subProjectTypeField = percentageFields.find(
        (field) => field.fieldLabel === 'sub_project_type',
      );
      const baseRate = subProjectTypeField ? subProjectTypeField.calculatedValue : 0;

      // Get sum insured value
      const sumInsured = proposal.cover_requirements?.sum_insured || 0;

      // Populate base rate item details
      if (subProjectTypeField) {
        subProjectTypeField.amount = (sumInsured * baseRate) / 100;
        subProjectTypeField.formula = `${sumInsured} * (${baseRate} / 100)`;
      }

      // Calculate factors for all other percentage fields (excluding sub_project_type)
      const otherPercentageFields = percentageFields.filter(
        (field) => field.fieldLabel !== 'sub_project_type',
      );
      const factors = otherPercentageFields.map((field) => {
        const factor = 1 + field.calculatedValue / 100; // Convert percentage to decimal and add 1

        // Populate details
        field.formula = `Factor: ${factor.toFixed(4)} (1 + ${field.calculatedValue}/100)`;
        field.amount = 0; // Impact is multiplicative

        return factor;
      });

      // Populate fixed amount details
      fixedAmountFields.forEach((field) => {
        field.amount = field.calculatedValue;
        field.formula = `Fixed Amount: ${field.calculatedValue}`;
      });

      // Add mandatory clause pricing to factors
      const mandatoryClauseFactors: number[] = [];
      let mandatoryClauseFixedAmounts: number = 0;

      if (insurerPricingConfig?.clause_pricing_config) {
        insurerPricingConfig.clause_pricing_config.forEach((clause: any) => {
          if (clause.meta?.show_type === 'MANDATORY') {
            // Check if this clause has selected options in CEWSelection
            const selectedCEWItem = selectedCEWItems?.find(
              (item) => item.code === clause.clause_code,
            );

            let clausePricingValue = 0;
            let clausePricingType = 'PERCENTAGE';
            let isFactor = true;

            if (selectedCEWItem && selectedCEWItem.isSelected) {
              // Use selected option pricing if available
              if (selectedCEWItem.selectedOptionId) {
                const selectedOption = selectedCEWItem.options?.find(
                  (opt: any) => opt.id === selectedCEWItem.selectedOptionId,
                );
                if (selectedOption) {
                  clausePricingValue = selectedOption.value;
                  if (selectedOption.type === 'percentage') {
                    const clauseFactor = 1 + selectedOption.value / 100;
                    mandatoryClauseFactors.push(clauseFactor);
                    isFactor = true;
                  } else {
                    mandatoryClauseFixedAmounts += selectedOption.value;
                    isFactor = false;
                    clausePricingType = 'FIXED';
                  }
                } else {
                  // Fallback to base pricing
                  if (clause.pricing_type === 'PERCENTAGE') {
                    clausePricingValue = parseFloat(clause.pricing_value);
                    const clauseFactor = 1 + parseFloat(clause.pricing_value) / 100;
                    mandatoryClauseFactors.push(clauseFactor);
                    isFactor = true;
                  } else if (clause.pricing_type === 'CURRENCY') {
                    clausePricingValue = parseFloat(clause.pricing_value);
                    mandatoryClauseFixedAmounts += parseFloat(clause.pricing_value);
                    isFactor = false;
                    clausePricingType = 'FIXED';
                  }
                }
              } else {
                // No option selected, use base pricing
                if (clause.pricing_type === 'PERCENTAGE') {
                  clausePricingValue = parseFloat(clause.pricing_value);
                  const clauseFactor = 1 + parseFloat(clause.pricing_value) / 100;
                  mandatoryClauseFactors.push(clauseFactor);
                  isFactor = true;
                } else if (clause.pricing_type === 'CURRENCY') {
                  clausePricingValue = parseFloat(clause.pricing_value);
                  mandatoryClauseFixedAmounts += parseFloat(clause.pricing_value);
                  isFactor = false;
                  clausePricingType = 'FIXED';
                }
              }
            } else {
              // No CEW item found or not selected, use base pricing
              if (clause.pricing_type === 'PERCENTAGE') {
                clausePricingValue = parseFloat(clause.pricing_value);
                const clauseFactor = 1 + parseFloat(clause.pricing_value) / 100;
                mandatoryClauseFactors.push(clauseFactor);
                isFactor = true;
              } else if (clause.pricing_type === 'CURRENCY') {
                clausePricingValue = parseFloat(clause.pricing_value);
                mandatoryClauseFixedAmounts += parseFloat(clause.pricing_value);
                isFactor = false;
                clausePricingType = 'FIXED';
              }
            }

            // Create a rating item for this mandatory clause
            ratingBreakdown.push({
              fieldId: Math.random().toString(36).substring(7),
              fieldLabel: `Mandatory Clause: ${clause.clause_name || clause.clause_code}`,
              category: 'MANDATORY_CLAUSE',
              proposalValue: 'Included',
              configMatch: 'Mandatory',
              pricingEffect: `${clausePricingType}: ${clausePricingValue}`,
              decision: 'Auto Quote',
              componentType: 'mandatory_clause',
              sourceType: 'clause_config',
              calculatedValue: clausePricingValue,
              amount: isFactor ? 0 : clausePricingValue,
              formula: isFactor
                ? `Factor: ${1 + clausePricingValue / 100}`
                : `Fixed: ${clausePricingValue}`,
            });
          }
        });
      }

      // Combine regular factors with mandatory clause factors
      const allFactors = [...factors, ...mandatoryClauseFactors];

      // Calculate final percentage product: base_rate × factor1 × factor2 × ... × factorN
      let percentageProduct = baseRate / 100; // Convert base rate to decimal
      if (allFactors.length > 0) {
        percentageProduct = allFactors.reduce((acc, factor) => acc * factor, percentageProduct);
      }

      // Calculate SUM of fixed amount fields + mandatory clause fixed amounts
      const regularFixedAmounts = fixedAmountFields.reduce(
        (acc, field) => acc + field.calculatedValue,
        0,
      );
      const factorsSum = regularFixedAmounts + mandatoryClauseFixedAmounts;

      // Calculate base premium: (percentage_product * Sum insured) + SUM(fixedAmountFields)
      const calculatedBasePremium = percentageProduct * sumInsured + factorsSum;

      // Check minimum premium rates from insurer's product bundle
      let minimumPremiumRate = 0;
      let minimumPremiumMatch = null;

      if (insurerPricingConfig?.policy_limits_and_deductible?.minimum_premium_rates) {
        const projectType = proposal.project?.project_type;
        const subProjectType = proposal.project?.sub_project_type;

        // Find matching minimum premium rate
        const matchingRate =
          insurerPricingConfig.policy_limits_and_deductible.minimum_premium_rates.find(
            (rate: any) => {
              const configProjectType = normalizeString(rate.project_type);
              const configSubProjectType = normalizeString(rate.sub_project_type);
              const proposalProjectType = normalizeString(projectType);
              const proposalSubProjectType = normalizeString(subProjectType);

              return (
                configProjectType === proposalProjectType &&
                configSubProjectType === proposalSubProjectType
              );
            },
          );

        if (matchingRate) {
          minimumPremiumRate = matchingRate.base_rate || 0;
          minimumPremiumMatch = matchingRate;
        }
      }

      // Apply minimum premium protection
      const finalBasePremium = Math.max(calculatedBasePremium, minimumPremiumRate);
      const isMinimumPremiumApplied = finalBasePremium > calculatedBasePremium;

      return {
        basePremium: Math.round(finalBasePremium * 100) / 100, // Round to 2 decimal places
        calculatedBasePremium: Math.round(calculatedBasePremium * 100) / 100,
        minimumPremiumRate,
        isMinimumPremiumApplied,
        minimumPremiumMatch,
        percentageProduct,
        factorsSum,
        sumInsured,
        baseRate,
        factors,
        details: {
          percentageFields,
          fixedAmountFields,
          calculation: `(${percentageProduct} × ${sumInsured}) + ${factorsSum} = ${calculatedBasePremium}`,
          minimumPremiumCalculation: isMinimumPremiumApplied
            ? `MIN(${calculatedBasePremium}, ${minimumPremiumRate}) = ${finalBasePremium}`
            : `No minimum premium applied`,
          percentageProductFormula: `base_rate × factor1 × factor2 × ... × factorN = ${baseRate}% × ${factors.join(
            ' × ',
          )} = ${percentageProduct}`,
          baseRate: `${baseRate}%`,
          factors: factors.map(
            (factor, index) => `${otherPercentageFields[index].fieldLabel}: ${factor}`,
          ),
        },
      };
    };

    // Comprehensive proposal validation against insurer config
    const validateProposalAgainstConfig = (
      proposal: any,
      insurerConfig: any,
      insurerId?: string | number,
    ) => {
      const ratingBreakdown: RatingBreakdownItem[] = [];

      let overallDecision: 'Auto Quote' | 'No Quote' | 'Referral' = 'Auto Quote';

      // Helper function to add validation result
      const addValidationResult = (
        fieldName: string,
        proposalValue: any,
        configRange: string,
        matchedLabel: string,
        pricingType: string,
        pricingValue: number,
        quoteOption: string,
        decision: 'Auto Quote' | 'No Quote' | 'Referral',
        componentType: string = 'base',
        sourceType: string = 'range_rule',
      ) => {
        ratingBreakdown.push({
          fieldId: Math.random().toString(36).substring(7),
          fieldLabel: fieldName,
          category: quoteOption.toUpperCase(),
          proposalValue: String(proposalValue),
          configMatch: configRange,
          pricingEffect: `${pricingType}: ${pricingValue}`,
          decision,
          componentType,
          sourceType,
          calculatedValue: pricingValue,
          amount: 0, // Calculated later
          formula: '', // Calculated later
        });

        // Update overall decision (No Quote > Referral > Auto Quote)
        if (decision === 'No Quote') {
          overallDecision = 'No Quote';
        } else if (decision === 'Referral' && overallDecision !== 'No Quote') {
          overallDecision = 'Referral';
        }
      };

      // 1. Project Type Validation (separate from sub-project)
      const validateProjectType = () => {
        const proposalProjectType = normalizeString(proposal.project?.project_type);

        const baseRates = insurerConfig.base_rates || [];
        let matched = false;

        for (const baseRate of baseRates) {
          const configProjectType = normalizeString(baseRate.project_type);
          if (configProjectType === proposalProjectType) {
            matched = true;
            // For project type validation, we just check if the project type exists
            addValidationResult(
              'project_type',
              proposal.project?.project_type,
              baseRate.project_type,
              baseRate.project_type,
              'percentage',
              0, // No specific pricing at project type level
              'auto_quote',
              'Auto Quote',
              'base',
              'match_rule',
            );
            break;
          }
        }

        if (!matched) {
          addValidationResult(
            'project_type',
            proposal.project?.project_type,
            'No matching project type found',
            'N/A',
            'percentage',
            0,
            'no_quote',
            'No Quote',
          );
        }
      };

      // 1b. Sub-Project Type Validation (separate validation)
      const validateSubProjectType = () => {
        const proposalProjectType = normalizeString(proposal.project?.project_type);
        const proposalSubProjectType = normalizeString(proposal.project?.sub_project_type);

        const baseRates = insurerConfig.base_rates || [];
        let matched = false;

        for (const baseRate of baseRates) {
          const configProjectType = normalizeString(baseRate.project_type);
          if (configProjectType === proposalProjectType) {
            const subProjects = baseRate.sub_projects || [];
            for (const subProject of subProjects) {
              const configSubProject = normalizeString(subProject.name);
              if (configSubProject === proposalSubProjectType) {
                matched = true;
                const decision =
                  subProject.quote_option === 'NO_QUOTE'
                    ? 'No Quote'
                    : subProject.quote_option === 'MANUAL_QUOTE'
                      ? 'Referral'
                      : 'Auto Quote';

                addValidationResult(
                  'sub_project_type',
                  proposal.project?.sub_project_type,
                  subProject.name,
                  subProject.name,
                  subProject.pricing_type || 'PERCENTAGE',
                  subProject.base_rate || 0,
                  subProject.quote_option || 'AUTO_QUOTE',
                  decision,
                  'base',
                  'match_rule',
                );
                break;
              }
            }
            if (matched) break;
          }
        }

        if (!matched) {
          addValidationResult(
            'sub_project_type',
            proposal.project?.sub_project_type,
            'No matching sub-project type found',
            'N/A',
            'percentage',
            0,
            'no_quote',
            'No Quote',
          );
        }
      };

      // Helper function to extract pricing value from different field names
      const extractPricingValue = (item: any) => {
        // Check all possible field names for pricing values
        return (
          item.value ||
          item.base_rate ||
          item.loading_discount ||
          item.base_value ||
          item.limit_value ||
          item.pricing_value ||
          0
        );
      };

      // 2. Construction/Area/Soil/Contract/Role/Geographical Validation
      const validateConfigItems = () => {
        const configMappings = [
          {
            field: 'construction_type',
            config: 'construction_types_config',
            proposal: proposal.project?.construction_type,
          },
          // Only include area_type if it has a value (not null, undefined, or empty)
          ...(proposal.site_risks?.area_type && proposal.site_risks.area_type !== ''
            ? [
                {
                  field: 'area_type',
                  config: 'area_types_config',
                  proposal: proposal.site_risks.area_type,
                },
              ]
            : []),
          {
            field: 'soil_type',
            config: 'soil_types_config',
            proposal: proposal.site_risks?.soil_type,
          },
          {
            field: 'contract_type',
            config: 'contract_types_config',
            proposal: proposal.contract_structure?.details?.contract_type?.replace(/-/g, ' '),
          },
          {
            field: 'role_of_insured',
            config: 'role_types_config',
            proposal: proposal.insured?.details?.role_of_insured,
          },
          {
            field: 'country',
            config: 'countries_config',
            proposal: proposal.project?.country,
          },
          {
            field: 'region',
            config: 'regions_config',
            proposal: proposal.project?.region,
          },
          {
            field: 'zone',
            config: 'zones_config',
            proposal: proposal.project?.zone,
          },
        ];

        configMappings.forEach((mapping) => {
          const proposalValue = normalizeString(mapping.proposal);
          const configItems = insurerConfig[mapping.config]?.items || [];
          let matched = false;

          for (const item of configItems) {
            // Handle different data structures for geographical fields
            let configValue;
            if (mapping.field === 'country') {
              configValue = normalizeString(item.country || item.name);
            } else if (mapping.field === 'region') {
              configValue = normalizeString(item.name || item.region);
            } else if (mapping.field === 'zone') {
              configValue = normalizeString(item.name || item.zone);
            } else {
              configValue = normalizeString(item.name || item.type);
            }

            if (configValue === proposalValue) {
              matched = true;
              const decision =
                item.quote_option === 'NO_QUOTE'
                  ? 'No Quote'
                  : item.quote_option === 'MANUAL_QUOTE'
                    ? 'Referral'
                    : 'Auto Quote';

              const pricingValue = extractPricingValue(item);

              addValidationResult(
                mapping.field,
                mapping.proposal,
                item.name || item.country || item.region || item.zone || item.type,
                item.name || item.country || item.region || item.zone || item.type,
                item.pricing_type || 'percentage',
                pricingValue,
                item.quote_option || 'auto_quote',
                decision,
                'loading',
                'match_rule',
              );
              break;
            }
          }

          if (!matched) {
            addValidationResult(
              mapping.field,
              mapping.proposal,
              'No matching configuration found',
              'N/A',
              'percentage',
              0,
              'no_quote',
              'No Quote',
            );
          }
        });
      };

      // 3. Project Duration Validation
      const validateProjectDuration = () => {
        // Use construction_period_months from proposal form instead of calculating from dates
        const constructionPeriodMonths = normalizeNumber(
          proposal.project?.construction_period_months,
        );
        const durationLoadings =
          insurerConfig.project_risk_factors?.project_duration_loadings || [];

        let matched = false;
        for (const loading of durationLoadings) {
          if (isWithinRange(constructionPeriodMonths, loading.from_months, loading.to_months)) {
            matched = true;
            const decision =
              loading.quote_option === 'NO_QUOTE'
                ? 'No Quote'
                : loading.quote_option === 'MANUAL_QUOTE'
                  ? 'Referral'
                  : 'Auto Quote';

            const pricingValue = extractPricingValue(loading);

            addValidationResult(
              'construction_period',
              `${constructionPeriodMonths} months`,
              `${loading.from_months || 0} - ${loading.to_months || '∞'} months`,
              `${loading.from_months || 0}-${loading.to_months || '∞'} months`,
              loading.pricing_type || 'PERCENTAGE',
              pricingValue,
              loading.quote_option || 'AUTO_QUOTE',
              decision,
              'loading',
              'range_rule',
            );
            break;
          }
        }

        if (!matched) {
          addValidationResult(
            'construction_period',
            `${constructionPeriodMonths} months`,
            'No matching range found',
            'N/A',
            'percentage',
            0,
            'no_quote',
            'No Quote',
          );
        }
      };

      // 4. Maintenance Period Validation
      const validateMaintenancePeriod = () => {
        const maintenanceMonths = normalizeNumber(proposal.project?.maintenance_period_months);
        const maintenanceLoadings =
          insurerConfig.project_risk_factors?.maintenance_period_loadings || [];

        let matched = false;
        for (const loading of maintenanceLoadings) {
          if (isWithinRange(maintenanceMonths, loading.from_months, loading.to_months)) {
            matched = true;
            const decision =
              loading.quote_option === 'NO_QUOTE'
                ? 'No Quote'
                : loading.quote_option === 'MANUAL_QUOTE'
                  ? 'Referral'
                  : 'Auto Quote';

            const pricingValue = extractPricingValue(loading);

            addValidationResult(
              'maintenance_period',
              `${maintenanceMonths} months`,
              `${loading.from_months || 0} - ${loading.to_months || '∞'} months`,
              `${loading.from_months || 0}-${loading.to_months || '∞'} months`,
              loading.pricing_type || 'percentage',
              pricingValue,
              loading.quote_option || 'auto_quote',
              decision,
              'loading',
              'range_rule',
            );
            break;
          }
        }

        if (!matched) {
          addValidationResult(
            'maintenance_period',
            `${maintenanceMonths} months`,
            'No matching range found',
            'N/A',
            'percentage',
            0,
            'no_quote',
            'No Quote',
          );
        }
      };

      // 5. Coverage Amounts Extraction (No Validation)
      const validateCoverageAmounts = () => {
        const coverageTypes = [
          {
            field: 'project_value',
            value: proposal.cover_requirements?.project_value,
            label: 'Project Value',
          },
          {
            field: 'contract_works',
            value: proposal.cover_requirements?.contract_works,
            label: 'Contract Works',
          },
          {
            field: 'plant_and_equipment',
            value: proposal.cover_requirements?.plant_and_equipment,
            label: 'Plant And Equipment',
          },
          {
            field: 'sum_insured',
            value: proposal.cover_requirements?.sum_insured,
            label: 'Sum Insured',
          },
          {
            field: 'temporary_works',
            value: proposal.cover_requirements?.temporary_works,
            label: 'Temporary Works',
          },
          {
            field: 'other_materials',
            value: proposal.cover_requirements?.other_materials,
            label: 'Other Materials',
          },
          {
            field: 'principals_property',
            value: proposal.cover_requirements?.principals_property,
            label: 'Principals Property',
          },
        ];

        coverageTypes.forEach((coverage) => {
          const proposalValue = normalizeNumber(coverage.value);

          // Just extract and display the value without validation
          addValidationResult(
            coverage.field,
            proposalValue || 0,
            'Value Only',
            'N/A',
            'percentage',
            0,
            'auto_quote',
            'Auto Quote',
          );
        });
      };

      // 5b. Cross Liability Cover Validation
      const validateCrossLiabilityCover = () => {
        const crossLiabilityCover = proposal.cover_requirements?.cross_liability_cover;
        const crossLiabilityOptions = insurerConfig.coverage_options?.cross_liability_cover || [];

        let matched = false;
        for (const option of crossLiabilityOptions) {
          // Normalize the cover option for comparison
          const normalizedOptionName = normalizeString(option.cover_option);
          const normalizedProposalValue = normalizeString(crossLiabilityCover || 'no');

          // Map proposal values to config options
          let matches = false;
          if (
            ((normalizedProposalValue === 'yes' ||
              normalizedProposalValue === '1' ||
              normalizedProposalValue === 'true') &&
              normalizedOptionName.includes('yes')) ||
            normalizedOptionName.includes('included')
          ) {
            matches = true;
          } else if (
            (normalizedProposalValue === 'no' ||
              normalizedProposalValue === '0' ||
              normalizedProposalValue === 'false' ||
              !crossLiabilityCover) &&
            (normalizedOptionName.includes('no') || normalizedOptionName.includes('not'))
          ) {
            matches = true;
          }

          if (matches) {
            matched = true;
            const decision =
              option.quote_option === 'NO_QUOTE'
                ? 'No Quote'
                : option.quote_option === 'MANUAL_QUOTE'
                  ? 'Referral'
                  : 'Auto Quote';

            const pricingValue = extractPricingValue(option);

            addValidationResult(
              'cross_liability_cover',
              crossLiabilityCover || 'No',
              option.cover_option,
              option.cover_option,
              option.pricing_type || 'PERCENTAGE',
              pricingValue,
              option.quote_option || 'AUTO_QUOTE',
              decision,
            );
            break;
          }
        }

        if (!matched) {
          addValidationResult(
            'cross_liability_cover',
            crossLiabilityCover || 'No',
            'No matching option found',
            'N/A',
            'percentage',
            0,
            'no_quote',
            'No Quote',
          );
        }
      };

      // 6. Contractor Experience Validation
      const validateContractorExperience = () => {
        const experienceYears = normalizeNumber(
          proposal.contract_structure?.details?.experience_years,
        );
        const experienceLoadings = insurerConfig.contractor_risk_factors?.experience_loadings || [];

        let matched = false;
        for (const loading of experienceLoadings) {
          if (isWithinRange(experienceYears, loading.from_years, loading.to_years)) {
            matched = true;
            const decision =
              loading.quote_option === 'NO_QUOTE'
                ? 'No Quote'
                : loading.quote_option === 'MANUAL_QUOTE'
                  ? 'Referral'
                  : 'Auto Quote';

            const pricingValue = extractPricingValue(loading);

            addValidationResult(
              'contractor_experience',
              `${experienceYears} years`,
              `${loading.from_years || 0} - ${loading.to_years || '∞'} years`,
              `${loading.from_years || 0}-${loading.to_years || '∞'} years`,
              loading.pricing_type || 'percentage',
              pricingValue,
              loading.quote_option || 'auto_quote',
              decision,
            );
            break;
          }
        }

        if (!matched) {
          addValidationResult(
            'contractor_experience',
            `${experienceYears} years`,
            'No matching range found',
            'N/A',
            'percentage',
            0,
            'no_quote',
            'No Quote',
          );
        }
      };

      // 7. Claims History Validation (Count-based)
      const validateClaimsHistory = () => {
        const claims = proposal.insured?.claims || [];
        const totalClaimsCount = claims.reduce(
          (sum: number, claim: any) => sum + normalizeNumber(claim.count_of_claims),
          0,
        );
        const claimsLoadings = insurerConfig.contractor_risk_factors?.claims_based_loadings || [];

        let matched = false;
        for (const loading of claimsLoadings) {
          if (isWithinRange(totalClaimsCount, loading.from_claims, loading.to_claims)) {
            matched = true;
            const decision =
              loading.quote_option === 'NO_QUOTE'
                ? 'No Quote'
                : loading.quote_option === 'MANUAL_QUOTE'
                  ? 'Referral'
                  : 'Auto Quote';

            const pricingValue = extractPricingValue(loading);

            addValidationResult(
              'claims_count',
              totalClaimsCount,
              `${loading.from_claims || 0} - ${loading.to_claims || '∞'}`,
              `${loading.from_claims || 0}-${loading.to_claims || '∞'}`,
              loading.pricing_type || 'percentage',
              pricingValue,
              loading.quote_option || 'auto_quote',
              decision,
            );
            break;
          }
        }

        if (!matched) {
          addValidationResult(
            'claims_count',
            totalClaimsCount,
            'No matching range found',
            'N/A',
            'percentage',
            0,
            'no_quote',
            'No Quote',
          );
        }
      };

      // 7b. Claims Amount Validation (Amount-based)
      const validateClaimsAmount = () => {
        const claims = proposal.insured?.claims || [];
        const totalClaimsAmount = claims.reduce(
          (sum: number, claim: any) => sum + normalizeNumber(claim.amount_of_claims),
          0,
        );
        const claimAmountCategories =
          insurerConfig.contractor_risk_factors?.claim_amount_categories || [];

        let matched = false;
        for (const category of claimAmountCategories) {
          if (isWithinRange(totalClaimsAmount, category.from_amount, category.to_amount)) {
            matched = true;
            const decision =
              category.quote_option === 'NO_QUOTE'
                ? 'No Quote'
                : category.quote_option === 'MANUAL_QUOTE'
                  ? 'Referral'
                  : 'Auto Quote';

            const pricingValue = extractPricingValue(category);

            addValidationResult(
              'claims_amount',
              totalClaimsAmount,
              `${category.from_amount || 0} - ${category.to_amount || '∞'}`,
              `${category.from_amount || 0}-${category.to_amount || '∞'}`,
              category.pricing_type || 'percentage',
              pricingValue,
              category.quote_option || 'auto_quote',
              decision,
            );
            break;
          }
        }

        if (!matched) {
          addValidationResult(
            'claims_amount',
            totalClaimsAmount,
            'No matching amount range found',
            'N/A',
            'percentage',
            0,
            'no_quote',
            'No Quote',
          );
        }
      };

      // 8. Sub-Contractors Count Validation
      const validateSubContractorsCount = () => {
        const subContractorsCount = (proposal.contract_structure?.sub_contractors || []).length;

        // Try multiple possible paths for subcontractor loadings
        const subContractorsLoadings =
          insurerConfig.contractor_risk_factors?.subcontractor_number_based ||
          insurerConfig.subcontractor_number_based ||
          [];

        // If no loadings configured, show configuration missing error
        if (subContractorsLoadings.length === 0) {
          addValidationResult(
            'sub_contractors_count',
            subContractorsCount,
            'Configuration missing',
            'N/A',
            'percentage',
            0,
            'no_quote',
            'No Quote',
          );
          return;
        }

        let matched = false;
        for (let i = 0; i < subContractorsLoadings.length; i++) {
          const loading = subContractorsLoadings[i];

          // Extract range values - prioritize the exact field names from your data
          const fromValue =
            loading.from_subcontractors !== undefined
              ? loading.from_subcontractors
              : loading.from_sub_contractors || loading.from_count || loading.from || 0;
          const toValue =
            loading.to_subcontractors !== undefined
              ? loading.to_subcontractors
              : loading.to_sub_contractors || loading.to_count || loading.to;

          // Convert to numbers
          const fromNum = Number(fromValue);
          const toNum = Number(toValue);
          const countNum = Number(subContractorsCount);

          // Check if count is within range
          const isInRange = isWithinRange(countNum, fromNum, toNum);
          if (isInRange) {
            matched = true;
            const decision =
              loading.quote_option === 'NO_QUOTE'
                ? 'No Quote'
                : loading.quote_option === 'MANUAL_QUOTE'
                  ? 'Referral'
                  : 'Auto Quote';

            const pricingValue = extractPricingValue(loading);

            addValidationResult(
              'sub_contractors_count',
              `${subContractorsCount} No`,
              `${fromNum} - ${toNum}`,
              `${fromNum}-${toNum}`,
              loading.pricing_type || 'percentage',
              pricingValue,
              loading.quote_option || 'auto_quote',
              decision,
            );
            break;
          }
        }

        if (!matched) {
          addValidationResult(
            'sub_contractors_count',
            subContractorsCount,
            'No matching range found',
            'N/A',
            'percentage',
            0,
            'no_quote',
            'No Quote',
          );
        } else {
        }
      };

      // 9. Consultants Count Validation
      const validateConsultantsCount = () => {
        const consultantsCount = (proposal.contract_structure?.consultants || []).length;
        const consultantsLoadings =
          insurerConfig.contractor_risk_factors?.contractor_number_based || [];

        // If no loadings configured, just display the count
        if (consultantsLoadings.length === 0) {
          addValidationResult(
            'consultants_count',
            consultantsCount,
            'No configuration available',
            'N/A',
            'percentage',
            0,
            'auto_quote',
            'Auto Quote',
          );
          return;
        }

        let matched = false;
        for (let i = 0; i < consultantsLoadings.length; i++) {
          const loading = consultantsLoadings[i];
          // Try different possible field names for consultants range
          const fromField =
            loading.from_contractors ||
            loading.from_consultants ||
            loading.from_count ||
            loading.from ||
            loading.min_count ||
            loading.min ||
            0;
          const toField =
            loading.to_contractors ||
            loading.to_consultants ||
            loading.to_count ||
            loading.to ||
            loading.max_count ||
            loading.max;

          if (isWithinRange(consultantsCount, fromField, toField)) {
            matched = true;
            const decision =
              loading.quote_option === 'NO_QUOTE'
                ? 'No Quote'
                : loading.quote_option === 'MANUAL_QUOTE'
                  ? 'Referral'
                  : 'Auto Quote';

            const pricingValue = extractPricingValue(loading);

            addValidationResult(
              'consultants_count',
              consultantsCount,
              `${fromField || 0} - ${toField || '∞'}`,
              `${fromField || 0}-${toField || '∞'}`,
              loading.pricing_type || 'percentage',
              pricingValue,
              loading.quote_option || 'auto_quote',
              decision,
            );
            break;
          }
        }

        if (!matched) {
          addValidationResult(
            'consultants_count',
            consultantsCount,
            'No matching range found',
            'N/A',
            'percentage',
            0,
            'no_quote',
            'No Quote',
          );
        }
      };

      // 10. Location Hazard Validation
      const validateLocationHazard = () => {
        // Get proposal risk values
        const proposalRiskValues = {
          near_water_body: normalizeBoolean(proposal.site_risks?.near_water_body),
          flood_prone_zone: normalizeBoolean(proposal.site_risks?.flood_prone_zone),
          within_city_center: proposal.site_risks?.within_city_center === 'yes',
          soil_type: proposal.site_risks?.soil_type,
          existing_structure: normalizeBoolean(proposal.site_risks?.existing_structure),
          blasting_or_deep_excavation: normalizeBoolean(
            proposal.site_risks?.blasting_or_deep_excavation,
          ),
          site_security_arrangements: proposal.site_risks?.site_security_arrangements,
          // Only include area_type if it has a value (not null, undefined, or empty)
          ...(proposal.site_risks?.area_type && proposal.site_risks.area_type !== ''
            ? { area_type: proposal.site_risks.area_type }
            : {}),
        };

        const riskDefinition =
          insurerConfig.project_risk_factors?.location_hazard_loadings?.risk_definition;
        const locationHazardRates =
          insurerConfig.project_risk_factors?.location_hazard_loadings?.location_hazard_rates || [];

        let derivedRisk = 'Low Risk';

        if (riskDefinition?.factors) {
          // Check risk levels in order: very high → high → moderate → low
          const riskLevels = ['very_high_risk', 'high_risk', 'moderate_risk', 'low_risk'];

          for (const riskLevel of riskLevels) {
            let matchesRiskLevel = false;

            for (const factor of riskDefinition.factors) {
              const factorName = normalizeString(factor.factor);
              const riskValue = factor[riskLevel];

              if (factorName.includes('water') && proposalRiskValues.near_water_body) {
                if (riskValue === 'yes') matchesRiskLevel = true;
              } else if (factorName.includes('flood') && proposalRiskValues.flood_prone_zone) {
                if (riskValue === 'yes') matchesRiskLevel = true;
              } else if (factorName.includes('city') && proposalRiskValues.within_city_center) {
                if (riskValue === 'yes') matchesRiskLevel = true;
              } else if (factorName.includes('soil') && proposalRiskValues.soil_type) {
                // Handle soil types as array (new API format) or comma-separated string (legacy format)
                let soilTypes: string[];
                if (Array.isArray(riskValue)) {
                  soilTypes = riskValue.map((type: string) => type.toLowerCase());
                } else {
                  soilTypes = riskValue.toLowerCase().split(', ');
                }
                if (soilTypes.includes(proposalRiskValues.soil_type.toLowerCase()))
                  matchesRiskLevel = true;
              } else if (factorName.includes('existing') && proposalRiskValues.existing_structure) {
                if (riskValue === 'yes') matchesRiskLevel = true;
              } else if (
                factorName.includes('blasting') &&
                proposalRiskValues.blasting_or_deep_excavation
              ) {
                if (riskValue === 'yes') matchesRiskLevel = true;
              } else if (factorName.includes('security')) {
                if (riskValue === 'yes') matchesRiskLevel = true;
              }
            }

            if (matchesRiskLevel) {
              derivedRisk = riskLevel.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
              break;
            }
          }
        }

        // Find matching location hazard rate
        let matched = false;

        for (const rate of locationHazardRates) {
          if (normalizeString(rate.risk_level) === normalizeString(derivedRisk)) {
            matched = true;
            const decision =
              rate.quote_option === 'NO_QUOTE'
                ? 'No Quote'
                : rate.quote_option === 'MANUAL_QUOTE'
                  ? 'Referral'
                  : 'Auto Quote';

            const pricingValue = extractPricingValue(rate);

            addValidationResult(
              'location_hazard',
              derivedRisk,
              rate.risk_level,
              rate.risk_level,
              rate.pricing_type || 'PERCENTAGE',
              pricingValue,
              rate.quote_option || 'AUTO_QUOTE',
              decision,
            );
            break;
          }
        }

        if (!matched) {
          addValidationResult(
            'location_hazard',
            derivedRisk,
            'No matching risk level found',
            'N/A',
            'percentage',
            0,
            'no_quote',
            'No Quote',
          );
        }
      };

      // Execute all validations
      validateProjectType();
      validateSubProjectType();
      validateConfigItems();
      validateProjectDuration();
      validateMaintenancePeriod();
      validateCoverageAmounts();
      validateCrossLiabilityCover();
      validateContractorExperience();
      validateClaimsHistory();
      validateClaimsAmount();
      validateSubContractorsCount();
      validateConsultantsCount();
      validateLocationHazard();

      // Calculate pricing if Auto Quote
      let basePremium = 0;
      let pricingDetails = null;
      let pricingResult = null;

      if (overallDecision === 'Auto Quote') {
        pricingResult = calculateBasePremium(ratingBreakdown, proposal, insurerConfig);
        basePremium = pricingResult.basePremium;
        pricingDetails = pricingResult.details;
      }

      return {
        ratingBreakdown,
        overallDecision,
        isEligible: overallDecision === 'Auto Quote',
        basePremium,
        calculatedBasePremium: pricingResult?.calculatedBasePremium || basePremium,
        minimumPremiumRate: pricingResult?.minimumPremiumRate || 0,
        isMinimumPremiumApplied: pricingResult?.isMinimumPremiumApplied || false,
        minimumPremiumMatch: pricingResult?.minimumPremiumMatch || null,
        pricingDetails,
      };
    };

    // Insurer validation logic
    const validateInsurerEligibility = (insurer: any): boolean => {
      const proposalToUse = currentProposal;
      if (!proposalToUse) return false;

      // Check 1: Active status
      const isActive = insurer.status === 'active';

      // Check 2: Has product_id = 1
      const hasProductId1 = insurer.product_assigned_details.some(
        (product: any) => product.product_id === 1,
      );

      // Check 3: Backdate validation
      let isWithinBackdate = false;
      if (proposalToUse?.project?.start_date) {
        const startDate = new Date(proposalToUse.project.start_date);
        const currentDate = new Date();
        const daysDifference = Math.ceil(
          (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Find the product with product_id = 1 to get backdate_days
        const productWithId1 = insurer.product_assigned_details.find(
          (product: any) => product.product_id === 1,
        );
        if (productWithId1?.quote_config?.backdate_days) {
          isWithinBackdate = daysDifference <= productWithId1.quote_config.backdate_days;
        } else {
        }
      } else {
      }

      // Check 4: Geographic validation
      let isGeographicMatch = false;
      if (
        proposalToUse?.project?.country &&
        proposalToUse?.project?.region &&
        proposalToUse?.project?.zone
      ) {
        const proposalCountry = proposalToUse.project.country;
        const proposalRegion = proposalToUse.project.region;
        const proposalZone = proposalToUse.project.zone;

        // Find the product with product_id = 1 to get operating areas
        const productWithId1 = insurer.product_assigned_details.find(
          (product: any) => product.product_id === 1,
        );
        if (productWithId1?.quote_config) {
          const operatingCountries = productWithId1.quote_config.operating_countries || [];
          const operatingRegions = productWithId1.quote_config.operating_regions || [];
          const operatingZones = productWithId1.quote_config.operating_zones || [];

          // Normalize all strings for comparison
          const normalizedProposalCountry = normalizeGeographicString(proposalCountry);
          const normalizedProposalRegion = normalizeGeographicString(proposalRegion);
          const normalizedProposalZone = normalizeGeographicString(proposalZone);

          // Check if any operating country matches the proposal country (normalized)
          const countryMatch = operatingCountries.some(
            (country: string | { name?: string; [key: string]: any }) =>
              normalizeGeographicString(country) === normalizedProposalCountry,
          );

          // Check if any operating region matches the proposal region (normalized)
          const regionMatch = operatingRegions.some(
            (region: string | { name?: string; [key: string]: any }) =>
              normalizeGeographicString(region) === normalizedProposalRegion,
          );

          // Check if any operating zone matches the proposal zone (normalized)
          const zoneMatch = operatingZones.some(
            (zone: string | { name?: string; [key: string]: any }) =>
              normalizeGeographicString(zone) === normalizedProposalZone,
          );

          // All three must match for geographic validation to pass
          isGeographicMatch = countryMatch && regionMatch && zoneMatch;
        } else {
        }
      } else {
      }

      // All checks must pass
      const isEligible = isActive && hasProductId1 && isWithinBackdate && isGeographicMatch;
      return isEligible;
    };

    // Get eligible insurers for pricing
    const getEligibleInsurers = () => {
      // Handle both { insurers: [...] } and [...] structures
      let insurersList: any[] = [];

      if (internalAssignedInsurers) {
        insurersList = Array.isArray(internalAssignedInsurers)
          ? internalAssignedInsurers
          : internalAssignedInsurers.insurers || [];
      } else if (assignedInsurers) {
        insurersList = Array.isArray(assignedInsurers)
          ? assignedInsurers
          : assignedInsurers.insurers || [];
      }

      const proposalSource = currentProposal;
      if (!insurersList.length || !proposalSource) {
        return [];
      }

      // If we have responseId, we trust the server response and skip client-side eligibility validation
      if (responseId) {
        return insurersList;
      }

      const eligibleInsurers = insurersList.filter(validateInsurerEligibility);

      return eligibleInsurers;
    };

    // Get eligible insurers whenever data changes - memoized to prevent infinite loops
    const eligibleInsurers = React.useMemo(() => {
      return getEligibleInsurers();
    }, [assignedInsurers, internalAssignedInsurers, currentProposal]);

    // Load pricing configs when eligible insurers are found and not already loaded
    React.useEffect(() => {
      if (eligibleInsurers.length > 0 && onLoadPricingConfigs && !isLoadingPricingConfigs) {
        // Check if we already have pricing configs for all eligible insurers
        const hasAllConfigs = eligibleInsurers.every(
          (insurer) => insurerPricingConfigs && insurerPricingConfigs[insurer.insurer_id],
        );

        if (!hasAllConfigs) {
          onLoadPricingConfigs(eligibleInsurers);
        }
      }
    }, [eligibleInsurers, onLoadPricingConfigs, insurerPricingConfigs, isLoadingPricingConfigs]);

    // Validate proposals against pricing configs when both are available
    React.useEffect(() => {
      if (responseId) return;

      const configsForValidation = internalInsurerPricingConfigs || insurerPricingConfigs;
      const proposalForValidation = currentProposal;
      if (proposalForValidation && configsForValidation && eligibleInsurers.length > 0) {
        // Check if we need to validate any new insurers
        const insurersToValidate = eligibleInsurers.filter(
          (insurer) =>
            configsForValidation[insurer.insurer_id] &&
            !validationCompleted.current.has(String(insurer.insurer_id)),
        );

        if (insurersToValidate.length === 0) {
          return;
        }

        setInsurerValidationResults((prevResults) => {
          const newValidationResults = { ...prevResults };

          insurersToValidate.forEach((insurer) => {
            const pricingConfig = configsForValidation[insurer.insurer_id];
            if (pricingConfig) {
              const validationResult = validateProposalAgainstConfig(
                proposalForValidation,
                pricingConfig,
                insurer.insurer_id,
              );
              newValidationResults[String(insurer.insurer_id)] = validationResult;
              validationCompleted.current.add(String(insurer.insurer_id));
            }
          });

          return newValidationResults;
        });
      }
    }, [currentProposal, insurerPricingConfigs, eligibleInsurers, responseId]);

    // Reset validation state when resuming a quote (when currentProposal changes)
    React.useEffect(() => {
      if (currentProposal && !responseId) {
        // Clear validation results and completed tracking
        setInsurerValidationResults({});
        validationCompleted.current.clear();
      }
    }, [currentProposal, responseId]);

    // Adjustment State
    const [tplAdjustment, setTPLAdjustment] = useState({ percent: 0, fixed: 0 });
    const [cewAdjustment, setCEWAdjustment] = useState({ percent: 0, fixed: 0 });
    const [mandatoryCewAdjustment, setMandatoryCEWAdjustment] = useState({ percent: 0, fixed: 0 });
    const [deductibleAdjustment, setDeductibleAdjustment] = useState({ percent: 0, fixed: 0 });

    const [selectedTPLLimitValue, setSelectedTPLLimitValue] = useState(0);
    const [brokerCommissionPercent, setBrokerCommissionPercent] = useState(10);
    const [selectedCEWItems, setSelectedCEWItems] = useState<any[]>([]);
    const [showExtensionConfirmDialog, setShowExtensionConfirmDialog] = useState(false);
    const [pendingQuoteId, setPendingQuoteId] = useState<number | null>(null);
    const [isApplyingStoredData, setIsApplyingStoredData] = useState(false);
    const [showValidationDialog, setShowValidationDialog] = useState(false);
    const [premiumRecalculationTrigger, setPremiumRecalculationTrigger] = useState(0);

    // Reset the stored data flag after a longer delay to allow stored data to be applied
    useEffect(() => {
      if (isApplyingStoredData) {
        const timer = setTimeout(() => {
          setIsApplyingStoredData(false);
        }, 2000); // 2 second delay to allow stored data to be applied

        return () => clearTimeout(timer);
      }
    }, [isApplyingStoredData]);

    // Unified effect to trigger premium recalculation whenever key factors change
    useEffect(() => {
      // This trigger will force all useMemos that depend on it to re-evaluate
      setPremiumRecalculationTrigger((prev) => prev + 1);
    }, [brokerCommissionPercent, tplAdjustment, cewAdjustment, deductibleAdjustment]);
    const [productConfigBundle, setProductConfigBundle] = useState<any>(null);
    const [isLoadingProductConfig, setIsLoadingProductConfig] = useState(false);
    const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
    const [showPlanConfirmationDialog, setShowPlanConfirmationDialog] = useState(false);
    const [pendingPlanSelection, setPendingPlanSelection] = useState<number | null>(null);
    const [isBrokerCommissionDialogOpen, setIsBrokerCommissionDialogOpen] = useState(false);
    const [brokerCommissionInput, setBrokerCommissionInput] = useState('');
    const [brokerCommissionError, setBrokerCommissionError] = useState('');

    const effectiveQuoteKey = useMemo(() => {
      const key =
        comparisonData?.quote_id ||
        (responseId ? String(responseId) : undefined) ||
        (resumeParam ? String(resumeParam) : undefined);
      return key ? String(key) : '';
    }, [comparisonData?.quote_id, responseId, resumeParam]);

    // State for storing insurer validation results
    const [insurerValidationResults, setInsurerValidationResults] = useState<
      Record<
        string,
        {
          ratingBreakdown: RatingBreakdownItem[];
          overallDecision: 'Auto Quote' | 'No Quote' | 'Referral';
          isEligible: boolean;
          basePremium: number;
          calculatedBasePremium?: number;
          minimumPremiumRate?: number;
          isMinimumPremiumApplied?: boolean;
          minimumPremiumMatch?: any;
          pricingDetails: any;
          premium?: PremiumBreakdown;
          feeTypes?: FeeType[];
          commissions?: Record<string, any>;
        }
      >
    >({});

    // Ref to track validation completion and prevent duplicate runs
    const validationCompleted = React.useRef<Set<string | number>>(new Set());
    // Store updated premiums and CEW selections per quote
    const [updatedQuotes, setUpdatedQuotes] = useState<
      Record<
        number,
        {
          premium: number;
          cewItems: any[];
          isUpdated: boolean;
        }
      >
    >({});
    const navigate = useNavigate();
    const { navigateBack } = useNavigationHistory();
    const { toast } = useToast();

    const handleQuoteSelect = (quoteId: number, checked: boolean) => {
      if (checked) {
        setSelectedQuotes((prev) => [...prev, quoteId]);
      } else {
        setSelectedQuotes((prev) => prev.filter((id) => id !== quoteId));
      }
    };

    const handleCompare = () => {
      if (selectedQuotes.length === 2) {
        setIsCompareDialogOpen(true);
      }
    };

    const handleDownload = () => {
      // Create and download PDF comparison
      const selectedData = realQuotes.filter((q) => selectedQuotes.includes(q.id));
      const content = selectedData
        .map(
          (quote) =>
            `${quote.planName} - ${quote.insurerName}\nPremium: ${LibUtils.formatCurrency(
              quote.annualPremium,
              currency,
            )}\nCoverage: ${LibUtils.formatCurrency(quote.coverageAmount, currency)}\n\n`,
        )
        .join('');

      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'insurance-comparison.txt';
      a.click();
      window.URL.revokeObjectURL(url);
    };

    const proceedWithSelection = (quoteId: number) => {
      // Find the selected quote to get insurer information
      const selectedQuote = realQuotes.find((q) => q.id === quoteId);
      if (selectedQuote) {
        // Store insurer and product IDs for DeclarationTab
        localStorage.setItem('selected_insurer_id', selectedQuote.id.toString());
        localStorage.setItem('selected_product_id', '1'); // Default product ID, can be made dynamic later
      }

      // Check if we're in the proposal form context by looking for a parent function
      if (window.onQuoteSelected) {
        // We're in the proposal form, navigate to declaration step
        window.onQuoteSelected(quoteId);
      } else {
        // We're in standalone quotes page, navigate to declaration page
        navigate('/customer/declaration', { state: { selectedQuote: quoteId } });
      }
    };

    const isPremiumBreakdownLike = (
      value: unknown,
    ): value is PremiumBreakdown & { totalPremium?: number } => {
      if (!value || typeof value !== 'object') return false;
      const record = value as Record<string, unknown>;
      return (
        typeof record.sumInsured === 'number' &&
        typeof record.base === 'number' &&
        typeof record.loading === 'number' &&
        typeof record.discount === 'number' &&
        typeof record.fee === 'number' &&
        typeof record.total === 'number'
      );
    };

    const handleExtensionsClick = async (quote: any) => {
      setSelectedQuoteForCEW(quote);

      // Eagerly initialize all covers as selected so sidebar shows correct values immediately
      if (isCartLikeCoverSelection && quote.premium?.covers?.length) {
        setSelectedCoversByQuote((prev) => {
          if (prev[quote.id]) return prev;
          return {
            ...prev,
            [quote.id]: new Set(quote.premium.covers.map((c: CoverPremiumItem) => c.coverId)),
          };
        });
      }

      // Fallback: for single-cover products with no premium.covers,
      // pre-select the synthesized 'base-cover' so cart-like totals work
      if (isCartLikeCoverSelection && !quote.premium?.covers?.length) {
        setSelectedCoversByQuote((prev) => {
          if (prev[quote.id]) return prev;
          return {
            ...prev,
            [quote.id]: new Set(['base-cover']),
          };
        });
      }

      let prefillFromApi: Record<string, unknown> | null = null;
      let apiUpdatedAt: string | undefined;
      if (endorsementId) {
        setEndorsementPrefill(null);
        try {
          const res = await getEndorsementSelectedPremium(endorsementId);
          if (res?.premiumSnapshot) {
            prefillFromApi = premiumSnapshotToStoredPrefill(res.premiumSnapshot);
            apiUpdatedAt = res.updatedAt;
            if (apiUpdatedAt) (prefillFromApi as any).lastUpdated = apiUpdatedAt;

            const snapshotPremiumRaw = (res.premiumSnapshot as SelectedPremiumSnapshot).premium;
            if (
              isPremiumBreakdownLike(snapshotPremiumRaw) &&
              Array.isArray(snapshotPremiumRaw.covers) &&
              snapshotPremiumRaw.covers.length > 0
            ) {
              setSelectedQuoteForCEW((prev) =>
                prev
                  ? {
                      ...prev,
                      premium: snapshotPremiumRaw,
                      annualPremium: Number(
                        res.premiumSnapshot?.totalPremium ??
                          snapshotPremiumRaw.totalPremium ??
                          snapshotPremiumRaw.total ??
                          prev.annualPremium ??
                          0,
                      ),
                      coverageAmount: Number(
                        res.premiumSnapshot?.sumInsured ??
                          snapshotPremiumRaw.sumInsured ??
                          prev.coverageAmount ??
                          0,
                      ),
                      validationResult: {
                        ...(prev.validationResult || {}),
                        sumInsured: Number(
                          res.premiumSnapshot?.sumInsured ??
                            snapshotPremiumRaw.sumInsured ??
                            prev.validationResult?.sumInsured ??
                            prev.coverageAmount ??
                            0,
                        ),
                      },
                    }
                  : prev,
              );
            }
          }
        } catch (e) {
          console.warn('Failed to load endorsement selected premium for prefill:', e);
        }
      } else {
        setEndorsementPrefill(null);
      }

      const prefillFromLocal = getStoredRequestForQuoteInsurer(
        effectiveQuoteKey,
        quote.id,
      ) as Record<string, unknown> | null;
      const localLastUpdated = prefillFromLocal?.lastUpdated as string | undefined;

      // Prefer API; if both API and local exist, use whichever is newer (so Update Premium changes in local are shown)
      let storedRequest: Record<string, unknown> | null = null;
      if (prefillFromApi && prefillFromLocal) {
        const apiTime = apiUpdatedAt ? new Date(apiUpdatedAt).getTime() : 0;
        const localTime = localLastUpdated ? new Date(localLastUpdated).getTime() : 0;
        storedRequest = apiTime >= localTime ? prefillFromApi : prefillFromLocal;
      } else {
        storedRequest = prefillFromApi ?? prefillFromLocal;
      }
      if (endorsementId && storedRequest) {
        setEndorsementPrefill(storedRequest);
      }

      const matchedInsurer = comparisonData?.insurers?.find(
        (ins: any) => String(ins.insurer_id) === String(quote.id),
      );
      const commissionsFromResponse =
        (quote as any)?.commissions || matchedInsurer?.commissions || {};
      const responseBrokerCommission =
        commissionsFromResponse.brokerCommissionPercent != null
          ? Number(commissionsFromResponse.brokerCommissionPercent)
          : 10;

      // Fetch product config bundle for this insurer
      try {
        setIsLoadingProductConfig(true);
        const localConfig = quote.pricingConfig;
        if (localConfig) {
          setProductConfigBundle(normalizeToQuotesComparisonConfig(localConfig));
        } else {
          const configBundle = await getInsurerPricingConfig(quote.id);
          setProductConfigBundle(normalizeToQuotesComparisonConfig(configBundle));
        }

        // Check if we have stored data for this quote (from API or localStorage)
        if (storedRequest) {
          // Set flag to prevent parent state updates during stored data application
          setIsApplyingStoredData(true);

          const prefill = storedRequest as Record<string, unknown>;
          // Restore adjustments to component state
          setTPLAdjustment({
            percent: Number(prefill.tplAdjustmentPercent ?? prefill.tplAdjustment ?? 0),
            fixed: Number(prefill.tplAdjustmentFixed ?? 0),
          });
          setSelectedTPLLimitValue((prefill.tplSelection as any)?.value ?? 0);
          setCEWAdjustment({
            percent: Number(prefill.cewAdjustmentPercent ?? prefill.cewAdjustment ?? 0),
            fixed: Number(prefill.cewAdjustmentFixed ?? 0),
          });
          setDeductibleAdjustment({
            percent: Number(
              prefill.deductibleAdjustmentPercent ?? prefill.deductibleAdjustment ?? 0,
            ),
            fixed: Number(prefill.deductibleAdjustmentFixed ?? 0),
          });
          setBrokerCommissionPercent(Number(prefill.brokerCommissionPercent ?? 10));

          // toast({
          //   title: "Previous Selections Found",
          //   description:
          //     "Your previous selections will be restored when the dialog loads.",
          // });
        } else {
          setPremiumAdjustment(0);
          setSelectedCEWItems([]);
          setTPLAdjustment({ percent: 0, fixed: 0 });
          setCEWAdjustment({ percent: 0, fixed: 0 });
          setDeductibleAdjustment({ percent: 0, fixed: 0 });
          setBrokerCommissionPercent(responseBrokerCommission);
        }
      } catch (error) {
        console.error('❌ Error loading product config bundle:', error);
        // setProductConfigBundle(DUMMY_CEW_CONFIG);
        // toast({
        //   title: "Error",
        //   description: "Failed to load product configuration. Please try again.",
        //   variant: "destructive"
        // });
      } finally {
        setIsLoadingProductConfig(false);
      }

      setExtensionsDialogTab('coverage');
      setShowCEWDialog(true);
    };

    const handleCEWSelectionChange = (selectedItems: any[]) => {
      // Always update selectedCEWItems to ensure stored data is properly applied
      // Preserve the TPL extension item if it exists in current state to avoid race conditions/overwrites
      setSelectedCEWItems((prev) => {
        const tplItem = prev.find((item) => item.id === 'tpl-extension');
        if (tplItem) {
          // Check if selectedItems already contains the tplItem to avoid duplication (though unlikely with ID check)
          const exists = selectedItems.some((item) => item.id === 'tpl-extension');
          if (!exists) {
            return [...selectedItems, tplItem];
          }
        }
        return selectedItems;
      });
    };

    const handlePremiumChange = (adjustment: number) => {
      setPremiumAdjustment(adjustment);
    };

    const handleTPLAdjustmentChange = (percentage: number, fixed: number = 0) => {
      setTPLAdjustment({ percent: percentage, fixed });
    };

    const handleCEWAdjustmentChange = (percentage: number, fixed: number = 0) => {
      setCEWAdjustment({ percent: percentage, fixed });
    };

    const handleMandatoryCEWAdjustmentChange = (percentage: number, fixed: number = 0) => {
      setMandatoryCEWAdjustment({ percent: percentage, fixed });
    };

    const handleDeductibleAdjustmentChange = (percentage: number, fixed: number = 0) => {
      setDeductibleAdjustment({ percent: percentage, fixed });
    };

    const handleDeductibleSelectionChange = (option: DeductibleOption | null) => {
      setSelectedDeductibleOption(option);
    };

    // Clear stored data when component mounts (new quote flow)
    useEffect(() => {
      const shouldClear = shouldClearStoredData();

      if (shouldClear) {
        resetStateForNewQuote();
      } else {
        // Just reset component state but keep stored data
        setSelectedQuotes([]);
        setUpdatedQuotes({});
        setSelectedCEWItems([]);
        setTPLAdjustment({ percent: 0, fixed: 0 });
        setCEWAdjustment({ percent: 0, fixed: 0 });
        setDeductibleAdjustment({ percent: 0, fixed: 0 });
        setBrokerCommissionPercent(10);
        setPremiumAdjustment(0);
        setShowCEWDialog(false);
        setProductConfigBundle(null);
      }

      // Clear the flag
      localStorage.removeItem('is_new_quote');
    }, []);

    // Load stored request data for comparison table
    const loadStoredRequestData = () => {
      const storedRequests = JSON.parse(localStorage.getItem('stored_plan_requests') || '{}');
      return storedRequests;
    };

    // Get stored request data for a specific quote and insurer
    const getStoredRequestForQuoteInsurer = (
      quoteId: number | string | undefined,
      insurerId: number,
    ) => {
      const storedRequests = loadStoredRequestData();
      if (!quoteId) return null;
      const quoteBucket = storedRequests[String(quoteId)] || null;
      if (quoteBucket && quoteBucket[insurerId]) {
        return quoteBucket[insurerId];
      }
      // Fallback to legacy flat-by-insurer storage
      if (storedRequests[insurerId]) {
        return storedRequests[insurerId];
      }
      // Fallback scan: find any bucket that contains this insurer
      for (const k of Object.keys(storedRequests)) {
        const bucket = storedRequests[k];
        if (bucket && typeof bucket === 'object' && bucket[insurerId]) {
          return bucket[insurerId];
        }
      }
      return null;
    };

    const getSelectedCoverIdsFromCewItem = useCallback((item: Record<string, unknown>): string[] => {
      const scopeCoverId = String(item.scopeCoverId || '').trim();
      if (scopeCoverId) return [scopeCoverId];

      const selectedCoverIds = Array.isArray(item.selectedCoverIds)
        ? item.selectedCoverIds
        : Array.isArray(item.selected_covers)
          ? (item.selected_covers as Array<Record<string, unknown>>).map((cover) => cover.id)
          : [];

      return Array.from(
        new Set(
          selectedCoverIds
            .map((coverId) => String(coverId || '').trim())
            .filter(Boolean),
        ),
      );
    }, []);

    const buildSelectedCoversForClause = useCallback(
      (
        coverIds: string[],
        quote: { premium?: { covers?: CoverPremiumItem[] | null } } | null | undefined,
      ) => {
        const coverMap = new Map(
          (quote?.premium?.covers || [])
            .filter((cover: CoverPremiumItem) => String(cover.coverId || '').trim())
            .map((cover: CoverPremiumItem) => [String(cover.coverId), cover]),
        );

        return coverIds
          .map((coverId) => {
            const cover = coverMap.get(String(coverId));
            return {
              id: String(coverId),
              name: cover?.name || String(coverId),
              code: cover?.code || '',
              section_id: cover?.sectionId || '',
              section_name: cover?.sectionName || '',
              section_order: cover?.sectionOrder,
            };
          })
          .filter((cover) => cover.id);
      },
      [],
    );

    const buildConfigurableItemsPayload = useCallback(
      (
        items: Array<Record<string, unknown>>,
        basePremium: number,
        quote: { premium?: { covers?: CoverPremiumItem[] | null } } | null | undefined,
      ) => {
        const grouped = new Map<
          string,
          {
            item: Record<string, unknown>;
            coverIds: Set<string>;
          }
        >();

        items
          .filter((item) => item.isSelected && item.id !== 'tpl-extension')
          .forEach((item) => {
            const clauseKey = String(item.sourceClauseId || item.code || item.id || '').trim();
            if (!clauseKey) return;

            const existing = grouped.get(clauseKey);
            const coverIds = getSelectedCoverIdsFromCewItem(item);

            if (existing) {
              coverIds.forEach((coverId) => existing.coverIds.add(coverId));
              return;
            }

            grouped.set(clauseKey, {
              item,
              coverIds: new Set(coverIds),
            });
          });

        return Array.from(grouped.values()).map(({ item, coverIds }) => {
          const options = Array.isArray(item.options)
            ? (item.options as Array<Record<string, unknown>>)
            : [];
          const selectedOption = item.selectedOptionId
            ? options.find((opt) => String(opt.id) === String(item.selectedOptionId))
            : null;

          const loadingVal = Number(
            selectedOption?.value ?? item.defaultValue ?? (item.impact as { premiumAmount?: number })?.premiumAmount ?? 0,
          );
          const rawPricingType = String(item.originalPricingType || item.pricingType || '');
          const outboundPricingType = getOutboundPricingType(rawPricingType);
          const isPercentage = isPercentagePricingType(rawPricingType);
          const evaluatedAmount = isPercentage ? (basePremium * loadingVal) / 100 : loadingVal;
          const selectedCovers = buildSelectedCoversForClause(Array.from(coverIds), quote);

          return {
            code: String(item.code || ''),
            title: String(item.name || item.code || ''),
            description: String(item.description || ''),
            type: outboundPricingType,
            pricingType: outboundPricingType,
            loading: loadingVal,
            value: loadingVal,
            evaluatedAmount,
            premiumImpact: String((item.impact as { premium?: string })?.premium || 'increase'),
            isMandatory: Boolean(item.isMandatory),
            isOptional: !Boolean(item.isMandatory),
            selected: true,
            tags: [] as string[],
            ...(selectedCovers.length > 0 ? { selected_covers: selectedCovers } : {}),
          };
        });
      },
      [
        buildSelectedCoversForClause,
        getSelectedCoverIdsFromCewItem,
        getOutboundPricingType,
        isPercentagePricingType,
      ],
    );

    /** Convert GET selected-premium premiumSnapshot to same shape as stored_plan_requests entry for prefill */
    const premiumSnapshotToStoredPrefill = (
      snapshot: SelectedPremiumSnapshot,
    ): Record<string, unknown> => {
      const sp = snapshot.selectedPremium || {};
      const tpl = snapshot.tplConfiguration?.[0];
      const selectedLimit = tpl?.selectedLimit;
      const configurableItems = snapshot.configurableItems || [];
      const deductibles = snapshot.deductiblesConfiguration || [];

      const completeCEWItems: any[] = configurableItems.flatMap((item, idx) => {
        const baseItem = {
          id: String(item.code || item.title || `configurable-item-${idx}`),
          code: item.code,
          name: item.title || item.code,
          type: 'extension',
          category: 'CLAUSE',
          description: item.description || '',
          isMandatory: !!item.isMandatory,
          isSelected: !!item.selected,
          isPremium: false,
          pricingType: getDisplayPricingType(item.pricingType ?? item.type),
          originalPricingType: item.pricingType ?? item.type ?? '',
          options: [],
          impact: {
            coverage: '',
            premium: (item.premiumImpact === 'decrease'
              ? 'decrease'
              : item.premiumImpact === 'increase'
                ? 'increase'
                : 'neutral') as 'increase' | 'decrease' | 'neutral',
            premiumAmount: Number(item.evaluatedAmount ?? item.value ?? item.loading ?? 0),
          },
          defaultValue: Number(item.value ?? item.loading ?? 0),
          selected_covers: Array.isArray(item.selected_covers) ? item.selected_covers : [],
          selectedCoverIds: Array.isArray(item.selected_covers)
            ? item.selected_covers
                .map((cover) => String((cover as Record<string, unknown>)?.id || '').trim())
                .filter(Boolean)
            : [],
        };

        if (!baseItem.selectedCoverIds.length) return [baseItem];

        return baseItem.selectedCoverIds.map((coverId) => ({
          ...baseItem,
          id: `${baseItem.id}__COVER__${coverId}`,
          scopeCoverId: coverId,
          sourceClauseId: String(item.code || item.title || `configurable-item-${idx}`),
        }));
      });

      if (selectedLimit != null) {
        completeCEWItems.push({
          id: 'tpl-extension',
          code: 'TPL',
          name: selectedLimit.description || 'TPL',
          type: 'extension',
          category: 'TPL Extensions',
          description: selectedLimit.description || '',
          isMandatory: false,
          isSelected: true,
          options: [],
          impact: {
            coverage: 'Enhanced TPL coverage',
            premium: (selectedLimit.premiumImpact === 'decrease' ? 'decrease' : 'increase') as
              | 'increase'
              | 'decrease'
              | 'neutral',
            premiumAmount: Number(selectedLimit.loading ?? 0),
          },
          defaultValue: Number(selectedLimit.limitValue ?? 0),
        });
      }

      const deductibleSelection =
        deductibles.length > 0 && (deductibles[0] as any)?.selectedDeductible
          ? { value: (deductibles[0] as any).selectedDeductible?.value }
          : null;

      return {
        premium_amount: sp.totalPremium ?? 0,
        tplAdjustmentPercent: 0,
        tplAdjustmentFixed: selectedLimit ? Number(selectedLimit.loading ?? 0) : 0,
        tplSelection: selectedLimit ? { value: selectedLimit.limitValue } : undefined,
        cewAdjustmentPercent: Number(sp.cewAdjustmentsPercentage ?? 0),
        cewAdjustmentFixed: 0,
        deductibleAdjustmentPercent: 0,
        deductibleAdjustmentFixed: 0,
        deductibleSelection,
        brokerCommissionPercent: Number(sp.brokerCommissionPercentage ?? 10),
        selectedCEWItems: completeCEWItems.filter((i: any) => i.isSelected),
        completeCEWItems,
        lastUpdated: new Date().toISOString(),
      };
    };

    /** Build SelectPremiumRequest from prefill (stored shape) + quote so Next button sends same payload as Select Plan */
    const buildSelectPayloadFromPrefill = (
      prefill: Record<string, unknown>,
      quote: {
        id: number;
        annualPremium?: number;
        insurerName?: string;
        coverageAmount?: number;
        premium?: { covers?: CoverPremiumItem[] | null } | null;
      },
    ): SelectPremiumRequest => {
      const brokerPct = Number((prefill.brokerCommissionPercent as number) ?? 10);
      const grossPremiumBase = Number((prefill.premium_amount as number) ?? 0);
      const basePremium = Number(quote.annualPremium ?? 0);
      const completeCEWItems = (prefill.completeCEWItems as any[]) || [];
      const tplValue = (prefill.tplSelection as any)?.value;
      const tplFixed = Number(prefill.tplAdjustmentFixed ?? 0);
      const cewPct = Number(prefill.cewAdjustmentPercent ?? 0);
      const prefillBrokerMeta = resolveBrokerCommissionMetaFromPrefill(
        prefill,
        productConfigBundle?.policy_limits_and_deductible?.policy_limits,
      );
      const basePct = Number(prefillBrokerMeta.brokerBaseCommissionPercentage || 0);
      const technicalPremium = round2(grossPremiumBase - (grossPremiumBase * basePct) / 100);
      const denom = 1 - brokerPct / 100;
      const totalPremium = round2(
        Number.isFinite(denom) && denom > 0 ? technicalPremium / denom : grossPremiumBase,
      );
      const brokerAmount = round2(totalPremium - technicalPremium);
      const netPremium = technicalPremium;

      const configurableItems = buildConfigurableItemsPayload(
        completeCEWItems as Array<Record<string, unknown>>,
        basePremium,
        quote,
      );

      const tplConfiguration =
        tplValue != null && tplValue > 0
          ? [
              {
                defaultLimit: 12,
                selectedLimit: {
                  code: 'TPL',
                  limitValue: Number(tplValue),
                  loading: tplFixed,
                  description: 'TPL',
                  pricingType: 'Fixed',
                  premiumImpact: 'increase',
                  currency: currency || 'AED',
                },
              },
            ]
          : [];

      const deductiblesConfiguration: any[] = [];
      const dedSel = prefill.deductibleSelection as any;
      if (dedSel?.value != null) {
        deductiblesConfiguration.push({
          selectedDeductible: {
            code: 'DEDUCTIBLE',
            value: Number(dedSel.value),
            quoteOption: '',
            loading: 0,
            premiumImpact: '',
          },
        });
      }

      return {
        configurableItems,
        deductiblesConfiguration,
        selectedPremium: {
          basePremium,
          totalPremium,
          loadingAmount: 0,
          discountAmount: 0,
          feeAmount: 0,
          feeComponents: {},
          currency: currency || 'AED',
          netPremium,
          brokerCommissionPercentage: brokerPct,
          brokerCommissionAmount: brokerAmount,
          brokerMinCommissionPercentage: prefillBrokerMeta.brokerMinCommissionPercentage,
          brokerMaxCommissionPercentage: prefillBrokerMeta.brokerMaxCommissionPercentage,
          brokerBaseCommissionPercentage: prefillBrokerMeta.brokerBaseCommissionPercentage,
          cewAdjustmentsPercentage: cewPct,
          cewAdjustmentsAmount: tplFixed,
        },
        tplConfiguration,
      };
    };

    // Clear stored data for a specific insurer

    // Clear all stored data (for new quote flow)
    const clearAllStoredData = () => {
      localStorage.removeItem('stored_plan_requests');
    };

    // Set flag for new quote flow

    // Check if we should clear stored data (only for truly new quotes)
    const shouldClearStoredData = () => {
      const isNewQuote = localStorage.getItem('is_new_quote') === 'true';
      const isNewProposal = window.location.search.includes('new=true');
      const isProposalPage = window.location.pathname.includes('/customer/proposal');

      // Only clear if it's explicitly a new quote or new proposal
      return isNewQuote || (isProposalPage && isNewProposal);
    };

    // Reset all state for new quote
    const resetStateForNewQuote = () => {
      setSelectedQuotes([]);
      setUpdatedQuotes({});
      setSelectedCEWItems([]);
      setTPLAdjustment({ percent: 0, fixed: 0 });
      setCEWAdjustment({ percent: 0, fixed: 0 });
      setDeductibleAdjustment({ percent: 0, fixed: 0 });
      setBrokerCommissionPercent(10);
      setPremiumAdjustment(0);
      setShowCEWDialog(false);
      setProductConfigBundle(null);
      clearAllStoredData();

      // Also clear any other related localStorage items
      localStorage.removeItem('coverages_selected');
      localStorage.removeItem('plans_selected');
      localStorage.removeItem('selected_plan_id');
      localStorage.removeItem('selected_plan_data');
    };

    // Validate mandatory CEW items
    const validateMandatoryCEWItems = () => {
      const unselectedMandatoryItems = selectedCEWItems.filter(
        (item) => item.isMandatory && !item.isSelected,
      );
      if (unselectedMandatoryItems.length > 0) {
        const itemNames = unselectedMandatoryItems.map((item) => item.name).join(', ');
        toast({
          title: 'Mandatory Items Required',
          description: `Please select the following mandatory Policy Extensions & Conditions: ${itemNames}`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    };

    const handleTPLSelectionChange = (tplOption: any) => {
      if (tplOption) {
        // Store the TPL limit value
        setSelectedTPLLimitValue(tplOption.value);

        // Add TPL extension to selected items
        const tplExtension = {
          id: 'tpl-extension',
          code: 'TPL',
          name: `TPL Limit Extension - ${tplOption.label}`,
          type: 'extension',
          category: 'TPL Extensions',
          description: tplOption.description || 'Third Party Liability coverage extension',
          isMandatory: false,
          isSelected: true,
          impact: {
            coverage: 'Enhanced TPL coverage',
            premium: tplOption.premiumAdjustment > 0 ? 'increase' : 'decrease',
            premiumAmount: Math.abs(tplOption.premiumAdjustment),
          },
        };

        setSelectedCEWItems((prev) => {
          // Remove existing TPL extension if any
          const filtered = prev.filter((item) => item.id !== 'tpl-extension');
          // Add new TPL extension
          return [...filtered, tplExtension];
        });
      } else {
        // Clear the TPL limit value
        setSelectedTPLLimitValue(0);

        // Remove TPL extension from selected items
        setSelectedCEWItems((prev) => prev.filter((item) => item.id !== 'tpl-extension'));
      }
    };

    /** Resolve the base premium (excludes fees) — uses cart-like (selected covers) when the flag is on */
    const resolveBasePremium = (quote: QuoteRow): number => {
      if (isCartLikeCoverSelection && quote.premium?.covers?.length) {
        const selected = selectedCoversByQuote[quote.id];
        if (!selected || selected.size === 0) return 0;
        return quote.premium.covers
          .filter((c: CoverPremiumItem) => selected.has(c.coverId))
          .reduce((acc: number, c: CoverPremiumItem) => acc + (c.netPremium || 0), 0);
      }
      const baseFromBreakdown = Number(quote.premium?.base ?? NaN);
      if (Number.isFinite(baseFromBreakdown)) return baseFromBreakdown;
      return quote.validationResult?.basePremium || quote.annualPremium;
    };

    const calculateFinalPremium = () => {
      if (!selectedQuoteForCEW) return 0;

      const basePremium = resolveBasePremium(selectedQuoteForCEW);

      const tplAmount = (basePremium * tplAdjustment.percent) / 100 + tplAdjustment.fixed;
      const cewAmount = (basePremium * cewAdjustment.percent) / 100 + cewAdjustment.fixed;
      const mandatoryCewAmount = (basePremium * mandatoryCewAdjustment.percent) / 100 + mandatoryCewAdjustment.fixed;
      const deductibleAmount =
        (basePremium * deductibleAdjustment.percent) / 100 + deductibleAdjustment.fixed;

      const grossPremium = basePremium + tplAmount + cewAmount + mandatoryCewAmount + deductibleAmount;

      return grossPremium;
    };

    const round2 = (value: number): number => {
      const n = Number(value) || 0;
      if (!Number.isFinite(n)) return 0;
      return Math.round((n + Number.EPSILON) * 100) / 100;
    };

    const calculateFeeTotals = (
      premiumBeforeFees: number,
      feeTypes: FeeType[] | undefined,
    ): {
      totalFees: number;
      feeComponents: Record<string, number>;
      feeLines: Array<{
        label: string;
        adjustmentType: string;
        adjustmentValue: number;
        amount: number;
      }>;
    } => {
      const base = round2(premiumBeforeFees);
      const feeComponents: Record<string, number> = {};
      let totalFees = 0;
      const feeLines: Array<{
        label: string;
        adjustmentType: string;
        adjustmentValue: number;
        amount: number;
      }> = [];

      (feeTypes || []).forEach((ft: FeeType, index: number) => {
        const labelRaw = String(ft?.label || '').trim();
        const label = labelRaw ? labelRaw : `Fee ${index + 1}`;
        const uniqueLabel = feeComponents[label] !== undefined ? `${label} (${index + 1})` : label;
        const adjustmentType = String(ft?.adjustmentType || '').toUpperCase();
        const adjustmentValue = Number(ft?.adjustmentValue || 0);

        let amount = 0;
        if (adjustmentType === 'PERCENTAGE') {
          amount = base * (adjustmentValue / 100);
        } else if (adjustmentType === 'FACTOR') {
          amount = base * (adjustmentValue - 1);
        } else {
          amount = adjustmentValue;
        }

        const roundedAmount = round2(amount);
        feeComponents[uniqueLabel] = roundedAmount;
        totalFees = round2(totalFees + roundedAmount);
        feeLines.push({
          label: uniqueLabel,
          adjustmentType,
          adjustmentValue,
          amount: roundedAmount,
        });
      });

      return {
        totalFees: round2(totalFees),
        feeComponents,
        feeLines,
      };
    };

    // Memoized premium calculation that updates when trigger changes
    const finalPremium = useMemo(() => {
      const computed = calculateFinalPremium();
      return computed;
    }, [
      selectedQuoteForCEW,
      tplAdjustment,
      cewAdjustment,
      mandatoryCewAdjustment,
      deductibleAdjustment,
      brokerCommissionPercent,
      productConfigBundle,
      premiumRecalculationTrigger,
      selectedCoversByQuote,
    ]);

    const selectedFeeTypes = useMemo(() => {
      const insurerData = comparisonData?.insurers?.find(
        (ins) => String(ins.insurer_id) === String(selectedQuoteForCEW?.insurerId),
      );
      return (insurerData?.feeTypes || []) as FeeType[];
    }, [comparisonData, selectedQuoteForCEW]);

    const feeTotals = useMemo(
      () => calculateFeeTotals(finalPremium, selectedFeeTypes),
      [finalPremium, selectedFeeTypes],
    );

    const baseBrokerCommissionPercent = useMemo(() => {
      if (!selectedQuoteForCEW) return 10;
      const comparisonInsurer = comparisonData?.insurers?.find(
        (ins) =>
          String(ins.insurer_id) ===
          String(selectedQuoteForCEW.insurerId ?? selectedQuoteForCEW.id),
      );
      const brokerMeta = resolveBrokerCommissionMeta({
        ratingInsurerCommissions: undefined,
        quoteCommissions: selectedQuoteForCEW.commissions ?? null,
        comparisonInsurerCommissions: comparisonInsurer?.commissions ?? null,
        policyLimits: productConfigBundle?.policy_limits_and_deductible?.policy_limits,
      });
      const pct = Number(brokerMeta.brokerBaseCommissionPercentage);
      return Number.isFinite(pct) ? pct : 10;
    }, [selectedQuoteForCEW, comparisonData, productConfigBundle]);

    const netPremium = useMemo(() => {
      const gross = Number(finalPremium || 0);
      const pct = Number(baseBrokerCommissionPercent || 0);
      const amount = (gross * pct) / 100;
      return round2(gross - amount);
    }, [finalPremium, baseBrokerCommissionPercent]);

    const totalAnnualPremiumBeforeFees = useMemo(() => {
      const technical = Number(netPremium || 0);
      const pct = Number(brokerCommissionPercent || 0);
      const denom = 1 - pct / 100;
      if (!Number.isFinite(denom) || denom <= 0) return 0;
      return round2(technical / denom);
    }, [netPremium, brokerCommissionPercent]);

    const totalBasePremium = useMemo(() => {
      const technical = Number(netPremium || 0);
      const basePct = Number(baseBrokerCommissionPercent || 0);
      const denom = 1 - basePct / 100;
      if (!Number.isFinite(denom) || denom <= 0) return 0;
      return round2(technical / denom);
    }, [netPremium, baseBrokerCommissionPercent]);

    const brokerCommissionAmount = useMemo(() => {
      return round2(Number(totalAnnualPremiumBeforeFees || 0) - Number(netPremium || 0));
    }, [totalAnnualPremiumBeforeFees, netPremium]);

    const feeTotalsDynamic = useMemo(
      () => calculateFeeTotals(totalBasePremium, selectedFeeTypes),
      [totalBasePremium, selectedFeeTypes],
    );

    const finalPremiumWithFees = useMemo(
      () => round2(totalAnnualPremiumBeforeFees + feeTotalsDynamic.totalFees),
      [totalAnnualPremiumBeforeFees, feeTotalsDynamic.totalFees],
    );

    const handleUpdatePremium = () => {
      if (!selectedQuoteForCEW) return;

      const finalPremiumValue = calculateFinalPremium();

      // Build complete request payload for storage
      const completeRequestPayload = buildPlanSelectionPayload(selectedQuoteForCEW);

      // Store the complete request keyed by quoteId, nested by insurer ID
      const storedRequests = JSON.parse(localStorage.getItem('stored_plan_requests') || '{}');
      const quoteKey = String(effectiveQuoteKey || '');
      const insurerKey = selectedQuoteForCEW.id;
      const storedEntry = {
        ...completeRequestPayload,
        premium_amount: finalPremiumValue,
        lastUpdated: new Date().toISOString(),
        tplAdjustmentPercent: tplAdjustment.percent,
        tplAdjustmentFixed: tplAdjustment.fixed,
        tplSelection: { value: selectedTPLLimitValue },
        cewAdjustmentPercent: cewAdjustment.percent,
        cewAdjustmentFixed: cewAdjustment.fixed,
        deductibleAdjustmentPercent: deductibleAdjustment.percent,
        deductibleAdjustmentFixed: deductibleAdjustment.fixed,
        deductibleSelection: selectedDeductibleOption,
        brokerCommissionPercent,
        brokerMinCommissionPercentage:
          completeRequestPayload.premium_summary.broker_min_commission_pct,
        brokerMaxCommissionPercentage:
          completeRequestPayload.premium_summary.broker_max_commission_pct,
        brokerBaseCommissionPercentage:
          completeRequestPayload.premium_summary.broker_base_commission_pct,
        selectedCEWItems: selectedCEWItems.filter((item) => item.isSelected),
        completeCEWItems: selectedCEWItems,
      };
      if (!quoteKey) {
        // Fallback: if quoteId unavailable, store flat by insurer (legacy behavior)
        storedRequests[insurerKey] = storedEntry;
      } else {
        const bucket = storedRequests[quoteKey] || {};
        bucket[insurerKey] = storedEntry;
        storedRequests[quoteKey] = bucket;
      }
      localStorage.setItem('stored_plan_requests', JSON.stringify(storedRequests));

      // Endorsement: keep prefill in sync so Next button sends same payload as Select Plan
      if (endorsementId) {
        setEndorsementPrefill(storedEntry as Record<string, unknown>);
      }

      // Update the quotes data with new premium and CEW selections
      setUpdatedQuotes((prev) => ({
        ...prev,
        [selectedQuoteForCEW.id]: {
          premium: finalPremiumValue,
          cewItems: selectedCEWItems.filter((item) => item.isSelected),
          isUpdated: true,
        },
      }));

      toast({
        title: 'Premium Updated',
        description: `New annual premium: ${LibUtils.formatCurrency(finalPremiumValue, currency)}`,
      });

      // Close the dialog
      setShowCEWDialog(false);
    };

    // Build plan selection request payload
    const buildPlanSelectionPayload = (
      quote: any,
      options?: { ratingInsurerCommissions?: Record<string, unknown> | null },
    ): PlanSelectionRequest => {
      const validationResult = quote.validationResult;
      const basePremium = resolveBasePremium(quote);
      const comparisonInsurer = comparisonData?.insurers?.find(
        (ins: any) => String(ins.insurer_id) === String(quote?.insurerId ?? quote?.id),
      );
      const brokerMeta = resolveBrokerCommissionMeta({
        ratingInsurerCommissions: options?.ratingInsurerCommissions ?? undefined,
        quoteCommissions: quote?.commissions,
        comparisonInsurerCommissions: (comparisonInsurer as any)?.commissions,
        policyLimits: productConfigBundle?.policy_limits_and_deductible?.policy_limits,
      });

      // Calculate adjustments
      const tplAdjustmentAmount = (basePremium * tplAdjustment.percent) / 100 + tplAdjustment.fixed;
      const cewAdjustmentAmount = (basePremium * cewAdjustment.percent) / 100 + cewAdjustment.fixed;
      const deductibleAdjustmentAmount =
        (basePremium * deductibleAdjustment.percent) / 100 + deductibleAdjustment.fixed;

      // Calculate final premium = base premium + adjustments
      const baseGrossPremium =
        basePremium + tplAdjustmentAmount + cewAdjustmentAmount + deductibleAdjustmentAmount;

      const basePct = Number(brokerMeta.brokerBaseCommissionPercentage || 0);
      const technicalPremium = round2(baseGrossPremium - (baseGrossPremium * basePct) / 100);
      const selectedPct = Number(brokerCommissionPercent || 0);
      const denom = 1 - selectedPct / 100;
      const totalAnnualPremium = round2(
        Number.isFinite(denom) && denom > 0 ? technicalPremium / denom : baseGrossPremium,
      );
      const revisedBrokerCommission = round2(totalAnnualPremium - technicalPremium);

      // Check if minimum premium was applied
      const isMinimumPremiumApplied = validationResult?.isMinimumPremiumApplied || false;
      const minimumPremiumValue = validationResult?.minimumPremiumValue || 0;

      // Build selected extensions with proper structure
      const selectedExtensions: Record<string, any> = {};
      selectedCEWItems
        .filter((item) => item.isSelected)
        .forEach((item) => {
          const key =
            item.code && typeof item.code === 'string'
              ? item.code.toLowerCase().replace(/[^a-z0-9]/g, '_')
              : `extension_${item.id}`;

          const selectedOption = item.selectedOptionId
            ? item.options?.find((opt) => opt.id === item.selectedOptionId)
            : null;

          const extensionData: any = {
            code: item.code || `EXT${item.id}`,
            label: selectedOption?.label || item.name,
            description: item.description || item.impact?.coverage || '',
          };

          // Add impact based on pricing type
          if (selectedOption) {
            if (selectedOption.type === 'percentage') {
              extensionData.impact_pct = selectedOption.value;
            } else {
              extensionData.impact_amount = selectedOption.value;
            }
          } else {
            // Use base rate - determine if it's percentage or fixed
            const isPercentage = item.pricingType === 'percentage';
            if (isPercentage) {
              extensionData.impact_pct = item.defaultValue;
            } else {
              extensionData.impact_amount = item.defaultValue;
            }
          }

          selectedExtensions[key] = extensionData;
        });

      // Build TPL limit
      const tplLimit = {
        label: `${currency} ${(quote.coverageAmount / 1000000).toFixed(0)}M`,
        impact_pct: tplAdjustment.percent,
        impact_amount: tplAdjustment.fixed,
        description: `Third Party Liability up to ${currency} ${(
          quote.coverageAmount / 1000000
        ).toFixed(0)} Million`,
      };

      // Build selected covers for cart-like mode
      const selectedCoversPayload =
        isCartLikeCoverSelection && quote.premium?.covers?.length
          ? (() => {
              const selected = selectedCoversByQuote[quote.id];
              return (quote.premium.covers as CoverPremiumItem[]).map(
                (cover: CoverPremiumItem) => ({
                  coverId: cover.coverId,
                  name: cover.name || cover.code || cover.coverId,
                  sectionId: cover.sectionId,
                  sectionName: cover.sectionName,
                  sumInsured: cover.sumInsured,
                  netPremium: cover.netPremium,
                  isSelected: selected ? selected.has(cover.coverId) : false,
                }),
              );
            })()
          : undefined;

      return {
        insurer_name: quote.insurerName,
        insurer_id: quote.id,
        premium_amount: totalAnnualPremium,
        is_minimum_premium_applied: isMinimumPremiumApplied,
        minimum_premium_value: minimumPremiumValue,
        extensions: {
          tpl_limit: tplLimit,
          selected_extensions: selectedExtensions,
          selected_plan: {
            insurer_name: quote.insurerName,
            base_premium: basePremium,
            coverage_amount:
              isCartLikeCoverSelection && quote.premium?.covers?.length
                ? getCartLikePremium(quote).sumInsured
                : quote.coverageAmount,
            deductible: 25000, // Default deductible
          },
        },
        premium_summary: {
          net_premium: technicalPremium,
          broker_commission_pct: brokerCommissionPercent,
          broker_commission_amount: revisedBrokerCommission,
          broker_min_commission_pct: brokerMeta.brokerMinCommissionPercentage,
          broker_max_commission_pct: brokerMeta.brokerMaxCommissionPercentage,
          broker_base_commission_pct: brokerMeta.brokerBaseCommissionPercentage,
          cew_adjustments_pct: tplAdjustment.percent + cewAdjustment.percent,
          cew_adjustments_amount: tplAdjustmentAmount + cewAdjustmentAmount, // Note: this sums the amount, but 'cew_adjustments_pct' might be misleading if mixed
          total_annual_premium: totalAnnualPremium,
        },
        ...(selectedCoversPayload ? { selected_covers: selectedCoversPayload } : {}),
      };
    };

    // Handle plan selection confirmation
    const handleSelectPlanClick = (quoteId: number) => {
      setPendingPlanSelection(quoteId);
      setShowPlanConfirmationDialog(true);
    };

    // Confirm plan selection
    const confirmPlanSelection = async () => {
      if (pendingPlanSelection) {
        setShowPlanConfirmationDialog(false);
        handleSelectPlanWithAPI(pendingPlanSelection);
        setPendingPlanSelection(null);
      }
    };

    // Cancel plan selection
    const cancelPlanSelection = () => {
      setShowPlanConfirmationDialog(false);
      setPendingPlanSelection(null);
    };

    // Handle plan selection with API call (quoteOverride: when calling from Next step to sync endorsement selection)
    const handleSelectPlanWithAPI = async (quoteId: number, quoteOverride?: any) => {
      // Find the selected quote directly from the list first
      const selectedQuote = realQuotes.find((q) => q.id === quoteId);

      // Select the payload target: override -> active CEW if matching -> directly selected quote
      const quoteForPayload =
        quoteOverride ??
        (selectedQuoteForCEW?.id === quoteId ? selectedQuoteForCEW : selectedQuote);

      try {
        setIsSubmittingPlan(true);

        // Validate mandatory CEW items (skip when syncing from Next with override)
        if (!quoteOverride && !validateMandatoryCEWItems()) {
          setIsSubmittingPlan(false);
          return;
        }

        if (!selectedQuote) {
          throw new Error('Selected quote not found. Please refresh the page and try again.');
        }

        if (!quoteForPayload) {
          throw new Error('Could not identify the requested quote payload details.');
        }

        if (!quoteForPayload && endorsementId) {
          setIsSubmittingPlan(false);
          return;
        }

        // Validate required data
        if (selectedQuote.insurerName == null || selectedQuote.coverageAmount == null) {
          console.warn('[SelectPlan] Invalid quote data:', {
            insurerName: selectedQuote.insurerName,
            coverageAmount: selectedQuote.coverageAmount,
          });
          throw new Error('Invalid quote data. Please refresh the page and try again.');
        }
        const selectionStore = useQuoteSelectionStore.getState();
        const selectedOrgIdFromStorage = localStorage.getItem('selected_insurer_org_id');
        const orgId =
          (quoteForPayload as any)?.insurerOrganizationId ||
          (quoteForPayload as any)?.organizationId ||
          quoteForPayload?.insurerId ||
          selectionStore.insurerOrganizationId ||
          selectedOrgIdFromStorage;
        const brokerOrgId = orgId;
        const targetResponseId = responseId || resumeParam;
        const insurerData =
          comparisonData?.insurers?.find(
            (ins: any) => String(ins.insurer_id) === String(quoteForPayload?.insurerId),
          ) || null;
        let decisionVal = 'auto_approve';
        let selectedInsurerObj: any = insurerData || null;
        let ratingQuoteId: string | null = null;
        try {
          const ratingId = endorsementId ?? targetResponseId;
          if (ratingId && !endorsementId) {
            const ratingData = await calculateQuoteRating(String(targetResponseId));
            const insurersArr: any[] = ratingData.insurers || ratingData.results || [];
            selectedInsurerObj =
              insurersArr.find(
                (it: any) => String(it.insurer_id || it.insurerId) === String(quoteForPayload.id),
              ) ||
              insurersArr[0] ||
              {};
            ratingQuoteId = (ratingData.quote_id || ratingData.quoteId || null) as any;
            const vResults: any[] =
              selectedInsurerObj.validationResults ||
              selectedInsurerObj.config?.validationResults ||
              [];
            const firstDecision = (vResults[0]?.decision || '').toString().toLowerCase();
            if (firstDecision.includes('manual')) decisionVal = 'manual_review';
            else if (firstDecision.includes('auto')) decisionVal = 'auto_approve';
          }
        } catch {}

        const validationResult = quoteForPayload.validationResult;
        const basePremium = resolveBasePremium(quoteForPayload);
        const premiumData = selectedInsurerObj?.premium || (insurerData as any)?.premium || {};
        const feeTypes = selectedInsurerObj?.feeTypes || (insurerData as any)?.feeTypes || [];
        const freshCommissions =
          selectedInsurerObj?.commissions || (insurerData as any)?.commissions || {};
        const apiBrokerCommission =
          freshCommissions.brokerCommissionPercent != null
            ? Number(freshCommissions.brokerCommissionPercent)
            : 10;

        // Check if there is stored data for this specific quote to prevent using another quote's state
        let localTplAdjustment = tplAdjustment;
        let localCewAdjustment = cewAdjustment;
        let localDeductibleAdjustment = deductibleAdjustment;
        let localSelectedTPLLimitValue = selectedTPLLimitValue;
        let localSelectedDeductibleOption = selectedDeductibleOption;
        let localSelectedCEWItems = selectedCEWItems;
        let localBrokerCommissionPercent = brokerCommissionPercent;

        if (selectedQuoteForCEW?.id !== quoteId) {
          try {
            const storedRequests = JSON.parse(localStorage.getItem('stored_plan_requests') || '{}');
            const quoteKey = String(effectiveQuoteKey || '');
            const insurerKey = String(quoteId);
            const storedData =
              (quoteKey && storedRequests[quoteKey]?.[insurerKey]) || storedRequests[insurerKey];

            if (storedData) {
              localTplAdjustment = {
                percent: Number(storedData.tplAdjustmentPercent || 0),
                fixed: Number(storedData.tplAdjustmentFixed || 0),
              };
              localCewAdjustment = {
                percent: Number(storedData.cewAdjustmentPercent || 0),
                fixed: Number(storedData.cewAdjustmentFixed || 0),
              };
              localDeductibleAdjustment = {
                percent: Number(storedData.deductibleAdjustmentPercent || 0),
                fixed: Number(storedData.deductibleAdjustmentFixed || 0),
              };
              localSelectedTPLLimitValue = Number(storedData.tplSelection?.value || 0);
              localSelectedDeductibleOption = storedData.deductibleSelection || null;
              localSelectedCEWItems = storedData.completeCEWItems || [];
              localBrokerCommissionPercent =
                storedData.brokerCommissionPercent || apiBrokerCommission;
            } else {
              // Defaults if untouched
              localTplAdjustment = { percent: 0, fixed: 0 };
              localCewAdjustment = { percent: 0, fixed: 0 };
              localDeductibleAdjustment = { percent: 0, fixed: 0 };
              localSelectedTPLLimitValue = 0;
              localSelectedDeductibleOption = null;
              localSelectedCEWItems = getCEWItems(quoteId);
              localBrokerCommissionPercent = apiBrokerCommission;
            }
          } catch (e) {
            console.warn('Failed to load local state for quote selection:', e);
          }
        }

        const tplExtList =
          productConfigBundle?.tpl_extensions ||
          quoteForPayload.pricingConfig?.tpl_extensions ||
          internalInsurerPricingConfigs[String(quoteForPayload.id)]?.tpl_extensions ||
          [];

        const rawTplValue = String(localSelectedTPLLimitValue || '0').replace(/,/g, '');
        const tplLimitAmount = Number(rawTplValue);

        let chosenTpl =
          tplExtList.find(
            (e: any) => Number(String(e.limit_value).replace(/,/g, '')) === tplLimitAmount,
          ) || null;

        const defaultTplLimit = Number(
          quoteForPayload.pricingConfig?.tpl_limits?.default_limit ||
            internalInsurerPricingConfigs[String(quoteForPayload.id)]?.tpl_limits?.default_limit ||
            0,
        );

        // If no explicit TPL extension matches, but the amount matches the default, create a default config
        if (!chosenTpl && tplLimitAmount === defaultTplLimit && tplLimitAmount > 0) {
          chosenTpl = {
            description: 'Default Limit',
            pricing_type: 'Fixed',
            pricing_value: 0,
            currency: currency || 'N/A',
            limit_value: defaultTplLimit,
          };
        }

        const tplConfig =
          tplLimitAmount > 0 && chosenTpl
            ? {
                defaultLimit: defaultTplLimit,
                selectedLimit: {
                  code: 'TPL',
                  limitValue: tplLimitAmount,
                  description: chosenTpl?.description || '',
                  pricingType: chosenTpl?.pricing_type || '',
                  loading: Number(chosenTpl?.pricing_value || 0),
                  premiumImpact:
                    localSelectedCEWItems.find((i: any) => i.id === 'tpl-extension')?.impact
                      ?.premium ||
                    String(
                      (chosenTpl?.pricing_type || '').toLowerCase().includes('percent')
                        ? ((basePremium * Number(chosenTpl?.pricing_value || 0)) / 100).toFixed(2)
                        : Number(chosenTpl?.pricing_value || 0).toFixed(2),
                    ),
                  currency: chosenTpl?.currency || currency || 'N/A',
                },
              }
            : undefined;

        let deductiblesConfig: any = undefined;
        if (localSelectedDeductibleOption) {
          const matchDed =
            productConfigBundle?.deductibles?.find(
              (d: any) => Number(d.value) === Number(localSelectedDeductibleOption.value),
            ) || null;
          const dedDiscount =
            selectedInsurerObj?.config?.deductibles?.[0]?.discount !== undefined
              ? selectedInsurerObj?.config?.deductibles?.[0]?.discount
              : undefined;
          deductiblesConfig = {
            selectedDeductible: {
              code: 'DEDUCTIBLE',
              value: Number(localSelectedDeductibleOption.value || 0),
              quoteOption: matchDed?.quote_action || '',
              loading: Number(matchDed?.discount || 0),
              premiumImpact:
                dedDiscount !== undefined
                  ? typeof dedDiscount === 'number'
                    ? `${dedDiscount}%`
                    : String(dedDiscount).endsWith('%')
                      ? String(dedDiscount)
                      : `${dedDiscount}%`
                  : '',
            },
          };
        }

        const configurableItems = buildConfigurableItemsPayload(
          (localSelectedCEWItems || []) as Array<Record<string, unknown>>,
          basePremium,
          quoteForPayload,
        );

        // Calculate breakdown for selectedPremium (align broker bounds with calculate-rating commissions)
        const acceptBrokerMeta = resolveBrokerCommissionMeta({
          ratingInsurerCommissions: selectedInsurerObj?.commissions,
          quoteCommissions: (quoteForPayload as any)?.commissions,
          comparisonInsurerCommissions: (insurerData as any)?.commissions,
          policyLimits: productConfigBundle?.policy_limits_and_deductible?.policy_limits,
        });

        const tplAdjustmentAmount =
          (basePremium * localTplAdjustment.percent) / 100 + localTplAdjustment.fixed;
        const cewAdjustmentAmount =
          (basePremium * localCewAdjustment.percent) / 100 + localCewAdjustment.fixed;
        const deductibleAdjustmentAmount =
          (basePremium * localDeductibleAdjustment.percent) / 100 + localDeductibleAdjustment.fixed;

        const baseGrossPremium =
          basePremium + tplAdjustmentAmount + cewAdjustmentAmount + deductibleAdjustmentAmount;

        const basePct = Number(acceptBrokerMeta.brokerBaseCommissionPercentage || 0);
        const technicalPremium = round2(baseGrossPremium - (baseGrossPremium * basePct) / 100);
        const selectedPct = Number(localBrokerCommissionPercent || 0);
        const denom = 1 - selectedPct / 100;
        const totalAnnualPremiumBeforeFees = round2(
          Number.isFinite(denom) && denom > 0 ? technicalPremium / denom : baseGrossPremium,
        );
        const revisedBrokerCommission = round2(totalAnnualPremiumBeforeFees - technicalPremium);

        const feeTotals = calculateFeeTotals(baseGrossPremium, feeTypes);
        const totalFees = feeTotals.totalFees;
        const feeComponents = feeTotals.feeComponents;
        const totalPremiumAmount = round2(totalAnnualPremiumBeforeFees + totalFees);

        // Set selected plan in store
        const setSelectedPlan = usePlanSelectionStore.getState().setSelectedPlan;
        setSelectedPlan({
          tplLimitAdjustment: localSelectedTPLLimitValue,
          tplAdjustmentAmount: tplAdjustmentAmount,
          netPremium: technicalPremium,
          brokerCommissionPercent: localBrokerCommissionPercent,
          brokerCommissionAmount: revisedBrokerCommission,
          totalAnnualPremium: Number(totalPremiumAmount || 0),
          currency: quoteForPayload?.currency || 'AED',
          insurerName: quoteForPayload?.insurerName,
          coverageAmount:
            isCartLikeCoverSelection && quoteForPayload.premium?.covers?.length
              ? getCartLikePremium(quoteForPayload).sumInsured
              : quoteForPayload?.coverageAmount,
        });
        const acceptPayload: any = {
          decision: decisionVal,
          brokerOrgId: brokerOrgId || '',
          insurerOrgId: orgId || '',
          productId: productId ?? comparisonData?.product_id ?? 1,
          selectedPremium: {
            basePremium: Number(basePremium || 0),
            totalPremium: Number(totalPremiumAmount || 0),
            loadingAmount: Number(premiumData.loading || 0),
            discountAmount: Number(premiumData.discount || 0),
            feeAmount: Number(totalFees || 0),
            feeComponents: feeComponents,
            currency: currency || 'N/A',
            netPremium: technicalPremium,
            brokerCommissionPercentage: localBrokerCommissionPercent,
            brokerCommissionAmount: revisedBrokerCommission,
            brokerMinCommissionPercentage: acceptBrokerMeta.brokerMinCommissionPercentage,
            brokerMaxCommissionPercentage: acceptBrokerMeta.brokerMaxCommissionPercentage,
            brokerBaseCommissionPercentage: acceptBrokerMeta.brokerBaseCommissionPercentage,
            cewAdjustmentsPercentage: localTplAdjustment.percent + localCewAdjustment.percent,
            cewAdjustmentsAmount: tplAdjustmentAmount + cewAdjustmentAmount,
          },
          remarks: '',
        };
        if (tplConfig) acceptPayload.tplConfiguration = tplConfig;
        if (deductiblesConfig) acceptPayload.deductiblesConfiguration = deductiblesConfig;
        if (configurableItems && configurableItems.length > 0)
          acceptPayload.configurableItems = configurableItems;

        if (isCartLikeCoverSelection && quoteForPayload.premium?.covers?.length) {
          const selected = selectedCoversByQuote[quoteForPayload.id];
          acceptPayload.selectedCovers = quoteForPayload.premium.covers.map(
            (cover: CoverPremiumItem) => ({
              coverId: cover.coverId,
              isSelected: selected ? selected.has(cover.coverId) : false,
            }),
          );
        }

        const acceptTargetId =
          (selectedInsurerObj && (selectedInsurerObj.quote_id || selectedInsurerObj.quoteId)) ||
          undefined;
        const finalAcceptId =
          acceptTargetId ||
          ratingQuoteId ||
          comparisonData?.quote_id ||
          String(targetResponseId || '');
        const finalQuoteId = String(finalAcceptId);

        try {
          if (endorsementId) {
            // Endorsement select-premium: same payload but tplConfiguration (and deductiblesConfiguration) as arrays
            const selectPayload: SelectPremiumRequest = {
              configurableItems: acceptPayload.configurableItems ?? [],
              deductiblesConfiguration: acceptPayload.deductiblesConfiguration
                ? [acceptPayload.deductiblesConfiguration]
                : [],
              selectedPremium: acceptPayload.selectedPremium,
              tplConfiguration: acceptPayload.tplConfiguration
                ? [acceptPayload.tplConfiguration]
                : [],
            };
            await selectEndorsementPremium(endorsementId, selectPayload);
            await calculateEndorsementPremium(endorsementId);
            setSelectedQuoteId?.(finalQuoteId ?? endorsementId);
          } else {
            await acceptQuote(finalQuoteId, acceptPayload);
            setSelectedQuoteId?.(finalQuoteId);
          }
        } catch (e) {
          console.error('❌ Error accepting quote:', e);
          toast({
            title: 'Error',
            description: endorsementId ? 'Failed to select premium' : 'Failed to accept quote',
            variant: 'destructive',
          });
        }

        try {
          // Prioritize productConfigBundle as it drives the UI selection
          const extList =
            productConfigBundle?.tpl_extensions ||
            quoteForPayload.pricingConfig?.tpl_extensions ||
            internalInsurerPricingConfigs[String(quoteForPayload.id)]?.tpl_extensions ||
            [];

          // Find the chosen extension by matching limit value
          const chosen =
            extList.find((e: any) => {
              const limitVal =
                typeof e.limit_value === 'string'
                  ? parseFloat(e.limit_value.replace(/,/g, ''))
                  : Number(e.limit_value);
              const selectedVal = Number(localSelectedTPLLimitValue);
              return Math.abs(limitVal - selectedVal) < 0.01; // Allow for slight float differences
            }) || null;
          const payload = chosen
            ? {
                items: [
                  {
                    tplExtensionId: String(chosen.id),
                    title: chosen.title || '',
                    pricingType: chosen.pricing_type || 'Percentage',
                    pricingValue: Number(chosen.pricing_value || 0),
                    limitValue: Number(chosen.limit_value || 0),
                    displayOrder: Number(chosen.display_order || 0),
                  },
                ],
              }
            : { items: [] };
          if (finalQuoteId && !endorsementId) {
            await createPricingSelections(finalQuoteId, payload);
          }
        } catch {}

        // Persist selection for Declaration Documents page
        try {
          const selectionStore = useQuoteSelectionStore.getState();
          const selectedOrgIdFromStorage = localStorage.getItem('selected_insurer_org_id');
          const selectedInsurerIdFromStorage = localStorage.getItem('selected_insurer_id');
          const orgId =
            (quoteForPayload as any)?.insurerOrganizationId ??
            (quoteForPayload as any)?.organizationId ??
            quoteForPayload.insurerId ??
            selectionStore.insurerOrganizationId ??
            selectedOrgIdFromStorage ??
            quoteForPayload.id;
          const insId = extractInsurerId() ?? selectedInsurerIdFromStorage ?? orgId;
          const normalizedInsurerId =
            insId == null ? null : typeof insId === 'number' ? insId : String(insId);
          const normalizedInsurerOrganizationId =
            orgId == null ? null : typeof orgId === 'number' ? orgId : String(orgId);
          useQuoteSelectionStore.getState().setSelection({
            insurerId: normalizedInsurerId,
            insurerOrganizationId: normalizedInsurerOrganizationId,
            productId: productId ?? null,
            responseId: responseId || resumeParam || null,
          });
          if (normalizedInsurerOrganizationId != null) {
            localStorage.setItem(
              'selected_insurer_org_id',
              String(normalizedInsurerOrganizationId),
            );
          }
        } catch (e) {
          console.warn('Failed to persist quote selection:', e);
        }

        // When syncing from Next (quoteOverride), skip UI updates and toasts
        if (quoteOverride) {
          setIsSubmittingPlan(false);
          return;
        }

        // Persist same data to localStorage as "Update Premium" so extensions dialog reopens with selected values
        try {
          const completeRequestPayload = buildPlanSelectionPayload(quoteForPayload, {
            ratingInsurerCommissions: selectedInsurerObj?.commissions,
          });
          const storedRequests = JSON.parse(localStorage.getItem('stored_plan_requests') || '{}');
          const quoteKey = String(effectiveQuoteKey || '');
          const insurerKey = quoteForPayload.id;
          const storedEntry = {
            ...completeRequestPayload,
            premium_amount: totalPremiumAmount,
            lastUpdated: new Date().toISOString(),
            tplAdjustmentPercent: localTplAdjustment.percent,
            tplAdjustmentFixed: localTplAdjustment.fixed,
            tplSelection: { value: localSelectedTPLLimitValue },
            cewAdjustmentPercent: localCewAdjustment.percent,
            cewAdjustmentFixed: localCewAdjustment.fixed,
            deductibleAdjustmentPercent: localDeductibleAdjustment.percent,
            deductibleAdjustmentFixed: localDeductibleAdjustment.fixed,
            deductibleSelection: localSelectedDeductibleOption,
            brokerCommissionPercent: localBrokerCommissionPercent,
            brokerMinCommissionPercentage:
              completeRequestPayload.premium_summary.broker_min_commission_pct,
            brokerMaxCommissionPercentage:
              completeRequestPayload.premium_summary.broker_max_commission_pct,
            brokerBaseCommissionPercentage:
              completeRequestPayload.premium_summary.broker_base_commission_pct,
            selectedCEWItems: localSelectedCEWItems.filter((item: any) => item.isSelected),
            completeCEWItems: localSelectedCEWItems,
          };
          if (!quoteKey) {
            storedRequests[insurerKey] = storedEntry;
          } else {
            const bucket = storedRequests[quoteKey] || {};
            bucket[insurerKey] = storedEntry;
            storedRequests[quoteKey] = bucket;
          }
          localStorage.setItem('stored_plan_requests', JSON.stringify(storedRequests));
          setUpdatedQuotes((prev) => ({
            ...prev,
            [quoteForPayload.id]: {
              premium: totalPremiumAmount,
              cewItems: localSelectedCEWItems.filter((item: any) => item.isSelected),
              isUpdated: true,
            },
          }));
          if (endorsementId) {
            setEndorsementPrefill(storedEntry as Record<string, unknown>);
          }
        } catch (e) {
          console.warn('Failed to persist plan selection to localStorage:', e);
        }

        // Close dialog and proceed
        setShowCEWDialog(false);

        // Show success message
        toast({
          title: 'Plan Selected Successfully',
          description: `Selected ${selectedQuote.insurerName} plan with premium ${LibUtils.formatCurrency(
            totalPremiumAmount,
            currency,
          )}`,
        });

        // Check if we're in the proposal form context (do not advance step for endorsement — user stays on Revised Quote)
        if (!endorsementId && window.onQuoteSelected) {
          // Defer navigation to ensure dialog state commits before parent step change
          setTimeout(() => {
            try {
              window.onQuoteSelected!(quoteId);
            } catch (e) {
              console.warn('onQuoteSelected handler failed:', e);
            }
          }, 0);
        } else {
          console.log('selectedQuote :', selectedQuote);
          // We're in standalone quotes page, navigate to declaration page
          // navigate('/customer/declaration', {
          //   state: {
          //     selectedQuote: quoteId,
          //     planData: {
          //       insurerName: selectedQuote.insurerName,
          //       premium: finalPremium,
          //       coverageAmount: selectedQuote.coverageAmount,
          //       selectedExtensions: selectedCEWItems.filter(item => item.isSelected),
          //       tplAdjustment,
          //       cewAdjustment,
          //       brokerCommissionPercent
          //     }
          //   }
          // });
        }
      } catch (error: any) {
        console.error('❌ Error selecting plan:', error);

        // Show user-friendly error message
        toast({
          title: 'Error Selecting Plan',
          description: error.message || 'Failed to select plan. Please try again.',
          variant: 'destructive',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectPlanWithAPI(quoteId)}
              className="ml-2"
            >
              Retry
            </Button>
          ),
        });
      } finally {
        setIsSubmittingPlan(false);
      }
    };
    handleSelectPlanWithAPIRef.current = handleSelectPlanWithAPI;

    // Helper function to extract insurer identifier from all available sources
    const extractInsurerId = (): string | number | null => {
      const insurerId = selectedQuoteForCEW?.insurerId;
      if (insurerId !== undefined && insurerId !== null && String(insurerId).trim() !== '') {
        return insurerId;
      }
      const id = selectedQuoteForCEW?.id;
      if (id !== undefined && id !== null && String(id).trim() !== '') {
        return id;
      }
      return null;
    };

    const tplAdjustmentAmount = useMemo(() => {
      if (!selectedQuoteForCEW) return 0;
      const basePremium = resolveBasePremium(selectedQuoteForCEW);
      return (basePremium * tplAdjustment.percent) / 100 + tplAdjustment.fixed;
    }, [selectedQuoteForCEW, tplAdjustment, isCartLikeCoverSelection, selectedCoversByQuote]);

    const cewAdjustmentAmount = useMemo(() => {
      if (!selectedQuoteForCEW) return 0;
      const basePremium = resolveBasePremium(selectedQuoteForCEW);
      return (
        (basePremium * cewAdjustment.percent) / 100 + cewAdjustment.fixed +
        (basePremium * mandatoryCewAdjustment.percent) / 100 + mandatoryCewAdjustment.fixed
      );
    }, [selectedQuoteForCEW, cewAdjustment, mandatoryCewAdjustment, isCartLikeCoverSelection, selectedCoversByQuote]);

    const deductibleAdjustmentAmount = useMemo(() => {
      if (!selectedQuoteForCEW) return 0;
      const basePremium = resolveBasePremium(selectedQuoteForCEW);
      return (basePremium * deductibleAdjustment.percent) / 100 + deductibleAdjustment.fixed;
    }, [
      selectedQuoteForCEW,
      deductibleAdjustment,
      isCartLikeCoverSelection,
      selectedCoversByQuote,
    ]);

    const commissionsForSelectedQuote = (selectedQuoteForCEW as any)?.commissions || {};
    const minAllowedCommission =
      commissionsForSelectedQuote.minBrokerCommissionPercent ??
      productConfigBundle?.policy_limits_and_deductible?.minimum_broker_commission?.value ??
      5;
    const maxAllowedCommission =
      commissionsForSelectedQuote.maxBrokerCommissionPercent ??
      productConfigBundle?.policy_limits_and_deductible?.maximum_broker_commission?.value ??
      15;
    const allowedCommissionRangeLabel = `Allowed range: ${minAllowedCommission}% – ${maxAllowedCommission}%`;

    const handleOpenBrokerCommissionDialog = () => {
      setBrokerCommissionInput(brokerCommissionPercent.toString());
      setBrokerCommissionError('');
      setIsBrokerCommissionDialogOpen(true);
    };

    const handleBrokerCommissionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setBrokerCommissionInput(val);
      const num = Number(val);
      if (Number.isNaN(num)) {
        setBrokerCommissionError('Enter a valid number');
        return;
      }
      if (num < minAllowedCommission || num > maxAllowedCommission) {
        setBrokerCommissionError(
          `Commission must be between ${minAllowedCommission}% and ${maxAllowedCommission}%`,
        );
      } else {
        setBrokerCommissionError('');
      }
    };

    const handleBrokerCommissionDialogCancel = () => {
      setIsBrokerCommissionDialogOpen(false);
      setBrokerCommissionError('');
    };

    const handleBrokerCommissionDialogSave = () => {
      const num = Number(brokerCommissionInput);
      if (Number.isNaN(num)) {
        setBrokerCommissionError('Enter a valid number');
        return;
      }
      if (num < minAllowedCommission || num > maxAllowedCommission) {
        setBrokerCommissionError(
          `Commission must be between ${minAllowedCommission}% and ${maxAllowedCommission}%`,
        );
        return;
      }
      setBrokerCommissionPercent(num);
      setIsBrokerCommissionDialogOpen(false);
      setBrokerCommissionError('');
    };

    const handleDownloadCurrentQuote = async () => {
      if (!selectedQuoteForCEW) {
        toast({
          title: 'No Quote Selected',
          description: 'Please select a quote to download.',
          variant: 'destructive',
        });
        return;
      }

      // Extract insurer ID from all available sources
      const insurerId = extractInsurerId();
      const insurerIdString = insurerId == null ? '' : String(insurerId);

      // Get current CEW data from state
      const cewData = {
        selectedItems: selectedCEWItems || [],
        mandatoryAdjustments: { percentage: 0, fixed: 0 }, // Will be calculated from CEW items
        optionalAdjustments: { percentage: 0, fixed: 0 }, // Will be calculated from CEW items
        tplAdjustmentPercent: tplAdjustment.percent || 0,
        tplAdjustmentFixed: tplAdjustment.fixed || 0,
      };

      // Calculate actual CEW adjustments from selected items
      if (selectedCEWItems && selectedCEWItems.length > 0) {
        let mandatoryPercentage = 0;
        let mandatoryFixed = 0;
        let optionalPercentage = 0;
        let optionalFixed = 0;

        selectedCEWItems.forEach((item) => {
          if (item.isMandatory) {
            if (item.selectedOptionId) {
              const selectedOption = item.options.find((opt) => opt.id === item.selectedOptionId);
              if (selectedOption) {
                const baseValue = item.defaultValue || 0;
                const selectedValue = selectedOption.value || 0;
                const difference = selectedValue - baseValue;

                if (selectedOption.type === 'percentage') {
                  mandatoryPercentage += difference;
                } else {
                  mandatoryFixed += difference;
                }
              }
            }
          } else {
            if (item.selectedOptionId) {
              const selectedOption = item.options.find((opt) => opt.id === item.selectedOptionId);
              if (selectedOption) {
                if (selectedOption.type === 'percentage') {
                  optionalPercentage += selectedOption.value || 0;
                } else {
                  optionalFixed += selectedOption.value || 0;
                }
              }
            } else {
              // No option selected, use base rate
              if (item.defaultValue) {
                const firstOption = item.options[0];
                const isPercentage =
                  firstOption?.type === 'percentage' || Math.abs(item.defaultValue) <= 100;

                if (isPercentage) {
                  optionalPercentage += item.defaultValue;
                } else {
                  optionalFixed += item.defaultValue;
                }
              }
            }
          }
        });

        cewData.mandatoryAdjustments = {
          percentage: mandatoryPercentage,
          fixed: mandatoryFixed,
        };
        cewData.optionalAdjustments = {
          percentage: optionalPercentage,
          fixed: optionalFixed,
        };
      }

      // Calculate premium summary using current values
      const basePremium = selectedQuoteForCEW.annualPremium || 0;
      const mandatoryAdjustmentAmount =
        cewData.mandatoryAdjustments.percentage + cewData.mandatoryAdjustments.fixed;
      const optionalAdjustmentAmount =
        cewData.optionalAdjustments.percentage + cewData.optionalAdjustments.fixed;
      const totalBeforeCommission =
        basePremium + mandatoryAdjustmentAmount + optionalAdjustmentAmount;
      const totalAnnualPremium = finalPremium;

      setIsDownloadingQuote(true);
      try {
        const premiumBreakdownHtml = buildPremiumCalculationSummaryHtml({
          premium: (selectedQuoteForCEW?.premium as PremiumBreakdown | null) ?? null,
          currency,
        });
        const payload = {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          cewSelectedItems: (selectedCEWItems || [])
            .filter((item) => item?.isSelected)
            .map((item) => ({
              id: String(item.id),
              code: item.code,
              name: item.name,
              selectedOptionId: item.selectedOptionId ? String(item.selectedOptionId) : undefined,
              defaultValue: typeof item.defaultValue === 'number' ? item.defaultValue : undefined,
              options: (item.options || []).map((opt) => ({
                id: String(opt.id),
                label: opt.label,
                type: opt.type,
                value: Number(opt.value || 0),
              })),
              impact: item.impact,
            })),
          selectedDeductible: selectedDeductibleOption
            ? {
                label: selectedDeductibleOption.label,
                premiumAdjustment: Number(selectedDeductibleOption.premiumAdjustment || 0),
                value: Number(selectedDeductibleOption.value || 0),
              }
            : undefined,
          tplAdjustmentPercent: Number(tplAdjustment.percent || 0),
          brokerCommissionPercent: Number(brokerCommissionPercent || 10),
          values: (() => {
            // Keep download payload aligned with the dialog's live premium summary.
            const premiumData = ((selectedQuoteForCEW as any)?.premium || {}) as Record<
              string,
              unknown
            >;
            const totalFees = Number(feeTotals.totalFees || 0);
            const feeComponents = feeTotals.feeComponents;
            const totalAnnualPremiumWithFees = Number(finalPremiumWithFees || 0);

            // Fee helpers
            const findFeeAmount = (key: string) => {
              const matchLabel = Object.keys(feeComponents).find((label) =>
                String(label).toLowerCase().includes(key.toLowerCase()),
              );
              return matchLabel ? Number(feeComponents[matchLabel] || 0) : 0;
            };
            const findFeePercent = (key: string) => {
              const f = selectedFeeTypes.find((ft: any) =>
                String(ft.label || '')
                  .toLowerCase()
                  .includes(key.toLowerCase()),
              );
              return f && String(f.adjustmentType || '').toUpperCase() === 'PERCENTAGE'
                ? Number(f.adjustmentValue || 0)
                : undefined;
            };

            // Loading/Discount from API
            const loadingVal = Number(premiumData.loading || 0);
            const discountVal = Number(premiumData.discount || 0);
            const apiBase = Number(premiumData.base || 1); // Avoid div by zero for percentages

            // Compute total sum insured — same logic as the UI's coverSelectionBlock
            const totalSumInsured = (() => {
              if (
                isCartLikeCoverSelection &&
                selectedQuoteForCEW.premium?.covers?.length
              ) {
                return getCartLikePremium(selectedQuoteForCEW).sumInsured;
              }
              return Number(
                selectedQuoteForCEW?.validationResult?.sumInsured ||
                  selectedQuoteForCEW?.coverageAmount ||
                  0,
              );
            })();

            return {
              sumInsured: LibUtils.formatCurrency(totalSumInsured, currency),
              basePremium: LibUtils.formatCurrency(basePremium, currency),
              totalPremium: LibUtils.formatCurrency(totalAnnualPremiumWithFees, currency),
              loading: LibUtils.formatCurrency(loadingVal, currency),
              discount: LibUtils.formatCurrency(discountVal, currency),
              loadingPercentage: Number((loadingVal / apiBase) * 100).toFixed(2),
              discountPercentage: Number((discountVal / apiBase) * 100).toFixed(2),
              vat: LibUtils.formatCurrency(Number(findFeeAmount('vat') || 0), currency),
              vatPercentage: (() => {
                const p = findFeePercent('vat');
                return p !== undefined ? Number(p).toFixed(2) : '';
              })(),
              subtotal: LibUtils.formatCurrency(
                Number(totalAnnualPremiumBeforeFees || 0),
                currency,
              ),
              annualPremium: LibUtils.formatCurrency(
                Number(totalAnnualPremiumWithFees || 0),
                currency,
              ),
              brokerCommission: LibUtils.formatCurrency(
                Number(brokerCommissionAmount || 0),
                currency,
              ),
              brokerCommissionPercentage: Number(brokerCommissionPercent || 0).toFixed(2),
              brokerMinimumCommission: Number(
                (commissionsForSelectedQuote as any).minBrokerCommissionPercent || 0,
              ).toFixed(2),
              brokerMaximumCommission: Number(
                (commissionsForSelectedQuote as any).maxBrokerCommissionPercent || 0,
              ).toFixed(2),
              processingFee: LibUtils.formatCurrency(findFeeAmount('processing') || 0, currency),
              administrationFee: LibUtils.formatCurrency(findFeeAmount('admin') || 0, currency),
              serviceFee: LibUtils.formatCurrency(findFeeAmount('service') || 0, currency),
              policyFee: LibUtils.formatCurrency(findFeeAmount('policy') || 0, currency),
              stampDuty: LibUtils.formatCurrency(findFeeAmount('stamp') || 0, currency),
              underwritingFee: LibUtils.formatCurrency(
                findFeeAmount('underwriting') || 0,
                currency,
              ),
              totalFees: LibUtils.formatCurrency(Number(totalFees || 0), currency),
              premiumBreakdown: premiumBreakdownHtml,
              cewSelectedItems: (selectedCEWItems || [])
                .filter((item) => item?.isSelected)
                .map((item) => ({
                  id: String(item.id),
                  code: item.code,
                  name: item.name,
                  selectedOptionId: item.selectedOptionId
                    ? String(item.selectedOptionId)
                    : undefined,
                  defaultValue:
                    typeof item.defaultValue === 'number' ? item.defaultValue : undefined,
                  options: (item.options || []).map((opt) => ({
                    id: String(opt.id),
                    label: opt.label,
                    type: opt.type,
                    value: Number(opt.value || 0),
                  })),
                  impact: item.impact,
                })),
              selectedDeductible: selectedDeductibleOption || null,
              tplAdjustmentPercent: Number(tplAdjustment.percent || 0),
              brokerCommissionPercent: Number(brokerCommissionPercent || 10),
              tplSelectionValue: Number(selectedTPLLimitValue || 0),
            };
          })(),
        };

        // return;
        const targetResponseId = responseId || resumeParam;
        if (!targetResponseId) {
          throw new Error('Missing responseId to generate quote PDF');
        }
        const resp = await api.request<Blob>({
          url: `/quote/${targetResponseId}/download-pdf/quote?includePremiumBreakdown=true`,
          method: 'POST',
          data: payload,
          responseType: 'blob',
          headers: { Accept: 'application/pdf' },
        });
        const blob = resp.data as unknown as Blob;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const productLabel = (comparisonData?.product_name || 'Quote')
          .toString()
          .replace(/[^a-zA-Z0-9 _-]/g, '')
          .trim()
          .replace(/\s+/g, '_');
        const refSuffix = String(targetResponseId).replace(/-/g, '').slice(-5).toUpperCase();
        link.download = `${productLabel}_${refSuffix}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast({
          title: 'Quote Downloaded',
          description: 'Insurance proposal PDF has been generated and downloaded.',
          variant: 'default',
        });
      } catch (error) {
        console.error('Error downloading PDF:', error);
        toast({
          title: 'Download Failed',
          description:
            error instanceof Error
              ? error.message
              : 'There was an error generating the PDF. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsDownloadingQuote(false);
      }
    };

    const handleDownloadProposal = async () => {
      if (selectedQuotes.length === 0) {
        toast({
          title: 'No Plan Selected',
          description: 'Please select a plan to download the proposal.',
          variant: 'destructive',
        });
        return;
      }

      // Generate and download PDF using the unified PDF generator
      try {
        if (currentProposal) {
          await downloadQuoteWithFormat(currentProposal);
          toast({
            title: 'Proposal Downloaded',
            description: 'Insurance proposal PDF has been generated and downloaded.',
            variant: 'default',
          });
        } else {
          throw new Error('No proposal data available');
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: 'Download Failed',
          description: 'There was an error generating the PDF. Please try again.',
          variant: 'destructive',
        });
      }
    };

    // Generate real quotes from validation results or use comparison API when available
    const apiQuotes = useMemo(() => {
      if (!comparisonData) return [];
      return (comparisonData.insurers || []).map((ins, idx) => {
        return {
          id: idx + 1,
          insurerId: String(ins.insurer_id),
          quoteEvaluationId: ins.quoteEvaluationId ?? null,
          planName: `${ins.insurer_name} ${comparisonData.product_name || 'CAR Plan'}`,
          insurerName: ins.insurer_name,
          annualPremium: ins.annual_premium,
          coverageAmount: ins.coverage_amount,
          feeTypes: ins.feeTypes || [],
          ratingBreakdown: ins.ratingBreakdown || [],
          rating: 4.5,
          deductible: LibUtils.formatCurrency(25000),
          isRecommended: false,
          status: ins.status,
          commissions: (ins as any).commissions || {},
          premium: (ins as any).premium || null,
          keyCoverage: [
            'Contract Works Insurance',
            'Third Party Liability',
            'Professional Indemnity',
            'Plant & Equipment',
          ],
          benefits: [
            '24/7 Claims Support',
            'Fast Settlement',
            'Risk Management Services',
            'Free risk assessment',
          ],
          validationResult: {
            overallDecision: ins.status === 'referral' ? 'Referral' : 'Auto Quote',
            basePremium: ins.annual_premium,
            sumInsured: ins.sum_insured,
          },
          pricingConfig: normalizeToQuotesComparisonConfig((ins as any).config || {}),
        };
      });
    }, [comparisonData, internalInsurerPricingConfigs]);
    const realQuotes =
      apiQuotes.length > 0
        ? apiQuotes
        : generateRealQuotes(
            insurerValidationResults,
            eligibleInsurers,
            internalInsurerPricingConfigs || insurerPricingConfigs || {},
          );
    const comparedQuotes = realQuotes.filter((q) => selectedQuotes.includes(q.id));

    useEffect(() => {
      if (pendingReferralQuoteIds.size === 0) return;
      const confirmedIds = new Set<number>();
      for (const q of apiQuotes) {
        if (q.status === 'referral' && pendingReferralQuoteIds.has(q.id)) {
          confirmedIds.add(q.id);
        }
      }
      if (confirmedIds.size === 0) return;
      setPendingReferralQuoteIds((prev) => {
        const next = new Set(prev);
        for (const id of confirmedIds) next.delete(id);
        return next;
      });
    }, [apiQuotes, pendingReferralQuoteIds]);

    // Initialize all covers as selected when quotes first load (cart-like mode)
    useEffect(() => {
      if (!isCartLikeCoverSelection) return;
      setSelectedCoversByQuote((prev) => {
        const next = { ...prev };
        let changed = false;
        realQuotes.forEach((q) => {
          if (!next[q.id] && q.premium?.covers?.length) {
            next[q.id] = new Set(q.premium.covers.map((c: CoverPremiumItem) => c.coverId));
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, [isCartLikeCoverSelection, realQuotes]);

    // Also initialize covers when the CEW dialog opens for a specific quote
    useEffect(() => {
      if (!isCartLikeCoverSelection || !selectedQuoteForCEW) return;
      setSelectedCoversByQuote((prev) => {
        if (prev[selectedQuoteForCEW.id]) return prev;
        const covers = selectedQuoteForCEW.premium?.covers;
        if (!covers?.length) return prev;
        return {
          ...prev,
          [selectedQuoteForCEW.id]: new Set(covers.map((c: CoverPremiumItem) => c.coverId)),
        };
      });
    }, [isCartLikeCoverSelection, selectedQuoteForCEW]);

    const toggleCoverSelection = useCallback(
      (quoteId: number, coverId: string) => {
        setSelectedCoversByQuote((prev) => {
          const current = new Set(prev[quoteId] || []);
          
          // Prevent deselecting if this is the last selected cover
          if (current.has(coverId) && current.size === 1) {
            toast({
              title: 'Cannot deselect',
              description: 'At least one cover must be selected.',
              variant: 'destructive',
            });
            return prev;
          }
          
          if (current.has(coverId)) {
            current.delete(coverId);
          } else {
            current.add(coverId);
          }
          return { ...prev, [quoteId]: current };
        });
      },
      [toast],
    );

    const getUnitSelectionKey = useCallback(
      (unit: { rowIndex?: number; rowLabel?: string; firstColumnValue?: string }, index: number) =>
        `${unit.rowIndex ?? index}-${unit.rowLabel ?? unit.firstColumnValue ?? ''}`,
      [],
    );

    const toggleUnitSelection = useCallback(
      (
        quoteId: number,
        coverId: string,
        unitKey: string,
        allUnitKeys: string[],
        checked: boolean,
      ) => {
        setSelectedUnitsByQuoteCover((prev) => {
          const quoteUnits = prev[quoteId] || {};
          const existing = quoteUnits[coverId];
          const current = existing ? new Set(existing) : new Set(allUnitKeys);
          if (checked) {
            current.add(unitKey);
          } else {
            current.delete(unitKey);
          }
          return {
            ...prev,
            [quoteId]: {
              ...quoteUnits,
              [coverId]: current,
            },
          };
        });
      },
      [],
    );

    const getCartLikePremium = useCallback(
      (quote: QuoteRow) => {
        let covers = quote.premium?.covers || [];
        // Synthesize for single-cover products with no covers array
        if (covers.length === 0 && quote.premium) {
          const p = quote.premium;
          if (Number(p.sumInsured || 0) > 0 || Number(p.total || 0) > 0) {
            covers = [{
              coverId: 'base-cover',
              name: 'Base Cover',
              sumInsured: Number(p.sumInsured || 0),
              netPremium: Number(p.total || p.base || 0),
            } as CoverPremiumItem];
          }
        }
        const selected = selectedCoversByQuote[quote.id];
        if (!selected || selected.size === 0) return { sumInsured: 0, premium: 0 };
        return covers
          .filter((c: CoverPremiumItem) => selected.has(c.coverId))
          .reduce(
            (acc: { sumInsured: number; premium: number }, c: CoverPremiumItem) => ({
              sumInsured: acc.sumInsured + (c.sumInsured || 0),
              premium: acc.premium + (c.netPremium || 0),
            }),
            { sumInsured: 0, premium: 0 },
          );
      },
      [selectedCoversByQuote],
    );

    const coverSelectionBlock = useMemo(() => {
      if (!selectedQuoteForCEW) return null;

      let covers: CoverPremiumItem[] = selectedQuoteForCEW.premium?.covers ?? [];
      if (covers.length === 0 && selectedQuoteForCEW.premium) {
        const p = selectedQuoteForCEW.premium;
        const hasPremiumData = Number(p.sumInsured || 0) > 0 || Number(p.total || 0) > 0;
        if (hasPremiumData) {
          covers = [{
            coverId: 'base-cover',
            name: 'Base Cover',
            sectionId: 'default-section',
            sectionName: 'Coverage',
            sectionOrder: 0,
            sumInsured: Number(p.sumInsured || 0),
            premium: Number(p.base || p.total || 0),
            taxAmount: 0,
            netPremium: Number(p.total || p.base || 0),
          }];
        }
      }
      if (covers.length === 0) return null;
      const selectedSet = selectedCoversByQuote[selectedQuoteForCEW.id];
      const premiumUnits = Array.isArray(selectedQuoteForCEW.premium?.units)
        ? selectedQuoteForCEW.premium.units
        : [];
      const getUnitRowsForCover = (cover: CoverPremiumItem) => {
        if (Array.isArray(cover.units) && cover.units.length > 0) {
          return cover.units;
        }
        return premiumUnits.flatMap((u, unitIndex) => {
          const unitCovers = Array.isArray(u.covers) ? u.covers : [];
          return unitCovers
            .filter((uc) => String(uc.coverId || '') === String(cover.coverId || ''))
            .map((uc) => ({
              ...uc,
              rowIndex: u.rowIndex ?? unitIndex,
              rowLabel: u.rowLabel,
              firstColumnValue: u.firstColumnValue,
            }));
        });
      };

      // Compute totals — Total Sum Insured uses the plan-level value (matches Selected Plan card)
      const { premiumTotal, siTotal } = (() => {
        const planSumInsured = Number(
          selectedQuoteForCEW?.validationResult?.sumInsured ||
            selectedQuoteForCEW?.coverageAmount ||
            0,
        );

        if (isCartLikeCoverSelection) {
          const totals = getCartLikePremium(selectedQuoteForCEW);
          return { premiumTotal: totals.premium, siTotal: totals.sumInsured };
        }
        return {
          premiumTotal: covers.reduce((acc, c) => acc + Number(c.netPremium || 0), 0),
          siTotal: planSumInsured,
        };
      })();

      // Group covers by section
      const coverToSection = new Map<string, { id?: string; name?: string; order?: number }>();
      for (const section of productSections) {
        for (const cover of section.covers || []) {
          if (cover.id) {
            coverToSection.set(cover.id, {
              id: section.id,
              name: section.name,
              order: section.order,
            });
          }
        }
      }
      const groups = new Map<
        string,
        { sectionName: string; order: number; covers: CoverPremiumItem[] }
      >();
      for (const cover of covers) {
        const mapped = coverToSection.get(cover.coverId);
        const sectionName = cover.sectionName ?? mapped?.name ?? 'Other';
        const order =
          typeof cover.sectionOrder === 'number'
            ? cover.sectionOrder
            : typeof mapped?.order === 'number'
              ? mapped.order
              : 999;
        const key = cover.sectionId ?? mapped?.id ?? sectionName;
        const existing = groups.get(key);
        if (!existing) {
          groups.set(key, { sectionName, order, covers: [cover] });
        } else {
          existing.covers.push(cover);
        }
      }
      const sections = Array.from(groups.values()).sort((a, b) =>
        a.order !== b.order ? a.order - b.order : a.sectionName.localeCompare(b.sectionName),
      );

      return (
        <div className="space-y-4 pt-2">
          {/* Total card at top */}
          <Card className="relative border-primary/20 bg-primary/[0.04] shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-primary/30" />
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {isCartLikeCoverSelection ? 'Selected Covers Premium' : 'Total Premium'}
                  </div>
                  <div className="text-2xl font-bold text-primary leading-tight">
                    {LibUtils.formatCurrency(premiumTotal, currency)}
                  </div>
                </div>
                <div className="text-right pl-4">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Total Sum Insured
                  </div>
                  <div className="text-xl font-semibold text-foreground leading-tight">
                    {LibUtils.formatCurrency(siTotal, currency)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section cards with table layout */}
          {sections.map((section) => {
            const sectionSI = isCartLikeCoverSelection
              ? section.covers
                  .filter((c) => selectedSet?.has(c.coverId) || covers.length === 1)
                  .reduce((acc, c) => {
                    const unitRows = getUnitRowsForCover(c);
                    if (unitRows.length === 0) return acc + Number(c.sumInsured || 0);
                    const selectedUnits =
                      selectedUnitsByQuoteCover[selectedQuoteForCEW.id]?.[c.coverId];
                    return (
                      acc +
                      unitRows.reduce((uAcc, u, index) => {
                        const unitKey = getUnitSelectionKey(u, index);
                        const includeUnit = selectedUnits?.has(unitKey) ?? true;
                        return includeUnit ? uAcc + Number(u.sumInsured || 0) : uAcc;
                      }, 0)
                    );
                  }, 0)
              : section.covers.reduce((acc, c) => acc + Number(c.sumInsured || 0), 0);
            const sectionPremium = isCartLikeCoverSelection
              ? section.covers
                  .filter((c) => selectedSet?.has(c.coverId) || covers.length === 1)
                  .reduce((acc, c) => {
                    const unitRows = getUnitRowsForCover(c);
                    if (unitRows.length === 0) return acc + Number(c.netPremium || 0);
                    const selectedUnits =
                      selectedUnitsByQuoteCover[selectedQuoteForCEW.id]?.[c.coverId];
                    return (
                      acc +
                      unitRows.reduce((uAcc, u, index) => {
                        const unitKey = getUnitSelectionKey(u, index);
                        return (selectedUnits?.has(unitKey) ?? true)
                          ? uAcc + Number(u.netPremium || 0)
                          : uAcc;
                      }, 0)
                    );
                  }, 0)
              : section.covers.reduce((acc, c) => acc + Number(c.netPremium || 0), 0);

            return (
              <Card
                key={section.sectionName}
                className="border-l-4 border-l-primary/40 shadow-sm overflow-hidden"
              >
                <CardHeader className="px-4 py-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-semibold">{section.sectionName}</CardTitle>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                        {isCartLikeCoverSelection && covers.length > 1
                          ? `${section.covers.filter((c) => selectedSet?.has(c.coverId)).length}/${section.covers.length} covers`
                          : `${section.covers.length} ${section.covers.length === 1 ? 'cover' : 'covers'}`}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-normal">
                        SI: {LibUtils.formatCurrency(sectionSI, currency)}
                      </Badge>
                      <Badge className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary hover:bg-primary/10 border-primary/20">
                        {LibUtils.formatCurrency(sectionPremium, currency)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b border-border/40">
                        <TableHead className="text-[11px] uppercase tracking-wide h-8 pl-4">
                          Cover
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide h-8 text-right">
                          Sum Insured
                        </TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wide h-8 text-right pr-4">
                          Premium
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {section.covers.map((cover) => {
                        const isSelected = selectedSet ? selectedSet.has(cover.coverId) : false;
                        const unitRows = getUnitRowsForCover(cover);
                        const selectedUnitsForCover =
                          selectedUnitsByQuoteCover[selectedQuoteForCEW.id]?.[cover.coverId];
                        const allUnitKeys = unitRows.map((u, index) =>
                          getUnitSelectionKey(u, index),
                        );
                        const coverSIFromUnits =
                          unitRows.length > 0
                            ? unitRows.reduce((acc, u, index) => {
                                const unitKey = getUnitSelectionKey(u, index);
                                return (selectedUnitsForCover?.has(unitKey) ?? true)
                                  ? acc + Number(u.sumInsured || 0)
                                  : acc;
                              }, 0)
                            : Number(cover.sumInsured || 0);
                        const coverPremiumFromUnits =
                          unitRows.length > 0
                            ? unitRows.reduce((acc, u, index) => {
                                const unitKey = getUnitSelectionKey(u, index);
                                return (selectedUnitsForCover?.has(unitKey) ?? true)
                                  ? acc + Number(u.netPremium || 0)
                                  : acc;
                              }, 0)
                            : Number(cover.netPremium || 0);

                        return (
                          <React.Fragment key={cover.coverId}>
                            <TableRow
                              className={`transition-colors border-b border-border/30 ${isCartLikeCoverSelection && isSelected ? 'bg-primary/5' : ''}`}
                            >
                              <TableCell className="py-2.5 pl-4">
                                <div className="flex items-center gap-2.5">
                                  {isCartLikeCoverSelection && covers.length > 1 && (
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() =>
                                        toggleCoverSelection(selectedQuoteForCEW.id, cover.coverId)
                                      }
                                    />
                                  )}
                                  <span className="text-sm font-medium">
                                    {cover.name || cover.code || cover.coverId}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="py-2.5 text-right text-sm text-muted-foreground">
                                {LibUtils.formatCurrency(
                                  isCartLikeCoverSelection
                                    ? isSelected || covers.length === 1
                                      ? coverSIFromUnits
                                      : 0
                                    : Number(cover.sumInsured || 0),
                                  currency,
                                )}
                              </TableCell>
                              <TableCell className="py-2.5 text-right text-sm font-semibold pr-4">
                                {LibUtils.formatCurrency(
                                  isCartLikeCoverSelection
                                    ? isSelected || covers.length === 1
                                      ? coverPremiumFromUnits
                                      : 0
                                    : Number(cover.netPremium || 0),
                                  currency,
                                )}
                              </TableCell>
                            </TableRow>
                            {unitRows.map((unit, index) => {
                              const unitKey = getUnitSelectionKey(unit, index);
                              const isUnitSelected = selectedUnitsForCover?.has(unitKey) ?? true;
                              const unitTitle =
                                unit.firstColumnValue || unit.rowLabel || `Unit ${index + 1}`;
                              return (
                                <TableRow
                                  key={`${cover.coverId}-${unitKey}`}
                                  className="bg-muted/10"
                                >
                                  <TableCell className="py-1.5 pl-20">
                                    <div className="ml-2 pl-3 border-l-2 border-muted-foreground/30 flex items-center gap-2.5 text-xs text-muted-foreground">
                                      <Checkbox
                                        checked={isUnitSelected}
                                        onCheckedChange={(checked) =>
                                          toggleUnitSelection(
                                            selectedQuoteForCEW.id,
                                            cover.coverId,
                                            unitKey,
                                            allUnitKeys,
                                            Boolean(checked),
                                          )
                                        }
                                        disabled={isCartLikeCoverSelection && !isSelected}
                                      />
                                      <span>{unitTitle}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-1.5 text-right text-xs text-muted-foreground">
                                    {LibUtils.formatCurrency(
                                      isUnitSelected ? Number(unit.sumInsured || 0) : 0,
                                      currency,
                                    )}
                                  </TableCell>
                                  <TableCell className="py-1.5 text-right text-xs text-muted-foreground pr-4">
                                    {LibUtils.formatCurrency(
                                      isUnitSelected ? Number(unit.netPremium || 0) : 0,
                                      currency,
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      );
    }, [
      selectedQuoteForCEW,
      productSections,
      isCartLikeCoverSelection,
      selectedCoversByQuote,
      selectedUnitsByQuoteCover,
      toggleCoverSelection,
      toggleUnitSelection,
      getCartLikePremium,
      getUnitSelectionKey,
      currency,
    ]);

    const buildExtensionItems = useCallback(() => {
      const items: Array<{ name: string; value: string }> = [];
      const currencySym = currency || 'AED';
      if (selectedTPLLimitValue != null && Number(selectedTPLLimitValue) > 0) {
        items.push({
          name: 'TPL Limit',
          value: LibUtils.formatCurrency(Number(selectedTPLLimitValue), currencySym),
        });
      }
      selectedCEWItems
        .filter((i) => i.isSelected && i.id !== 'tpl-extension')
        .forEach((item) => {
          const opt = item.options?.find((o: any) => o.id === item.selectedOptionId);
          const fallbackValue = Number(item.defaultValue ?? item.impact?.premiumAmount ?? 0);
          const fallbackIsPercentage = isPercentagePricingType(
            (item as any).originalPricingType || item.pricingType,
          );
          const val = opt
            ? opt.type === 'percentage'
              ? `${opt.value}%`
              : LibUtils.formatCurrency(Number(opt.value), currencySym)
            : fallbackIsPercentage
              ? `${fallbackValue}%`
              : LibUtils.formatCurrency(fallbackValue, currencySym);
          items.push({ name: item.name || item.code, value: val });
        });
      if (selectedDeductibleOption) {
        items.push({ name: 'Deductible', value: String(selectedDeductibleOption.value) });
      }
      return items;
    }, [selectedCEWItems, selectedTPLLimitValue, selectedDeductibleOption, currency]);

    useImperativeHandle(
      ref,
      () => ({
        submitSelectionBeforeNext: async () => {
          if (!endorsementId) return;
          const quote = selectedQuoteForCEW ?? realQuotes[0];
          if (!quote) return;
          // Use prefill (from GET selected-premium when Extensions was opened) so payload matches Select Plan
          if (endorsementPrefill && Object.keys(endorsementPrefill).length > 0) {
            try {
              const payload = buildSelectPayloadFromPrefill(endorsementPrefill, quote);
              await selectEndorsementPremium(endorsementId, payload);
              setSelectedQuoteId?.(quote.id);
            } catch (e) {
              console.warn('Failed to sync endorsement selection on Next:', e);
              throw e;
            }
            return;
          }
          await handleSelectPlanWithAPIRef.current?.(quote.id, quote);
        },
        isSelectionSavedForEndorsement: endorsementId
          ? () => {
              if (endorsementPrefill && Object.keys(endorsementPrefill).length > 0) return true;
              const quote = selectedQuoteForCEW ?? realQuotes[0];
              if (!quote) return false;
              return hasStoredData(quote.id);
            }
          : undefined,
      }),
      [endorsementId, realQuotes, selectedQuoteForCEW, endorsementPrefill],
    );

    // Helper function to get current premium for a quote (updated or original)
    const getCurrentPremium = (quote: any) => {
      // Cart-like cover selection: sum only selected covers
      if (isCartLikeCoverSelection && quote.premium?.covers?.length) {
        return getCartLikePremium(quote).premium;
      }
      // Endorsement: use API prefill premium when available
      if (
        endorsementId &&
        endorsementPrefill &&
        (endorsementPrefill as any).premium_amount != null
      ) {
        return (endorsementPrefill as any).premium_amount;
      }
      // First check if there's stored request data for this specific quote
      const storedRequest = getStoredRequestForQuoteInsurer(effectiveQuoteKey, quote.id);
      if (storedRequest) {
        return storedRequest.premium_amount;
      }

      // Fallback to updated quotes
      const updatedData = updatedQuotes[quote.id];
      if (updatedData) {
        return updatedData.premium;
      }

      // Default to original premium
      return quote.annualPremium;
    };

    // Helper function to get CEW items for a quote
    const getCEWItems = (quoteId: number) => {
      const updatedData = updatedQuotes[quoteId];
      if (updatedData && updatedData.cewItems && updatedData.cewItems.length > 0) {
        return updatedData.cewItems;
      }

      // Fallback: Get mandatory items from config to ensure they show up in comparison
      const externalConfigs = insurerPricingConfigs ?? {};
      const config = internalInsurerPricingConfigs[quoteId] || externalConfigs[quoteId];
      if (config?.clause_pricing_config) {
        return (config.clause_pricing_config as any[])
          .filter((clause: any) => clause.is_mandatory === 1)
          .map((clause: any) => ({
            id: clause.id,
            name: clause.meta?.title || `Clause ${clause.clause_code}`,
            code: clause.clause_code,
            description: clause.meta?.purpose_description || '',
            isMandatory: true,
            isSelected: true,
            options: clause.options || [],
            defaultValue: clause.pricing_value || 0,
            impact: {
              premiumAmount: 0,
              type:
                String(clause.pricing_type || '').toUpperCase() === 'FIXED'
                  ? 'fixed'
                  : 'percentage',
              value: 0,
            },
          }));
      }

      return [];
    };

    // Helper function to check if a quote has stored data
    const hasStoredData = (quoteId: number) => {
      if (endorsementId && endorsementPrefill) return true;
      const storedRequest = getStoredRequestForQuoteInsurer(effectiveQuoteKey, quoteId);
      const hasData = storedRequest !== null;
      return hasData;
    };

    return (
      <>
        <section>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="text-left">
                {/* <h2 className="text-lg font-semibold text-foreground mb-1">CAR Insurance Plans</h2> */}
                {realQuotes?.length > 1 && (
                  <p className="text-sm text-muted-foreground">Select up to 2 plans to compare</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                {/* Validation Details Button */}
                {/* <Button
                onClick={() => setShowValidationDialog(true)}
                className="gap-2"
                variant="outline"
              >
                <FileText className="w-4 h-4" />
                Validation Details
              </Button> */}

                {selectedQuotes.length > 0 && (
                  <>
                    <Button
                      onClick={handleCompare}
                      disabled={selectedQuotes.length !== 2}
                      className="gap-2"
                      variant="outline"
                    >
                      <Eye className="w-4 h-4" />
                      Compare Selected Plans ({selectedQuotes.length}/2)
                    </Button>

                    <Button onClick={handleDownloadProposal} className="gap-2" variant="outline">
                      <FileText className="w-4 h-4" />
                      Download Proposal
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Show message if no eligible insurers */}
            {assignedInsurers &&
              currentProposal &&
              eligibleInsurers.length === 0 &&
              realQuotes.length === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <h3 className="font-semibold text-red-800">No Eligible Insurers</h3>
                  </div>
                  <p className="text-sm text-red-700">
                    None of the assigned insurers passed the validation checks. Please check the
                    console for detailed validation results.
                  </p>
                </div>
              )}

            <div className="space-y-4">
              {realQuotes.map((quote) => {
                const isUpdated = updatedQuotes[quote.id]?.isUpdated;
                const hasStored = hasStoredData(quote.id);
                const currentPremium = getCurrentPremium(quote);
                const isReferral =
                  quote.status === 'referral' || pendingReferralQuoteIds.has(quote.id);

                return (
                  <Card
                    key={quote.id}
                    className={`border transition-all duration-200 ${
                      isUpdated || hasStored
                        ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20'
                        : 'border-border hover:shadow-md'
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {realQuotes.length > 1 && (
                            <Checkbox
                              checked={selectedQuotes.includes(quote.id)}
                              onCheckedChange={(checked) => handleQuoteSelect(quote.id, !!checked)}
                              disabled={
                                selectedQuotes.length >= 2 && !selectedQuotes.includes(quote.id)
                              }
                            />
                          )}

                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <Building className="h-6 w-6 text-muted-foreground" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{quote.insurerName}</h3>
                              {hasStored && (
                                <Badge variant="secondary" className="text-xs">
                                  Customized
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {!endorsementId && (
                            <div className="text-right">
                              {isReferral ? (
                                <div className="text-lg font-semibold text-amber-600">
                                  Referred to Underwriter
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 mb-1">
                                    <div
                                      className={`text-lg font-semibold ${
                                        isUpdated ? 'text-primary' : 'text-foreground'
                                      }`}
                                    >
                                      {LibUtils.formatCurrency(currentPremium, currency)}
                                    </div>
                                    {isUpdated && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-800 border-green-200"
                                      >
                                        Updated
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Annual Premium
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                          {!isReferral && (
                            <Button
                              variant="outline"
                              onClick={() => handleExtensionsClick(quote)}
                              className="gap-2"
                            >
                              <FileText className="w-4 h-4" />
                              Extensions
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Comparison Dialog */}
            <Dialog open={isCompareDialogOpen} onOpenChange={setIsCompareDialogOpen}>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle>Compare Insurance Plans</DialogTitle>
                    <div className="flex items-center gap-2">
                      <Button onClick={handleDownload} variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Download Comparison
                      </Button>
                      <Button onClick={() => setIsCompareDialogOpen(false)} variant="outline">
                        Close
                      </Button>
                    </div>
                  </div>
                </DialogHeader>

                {/* Selected Extensions Table */}
                <div className="mt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200 table-fixed">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-2 text-left font-medium w-1/3"></th>
                          {comparedQuotes.map((quote) => (
                            <th
                              key={quote.id}
                              className="border border-gray-200 px-4 py-2 text-center font-medium w-1/3"
                            >
                              <div className="flex flex-col items-center space-y-1">
                                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                                  {quote.insurerName.charAt(0)}
                                </div>
                                <div className="text-xs">{quote.insurerName}</div>
                              </div>
                            </th>
                          ))}
                        </tr>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-200 px-4 py-2 text-left font-medium text-sm text-muted-foreground w-1/3">
                            Sum Insured
                          </th>
                          {comparedQuotes.map((quote) => (
                            <th
                              key={`sum-insured-${quote.id}`}
                              className="border border-gray-200 px-4 py-2 text-center font-medium text-sm text-muted-foreground w-1/3"
                            >
                              <div className="font-semibold text-foreground">
                                N/A
                                {/* {LibUtils.formatCurrency(quote.coverageAmount)} */}
                              </div>
                            </th>
                          ))}
                        </tr>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-200 px-4 py-2 text-left font-medium text-sm text-muted-foreground w-1/3">
                            Default TPL Limit
                          </th>
                          {comparedQuotes.map((quote) => (
                            <th
                              key={`tpl-limit-${quote.id}`}
                              className="border border-gray-200 px-4 py-2 text-center font-medium text-sm text-muted-foreground w-1/3"
                            >
                              <div className="font-semibold text-foreground">
                                {LibUtils.formatCurrency(quote.annualPremium, currency)}
                              </div>
                            </th>
                          ))}
                        </tr>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-200 px-4 py-2 text-left font-medium text-sm text-muted-foreground w-1/3">
                            Premium
                          </th>
                          {comparedQuotes.map((quote) => (
                            <th
                              key={`premium-${quote.id}`}
                              className="border border-gray-200 px-4 py-2 text-center font-medium text-sm text-muted-foreground w-1/3"
                            >
                              <div className="font-semibold text-foreground">
                                {LibUtils.formatCurrency(quote.annualPremium, currency)}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const coverMap = new Map<
                            string,
                            { coverId: string; name?: string; code?: string }
                          >();
                          comparedQuotes.forEach((quote) => {
                            const covers = (quote as any)?.premium?.covers || [];
                            covers.forEach(
                              (c: { coverId: string; name?: string; code?: string }) => {
                                if (!coverMap.has(c.coverId)) {
                                  coverMap.set(c.coverId, {
                                    coverId: c.coverId,
                                    name: c.name,
                                    code: c.code,
                                  });
                                }
                              },
                            );
                          });
                          const allCovers = Array.from(coverMap.values());
                          return allCovers.length > 0
                            ? allCovers.map((cover, index) => (
                                <tr
                                  key={`cover-${cover.coverId}`}
                                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                >
                                  <td className="border border-gray-200 px-4 py-2 font-medium text-sm w-1/3">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs font-medium">
                                        {cover.name || cover.coverId}
                                      </span>
                                      {cover.code ? (
                                        <Badge variant="outline" className="text-xs">
                                          {cover.code}
                                        </Badge>
                                      ) : null}
                                    </div>
                                  </td>
                                  {comparedQuotes.map((quote) => {
                                    const qCover = ((quote as any)?.premium?.covers || []).find(
                                      (c: { coverId: string }) => c.coverId === cover.coverId,
                                    );
                                    return (
                                      <td
                                        key={`cover-${cover.coverId}-${quote.id}`}
                                        className="border border-gray-200 px-4 py-2 text-center w-1/3"
                                      >
                                        {qCover ? (
                                          <div className="text-center">
                                            <div className="text-xs font-medium text-foreground">
                                              {LibUtils.formatCurrency(
                                                Number((qCover as any).netPremium || 0),
                                                currency,
                                              )}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                              SI:{' '}
                                              {LibUtils.formatCurrency(
                                                Number((qCover as any).sumInsured || 0),
                                                currency,
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-xs text-muted-foreground">N/A</div>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))
                            : null;
                        })()}
                        {(() => {
                          // Get all unique CEW items across all compared quotes
                          const allCEWItems = new Map();
                          comparedQuotes.forEach((quote) => {
                            getCEWItems(quote.id).forEach((item) => {
                              if (!allCEWItems.has(item.id)) {
                                allCEWItems.set(item.id, item);
                              }
                            });
                          });

                          return Array.from(allCEWItems.values()).map((item, index) => (
                            <tr
                              key={item.id}
                              className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                            >
                              <td className="border border-gray-200 px-4 py-2 font-medium text-sm w-1/3">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-medium">{item.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {item.code}
                                  </Badge>
                                </div>
                              </td>
                              {comparedQuotes.map((quote) => {
                                const quoteCEWItems = getCEWItems(quote.id);
                                const hasItem = quoteCEWItems.some(
                                  (cewItem) => cewItem.id === item.id,
                                );
                                return (
                                  <td
                                    key={quote.id}
                                    className="border border-gray-200 px-4 py-2 text-center w-1/3"
                                  >
                                    {hasItem ? (
                                      <div className="w-full">
                                        <div className="text-center mb-2">
                                          <div className="text-xs font-medium text-green-600">
                                            {LibUtils.formatCurrency(
                                              Math.round(
                                                25000 * ((item.impact?.premiumAmount || 0) / 100),
                                              ),
                                              currency,
                                            )}{' '}
                                            ({(item.impact?.premiumAmount || 0) > 0 ? '+' : ''}
                                            {LibUtils.formatNumber(item.impact?.premiumAmount || 0)}
                                            %)
                                          </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground leading-relaxed text-left break-words">
                                          This extension provides additional coverage for{' '}
                                          {item.name && typeof item.name === 'string'
                                            ? item.name.toLowerCase()
                                            : item.name}{' '}
                                          as per the policy terms and conditions. The coverage
                                          includes all standard exclusions and limitations as
                                          outlined in the main policy document.
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-center">
                                        <div className="text-xs text-muted-foreground">
                                          Not Available
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ));
                        })()}

                        {/* TPL Extension Selection Row */}
                        <tr className="bg-blue-50">
                          <td className="border border-gray-200 px-4 py-2 font-medium text-sm w-1/3">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-medium">TPL Extension Selection</span>
                              <Badge variant="outline" className="text-xs">
                                TPL
                              </Badge>
                            </div>
                          </td>
                          {comparedQuotes.map((quote) => (
                            <td
                              key={`tpl-extension-${quote.id}`}
                              className="border border-gray-200 px-4 py-2 text-center w-1/3"
                            >
                              <div className="flex flex-col items-center space-y-1">
                                <div className="text-xs font-medium text-blue-600">
                                  {tplAdjustment.percent !== 0
                                    ? `${tplAdjustment.percent > 0 ? '+' : ''}${tplAdjustment.percent}%`
                                    : tplAdjustment.fixed !== 0
                                      ? `${tplAdjustment.fixed > 0 ? '+' : ''}${tplAdjustment.fixed}`
                                      : 'Standard'}
                                </div>
                                <div className="text-xs text-muted-foreground">TPL Adjustment</div>
                              </div>
                            </td>
                          ))}
                        </tr>

                        {/* Revised Premium Row */}
                        <tr className="bg-green-50 border-t-2 border-green-200">
                          <td className="border border-gray-200 px-4 py-3 font-semibold text-center text-sm w-1/3">
                            Revised Premium (After Extensions)
                          </td>
                          {comparedQuotes.map((quote) => (
                            <td
                              key={`revised-premium-${quote.id}`}
                              className="border border-gray-200 px-4 py-3 text-center w-1/3"
                            >
                              <div className="font-semibold text-green-600">
                                {LibUtils.formatCurrency(getCurrentPremium(quote), currency)}
                              </div>
                            </td>
                          ))}
                        </tr>

                        {/* Select Plan Buttons Row */}
                        <tr className="bg-blue-50 border-t-2 border-blue-200">
                          <td className="border border-gray-200 px-4 py-3 font-semibold text-center w-1/3"></td>
                          {comparedQuotes.map((quote) => (
                            <td
                              key={`action-${quote.id}`}
                              className="border border-gray-200 px-4 py-3 text-center w-1/3"
                            >
                              <Button
                                onClick={() => handleSelectPlanClick(quote.id)}
                                disabled={isSubmittingPlan}
                                className="w-full"
                                size="sm"
                              >
                                {isSubmittingPlan ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                    Selecting...
                                  </>
                                ) : (
                                  'Select This Plan'
                                )}
                              </Button>
                            </td>
                          ))}
                        </tr>

                        {isBrokerUser && !endorsementId && (
                          <tr className="bg-amber-50 border-t border-amber-200">
                            <td className="border border-gray-200 px-4 py-3 font-semibold text-center w-1/3"></td>
                            {comparedQuotes.map((quote) => {
                              const alreadyReferred = quote.status === 'referral';
                              const disabled =
                                alreadyReferred ||
                                !quote.quoteEvaluationId ||
                                (requestReferralMutation.isPending &&
                                  referralTargetQuote?.id === quote.id);
                              return (
                                <td
                                  key={`referral-${quote.id}`}
                                  className="border border-gray-200 px-4 py-3 text-center w-1/3"
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-2"
                                    disabled={disabled}
                                    onClick={() => handleOpenRequestReferralDialog(quote)}
                                  >
                                    <MessageSquareWarning className="w-3 h-3" />
                                    {alreadyReferred ? 'Referred' : 'Request Referral'}
                                  </Button>
                                </td>
                              );
                            })}
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Manual Referral Request Dialog */}
            <Dialog
              open={showRequestReferralDialog}
              onOpenChange={(open) => {
                if (requestReferralMutation.isPending) return;
                if (open) {
                  setShowRequestReferralDialog(true);
                } else {
                  closeReferralDialog();
                }
              }}
            >
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Request Manual Referral</DialogTitle>
                  <DialogDescription>
                    {referralTargetQuote?.insurerName
                      ? `Send a note to ${referralTargetQuote.insurerName} underwriter for review (e.g. request a discount on the premium).`
                      : 'Send a note to the underwriter for review.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-2 py-2">
                  <Label htmlFor="manual-referral-note">
                    Reason / note <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="manual-referral-note"
                    rows={5}
                    placeholder="Explain why you are requesting underwriter review (e.g. discount request)..."
                    value={referralNote}
                    onChange={(e) => setReferralNote(e.target.value)}
                    disabled={requestReferralMutation.isPending}
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {referralNote.length}/2000
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={closeReferralDialog}
                    disabled={requestReferralMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitManualReferral}
                    disabled={requestReferralMutation.isPending || !referralNote.trim()}
                  >
                    {requestReferralMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* CEW Customization Dialog */}
            <Dialog
              open={showCEWDialog}
              onOpenChange={(open) => {
                setShowCEWDialog(open);
              }}
            >
              <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col overflow-hidden z-50">
                <DialogHeader className="shrink-0">
                  <DialogTitle className="text-xl">
                    {selectedQuoteForCEW?.insurerName} - Configure coverages & add-ons
                  </DialogTitle>
                </DialogHeader>

                <div
                  className={`grid gap-6 mt-6 flex-1 min-h-0 ${
                    endorsementId ? 'max-w-full' : 'lg:grid-cols-3'
                  }`}
                >
                  <div
                    className={`flex flex-col h-full min-h-0 overflow-hidden pr-2 ${
                      endorsementId ? 'w-full' : 'lg:col-span-2'
                    } scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/45`}
                  >
                    <Tabs
                      value={extensionsDialogTab}
                      onValueChange={(v) => setExtensionsDialogTab(v as 'coverage' | 'addons')}
                      className="flex flex-col flex-1 min-h-0 gap-4"
                    >
                      <TabsList className="grid w-full max-w-md grid-cols-2 shrink-0">
                        <TabsTrigger value="coverage">Coverage Selection</TabsTrigger>
                        <TabsTrigger value="addons">Add on Selection</TabsTrigger>
                      </TabsList>
                      <TabsContent
                        value="coverage"
                        forceMount
                        className="flex-1 min-h-0 overflow-y-auto mt-0 data-[state=inactive]:hidden outline-none"
                      >
                        {coverSelectionBlock ?? (
                          <p className="text-sm text-muted-foreground py-6">
                            No cover breakdown available for this quote.
                          </p>
                        )}
                      </TabsContent>
                      <TabsContent
                        value="addons"
                        forceMount
                        className="flex-1 min-h-0 overflow-y-auto mt-0 data-[state=inactive]:hidden outline-none"
                      >
                        <CEWSelection
                          currency={currency}
                          key={`cew-${selectedQuoteForCEW?.id}-${showCEWDialog}`}
                          quoteId={comparisonData?.quote_id || undefined}
                          onSelectionChange={handleCEWSelectionChange}
                          onPremiumChange={handlePremiumChange}
                          onTPLAdjustmentChange={handleTPLAdjustmentChange}
                          onCEWAdjustmentChange={handleCEWAdjustmentChange}
                          onMandatoryCEWAdjustmentChange={handleMandatoryCEWAdjustmentChange}
                          onTPLSelectionChange={handleTPLSelectionChange}
                          onDeductibleAdjustmentChange={handleDeductibleAdjustmentChange}
                          onDeductibleSelectionChange={handleDeductibleSelectionChange}
                          productConfigBundle={productConfigBundle}
                          isLoadingProductConfig={isLoadingProductConfig}
                          productType={productType}
                          productSections={productSections}
                          isCartLikeCoverSelection={isCartLikeCoverSelection}
                          showCoverSelectionSlot={false}
                          storedSelections={(() => {
                            const prefill =
                              endorsementId && endorsementPrefill
                                ? endorsementPrefill
                                : selectedQuoteForCEW
                                  ? getStoredRequestForQuoteInsurer(
                                      effectiveQuoteKey,
                                      selectedQuoteForCEW.id,
                                    )
                                  : null;
                            return (prefill as any)?.completeCEWItems || [];
                          })()}
                          storedBrokerCommission={
                            endorsementId && endorsementPrefill
                              ? (endorsementPrefill as any)?.brokerCommissionPercent
                              : selectedQuoteForCEW
                                ? getStoredRequestForQuoteInsurer(
                                    effectiveQuoteKey,
                                    selectedQuoteForCEW.id,
                                  )?.brokerCommissionPercent
                                : undefined
                          }
                          storedTPLSelectionValue={
                            endorsementId && endorsementPrefill
                              ? (endorsementPrefill as any)?.tplSelection?.value
                              : selectedQuoteForCEW
                                ? getStoredRequestForQuoteInsurer(
                                    effectiveQuoteKey,
                                    selectedQuoteForCEW.id,
                                  )?.tplSelection?.value
                                : undefined
                          }
                          storedDeductibleSelectionValue={
                            endorsementId && endorsementPrefill
                              ? (endorsementPrefill as any)?.deductibleSelection?.value
                              : selectedQuoteForCEW
                                ? getStoredRequestForQuoteInsurer(
                                    effectiveQuoteKey,
                                    selectedQuoteForCEW.id,
                                  )?.deductibleSelection?.value
                                : undefined
                          }
                        />
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Premium Summary Sidebar — visible for Coverage and Add on; hidden in endorsement flow */}
                  {!endorsementId && (
                    <div className="lg:col-span-1 h-full min-h-0 flex flex-col border-l border-border/60 bg-muted/10 -mt-6 -mb-6 -mr-6 p-6 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:hsl(var(--primary)/0.35)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/35 hover:[&::-webkit-scrollbar-thumb]:bg-primary/50">
                      <div className="space-y-4 flex flex-col min-h-full">
                        {/* Selected Plan Card */}
                        <Card className="border-primary/20 bg-primary/5 shrink-0">
                          <CardHeader className="pb-2 px-3 pt-3">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                              <Building className="w-4 h-4 text-primary" />
                              Selected Plan
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 pt-0 px-3 pb-3">
                            {selectedQuoteForCEW && (
                              <>
                                <div>
                                  <h3 className="font-semibold text-base">
                                    {selectedQuoteForCEW.insurerName}
                                  </h3>
                                </div>
                                <Separator />
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                      Sum Insured
                                    </span>
                                    <span className="font-bold text-sm">
                                      {LibUtils.formatCurrency(
                                        isCartLikeCoverSelection &&
                                          selectedQuoteForCEW?.premium?.covers?.length
                                          ? getCartLikePremium(selectedQuoteForCEW).sumInsured
                                          : selectedQuoteForCEW?.validationResult?.sumInsured ||
                                              selectedQuoteForCEW?.coverageAmount ||
                                              currentProposal?.cover_requirements
                                                ?.computed_sum_insured ||
                                              0,
                                        currency,
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                      Base Premium
                                    </span>
                                    <span className="font-bold text-sm">
                                      {LibUtils.formatCurrency(
                                        isCartLikeCoverSelection &&
                                          selectedQuoteForCEW.premium?.covers?.length
                                          ? getCartLikePremium(selectedQuoteForCEW).premium
                                          : selectedQuoteForCEW.annualPremium,
                                        currency,
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>

                        {/* Selected CEW Items */}
                        {(() => {
                          const selectedItems = selectedCEWItems.filter((item) => item.isSelected);
                          return selectedItems.length > 0;
                        })() && (
                          <Card className="border-border">
                            <CardHeader className="pb-1.5 px-3 pt-3">
                              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                               Extensions
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 px-2 pb-3">
                              <div className="space-y-1">
                                {selectedCEWItems
                                  .filter((item) => item.isSelected)
                                  .map((item) => {
                                    const selectedOption = item.options?.find(
                                      (opt) => opt.id === item.selectedOptionId,
                                    );
                                    const rawType = String(
                                      item.id === 'tpl-extension'
                                        ? 'currency'
                                        : ((item as Record<string, unknown>).originalPricingType ??
                                            item.pricingType ??
                                            ''),
                                    ).toLowerCase();
                                    const isPct =
                                      selectedOption?.type === 'percentage' ||
                                      rawType.includes('percent');
                                    const rawValue = selectedOption
                                      ? Number(selectedOption.value || 0)
                                      : Number(
                                          item.impact?.premiumAmount ?? item.defaultValue ?? 0,
                                        );
                                    const formatted = isPct
                                      ? `${rawValue > 0 ? '+' : ''}${LibUtils.formatNumber(rawValue)}%`
                                      : `${rawValue > 0 ? '+' : ''}${LibUtils.formatCurrency(rawValue, currency)}`;
                                    const displayValue = selectedOption
                                      ? `${selectedOption.label}: ${formatted}`
                                      : formatted;

                                    return (
                                      <div
                                        key={item.id}
                                        className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 p-2 bg-background border border-border/50 rounded shadow-sm text-xs"
                                      >
                                        <div className="flex items-center gap-1 min-w-0">
                                          <span className="font-medium truncate min-w-0">
                                            {item.name}
                                          </span>
                                          <Badge
                                            variant="outline"
                                            className="text-[9px] px-1 py-0 flex-shrink-0"
                                          >
                                            {item.code}
                                          </Badge>
                                        </div>
                                        <span className="text-[10px] font-bold text-primary text-right max-w-[140px] break-words">
                                          {displayValue}
                                        </span>
                                      </div>
                                    );
                                  })}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Selected Deductibles */}
                        {selectedDeductibleOption && (
                          <Card className="border-border">
                            <CardHeader className="pb-1.5 px-3 pt-3">
                              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Selected Deductibles
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 px-2 pb-3">
                              <div className="space-y-1">
                                <div className="flex justify-between items-center p-2 bg-background border border-border/50 rounded shadow-sm text-xs">
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium truncate">
                                      {selectedDeductibleOption.label}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-bold text-primary flex-shrink-0">
                                    {selectedDeductibleOption.premiumAdjustment > 0 ? '+' : ''}
                                    {LibUtils.formatNumber(
                                      selectedDeductibleOption.premiumAdjustment,
                                    )}
                                    %
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Premium Summary Card */}
                        <Card className="border-border mt-auto shadow-md">
                          <CardHeader className="pb-2 px-3 pt-3">
                            <CardTitle className="text-base font-bold text-foreground">
                              Premium Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 pt-0 px-3 pb-4">
                            <div className="space-y-2">
                              {(tplAdjustment.percent !== 0 ||
                                tplAdjustment.fixed !== 0 ||
                                cewAdjustment.percent !== 0 ||
                                cewAdjustment.fixed !== 0 ||
                                deductibleAdjustment.percent !== 0 ||
                                deductibleAdjustment.fixed !== 0) && (
                                <>
                                  {(tplAdjustment.percent !== 0 || tplAdjustment.fixed !== 0) && (
                                    <>
                                      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 items-start">
                                        <span className="text-xs text-muted-foreground leading-snug">
                                          TPL Limit Adjustments
                                        </span>
                                        <span
                                          className={`text-xs font-medium text-right tabular-nums whitespace-nowrap ${
                                            tplAdjustment.percent > 0 || tplAdjustment.fixed > 0
                                              ? 'text-warning'
                                              : 'text-success'
                                          }`}
                                        >
                                          {tplAdjustment.percent !== 0
                                            ? `${tplAdjustment.percent > 0 ? '+' : ''}${LibUtils.formatNumber(tplAdjustment.percent, 1, 1)}%`
                                            : `${tplAdjustment.fixed > 0 ? '+' : ''}${LibUtils.formatCurrency(tplAdjustment.fixed, currency)}`}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 items-start">
                                        <span className="text-xs text-muted-foreground leading-snug">
                                          TPL Adjustment Amount
                                        </span>
                                        <span
                                          className={`text-xs font-medium text-right tabular-nums whitespace-nowrap ${
                                            tplAdjustmentAmount > 0
                                              ? 'text-warning'
                                              : 'text-success'
                                          }`}
                                        >
                                          {tplAdjustmentAmount > 0 ? '+' : ''}
                                          {LibUtils.formatCurrency(tplAdjustmentAmount, currency)}
                                        </span>
                                      </div>
                                    </>
                                  )}

                                  {(cewAdjustment.percent !== 0 || cewAdjustment.fixed !== 0) && (
                                    <>
                                      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 items-start">
                                        <span className="text-xs text-muted-foreground leading-snug">
                                          CEW Adjustments
                                        </span>
                                        <span
                                          className={`text-xs font-medium text-right tabular-nums whitespace-nowrap ${
                                            cewAdjustment.percent > 0 || cewAdjustment.fixed > 0
                                              ? 'text-warning'
                                              : 'text-success'
                                          }`}
                                        >
                                          {cewAdjustment.percent !== 0
                                            ? `${cewAdjustment.percent > 0 ? '+' : ''}${LibUtils.formatNumber(cewAdjustment.percent, 1, 1)}%`
                                            : `${cewAdjustment.fixed > 0 ? '+' : ''}${LibUtils.formatCurrency(cewAdjustment.fixed, currency)}`}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 items-start">
                                        <span className="text-xs text-muted-foreground leading-snug">
                                          CEW Adjustment Amount
                                        </span>
                                        <span
                                          className={`text-xs font-medium text-right tabular-nums whitespace-nowrap ${
                                            cewAdjustmentAmount > 0
                                              ? 'text-warning'
                                              : 'text-success'
                                          }`}
                                        >
                                          {cewAdjustmentAmount > 0 ? '+' : ''}
                                          {LibUtils.formatCurrency(cewAdjustmentAmount, currency)}
                                        </span>
                                      </div>
                                    </>
                                  )}

                                  {(deductibleAdjustment.percent !== 0 ||
                                    deductibleAdjustment.fixed !== 0) && (
                                    <>
                                      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 items-start">
                                        <span className="text-xs text-muted-foreground leading-snug">
                                          Deductible Adjustments
                                        </span>
                                        <span
                                          className={`text-xs font-medium text-right tabular-nums whitespace-nowrap ${
                                            deductibleAdjustment.percent > 0 ||
                                            deductibleAdjustment.fixed > 0
                                              ? 'text-warning'
                                              : 'text-success'
                                          }`}
                                        >
                                          {deductibleAdjustment.percent !== 0
                                            ? `${deductibleAdjustment.percent > 0 ? '+' : ''}${LibUtils.formatNumber(deductibleAdjustment.percent, 1, 1)}%`
                                            : `${deductibleAdjustment.fixed > 0 ? '+' : ''}${LibUtils.formatCurrency(deductibleAdjustment.fixed, currency)}`}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 items-start">
                                        <span className="text-xs text-muted-foreground leading-snug">
                                          Deductible Adjustment Amount
                                        </span>
                                        <span
                                          className={`text-xs font-medium text-right tabular-nums whitespace-nowrap ${
                                            deductibleAdjustmentAmount > 0
                                              ? 'text-warning'
                                              : 'text-success'
                                          }`}
                                        >
                                          {deductibleAdjustmentAmount > 0 ? '+' : ''}
                                          {LibUtils.formatCurrency(
                                            deductibleAdjustmentAmount,
                                            currency,
                                          )}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </>
                              )}

                              {(tplAdjustment.percent !== 0 ||
                                tplAdjustment.fixed !== 0 ||
                                cewAdjustment.percent !== 0 ||
                                cewAdjustment.fixed !== 0 ||
                                deductibleAdjustment.percent !== 0 ||
                                deductibleAdjustment.fixed !== 0) && (
                                <>
                                  <Separator />
                                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 items-start">
                                    <span className="text-xs font-semibold text-foreground leading-snug">
                                      Total Base Premium
                                    </span>
                                    <span className="text-xs font-bold text-right tabular-nums whitespace-nowrap">
                                      {LibUtils.formatCurrency(totalBasePremium, currency)}
                                    </span>
                                  </div>
                                  <Separator />
                                </>
                              )}

                              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 items-start">
                                <span className="text-xs text-muted-foreground leading-snug">
                                  Technical Premium
                                </span>
                                <span className="text-xs font-semibold text-right tabular-nums whitespace-nowrap">
                                  {LibUtils.formatCurrency(netPremium, currency)}
                                </span>
                              </div>

                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="text-xs text-muted-foreground">
                                    Broker Commission
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-foreground">
                                      {brokerCommissionPercent}%
                                    </span>
                                    <button
                                      type="button"
                                      className="text-xs font-semibold text-primary hover:text-primary/80 cursor-pointer"
                                      onClick={handleOpenBrokerCommissionDialog}
                                    >
                                      Edit
                                    </button>
                                  </div>
                                </div>
                                <span className="text-xs font-medium">
                                  {LibUtils.formatCurrency(brokerCommissionAmount, currency)}
                                </span>
                              </div>

                              {feeTotalsDynamic.feeLines.filter((f) => Number(f.amount) !== 0)
                                .length > 0 && (
                                <>
                                  <Separator />
                                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Fees
                                  </div>
                                </>
                              )}

                              {feeTotalsDynamic.feeLines
                                .filter((f) => Number(f.amount) !== 0)
                                .map((f) => {
                                  const basis =
                                    f.adjustmentType === 'PERCENTAGE'
                                      ? `${Number(f.adjustmentValue || 0).toFixed(2)}%`
                                      : f.adjustmentType === 'FACTOR'
                                        ? `x${Number(f.adjustmentValue || 0).toFixed(4)}`
                                        : LibUtils.formatCurrency(
                                            Number(f.adjustmentValue || 0),
                                            currency,
                                          );

                                  return (
                                    <div
                                      key={f.label}
                                      className="flex justify-between items-center border-b border-border/40 py-2"
                                    >
                                      <span className="text-xs">
                                        <span className="font-medium text-foreground">
                                          {f.label}
                                        </span>{' '}
                                        <span className="text-muted-foreground">({basis})</span>
                                      </span>
                                      <span className="text-xs font-medium">
                                        {LibUtils.formatCurrency(Number(f.amount || 0), currency)}
                                      </span>
                                    </div>
                                  );
                                })}

                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Total Fees</span>
                                <span className="text-xs font-semibold">
                                  {LibUtils.formatCurrency(
                                    Number(feeTotalsDynamic.totalFees || 0),
                                    currency,
                                  )}
                                </span>
                              </div>

                              <Separator />

                              <div className="flex justify-between items-center mb-4 mt-2">
                                <span className="font-semibold text-sm text-foreground">
                                  Total Annual Premium
                                </span>
                                <div className="leading-none">
                                  <span className="text-base font-bold text-primary whitespace-nowrap">
                                    {LibUtils.formatCurrency(finalPremiumWithFees, currency)}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2 pt-4 border-t mt-4">
                                {!endorsementId && (
                                  <Button
                                    onClick={handleDownloadCurrentQuote}
                                    disabled={isDownloadingQuote}
                                    variant="outline"
                                    className="w-full text-xs font-medium"
                                  >
                                    {isDownloadingQuote ? (
                                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                    ) : (
                                      <Download className="w-3 h-3 mr-2" />
                                    )}
                                    Download Quote
                                  </Button>
                                )}
                                <Button
                                  onClick={() => handleSelectPlanClick(selectedQuoteForCEW?.id)}
                                  disabled={isSubmittingPlan}
                                  className="w-full font-bold"
                                >
                                  {isSubmittingPlan ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                      Selecting...
                                    </>
                                  ) : (
                                    'Select Plan'
                                  )}
                                </Button>
                                {isBrokerUser &&
                                  !endorsementId &&
                                  selectedQuoteForCEW &&
                                  !!selectedQuoteForCEW.quoteEvaluationId &&
                                  selectedQuoteForCEW.status !== 'referral' && (
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        if (!selectedQuoteForCEW) return;
                                        setShowCEWDialog(false);
                                        handleOpenRequestReferralDialog(selectedQuoteForCEW);
                                      }}
                                      disabled={
                                        requestReferralMutation.isPending &&
                                        referralTargetQuote?.id === selectedQuoteForCEW.id
                                      }
                                      className="w-full gap-2"
                                    >
                                      <MessageSquareWarning className="w-4 h-4" />
                                      Request Referral
                                    </Button>
                                  )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </div>

                {endorsementId && (
                  <DialogFooter className="mt-4 border-t pt-4 shrink-0">
                    <Button
                      onClick={async () => {
                        if (!selectedQuoteForCEW?.id) return;
                        if (!validateMandatoryCEWItems()) return;
                        try {
                          await handleSelectPlanWithAPIRef.current?.(selectedQuoteForCEW.id);
                          setShowCEWDialog(false);
                          toast({
                            title: 'Extensions saved',
                            description: 'Your extension selections have been saved.',
                          });
                        } catch {
                          // Error already shown by handleSelectPlanWithAPI
                        }
                      }}
                      disabled={isSubmittingPlan}
                      className="w-full sm:w-auto"
                    >
                      {isSubmittingPlan ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block" />
                          Saving...
                        </>
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </DialogFooter>
                )}
              </DialogContent>
            </Dialog>

            <Dialog
              open={isBrokerCommissionDialogOpen}
              onOpenChange={(open) => {
                setIsBrokerCommissionDialogOpen(open);
                if (!open) {
                  setBrokerCommissionError('');
                }
              }}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Broker Commission</DialogTitle>
                  <DialogDescription>
                    Set the broker commission percentage within the allowed range.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={brokerCommissionInput}
                      onChange={handleBrokerCommissionInputChange}
                      placeholder="Enter commission %"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{allowedCommissionRangeLabel}</p>
                  {brokerCommissionError && (
                    <p className="text-xs text-destructive">{brokerCommissionError}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleBrokerCommissionDialogCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleBrokerCommissionDialogSave}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Extension Confirmation Dialog */}
            <Dialog open={showExtensionConfirmDialog} onOpenChange={setShowExtensionConfirmDialog}>
              <DialogContent className="w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Confirm Default Extensions</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You're about to select this plan with default extensions. Would you like to
                    customize the extensions first, or proceed with the default selections?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowExtensionConfirmDialog(false);
                        if (pendingQuoteId) {
                          const quote = realQuotes.find((q) => q.id === pendingQuoteId);
                          if (quote) {
                            handleExtensionsClick(quote);
                          }
                        }
                      }}
                      className="w-full sm:w-auto"
                    >
                      Customize Extensions
                    </Button>
                    <Button
                      onClick={() => {
                        setShowExtensionConfirmDialog(false);
                        if (pendingQuoteId) {
                          proceedWithSelection(pendingQuoteId);
                        }
                      }}
                      className="w-full sm:w-auto"
                    >
                      Proceed with Defaults
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Validation Details Dialog */}
            <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
              <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Proposal Validation Results</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-6">
                  {/* Validation Results */}
                  {Object.keys(insurerValidationResults).length > 0 && (
                    <div className="space-y-4">
                      {/* <h3 className="text-lg font-semibold text-foreground">
                      Proposal Validation Results
                    </h3> */}
                      {Object.entries(insurerValidationResults).map(([insurerId, result]) => {
                        const insurer = eligibleInsurers.find(
                          (i) => String(i.insurer_id) === insurerId,
                        );
                        const insurerName =
                          insurer?.insurer_name ||
                          comparisonData?.insurers?.find((i) => String(i.insurer_id) === insurerId)
                            ?.insurer_name ||
                          `Insurer #${insurerId}`;

                        return (
                          <Card
                            key={insurerId}
                            className={`border ${
                              result.overallDecision === 'Auto Quote'
                                ? 'border-green-200 bg-green-50'
                                : result.overallDecision === 'Referral'
                                  ? 'border-yellow-200 bg-yellow-50'
                                  : 'border-red-200 bg-red-50'
                            }`}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{insurerName}</CardTitle>
                                <Badge
                                  variant={
                                    result.overallDecision === 'Auto Quote'
                                      ? 'default'
                                      : result.overallDecision === 'Referral'
                                        ? 'secondary'
                                        : 'destructive'
                                  }
                                >
                                  {result.overallDecision}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="space-y-2">
                                <div className="text-sm text-muted-foreground mb-3">
                                  {result.ratingBreakdown.length} field validations completed
                                </div>

                                {/* Base Premium Display */}
                                {result.basePremium > 0 && (
                                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-blue-900">
                                        Base Premium
                                      </span>
                                      <span className="text-lg font-bold text-blue-900">
                                        {LibUtils.formatCurrency(result.basePremium, currency)}
                                      </span>
                                    </div>
                                    {result.pricingDetails && (
                                      <div className="text-xs text-blue-700 mt-1 space-y-1">
                                        <div>{result.pricingDetails.calculation}</div>
                                        <div className="font-medium">
                                          Formula: {result.pricingDetails.percentageProductFormula}
                                        </div>
                                        <div className="text-xs text-blue-600">
                                          Base Rate: {result.pricingDetails.baseRate} | Factors:{' '}
                                          {result.pricingDetails.factors.join(', ')}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Validation Details Table */}
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs border-collapse">
                                    <thead>
                                      <tr className="border-b">
                                        <th className="text-left p-2 font-medium">Field</th>
                                        <th className="text-left p-2 font-medium">
                                          Proposal Value
                                        </th>
                                        <th className="text-left p-2 font-medium">
                                          Config Range/Match
                                        </th>
                                        <th className="text-left p-2 font-medium">Category</th>
                                        <th className="text-left p-2 font-medium">Pricing</th>
                                        <th className="text-left p-2 font-medium">Decision</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {result.ratingBreakdown.map((validation, index) => (
                                        <tr
                                          key={index}
                                          className={`border-b ${
                                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                          } hover:bg-muted/50 transition-colors`}
                                        >
                                          <td className="p-3 font-medium text-xs text-foreground">
                                            {validation.fieldLabel
                                              .replace(/_/g, ' ')
                                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                                          </td>
                                          <td className="p-3 text-xs text-foreground">
                                            {typeof validation.proposalValue === 'object'
                                              ? JSON.stringify(validation.proposalValue)
                                              : String(validation.proposalValue)}
                                          </td>
                                          <td className="p-3 text-xs text-foreground">
                                            {validation.configMatch}
                                          </td>
                                          <td className="p-3 text-xs text-foreground">
                                            {validation.category}
                                          </td>
                                          <td className="p-3 text-xs">
                                            <div className="flex flex-col">
                                              <span className="font-medium text-foreground">
                                                {validation.pricingEffect}
                                              </span>
                                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
                                                {validation.decision.toLowerCase()}
                                              </span>
                                            </div>
                                          </td>
                                          <td className="p-3">
                                            <Badge
                                              className={`${
                                                validation.decision === 'Auto Quote'
                                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200'
                                                  : validation.decision === 'Referral'
                                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200'
                                                    : 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200'
                                              } border px-2 py-0.5 text-[10px] font-semibold shadow-none`}
                                            >
                                              {validation.decision}
                                            </Badge>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* No Validation Results */}
                  {Object.keys(insurerValidationResults).length === 0 && (
                    <Card className="border-gray-200 bg-gray-50">
                      <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">
                          No validation results available yet. Please wait for the validation
                          process to complete.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        <Dialog open={isPremiumSummaryDialogOpen} onOpenChange={setIsPremiumSummaryDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between gap-3">
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Premium Breakup Summary
                </DialogTitle>
              </div>
            </DialogHeader>
            <PremiumCalculationSummaryContent
              premium={(selectedQuoteForPremiumSummary?.premium as PremiumBreakdown | null) ?? null}
              currency={currency}
              showPremiumSummaryFormulas={showPremiumSummaryFormulas}
              productSections={productSections}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isCoverBreakdownDialogOpen} onOpenChange={setIsCoverBreakdownDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto p-0">
            <div className="sticky top-0 z-10 bg-background border-b border-border/60">
              <DialogHeader className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <DialogTitle>Cover Breakdown</DialogTitle>
                    <DialogDescription>Per-cover premiums and sum insured.</DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsCoverBreakdownDialogOpen(false)}
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>
            </div>
            <div className="px-6 py-4">
              {(() => {
                const covers: CoverPremiumItem[] = Array.isArray(
                  selectedQuoteForCoverBreakdown?.premium?.covers,
                )
                  ? (selectedQuoteForCoverBreakdown?.premium?.covers as CoverPremiumItem[])
                  : [];

                const coverToSection = new Map<
                  string,
                  { id?: string; name?: string; order?: number }
                >();
                for (const section of productSections) {
                  const sectionId = section.id;
                  const sectionName = section.name;
                  const sectionOrder = section.order;
                  for (const cover of section.covers || []) {
                    if (!cover.id) continue;
                    coverToSection.set(cover.id, {
                      id: sectionId,
                      name: sectionName,
                      order: sectionOrder,
                    });
                  }
                }

                const groups = new Map<
                  string,
                  {
                    sectionId?: string;
                    sectionName: string;
                    order: number;
                    covers: typeof covers;
                    sectionPremium: number;
                    sectionSumInsured: number;
                  }
                >();

                for (const cover of covers) {
                  const mapped = coverToSection.get(cover.coverId);
                  const sectionId = cover.sectionId ?? mapped?.id ?? undefined;
                  const sectionName = cover.sectionName ?? mapped?.name ?? 'Other';
                  const order =
                    typeof cover.sectionOrder === 'number'
                      ? cover.sectionOrder!
                      : typeof mapped?.order === 'number'
                        ? mapped.order!
                        : 999;

                  const key = sectionId || sectionName;
                  const existing = groups.get(key);
                  const net = Number(cover.netPremium || 0);
                  const si = Number(cover.sumInsured || 0);

                  if (!existing) {
                    groups.set(key, {
                      sectionId,
                      sectionName,
                      order,
                      covers: [cover],
                      sectionPremium: net,
                      sectionSumInsured: si,
                    });
                  } else {
                    existing.covers.push(cover);
                    existing.sectionPremium += net;
                    existing.sectionSumInsured += si;
                  }
                }

                const sections = Array.from(groups.values()).sort((a, b) => {
                  if (a.order !== b.order) return a.order - b.order;
                  return a.sectionName.localeCompare(b.sectionName);
                });

                const finalPremium = sections.reduce(
                  (acc, s) => acc + Number(s.sectionPremium || 0),
                  0,
                );
                const finalSumInsured = sections.reduce(
                  (acc, s) => acc + Number(s.sectionSumInsured || 0),
                  0,
                );

                if (!covers.length) {
                  return (
                    <Card className="border-gray-200 bg-gray-50">
                      <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">No cover breakdown available.</p>
                      </CardContent>
                    </Card>
                  );
                }

                return (
                  <div className="space-y-4">
                    <Card className="border-border bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground">Final Premium</div>
                            <div className="text-lg font-bold text-primary">
                              {LibUtils.formatCurrency(finalPremium, currency)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Total Sum Insured</div>
                            <div className="text-sm font-semibold">
                              {LibUtils.formatCurrency(finalSumInsured, currency)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-3">
                      {sections.map((section) => (
                        <Card
                          key={section.sectionId || section.sectionName}
                          className="border-border"
                        >
                          <CardHeader className="px-4 py-3 bg-muted/10">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-0.5">
                                <CardTitle className="text-sm">{section.sectionName}</CardTitle>
                                <div className="text-[11px] text-muted-foreground">
                                  {`${section.covers.length} cover${section.covers.length === 1 ? '' : 's'}`}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[11px] text-muted-foreground">
                                  Section Premium
                                </div>
                                <div className="text-sm font-semibold text-primary">
                                  {LibUtils.formatCurrency(section.sectionPremium, currency)}
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="px-4 py-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-muted-foreground">
                                Section Sum Insured
                              </div>
                              <div className="text-xs font-semibold">
                                {LibUtils.formatCurrency(section.sectionSumInsured, currency)}
                              </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                              {section.covers.map((cover: CoverPremiumItem) => (
                                <div
                                  key={cover.coverId}
                                  className="flex items-start justify-between gap-3"
                                >
                                  <div className="min-w-0">
                                    <div className="text-xs font-medium truncate">
                                      {cover.name ?? cover.coverId}
                                    </div>
                                    {/* {cover.code ? (
                                    <div className="text-[10px] text-muted-foreground truncate">
                                      {cover.code}
                                    </div>
                                  ) : null} */}
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs font-semibold">
                                      {LibUtils.formatCurrency(
                                        Number(cover.netPremium || 0),
                                        currency,
                                      )}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                      SI:{' '}
                                      {LibUtils.formatCurrency(
                                        Number(cover.sumInsured || 0),
                                        currency,
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>

        {/* Plan Selection Confirmation Dialog */}
        {showPlanConfirmationDialog && (
          <Dialog open={showPlanConfirmationDialog} onOpenChange={setShowPlanConfirmationDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Plan Selection</DialogTitle>
                <DialogDescription>
                  Are you sure you want to select this insurance plan? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>

              {pendingPlanSelection &&
                (() => {
                  const selectedQuote = realQuotes.find((q) => q.id === pendingPlanSelection);
                  if (!selectedQuote) return null;

                  return (
                    <div className="space-y-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2">Selected Plan Details:</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Insurer:</span>
                            <span className="font-medium inline-block w-[140px] shrink-0 text-left">
                              {selectedQuote.insurerName}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span>Sum Insured:</span>
                            <span className="font-medium inline-block w-[140px] shrink-0 text-left">
                              {LibUtils.formatCurrency(
                                Number(selectedQuote.validationResult?.sumInsured || 0),
                                currency,
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span>Annual Premium:</span>
                            <span className="font-medium text-primary inline-block w-[140px] shrink-0 text-left">
                              {LibUtils.formatCurrency(finalPremiumWithFees, currency)}
                            </span>
                          </div>

                          {buildExtensionItems().length > 0 && (
                            <div className="flex justify-between">
                              <span>Selected Extensions:</span>
                              <span className="font-medium inline-block w-[140px] shrink-0 text-left">
                                {buildExtensionItems().length}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        By selecting this plan, you agree to proceed to the document submission
                        phase.
                      </div>
                    </div>
                  );
                })()}

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={cancelPlanSelection}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmPlanSelection}
                  className="w-full sm:w-auto"
                  disabled={isSubmittingPlan}
                >
                  {isSubmittingPlan ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Selecting Plan...
                    </>
                  ) : (
                    'Confirm Selection'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  },
);

export { QuotesComparison };
export type { QuotesComparisonRef, RatingBreakdownItem };
