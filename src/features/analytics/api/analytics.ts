import { apiGet } from '@/lib/api/client';

export type AnalyticsQueryParams = {
  productIds?: string;
};

export interface AnalyticsOverviewResponse {
  metrics: {
    total_proposals: number;
    total_quotes: number;
    total_policies: number;
    total_premium: number;
    total_sum_insured: number;
    conversion_rate: number;
  };
  proposal_trend: Array<{
    date: string;
    value: number;
  }>;
  quote_trend: Array<{
    date: string;
    value: number;
  }>;
  conversion_trend: Array<{
    date: string;
    value: number;
  }>;
}

export interface AnalyticsQuotesSummaryResponse {
  total: number;
  today: number;
  this_week: number;
  this_month: number;
}

export interface AnalyticsConversionResponse {
  proposal_to_quote: number;
  quote_to_policy: number;
  chart: {
    categories: string[];
    series: Array<{
      key: string;
      label: string;
      data: number[];
    }>;
  };
}

export interface AnalyticsProductsResponse {
  products: Array<{
    product_id: string;
    product_name: string;
    proposals: number;
    quotes: number;
    policies: number;
    revenue: number;
    conversion_rate: number;
  }>;
  chart: {
    categories: string[];
    series: Array<{
      key: string;
      label: string;
      data: number[];
    }>;
  };
}

export async function getAnalyticsOverview(
  params?: AnalyticsQueryParams,
): Promise<AnalyticsOverviewResponse> {
  return apiGet<AnalyticsOverviewResponse>('/analytics/overview', { params });
}

export async function getAnalyticsQuotesSummary(
  params?: AnalyticsQueryParams,
): Promise<AnalyticsQuotesSummaryResponse> {
  return apiGet<AnalyticsQuotesSummaryResponse>('/analytics/quotes/summary', { params });
}

export async function getAnalyticsConversion(
  params?: AnalyticsQueryParams,
): Promise<AnalyticsConversionResponse> {
  return apiGet<AnalyticsConversionResponse>('/analytics/conversion', { params });
}

export async function getAnalyticsProducts(
  params?: AnalyticsQueryParams,
): Promise<AnalyticsProductsResponse> {
  return apiGet<AnalyticsProductsResponse>('/analytics/products', { params });
}
