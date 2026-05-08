import { useEffect, useState } from 'react';
import { getInsurerPricingConfig, downloadQuotePdf } from '@/features/quotes/api/quotes';
import type { InsurerPricingConfigResponse } from '@/features/quotes/api/quotes';
import type { ProposalBundleResponse } from '@/features/quotes/api/quotes';

// NOTE: This hook expects the caller to provide a normalized bundle already (e.g., via adapter).
export function useQuoteDetailsV2(bundle: ProposalBundleResponse | null) {
  const [productBundle, setProductBundle] = useState<InsurerPricingConfigResponse | null>(null);
  const [selectedExtensions, setSelectedExtensions] = useState<unknown[]>([]);
  const [expandedWordings, setExpandedWordings] = useState<Set<string>>(new Set());
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      if (!bundle?.quote_meta?.insurer_id) return;
      try {
        setLoadingConfig(true);
        const insurerId = bundle.quote_meta.insurer_id;
        const config = await getInsurerPricingConfig(insurerId);
        setProductBundle(config);
        // TODO: process selected extensions based on config.clause_pricing_config
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load pricing config");
      } finally {
        setLoadingConfig(false);
      }
    };
    loadConfig();
  }, [bundle?.quote_meta?.insurer_id]);

  const onDownloadPdf = async () => {
    try {
      if (!bundle) {
        return;
      }
      const candidateId = bundle.project_id || bundle.quote_meta?.quote_id;
      const quoteId = String(candidateId || '');
      if (!quoteId) {
        return;
      }

      const blob = await downloadQuotePdf(quoteId, 'quote', {});
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Quote_${quoteId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      return;
    }
  };

  return {
    productBundle,
    selectedExtensions,
    expandedWordings,
    setExpandedWordings,
    loadingConfig,
    error,
    onDownloadPdf,
  };
}
