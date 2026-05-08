import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/shared/hooks/use-toast';
import {
  getIntegrations,
  executeIntegration,
  markIntegrationBlocked,
  type Integration,
  type ExecuteIntegrationResponse,
} from '@/features/product-config/integrations/api/integrations';

// ── Types ──────────────────────────────────────────────────────────────────────

interface UseIntegrationExecutionOptions {
  productId: string | undefined;
  formData: Record<string, any>;
  onFieldChange: (name: string, value: any) => void;
  formResponseId?: string;
}

interface ExecutionError {
  title: string;
  message: string;
}

interface ExecutionState {
  isLoading: boolean;
  error: ExecutionError | null;
  redirectUrl: string | null;
}

interface UseIntegrationExecutionReturn {
  integrations: Integration[];
  executePageIntegrations: (pageId: string) => Promise<boolean>;
  executeFieldIntegration: (fieldId: string, fieldName?: string) => Promise<boolean>;
  getFieldIntegrations: (fieldId: string, fieldName?: string) => Integration[];
  hasPageIntegrations: (pageId: string) => boolean;
  executionState: ExecutionState;
  clearError: () => void;
  setError: (error: ExecutionError) => void;
}

// ── Pure helpers ───────────────────────────────────────────────────────────────

/** Safely access a nested value using a dot-separated path (e.g. "data.user.name") */
function getNestedValue(obj: unknown, dotPath: string): unknown {
  if (!dotPath || typeof obj !== 'object' || obj === null) return undefined;
  return dotPath.split('.').reduce<unknown>((acc, key) => {
    if (acc !== null && acc !== undefined && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/** Try to parse a string as JSON; return original string if it's not valid JSON. */
function tryParseJsonValue(value: string | number | undefined): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  // Only attempt parse for values that look like JSON structures or literals
  if (
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    trimmed === 'true' ||
    trimmed === 'false' ||
    trimmed === 'null'
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }
  return value;
}

/** Build a request payload from form data + request mappings */
function buildRequestPayload(
  requestMapping: Integration['requestMapping'],
  formData: Record<string, any>,
): { payload: Record<string, any>; missingFields: string[] } {
  const payload: Record<string, any> = {};
  const missingFields: string[] = [];

  for (const mapping of requestMapping) {
    let value: any;
    if (mapping.sourceField === '__custom__') {
      value = tryParseJsonValue(mapping.defaultValue);
    } else {
      value = formData[mapping.sourceField];
    }

    if (value === undefined || value === null || value === '') {
      if (mapping.defaultValue !== undefined) {
        value = mapping.defaultValue;
      } else if (mapping.required) {
        missingFields.push(mapping.targetField);
        continue;
      } else {
        continue;
      }
    }

    payload[mapping.targetField] = value;
  }

  return { payload, missingFields };
}

/** Apply response field mappings to fill form fields */
function applyResponseFieldMappings(
  responseData: unknown,
  dataFieldPath: string | undefined,
  mappings: Integration['responseFieldMappings'],
  onFieldChange: (name: string, value: any) => void,
): void {
  if (!mappings || mappings.length === 0) return;

  const data = dataFieldPath ? getNestedValue(responseData, dataFieldPath) : responseData;
  if (!data) return;

  for (const mapping of mappings) {
    const value = getNestedValue(data, mapping.responseField);
    if (value !== undefined) {
      try {
        onFieldChange(mapping.targetFormField, value);
      } catch (err) {
        console.error('[applyResponseFieldMappings] Failed to set field:', mapping.targetFormField, err);
      }
    }
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useIntegrationExecution({
  productId,
  formData,
  onFieldChange,
  formResponseId,
}: UseIntegrationExecutionOptions): UseIntegrationExecutionReturn {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [executionState, setExecutionState] = useState<ExecutionState>({
    isLoading: false,
    error: null,
    redirectUrl: null,
  });

  // Keep a ref to formData so callbacks always see latest values without re-creating
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Load integrations on mount
  useEffect(() => {
    if (!productId) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await getIntegrations(productId);
        if (!cancelled) {
          const enabled = (response.integrations || []).filter((i) => i.enabled);
          setIntegrations(enabled);
        }
      } catch (error) {
        console.error('[useIntegrationExecution] Failed to load integrations for product:', productId, error);
        toast({ title: 'Failed to load API integrations', variant: 'destructive' });
      }
    })();

    return () => { cancelled = true; };
  }, [productId]);

  const clearError = useCallback(() => {
    setExecutionState((prev) => ({ ...prev, error: null, redirectUrl: null }));
  }, []);

  const setError = useCallback((error: ExecutionError) => {
    setExecutionState({ isLoading: false, error, redirectUrl: null });
  }, []);

  /** Persist a blocking integration failure to the backend */
  const persistBlockingFailure = useCallback(
    async (integration: Integration, errorMsg: string, pageId?: string) => {
      if (!formResponseId || integration.executionMode !== 'blocking') return;
      try {
        await markIntegrationBlocked(formResponseId, {
          integrationId: integration.id!,
          integrationName: integration.name,
          errorMessage: errorMsg,
          blockedAtPage: pageId || integration.triggerPageId || '',
        });
      } catch (err) {
        console.error('[useIntegrationExecution] Failed to persist integration block:', err);
      }
    },
    [formResponseId],
  );

  /** Execute a single integration and handle result. Returns true on success. */
  const executeSingle = useCallback(
    async (integration: Integration, pageId?: string): Promise<boolean> => {
      if (!integration.id) {
        console.error('[useIntegrationExecution] Cannot execute integration without id:', integration.name);
        return false;
      }

      const currentFormData = formDataRef.current;

      // Build request
      const { payload, missingFields } = buildRequestPayload(
        integration.requestMapping,
        currentFormData,
      );

      if (missingFields.length > 0) {
        const errorMsg = `Please fill in: ${missingFields.join(', ')}`;
        setExecutionState({
          isLoading: false,
          error: {
            title: `Missing Required Fields — ${integration.name}`,
            message: errorMsg,
          },
          redirectUrl: null,
        });
        return false;
      }

      // Merge static query params / request body into payload
      const requestData = {
        ...payload,
        ...(integration.queryParams || {}),
        ...(integration.requestBody || {}),
      };

      let response: ExecuteIntegrationResponse;
      try {
        response = await executeIntegration(integration.id, {
          requestData,
          formResponseId,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Network error calling integration API';
        setExecutionState({
          isLoading: false,
          error: { title: `API Error — ${integration.name}`, message },
          redirectUrl: integration.responseMapping?.onFailure?.navigateToPage || null,
        });
        await persistBlockingFailure(integration, message, pageId);
        return false;
      }

      if (!response.success) {
        const errorMessage = response.error || 'The API returned an error response.';
        setExecutionState({
          isLoading: false,
          error: { title: `API Failed — ${integration.name}`, message: errorMessage },
          redirectUrl: integration.responseMapping?.onFailure?.navigateToPage || null,
        });
        await persistBlockingFailure(integration, errorMessage, pageId);
        return false;
      }

      // Success — apply response field mappings
      applyResponseFieldMappings(
        response.data,
        integration.responseMapping?.dataField,
        integration.responseFieldMappings,
        onFieldChange,
      );

      // Handle success redirect
      const successRedirect = integration.responseMapping?.onSuccess?.navigateToPage;
      if (successRedirect) {
        setExecutionState((prev) => ({ ...prev, redirectUrl: successRedirect }));
      }

      return true;
    },
    [onFieldChange, formResponseId, persistBlockingFailure],
  );

  /** Execute all page-level integrations for a given page. Returns true if all succeed. */
  const executePageIntegrations = useCallback(
    async (pageId: string): Promise<boolean> => {
      const pageIntegrations = integrations.filter(
        (i) => i.triggerLevel === 'page' && i.triggerPageId === pageId,
      );

      if (pageIntegrations.length === 0) return true;

      setExecutionState({ isLoading: true, error: null, redirectUrl: null });

      for (const integration of pageIntegrations) {
        const ok = await executeSingle(integration, pageId);
        if (!ok) return false;
      }

      setExecutionState((prev) => ({ ...prev, isLoading: false }));
      return true;
    },
    [integrations, executeSingle],
  );

  /** Execute a field-level integration. Returns true on success. */
  const executeFieldIntegration = useCallback(
    async (fieldId: string, fieldName?: string): Promise<boolean> => {
      const fieldIntegration = integrations.find(
        (i) =>
          i.triggerLevel === 'field' &&
          (i.triggerFieldId === fieldId || (fieldName && i.triggerFieldId === fieldName)),
      );

      if (!fieldIntegration) return true;

      setExecutionState({ isLoading: true, error: null, redirectUrl: null });
      const ok = await executeSingle(fieldIntegration);
      setExecutionState((prev) => ({ ...prev, isLoading: false }));
      return ok;
    },
    [integrations, executeSingle],
  );

  const getFieldIntegrations = useCallback(
    (fieldId: string, fieldName?: string): Integration[] => {
      return integrations.filter(
        (i) =>
          i.triggerLevel === 'field' &&
          (i.triggerFieldId === fieldId || (fieldName && i.triggerFieldId === fieldName)),
      );
    },
    [integrations],
  );

  const hasPageIntegrations = useCallback(
    (pageId: string): boolean => {
      return integrations.some(
        (i) => i.triggerLevel === 'page' && i.triggerPageId === pageId,
      );
    },
    [integrations],
  );

  return {
    integrations,
    executePageIntegrations,
    executeFieldIntegration,
    getFieldIntegrations,
    hasPageIntegrations,
    executionState,
    clearError,
    setError,
  };
}
