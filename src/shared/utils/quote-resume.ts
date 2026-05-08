import { ProposalBundleResponse } from '@/features/quotes/api/quotes';

// Utility function to normalize strings for comparison
const normalizeString = (str: string | null | undefined): string => {
  if (!str) return '';
  return str.toString().toLowerCase().trim().replace(/[^a-z0-9]/g, '');
};

// Helper functions for different dropdown value formats (matching existing ProposalForm logic)

// For master data dropdowns (projectType, constructionType) - returns ID
const findMasterDataOption = (value: string | null | undefined, options: any[]): string => {
  if (!value || !options || options.length === 0) return '';
  
  const normalizedValue = normalizeString(value);
  
  // Try exact match first
  let match = options.find(option => 
    normalizeString(option.label) === normalizedValue
  );
  
  // If no exact match, try matching the value itself (in case it's stored as lowercase)
  if (!match) {
    match = options.find(option => 
      normalizeString(option.label) === normalizedValue ||
      normalizeString(option.value || option.name) === normalizedValue
    );
  }
  
  return match ? match.id.toString() : '';
};

// For role dropdowns - returns label.toLowerCase().replace(/\s+/g, '_')
const findRoleOption = (value: string | null | undefined, options: any[]): string => {
  if (!value || !options || options.length === 0) return '';
  
  const normalizedValue = normalizeString(value);
  const match = options.find(option => 
    normalizeString(option.label) === normalizedValue
  );
  
  return match ? match.label.toLowerCase().replace(/\s+/g, '_') : '';
};

// For contract type dropdowns - returns label.toLowerCase().replace(/\s+/g, '-')
const findContractOption = (value: string | null | undefined, options: any[]): string => {
  if (!value || !options || options.length === 0) return '';
  
  const normalizedValue = normalizeString(value);
  const match = options.find(option => 
    normalizeString(option.label) === normalizedValue
  );
  
  return match ? match.label.toLowerCase().replace(/\s+/g, '-') : '';
};

// For geographic dropdowns (country, region, zone) - returns value
const findGeographicOption = (value: string | null | undefined, options: any[]): string => {
  if (!value || !options || options.length === 0) {
    console.log(`🌍 Geographic matching failed - Value: ${value}, Options: ${options?.length || 0}`);
    return '';
  }
  
  console.log(`🌍 Finding geographic match for "${value}" in ${options.length} options`);
  console.log(`🌍 Available options (first 5):`, options.slice(0, 5).map(opt => ({
    label: opt.label || opt.name || opt,
    value: opt.value || opt,
    original: opt
  })));
  
  const normalizedValue = normalizeString(value);
  console.log(`🔍 Normalized search value: "${normalizedValue}"`);
  
  // Try exact match first
  let match = options.find(option => {
    const optionLabel = option.label || option.name || option;
    const optionValue = option.value || option;
    const labelMatch = normalizeString(optionLabel) === normalizedValue;
    const valueMatch = normalizeString(optionValue) === normalizedValue;
    
    console.log(`🔍 Checking option: label="${optionLabel}", value="${optionValue}"`);
    console.log(`    Normalized: label="${normalizeString(optionLabel)}", value="${normalizeString(optionValue)}"`);
    console.log(`    Matches: label=${labelMatch}, value=${valueMatch}`);
    
    if (labelMatch || valueMatch) {
      console.log(`✅ Geographic exact match found: "${optionLabel}" or "${optionValue}" for "${value}"`);
    }
    
    return labelMatch || valueMatch;
  });
  
  // For countries like "UNITED-ARAB-EMIRATES", try matching with spaces
  if (!match && value) {
    console.log(`🔄 Trying space replacement for "${value}"`);
    const valueWithSpaces = value.replace(/-/g, ' ');
    const normalizedWithSpaces = normalizeString(valueWithSpaces);
    console.log(`🔍 Space-replaced value: "${valueWithSpaces}" -> normalized: "${normalizedWithSpaces}"`);
    
    match = options.find(option => {
      const optionLabel = option.label || option.name || option;
      const spaceMatch = normalizeString(optionLabel) === normalizedWithSpaces;
      
      if (spaceMatch) {
        console.log(`✅ Geographic space match found: "${optionLabel}" for "${value}" (with spaces: "${valueWithSpaces}")`);
      }
      
      return spaceMatch;
    });
  }
  
  // Try partial matching for better coverage
  if (!match && value) {
    console.log(`🔄 Trying partial matching for "${value}"`);
    match = options.find(option => {
      const optionLabel = option.label || option.name || option;
      const optionValue = option.value || option;
      const partialLabelMatch = normalizeString(optionLabel).includes(normalizedValue) || normalizedValue.includes(normalizeString(optionLabel));
      const partialValueMatch = normalizeString(optionValue).includes(normalizedValue) || normalizedValue.includes(normalizeString(optionValue));
      
      if (partialLabelMatch || partialValueMatch) {
        console.log(`✅ Geographic partial match found: "${optionLabel}" or "${optionValue}" for "${value}"`);
      }
      
      return partialLabelMatch || partialValueMatch;
    });
  }
  
  const result = match ? (match.value || match.label || match.name || match) : '';
  console.log(`🎯 Geographic result for "${value}": "${result}"`);
  return result;
};

// For soil type dropdown - returns label.toLowerCase()
const findSoilTypeOption = (value: string | null | undefined, options: any[]): string => {
  if (!value || !options || options.length === 0) return '';
  
  const normalizedValue = normalizeString(value);
  const match = options.find(option => 
    normalizeString(option.label) === normalizedValue
  );
  
  // Return the exact format expected by the form
  return match ? match.label.toLowerCase() : value?.toLowerCase() || '';
};

// For area type dropdown - returns label.toLowerCase().replace(/\s+/g, '-')
const findAreaTypeOption = (value: string | null | undefined, options: any[]): string => {
  if (!value || !options || options.length === 0) return '';
  
  console.log(`🏙️ Finding area type match for "${value}" in ${options.length} options`);
  console.log(`🏙️ Available area type options:`, options.slice(0, 5));
  
  const normalizedValue = normalizeString(value);
  
  const match = options.find(option => {
    const optionLabel = option.label || option.name || option;
    const optionValue = option.value || option;
    const labelMatch = normalizeString(optionLabel) === normalizedValue;
    const valueMatch = normalizeString(optionValue) === normalizedValue;
    
    if (labelMatch || valueMatch) {
      console.log(`✅ Area type match found: "${optionLabel}" or "${optionValue}" for "${value}"`);
    }
    
    return labelMatch || valueMatch;
  });
  
  const result = match ? match.label.toLowerCase().replace(/\s+/g, '-') : '';
  console.log(`🎯 Area type result for "${value}": "${result}"`);
  return result;
};

// Enhanced mapping function with metadata for proper dropdown matching
export const mapProposalBundleToFormDataWithMetadata = (
  proposalBundle: ProposalBundleResponse, 
  metadata: {
    projectTypes: any[];
    constructionTypes: any[];
    roleTypes: any[];
  contractTypes: any[];
  soilTypes: any[];
  areaTypes: any[];
  countries: any[];
  regions: any[];
  zones: any[];
  }
) => {
  const project = proposalBundle.project;
  const insured = proposalBundle.insured?.details;
  const contractStructure = proposalBundle.contract_structure?.details;
  const siteRisks = proposalBundle.site_risks;
  const coverRequirements = proposalBundle.cover_requirements;

  return {
    // Project Details Tab - with proper dropdown value formats
    projectName: project?.project_name || "",
    projectType: findMasterDataOption(project?.project_type, metadata.projectTypes),
    subProjectType: project?.sub_project_type || "",
    constructionType: findMasterDataOption(project?.construction_type, metadata.constructionTypes),
    country: findGeographicOption(project?.country, metadata.countries),
    region: findGeographicOption(project?.region, metadata.regions),
    zone: findGeographicOption(project?.zone, metadata.zones),
    projectAddress: project?.address || "",
    coordinates: project?.coordinates || "",
    startDate: project?.start_date || "",
    completionDate: project?.completion_date || "",
    constructionPeriod: project?.construction_period_months?.toString() || "",
    maintenancePeriod: project?.maintenance_period_months?.toString() || "",
    
    // Insured Details Tab - with proper dropdown value formats
    insuredName: insured?.insured_name || "",
    roleOfInsured: findRoleOption(insured?.role_of_insured, metadata.roleTypes),
    contactEmail: insured?.contact_email || "",
    phoneNumber: insured?.phone_number || "",
    vatNumber: insured?.vat_number || "",
    countryOfIncorporation: findGeographicOption(insured?.country_of_incorporation, metadata.countries),
    
    // Contract Structure Tab - with proper dropdown value formats
    mainContractor: contractStructure?.main_contractor || "",
    principalOwner: contractStructure?.principal_owner || "",
    contractType: findContractOption(contractStructure?.contract_type, metadata.contractTypes),
    contractNumber: contractStructure?.contract_number || "",
    experienceYears: contractStructure?.experience_years?.toString() || "",
    
    // Site Risk Assessment Tab - with proper dropdown value formats
    nearWaterBody: siteRisks?.near_water_body === 1 ? "yes" : "no",
    floodProneZone: siteRisks?.flood_prone_zone === 1 ? "yes" : "no", 
    withinCityCenter: siteRisks?.within_city_center === "yes" || siteRisks?.within_city_center === 1 ? "yes" : "no",
    cityAreaType: findAreaTypeOption(siteRisks?.area_type || siteRisks?.city_area_type, metadata.areaTypes),
    soilType: findSoilTypeOption(siteRisks?.soil_type, metadata.soilTypes),
    existingStructure: siteRisks?.existing_structure === 1 ? "yes" : "no",
    blastingExcavation: (siteRisks?.blasting_or_deep_excavation === 1 || siteRisks?.blasting_excavation === 1) ? "yes" : "no",
    siteSecurityArrangements: siteRisks?.site_security_arrangements || "",
    
    // Cover Requirements Tab
    sumInsuredMaterial: coverRequirements?.contract_works?.toString() || "",
    sumInsuredPlant: coverRequirements?.plant_and_equipment?.toString() || "",
    sumInsuredTemporary: coverRequirements?.temporary_works?.toString() || "0",
    principalsProperty: coverRequirements?.principals_property?.toString() || "",
    thirdPartyLimit: coverRequirements?.tpl_limit?.toString() || "",
    removalDebrisLimit: coverRequirements?.removal_debris_limit?.toString() || "",
    
    // Additional required fields
    projectValue: project?.sum_insured || "",
    lossesInLastFiveYears: proposalBundle.insured?.details?.had_losses_last_5yrs ? "yes" : "no",
    lossesDetails: "",
    otherMaterials: coverRequirements?.other_materials?.toString() || "",
    waterBodyDistance: "",
    
    // Contract Structure Arrays
    consultants: proposalBundle.contract_structure?.consultants?.map(consultant => ({
      name: consultant.name || "",
      role: consultant.role || "",
      licenseNumber: consultant.license_number || ""
    })) || [],
    
    subContractors: proposalBundle.contract_structure?.sub_contractors?.map(subContract => ({
      name: subContract.name || "",
      contractType: subContract.contract_type || "",
      contractNumber: subContract.contract_number || ""
    })) || [],
    
    documents: {
      boq: { uploaded: false, url: "", fileName: "", label: "Bill of Quantities (BOQ)" },
      gantt_chart: { uploaded: false, url: "", fileName: "", label: "Gantt Chart / Work Schedule" },
      contract_agreement: { uploaded: false, url: "", fileName: "", label: "Contract Agreement" },
      site_layout_plan: { uploaded: false, url: "", fileName: "", label: "Site Layout Plan" },
      other_supporting_docs: { uploaded: false, url: "", fileName: "", label: "Other Supporting Documents" }
    },
    
    // Claims History
    claimsHistory: proposalBundle.insured?.claims?.map(claim => ({
      year: claim.year || new Date().getFullYear(),
      claimCount: claim.claim_count || 0,
      amount: claim.amount?.toString() || "",
      description: claim.description || ""
    })) || [],
    
    // Additional Cover Requirements fields
    existingStructureDetails: "",
    tplLimit: coverRequirements?.tpl_limit?.toString() || "",
    principalExistingProperty: coverRequirements?.principals_property?.toString() || "",
    surroundingPropertyLimit: "",
    
    // Extensions and CEW data
    extensions: {},
    selectedCEWItems: []
  };
};

// Legacy mapping function for backward compatibility
export const mapProposalBundleToFormData = (proposalBundle: ProposalBundleResponse) => {
  const project = proposalBundle.project;
  const insured = proposalBundle.insured?.details;
  const contractStructure = proposalBundle.contract_structure?.details;
  const siteRisks = proposalBundle.site_risks;
  const coverRequirements = proposalBundle.cover_requirements;

  return {
    // Project Details Tab
    projectName: project?.project_name || "",
    projectType: project?.project_type || "",
    subProjectType: project?.sub_project_type || "",
    constructionType: project?.construction_type || "",
    country: project?.country || "uae",
    region: project?.region || "",
    zone: project?.zone || "",
    projectAddress: project?.address || "",
    coordinates: project?.coordinates || "",
    projectValue: project?.project_value?.toString() || "0",
    startDate: project?.start_date ? new Date(project.start_date).toISOString().split('T')[0] : "",
    completionDate: project?.completion_date ? new Date(project.completion_date).toISOString().split('T')[0] : "",
    constructionPeriod: project?.construction_period_months?.toString() || "",
    maintenancePeriod: project?.maintenance_period_months?.toString() || "12",
    
    // Insured Details Tab
    insuredName: insured?.insured_name || "",
    roleOfInsured: insured?.role_of_insured || "contractor",
    
    // Contract Structure Tab
    mainContractor: contractStructure?.main_contractor || "",
    principalOwner: contractStructure?.principal_owner || "",
    contractType: contractStructure?.contract_type || "",
    contractNumber: contractStructure?.contract_number || "",
    experienceYears: contractStructure?.experience_years?.toString() || "",
    
    // Sub Contractors & Consultants
    subContractors: proposalBundle.contract_structure?.sub_contractors?.map(sub => ({
      name: sub.name || "",
      contractType: sub.contract_type || "",
      contractNumber: sub.contract_number || ""
    })) || [],
    
    consultants: proposalBundle.contract_structure?.consultants?.map(consultant => ({
      name: consultant.name || "",
      role: consultant.role || "",
      licenseNumber: consultant.license_number || ""
    })) || [],
    
    // Site Risk Assessment Tab
    nearWaterBody: siteRisks?.near_water_body ? "yes" : "no",
    waterBodyDistance: siteRisks?.water_body_distance?.toString() || "",
    floodProneZone: siteRisks?.flood_prone_zone ? "yes" : "no", 
    withinCityCenter: siteRisks?.within_city_center ? "yes" : "no",
    cityAreaType: siteRisks?.city_area_type || "",
    soilType: siteRisks?.soil_type || "",
    existingStructure: siteRisks?.existing_structure ? "yes" : "no",
    existingStructureDetails: siteRisks?.existing_structure_details || "",
    blastingExcavation: siteRisks?.blasting_excavation ? "yes" : "no",
    siteSecurityArrangements: siteRisks?.site_security_arrangements || "",
    
    // Cover Requirements Tab
    sumInsuredMaterial: coverRequirements?.contract_works?.toString() || "",
    sumInsuredPlant: coverRequirements?.plant_and_equipment?.toString() || "",
    sumInsuredTemporary: coverRequirements?.temporary_works?.toString() || "0",
    principalExistingProperty: coverRequirements?.principals_property?.toString() || "",
    tplLimit: coverRequirements?.tpl_limit?.toString() || "",
    removalDebrisLimit: coverRequirements?.removal_debris_limit?.toString() || "",
    surroundingPropertyLimit: coverRequirements?.surrounding_property_limit?.toString() || "",
    
    // Additional required fields
    thirdPartyLimit: coverRequirements?.tpl_limit?.toString() || "",
    lossesInLastFiveYears: proposalBundle.insured?.details?.had_losses_last_5yrs ? "yes" : "no",
    lossesDetails: "",
    otherMaterials: coverRequirements?.other_materials?.toString() || "",
    documents: {
      boq: { uploaded: false, url: "", fileName: "", label: "Bill of Quantities (BOQ)" },
      gantt_chart: { uploaded: false, url: "", fileName: "", label: "Gantt Chart / Work Schedule" },
      contract_agreement: { uploaded: false, url: "", fileName: "", label: "Contract Agreement" },
      site_layout_plan: { uploaded: false, url: "", fileName: "", label: "Site Layout Plan" },
      other_supporting_docs: { uploaded: false, url: "", fileName: "", label: "Other Supporting Documents" }
    },
    
    // Claims History
    claimsHistory: proposalBundle.insured?.claims?.map(claim => ({
      year: claim.year || new Date().getFullYear(),
      claimCount: claim.claim_count || 0,
      amount: claim.amount?.toString() || "",
      description: claim.description || ""
    })) || []
  };
};

// Determine the appropriate step based on data completeness
export const determineCurrentStep = (proposalBundle: ProposalBundleResponse): number => {
  // Step 0: Project Details
  if (!proposalBundle.project?.project_name || !proposalBundle.project?.project_type) {
    return 0;
  }
  
  // Step 1: Contract Structure  
  if (!proposalBundle.contract_structure?.details?.main_contractor) {
    return 1;
  }
  
  // Step 2: Cover Requirements
  if (!proposalBundle.cover_requirements?.contract_works) {
    return 2;
  }
  
  // Step 3: Insured Details
  if (!proposalBundle.insured?.details?.insured_name) {
    return 3;
  }
  
  // Step 4: Site Risk Assessment
  if (!proposalBundle.site_risks) {
    return 4;
  }
  
  // Step 5: Underwriting Documents
  if (!proposalBundle.required_documents || proposalBundle.required_documents.length === 0) {
    return 5;
  }
  
  // Step 6: Quotes Comparison (if no plans selected)
  if (!proposalBundle.plans || proposalBundle.plans.length === 0) {
    return 6;
  }
  
  // Step 7: Declaration (final step)
  return 7;
};

// Map quote status to step completion
export const getStepCompletionStatus = (proposalBundle: ProposalBundleResponse) => {
  return {
    project_details: !!proposalBundle.project?.project_name,
    contract_structure: !!proposalBundle.contract_structure?.details?.main_contractor,
    cover_requirements: !!proposalBundle.cover_requirements?.contract_works,
    insured_details: !!proposalBundle.insured?.details?.insured_name,
    site_risks: !!proposalBundle.site_risks,
    underwriting_documents: !!(proposalBundle.required_documents && proposalBundle.required_documents.length > 0),
    coverages_selected: !!(proposalBundle.plans && proposalBundle.plans.length > 0),
    plans_selected: !!(proposalBundle.plans && proposalBundle.plans.length > 0),
    policy_required_documents: !!proposalBundle.required_documents_for_policy_issue,
    policy_issued: proposalBundle.quote_meta?.status === 'policy_created'
  };
};
