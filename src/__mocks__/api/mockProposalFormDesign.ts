/**
 * Mock API Service for Proposal Form Designs
 * Uses localStorage for persistence (can be upgraded to real API later)
 */

import type { ProposalFormDesign, Page, ProposalFormVersion, ProposalFormTemplate, ValidateFormDesignRequest, ValidateFormDesignResponse } from './proposalFormDesign';

const STORAGE_KEY = 'proposal_form_designs';
const VERSIONS_STORAGE_KEY = 'proposal_form_design_versions';
const TEMPLATES_STORAGE_KEY = 'proposal_form_design_templates';

// Helper to get all designs from storage
function getAllDesigns(): Record<string, ProposalFormDesign> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error reading designs from storage:', error);
    return {};
  }
}

// Helper to save all designs to storage
function saveAllDesigns(designs: Record<string, ProposalFormDesign>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
  } catch (error) {
    console.error('Error saving designs to storage:', error);
    throw new Error('Failed to save proposal form design');
  }
}

// Helper to generate ID
function generateId(): string {
  return `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get proposal form design for a product
 */
export async function getProposalFormDesign(productId: string): Promise<ProposalFormDesign> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const designs = getAllDesigns();
  const design = designs[productId];
  
  if (!design) {
    const error: any = new Error('Proposal form design not found');
    error.status = 404;
    throw error;
  }
  
  return { ...design };
}

/**
 * Save proposal form design (creates new or updates existing)
 */
export async function saveProposalFormDesign(
  productId: string,
  design: { pages: Page[] }
): Promise<ProposalFormDesign> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const designs = getAllDesigns();
  const existing = designs[productId];
  
  const now = new Date().toISOString();
  const proposalDesign: ProposalFormDesign = {
    id: existing?.id || generateId(),
    productId,
    pages: design.pages,
    version: existing?.version || '1.0',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    createdBy: existing?.createdBy || 'Admin User',
  };
  
  designs[productId] = proposalDesign;
  saveAllDesigns(designs);
  
  return { ...proposalDesign };
}

/**
 * Update proposal form design
 */
export async function updateProposalFormDesign(
  productId: string,
  design: { pages: Page[] }
): Promise<ProposalFormDesign> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const designs = getAllDesigns();
  const existing = designs[productId];
  
  if (!existing) {
    const error: any = new Error('Proposal form design not found');
    error.status = 404;
    throw error;
  }
  
  const updated: ProposalFormDesign = {
    ...existing,
    pages: design.pages,
    updatedAt: new Date().toISOString(),
  };
  
  designs[productId] = updated;
  saveAllDesigns(designs);
  
  return { ...updated };
}

/**
 * Get proposal form design versions
 */
export async function getProposalFormDesignVersions(productId: string): Promise<ProposalFormVersion[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  try {
    const stored = localStorage.getItem(VERSIONS_STORAGE_KEY);
    const allVersions: Record<string, ProposalFormVersion[]> = stored ? JSON.parse(stored) : {};
    return allVersions[productId] || [];
  } catch (error) {
    console.error('Error reading versions from storage:', error);
    return [];
  }
}

/**
 * Save proposal form template
 */
export async function saveProposalFormTemplate(
  productId: string,
  template: { name: string; productCategory?: string; pages: Page[] }
): Promise<ProposalFormTemplate> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    const allTemplates: ProposalFormTemplate[] = stored ? JSON.parse(stored) : [];
    
    const newTemplate: ProposalFormTemplate = {
      id: generateId(),
      name: template.name,
      productCategory: template.productCategory,
      pages: template.pages,
      createdAt: new Date().toISOString(),
      createdBy: 'Admin User',
    };
    
    allTemplates.push(newTemplate);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(allTemplates));
    
    return { ...newTemplate };
  } catch (error) {
    console.error('Error saving template:', error);
    throw new Error('Failed to save template');
  }
}

/**
 * List templates
 */
export async function getProposalFormTemplates(productId: string): Promise<ProposalFormTemplate[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    const allTemplates: ProposalFormTemplate[] = stored ? JSON.parse(stored) : [];
    // Filter by product category if needed, or return all
    return allTemplates;
  } catch (error) {
    console.error('Error reading templates from storage:', error);
    return [];
  }
}

/**
 * Validate form design
 */
export async function validateProposalFormDesign(
  productId: string,
  design: ValidateFormDesignRequest
): Promise<ValidateFormDesignResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic validation
  if (!design.pages || design.pages.length === 0) {
    errors.push('At least one page is required');
  }
  
  // Validate each page
  design.pages.forEach((page, pageIndex) => {
    if (!page.id) {
      errors.push(`Page ${pageIndex + 1} is missing an ID`);
    }
    if (!page.title) {
      warnings.push(`Page ${pageIndex + 1} is missing a title`);
    }
    
    // Validate sections
    if (page.sections) {
      page.sections.forEach((section, sectionIndex) => {
        if (!section.id) {
          errors.push(`Page ${pageIndex + 1}, Section ${sectionIndex + 1} is missing an ID`);
        }
        
        // Validate fields
        if (section.fields) {
          section.fields.forEach((field, fieldIndex) => {
            if (!field.id) {
              errors.push(`Page ${pageIndex + 1}, Section ${sectionIndex + 1}, Field ${fieldIndex + 1} is missing an ID`);
            }
            if (!field.name) {
              errors.push(`Page ${pageIndex + 1}, Section ${sectionIndex + 1}, Field ${fieldIndex + 1} is missing a name`);
            }
            if (!field.type) {
              errors.push(`Page ${pageIndex + 1}, Section ${sectionIndex + 1}, Field ${fieldIndex + 1} is missing a type`);
            }
          });
        }
      });
    }
  });
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Delete proposal form design
 */
export async function deleteProposalFormDesign(productId: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const designs = getAllDesigns();
  if (!designs[productId]) {
    const error: any = new Error('Proposal form design not found');
    error.status = 404;
    throw error;
  }
  
  delete designs[productId];
  saveAllDesigns(designs);
}

/**
 * Get all designs (for debugging/admin purposes)
 */
export function getAllProposalFormDesigns(): Record<string, ProposalFormDesign> {
  return getAllDesigns();
}

/**
 * Clear all designs (for testing/reset purposes)
 */
export function clearAllProposalFormDesigns(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(VERSIONS_STORAGE_KEY);
  localStorage.removeItem(TEMPLATES_STORAGE_KEY);
}

