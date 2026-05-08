import { api } from '@/lib/api/client';
import type { CustomerActivityItem, CustomerProfileSummary } from '../types';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {};
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function firstString(source: UnknownRecord, keys: string[], fallback = ''): string {
  const totals = asRecord(source.totals);
  for (const key of keys) {
    const value = source[key] ?? totals[key];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return fallback;
}

function firstOptionalString(source: UnknownRecord, keys: string[]): string | undefined {
  const value = firstString(source, keys, '');
  return value || undefined;
}

function firstNumber(source: UnknownRecord, keys: string[], fallback = 0): number {
  const totals = asRecord(source.totals || source.total || (asRecord(source.meta).totals as UnknownRecord));
  for (const key of keys) {
    const value = source[key] ?? totals[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
  }
  return fallback;
}

function firstOptionalNumber(source: UnknownRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function normalizeSearch(search: unknown): string | undefined {
  if (typeof search !== 'string') return undefined;
  const trimmed = search.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizePositiveNumberParam(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.floor(n);
}

function normalizeProduct(raw: unknown): CustomerProfileSummary['products'][number] {
  const item = asRecord(raw);
  return {
    productId: firstString(item, ['productId', 'product_id', 'id'], ''),
    productName: firstString(item, ['productName', 'product_name', 'name'], 'Unknown Product'),
    totals: {
      proposals: firstNumber(item, [
        'totalProposals',
        'proposals',
        'proposalCount',
        'proposal_count',
      ]),
      quotes: firstNumber(item, ['totalQuotes', 'quotes', 'quoteCount', 'quote_count']),
      policies: firstNumber(item, ['totalPolicies', 'policies', 'policyCount', 'policy_count']),
      referrals: firstNumber(item, [
        'totalReferrals',
        'referralsCount',
        'totalReferralCount',
        'referralCount',
        'referral_count',
        'referrals',
        'referral',
      ]),
      endorsements: firstNumber(item, [
        'totalEndorsements',
        'endorsements',
        'endorsementCount',
        'endorsement_count',
      ]),
      totalPremium: firstNumber(item, ['totalPremium', 'total_premium', 'premium']),
    },
  };
}

function normalizeActivity(raw: unknown): CustomerActivityItem {
  const item = asRecord(raw);
  const status = firstOptionalString(item, ['status', 'quoteStatus', 'quote_status', 'stage']);
  const transactionType = firstOptionalString(item, ['transactionType', 'transaction_type', 'type', 'kind']);
  const normalizedKind = ((): CustomerActivityItem['kind'] => {
    const t = String(transactionType || firstString(item, ['kind'], '')).toLowerCase();
    if (t.includes('referral')) return 'referral';
    if (t.includes('endorsement')) return 'endorsement';
    if (t.includes('policy')) return 'policy';
    if (t.includes('proposal')) return 'proposal';
    if (t.includes('quote')) return 'quote';
    return 'quote';
  })();

  return {
    id: firstString(
      item,
      [
        'proposalId',
        'quoteNumber',
        'quoteId',
        'policyId',
        'endorsementReference',
        'endorsementId',
        'referralId',
        'referral_id',
        'transactionId',
        'transaction_id',
        'formResponseId',
        'id',
      ],
      '',
    ),
    transactionId: firstOptionalString(item, ['transactionId', 'transaction_id']),
    productId: firstOptionalString(item, ['productId', 'product_id']),
    productName: firstOptionalString(item, ['productName', 'product_name']),
    status,
    stage: firstOptionalString(item, ['stage']),
    transactionType,
    createdAt: firstOptionalString(item, ['createdAt', 'created_at']),
    updatedAt: firstOptionalString(item, ['updatedAt', 'updated_at']),
    premium: firstOptionalNumber(item, ['premium', 'totalPremium', 'total_premium']),
    currency: firstOptionalString(item, ['currency', 'currencyCode', 'currency_code']),
    policyId: firstOptionalString(item, ['policyId', 'policy_id']),
    quoteNumber: firstOptionalString(item, ['quoteNumber', 'quote_number']),
    quoteId: firstOptionalString(item, ['quoteId', 'quote_id']),
    proposalId: firstOptionalString(item, ['proposalId', 'proposal_id']),
    referralId: firstOptionalString(item, ['referralId', 'referral_id']),
    reason: firstOptionalString(item, ['reason']),
    kind: normalizedKind,
  };
}

function normalizeSummary(raw: unknown): CustomerProfileSummary {
  const item = asRecord(raw);
  const displayName = firstString(
    item,
    ['customerName', 'displayName', 'customer_name', 'name'],
    'Unknown Customer',
  );
  const customerId = firstString(item, ['customerId', 'id', 'customer_id'], displayName);
  const customerKey = firstString(item, ['customerKey', 'customer_key'], customerId);
  const customerIdentifier = firstString(item, ['customerIdentifier', 'customer_identifier'], '');
  const customerRefId = firstOptionalString(item, ['customerRefId', 'customer_ref_id', 'ref_id']);
  const products = asArray(item.products).map(normalizeProduct).filter((p) => p.productId);
  const activity = asArray(item.activity).map(normalizeActivity).filter((a) => a.id);

  const normalizedTotals = {
    proposals: firstNumber(item, [
      'totalProposals',
      'proposals',
      'proposalCount',
      'proposal_count',
    ]),
    quotes: firstNumber(item, ['totalQuotes', 'quotes', 'quoteCount', 'quote_count']),
    policies: firstNumber(item, ['totalPolicies', 'policies', 'policyCount', 'policy_count']),
    referrals: firstNumber(item, [
      'totalReferrals',
      'referralsCount',
      'totalReferralCount',
      'referralCount',
      'referral_count',
      'referrals',
      'referral',
    ]),
    endorsements: firstNumber(item, ['totalEndorsements', 'endorsements', 'endorsementCount', 'endorsement_count']),
    totalPremium: firstNumber(item, ['totalPremium', 'total_premium', 'premium']),
  };

  // Heuristic: If there is only one product, it owns all the top-level totals
  if (products.length === 1) {
    const p = products[0];
    p.totals.proposals = p.totals.proposals || normalizedTotals.proposals;
    p.totals.quotes = p.totals.quotes || normalizedTotals.quotes;
    p.totals.policies = p.totals.policies || normalizedTotals.policies;
    p.totals.referrals = p.totals.referrals || normalizedTotals.referrals;
    p.totals.endorsements = p.totals.endorsements || normalizedTotals.endorsements;
    p.totals.totalPremium = p.totals.totalPremium || normalizedTotals.totalPremium;
  }

  return {
    customerId,
    key: customerKey || customerId,
    displayName,
    customerRefId,
    searchBlob: `${displayName} ${customerIdentifier} ${customerKey} ${customerId} ${customerRefId || ''}`.toLowerCase(),
    customerSince: firstOptionalString(item, [
      'customerSince',
      'customer_since',
      'createdAt',
      'created_at',
    ]),
    lastTransactionAt: firstOptionalString(item, [
      'lastTransactionAt',
      'last_transaction_at',
      'updatedAt',
      'updated_at',
    ]),
    totals: normalizedTotals,
    products,
    activity,
  };
}

function unwrapCollection(responseData: unknown): unknown[] {
  if (Array.isArray(responseData)) return responseData;
  const data = asRecord(responseData);
  if (Array.isArray(data.items)) return data.items as unknown[];
  if (Array.isArray(data.data)) return data.data as unknown[];
  return [];
}

function unwrapMeta(responseData: unknown): {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  const data = asRecord(responseData);
  const meta = asRecord(data.meta);
  return {
    total: firstNumber(meta, ['total'], 0),
    page: firstNumber(meta, ['page'], 1),
    limit: firstNumber(meta, ['limit'], 5),
    totalPages: firstNumber(meta, ['totalPages', 'total_pages'], 1),
  };
}

export interface CustomerProfilesPage {
  items: CustomerProfileSummary[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CustomerProfilesFilters {
  minProposals?: number;
  minQuotes?: number;
  minPolicies?: number;
}

export interface CustomerTransactionsPage {
  items: CustomerActivityItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getCustomerProfiles(
  page = 1,
  limit = 5,
  search?: string | null,
  filters?: CustomerProfilesFilters,
): Promise<CustomerProfilesPage> {
  const searchParam = normalizeSearch(search);
  const minProposals = normalizePositiveNumberParam(filters?.minProposals);
  const minQuotes = normalizePositiveNumberParam(filters?.minQuotes);
  const minPolicies = normalizePositiveNumberParam(filters?.minPolicies);
  const resp = await api.get('/customer-profiles', {
    params: {
      page,
      limit,
      ...(searchParam ? { search: searchParam } : {}),
      ...(minProposals ? { minProposals } : {}),
      ...(minQuotes ? { minQuotes } : {}),
      ...(minPolicies ? { minPolicies } : {}),
    },
  });
  const rows = unwrapCollection(resp?.data);
  return {
    items: rows.map(normalizeSummary),
    meta: unwrapMeta(resp?.data),
  };
}

export async function getCustomerProfileById(customerId: string): Promise<CustomerProfileSummary> {
  const resp = await api.get(`/customer-profiles/${encodeURIComponent(customerId)}`);
  return normalizeSummary(resp?.data);
}

export async function getCustomerProfileTransactions(
  customerId: string,
  productId?: string | null,
  tab?: string | null,
  status?: string | null,
  search?: string | null,
  page = 1,
  limit = 5,
): Promise<CustomerTransactionsPage> {
  const searchParam = normalizeSearch(search);
  const resp = await api.get(`/customer-profiles/${encodeURIComponent(customerId)}/transactions`, {
    params: {
      ...(productId ? { productId } : {}),
      ...(tab ? { tab } : {}),
      ...(status ? { status } : {}),
      ...(searchParam ? { search: searchParam } : {}),
      page,
      limit,
    },
  });
  const rows = unwrapCollection(resp?.data);
  return {
    items: rows.map(normalizeActivity).filter((x) => x.id),
    meta: unwrapMeta(resp?.data),
  };
}

