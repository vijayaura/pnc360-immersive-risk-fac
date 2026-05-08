/**
 * Mock API Service for Storing Proposal Forms (Demo Mode)
 * Uses localStorage for persistence
 */

const PROPOSALS_STORAGE_KEY = 'demo_proposals';
const REQUEST_ID_COUNTER_KEY = 'demo_request_id_counter';

export interface SavedProposal {
  id: string;
  requestId: string;
  productCode: string;
  productName: string;
  formData: Record<string, any>;
  progress: {
    currentPageIndex: number;
    totalPages: number;
    completedPages: number[];
    lastSaved: string;
  };
  metadata: {
    createdBy: string;
    createdByType: "broker" | "insurer";
    distributorId?: string;
    distributorName?: string;
    createdAt?: string;
    updatedAt?: string;
    premium?: number;
    ratePerMil?: number;
  };
  status: "draft" | "submitted" | "quoted";
}

function generateRequestId(): string {
  const counter = parseInt(localStorage.getItem(REQUEST_ID_COUNTER_KEY) || '1000', 10);
  const newCounter = counter + 1;
  localStorage.setItem(REQUEST_ID_COUNTER_KEY, newCounter.toString());
  return `REQ-${newCounter.toString().padStart(6, '0')}`;
}

function getAllProposals(): SavedProposal[] {
  try {
    const stored = localStorage.getItem(PROPOSALS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading proposals from storage:', error);
    return [];
  }
}

function saveAllProposals(proposals: SavedProposal[]): void {
  try {
    localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(proposals));
  } catch (error) {
    console.error('Error saving proposals to storage:', error);
    throw new Error('Failed to save proposal');
  }
}

/**
 * Save or update a proposal form
 */
export async function saveProposal(
  proposal: Partial<SavedProposal> & { formData: Record<string, any>; productCode: string; productName: string }
): Promise<SavedProposal> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const proposals = getAllProposals();
  const now = new Date().toISOString();
  
  let savedProposal: SavedProposal;
  
  if (proposal.id) {
    // Update existing
    const index = proposals.findIndex(p => p.id === proposal.id);
    if (index === -1) {
      throw new Error('Proposal not found');
    }
    
    savedProposal = {
      ...proposals[index],
      ...proposal,
      formData: proposal.formData,
      progress: {
        ...proposals[index].progress,
        ...proposal.progress,
        lastSaved: now,
      },
      metadata: {
        ...proposals[index].metadata,
        updatedAt: now,
      },
    } as SavedProposal;
    
    proposals[index] = savedProposal;
  } else {
    // Create new
    const requestId = generateRequestId();
    savedProposal = {
      id: `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestId,
      productCode: proposal.productCode,
      productName: proposal.productName,
      formData: proposal.formData,
      progress: proposal.progress || {
        currentPageIndex: 0,
        totalPages: 0,
        completedPages: [],
        lastSaved: now,
      },
      metadata: {
        createdBy: proposal.metadata?.createdBy || 'User',
        createdByType: proposal.metadata?.createdByType || 'broker',
        distributorId: proposal.metadata?.distributorId,
        distributorName: proposal.metadata?.distributorName,
        createdAt: now,
        updatedAt: now,
      },
      status: proposal.status || 'draft',
    };
    
    proposals.push(savedProposal);
  }
  
  saveAllProposals(proposals);
  return savedProposal;
}

/**
 * Get all proposals for a user/portal
 */
export async function getProposals(
  createdByType?: 'broker' | 'insurer',
  createdBy?: string
): Promise<SavedProposal[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const proposals = getAllProposals();
  
  if (createdByType) {
    return proposals.filter(p => p.metadata.createdByType === createdByType);
  }
  
  if (createdBy) {
    return proposals.filter(p => p.metadata.createdBy === createdBy);
  }
  
  return proposals;
}

/**
 * Get a single proposal by ID
 */
export async function getProposal(id: string): Promise<SavedProposal> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const proposals = getAllProposals();
  const proposal = proposals.find(p => p.id === id);
  
  if (!proposal) {
    const error: any = new Error('Proposal not found');
    error.status = 404;
    throw error;
  }
  
  return proposal;
}

/**
 * Delete a proposal
 */
export async function deleteProposal(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const proposals = getAllProposals();
  const filtered = proposals.filter(p => p.id !== id);
  saveAllProposals(filtered);
}

/**
 * Clear all proposals (for testing)
 */
export function clearAllProposals(): void {
  localStorage.removeItem(PROPOSALS_STORAGE_KEY);
  localStorage.removeItem(REQUEST_ID_COUNTER_KEY);
}

