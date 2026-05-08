import { useCallback, useEffect, useState } from "react";
import {
  calculatePIArchPremium,
  loadPricingConfig,
} from '@/shared/utils/piArchPricing';

interface Params {
  productCode?: string;
  formData: Record<string, any>;
}

export function usePremiumCalculation({ productCode, formData }: Params) {
  const [premiumData, setPremiumData] = useState<{
    premium: number;
    ratePerMil: number;
    breakdown?: Record<string, any>;
    validation?: any;
  } | null>(null);

  const recalculate = useCallback(() => {
    if (productCode !== "PI_Arch" && productCode !== "PI_ANNUAL") {
      setPremiumData(null);
      return;
    }

    try {
      const pricingConfig = loadPricingConfig();
      if (!pricingConfig) {
        setPremiumData(null);
        return;
      }

      const result = calculatePIArchPremium(formData, pricingConfig);

      setPremiumData({
        premium: result.premium,
        ratePerMil: result.ratePerMil,
        breakdown: result.breakdown,
        validation: result.validation,
      });
    } catch (err) {
      console.error("Premium calculation failed", err);
      setPremiumData(null);
    }
  }, [productCode, formData]);

  useEffect(() => {
    recalculate();
  }, [recalculate]);

  // Listen for pricing config updates
  useEffect(() => {
    if (productCode !== "PI_Arch" && productCode !== "PI_ANNUAL") return;

    const handleUpdate = () => recalculate();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "piArchPricingConfig") recalculate();
    };

    window.addEventListener("piArchPricingConfigUpdated", handleUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("piArchPricingConfigUpdated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, [productCode, recalculate]);

  return premiumData;
}
