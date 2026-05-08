import { z } from 'zod';

const fieldMappingSchema = z.object({
  sourceField: z.string().min(1, 'Source field is required'),
  targetField: z.string().min(1, 'Target field is required'),
  defaultValue: z.union([z.string(), z.number()]).optional(),
  required: z.boolean().optional(),
});

const responseFieldMappingSchema = z.object({
  responseField: z.string().min(1, 'Response field path is required'),
  targetFormField: z.string().min(1, 'Target form field is required'),
});

const credentialsSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('none') }),
  z.object({
    type: z.literal('apiKey'),
    apiKey: z.string().min(1, 'API key is required'),
    apiKeyHeader: z.string().min(1, 'Header name is required'),
  }),
  z.object({
    type: z.literal('bearer'),
    token: z.string().min(1, 'Bearer token is required'),
  }),
  z.object({
    type: z.literal('basic'),
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
  }),
  z.object({
    type: z.literal('oauth2'),
    clientId: z.string().min(1, 'Client ID is required'),
    clientSecret: z.string().min(1, 'Client secret is required'),
    tokenUrl: z.string().url('Token URL must be a valid URL'),
  }),
]);

const successActionSchema = z.object({
  forwardToPage: z.string().optional(),
  showInPage: z.string().optional(),
  navigateToPage: z.string().optional(),
  customAction: z.object({
    apiUrl: z.string().url().optional(),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH']).optional(),
  }).optional(),
});

const failureActionSchema = z.object({
  blockNavigation: z.boolean().optional(),
  navigateToPage: z.string().optional(),
  showError: z.boolean().optional(),
  customAction: z.object({
    apiUrl: z.string().url().optional(),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH']).optional(),
  }).optional(),
});

const responseMappingSchema = z.object({
  successField: z.string().optional(),
  successValue: z.union([z.string(), z.boolean()]).optional(),
  dataField: z.string().optional(),
  errorField: z.string().optional(),
  onSuccess: successActionSchema.optional(),
  onFailure: failureActionSchema.optional(),
});

export const integrationFormSchema = z.object({
  name: z.string().min(1, 'Integration name is required').max(100, 'Name must be under 100 characters'),
  description: z.string().max(500, 'Description must be under 500 characters').optional().or(z.literal('')),
  apiUrl: z.string().url('API URL must be a valid URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH']),
  credentials: credentialsSchema,
  triggerLevel: z.enum(['page', 'field']),
  executionMode: z.enum(['blocking', 'nonBlocking']),
  requestMapping: z.array(fieldMappingSchema),
  responseMapping: responseMappingSchema,
  responseFieldMappings: z.array(responseFieldMappingSchema).optional(),
  enabled: z.boolean(),
}).refine(
  (data) => {
    // POST/PUT/PATCH should have at least one request mapping
    if (['POST', 'PUT', 'PATCH'].includes(data.method)) {
      return data.requestMapping.length > 0;
    }
    return true;
  },
  {
    message: 'At least one request mapping is required for POST/PUT/PATCH methods',
    path: ['requestMapping'],
  },
);

export type IntegrationFormData = z.infer<typeof integrationFormSchema>;
