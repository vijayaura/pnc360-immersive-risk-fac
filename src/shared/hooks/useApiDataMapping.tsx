import { useEffect, useRef } from 'react';

/**
 * Custom hook to safely map API data to form fields without causing infinite re-renders
 * 
 * @param apiData - The data received from API
 * @param mapFunction - Function that maps API data to form fields
 * @param dependencies - Additional dependencies (excluding form state)
 * 
 * Usage:
 * useApiDataMapping(policyLimitsData, (data) => {
 *   updateLimits('maximumCover', data.policy_limits.maximum_cover.value);
 * }, [updateLimits]);
 */
export const useApiDataMapping = <T,>(
  apiData: T | null,
  mapFunction: (data: T) => void,
  dependencies: any[] = []
) => {
  const hasBeenMapped = useRef(false);

  useEffect(() => {
    if (apiData && !hasBeenMapped.current) {
      try {
        mapFunction(apiData);
        hasBeenMapped.current = true;
        console.log('✅ API data mapped successfully (one-time)');
      } catch (error) {
        console.error('❌ Error mapping API data:', error);
      }
    }
  }, [apiData, ...dependencies]); // Note: No form state in dependencies

  // Reset mapping flag when API data changes (new data received)
  useEffect(() => {
    if (apiData) {
      hasBeenMapped.current = false;
    }
  }, [apiData]);

  return hasBeenMapped.current;
};

/**
 * Alternative hook for conditional mapping based on form state
 * 
 * @param apiData - The data received from API
 * @param shouldMap - Function that determines if mapping should occur
 * @param mapFunction - Function that maps API data to form fields
 * @param dependencies - Additional dependencies
 */
export const useConditionalApiMapping = <T,>(
  apiData: T | null,
  shouldMap: (data: T) => boolean,
  mapFunction: (data: T) => void,
  dependencies: any[] = []
) => {
  useEffect(() => {
    if (apiData && shouldMap(apiData)) {
      try {
        mapFunction(apiData);
        console.log('✅ Conditional API data mapping completed');
      } catch (error) {
        console.error('❌ Error in conditional mapping:', error);
      }
    }
  }, [apiData, ...dependencies]); // Controlled dependencies only
};
