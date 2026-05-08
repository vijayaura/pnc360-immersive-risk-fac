import { apiGet, apiPatch } from '@/lib/api/client';

export interface WorkflowComponent {
  id: string;
  key: string;
  name: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedById?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface WorkflowStep {
  id: string;
  component: WorkflowComponent;
  stepOrder: number;
  title: string;
  config: Record<string, any>;
  isOptional: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ProductWorkflowResponse {
  id: string;
  name: string;
  status: string;
  productId: string;
  steps: WorkflowStep[];
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedById?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export async function getProductWorkflow(productId: string): Promise<ProductWorkflowResponse> {
  return apiGet<ProductWorkflowResponse>(`/workflow/product/${encodeURIComponent(productId)}`);
}

export async function updateWorkflow(
  workflowId: string,
  body: { steps: Array<{ componentKey: string; title: string }> },
): Promise<{ success?: boolean }> {
  return apiPatch<{ success?: boolean }>(`/workflow/${encodeURIComponent(workflowId)}`, body);
}
