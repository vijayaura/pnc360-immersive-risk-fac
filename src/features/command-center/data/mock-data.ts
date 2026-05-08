// Mock data for Command Center pages

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  type: 'warehouse' | 'office' | 'retail' | 'industrial' | 'residential';
  constructionMaterial: string;
  floors: number;
  yearBuilt: number;
  sumInsured: number;
  status: 'pending' | 'approved' | 'referred' | 'rejected';
  broker: string;
  submissionDate: string;
  riskScore: number;
  floodZone: boolean;
  nearCoast: boolean;
  nearIndustrial: boolean;
  insurerName: string;
  shareOffered: number;
  reinsuranceBroker: string;
  riskStartDate: string;
  dateApproached: string;
  lat: number;
  lng: number;
  aiInsights: AIInsight[];
  documents: Document[];
}

export interface AIInsight {
  id: string;
  text: string;
  severity: 'high' | 'medium' | 'low';
  confidence: number;
  category: 'fire' | 'flood' | 'structural' | 'environmental' | 'security';
  status: 'pending' | 'accepted' | 'dismissed';
}

export interface Document {
  id: string;
  name: string;
  type: 'proposal' | 'survey' | 'certificate' | 'photo' | 'report' | 'note';
  uploadDate: string;
  size: string;
}

export const mockProperties: Property[] = [
  {
    id: 'prop-001',
    name: 'Burj Khalifa',
    address: '1 Sheikh Mohammed bin Rashid Blvd, Downtown Dubai',
    city: 'Dubai',
    type: 'office',
    constructionMaterial: 'Reinforced Concrete & Steel',
    floors: 163,
    yearBuilt: 2010,
    sumInsured: 1500000000,
    status: 'approved',
    broker: 'Marsh McLennan UAE',
    submissionDate: '2026-04-15',
    riskScore: 38,
    floodZone: false,
    nearCoast: false,
    nearIndustrial: false,
    insurerName: 'AXA Gulf',
    shareOffered: 25,
    reinsuranceBroker: 'Guy Carpenter',
    riskStartDate: '2026-07-01',
    dateApproached: '2026-04-10',
    lat: 25.1972,
    lng: 55.2744,
    aiInsights: [
      { id: 'ai-1', text: "World's tallest building — extreme high-rise premium applies (163 floors). Evacuation time estimated 2+ hours.", severity: 'high', confidence: 98, category: 'structural', status: 'pending' },
      { id: 'ai-2', text: 'Aluminium & glass cladding — potential fire spread risk. Panels meet post-2017 UAE fire code.', severity: 'medium', confidence: 88, category: 'fire', status: 'pending' },
      { id: 'ai-3', text: 'Full advanced fire suppression with pressurized refuge floors every 25 stories.', severity: 'low', confidence: 97, category: 'fire', status: 'accepted' },
    ],
    documents: [
      { id: 'doc-1', name: 'Burj Khalifa Master Policy Proposal.pdf', type: 'proposal', uploadDate: '2026-04-15', size: '12.4 MB' },
      { id: 'doc-2', name: 'Emaar Fire Safety Certificate 2026.pdf', type: 'certificate', uploadDate: '2026-04-10', size: '3.1 MB' },
    ],
  },
  {
    id: 'prop-002',
    name: 'Emirates Towers',
    address: 'Sheikh Zayed Road, Trade Centre Area',
    city: 'Dubai',
    type: 'office',
    constructionMaterial: 'Reinforced Concrete',
    floors: 54,
    yearBuilt: 2000,
    sumInsured: 450000000,
    status: 'approved',
    broker: 'Aon Risk Solutions',
    submissionDate: '2026-04-20',
    riskScore: 32,
    floodZone: false,
    nearCoast: false,
    nearIndustrial: false,
    insurerName: 'Oman Insurance Co.',
    shareOffered: 30,
    reinsuranceBroker: 'Aon Reinsurance',
    riskStartDate: '2026-08-01',
    dateApproached: '2026-04-15',
    lat: 25.2173,
    lng: 55.2821,
    aiInsights: [
      { id: 'ai-6', text: 'Building age 26 years — MEP systems require lifecycle assessment. Plumbing rated fair.', severity: 'medium', confidence: 85, category: 'structural', status: 'pending' },
      { id: 'ai-7', text: 'Twin tower design — dual-tower fire separation meets code but shared podium creates interconnected risk.', severity: 'medium', confidence: 82, category: 'fire', status: 'pending' },
    ],
    documents: [
      { id: 'doc-4', name: 'Emirates Towers Policy Renewal.pdf', type: 'proposal', uploadDate: '2026-04-20', size: '5.2 MB' },
    ],
  },
  {
    id: 'prop-003',
    name: 'Dubai Aluminium Smelter',
    address: 'Jebel Ali Industrial Area',
    city: 'Dubai',
    type: 'industrial',
    constructionMaterial: 'Steel & Pre-engineered Metal',
    floors: 1,
    yearBuilt: 1979,
    sumInsured: 800000000,
    status: 'referred',
    broker: 'Willis Towers Watson',
    submissionDate: '2026-04-10',
    riskScore: 85,
    floodZone: false,
    nearCoast: true,
    nearIndustrial: true,
    insurerName: 'Dubai Insurance Co.',
    shareOffered: 15,
    reinsuranceBroker: 'Willis Re',
    riskStartDate: '2026-06-15',
    dateApproached: '2026-04-01',
    lat: 25.0024,
    lng: 55.0595,
    aiInsights: [
      { id: 'ai-9', text: 'Molten aluminium at 960°C — catastrophic fire/explosion risk. 2019 potline incident caused AED 120M damage.', severity: 'high', confidence: 98, category: 'fire', status: 'pending' },
      { id: 'ai-10', text: 'Facility age 47 years — oldest industrial plant in Jebel Ali. Multiple expansion phases create non-uniform structural integrity.', severity: 'high', confidence: 94, category: 'structural', status: 'pending' },
      { id: 'ai-11', text: 'No sprinkler system in smelting halls — reliance on foam suppression and blast shields.', severity: 'high', confidence: 96, category: 'fire', status: 'pending' },
    ],
    documents: [
      { id: 'doc-6', name: 'EGA DUBAL Risk Submission.pdf', type: 'proposal', uploadDate: '2026-04-10', size: '15.3 MB' },
    ],
  },
  {
    id: 'prop-004',
    name: 'The Dubai Mall',
    address: 'Financial Center Road, Downtown Dubai',
    city: 'Dubai',
    type: 'retail',
    constructionMaterial: 'Reinforced Concrete',
    floors: 4,
    yearBuilt: 2008,
    sumInsured: 2200000000,
    status: 'pending',
    broker: 'Lockton MENA',
    submissionDate: '2026-04-30',
    riskScore: 42,
    floodZone: true,
    nearCoast: false,
    nearIndustrial: false,
    insurerName: 'Orient Insurance PJSC',
    shareOffered: 20,
    reinsuranceBroker: 'Gallagher Re',
    riskStartDate: '2026-09-01',
    dateApproached: '2026-04-25',
    lat: 25.1985,
    lng: 55.2796,
    aiInsights: [
      { id: 'ai-14', text: '80,000 daily visitors — extreme liability and evacuation complexity. 2024 Dubai floods caused lower-level water ingress.', severity: 'high', confidence: 95, category: 'flood', status: 'pending' },
      { id: 'ai-15', text: 'Dubai Aquarium (10M litres) — structural failure would cause massive water damage to adjacent retail levels.', severity: 'high', confidence: 90, category: 'structural', status: 'pending' },
    ],
    documents: [
      { id: 'doc-9', name: 'Dubai Mall Master Policy Proposal.pdf', type: 'proposal', uploadDate: '2026-04-30', size: '8.9 MB' },
    ],
  },
  {
    id: 'prop-005',
    name: 'ADNOC Ruwais Refinery',
    address: 'Ruwais Industrial Complex, Al Dhafra Region',
    city: 'Abu Dhabi',
    type: 'industrial',
    constructionMaterial: 'Steel & Reinforced Concrete',
    floors: 1,
    yearBuilt: 1981,
    sumInsured: 5000000000,
    status: 'referred',
    broker: 'Marsh McLennan UAE',
    submissionDate: '2026-03-20',
    riskScore: 78,
    floodZone: false,
    nearCoast: true,
    nearIndustrial: true,
    insurerName: 'ADNIC',
    shareOffered: 10,
    reinsuranceBroker: 'Swiss Re Corporate Solutions',
    riskStartDate: '2026-05-01',
    dateApproached: '2026-03-10',
    lat: 24.1103,
    lng: 52.7306,
    aiInsights: [
      { id: 'ai-18', text: "World's largest integrated refinery — single-location PML estimated AED 8B+. Vapour cloud explosion (VCE) scenario modelled.", severity: 'high', confidence: 99, category: 'fire', status: 'pending' },
      { id: 'ai-19', text: '45-year-old facility with continuous upgrades — ADNOC invested $45B in Ruwais expansion (2025). Mixed-age infrastructure.', severity: 'high', confidence: 92, category: 'structural', status: 'pending' },
    ],
    documents: [
      { id: 'doc-11', name: 'ADNOC Ruwais Energy Package Submission.pdf', type: 'proposal', uploadDate: '2026-03-20', size: '25.0 MB' },
    ],
  },
  {
    id: 'prop-006',
    name: 'Etihad Towers',
    address: 'Corniche Road, Al Ras Al Akhdar',
    city: 'Abu Dhabi',
    type: 'residential',
    constructionMaterial: 'Reinforced Concrete',
    floors: 79,
    yearBuilt: 2011,
    sumInsured: 650000000,
    status: 'approved',
    broker: 'Gallagher MENA',
    submissionDate: '2026-04-10',
    riskScore: 30,
    floodZone: false,
    nearCoast: true,
    nearIndustrial: false,
    insurerName: 'Abu Dhabi National Insurance',
    shareOffered: 35,
    reinsuranceBroker: 'Holborn Insurance Brokers',
    riskStartDate: '2026-07-15',
    dateApproached: '2026-04-05',
    lat: 24.4620,
    lng: 54.3310,
    aiInsights: [
      { id: 'ai-23', text: '5-tower complex on Corniche — iconic Abu Dhabi landmark. Observation deck at 300m (Tower 2) adds public liability.', severity: 'medium', confidence: 88, category: 'security', status: 'pending' },
      { id: 'ai-24', text: 'Seafront location — moderate salt spray corrosion on façade. Exterior maintenance programme active.', severity: 'low', confidence: 80, category: 'environmental', status: 'pending' },
    ],
    documents: [
      { id: 'doc-14', name: 'Etihad Towers Portfolio Proposal.pdf', type: 'proposal', uploadDate: '2026-04-10', size: '6.1 MB' },
    ],
  },
  {
    id: 'prop-007',
    name: 'Viva Enterprise Distribution Centre',
    address: 'Plot No. S60323, Jebel Ali Free Zone South',
    city: 'Dubai',
    type: 'warehouse',
    constructionMaterial: 'Steel & Sandwich Panel',
    floors: 1,
    yearBuilt: 2024,
    sumInsured: 155000000,
    status: 'pending',
    broker: 'Orient Insurance PJSC',
    submissionDate: '2025-06-10',
    riskScore: 45,
    floodZone: false,
    nearCoast: false,
    nearIndustrial: true,
    insurerName: 'Orient Insurance PJSC',
    shareOffered: 100,
    reinsuranceBroker: 'Howden Re',
    riskStartDate: '2025-07-01',
    dateApproached: '2025-06-01',
    lat: 24.9313,
    lng: 55.1050,
    aiInsights: [
      { id: 'ai-25', text: 'New build (2024) — modern construction standards. Steel sandwich panel roof requires periodic inspection.', severity: 'low', confidence: 90, category: 'structural', status: 'pending' },
      { id: 'ai-26', text: 'Adjacent to industrial zone — explosion and contamination exposure from neighbouring facilities.', severity: 'medium', confidence: 85, category: 'environmental', status: 'pending' },
    ],
    documents: [
      { id: 'doc-15', name: 'Viva DC Risk Submission.pdf', type: 'proposal', uploadDate: '2025-06-10', size: '7.2 MB' },
    ],
  },
  {
    id: 'prop-008',
    name: 'Al Fattan Currency House',
    address: 'DIFC, Dubai International Financial Centre',
    city: 'Dubai',
    type: 'office',
    constructionMaterial: 'Reinforced Concrete & Glass',
    floors: 36,
    yearBuilt: 2009,
    sumInsured: 320000000,
    status: 'pending',
    broker: 'JLT Specialty',
    submissionDate: '2026-05-01',
    riskScore: 55,
    floodZone: false,
    nearCoast: false,
    nearIndustrial: false,
    insurerName: 'Orient Insurance PJSC',
    shareOffered: 40,
    reinsuranceBroker: 'JLT Re',
    riskStartDate: '2026-08-01',
    dateApproached: '2026-04-28',
    lat: 25.2131,
    lng: 55.2796,
    aiInsights: [
      { id: 'ai-27', text: 'DIFC location — premium financial district. High-value tenants increase business interruption exposure.', severity: 'medium', confidence: 88, category: 'security', status: 'pending' },
      { id: 'ai-28', text: 'Glass curtain wall façade — wind load and impact vulnerability. Meets current UAE building code.', severity: 'low', confidence: 82, category: 'structural', status: 'pending' },
    ],
    documents: [
      { id: 'doc-16', name: 'Al Fattan Currency House Proposal.pdf', type: 'proposal', uploadDate: '2026-05-01', size: '9.1 MB' },
    ],
  },
  {
    id: 'prop-009',
    name: 'Jebel Ali Power Station',
    address: 'Jebel Ali, Dubai Industrial City',
    city: 'Dubai',
    type: 'industrial',
    constructionMaterial: 'Steel & Reinforced Concrete',
    floors: 1,
    yearBuilt: 1985,
    sumInsured: 950000000,
    status: 'pending',
    broker: 'Aon Risk Solutions',
    submissionDate: '2026-05-02',
    riskScore: 76,
    floodZone: false,
    nearCoast: true,
    nearIndustrial: true,
    insurerName: 'Dubai Insurance Co.',
    shareOffered: 20,
    reinsuranceBroker: 'Aon Reinsurance',
    riskStartDate: '2026-07-01',
    dateApproached: '2026-04-30',
    lat: 24.9850,
    lng: 55.0800,
    aiInsights: [
      { id: 'ai-29', text: 'Critical power infrastructure — outage would affect 40% of Dubai industrial zone. Business interruption exposure exceeds AED 2B.', severity: 'high', confidence: 97, category: 'security', status: 'pending' },
      { id: 'ai-30', text: 'Facility age 41 years — turbine hall electrical systems require full lifecycle assessment. Electrical condition rated fair.', severity: 'high', confidence: 91, category: 'structural', status: 'pending' },
      { id: 'ai-31', text: 'Coastal proximity — salt corrosion on cooling water intake structures. Annual inspection programme in place.', severity: 'medium', confidence: 85, category: 'environmental', status: 'pending' },
    ],
    documents: [
      { id: 'doc-17', name: 'Jebel Ali Power Station Risk Submission.pdf', type: 'proposal', uploadDate: '2026-05-02', size: '18.7 MB' },
      { id: 'doc-18', name: 'DEWA Engineering Survey 2026.pdf', type: 'survey', uploadDate: '2026-04-28', size: '11.2 MB' },
    ],
  },
];

export const weatherAlerts = [
  { id: 'wa-1', type: 'Sandstorm', severity: 'severe' as const, area: 'Greater Dubai', affectedCount: 3 },
  { id: 'wa-2', type: 'Flash Flood Warning', severity: 'extreme' as const, area: 'Jebel Ali Industrial', affectedCount: 2 },
  { id: 'wa-3', type: 'High Wind Advisory', severity: 'moderate' as const, area: 'Abu Dhabi Coastal', affectedCount: 1 },
];
