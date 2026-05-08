import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Check, ChevronsUpDown, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/shared/utils/lib-utils';
import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';
import type {
  Integration,
  AuthType,
  FieldMapping,
  ResponseFieldMapping,
  IntegrationTriggerLevel,
  ExecutionMode,
} from '@/features/product-config/integrations/api/integrations';
import { extractFieldsFromPages, type ExtractedField } from '@/features/product-config/integrations/utils/extractFieldsFromPages';
import { integrationFormSchema } from '@/features/product-config/integrations/schemas/integrationSchema';
import type { ZodError } from 'zod';

interface ApiIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  triggerLevel: IntegrationTriggerLevel;
  triggerPageId?: string;
  triggerFieldId?: string;
  pages: Page[];
  existingIntegration?: Integration | null;
  onSave: (integration: Partial<Integration>) => void;
  onDelete?: (integrationId: string) => void;
}

type SuccessHandlingMode = 'fillFields' | 'redirect';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH'] as const;

const AUTH_TYPE_OPTIONS: { value: AuthType; label: string }[] = [
  { value: 'none', label: 'No Authentication' },
  { value: 'apiKey', label: 'API Key' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'oauth2', label: 'OAuth 2.0' },
];

function getDefaultFormData(
  triggerLevel: IntegrationTriggerLevel,
  triggerPageId?: string,
  triggerFieldId?: string,
): Partial<Integration> {
  return {
    name: '',
    description: '',
    apiUrl: '',
    method: 'GET',
    credentials: { type: 'none' },
    triggerLevel,
    triggerPageId,
    triggerFieldId,
    triggerPage: 'custom',
    executionMode: 'blocking',
    requestMapping: [],
    responseMapping: {
      onSuccess: {},
      onFailure: {},
    },
    responseFieldMappings: [],
    enabled: true,
  };
}

function flattenZodErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}

function FieldCombobox({
  value,
  onChange,
  fields,
  includeCustomValue = false,
  placeholder = 'Select field...',
}: {
  value: string;
  onChange: (value: string) => void;
  fields: ExtractedField[];
  includeCustomValue?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    if (value === '__custom__') return 'Custom Value';
    const field = fields.find((f) => f.name === value);
    return field ? `${field.label} (${field.type})` : '';
  }, [value, fields]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="h-9 w-full justify-between text-sm font-normal">
          <span className="truncate">{selectedLabel || <span className="text-muted-foreground">{placeholder}</span>}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" onWheel={(e) => e.stopPropagation()}>
        <Command>
          <CommandInput placeholder="Search fields..." />
          <CommandList>
            <CommandEmpty>No field found.</CommandEmpty>
            <CommandGroup>
              {includeCustomValue && (
                <CommandItem
                  value="Custom Value"
                  onSelect={() => {
                    onChange('__custom__');
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === '__custom__' ? 'opacity-100' : 'opacity-0')} />
                  Custom Value
                </CommandItem>
              )}
              {fields.map((field) => (
                <CommandItem
                  key={field.name}
                  value={field.label}
                  onSelect={() => {
                    onChange(field.name);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === field.name ? 'opacity-100' : 'opacity-0')} />
                  {field.label} ({field.type})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ApiIntegrationDialog({
  open,
  onOpenChange,
  productId,
  triggerLevel,
  triggerPageId,
  triggerFieldId,
  pages,
  existingIntegration,
  onSave,
  onDelete,
}: ApiIntegrationDialogProps) {
  const [formData, setFormData] = useState<Partial<Integration>>(
    getDefaultFormData(triggerLevel, triggerPageId, triggerFieldId),
  );
  const [successMode, setSuccessMode] = useState<SuccessHandlingMode>('fillFields');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [redirectUrl, setRedirectUrl] = useState('');

  const availableFields: ExtractedField[] = useMemo(() => extractFieldsFromPages(pages), [pages]);

  // Initialize form when dialog opens or existing integration changes
  useEffect(() => {
    if (!open) return;

    if (existingIntegration) {
      setFormData({ ...existingIntegration });
      // Determine success mode: prioritize field mappings over redirect
      const hasFieldMappings = (existingIntegration.responseFieldMappings?.length ?? 0) > 0;
      const hasRedirect = existingIntegration.responseMapping?.onSuccess?.navigateToPage;
      setSuccessMode(hasFieldMappings ? 'fillFields' : hasRedirect ? 'redirect' : 'fillFields');
      setRedirectUrl(existingIntegration.responseMapping?.onSuccess?.navigateToPage || '');
    } else {
      setFormData(getDefaultFormData(triggerLevel, triggerPageId, triggerFieldId));
      setSuccessMode('fillFields');
      setRedirectUrl('');
    }
    setValidationErrors({});
  }, [open, existingIntegration, triggerLevel, triggerPageId, triggerFieldId]);

  const updateFormData = (updates: Partial<Integration>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const updateCredentials = (updates: Partial<Integration['credentials']>) => {
    setFormData((prev) => ({
      ...prev,
      credentials: { ...prev.credentials!, ...updates },
    }));
  };

  const updateResponseMapping = (updates: Partial<Integration['responseMapping']>) => {
    setFormData((prev) => ({
      ...prev,
      responseMapping: { ...prev.responseMapping, ...updates },
    }));
  };

  const updateSuccessAction = (updates: Partial<NonNullable<Integration['responseMapping']>['onSuccess']>) => {
    setFormData((prev) => ({
      ...prev,
      responseMapping: {
        ...prev.responseMapping,
        onSuccess: { ...prev.responseMapping?.onSuccess, ...updates },
      },
    }));
  };

  const updateFailureAction = (updates: Partial<NonNullable<Integration['responseMapping']>['onFailure']>) => {
    setFormData((prev) => ({
      ...prev,
      responseMapping: {
        ...prev.responseMapping,
        onFailure: { ...prev.responseMapping?.onFailure, ...updates },
      },
    }));
  };

  // --- Request Mapping ---
  const addRequestMapping = () => {
    const newMapping: FieldMapping = { sourceField: '', targetField: '', required: false };
    updateFormData({ requestMapping: [...(formData.requestMapping || []), newMapping] });
  };

  const updateRequestMapping = (index: number, updates: Partial<FieldMapping>) => {
    const mappings = [...(formData.requestMapping || [])];
    mappings[index] = { ...mappings[index], ...updates };
    updateFormData({ requestMapping: mappings });
  };

  const removeRequestMapping = (index: number) => {
    const mappings = (formData.requestMapping || []).filter((_, i) => i !== index);
    updateFormData({ requestMapping: mappings });
  };

  // --- Response Field Mapping ---
  const addResponseFieldMapping = () => {
    const newMapping: ResponseFieldMapping = { responseField: '', targetFormField: '' };
    updateFormData({ responseFieldMappings: [...(formData.responseFieldMappings || []), newMapping] });
  };

  const updateResponseFieldMapping = (index: number, updates: Partial<ResponseFieldMapping>) => {
    const mappings = [...(formData.responseFieldMappings || [])];
    mappings[index] = { ...mappings[index], ...updates };
    updateFormData({ responseFieldMappings: mappings });
  };

  const removeResponseFieldMapping = (index: number) => {
    const mappings = (formData.responseFieldMappings || []).filter((_, i) => i !== index);
    updateFormData({ responseFieldMappings: mappings });
  };

  // --- Save ---
  const handleSave = () => {
    const dataToValidate = {
      name: formData.name || '',
      description: formData.description || '',
      apiUrl: formData.apiUrl || '',
      method: formData.method || 'GET',
      credentials: formData.credentials || { type: 'none' as const },
      triggerLevel: formData.triggerLevel || triggerLevel,
      executionMode: formData.executionMode || 'blocking',
      requestMapping: formData.requestMapping || [],
      responseMapping: formData.responseMapping || {},
      responseFieldMappings: formData.responseFieldMappings || [],
      enabled: formData.enabled ?? true,
    };

    const result = integrationFormSchema.safeParse(dataToValidate);
    if (!result.success) {
      setValidationErrors(flattenZodErrors(result.error));
      return;
    }

    setValidationErrors({});

    // Build success action based on mode
    const responseMapping = { ...formData.responseMapping };
    if (successMode === 'redirect') {
      responseMapping.onSuccess = { ...responseMapping.onSuccess, navigateToPage: redirectUrl };
    }

    onSave({
      ...formData,
      productId,
      triggerLevel,
      triggerPageId,
      triggerFieldId,
      responseMapping,
    });
  };

  const handleDelete = () => {
    if (existingIntegration?.id && onDelete) {
      onDelete(existingIntegration.id);
    }
  };

  const hasError = (field: string) => !!validationErrors[field];
  const getError = (field: string) => validationErrors[field];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[980px] max-h-[90vh] flex flex-col"
      >
        <DialogHeader>
          <DialogTitle>
            {existingIntegration ? 'Edit' : 'Configure'} API Integration
          </DialogTitle>
          <DialogDescription>
            {triggerLevel === 'page'
              ? 'Configure an API that triggers when the user navigates to the next page.'
              : 'Configure an API that triggers via a fetch button on this field.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4 px-1">
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  placeholder="e.g. Vehicle Details Lookup"
                  className={cn(hasError('name') && 'border-destructive')}
                />
                {hasError('name') && (
                  <p className="text-xs text-destructive">{getError('name')}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>API URL *</Label>
                <Input
                  value={formData.apiUrl || ''}
                  onChange={(e) => updateFormData({ apiUrl: e.target.value })}
                  placeholder="https://api.example.com/lookup"
                  className={cn(hasError('apiUrl') && 'border-destructive')}
                />
                {hasError('apiUrl') && (
                  <p className="text-xs text-destructive">{getError('apiUrl')}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Use {'{paramName}'} for dynamic path parameters, e.g. /users/{'{userId}'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>HTTP Method</Label>
                <Select
                  value={formData.method || 'GET'}
                  onValueChange={(value) => {
                    const method = value as Integration['method'];
                    const defaultMode: ExecutionMode = (method === 'GET' || method === 'POST') ? 'blocking' : 'nonBlocking';
                    updateFormData({ method, executionMode: defaultMode });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HTTP_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Enable Integration</Label>
                <div className="flex items-center gap-3 rounded-lg border bg-background p-2.5">
                  <Switch
                    checked={formData.enabled ?? true}
                    onCheckedChange={(checked) => updateFormData({ enabled: checked })}
                  />
                  <span className="text-sm">
                    {formData.enabled !== false ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Brief description of what this API does"
                rows={2}
              />
            </div>
          </div>

          <Separator />

          {/* Section 2: Authentication */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Authentication</h3>
            <div className="space-y-2">
              <Label>Authentication Type</Label>
              <Select
                value={formData.credentials?.type || 'none'}
                onValueChange={(value: AuthType) => updateCredentials({ type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTH_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.credentials?.type === 'apiKey' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>API Key *</Label>
                  <Input
                    type="password"
                    value={formData.credentials?.apiKey || ''}
                    onChange={(e) => updateCredentials({ apiKey: e.target.value })}
                    placeholder="Enter API key"
                    className={cn(hasError('credentials.apiKey') && 'border-destructive')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Header Name</Label>
                  <Input
                    value={formData.credentials?.apiKeyHeader || 'X-API-Key'}
                    onChange={(e) => updateCredentials({ apiKeyHeader: e.target.value })}
                    placeholder="X-API-Key"
                  />
                </div>
              </div>
            )}

            {formData.credentials?.type === 'bearer' && (
              <div className="space-y-2">
                <Label>Bearer Token *</Label>
                <Input
                  type="password"
                  value={formData.credentials?.token || ''}
                  onChange={(e) => updateCredentials({ token: e.target.value })}
                  placeholder="Enter bearer token"
                  className={cn(hasError('credentials.token') && 'border-destructive')}
                />
              </div>
            )}

            {formData.credentials?.type === 'basic' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username *</Label>
                  <Input
                    value={formData.credentials?.username || ''}
                    onChange={(e) => updateCredentials({ username: e.target.value })}
                    placeholder="Enter username"
                    className={cn(hasError('credentials.username') && 'border-destructive')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    value={formData.credentials?.password || ''}
                    onChange={(e) => updateCredentials({ password: e.target.value })}
                    placeholder="Enter password"
                    className={cn(hasError('credentials.password') && 'border-destructive')}
                  />
                </div>
              </div>
            )}

            {formData.credentials?.type === 'oauth2' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Client ID *</Label>
                    <Input
                      value={formData.credentials?.clientId || ''}
                      onChange={(e) => updateCredentials({ clientId: e.target.value })}
                      placeholder="Enter client ID"
                      className={cn(hasError('credentials.clientId') && 'border-destructive')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Client Secret *</Label>
                    <Input
                      type="password"
                      value={formData.credentials?.clientSecret || ''}
                      onChange={(e) => updateCredentials({ clientSecret: e.target.value })}
                      placeholder="Enter client secret"
                      className={cn(hasError('credentials.clientSecret') && 'border-destructive')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Token URL *</Label>
                  <Input
                    value={formData.credentials?.tokenUrl || ''}
                    onChange={(e) => updateCredentials({ tokenUrl: e.target.value })}
                    placeholder="https://auth.example.com/token"
                    className={cn(hasError('credentials.tokenUrl') && 'border-destructive')}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Section 3: Execution Mode */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Execution Mode</h3>
            <div className="flex gap-4">
              <label
                className={cn(
                  'flex-1 flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors',
                  formData.executionMode === 'blocking' && 'border-primary bg-primary/5',
                )}
              >
                <input
                  type="radio"
                  name="executionMode"
                  value="blocking"
                  checked={formData.executionMode === 'blocking'}
                  onChange={() => updateFormData({ executionMode: 'blocking' })}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium">Blocking</p>
                  <p className="text-xs text-muted-foreground">User cannot proceed until the API responds.</p>
                </div>
              </label>
              <label
                className={cn(
                  'flex-1 flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors',
                  formData.executionMode === 'nonBlocking' && 'border-primary bg-primary/5',
                )}
              >
                <input
                  type="radio"
                  name="executionMode"
                  value="nonBlocking"
                  checked={formData.executionMode === 'nonBlocking'}
                  onChange={() => updateFormData({ executionMode: 'nonBlocking' })}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium">Non-blocking</p>
                  <p className="text-xs text-muted-foreground">API runs in background; user can continue.</p>
                </div>
              </label>
            </div>
          </div>

          <Separator />

          {/* Section 4: Request Mapping */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Request Mapping</h3>
              <Button type="button" variant="outline" size="sm" onClick={addRequestMapping}>
                <Plus className="mr-1 h-3 w-3" /> Add Request Mapping
              </Button>
            </div>

            {hasError('requestMapping') && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {getError('requestMapping')}
              </div>
            )}

            {(formData.requestMapping || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No request mappings configured. Click "Add Mapping" to map form fields to API request parameters.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
                  <span>API Parameter (Key)</span>
                  <span>Form Field / Custom Value</span>
                  <span>Required</span>
                  <span />
                </div>
                {(formData.requestMapping || []).map((mapping, index) => (
                  <div key={index} className="space-y-2">
                    <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
                      <Input
                        value={mapping.targetField}
                        onChange={(e) => updateRequestMapping(index, { targetField: e.target.value })}
                        placeholder="e.g. chassisNumber"
                        className="h-9 text-sm"
                      />
                      <FieldCombobox
                        value={mapping.sourceField}
                        onChange={(value) => updateRequestMapping(index, { sourceField: value })}
                        fields={availableFields}
                        includeCustomValue
                      />
                      <Switch
                        checked={mapping.required ?? false}
                        onCheckedChange={(checked) => updateRequestMapping(index, { required: checked })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeRequestMapping(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {mapping.sourceField === '__custom__' && (
                      <Input
                        value={mapping.defaultValue?.toString() ?? ''}
                        onChange={(e) => updateRequestMapping(index, { defaultValue: e.target.value })}
                        placeholder="Enter custom value"
                        className="h-9 text-sm ml-0"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Section 5: Success Handling */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Success Handling</h3>
            <div className="flex gap-4">
              <label
                className={cn(
                  'flex-1 flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors',
                  successMode === 'fillFields' && 'border-primary bg-primary/5',
                )}
              >
                <input
                  type="radio"
                  name="successMode"
                  value="fillFields"
                  checked={successMode === 'fillFields'}
                  onChange={() => setSuccessMode('fillFields')}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium">Fill form fields with response</p>
                  <p className="text-xs text-muted-foreground">Map API response data to form fields.</p>
                </div>
              </label>
              <label
                className={cn(
                  'flex-1 flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors',
                  successMode === 'redirect' && 'border-primary bg-primary/5',
                )}
              >
                <input
                  type="radio"
                  name="successMode"
                  value="redirect"
                  checked={successMode === 'redirect'}
                  onChange={() => setSuccessMode('redirect')}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium">Redirect to URL / page</p>
                  <p className="text-xs text-muted-foreground">Navigate user to another page or URL.</p>
                </div>
              </label>
            </div>

            {successMode === 'fillFields' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Response-to-field mapping</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addResponseFieldMapping}>
                    <Plus className="mr-1 h-3 w-3" /> Add Success Mapping
                  </Button>
                </div>
                {(formData.responseFieldMappings || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No response mappings. Add mappings to auto-fill form fields from API response.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
                      <span>Response Field Path</span>
                      <span>Target Form Field</span>
                      <span />
                    </div>
                    {(formData.responseFieldMappings || []).map((mapping, index) => (
                      <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                        <Input
                          value={mapping.responseField}
                          onChange={(e) => updateResponseFieldMapping(index, { responseField: e.target.value })}
                          placeholder="e.g. data.vehicleName"
                          className="h-9 text-sm"
                        />
                        <FieldCombobox
                          value={mapping.targetFormField}
                          onChange={(value) => updateResponseFieldMapping(index, { targetFormField: value })}
                          fields={availableFields}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeResponseFieldMapping(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs">Response data field path</Label>
                  <Input
                    value={formData.responseMapping?.dataField || ''}
                    onChange={(e) => updateResponseMapping({ dataField: e.target.value })}
                    placeholder="e.g. data or result.items"
                    className="h-9 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    JSON path to the data object in the response. Leave empty if root.
                  </p>
                </div>
              </div>
            )}

            {successMode === 'redirect' && (
              <div className="space-y-2">
                <Label>Redirect URL or Page</Label>
                <Input
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="https://example.com/success or page ID"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Section 6: Failure Handling */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Failure Handling</h3>
            <p className="text-sm text-muted-foreground">
              On failure, an error dialog will always be shown to the user.
            </p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Error field path in response</Label>
                <Input
                  value={formData.responseMapping?.errorField || ''}
                  onChange={(e) => updateResponseMapping({ errorField: e.target.value })}
                  placeholder="e.g. error.message or message"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Error page redirect (optional)</Label>
                <Input
                  value={formData.responseMapping?.onFailure?.navigateToPage || ''}
                  onChange={(e) => updateFailureAction({ navigateToPage: e.target.value })}
                  placeholder="Page ID or URL to redirect on failure"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {Object.keys(validationErrors).length > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div className="text-sm text-destructive">
              <p className="font-medium">Please fix the following errors:</p>
              <ul className="mt-1 list-disc pl-4 space-y-0.5">
                {Object.entries(validationErrors).map(([field, message]) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <div>
            {existingIntegration?.id && onDelete && (
              <Button type="button" variant="outline" className="text-destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Integration
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              {existingIntegration ? 'Update' : 'Save'} Integration
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
