// Shared application types

export type PlanStatus = 'draft' | 'active' | 'inactive';
export type PlanType = 'basic' | 'standard' | 'premium' | 'specialized';

export interface PlanBase {
  planName: string;
  planType: PlanType;
  description?: string;

  projectValueMin?: number;
  projectValueMax?: number;
  constructionPeriodMax?: number; // months
  maintenancePeriodMax?: number; // months

  projectTypes: string[];
  constructionTypes: string[];
  siteLocationTypes: string[];
  coverageTypes: string[];
  riskAreas: string[];

  blastingAllowed: boolean;
  previousLossHistoryRequired: boolean;
  contractorExperienceMin?: number; // number of projects

  sumInsuredComponents: string[];
  safetyArrangements: string[];

  premiumRate?: number; // percentage
  status: PlanStatus;
}

export interface Plan extends PlanBase {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type PlanInput = PlanBase;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}


