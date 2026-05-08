import { useState, useEffect, useCallback } from "react";
import { getInsurerCompanyId } from "@/lib/auth";
import {
  getInsurerBrokerAssignments,
  toggleBrokerStatus,
  type BrokerAssignment,
} from '@/features/insurers/api/insurers';
import {
  apiErrorToMessage,
  apiErrorToToast,
} from '@/shared/utils/apiErrorToMessage';
import { useToast } from '@/shared/hooks/use-toast';

interface UseDistributorsReturn {
  distributors: BrokerAssignment[];
  loading: boolean;
  error: string | null;
  toggling: boolean;
  refetch: () => Promise<void>;
  toggleStatus: (
    brokerId: string | number,
    currentStatus: boolean
  ) => Promise<boolean>;
  updateDistributor: (
    brokerId: string | number,
    updates: Partial<BrokerAssignment>
  ) => void;
}

/**
 * Custom hook for managing distributors (brokers) data
 * Handles fetching, loading states, error handling, and status toggling
 */
export function useDistributors(): UseDistributorsReturn {
  const { toast } = useToast();
  const [distributors, setDistributors] = useState<BrokerAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const fetchDistributors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const insurerId = getInsurerCompanyId();
      const list = await getInsurerBrokerAssignments(insurerId);
      setDistributors(list);
    } catch (err) {
      setError(apiErrorToMessage(err, "Failed to load distributors."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDistributors();
  }, [fetchDistributors]);

  const toggleStatus = useCallback(
    async (
      brokerId: string | number,
      currentStatus: boolean
    ): Promise<boolean> => {
      const broker = distributors.find((b) => b.id === brokerId);
      if (!broker) return false;

      const insurerId = getInsurerCompanyId();

      try {
        setToggling(true);
        const resp = await toggleBrokerStatus(
          insurerId || "",
          brokerId,
          !currentStatus
        );

        setDistributors((prev) =>
          prev.map((b) =>
            b.id === brokerId
              ? { ...b, isActive: !currentStatus, status: resp.status }
              : b
          )
        );

        toast({
          title:
            resp.status === "active"
              ? "Broker Activated"
              : "Broker Deactivated",
          description: `${broker.name} has been ${
            resp.status === "active" ? "activated" : "deactivated"
          }.`,
        });

        return true;
      } catch (err) {
        const { title, description } = apiErrorToToast(
          err,
          "Failed to update status."
        );
        toast({ title, description, variant: "destructive" });
        return false;
      } finally {
        setToggling(false);
      }
    },
    [distributors, toast]
  );

  const updateDistributor = useCallback(
    (brokerId: string | number, updates: Partial<BrokerAssignment>) => {
      setDistributors((prev) =>
        prev.map((b) => (b.id === brokerId ? { ...b, ...updates } : b))
      );
    },
    []
  );

  return {
    distributors,
    loading,
    error,
    toggling,
    refetch: fetchDistributors,
    toggleStatus,
    updateDistributor,
  };
}
