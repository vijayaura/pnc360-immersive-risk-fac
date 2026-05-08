import { InsurerPricingConfigResponse, PolicyLimitsAndDeductible, QuotesComparisonInsurerConfig } from '@/features/quotes/api/quotes';
import { BrokerInsurer } from '@/features/brokers/api/brokers';
import { InsurerValidationResult } from './QuotesComparison.types';
import { formatCurrency } from '@/shared/utils/lib-utils';

const DEFAULT_BROKER_BASE_PCT = 0;
const DEFAULT_BROKER_MIN_PCT = 0;
const DEFAULT_BROKER_MAX_PCT = 0;

function pickFirstFinite(...vals: (unknown | null | undefined)[]): number | undefined {
  for (const v of vals) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

export type BrokerCommissionMeta = {
  brokerBaseCommissionPercentage: number;
  brokerMinCommissionPercentage: number;
  brokerMaxCommissionPercentage: number;
};

/**
 * Aligns accept-quote / plan summary with calculate-rating `commissions` and product policy limits.
 * Precedence: rating insurer → quote row → comparison row → policy_limits → defaults.
 */
export function resolveBrokerCommissionMeta(params: {
  ratingInsurerCommissions?: Record<string, unknown> | null;
  quoteCommissions?: Record<string, unknown> | null;
  comparisonInsurerCommissions?: Record<string, unknown> | null;
  policyLimits?: PolicyLimitsAndDeductible['policy_limits'] | null | undefined;
}): BrokerCommissionMeta {
  const {
    ratingInsurerCommissions,
    quoteCommissions,
    comparisonInsurerCommissions,
    policyLimits,
  } = params;

  const base =
    pickFirstFinite(
      ratingInsurerCommissions?.brokerCommissionPercent,
      quoteCommissions?.brokerCommissionPercent,
      comparisonInsurerCommissions?.brokerCommissionPercent,
      policyLimits?.base_broker_commission?.value,
    ) ?? DEFAULT_BROKER_BASE_PCT;

  const min =
    pickFirstFinite(
      ratingInsurerCommissions?.minBrokerCommissionPercent,
      quoteCommissions?.minBrokerCommissionPercent,
      comparisonInsurerCommissions?.minBrokerCommissionPercent,
      policyLimits?.minimum_broker_commission?.value,
    ) ?? DEFAULT_BROKER_MIN_PCT;

  const max =
    pickFirstFinite(
      ratingInsurerCommissions?.maxBrokerCommissionPercent,
      quoteCommissions?.maxBrokerCommissionPercent,
      comparisonInsurerCommissions?.maxBrokerCommissionPercent,
      policyLimits?.maximum_broker_commission?.value,
    ) ?? DEFAULT_BROKER_MAX_PCT;

  return {
    brokerBaseCommissionPercentage: base,
    brokerMinCommissionPercentage: min,
    brokerMaxCommissionPercentage: max,
  };
}

/** Resolve broker bounds from localStorage / endorsement prefill (flat fields + premium_summary). */
export function resolveBrokerCommissionMetaFromPrefill(
  prefill: Record<string, unknown>,
  policyLimits?: PolicyLimitsAndDeductible['policy_limits'] | null | undefined,
): BrokerCommissionMeta {
  const ps = (prefill.premium_summary as Record<string, unknown>) || {};
  return resolveBrokerCommissionMeta({
    quoteCommissions: {
      brokerCommissionPercent:
        prefill.brokerBaseCommissionPercentage ?? ps.broker_base_commission_pct,
      minBrokerCommissionPercent:
        prefill.brokerMinCommissionPercentage ?? ps.broker_min_commission_pct,
      maxBrokerCommissionPercent:
        prefill.brokerMaxCommissionPercentage ?? ps.broker_max_commission_pct,
    },
    policyLimits: policyLimits ?? undefined,
  });
}

export const normalizeToQuotesComparisonConfig = (
  config: QuotesComparisonInsurerConfig | InsurerPricingConfigResponse | null | undefined,
): QuotesComparisonInsurerConfig => {
  if (!config)
    return {
      tpl_limits: null,
      tpl_extensions: [],
      clause_pricing_config: [],
      deductibles: [],
      validationResults: [],
      globalCews: [],
    };
  // If it's already in the target format (has deductibles array)
  if (
    'deductibles' in config &&
    Array.isArray((config as QuotesComparisonInsurerConfig).deductibles)
  ) {
    const c = config as QuotesComparisonInsurerConfig & {
      policy_limits_and_deductible?: PolicyLimitsAndDeductible;
    };
    return {
      tpl_limits: c.tpl_limits ?? null,
      tpl_extensions: c.tpl_extensions ?? [],
      clause_pricing_config: c.clause_pricing_config ?? [],
      deductibles: c.deductibles ?? [],
      validationResults: c.validationResults ?? [],
      globalCews: c.globalCews ?? [],
      ...(c.policy_limits_and_deductible != null
        ? { policy_limits_and_deductible: c.policy_limits_and_deductible }
        : {}),
    };
  }

  // Map from InsurerPricingConfigResponse
  let deductibles: Array<{
    id: number;
    discount: number;
    quote_action: string;
    value: number;
  }> = [];
  if (
    'policy_limits_and_deductible' in config &&
    config.policy_limits_and_deductible?.deductibles
  ) {
    deductibles = config.policy_limits_and_deductible.deductibles.map((d: any, index: number) => ({
      id: index + 1,
      discount: d.loading_discount || 0,
      quote_action: d.quote_option || 'AUTO_QUOTE',
      value: d.value || 0,
    }));
  }

  const policyLimits =
    'policy_limits_and_deductible' in config && config.policy_limits_and_deductible
      ? config.policy_limits_and_deductible
      : undefined;

  return {
    tpl_limits: ('tpl_limits' in config ? config.tpl_limits : null) || null,
    tpl_extensions:
      ('tpl_extensions' in config
        ? (config as unknown as { tpl_extensions: QuotesComparisonInsurerConfig['tpl_extensions'] })
            .tpl_extensions
        : []) || [],
    clause_pricing_config:
      ('clause_pricing_config' in config
        ? (
            config as unknown as {
              clause_pricing_config: QuotesComparisonInsurerConfig['clause_pricing_config'];
            }
          ).clause_pricing_config
        : []) || [],
    deductibles: deductibles,
    validationResults: 'validationResults' in config ? config.validationResults || [] : [],
    globalCews: 'globalCews' in config ? (config as any).globalCews || [] : [],
    ...(policyLimits != null ? { policy_limits_and_deductible: policyLimits } : {}),
  };
};

// Generate real quotes from validation results
export const generateRealQuotes = (
  insurerValidationResults: Record<number, InsurerValidationResult>,
  eligibleInsurers: BrokerInsurer[],
  insurerPricingConfigs: Record<number, InsurerPricingConfigResponse>,
) => {
  const quotes = eligibleInsurers
    .filter((insurer) => {
      const result = insurerValidationResults[insurer.insurer_id];
      const isValid =
        result &&
        (result.overallDecision === 'Auto Quote' || result.overallDecision === 'Referral');
      return isValid;
    })
    .map((insurer) => {
      const result = insurerValidationResults[insurer.insurer_id];
      const sumInsured = result.sumInsured || 0;

      // Get maximum cover from insurer's product configuration
      const pricingConfig = insurerPricingConfigs[insurer.insurer_id];
      const maximumCover =
        pricingConfig?.policy_limits_and_deductible?.policy_limits?.maximum_cover?.value ||
        sumInsured;

      return {
        id: insurer.insurer_id,
        quoteEvaluationId: null as string | null,
        planName: `${insurer.insurer_name} CAR Plan`,
        insurerName: insurer.insurer_name,
        annualPremium: result.basePremium,
        coverageAmount: maximumCover, // Use insurer's maximum cover instead of sum insured
        premium: result.premium || null,
        feeTypes: result.feeTypes || [],
        ratingBreakdown: result.ratingBreakdown || [],
        commissions: result.commissions || {},
        rating: 4.5, // Default rating, could be enhanced later
        deductible: formatCurrency(25000), // Default deductible, could be from config
        isRecommended: false,
        status: result.overallDecision === 'Referral' ? 'referral' : 'quoted',
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
        validationResult: result, // Store validation result for reference
        pricingConfig: normalizeToQuotesComparisonConfig(pricingConfig), // Store pricing config for reference
      };
    });

  return quotes;
};
