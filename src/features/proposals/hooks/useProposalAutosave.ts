import { useEffect } from "react";

interface Params {
  enabled: boolean;
  formData: Record<string, any>;
  pages: any[];
  currentPageIndex: number;
  productCode?: string;
  productName?: string;
  savedProposalId?: string;
  distributorId?: string;
  distributorName?: string;
  calculatedPremium?: any;
}

export function useProposalAutosave({
  enabled,
  formData,
  pages,
  currentPageIndex,
  productCode,
  productName,
  savedProposalId,
  distributorId,
  distributorName,
  calculatedPremium,
}: Params) {
  useEffect(() => {
    if (!enabled || !productCode || !productName) return;

    const timeout = setTimeout(async () => {
      try {
        const { saveProposal } = await import("@/__mocks__/api/mockProposals");
        const { getAuthUser, getBrokerCompany, getInsurerCompany } =
          await import("@/lib/auth");
        const { isDemoMode } = await import("@/lib/demo-mode");

        if (!isDemoMode()) return;

        const user = getAuthUser();
        const broker = getBrokerCompany();
        const insurer = getInsurerCompany();

        const createdBy =
          broker?.name || insurer?.name || (user as any)?.name || "User";

        const completedPages: number[] = [];
        pages.forEach((page, index) => {
          const hasRequired = page.sections?.some((s) =>
            s.fields?.some((f) => f.required && formData[f.name])
          );
          if (hasRequired) completedPages.push(index);
        });

        await saveProposal({
          id: savedProposalId,
          productCode,
          productName,
          formData,
          progress: {
            currentPageIndex,
            totalPages: pages.length,
            completedPages,
            lastSaved: new Date().toISOString(),
          },
          metadata: {
            createdBy,
            distributorId,
            distributorName,
            premium: calculatedPremium?.premium,
            ratePerMil: calculatedPremium?.ratePerMil,
          },
          status: "draft",
        });
      } catch (e) {
        console.error("Autosave failed", e);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [
    enabled,
    formData,
    pages,
    currentPageIndex,
    productCode,
    productName,
    savedProposalId,
    distributorId,
    distributorName,
    calculatedPremium,
  ]);
}
