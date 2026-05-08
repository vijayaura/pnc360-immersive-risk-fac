export type SelectedRiskDetail = {
  coverId: string;
  coverTitle: string | null;
  riskCategoryId: string;
  riskCategoryTitle: string | null;
  riskLevelId: string;
  riskLevelLabel: string | null;
  riskLevelIndex: number | null;
  riskLevelCount: number | null;
  quoteAction: string | null;
  adjustmentType: string | null;
  adjustmentValue: number | null;
  unitId?: string | null;
};

