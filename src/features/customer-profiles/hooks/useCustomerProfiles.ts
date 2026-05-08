import { useQuery } from '@tanstack/react-query';
import {
  type CustomerProfilesFilters,
  getCustomerProfileById,
  getCustomerProfiles,
  getCustomerProfileTransactions,
} from '../api/customerProfiles';

export function useCustomerProfiles(
  page = 1,
  limit = 5,
  search?: string | null,
  filters?: CustomerProfilesFilters,
) {
  const profilesQuery = useQuery({
    queryKey: [
      'customer-profiles',
      page,
      limit,
      search,
      filters?.minProposals ?? null,
      filters?.minQuotes ?? null,
      filters?.minPolicies ?? null,
    ],
    queryFn: () => getCustomerProfiles(page, limit, search, filters),
    staleTime: 1000 * 60 * 2,
  });

  return {
    profiles: profilesQuery.data?.items ?? [],
    meta: profilesQuery.data?.meta ?? { total: 0, page, limit, totalPages: 1 },
    profilesQuery,
  };
}

export function useCustomerProfile(customerId?: string) {
  return useQuery({
    queryKey: ['customer-profile', customerId],
    queryFn: () => getCustomerProfileById(customerId as string),
    enabled: Boolean(customerId),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });
}

export function useCustomerProfileTransactions(
  customerId?: string,
  productId?: string | null,
  tab?: string | null,
  status?: string | null,
  search?: string | null,
  page = 1,
  limit = 5,
) {
  const transactionsQuery = useQuery({
    queryKey: ['customer-profile-transactions', customerId, productId, tab, status, search, page, limit],
    queryFn: () =>
      getCustomerProfileTransactions(customerId as string, productId, tab, status, search, page, limit),
    enabled: Boolean(customerId),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  return {
    transactions: transactionsQuery.data?.items ?? [],
    meta: transactionsQuery.data?.meta ?? { total: 0, page, limit, totalPages: 1 },
    transactionsQuery,
  };
}

