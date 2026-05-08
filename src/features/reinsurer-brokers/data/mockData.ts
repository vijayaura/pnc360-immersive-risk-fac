export const brokerProducts = [
  {
    id: 'property-all-risk',
    code: 'PAR',
    name: 'Property All Risk',
    category: 'Property',
    description: 'Facultative placement for large commercial property schedules and catastrophe exposed occupancies.',
  },
  {
    id: 'marine-cargo',
    code: 'MCG',
    name: 'Marine Cargo',
    category: 'Marine',
    description: 'Single voyage and annual cargo placements requiring specialist reinsurance capacity.',
  },
  {
    id: 'engineering',
    code: 'ENG',
    name: 'Engineering',
    category: 'Engineering',
    description: 'CAR, EAR, machinery breakdown, and project risks requiring facultative support.',
  },
  {
    id: 'liability',
    code: 'LIA',
    name: 'General Liability',
    category: 'Casualty',
    description: 'High limit casualty and liability placements with layered reinsurance participation.',
  },
];

export const facultativeReferrals = [
  {
    id: 'demo-pol-004',
    requestId: 'FAC-REQ-24004',
    riskId: 'RISK-24004',
    insured: 'Gulf Petrochemical Terminals',
    product: 'Property All Risk',
    status: 'Reinsurer Review',
    requestedCededSI: 52000000,
    premium: 1380000,
    reinsurer: 'Demo Reinsurer',
    submittedDate: '2026-05-06',
  },
  {
    id: 'fac-req-24018',
    requestId: 'FAC-REQ-24018',
    riskId: 'RISK-24018',
    insured: 'Harbor Logistics Group',
    product: 'Marine Cargo',
    status: 'Slip Shared',
    requestedCededSI: 47600000,
    premium: 1750000,
    reinsurer: 'Falcon Re',
    submittedDate: '2026-05-05',
  },
  {
    id: 'fac-req-24027',
    requestId: 'FAC-REQ-24027',
    riskId: 'RISK-24027',
    insured: 'Metro Infrastructure JV',
    product: 'Engineering',
    status: 'Broker Draft',
    requestedCededSI: 35000000,
    premium: 910000,
    reinsurer: 'Pending allocation',
    submittedDate: '2026-05-04',
  },
];

export const facultativePolicies = [
  {
    id: 'fac-pol-24009',
    policyId: 'POL-FAC-24009',
    riskId: 'RISK-23988',
    insured: 'Al Noor Manufacturing',
    product: 'Property All Risk',
    status: 'Bound',
    cededSI: 28000000,
    premium: 760000,
    reinsurer: 'Demo Reinsurer',
    inception: '2026-04-15',
  },
  {
    id: 'fac-pol-24011',
    policyId: 'POL-FAC-24011',
    riskId: 'RISK-23991',
    insured: 'Skyline Aviation Services',
    product: 'General Liability',
    status: 'Active',
    cededSI: 18000000,
    premium: 420000,
    reinsurer: 'Global Re',
    inception: '2026-04-22',
  },
];

export const getBrokerProduct = (productId?: string) =>
  brokerProducts.find((product) => product.id === productId) ?? brokerProducts[0];
