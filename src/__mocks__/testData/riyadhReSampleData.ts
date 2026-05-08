/**
 * Sample Test Data for Riyadh Re Product Configuration
 * This file contains sample data for all tabs except Pricing Configurator
 */

// Sample Quote Coverage Configuration
export const sampleQuoteConfig = {
  validityDays: 30,
  backdateDays: 30,
  operatingCountries: ["Saudi Arabia", "UAE", "Kuwait", "Qatar", "Bahrain", "Oman"],
  operatingRegions: [
    { name: "Riyadh", country: "Saudi Arabia" },
    { name: "Eastern Province", country: "Saudi Arabia" },
    { name: "Dubai", country: "UAE" },
    { name: "Abu Dhabi", country: "UAE" },
    { name: "Kuwait City", country: "Kuwait" },
    { name: "Doha", country: "Qatar" },
  ],
  operatingZones: [
    { name: "Riyadh Central", region: "Riyadh", country: "Saudi Arabia" },
    { name: "Riyadh North", region: "Riyadh", country: "Saudi Arabia" },
    { name: "Dammam", region: "Eastern Province", country: "Saudi Arabia" },
    { name: "Khobar", region: "Eastern Province", country: "Saudi Arabia" },
    { name: "Dubai Marina", region: "Dubai", country: "UAE" },
    { name: "Downtown Dubai", region: "Dubai", country: "UAE" },
    { name: "Abu Dhabi Island", region: "Abu Dhabi", country: "UAE" },
  ],
};

// Sample Policy Wordings
export const samplePolicyWordings = [
  {
    id: 1,
    title: "Architects, Engineers, Surveyors, Consultants and Construction Managers Professional Liability",
    description: "Professional Liability Insurance policy wording for Architects and Engineers",
    file_name: "PI_Arch_Professional_Liability_Wording.pdf",
    file_url: "https://aurainsure-my.sharepoint.com/:b:/g/personal/vijay_aurainsure_tech/IQD7fK_NAXVuRar38BVEZJMGARvAGUPbT5WR7cTq9hpRtls?e=lSfoNP",
    version: "1.0",
    effective_date: "2024-01-01",
    status: "active",
  },
];

// Sample CEWs (Clauses, Exclusions, Warranties) Configuration
export const sampleCEWsClauses = [
  {
    id: 1,
    clause_code: "CEW-001",
    title: "Professional Indemnity Coverage",
    description: "Coverage for claims arising from professional negligence, errors, or omissions",
    clause_type: "coverage",
    is_mandatory: true,
    is_active: true,
    display_order: 1,
  },
  {
    id: 2,
    clause_code: "CEW-002",
    title: "Defense Costs Coverage",
    description: "Coverage for legal defense costs incurred in defending claims",
    clause_type: "coverage",
    is_mandatory: false,
    is_active: true,
    display_order: 2,
  },
  {
    id: 3,
    clause_code: "CEW-003",
    title: "Prior Acts Coverage",
    description: "Coverage for acts, errors, or omissions that occurred before the policy period",
    clause_type: "coverage",
    is_mandatory: false,
    is_active: true,
    display_order: 3,
  },
  {
    id: 4,
    clause_code: "CEW-004",
    title: "Exclusion - Intentional Acts",
    description: "Exclusion for claims arising from intentional, fraudulent, or criminal acts",
    clause_type: "exclusion",
    is_mandatory: true,
    is_active: true,
    display_order: 4,
  },
  {
    id: 5,
    clause_code: "CEW-005",
    title: "Exclusion - Bodily Injury/Property Damage",
    description: "Exclusion for bodily injury or property damage claims",
    clause_type: "exclusion",
    is_mandatory: true,
    is_active: true,
    display_order: 5,
  },
  {
    id: 6,
    clause_code: "CEW-006",
    title: "Warranty - Professional Qualifications",
    description: "Warranty requiring all professionals to maintain valid licenses and certifications",
    clause_type: "warranty",
    is_mandatory: false,
    is_active: true,
    display_order: 6,
  },
  {
    id: 7,
    clause_code: "CEW-007",
    title: "Warranty - Quality Control Procedures",
    description: "Warranty requiring documented quality control procedures",
    clause_type: "warranty",
    is_mandatory: false,
    is_active: true,
    display_order: 7,
  },
];

// Sample Quote Format Configuration
export const sampleQuoteFormat = {
  header: {
    companyName: "Riyadh Re",
    companyAddress: "King Fahd Road, Al Olaya District\nRiyadh 12211, Saudi Arabia",
    contactInfo: "Phone: +966 11 123 4567\nEmail: info@riyadhre.com\nWebsite: www.riyadhre.com",
    headerColor: "#1a472a", // Dark green
    headerTextColor: "#ffffff",
    logoPosition: "left",
  },
  details: {
    quotePrefix: "RR-PI-",
    dateFormat: "DD/MM/YYYY",
    validityDays: "30",
    geographicalScope: "Saudi Arabia, UAE, Kuwait, Qatar, Bahrain, Oman",
    backdateWindow: "30",
    showQuoteNumber: true,
    showIssueDate: true,
    showValidity: true,
    showGeographicalScope: true,
  },
  risk: {
    showProjectDetails: true,
    showCoverageTypes: true,
    showCoverageLimits: true,
    showDeductibles: true,
    showContractorInfo: true,
    riskSectionTitle: "Professional Services Details",
  },
  premium: {
    currency: "SAR",
    premiumSectionTitle: "Premium Breakdown",
    showBasePremium: true,
    showRiskAdjustments: true,
    showFees: true,
    showTaxes: true,
    showTotalPremium: true,
  },
  terms: {
    showWarranties: true,
    showExclusions: true,
    showDeductibleDetails: true,
    showPolicyConditions: true,
    termsSectionTitle: "Terms & Conditions",
    additionalTerms: "This insurance is subject to the terms, conditions, and exclusions of the policy wording. All claims must be reported within 7 days of occurrence. This quotation is valid for 30 days from the date of issue.",
  },
  signature: {
    showSignatureBlock: true,
    authorizedSignatory: "Ahmed Al-Rashid",
    signatoryTitle: "Senior Underwriting Manager",
    signatureText: "This quotation is issued on behalf of Riyadh Re by the undersigned authorized representative.",
  },
  footer: {
    showFooter: true,
    showDisclaimer: true,
    footerText: "Riyadh Re is licensed and regulated by the Saudi Central Bank (SAMA). This quotation does not constitute a binding offer until accepted by the insured and confirmed by Riyadh Re.",
    footerTextColor: "#666666",
  },
};

// Sample Required Documents
export const sampleRequiredDocuments = [
  {
    id: 1,
    label: "Professional Qualifications Certificate",
    description: "Valid professional license or certification for all architects/engineers",
    required: true,
    active: true,
    order: 1,
    template: null,
  },
  {
    id: 2,
    label: "Company Registration Certificate",
    description: "Valid commercial registration certificate",
    required: true,
    active: true,
    order: 2,
    template: null,
  },
  {
    id: 3,
    label: "Project Portfolio",
    description: "Portfolio of similar projects completed in the past 3 years",
    required: true,
    active: true,
    order: 3,
    template: null,
  },
  {
    id: 4,
    label: "Financial Statements",
    description: "Audited financial statements for the last 2 years",
    required: true,
    active: true,
    order: 4,
    template: null,
  },
  {
    id: 5,
    label: "Professional Indemnity Claims History",
    description: "Details of any previous professional indemnity claims",
    required: true,
    active: true,
    order: 5,
    template: null,
  },
  {
    id: 6,
    label: "Quality Management System Certificate",
    description: "ISO 9001 or equivalent quality management certification (if applicable)",
    required: false,
    active: true,
    order: 6,
    template: null,
  },
  {
    id: 7,
    label: "Project Scope Document",
    description: "Detailed scope of work for the project to be insured",
    required: true,
    active: true,
    order: 7,
    template: null,
  },
  {
    id: 8,
    label: "Subcontractor List",
    description: "List of all subcontractors and their qualifications",
    required: false,
    active: true,
    order: 8,
    template: null,
  },
];

// Helper function to get sample data based on tab name
export function getSampleDataForTab(tabName: string) {
  switch (tabName) {
    case "quote-config":
      return sampleQuoteConfig;
    case "wording":
      return samplePolicyWordings;
    case "cews":
      return sampleCEWsClauses;
    case "quote-format":
      return sampleQuoteFormat;
    case "required-documents":
      return sampleRequiredDocuments;
    default:
      return null;
  }
}

