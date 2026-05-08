/**
 * PI Arch Premium Calculation Utility
 * Calculates premium based on proposal form data and pricing configuration
 */

interface PricingConfig {
  architectsActivity: Array<{ activity: string; factorExceeding50: number; technicalKnowledge: number }>;
  engineersActivity: Array<{ activity: string; factorExceeding50: number; technicalKnowledge: number }>;
  deductiblesTable: Record<string, Record<string, number>>;
  limitOfIndemnityTable: Record<string, Record<string, number>>;
  aggregateLimitOptions: Array<{ option: string; quoteOption: string; pricing: number }>;
  claimsFactor: Array<{ condition: string; quoteOption: string; pricing: number }>;
  extensionsPricing?: Record<string, number>; // Extension name -> factor (e.g., "Loss of documents": 1.075)
}

/**
 * Proposal Form Data Interface
 * Field Mappings (Proposal Form Field Name → Calculation Variable):
 * - "Last 12 Months Turnover" → annualTurnover
 * - "Limit of Indemnity (Any One Claim)*" → limitOfIndemnity
 * - "Deductible" → deductible
 * - "Aggregate Limit" → aggregateLimit
 * - "Architecture Activity Split" → architectureActivitySplit
 * - "Engineering Activity Split" → engineeringActivitySplit
 * - "Do you have any claims?" → hasClaims
 * - "Claims History" → claimsHistory
 * - "Extensions Required" → extensionsRequired
 */
interface ProposalFormData {
  // Turnover
  last12MonthsTurnover?: number; // "Last 12 Months Turnover" → annualTurnover
  estimatedComing12MonthsTurnover?: number;
  
  // Activity splits
  architectureActivitySplit?: Array<{ activityType: string; last12MonthsAmount?: number; estimatedComing12MonthsAmount?: number }>;
  engineeringActivitySplit?: Array<{ activityType: string; last12MonthsAmount?: number; estimatedComing12MonthsAmount?: number }>;
  
  // Coverage & Limits
  limitOfIndemnity?: string; // "Limit of Indemnity (Any One Claim)*" → limitOfIndemnity (e.g., "0.5 m", "1 m", "1.5 m", etc.)
  deductible?: string; // "Deductible" → deductible (e.g., "AED 10,000", "AED 20,000", etc.)
  aggregateLimit?: string; // "Aggregate Limit" → aggregateLimit (e.g., "Same as AOA", "Double aggregate limit", etc.)
  
  // Claims history
  hasClaims?: string; // "Do you have any claims?" → hasClaims
  claimsHistory?: Array<any>; // "Claims History" → claimsHistory
  
  // CEWS (Clauses, Extensions, Warranties)
  extensionsRequired?: Record<string, any>; // "Extensions Required" → extensionsRequired
  
  // Other factors
  coverageBasis?: string;
}

/**
 * Get rate from Limit of Indemnity table based on annual turnover and limit
 */
function getLimitOfIndemnityRate(
  annualTurnover: number,
  limitOfIndemnity: string,
  limitOfIndemnityTable: Record<string, Record<string, number>>
): number {
  // Map turnover to fee range
  const feeRanges = ["2,50,000", "5,00,000", "7,50,000", "10,00,000", "25,00,000", "50,00,000", "75,00,000", "1,00,00,000", "2,00,00,000", "4,00,00,000", "8,00,00,000", "16,00,00,000"];
  const feeValues = [250000, 500000, 750000, 1000000, 2500000, 5000000, 7500000, 10000000, 20000000, 40000000, 80000000, 160000000];
  
  // Find the appropriate fee range
  let selectedFeeRange = feeRanges[0];
  for (let i = feeRanges.length - 1; i >= 0; i--) {
    if (annualTurnover <= feeValues[i]) {
      selectedFeeRange = feeRanges[i];
    } else {
      break;
    }
  }
  
  // If turnover exceeds the highest range, use the highest
  if (annualTurnover > feeValues[feeValues.length - 1]) {
    selectedFeeRange = feeRanges[feeRanges.length - 1];
  }
  
  // Get rate from table
  // Table stores rates as "per thousand" format (e.g., 15.30 means 0.0153 per thousand)
  // Divide by 1000 to convert to decimal rate for calculation
  const rate = limitOfIndemnityTable[selectedFeeRange]?.[limitOfIndemnity] || 0;
  return rate / 1000; // Convert per thousand to decimal (e.g., 15.30 -> 0.0153)
}

/**
 * Get deductible rebate from deductibles table
 */
function getDeductibleRebate(
  annualTurnover: number,
  deductible: string,
  deductiblesTable: Record<string, Record<string, number>>
): number {
  // Map turnover to fee range
  const feeRanges = ["2,50,000", "5,00,000", "7,50,000", "10,00,000", "25,00,000", "50,00,000", "75,00,000", "1,00,00,000", "2,00,00,000", "4,00,00,000", "8,00,00,000", "16,00,00,000"];
  const feeValues = [250000, 500000, 750000, 1000000, 2500000, 5000000, 7500000, 10000000, 20000000, 40000000, 80000000, 160000000];
  
  // Find the appropriate fee range
  let selectedFeeRange = feeRanges[0];
  for (let i = feeRanges.length - 1; i >= 0; i--) {
    if (annualTurnover <= feeValues[i]) {
      selectedFeeRange = feeRanges[i];
    } else {
      break;
    }
  }
  
  if (annualTurnover > feeValues[feeValues.length - 1]) {
    selectedFeeRange = feeRanges[feeRanges.length - 1];
  }
  
  // Extract deductible amount from string (e.g., "AED 10,000" -> "10,000")
  // Map deductible strings to table keys (remove "AED " prefix if present)
  let deductibleKey = deductible;
  if (deductible.startsWith("AED ")) {
    deductibleKey = deductible.replace("AED ", "");
  }
  
  // If still doesn't match, try mapping common variations
  const deductibleMap: Record<string, string> = {
    "AED 2,500": "10,000",
    "AED 5,000": "20,000",
    "AED 10,000": "10,000",
    "AED 20,000": "20,000",
    "AED 25,000": "40,000",
    "AED 30,000": "30,000",
    "AED 40,000": "40,000",
    "AED 50,000": "50,000",
    "AED 75,000": "75,000",
    "AED 100,000": "100,000",
  };
  
  if (deductibleMap[deductible]) {
    deductibleKey = deductibleMap[deductible];
  }
  // Get rebate from table
  // Table stores rebates as "per thousand" format (e.g., 1.15 means 0.00115 per thousand)
  // Divide by 1000 to convert to decimal, then make negative (since it's a discount/rebate)
  const rebate = deductiblesTable[selectedFeeRange]?.[deductibleKey] || 0;
  return -(rebate / 1000); // Convert per thousand to decimal and make negative (e.g., 1.15 -> -0.00115)
}

/**
 * Get architecture activity rebate
 */
function getArchActivityRebate(
  architectureActivitySplit: Array<{ activityType: string; last12MonthsAmount?: number; estimatedComing12MonthsAmount?: number; activityLast12MonthsTurnover?: number; activityEstimatedComing12MonthsTurnover?: number }>,
  architectsActivity: Array<{ activity: string; factorExceeding50: number; technicalKnowledge: number }>,
  annualTurnover: number
): number {
  if (!architectureActivitySplit || architectureActivitySplit.length === 0) return 0;
  
  // Find the activity with the highest percentage
  let maxPercentage = 0;
  let maxActivity = "";
  
  architectureActivitySplit.forEach(item => {
    // Support both field name formats: activityLast12MonthsTurnover (form) and last12MonthsAmount (legacy)
    const amount = item.activityLast12MonthsTurnover || item.last12MonthsAmount || 0;
    if (amount > 0 && annualTurnover > 0) {
      const percentage = (amount / annualTurnover) * 100;
      if (percentage > maxPercentage) {
        maxPercentage = percentage;
        maxActivity = item.activityType;
      }
    }
  });
  
  console.log('🔍 Arch Activity Rebate Calculation:', {
    maxActivity,
    maxPercentage,
    annualTurnover,
    architectureActivitySplit: architectureActivitySplit.map(item => ({
      activityType: item.activityType,
      amount: item.activityLast12MonthsTurnover || item.last12MonthsAmount || 0
    }))
  });
  
  if (maxPercentage <= 50) {
    console.log(`⚠️ No rebate: Activity percentage (${maxPercentage.toFixed(2)}%) does not exceed 50%`);
    return 0; // No rebate if not exceeding 50%
  }
  
  // Find matching activity in architectsActivity table
  const activity = architectsActivity.find(a => {
    const activityLower = a.activity.toLowerCase();
    const maxActivityLower = maxActivity.toLowerCase();
    return activityLower === maxActivityLower || 
           activityLower.includes(maxActivityLower) ||
           maxActivityLower.includes(activityLower.split(' ')[0]);
  });
  
  if (!activity) {
    console.warn(`❌ Activity "${maxActivity}" not found in architectsActivity table. Available activities:`, architectsActivity.map(a => a.activity));
    return 0;
  }
  
  console.log(`✅ Found activity "${activity.activity}" with rebate factor: ${activity.factorExceeding50}%`);
  
  // Return the factor as a multiplier (e.g., 50% rebate = 0.5 multiplier, meaning 50% discount)
  // But we need to return it as (1 - rebate%) for a discount, or just the factor if it's already a multiplier
  // Based on Excel: "50.00%" suggests it's a percentage, so we return it as a multiplier
  // If factorExceeding50 is 50, that means 50% rebate = 0.5 multiplier
  return activity.factorExceeding50 / 100;
}

/**
 * Get engineering activity rebate
 */
function getEngineeringActivityRebate(
  engineeringActivitySplit: Array<{ activityType: string; last12MonthsAmount?: number; estimatedComing12MonthsAmount?: number; activityLast12MonthsTurnover?: number; activityEstimatedComing12MonthsTurnover?: number }>,
  engineersActivity: Array<{ activity: string; factorExceeding50: number; technicalKnowledge: number }>,
  annualTurnover: number
): number {
  if (!engineeringActivitySplit || engineeringActivitySplit.length === 0) return 0;
  
  // Similar logic to architecture
  let maxPercentage = 0;
  let maxActivity = "";
  
  engineeringActivitySplit.forEach(item => {
    // Support both field name formats: activityLast12MonthsTurnover (form) and last12MonthsAmount (legacy)
    const amount = item.activityLast12MonthsTurnover || item.last12MonthsAmount || 0;
    if (amount > 0 && annualTurnover > 0) {
      const percentage = (amount / annualTurnover) * 100;
      if (percentage > maxPercentage) {
        maxPercentage = percentage;
        maxActivity = item.activityType;
      }
    }
  });
  
  console.log('🔍 Eng Activity Rebate Calculation:', {
    maxActivity,
    maxPercentage,
    annualTurnover,
    engineeringActivitySplit: engineeringActivitySplit.map(item => ({
      activityType: item.activityType,
      amount: item.activityLast12MonthsTurnover || item.last12MonthsAmount || 0
    }))
  });
  
  if (maxPercentage <= 50) {
    console.log(`⚠️ No rebate: Activity percentage (${maxPercentage.toFixed(2)}%) does not exceed 50%`);
    return 0;
  }
  
  const activity = engineersActivity.find(a => {
    const activityLower = a.activity.toLowerCase();
    const maxActivityLower = maxActivity.toLowerCase();
    return activityLower === maxActivityLower || 
           activityLower.includes(maxActivityLower) ||
           maxActivityLower.includes(activityLower.split(' ')[0]);
  });
  
  if (!activity) {
    console.warn(`❌ Activity "${maxActivity}" not found in engineersActivity table. Available activities:`, engineersActivity.map(a => a.activity));
    return 0;
  }
  
  console.log(`✅ Found activity "${activity.activity}" with rebate factor: ${activity.factorExceeding50}%`);
  
  return activity.factorExceeding50 / 100;
}

/**
 * Get activity knowledge loading/discount
 */
function getActivityKnowledgeFactor(
  architectureActivitySplit: Array<{ activityType: string; last12MonthsAmount?: number; activityLast12MonthsTurnover?: number }>,
  engineeringActivitySplit: Array<{ activityType: string; last12MonthsAmount?: number; activityLast12MonthsTurnover?: number }>,
  architectsActivity: Array<{ activity: string; factorExceeding50: number; technicalKnowledge: number }>,
  engineersActivity: Array<{ activity: string; factorExceeding50: number; technicalKnowledge: number }>,
  annualTurnover: number
): number {
  // Use the activity with highest percentage
  let maxPercentage = 0;
  let maxActivity = "";
  let isArchitecture = true;
  
  // Check architecture activities
  architectureActivitySplit?.forEach(item => {
    // Support both field name formats: activityLast12MonthsTurnover (form) and last12MonthsAmount (legacy)
    const amount = item.activityLast12MonthsTurnover || item.last12MonthsAmount || 0;
    if (amount > 0 && annualTurnover > 0) {
      const percentage = (amount / annualTurnover) * 100;
      if (percentage > maxPercentage) {
        maxPercentage = percentage;
        maxActivity = item.activityType;
        isArchitecture = true;
      }
    }
  });
  
  // Check engineering activities
  engineeringActivitySplit?.forEach(item => {
    // Support both field name formats: activityLast12MonthsTurnover (form) and last12MonthsAmount (legacy)
    const amount = item.activityLast12MonthsTurnover || item.last12MonthsAmount || 0;
    if (amount > 0 && annualTurnover > 0) {
      const percentage = (amount / annualTurnover) * 100;
      if (percentage > maxPercentage) {
        maxPercentage = percentage;
        maxActivity = item.activityType;
        isArchitecture = false;
      }
    }
  });
  
  if (maxPercentage === 0) return 1;
  
  // Find matching activity
  const activityTable = isArchitecture ? architectsActivity : engineersActivity;
  const activity = activityTable.find(a => 
    a.activity.toLowerCase().includes(maxActivity.toLowerCase()) ||
    maxActivity.toLowerCase().includes(a.activity.toLowerCase().split(' ')[0])
  );
  
  if (!activity) return 1;
  
  // Return technical knowledge factor as multiplier (e.g., 110% = 1.1)
  return activity.technicalKnowledge / 100;
}

/**
 * Get claims free rebate
 */
function getClaimsFreeRebate(
  hasClaims: string,
  claimsHistory: Array<any>,
  claimsFactor: Array<{ condition: string; quoteOption: string; pricing: number }>
): number {
  if (hasClaims === "Yes" && claimsHistory && claimsHistory.length > 0) {
    // Has claims - check if within last 3 years
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    
    const hasRecentClaims = claimsHistory.some((claim: any) => {
      if (!claim.dateOfLoss) return false;
      const claimDate = new Date(claim.dateOfLoss);
      return claimDate >= threeYearsAgo;
    });
    
    if (hasRecentClaims) {
      // Claims in last 3 years - no quote
      const factor = claimsFactor.find(c => c.condition.includes("Claims in Last 3 Years"));
      return factor?.quoteOption === "no-quote" ? 0 : (factor?.pricing || 0) / 100;
    }
  }
  
  // No claims or old claims - determine years claims-free
  // For now, default to 5 years claims-free (95%)
  const factor = claimsFactor.find(c => c.condition.includes("Five years"));
  return factor ? factor.pricing / 100 : 0.95;
}

/**
 * Get aggregate limit factor
 */
function getAggregateLimitFactor(
  aggregateLimit: string,
  aggregateLimitOptions: Array<{ option: string; quoteOption: string; pricing: number }>
): number {
  const option = aggregateLimitOptions.find(o => o.option === aggregateLimit);
  if (!option || option.quoteOption === "no-quote") return 1;
  return option.pricing / 100; // Convert percentage to multiplier
}

/**
 * Get CEWS factors from pricing config or defaults
 */
function getCEWSFactors(
  extensionsRequired?: string[] | Record<string, any>,
  extensionsPricing?: Record<string, number>
): { product: number; breakdown: Record<string, number> } {
  // Default CEWS factors based on image
  const defaultFactors: Record<string, number> = {
    "Loss of documents": 1.075,
    "Libel and slander": 1.05,
    "Dishonesty of employees": 1.075,
    "Standard TPL": 1.1,
    "Exclusion of design liability": 1,  // Factor of 1 when selected (no change)
    "Exclusion of supervision liability": 1,   // Factor of 1 when selected (no change)
  };
  
  // Use pricing config if available, otherwise use defaults
  const factors = extensionsPricing || defaultFactors;
  const breakdown: Record<string, number> = {};
  let product = 1;
  
  // Helper function to find matching key (case-insensitive, handles whitespace and old names)
  const findMatchingKey = (searchKey: string, source: Record<string, number>): string | null => {
    const normalizedSearch = searchKey.trim().toLowerCase();
    
    // First try exact match
    if (source[searchKey] !== undefined) {
      return searchKey;
    }
    
    // Map old names to new names for backward compatibility
    const nameMapping: Record<string, string> = {
      "exclusion of design liability (= supervision only)": "Exclusion of design liability",
      "exclusion of supervision liability (= design only)": "Exclusion of supervision liability",
    };
    
    // Check if it's an old name that needs mapping
    const mappedName = nameMapping[normalizedSearch];
    if (mappedName && source[mappedName] !== undefined) {
      return mappedName;
    }
    
    // Then try case-insensitive match
    for (const key of Object.keys(source)) {
      if (key.trim().toLowerCase() === normalizedSearch) {
        return key;
      }
    }
    return null;
  };
  
  // If extensions are specified as array, only apply those
  if (Array.isArray(extensionsRequired)) {
    extensionsRequired.forEach(ext => {
      // Try to find matching key in pricing config first
      const matchingKey = findMatchingKey(ext, factors);
      let factor = 1;
      
      if (matchingKey) {
        // Found in pricing config, use that value
        factor = factors[matchingKey];
        console.log(`✅ Found extension "${ext}" in pricing config as "${matchingKey}" with factor: ${factor}`);
      } else {
        // Try default factors
        const defaultKey = findMatchingKey(ext, defaultFactors);
        if (defaultKey) {
          factor = defaultFactors[defaultKey];
          console.log(`⚠️ Extension "${ext}" not in pricing config, using default factor: ${factor}`);
        } else {
          console.warn(`❌ Extension "${ext}" not found in pricing config or defaults, using factor: 1`);
        }
      }
      
      breakdown[ext] = factor;
      product *= factor;
    });
  } else if (extensionsRequired && typeof extensionsRequired === 'object') {
    // If extensions are specified as object, check each one
    Object.entries(factors).forEach(([key, value]) => {
      if (extensionsRequired[key] !== false) {
        breakdown[key] = value;
        product *= value;
      }
    });
  } else {
    // Use all default factors
    Object.entries(factors).forEach(([key, value]) => {
      breakdown[key] = value;
      product *= value;
    });
  }
  
  return { product, breakdown };
}

/**
 * Calculate PI Arch Premium
 * Formula: Annual Turnover × (Rate + Deductible Rebate) × Arch Activity Rebate × 
 *          (Activity Knowledge Discount × Claims Free Rebate × Activity Knowledge Loading × Aggregate Limit) ×
 *          CEWS Factors
 */
export function calculatePIArchPremium(
  formData: ProposalFormData,
  pricingConfig: PricingConfig
): { 
  premium: number; 
  ratePerMil: number; 
  breakdown: Record<string, any>;
  validation: {
    filled: Array<{ field: string; value: any; status: 'filled' | 'missing' | 'invalid' }>;
    missing: string[];
    formula: string;
    steps: Array<{ step: string; value: number; description: string }>;
  };
} {
  const validation = {
    filled: [] as Array<{ field: string; value: any; status: 'filled' | 'missing' | 'invalid' }>,
    missing: [] as string[],
    formula: '',
    steps: [] as Array<{ step: string; value: number; description: string }>,
  };
  
  // Validate required fields
  // Field mapping: "Last 12 Months Turnover" (proposal form) = annualTurnover (calculation)
  const annualTurnover = formData.last12MonthsTurnover || formData.estimatedComing12MonthsTurnover || 0;
  if (annualTurnover === 0) {
    validation.missing.push('Last 12 Months Turnover or Estimated Coming 12 Months Turnover');
    validation.filled.push({ field: 'Last 12 Months Turnover (Annual Turnover)', value: 0, status: 'missing' });
  } else {
    validation.filled.push({ field: 'Last 12 Months Turnover (Annual Turnover)', value: annualTurnover.toLocaleString(), status: 'filled' });
  }
  
  // Field mapping: "Limit of Indemnity (Any One Claim)*" (proposal form) = limitOfIndemnity (calculation)
  const limitOfIndemnity = formData.limitOfIndemnity;
  if (!limitOfIndemnity) {
    validation.missing.push('Limit of Indemnity');
    validation.filled.push({ field: 'Limit of Indemnity', value: null, status: 'missing' });
  } else {
    validation.filled.push({ field: 'Limit of Indemnity', value: limitOfIndemnity, status: 'filled' });
  }
  
  const deductible = Array.isArray(formData.deductible) ? formData.deductible[0] : formData.deductible;
  if (!deductible) {
    validation.missing.push('Deductible');
    validation.filled.push({ field: 'Deductible', value: null, status: 'missing' });
  } else {
    validation.filled.push({ field: 'Deductible', value: deductible, status: 'filled' });
  }
  
  const aggregateLimit = formData.aggregateLimit;
  if (!aggregateLimit) {
    validation.missing.push('Aggregate Limit');
    validation.filled.push({ field: 'Aggregate Limit', value: null, status: 'missing' });
  } else {
    validation.filled.push({ field: 'Aggregate Limit', value: aggregateLimit, status: 'filled' });
  }
  
  if (annualTurnover === 0 || !limitOfIndemnity || !deductible || !aggregateLimit) {
    return { 
      premium: 0, 
      ratePerMil: 0, 
      breakdown: {},
      validation 
    };
  }
  
  // Get base rate from Limit of Indemnity table
  const baseRate = getLimitOfIndemnityRate(annualTurnover, limitOfIndemnity, pricingConfig.limitOfIndemnityTable);
  validation.steps.push({ 
    step: 'Base Rate (from Limit of Indemnity table)', 
    value: baseRate, 
    description: `Rate for ${limitOfIndemnity} at turnover ${annualTurnover.toLocaleString()}` 
  });
  
  // Get deductible rebate
  const deductibleRebate = getDeductibleRebate(annualTurnover, deductible, pricingConfig.deductiblesTable);
  validation.steps.push({ 
    step: 'Deductible Rebate', 
    value: deductibleRebate, 
    description: `Rebate for ${deductible}` 
  });
  
  // Get architecture activity rebate
  const archActivityRebate = getArchActivityRebate(
    formData.architectureActivitySplit || [],
    pricingConfig.architectsActivity,
    annualTurnover
  );
  
  // Get engineering activity rebate
  const engActivityRebate = getEngineeringActivityRebate(
    formData.engineeringActivitySplit || [],
    pricingConfig.engineersActivity,
    annualTurnover
  );
  
  // Activity rebate: use the one that's > 0, otherwise default to 1 (no rebate)
  // Note: archActivityRebate and engActivityRebate return 0 if no rebate applies, or the rebate factor (e.g., 0.5) if it does
  const activityRebate = archActivityRebate > 0 ? archActivityRebate : (engActivityRebate > 0 ? engActivityRebate : 1);
  validation.steps.push({ 
    step: 'Activity Rebate', 
    value: activityRebate, 
    description: archActivityRebate > 0 ? 'Architecture activity rebate' : (engActivityRebate > 0 ? 'Engineering activity rebate' : 'No activity rebate') 
  });
  
  // Activity knowledge factor
  const activityKnowledgeFactor = getActivityKnowledgeFactor(
    formData.architectureActivitySplit || [],
    formData.engineeringActivitySplit || [],
    pricingConfig.architectsActivity,
    pricingConfig.engineersActivity,
    annualTurnover
  );
  if (activityKnowledgeFactor !== 1) {
    validation.steps.push({ 
      step: 'Activity Knowledge Factor', 
      value: activityKnowledgeFactor, 
      description: 'Technical knowledge loading/discount' 
    });
  }
  
  // Claims free rebate
  const claimsFreeRebate = getClaimsFreeRebate(
    formData.hasClaims,
    formData.claimsHistory,
    pricingConfig.claimsFactor
  );
  validation.steps.push({ 
    step: 'Claims Free Rebate', 
    value: claimsFreeRebate, 
    description: formData.hasClaims === 'No' ? '5 years claims-free' : 'With claims' 
  });
  
  // Aggregate limit factor
  const aggregateLimitFactor = getAggregateLimitFactor(aggregateLimit, pricingConfig.aggregateLimitOptions);
  validation.steps.push({ 
    step: 'Aggregate Limit Factor', 
    value: aggregateLimitFactor, 
    description: `Factor for ${aggregateLimit}` 
  });
  
  // CEWS factors
  const cewsResult = getCEWSFactors(formData.extensionsRequired, pricingConfig.extensionsPricing);
  const cewsFactors = cewsResult.product;
  validation.steps.push({ 
    step: 'CEWS Factors Product', 
    value: cewsFactors, 
    description: `Product of all extension factors` 
  });
  
  // Calculate premium
  // Formula: Turnover × (Rate + Deductible Rebate) × Arch Rebate × 
  //          (Activity Knowledge × Claims Free × Aggregate Limit) × CEWS
  const rateAndRebate = baseRate + deductibleRebate;
  const factors = activityKnowledgeFactor * claimsFreeRebate * aggregateLimitFactor;
  
  const step1 = annualTurnover;
  const step2 = rateAndRebate;
  const step3 = activityRebate;
  const step4 = factors;
  const step5 = cewsFactors;
  
  const premium = step1 * step2 * step3 * step4 * step5;
  
  // Build formula string
  validation.formula = `Annual Turnover × (Rate + Deductible Rebate) × Activity Rebate × (Activity Knowledge × Claims Free × Aggregate Limit) × CEWS = ${step1.toLocaleString()} × ${step2.toFixed(4)} × ${step3.toFixed(2)} × ${step4.toFixed(4)} × ${step5.toFixed(4)} = ${premium.toLocaleString()}`;
  
  // Calculate rate per mil
  const ratePerMil = annualTurnover > 0 ? (premium / annualTurnover) * 1000 : 0;
  
  return {
    premium: Math.round(premium * 100) / 100,
    ratePerMil: Math.round(ratePerMil * 10000) / 10000,
    breakdown: {
      annualTurnover,
      baseRate: baseRate,
      deductibleRebate: deductibleRebate,
      rateAndRebate: rateAndRebate,
      archActivityRebate: archActivityRebate,
      engActivityRebate: engActivityRebate,
      activityRebate: activityRebate,
      activityKnowledgeFactor: activityKnowledgeFactor,
      claimsFreeRebate: claimsFreeRebate,
      aggregateLimitFactor: aggregateLimitFactor,
      factors: factors,
      cewsFactors: cewsFactors,
      cewsBreakdown: cewsResult.breakdown,
      step1,
      step2,
      step3,
      step4,
      step5,
    },
    validation,
  };
}

/**
 * Load pricing configuration from localStorage
 */
export function loadPricingConfig(): PricingConfig | null {
  try {
    const stored = localStorage.getItem('piArchPricingConfig');
    if (stored) {
      return JSON.parse(stored) as PricingConfig;
    }
  } catch (error) {
    console.error('Failed to load pricing config:', error);
  }
  return null;
}

